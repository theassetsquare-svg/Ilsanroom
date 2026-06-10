#!/usr/bin/env node
/**
 * 놀쿨 title 차별화 빌드게이트 (★재발 방지 — 시즌175).
 *
 * 막는 것: dist/sitemap.xml 색인 페이지 <title>의 구조 회귀.
 *   1) 후미 5어절이 2개 이상 페이지에서 동일 (CLAUDE.md #0 후미 unique)
 *   2) n-gram(3~5어절)이 사이트 전체 5회 초과 (표현 패턴 양산)
 *   3) 후킹 5축 0 (analyzeHook 미통과 = 끝까지 안 읽히는 약한 title)
 *   4) 약한 템플릿 마커 "한눈에 비교하고 고르기" 잔존 (지역×업종 교차 title 회귀)
 *
 * 측정 로직은 title-uniqueness-audit.mjs(KST 07:35) + region-cross-title-watch.mjs(KST 09:05)
 *   와 동일 모듈(hook-detector.mjs)을 쓴다. title 길이>60·중복단어는 dist-stuffing-gate가
 *   이미 막으므로 여기선 구조 패턴만 본다. 라이브 watch는 배포 후에 잡지만, 이 게이트는
 *   push/배포 전에 막는다(빌드게이트 본체).
 *
 * dist/{path}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeHook, ngramOverused } from './lib/hook-detector.mjs';

const DIST = 'dist';
const NGRAM_OVER = 5;
const TEMPLATE_MARKER = '한눈에 비교하고 고르기'; // region-cross 약한 템플릿 회귀 마커

function lastNTokens(title, n = 5) {
  const cleaned = title.replace(/.*?[—\-:|]/, '').trim();
  return cleaned.split(/\s+/).filter(Boolean).slice(-n).join(' ');
}

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }
if (!existsSync(join(DIST, 'sitemap.xml'))) { console.log('⏭️  dist/sitemap.xml 없음 — prerender 후 실행'); process.exit(0); }

// 집계 허브(best/new/region/tag/near) 제외: 라이브 title-uniqueness watch는 MAX_PAGES=200으로
// 잘려 sitemap idx 204+의 집계 페이지를 안 본다. 집계 허브는 의도적으로 공용 title 골격을
// 공유하는 relaxed 클래스(struct-fingerprint 집계 감사가 별도 완화 임계로 담당)다.
// 이 게이트는 watch 실범위(venue/카테고리/매거진/랜딩 title)만 잠근다.
const AGG = /\/(best|new|tag|near|region)\//;
const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'))
  .filter(u => !AGG.test(u));

const titles = new Map(); // path → title
for (const u of urls) {
  const path = decodeURIComponent(u.replace('https://nolcool.com', ''));
  const rel = path === '/' || path === '' ? 'index.html' : join(path.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  const fp = join(DIST, rel);
  if (!existsSync(fp)) continue;
  const m = readFileSync(fp, 'utf8').match(/<title>([^<]+)<\/title>/);
  if (m) titles.set(path, m[1].trim());
}

console.log(`🏷️  title 차별화 빌드게이트 — 색인 title ${titles.size}개`);
const errors = [];

// 1) 후미 5어절 중복
const suffixMap = new Map();
for (const [path, title] of titles) {
  const sfx = lastNTokens(title, 5);
  if (!sfx || sfx.length < 5) continue;
  if (!suffixMap.has(sfx)) suffixMap.set(sfx, []);
  suffixMap.get(sfx).push(path);
}
for (const [sfx, arr] of suffixMap) {
  if (arr.length >= 2) errors.push(`후미 5어절 중복 "${sfx}" → ${arr.slice(0, 4).join(', ')}${arr.length > 4 ? ` 외 ${arr.length - 4}` : ''}`);
}

// 2) n-gram 사이트 전체 5회 초과
const titlesArr = [...titles.values()];
const pathsArr = [...titles.keys()];
for (const { phrase, count, urls: u } of ngramOverused(titlesArr, pathsArr, NGRAM_OVER, 3, 5).slice(0, 20)) {
  errors.push(`n-gram 남용 "${phrase}" ${count}회 (예: ${u.slice(0, 3).join(', ')})`);
}

// 3) 후킹 5축 0
const noHook = [];
for (const [path, title] of titles) {
  if (!analyzeHook(title).passed) noHook.push(path);
}
if (noHook.length) errors.push(`후킹 5축 0 — ${noHook.length}개 (예: ${noHook.slice(0, 5).join(', ')})`);

// 4) 약한 템플릿 마커 잔존 (region-cross 회귀)
const weakTpl = [];
for (const [path, title] of titles) {
  if (title.includes(TEMPLATE_MARKER)) weakTpl.push(path);
}
if (weakTpl.length) errors.push(`약한 템플릿 "${TEMPLATE_MARKER}" 잔존 — ${weakTpl.slice(0, 5).join(', ')}`);

if (errors.length) {
  console.error(`\n❌ title 차별화 빌드게이트 FAIL — ${errors.length}건`);
  errors.slice(0, 40).forEach(e => console.error(`   · ${e}`));
  process.exit(1);
}
console.log(`✅ title 차별화 빌드게이트 PASS — 후미·n-gram·후킹5축·템플릿 전부 정상`);
