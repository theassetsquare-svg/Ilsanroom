#!/usr/bin/env node
/**
 * 커뮤니티 시드 콘텐츠 품질 검문소 — "발행 전 게이트".
 *
 * auto-content-v2 는 seed_post_pool 에서 글을 꺼내 라이브 커뮤니티로 발행한다.
 * 그 풀에 양산/템플릿/AI냄새/금지어 글이 섞이면 구글 scaled-content 페널티 → 사이트 죽음.
 * 본 검문소는 supabase/migrations 의 seed_post_pool INSERT 를 전수 검사:
 *
 *   🚫 금지어(가격/2차/무료체험/가족모임 등)   → 즉시 FAIL (exit 1)
 *   🎣 후킹 5축 미달(끝까지 안 읽히는 글)        → 리포트(목표 미달시 메일)
 *   ♻️ n-gram 중복(3~5어절 골격 재탕 = 양산 지문) → 리포트(임계 초과시 메일)
 *
 * 단어 사전 0 — hook-detector.mjs(시즌78 5축) 공용 모듈만 사용.
 * 읽기 전용(마이그레이션 파일 파싱만). 사이트 변경·DB 접근 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { analyzeHook, ngramOverused } from './lib/hook-detector.mjs';

const MIG_DIR = 'supabase/migrations';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// 목표: 후킹 통과율 ≥ 92% (끝까지 읽히는 구조), n-gram 골격 재탕 임계 = 사이트 전체 8회 초과
const HOOK_PASS_TARGET = 0.92;
const NGRAM_OVER = 8;

// 절대 금지어 — 위반 1건이라도 = 라이브 사고. 하드 FAIL.
const BANNED = [
  { re: /만원|입장료|가성비|시세|가격대/, label: '가격노출' },
  { re: /2\s*차|무료\s*체험|가족\s*모임|상견례|부모님\s*생신|돌잔치/, label: '금지단어' },
];

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

/** seed_post_pool INSERT ... VALUES (...) 에서 (category, title, content) 추출. */
function parsePool() {
  const rows = [];
  for (const f of fs.readdirSync(MIG_DIR).filter((n) => n.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(MIG_DIR, f), 'utf8');
    // INSERT INTO seed_post_pool (...) VALUES <tuples>;  — 여러 블록 가능
    const re = /INSERT\s+INTO\s+seed_post_pool[^;]*?VALUES\s*([\s\S]*?);/gi;
    let m;
    while ((m = re.exec(sql))) {
      // 각 ('a','b','c') 튜플 — 따옴표 안 콤마/이스케이프('') 고려
      const tupleRe = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;
      let t;
      while ((t = tupleRe.exec(m[1]))) {
        rows.push({
          file: f,
          category: t[1].replace(/''/g, "'"),
          title: t[2].replace(/''/g, "'"),
          content: t[3].replace(/''/g, "'"),
        });
      }
    }
  }
  return rows;
}

/**
 * 라이브 seed_post_pool 을 읽기 전용 SELECT 로 가져온다 — *실제로 발행될* 풀을 그대로 검사.
 * 마이그레이션 소스 파싱(parsePool)은 이미 실행된 정정(DELETE) 마이그레이션을 반영 못해
 * 과거 튜플을 영원히 잡는다 → 라이브 풀을 직접 보는 게 진실. 100% GET(쓰기 0, 사이트 부하 0).
 */
async function fetchPoolFromDb() {
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/seed_post_pool?select=category,title,content`,
      { headers: { ...headers, Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' } },
    );
    if (!res.ok) throw new Error(`seed_post_pool SELECT ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    for (const r of batch) rows.push({ file: 'live:seed_post_pool', category: r.category || '', title: r.title || '', content: r.content || '' });
    if (batch.length < PAGE) break;
  }
  return rows;
}

async function loadRows() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const rows = await fetchPoolFromDb();
      console.log(`🔌 라이브 seed_post_pool 읽기전용 검사 — ${rows.length}개`);
      return rows;
    } catch (e) {
      console.log(`⚠️ 라이브 풀 읽기 실패(${e.message}) — 마이그레이션 소스 파싱으로 폴백`);
    }
  }
  return parsePool();
}

