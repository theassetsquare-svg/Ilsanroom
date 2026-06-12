#!/usr/bin/env node
/**
 * [GA/안전] GA 자동화 안전 게이트 — "가짜 100점"을 빌드에서 영구 차단.
 *
 * GA 점수를 자동으로 올리려는 유혹의 치명적 footgun:
 *   가짜 이벤트(page_view/scroll/engagement)를 GA에 주입해 수치를 조작 →
 *   구글이 활동조작으로 탐지 → 영구 페널티 = 사이트 사망 (CLAUDE.md #0 정직 불변식).
 * 이 게이트는 GA 자동화 스크립트가 ★읽기 전용을 벗어나지 못하게 강제한다. 위반 시 배포 차단.
 *
 * 불변식 (GA_SCRIPTS 전부에 적용):
 *  1) ★GA에 이벤트 전송 0 — Measurement Protocol(/mp/collect·/g/collect·/collect),
 *     api_secret, gtag/dataLayer event 전송, runReport 아닌 쓰기 호출 금지.
 *  2) ★자동 대량생성 0 — 라우트/콘텐츠 파일(src/pages·src/data·public·dist·sitemap·*.html)에 쓰지 않음.
 *  3) ★사이트 변경 0 — child_process/exec, git add|commit|push 금지.
 *  4) ★개인정보 0 — 개별 사용자 추적 차원(userId/clientId/userPseudoId/streamId/ipAddress) 금지.
 *  5) ★읽기 전용 출처 — ga-auth(읽기 API)만 import.
 *
 * 양방향 검증: 정상 PASS + 위반 패턴 주입 시 FAIL.
 */
import fs from 'node:fs';

const GA_SCRIPTS = [
  'scripts/ga-optimizer.mjs',
  'scripts/ga-health-audit.mjs',
  'scripts/ga-demand-insight.mjs',
  'scripts/northstar-audit.mjs',
];

const errors = [];

// GA에 이벤트를 쏘는(=수치 조작) 흔적
const GA_INJECT = /(\/mp\/collect|\/g\/collect|google-analytics\.com\/collect|region1\.google-analytics|api_secret|measurement_protocol|dataLayer\.push|gtag\(\s*['"]event)/;
// 라우트/콘텐츠 산출물(여기에 쓰면 자동 대량생성)
const FORBIDDEN_WRITE = /(src\/pages|src\/data|public\/|dist\/|sitemap|llms\.txt|robots\.txt|\.html['"`])/;
// 개별 사용자 추적 차원(개인정보)
const PII = /(userId|clientId|userPseudoId|streamId|\bipAddress\b)/;

for (const file of GA_SCRIPTS) {
  if (!fs.existsSync(file)) { errors.push(`${file}: 파일 없음`); continue; }
  const src = fs.readFileSync(file, 'utf8');

  // 1) GA 이벤트 전송(수치 조작)
  const inj = src.match(GA_INJECT);
  if (inj) errors.push(`${file}: GA 이벤트 전송 의심(${inj[0]}) — 수치 조작 금지(활동조작 페널티)`);

  // 2) 라우트/콘텐츠 파일 쓰기
  for (const m of src.matchAll(/fs\.(?:promises\.)?(?:write|writeFile|writeFileSync|appendFile|appendFileSync|mkdir|rm|unlink)[^\n]*/g)) {
    if (FORBIDDEN_WRITE.test(m[0])) errors.push(`${file}: 라우트/콘텐츠 쓰기 의심 → 자동 대량생성 금지 (${m[0].slice(0, 80)})`);
  }

  // 3) 외부 명령/깃
  if (/child_process|execSync|spawnSync|\bexec\(/.test(src)) errors.push(`${file}: child_process/exec — 외부 명령 실행 금지`);
  if (/git\s+(?:add|commit|push|tag)/.test(src)) errors.push(`${file}: git 변경 명령 — 사이트/레포 변경 금지`);

  // 4) 개인정보 차원
  const pii = src.match(PII);
  if (pii) errors.push(`${file}: 개별 사용자 추적 차원(${pii[0]}) — 집계·익명만 허용`);

  // 5) 읽기 전용 인증 모듈
  if (!/from '\.\/lib\/ga-auth\.mjs'/.test(src)) errors.push(`${file}: ga-auth(읽기 API) import 없음 — 읽기 전용 출처 불명`);
}

if (errors.length) {
  console.error(`\n❌ [GA/안전] GA 자동화 안전 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\nGA 자동화는 "측정·진단·처방"만 — 가짜 이벤트 주입·수치 조작·자동 대량생성·개인정보 0. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [GA/안전] GA 자동화 안전 게이트 PASS — ${GA_SCRIPTS.length}개 스크립트 읽기전용·이벤트주입0·자동발행0·개인정보0 확인`);
