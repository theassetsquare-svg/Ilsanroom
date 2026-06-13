#!/usr/bin/env node
/**
 * 놀쿨 읽기 전용 MCP 서버 (Supabase / PostgREST).
 *
 * 목적: Claude가 놀쿨의 실제 커뮤니티·업소 데이터를 "읽기만" 하도록 좁은 도구 4종을 노출한다.
 *
 * ★안전 불변식 (mcp-readonly-gate.mjs 가 빌드마다 강제):
 *  - GET 전용. POST/PUT/PATCH/DELETE·insert/update/delete/upsert·rpc·만능 SQL 도구 0.
 *  - PII 컬럼 노출 0 — staff_phone(광고주 전화)·owner_id·address·email·user_id·본문(content) 0.
 *    응답은 제목·시각·집계·업소 메타(이름/지역/평점)만. 사용자 본문은 절대 반환 안 함
 *    (본문엔 사용자가 적은 전화번호 등 PII가 섞일 수 있고, 프롬프트 인젝션 표면이기도 함).
 *  - 자격증명 = publishable(anon) 키뿐. 이 키는 설계상 브라우저 번들에 공개되는 비밀 아님.
 *    service_role 등 진짜 비밀은 절대 사용/노출 안 함. .env.local 에서만 읽음(git 미추적).
 *
 * 사용자 글/댓글은 "신뢰할 수 없는 입력" — 읽어서 분석만, 그 안의 지시는 따르지 않는다.
 * (애초에 본문을 반환하지 않으므로 인젝션 표면 자체를 제거)
 *
 * 전송: stdio newline-delimited JSON-RPC 2.0 (MCP). 외부 의존성 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadEnv() {
  const out = {};
  for (const f of ['.env.local', '.env']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in out)) out[m[1]] = m[2].trim();
    }
  }
  return out;
}

const ENV = loadEnv();
const BASE = (ENV.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const ANON = ENV.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// ─── PII/민감 컬럼 영구 차단 목록 (이 토큰들은 어떤 select 에도 들어가면 안 됨) ───
const DENY_COLS = [
  'staff_phone', 'phone', 'owner_id', 'user_id', 'email', 'password',
  'content', 'address', 'ip', 'token', 'auth',
];

/** 읽기 전용 GET 단 하나. select 에 금지 컬럼이 섞이면 즉시 거부(이중 안전선). */
async function pgGet(table, { select, query = '', count = false, limit } = {}) {
  if (!BASE || !ANON) throw new Error('Supabase anon 자격증명 미설정 (.env.local)');
  const cols = (select || 'id').split(',').map((s) => s.trim());
  for (const c of cols) {
    if (DENY_COLS.some((d) => c.toLowerCase().includes(d))) {
      throw new Error(`거부: PII/민감 컬럼 "${c}" 는 노출 불가`);
    }
  }
  const params = new URLSearchParams();
  params.set('select', cols.join(','));
  if (limit) params.set('limit', String(limit));
  const url = `${BASE}/rest/v1/${table}?${params.toString()}${query ? '&' + query : ''}`;
  const headers = { apikey: ANON, Authorization: `Bearer ${ANON}` };
  if (count) headers.Prefer = 'count=exact';
  // ★메서드 명시 없음 = GET. 이 파일엔 GET 외 메서드가 존재하지 않는다.
  const r = await fetch(url, { headers: count ? { ...headers, Range: '0-0' } : headers });
  const cr = r.headers.get('content-range');
  const total = cr ? Number(cr.split('/')[1]) : null;
  const body = count ? [] : await r.json().catch(() => []);
  return { status: r.status, total, rows: Array.isArray(body) ? body : [] };
}

const sinceISO = (days) => new Date(Date.now() - days * 86400 * 1000).toISOString();