async function main() {
  const rows = await loadRows();
  if (!rows.length) { console.log('ℹ️ seed_post_pool 비어있음 — 검사 대상 0, skip'); return; }
  console.log(`🛡️ 시드 풀 검문 — ${rows.length}개 글 전수 검사`);

  // 🚫 금지어 — 하드 FAIL
  const banned = [];
  for (const r of rows) {
    const text = `${r.title} ${r.content}`;
    for (const b of BANNED) if (b.re.test(text)) banned.push({ ...r, why: b.label });
  }

  // 🎣 후킹 5축
  const hookFails = rows.filter((r) => !analyzeHook(`${r.title} ${r.content}`).passed);
  const hookPassRate = (rows.length - hookFails.length) / rows.length;

  // ♻️ n-gram 골격 재탕 (제목+본문 합쳐 표현 단위 분포)
  const overused = ngramOverused(rows.map((r) => `${r.title} ${r.content}`), null, NGRAM_OVER);

  console.log(`🚫 금지어 ${banned.length} · 🎣 후킹통과 ${(hookPassRate * 100).toFixed(1)}% (실패 ${hookFails.length}) · ♻️ 재탕표현 ${overused.length}`);

  const issues = [];
  if (banned.length) issues.push(`🚫 금지어 ${banned.length}건 (하드 위반)`);
  if (hookPassRate < HOOK_PASS_TARGET) issues.push(`🎣 후킹 통과율 ${(hookPassRate * 100).toFixed(1)}% < 목표 ${(HOOK_PASS_TARGET * 100).toFixed(0)}%`);
  if (overused.length) issues.push(`♻️ ${NGRAM_OVER}회 초과 재탕 표현 ${overused.length}종 (양산 지문 위험)`);

  // 후킹·재탕은 워크플로 로그에 항상 리포트(눈에 보이게). 단, 메일은 안 보냄 —
  // 둘 다 기존 풀의 고정 특성이라 매주 같은 경고를 보내면 인박스 노이즈(메일=실패시만 정책).
  if (issues.length) {
    console.log('\n⚠️ 검문 리포트:\n  - ' + issues.join('\n  - '));
    if (overused.length) console.log('  재탕 샘플:', overused.slice(0, 6).map((o) => `"${o.phrase}"×${o.count}`).join(' / '));
  } else {
    console.log('✅ 시드 풀 검문 통과 — 금지어 0 · 후킹 충분 · 양산 지문 없음');
  }

  // 메일·하드FAIL은 라이브 위험인 금지어에만 — 금지어 글은 발행되면 즉시 사고.
  if (!banned.length) return;
  console.log('  금지어 샘플:', banned.slice(0, 5).map((b) => `[${b.why}] ${b.title}`).join(' / '));
  sendMail({ total: rows.length, banned, hookFails, hookPassRate, overused, issues })
    .finally(() => process.exit(1));
}

async function sendMail({ total, banned, hookFails, hookPassRate, overused, issues }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const list = (title, items) => items.length
    ? `<h3 style="margin:18px 0 6px">${title}</h3><ul style="font-size:13px;color:#374151">${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : '';
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#DC2626">[놀쿨] 커뮤니티 시드 품질 검문 — 손볼 곳</h2>
    <p style="color:#666;font-size:13px">${kst()} · 풀 ${total}개 검사 · 읽기 전용(사이트 변경 0)</p>
    <p style="font-size:13px;background:#FEF2F2;padding:10px;border-radius:8px">${issues.join('<br>')}</p>
    ${list('🚫 금지어 (즉시 교체)', banned.slice(0, 20).map((b) => `[${b.why}] ${b.title} <span style="color:#9CA3AF">(${b.file})</span>`))}
    ${list('🎣 후킹 5축 미달 (끝까지 안 읽히는 글)', hookFails.slice(0, 20).map((h) => `${h.title} <span style="color:#9CA3AF">(${h.file})</span>`))}
    ${list('♻️ 양산 지문 — 재탕 표현 (골격 다양화 필요)', overused.slice(0, 20).map((o) => `"${o.phrase}" — ${o.count}회`))}
    <p style="color:#9CA3AF;font-size:11px;margin-top:22px">seed-content-quality-gate.mjs · 신규 시드 풀 글은 이 검문 통과분만 발행 권장. 금지어=하드 FAIL.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][🛡️] 시드 품질 검문 ${banned.length ? 'FAIL' : '경고'} (${kst()})`,
      html,
    }),
  }).catch(() => null);
  console.log('검문 메일 HTTP', r ? r.status : '실패');
}

main().catch((e) => { console.error(e); process.exit(1); });
