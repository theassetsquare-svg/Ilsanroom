#!/usr/bin/env node
/**
 * 놀쿨 prefetch 경로 게이트 (★재발 방지).
 *
 * SafeLink(src/components/ui/SafeLink.tsx)는 내부 <Link to> 를 hover/touch/뷰포트 진입 시
 * 그 경로 그대로 prefetch 한다(경로 재조합 없음). 따라서 prefetch 되는 경로가 실재하지 않으면
 * 404 prefetch(무음 실패)가 난다. 이 게이트는 dist 전 페이지의 내부 <a href> 중
 * "SafeLink가 실제로 prefetch 할 경로"가 전부 실재 라우트로 해소되는지 검증한다.
 *
 * 검증 규칙(SafeLink 동작과 1:1):
 *   - 외부/해시/쿼리/자산(확장자 있는 href)은 prefetch 대상 아님 → 제외.
 *   - SafeLink의 DYNAMIC_PREFETCH_SKIP 패턴에 걸리는 경로는 prefetch skip → 제외.
 *     (드리프트 0 — 패턴을 SafeLink.tsx에서 직접 파싱해서 사용. 하드코딩 금지.)
 *   - 나머지 내부 링크는 반드시 dist 라우트(index.html) 또는 _redirects source(301/308)로 해소돼야 함.
 *     해소 안 되면 = 그 링크가 prefetch 되면 404 → FAIL(exit 1), 배포 차단.
 *
 * funnel-reachability-audit(고아·깊이·막다른길)과 역할 분리: 그쪽은 "색인 페이지가 도달 가능한가",
 * 본 게이트는 "내부 링크가 죽지 않았는가(prefetch 404 0)".
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SAFELINK = 'src/components/ui/SafeLink.tsx';

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }

// ── SafeLink.tsx에서 DYNAMIC_PREFETCH_SKIP 정규식 추출(드리프트 0) ──
function loadSkipPatterns() {
  const src = readFileSync(SAFELINK, 'utf8');
  const m = src.match(/DYNAMIC_PREFETCH_SKIP\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!m) { console.error(`🛑 ${SAFELINK} 에서 DYNAMIC_PREFETCH_SKIP 배열을 찾지 못함 — SafeLink 구조 변경?`); process.exit(1); }
  const pats = [];
  // 한 줄에 정규식 리터럴 1개(파일 포맷). 줄 단위로 첫 / ~ 마지막 /(+flags) 추출 →
  // 문자클래스 안의 raw '/'( [^/] 등)도 안전 처리.
  for (const raw of m[1].split('\n')) {
    const line = raw.trim().replace(/,\s*$/, '');
    const lit = line.match(/^\/(.*)\/([gimsuy]*)$/);
    if (lit) { try { pats.push(new RegExp(lit[1], lit[2])); } catch {} }
  }
  if (!pats.length) { console.error(`🛑 ${SAFELINK} DYNAMIC_PREFETCH_SKIP 에서 정규식을 파싱하지 못함`); process.exit(1); }
  return pats;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}
function fileToPath(f) {
  let p = f.replace(/^dist/, '').replace(/\/index\.html$/, '');
  if (p === '') p = '/';
  try { p = decodeURIComponent(p); } catch {}
  return p;
}
// 내부 <a href> 페이지 링크만(자산·해시·쿼리·외부 제외). 끝 슬래시 정규화.
function pageLinks(html) {
  const set = new Set();
  for (const m of html.matchAll(/href=["'](\/[^"'#?]*)/g)) {
    let h = m[1];
    if (h.startsWith('//')) continue;          // protocol-relative 외부
    if (/\.[a-z0-9]{2,5}$/i.test(h)) continue; // 확장자 = 자산(webp/js/css/ico/svg/json...)
    h = h.replace(/\/$/, '') || '/';
    try { h = decodeURIComponent(h); } catch {}
    set.add(h);
  }
  return set;
}

const skipPatterns = loadSkipPatterns();
const files = walk(DIST);
const existPaths = new Set(files.map(fileToPath));

// _redirects source(301/308 → 실재 경로) 도 유효 prefetch 대상
const redirSrc = new Set();
if (existsSync('dist/_redirects')) {
  for (const line of readFileSync('dist/_redirects', 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const src = t.split(/\s+/)[0];
    if (src && src.startsWith('/') && !src.includes('*')) {
      let s = src.replace(/\/$/, '') || '/'; try { s = decodeURIComponent(s); } catch {}
      redirSrc.add(s);
    }
  }
}

const isSkipped = (p) => skipPatterns.some((re) => re.test(p) || re.test(p + '/'));

// 링크 → 그 링크를 품은 페이지(상위 3개만 보고)
const badLinks = new Map();
let checked = 0, skippedCount = 0;
for (const f of files) {
  const from = fileToPath(f);
  for (const h of pageLinks(readFileSync(f, 'utf8'))) {
    if (h === '/') continue;
    if (isSkipped(h)) { skippedCount++; continue; }
    checked++;
    if (!existPaths.has(h) && !redirSrc.has(h)) {
      if (!badLinks.has(h)) badLinks.set(h, new Set());
      if (badLinks.get(h).size < 3) badLinks.get(h).add(from);
    }
  }
}

console.log('🔗 prefetch 경로 게이트');
console.log(`   dist 라우트 ${existPaths.size} / _redirects ${redirSrc.size} / skip패턴 ${skipPatterns.length}개`);
console.log(`   검사한 내부 링크(중복 포함) ${checked} · skip(동적 SPA) ${skippedCount}`);

if (badLinks.size) {
  console.error(`\n🛑 prefetch 404 위험 링크 ${badLinks.size}종 — 실재 라우트/리다이렉트로 해소 안 됨:`);
  for (const [h, froms] of badLinks) console.error(`   ❌ ${h}  ← ${[...froms].join(', ')}`);
  console.error('\n   → 링크 to 값을 정식 경로로 고치거나, 동적 SPA면 SafeLink DYNAMIC_PREFETCH_SKIP에 추가.');
  process.exit(1);
}
console.log(`✅ prefetch 경로 게이트 PASS — 내부 링크 전부 실재 라우트 해소 (404 prefetch 0)`);