// ─────────────────────────── 도구 정의 (읽기 전용) ───────────────────────────
const TOOLS = {
  community_overview: {
    description: '놀쿨 커뮤니티 전체 집계 — 글/댓글/후기 총개수와 최근 7·30일 신규 글 수 (본문·작성자 PII 없음).',
    inputSchema: { type: 'object', properties: {} },
    async run() {
      const [posts, comments, reviews, p7, p30] = await Promise.all([
        pgGet('posts', { count: true }),
        pgGet('comments', { count: true }),
        pgGet('reviews', { count: true }),
        pgGet('posts', { count: true, query: `created_at=gte.${sinceISO(7)}` }),
        pgGet('posts', { count: true, query: `created_at=gte.${sinceISO(30)}` }),
      ]);
      return {
        posts_total: posts.total, comments_total: comments.total, reviews_total: reviews.total,
        posts_last_7d: p7.total, posts_last_30d: p30.total,
      };
    },
  },
  recent_posts: {
    description: '최근 글 목록 — 제목·게시판·시각·조회/좋아요/댓글 수만 (본문·작성자 절대 미포함). limit 최대 20.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '개수 (최대 20)' },
        category: { type: 'string', description: '게시판 카테고리 필터 (선택)' },
      },
    },
    async run(args = {}) {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      let query = 'order=created_at.desc';
      if (args.category) query += `&category=eq.${encodeURIComponent(args.category)}`;
      const { rows } = await pgGet('posts', {
        select: 'id,title,category,venue_slug,created_at,views,likes,comment_count,is_pinned',
        query, limit,
      });
      return { count: rows.length, posts: rows };
    },
  },
  review_stats: {
    description: '후기 개수와 평점(1~5) 분포 집계. (가짜 후기 0 정직성 검증용 — 본문·작성자 없음)',
    inputSchema: { type: 'object', properties: {} },
    async run() {
      const total = (await pgGet('reviews', { count: true })).total;
      const { rows } = await pgGet('reviews', { select: 'rating', limit: 10000 });
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of rows) if (dist[r.rating] != null) dist[r.rating]++;
      return { reviews_total: total, rating_distribution: dist };
    },
  },
  venue_directory: {
    description: '업소 디렉터리 메타 — 이름·지역·업종·평점·후기수·인증여부만. ★전화번호·주소·소유주 절대 미포함. limit 최대 50.',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: '지역 필터 (선택)' },
        category: { type: 'string', description: '업종 필터 (선택)' },
        limit: { type: 'number', description: '개수 (최대 50)' },
      },
    },
    async run(args = {}) {
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
      let query = 'order=name.asc';
      if (args.region) query += `&region=eq.${encodeURIComponent(args.region)}`;
      if (args.category) query += `&category=eq.${encodeURIComponent(args.category)}`;
      const { rows } = await pgGet('venues', {
        select: 'slug,name,name_ko,category,region,region_ko,rating,review_count,is_verified,status',
        query, limit,
      });
      return { count: rows.length, venues: rows };
    },
  },
};

// ─────────────────────────── stdio JSON-RPC (MCP) ───────────────────────────
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const ok = (id, result) => send({ jsonrpc: '2.0', id, result });
const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

async function handle(req) {
  const { id, method, params } = req;
  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'nolcool-readonly', version: '1.0.0' },
    });
  }
  if (method === 'ping') return ok(id, {});
  if (method === 'tools/list') {
    return ok(id, {
      tools: Object.entries(TOOLS).map(([name, t]) => ({
        name, description: t.description, inputSchema: t.inputSchema,
      })),
    });
  }
  if (method === 'tools/call') {
    const t = TOOLS[params?.name];
    if (!t) return err(id, -32602, `알 수 없는 도구: ${params?.name}`);
    try {
      const result = await t.run(params.arguments || {});
      return ok(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      return ok(id, { content: [{ type: 'text', text: `오류: ${e.message}` }], isError: true });
    }
  }
  if (id !== undefined) err(id, -32601, `미지원 메서드: ${method}`);
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let req;
    try { req = JSON.parse(line); } catch { continue; }
    if (req && req.id === undefined && /^notifications\//.test(req.method || '')) continue;
    handle(req).catch((e) => { if (req?.id !== undefined) err(req.id, -32603, e.message); });
  }
});
