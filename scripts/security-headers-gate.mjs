#!/usr/bin/env node
/**
 * 보안 헤더 빌드 게이트 (재발 방지)
 *
 * public/_headers(=dist/_headers로 복사)에 필수 보안 헤더가 전부 있는지 검증.
 * 하나라도 빠지면 exit 2 → 빌드 중단 → 라이브 반영 차단.
 * 누군가 헤더를 지우거나 약화시키면 build가 깨져서 절대 푸시 안 됨.
 *
 * 양방향: REQUIRED 전부 있으면 PASS, 하나 제거 시 FAIL (주입 테스트로 실증).
 */
import fs from 'node:fs';
import path from 'node:path';

const HEADERS_PATH = path.join(process.cwd(), 'public', '_headers');

// [정규식, 라벨] — global /* 블록에 반드시 존재해야 하는 헤더
const REQUIRED = [
  [/^\s*Strict-Transport-Security:\s*max-age=\d{7,}/im, 'HSTS (max-age 충분)'],
  [/^\s*X-Content-Type-Options:\s*nosniff/im, 'X-Content-Type-Options nosniff'],
  [/^\s*X-Frame-Options:\s*(DENY|SAMEORIGIN)/im, 'X-Frame-Options'],
  [/^\s*Referrer-Policy:\s*\S+/im, 'Referrer-Policy'],
  [/^\s*Permissions-Policy:\s*\S+/im, 'Permissions-Policy'],
  [/^\s*Cross-Origin-Opener-Policy:\s*\S+/im, 'Cross-Origin-Opener-Policy'],
  [/^\s*Content-Security-Policy:\s*[^\n]*frame-ancestors[^\n]*/im, 'CSP frame-ancestors'],
  [/^\s*Content-Security-Policy:\s*[^\n]*base-uri[^\n]*/im, 'CSP base-uri'],
  [/^\s*Content-Security-Policy:\s*[^\n]*object-src[^\n]*/im, 'CSP object-src'],
];

// CSP가 인라인 스크립트를 즉시 강제(차단)하면 안 됨 — script-src는 Report-Only로만 관찰.
function main() {
  if (!fs.existsSync(HEADERS_PATH)) {
    console.error('❌ public/_headers 없음');
    process.exit(2);
  }
  const txt = fs.readFileSync(HEADERS_PATH, 'utf8');
  const missing = REQUIRED.filter(([re]) => !re.test(txt)).map(([, label]) => label);

  // 강제 CSP에 script-src가 들어가면 인라인 사이트가 깨질 수 있음 → 차단.
  // (script-src 관찰은 Content-Security-Policy-Report-Only 에서만 허용)
  const enforcedCsp = (txt.match(/^\s*Content-Security-Policy:\s*[^\n]*/im) || [''])[0];
  if (/script-src/i.test(enforcedCsp)) {
    console.error('❌ 강제 CSP에 script-src 발견 — 인라인 스크립트 차단 위험. Report-Only로 옮길 것.');
    process.exit(2);
  }

  if (missing.length) {
    console.error('❌ 보안 헤더 누락:\n  - ' + missing.join('\n  - '));
    process.exit(2);
  }
  console.log('✅ 보안 헤더 게이트 통과 — 필수 ' + REQUIRED.length + '종 + 강제CSP script-src 없음');
}

main();
