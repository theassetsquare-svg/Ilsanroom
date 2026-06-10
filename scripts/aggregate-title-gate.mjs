#!/usr/bin/env node
/**
 * 놀쿨 집계 허브 title 차별화 빌드게이트 (★재발 방지 — 시즌176).
 *
 * 배경: dwell-content / title-uniqueness 라이브 watch는 MAX_PAGES=200으로 잘려
 *   sitemap idx 204+의 집계 허브(best/new/tag/near/region) 170장을 아예 안 본다.
 *   그래서 region 49장이 동일 후미 "클럽·라운지·룸·요정 한눈에"를 공유해도 어떤
 *   watch/게이트도 못 잡았다(2026-06-10 발견). Google: 유니크 URL에 차별화 안 된
 *   templated title = thin 신호 → 가시성 억제. CLAUDE.md #0 규칙1(후미 unique) 위반.
 *
 * 막는 것 (집계 허브 전수, venue-grade가 아닌 relaxed 기준 — 허브는 region/태그
 *   접두어가 자연히 prefix에 오므로 후미 tail-5 완전 unique는 구조상 불가. 대신
 *   "동일 후미 문구가 과도하게 반복되는 templated 지문"을 막는다):
 *   1) 전체 title 완전중복 0 (Google hard rule — 두 URL이 같은 <title> 금지)
 *   2) 동일 후미(tail-5) 반복 ≤ MAX_SUFFIX_REPEAT (49-동일 templated 회귀 차단)
 *   3) 후킹 5축 통과(analyzeHook) — 끝까지 안 읽히는 약한 허브 title 금지
 *   4) title ≤ 60자 + 단어 중복 0
 *   5) region-cross 약한 템플릿 마커 잔존 0
 *
 * venue/카테고리/매거진/랜딩 title(비집계 203장)은 title-uniqueness-gate가 tail-5≥2로
 *   엄격 잠그고, 집계 허브(170장)는 이 게이트가 relaxed로 잠근다 → 둘이 374장 전수 커버.
 *   본문 분량은 의도적으로 안 본다: 집계 허브는 얇은 인덱스가 정상이고 2000자 강제 =
 *   scaled-content 패딩(CLAUDE.md #5 금지). 본문 천장은 dist-stuffing-gate(3.5%)가 담당.
 *
 * dist/{path}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeHook } from './lib/hook-detector.mjs';

const DIST = 'dist';
const AGG = /\/(best|new|tag|near|region)\//;
const MAX_SUFFIX_REPEAT = 14; // 분산 후 실측 최대 9 + 성장 여유. 49-동일 회귀는 즉시 차단.
const TEMPLATE_MARKER = '한눈에 비교하고 고르기'; // region-cross 약한 템플릿 회귀 마커

function lastNTokens(title, n = 5) {
  const cleaned = title.replace(/.*?[—\-:|]/, '').trim();
  return cleaned.split(/\s+/).filter(Boolean).slice(-n).join(' ');
}

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }
if (!existsSync(join(DIST, 'sitemap.xml'))) { console.log('⏭️  dist/sitemap.xml 없음 — prerender 후 실행'); process.exit(0); }

const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'))
  .filter(u => AGG.test(u)); // 집계 허브만

const titles = new Map(); // path → title
for (const u of urls) {
  const path = decodeURIComponent(u.replace('https://nolcool.com', ''));
  const rel = join(path.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  const fp = join(DIST, rel);
  if (!existsSync(fp)) continue;
  const m = readFileSync(fp, 'utf8').match(/<title>([^<]+)<\/title>/);
  if (m) titles.set(path, m[1].trim());
}

console.log(`🧩 집계 허브 title 게이트 — 색인 집계 title ${titles.size}개`);
const errors = [];

// 1) 전체 title 완전중복 0
const fullMap = new Map();
for (const [path, title] of titles) {
  if (!fullMap.has(title)) fullMap.set(title, []);
  fullMap.get(title).push(path);
}
for (const [title, arr] of fullMap) {
  if (arr.length >= 2) errors.push(`전체 title 완전중복 "${title}" → ${arr.slice(0, 4).join(', ')}${arr.length > 4 ? ` 외 ${arr.length - 4}` : ''}`);
}

// 2) 동일 후미 과반복 (templated 지문)
const suffixMap = new Map();
for (const [path, title] of titles) {
  const sfx = lastNTokens(title, 5);
  if (!sfx) continue;
  if (!suffixMap.has(sfx)) suffixMap.set(sfx, []);
  suffixMap.get(sfx).push(path);
}
for (const [sfx, arr] of suffixMap) {
  if (arr.length > MAX_SUFFIX_REPEAT) errors.push(`후미 과반복 "${sfx}" ${arr.length}회 (>${MAX_SUFFIX_REPEAT}) → ${arr.slice(0, 3).join(', ')} 외`);
}

// 3) 후킹 5축 0
const noHook = [];
for (const [path, title] of titles) {
  if (!analyzeHook(title).passed) noHook.push(path);
}
if (noHook.length) errors.push(`후킹 5축 0 — ${noHook.length}개 (예: ${noHook.slice(0, 5).join(', ')})`);

// 4) 60자 초과 + 단어 중복
for (const [path, title] of titles) {
  if (title.length > 60) errors.push(`title ${title.length}자 (>60) → ${path}`);
  const words = title.replace(/[—,.\-·]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const dup = words.filter((w, i) => words.indexOf(w) !== i);
  if (dup.length) errors.push(`title 단어중복 [${[...new Set(dup)].join(',')}] → ${path}`);
}

// 5) 약한 템플릿 마커 잔존
for (const [path, title] of titles) {
  if (title.includes(TEMPLATE_MARKER)) errors.push(`약한 템플릿 "${TEMPLATE_MARKER}" 잔존 → ${path}`);
}

if (errors.length) {
  console.error(`\n❌ 집계 허브 title 게이트 FAIL — ${errors.length}건`);
  errors.slice(0, 40).forEach(e => console.error(`   · ${e}`));
  if (errors.length > 40) console.error(`   … 외 ${errors.length - 40}건`);
  process.exit(1);
}
console.log(`✅ 집계 허브 title 게이트 PASS — 완전중복0·후미반복≤${MAX_SUFFIX_REPEAT}·후킹5축·60자·단어중복0·템플릿0`);
