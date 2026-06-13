#!/usr/bin/env node
/**
 * 빌드 게이트 — 놀쿨 MCP 서버는 영구적으로 "읽기 전용·PII 0" 임을 강제한다.
 *
 * scripts/mcp/*.mjs 에 다음이 생기면 빌드 중단(exit 1):
 *  1) 쓰기 — method:'POST'|'PUT'|'PATCH'|'DELETE', PostgREST /rpc/, insert/update/upsert/delete 호출
 *  2) 만능 SQL 도구 — execute_sql / run_sql / raw_sql / query_sql / arbitrary
 *  3) PII 노출 — 어떤 select 문자열에든 금지 컬럼(staff_phone/phone/owner_id/user_id/email/content/address/ip/token)
 *
 * 검출은 "주석 제거 후 실코드"에만 적용한다(문서 주석이 단어를 언급해도 무관).
 * PII 검출은 select 절 값만 본다(서버의 DENY_COLS 정의 배열은 정상).
 *
 * 양방향 self-test 내장: 실파일 PASS + 3종 위반 주입본 FAIL 모두 확인. 하나라도 어긋나면 게이트 자체 실패.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MCP_DIR = path.join(ROOT, 'scripts', 'mcp');

const DENY_COLS = ['staff_phone', 'phone', 'owner_id', 'user_id', 'email', 'password', 'content', 'address', 'ip', 'token'];

/** 주석(블록 + 라인) 제거. `://` 는 라인주석으로 오인하지 않음. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** 한 파일을 검사해 위반 사유 배열 반환(빈 배열 = PASS). */
function violations(src) {
  const code = stripComments(src);
  const out = [];
  // 1) 쓰기 메서드
  const m = code.match(/method\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i);
  if (m) out.push(`쓰기 HTTP 메서드 발견: ${m[1]}`);
  if (/\/rest\/v1\/rpc\//.test(code)) out.push('PostgREST /rpc/ 호출(쓰기/임의함수) 발견');
  const verb = code.match(/\.(insert|update|upsert|delete)\s*\(/);
  if (verb) out.push(`쓰기 동작 .${verb[1]}() 발견`);
  // 2) 만능 SQL 도구
  const sql = code.match(/\b(execute_sql|run_sql|raw_sql|query_sql|arbitrary_sql)\b/i);
  if (sql) out.push(`만능 SQL 도구(${sql[1]}) 발견`);
  // 3) PII — select 절에 금지 컬럼
  const selects = [...code.matchAll(/select\s*[:=]\s*['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
  for (const sel of selects) {
    for (const c of sel.split(',').map((s) => s.trim())) {
      if (DENY_COLS.some((d) => c.toLowerCase().includes(d))) {
        out.push(`select 절에 PII/민감 컬럼 "${c}" 노출`);
      }
    }
  }
  return out;
}

// ─── 양방향 self-test ───
function selfTest() {
  const sample = `
    const a = await fetch(url, { headers: h });            // GET (정상)
    await pgGet('venues', { select: 'slug,name,region' }); // 정상
    const DENY = ['staff_phone','content'];                // 정의는 정상
  `;
  if (violations(sample).length !== 0) {
    console.error('❌ self-test 실패: 정상 코드가 위반으로 오탐'); process.exit(1);
  }
  const bad = [
    `await fetch(url, { method: 'POST', body: x });`,
    `await pgGet('venues', { select: 'slug,staff_phone' });`,
    `const TOOLS = { execute_sql: {} };`,
    `const r = await fetch(BASE + '/rest/v1/rpc/anything');`,
  ];
  for (const b of bad) {
    if (violations(b).length === 0) {
      console.error(`❌ self-test 실패: 위반을 못 잡음 → ${b}`); process.exit(1);
    }
  }
}

selfTest();

if (!fs.existsSync(MCP_DIR)) {
  console.log('⏭️  scripts/mcp/ 없음 — MCP 서버 미설치(검사 대상 0)'); process.exit(0);
}
const files = fs.readdirSync(MCP_DIR).filter((f) => f.endsWith('.mjs'));
let failed = false;
for (const f of files) {
  const v = violations(fs.readFileSync(path.join(MCP_DIR, f), 'utf8'));
  if (v.length) { failed = true; console.error(`❌ ${f}:`); v.forEach((x) => console.error(`   - ${x}`)); }
  else console.log(`✅ ${f}: 읽기 전용·PII 0`);
}
if (failed) {
  console.error('\n빌드 중단 — MCP 서버에 쓰기/PII/만능SQL 가 생겼습니다. 읽기 전용 불변식 위반.');
  process.exit(1);
}
console.log(`\n✅ MCP 읽기전용 게이트 통과 (${files.length}개 서버, self-test 양방향 OK)`);
