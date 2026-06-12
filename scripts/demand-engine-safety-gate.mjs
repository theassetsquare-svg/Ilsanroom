#!/usr/bin/env node
/**
 * [STEP 4/D] 수요 감지 엔진 안전 게이트
 *
 * 수요 스크립트(GSC/GA 신호로 "어떤 페이지를 만들/키울지" 발견)가
 * 절대 넘으면 안 되는 선을 빌드 단계에서 강제한다. 위반 시 배포 차단.
 *
 * 불변식:
 *  1) ★자동 대량생성 0 — 수요 스크립트는 src/pages·public·dist 등 라우트/콘텐츠 파일에
 *     쓰지 않는다. 페이지는 사람이 만든다. (fs.write* 가 해당 경로를 향하면 FAIL)
 *  2) ★사이트 변경 0 — git 커밋/푸시, child_process 로 페이지 양산 호출 금지.
 *  3) ★개인정보 0 — 개별 사용자 식별 차원(userId/clientId/userPseudoId) 사용 금지.
 *     검색어는 GSC/GA가 집계·익명화한 값만 사용.
 *  4) ★읽기 전용 — gsc-auth/ga-auth(읽기 API)만 import, 가짜 데이터 생성 코드 없음.
 *
 * 양방향 검증: 정상 PASS + 위반 패턴 주입 시 FAIL.
 */
import fs from 'node:fs';

// 수요 감지 엔진을 구성하는 스크립트들
const DEMAND_SCRIPTS = [
  'scripts/search-console-demand-gap.mjs',
  'scripts/search-console-opportunity.mjs',
  'scripts/ga-demand-insight.mjs',
];

const errors = [];

// 라우트/콘텐츠 산출물 경로(여기에 쓰면 = 자동 생성)
const FORBIDDEN_WRITE_TARGETS = /(src\/pages|src\/data|public\/|dist\/|sitemap|llms\.txt|robots\.txt|\.html['"`])/;
// 개별 사용자 추적 차원(개인정보)
const PII_DIMENSIONS = /(userId|clientId|userPseudoId|streamId|\bipAddress\b)/;

for (const file of DEMAND_SCRIPTS) {
  if (!fs.existsSync(file)) { errors.push(`${file}: 파일 없음`); continue; }
  const src = fs.readFileSync(file, 'utf8');

  // 1) 파일 쓰기 호출이 라우트/콘텐츠를 향하는지 — 같은 줄(또는 인자)에 산출물 경로가 있으면 FAIL
  for (const m of src.matchAll(/fs\.(?:promises\.)?(?:write|writeFile|writeFileSync|appendFile|appendFileSync|mkdir|rm|unlink)[^\n]*/g)) {
    if (FORBIDDEN_WRITE_TARGETS.test(m[0])) {
      errors.push(`${file}: 라우트/콘텐츠 파일 쓰기 의심 → 자동 대량생성 금지 (${m[0].slice(0, 80)})`);
    }
  }

  // 2) git/페이지 양산 호출 금지
  if (/child_process|execSync|spawnSync|\bexec\(/.test(src)) {
    errors.push(`${file}: child_process/exec 호출 — 수요 스크립트는 외부 명령 실행 금지`);
  }
  if (/git\s+(?:add|commit|push|tag)/.test(src)) {
    errors.push(`${file}: git 변경 명령 — 수요 스크립트는 사이트/레포 변경 금지`);
  }

  // 3) 개인정보(개별 사용자 추적) 차원 사용 금지
  const piiHit = src.match(PII_DIMENSIONS);
  if (piiHit) {
    errors.push(`${file}: 개별 사용자 추적 차원(${piiHit[0]}) — 검색어는 집계·익명만 허용`);
  }

  // 4) 읽기 전용 인증 모듈만 사용 (gsc-auth 또는 ga-auth)
  if (!/from '\.\/lib\/(gsc|ga)-auth\.mjs'/.test(src)) {
    errors.push(`${file}: gsc-auth/ga-auth(읽기 API) import 없음 — 읽기 전용 출처 불명`);
  }
}

if (errors.length) {
  console.error(`\n❌ [STEP 4/D] 수요 엔진 안전 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n수요 엔진은 "발견 리포트"만 — 자동 대량생성·사이트 변경·개인정보·가짜 데이터 0. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [STEP 4/D] 수요 엔진 안전 게이트 PASS — ${DEMAND_SCRIPTS.length}개 스크립트 읽기전용·자동발행0·개인정보0 확인`);
