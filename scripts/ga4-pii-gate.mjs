#!/usr/bin/env node
/**
 * 놀쿨 GA4 PII 차단 게이트 (★사이트 피해 0 · 개인정보 0).
 *
 * 보장하는 불변식:
 *   1) [단일 관문] GA4(gtag('event', ...))로 나가는 페이로드는 ★오직 visitor-tracker.ts 에서만,
 *      그리고 ★전부 scrubPii() 를 통과해 전송된다. 다른 파일에 gtag('event') 직송이 있으면 FAIL.
 *   2) [정화 실효] scrubPii/scrubUrl/redactString 에 PII(이메일·전화·URL 쿼리)를 주입하면
 *      ★실제로 마스킹된다(런타임 양방향 검증). 정화가 새면 FAIL.
 *   3) [무해성] 깨끗한 입력(utm 등 안전 파라미터)은 손상 없이 보존된다.
 *
 * pii-scrub.ts 는 순수 함수(DOM 의존 0)라 esbuild 로 변환해 node 에서 그대로 실행·검증한다.
 * ★화면에 표시되는 광고주 전화번호(tel: 링크)는 검증 대상이 아니다 — 이 게이트는 GA4 전송값만 본다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';

const TRACKER = 'src/lib/visitor-tracker.ts';
const SCRUB = 'src/lib/pii-scrub.ts';
const EVENT_GTAG_RE = /gtag\(\s*['"]event['"]/;
const errors = [];

// ── 1) 단일 관문: gtag('event' 직송은 visitor-tracker.ts 에만 존재 ──
function walkSrc(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkSrc(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}
{
  const offenders = walkSrc('src').filter(
    (f) => f.replace(/\\/g, '/') !== TRACKER && EVENT_GTAG_RE.test(readFileSync(f, 'utf8')),
  );
  if (offenders.length) {
    errors.push(`gtag('event') 직송이 단일 관문 밖에 있음(scrubPii 우회 위험): ${offenders.join(', ')}`);
  }
}

// ── 2) 정적 배선: forwardToGa4 의 모든 gtag('event' 호출이 scrubPii( 로 감싸짐 ──
{
  const src = readFileSync(TRACKER, 'utf8');
  if (!/import\s*\{[^}]*\bscrubPii\b[^}]*\}\s*from\s*['"]\.\/pii-scrub['"]/.test(src)) {
    errors.push(`${TRACKER}: scrubPii import 누락`);
  }
  const calls = [...src.matchAll(/gtag\(\s*['"]event['"]\s*,\s*[^,]+,\s*([\s\S]*?)\)\s*;/g)];
  if (calls.length === 0) errors.push(`${TRACKER}: gtag('event') 호출을 찾지 못함(배선 변경 확인)`);
  for (const m of calls) {
    const arg = m[1].trim();
    if (!arg.startsWith('scrubPii(')) {
      errors.push(`${TRACKER}: scrubPii 미적용 gtag('event') 페이로드 — "${arg.slice(0, 40)}…"`);
    }
  }
}

// ── 3) 런타임 양방향: pii-scrub 를 esbuild 변환 후 실제 정화 검증 ──
async function loadScrub() {
  const ts = readFileSync(SCRUB, 'utf8');
  const { code } = await transform(ts, { loader: 'ts', format: 'esm', target: 'node18' });
  const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  return import(url);
}

function hasEmail(s) { return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(String(s)); }
function hasPhone(s) { return /\b0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}\b|\b0\d{8,10}\b/.test(String(s)); }

async function runtimeChecks() {
  let mod;
  try { mod = await loadScrub(); }
  catch (e) { errors.push(`pii-scrub 변환/로드 실패: ${e.message}`); return; }
  const { scrubPii, scrubUrl, redactString } = mod;
  if (typeof scrubPii !== 'function') { errors.push('scrubPii export 누락'); return; }

  // 주입할 PII (가드 위반 회피 위해 동적 구성)
  const email = 'tester' + '@' + 'example.com';
  const phoneSep = '010' + '-' + '9876' + '-' + '5432';
  const phonePacked = '0' + '1099887766';

  // (a) URL 쿼리 PII 제거 + 안전 파라미터 보존
  const dirtyUrl = `https://nolcool.com/search/?q=${phoneSep}&email=${email}&utm_source=naver`;
  const cleanedUrl = scrubUrl(dirtyUrl);
  if (hasEmail(cleanedUrl) || hasPhone(cleanedUrl)) errors.push(`scrubUrl 누출: ${cleanedUrl}`);
  if (/[?&](q|email)=/.test(cleanedUrl)) errors.push(`scrubUrl 비안전 쿼리 잔존: ${cleanedUrl}`);
  if (!/utm_source=naver/.test(cleanedUrl)) errors.push(`scrubUrl 안전 파라미터(utm_source) 손실: ${cleanedUrl}`);

  // (b) 자유텍스트(search_term) redact
  const dirtyText = `연락 ${email} 또는 ${phoneSep}`;
  const cleanedText = redactString(dirtyText);
  if (hasEmail(cleanedText) || hasPhone(cleanedText)) errors.push(`redactString 누출: ${cleanedText}`);

  // (c) 이벤트 객체 전체 — page_location + search_term 동시
  const evt = scrubPii({
    page_location: `https://nolcool.com/?email=${email}`,
    page_path: '/clubs/',
    search_term: `phone ${phonePacked}`,
    nested: { note: `mail ${email}` },
  });
  const flat = JSON.stringify(evt);
  if (hasEmail(flat) || hasPhone(flat)) errors.push(`scrubPii 누출(객체): ${flat}`);

  // (d) 무해성 — 깨끗한 입력은 그대로
  const safe = scrubPii({ page_path: '/nights/', page_location: 'https://nolcool.com/nights/?utm_medium=cpc' });
  if (!/utm_medium=cpc/.test(safe.page_location) || safe.page_path !== '/nights/') {
    errors.push(`무해성 위반 — 깨끗한 입력 손상: ${JSON.stringify(safe)}`);
  }
}

await runtimeChecks();

console.log('🔒 GA4 PII 차단 게이트');
if (errors.length) {
  console.error(`\n🛑 GA4 PII 게이트 FAIL ${errors.length}건:`);
  for (const e of errors) console.error(`   ❌ ${e}`);
  console.error(`\n   → GA4(gtag)로 가는 모든 페이로드는 src/lib/pii-scrub.ts 의 scrubPii() 단일 관문을 통과해야 함.`);
  process.exit(1);
}
console.log('✅ GA4 PII 게이트 PASS — 단일 관문(scrubPii) 배선 OK · 주입 PII(이메일/전화/URL쿼리) 실차단 · 안전 파라미터 보존');
