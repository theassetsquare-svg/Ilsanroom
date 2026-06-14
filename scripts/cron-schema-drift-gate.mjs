#!/usr/bin/env node
/**
 * 빌드 게이트 — cron(서버) 함수가 참조하는 모든 테이블·컬럼이 실제 마이그레이션 스키마에 존재함을 강제한다.
 *
 * 배경(재발 방지): functions/api/cron/* 가 유령 테이블(community_posts/clips)·없는 컬럼
 *   (user_profiles.email/created_at, *.nickname) 을 조회했다. PostgREST 는 400/404 를 주고,
 *   코드는 `res.ok ? json : []` 로 빈 결과로 흡수 → 알림(🚨신고 포함)이 한 번도 안 울렸다.
 *   스키마 드리프트는 런타임에 조용히 죽으므로 빌드타임에 차단한다.
 *
 * 동작:
 *   1) supabase/migrations/*.sql 전체를 파싱 → 테이블별 컬럼 집합(여러 CREATE/ALTER 를 union).
 *   2) functions/api/cron/*.ts 의 PostgREST 참조를 스캔:
 *        - /rest/v1/<table>?<qs>  →  table + select/order/filter 컬럼
 *        - countSince(env, '<table>', since[, '<dateCol>'])  →  table + dateCol(기본 created_at)
 *      (${...} 보간은 값으로 보고 무시. select=* 은 컬럼검사 생략.)
 *   3) 참조 테이블/컬럼이 스키마에 없으면 빌드 중단(exit 1), 상세 출력.
 *
 * 양방향 self-test 내장: 합성 스키마에 정상 cron=0위반 + 4종 드리프트(유령테이블·없는select·없는order·
 *   없는 dateCol) 주입 → 전부 적발. 하나라도 어긋나면 게이트 자체 실패.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = path.join(ROOT, 'supabase', 'migrations');
const CRON_DIR = path.join(ROOT, 'functions', 'api', 'cron');

// PostgREST 쿼리에서 컬럼이 아닌 예약 키 / 논리 연산자
const RESERVED_QS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'and', 'or', 'not']);
// CREATE TABLE 컬럼 정의 줄의 선두가 이 키워드면 컬럼이 아니라 제약조건
const CONSTRAINT_KW = new Set(['primary', 'foreign', 'unique', 'check', 'constraint', 'exclude', 'like']);

/** `(` 와 매칭되는 `)` 까지의 본문을 반환(중첩 괄호 처리). startIdx = 여는 괄호 위치. */
function balancedParen(src, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) return src.slice(startIdx + 1, i); }
  }
  return '';
}

