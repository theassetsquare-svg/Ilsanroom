#!/usr/bin/env node
/**
 * [속성/안전] 진단 속성 분리 게이트 — NOLCOOL 외 속성 혼입을 빌드에서 영구 차단.
 *
 * 사장님 절대규칙: 일일 진단은 NOLCOOL 속성(GA4 properties/540830544 · GSC https://nolcool.com/)만 읽는다.
 * theassetsquare(sc-domain:theassetsquare.com) 등 타 속성 데이터가 섞이면 진단이 오염된다.
 * 본 게이트는 (A) 공용 인증 모듈의 기본 속성이 NOLCOOL인지, (B) 진단 스크립트에 타 속성 리터럴이
 * 박혀있지 않은지 정적으로 강제한다. 위반 시 배포 차단. (런타임 가드는 진단 스크립트 자체에도 있음 — 이중 방어)
 *
 * 허용:
 *   - GA4 = properties/540830544 (유일)
 *   - GSC host = nolcool.com (유일)
 *   - theassetsquare@gmail.com (메일 *수신자*) / theassetsquare-search-console (GA 할당량 *청구 프로젝트*) → 데이터 속성 아님, 허용
 * 금지:
 *   - 다른 properties/<id>
 *   - sc-domain: 도메인 속성 리터럴(권한·집계 단위가 달라 혼입 위험)
 *   - theassetsquare.com 을 *사이트/속성*으로 참조
 *
 * 양방향 검증: 정상 PASS + 위반 리터럴 주입 시 FAIL.
 */
import fs from 'node:fs';

const ALLOWED_GA = 'properties/540830544';
const ALLOWED_GSC_HOST = 'nolcool.com';

// 데이터 속성을 읽는 진단/리포트 스크립트(여기에 타 속성 리터럴이 박히면 안 됨)
const DIAGNOSIS_SCRIPTS = ['scripts/seo-weakness-diagnosis.mjs'];
// 공용 인증 모듈 — 기본 속성이 반드시 NOLCOOL이어야 함(오염되면 전 진단이 타 속성을 봄)
const AUTH_LIBS = [
  { file: 'scripts/lib/ga-auth.mjs', re: /GA_PROPERTY\s*=\s*process\.env\.GA_PROPERTY_ID\s*\|\|\s*'([^']+)'/, expect: ALLOWED_GA, label: 'GA4 기본 속성' },
  { file: 'scripts/lib/gsc-auth.mjs', re: /SITE_PROPERTY\s*=\s*process\.env\.GSC_SITE_PROPERTY\s*\|\|\s*'([^']+)'/, expect: 'https://nolcool.com/', label: 'GSC 기본 속성' },
];

const errors = [];

// (A) 공용 인증 모듈 기본 속성 검사
for (const { file, re, expect, label } of AUTH_LIBS) {
  if (!fs.existsSync(file)) { errors.push(`${file}: 파일 없음`); continue; }
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(re);
  if (!m) { errors.push(`${file}: ${label} 기본값 패턴을 찾지 못함(리팩터 시 게이트 갱신 필요)`); continue; }
  if (m[1] !== expect) errors.push(`${file}: ${label} 기본값이 NOLCOOL이 아님 → '${m[1]}' (허용 '${expect}')`);
}

// (B) 진단 스크립트 — 타 속성 리터럴 정적 차단
for (const file of DIAGNOSIS_SCRIPTS) {
  if (!fs.existsSync(file)) { errors.push(`${file}: 파일 없음`); continue; }
  const src = fs.readFileSync(file, 'utf8');

  // 다른 GA4 속성 ID
  for (const m of src.matchAll(/properties\/(\d+)/g)) {
    if (`properties/${m[1]}` !== ALLOWED_GA) errors.push(`${file}: NOLCOOL 외 GA4 속성 리터럴 '${m[0]}' (허용 ${ALLOWED_GA})`);
  }
  // sc-domain 도메인 속성(혼입 위험) — 일절 금지
  if (/sc-domain:/.test(src)) errors.push(`${file}: 'sc-domain:' 도메인 속성 리터럴 — 진단은 URL-prefix nolcool.com 전용`);
  // theassetsquare.com 을 사이트/속성으로 참조(수신 이메일·청구 프로젝트는 위에서 허용, .com 사이트는 금지)
  if (/theassetsquare\.com/.test(src)) errors.push(`${file}: theassetsquare.com 사이트/속성 참조 — 타 속성 데이터 혼입 위험`);
  // pages.dev 미러(seven1-2jn 등)를 데이터 속성으로 박는 것 차단 — GSC 정식 속성은 nolcool.com 뿐
  for (const m of src.matchAll(/([a-z0-9-]+\.pages\.dev)/gi)) errors.push(`${file}: pages.dev 미러 호스트 '${m[1]}' 참조 — GSC 정식 속성은 ${ALLOWED_GSC_HOST}`);
}

if (errors.length) {
  console.error(`\n❌ [속성/안전] 진단 속성 분리 게이트 FAIL (${errors.length}건)`);
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n일일 진단은 NOLCOOL 속성(GA4 540830544 · GSC nolcool.com)만 읽어야 합니다. 타 속성 혼입 0. 배포 차단.\n');
  process.exit(1);
}

console.log(`✅ [속성/안전] 진단 속성 분리 게이트 PASS — 인증모듈 기본 NOLCOOL·진단 스크립트 ${DIAGNOSIS_SCRIPTS.length}개 타 속성 리터럴 0 확인`);