/** 깊이 0 의 콤마로 분할(괄호 안 콤마는 무시). */
function splitTopLevel(body) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** 마이그레이션 SQL 전체 → { table: Set<column> } (union). */
function buildSchema() {
  const schema = {};
  const add = (t, c) => {
    const tab = t.toLowerCase();
    (schema[tab] ||= new Set()).add(c.toLowerCase());
  };
  const files = fs.existsSync(MIG_DIR)
    ? fs.readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql'))
    : [];
  for (const f of files) {
    // SQL 주석 제거 — 인라인 `-- ...` 가 컬럼 정의에 붙어 파싱이 깨지는 것 방지
    const sql = fs.readFileSync(path.join(MIG_DIR, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--[^\n]*/g, '');

    // CREATE TABLE [IF NOT EXISTS] [public.]<name> ( ... )
    const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?(\w+)"?\s*\(/gi;
    let m;
    while ((m = re.exec(sql))) {
      const table = m[1];
      const body = balancedParen(sql, sql.indexOf('(', m.index + m[0].length - 1));
      for (const frag of splitTopLevel(body)) {
        const t = frag.trim();
        if (!t) continue;
        const first = (t.match(/^"?(\w+)"?/) || [])[1];
        if (!first) continue;
        if (CONSTRAINT_KW.has(first.toLowerCase())) continue;
        add(table, first);
      }
    }

    // ALTER TABLE [public.]<name> ADD COLUMN [IF NOT EXISTS] <col>
    const alt = /ALTER\s+TABLE\s+(?:public\.)?"?(\w+)"?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
    while ((m = alt.exec(sql))) add(m[1], m[2]);
  }
  return schema;
}

// PostgREST 신호 — 따옴표 시작 `table?...` 가 진짜 쿼리인지 판별(일반 문자열 오탐 방지)
const PGREST_SIGNAL = /(?:^|&)(?:select=|order=|limit=|offset=|\w+=(?:eq|neq|gt|gte|lt|lte|in|is|like|ilike|cs|cd|not)\.)/;

/** TS 주석 제거 — 문서 주석의 URL/예시가 오탐되지 않게. `://` 는 라인주석으로 오인 안 함. */
function stripTsComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** cron 소스 1개 → 참조 배열 [{ table, column|null, kind }]. */
function refsOf(rawSrc) {
  const src = stripTsComments(rawSrc);
  const refs = [];

  // 참조 형태 2가지 → (table, qs) 후보로 정규화:
  //   A) /rest/v1/<table>?<qs>          (전체 경로 리터럴: daily-stats/popularity/weekly/cleanup/health)
  //   B) `<table>?<qs>`                 (q() 헬퍼 형태: activity-alert — /rest/v1/ 접두 없음)
  const candidates = [];
  let m;
  const reA = /\/rest\/v1\/(\w+)(\?[^`'"\s]*)?/g;
  while ((m = reA.exec(src))) candidates.push({ table: m[1], qs: m[2] || '' });
  const reB = /[`'"]([a-z_]\w*)\?([^`'"]*)/gi;
  while ((m = reB.exec(src))) {
    if (PGREST_SIGNAL.test(m[2])) candidates.push({ table: m[1], qs: '?' + m[2] });
  }

  for (const { table, qs: rawQs } of candidates) {
    refs.push({ table, column: null, kind: 'table' });
    if (!rawQs) continue;
    const qs = rawQs.slice(1).replace(/\$\{[^}]*\}/g, '\u0001'); // 보간 자리 표시
    for (const part of qs.split('&')) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      const key = part.slice(0, eq).trim();
      const val = part.slice(eq + 1).trim();
      if (key === 'select') {
        for (let col of val.split(',')) {
          col = col.replace(/\([^)]*\)/g, '').replace(/::\w+/g, '').trim();
          if (col.includes(':')) col = col.split(':').pop().trim(); // alias:col
          if (!col || col === '*' || col.includes('\u0001')) continue;
          if (/^[a-z_]\w*$/i.test(col)) refs.push({ table, column: col, kind: 'select' });
        }
      } else if (key === 'order') {
        for (let col of val.split(',')) {
          col = col.replace(/\.(asc|desc|nullsfirst|nullslast)/gi, '').trim();
          if (!col || col.includes('\u0001')) continue;
          if (/^[a-z_]\w*$/i.test(col)) refs.push({ table, column: col, kind: 'order' });
        }
      } else if (!RESERVED_QS.has(key.toLowerCase()) && /^[a-z_]\w*$/i.test(key)) {
        refs.push({ table, column: key, kind: 'filter' }); // <col>=<op>.<val>
      }
    }
  }

  // 2) countSince(env, '<table>', since[, '<dateCol>'])
  const csRe = /countSince\s*\([^,]+,\s*['"](\w+)['"]\s*,\s*[^,)]+(?:,\s*['"](\w+)['"])?\s*\)/g;
  while ((m = csRe.exec(src))) {
    refs.push({ table: m[1], column: null, kind: 'table' });
    refs.push({ table: m[1], column: m[2] || 'created_at', kind: 'countSince dateCol' });
  }

  return refs;
}

/** 참조 배열을 스키마와 대조 → 위반 사유 배열. */
function validate(schema, refs) {
  const out = [];
  for (const r of refs) {
    const tab = r.table.toLowerCase();
    if (!schema[tab]) {
      out.push(`유령 테이블 "${r.table}" — 스키마에 없음 (${r.kind})`);
      continue;
    }
    if (r.column && !schema[tab].has(r.column.toLowerCase())) {
      out.push(`"${r.table}.${r.column}" 컬럼 없음 (${r.kind})`);
    }
  }
  return out;
}

// ─── 양방향 self-test ───
function selfTest() {
  const fake = {
    posts: new Set(['id', 'title', 'category', 'user_id', 'content', 'created_at']),
    user_profiles: new Set(['user_id', 'nickname', 'points', 'level', 'joined_at']),
  };
  const good = `
    q(\`posts?select=id,title,category&created_at=gte.\${since}&order=created_at.desc&limit=50\`);
    q(\`user_profiles?select=user_id,nickname&order=points.desc\`);
    countSince(env, 'posts', since);
    countSince(env, 'user_profiles', since, 'joined_at');
  `;
  if (validate(fake, refsOf(good)).length !== 0) {
    console.error('❌ self-test 실패: 정상 cron 을 위반으로 오탐\n', validate(fake, refsOf(good)));
    process.exit(1);
  }
  const bads = [
    [`q(\`community_posts?select=id\`);`, '유령 테이블'],
    [`q(\`user_profiles?select=email\`);`, '없는 select 컬럼'],
    [`q(\`posts?select=id&order=view_count.desc\`);`, '없는 order 컬럼'],
    [`q(\`user_profiles?points=gte.5&nope=eq.1\`);`, '없는 filter 컬럼'],
    [`countSince(env, 'user_profiles', since);`, 'countSince 기본 created_at 없음'],
  ];
  for (const [snippet, label] of bads) {
    if (validate(fake, refsOf(snippet)).length === 0) {
      console.error(`❌ self-test 실패: ${label} 을(를) 못 잡음 → ${snippet}`);
      process.exit(1);
    }
  }
}

selfTest();

const schema = buildSchema();
if (Object.keys(schema).length === 0) {
  console.error('❌ 스키마 파싱 0 테이블 — supabase/migrations 를 못 읽음. 빌드 중단.');
  process.exit(1);
}
if (!fs.existsSync(CRON_DIR)) {
  console.log('⏭️  functions/api/cron/ 없음 — 검사 대상 0');
  process.exit(0);
}

const files = fs.readdirSync(CRON_DIR).filter((f) => f.endsWith('.ts'));
let failed = false;
for (const f of files) {
  const v = validate(schema, refsOf(fs.readFileSync(path.join(CRON_DIR, f), 'utf8')));
  if (v.length) { failed = true; console.error(`❌ ${f}:`); v.forEach((x) => console.error(`   - ${x}`)); }
  else console.log(`✅ ${f}`);
}
if (failed) {
  console.error('\n빌드 중단 — cron 이 실제 스키마에 없는 테이블/컬럼을 조회합니다(스키마 드리프트).');
  console.error('PostgREST 400/404 → 빈 결과 → 알림 무발화로 조용히 죽습니다. 스키마와 1:1 정렬하세요.');
  process.exit(1);
}
console.log(`\n✅ cron 스키마 드리프트 게이트 통과 (${files.length}개 cron, ${Object.keys(schema).length}개 테이블, self-test 양방향 OK)`);
