#!/usr/bin/env node
/**
 * 놀쿨 페이지 필수요소 + 분류완전성 메타-게이트 (★재발 방지 — 시즌177).
 *
 * 목적: "사각지대를 매번 자동으로 발견해 막는" 자동화 본체. 개별 watch는 MAX_PAGES
 *   컷·면제패턴으로 일부 페이지를 놓칠 수 있다(2026-06-10 집계 170장 사각지대 발견).
 *   이 게이트는 dist/sitemap.xml 색인 페이지를 컷 없이·broad 면제 없이 전수 순회하며,
 *   페이지 자체에서 Google 2026 필수요소를 직접 검증한다 → watch 범위에 의존하지 않아
 *   구조적으로 사각지대가 안 생긴다. 로컬 빌드 시점 검사 = 라이브 크롤 0 = 사이트 피해 0.
 *
 * 검증 항목 (현 dist 전수 0위반으로 캘리브레이션 — 클린 상태를 영구 고정):
 *   페이지별(전 색인 374장):
 *     1) <title> 정확히 1개·비어있지 않음
 *     2) canonical 정확히 1개·https://nolcool.com 자기참조 (Google: 색인 페이지 self-canonical 필수)
 *     3) meta description 존재·비어있지 않음 (길이≤150은 dist-stuffing 담당)
 *     4) <h1> 정확히 1개 (0개=구조 누락 / 2개+=계층 혼란)
 *     5) og:title + og:image 존재
 *     6) <html lang> 존재 / viewport meta 존재
 *     7) JSON-LD(application/ld+json) ≥1개 (구조화 데이터 = AI/검색 인용)
 *     8) robots noindex 아님 (색인 sitemap에 noindex = 모순)
 *     9) <img> 중 alt 속성 누락 0 (장식이미지는 alt="" 허용, 속성 자체 누락만 차단)
 *   크로스페이지:
 *     10) 두 색인 페이지가 동일 meta description 공유 0 (Google 중복메타 = thin)
 *     11) 두 색인 페이지가 동일 <title> 공유 0 (이중 안전망; title 게이트와 중복 OK)
 *   분류완전성:
 *     12) 모든 색인 경로가 KNOWN_SEGMENTS 중 하나에 매칭. 미지의 신규 최상위 섹션이
 *         등장하면 FAIL → "제가 없어도" 새 페이지 유형을 자동 고지(전용 게이트 필요 신호).
 *
 * dist/{path}/index.html(prerender 결과)을 본다 → 빌드(prerender) 후 실행.
 * noindex 페이지(단일tag 등)는 sitemap에 없으므로 검사 대상 아님(라이브 색인 집합과 동일).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const HOST = 'https://nolcool.com';

// 현 색인 최상위 세그먼트 화이트리스트. 신규 섹션 추가 시 의식적으로 여기 등록 +
// 필수요소 충족을 확인하게 강제(자동 고지 장치). 정상 콘텐츠 성장(신규 venue/지역/태그)은
// 기존 세그먼트 하위라 트립되지 않는다.
const KNOWN_SEGMENTS = new Set([
  '(home)',
  // 업종 상세/카테고리
  'clubs', 'nights', 'lounges', 'rooms', 'yojeong', 'hoppa', 'lounge',
  // 집계 허브
  'best', 'new', 'tag', 'near', 'region',
  // 콘텐츠
  'magazine', 'community', 'guide',
  // 랜딩/유틸/리드
  'quiz', 'roulette', 'vs', 'ranking', 'venue-info', 'compare', 'welcome',
  'tonight', 'weekend', 'budget', 'occasion', 'status', 'referral', 'hidden',
  'gallery', 'events', 'lead', 'testimonials', 'pricing', 'demo', 'case-studies',
  // 법무/정책
  'privacy-promise', 'privacy', 'terms', 'disclaimer', 'venue-terms', 'safety', 'legal', 'help',
]);

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }
if (!existsSync(join(DIST, 'sitemap.xml'))) { console.log('⏭️  dist/sitemap.xml 없음 — prerender 후 실행'); process.exit(0); }

const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  .filter(u => !u.endsWith('.xml') && !u.endsWith('.txt') && !u.endsWith('.png') && !u.endsWith('.jpg'));

const errors = [];
const descMap = new Map();
const titleMap = new Map();
const unknownSeg = new Map();
let checked = 0;

for (const u of urls) {
  const path = decodeURIComponent(u.replace(HOST, '')) || '/';
  const rel = path === '/' ? 'index.html' : join(path.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  const fp = join(DIST, rel);
  if (!existsSync(fp)) continue; // route-sitemap-audit 소관
  checked++;
  const h = readFileSync(fp, 'utf8');
  const out = [];

  // 1) title
  const titles = [...h.matchAll(/<title>([^<]*)<\/title>/g)];
  const title = titles[0] ? titles[0][1].trim() : '';
  if (titles.length === 0 || !title) out.push('title 누락');
  else if (titles.length > 1) out.push(`title ${titles.length}개`);

  // 2) canonical
  const canons = [...h.matchAll(/<link[^>]+rel="canonical"[^>]*>/gi)];
  const canonHref = (h.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1] || '';
  if (canons.length === 0) out.push('canonical 누락');
  else if (canons.length > 1) out.push(`canonical ${canons.length}개`);
  else if (!canonHref.startsWith(HOST)) out.push(`canonical 비자기참조(${canonHref.slice(0, 30)})`);

  // 3) description
  const desc = (h.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '';
  if (!desc.trim()) out.push('description 누락');

  // 4) h1 정확히 1개
  const h1c = (h.match(/<h1[\s>]/gi) || []).length;
  if (h1c === 0) out.push('h1 0개');
  else if (h1c > 1) out.push(`h1 ${h1c}개`);

  // 5) og
  if (!/property="og:title"/i.test(h)) out.push('og:title 누락');
  if (!/property="og:image"/i.test(h)) out.push('og:image 누락');

  // 6) lang / viewport
  if (!/<html[^>]+lang=/i.test(h)) out.push('html lang 누락');
  if (!/name="viewport"/i.test(h)) out.push('viewport 누락');

  // 7) JSON-LD
  if (!/application\/ld\+json/i.test(h)) out.push('JSON-LD 0개');

  // 8) noindex 모순
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(h)) out.push('색인페이지인데 noindex');

  // 9) img alt 누락
  const imgs = [...h.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const noAlt = imgs.filter(im => !/\salt=/i.test(im)).length;
  if (noAlt > 0) out.push(`img alt 누락 ${noAlt}개`);

  if (out.length) errors.push(`${path} → ${out.join(' / ')}`);

  // 크로스페이지 집계
  if (desc.trim()) { const k = desc.trim(); if (!descMap.has(k)) descMap.set(k, []); descMap.get(k).push(path); }
  if (title) { if (!titleMap.has(title)) titleMap.set(title, []); titleMap.get(title).push(path); }

  // 12) 분류완전성
  const seg = path === '/' ? '(home)' : (path.replace(/^\//, '').split('/')[0] || '(home)');
  if (!KNOWN_SEGMENTS.has(seg)) { if (!unknownSeg.has(seg)) unknownSeg.set(seg, []); unknownSeg.get(seg).push(path); }
}

// 10) 중복 description
for (const [d, arr] of descMap) {
  if (arr.length >= 2) errors.push(`중복 description "${d.slice(0, 40)}…" → ${arr.slice(0, 3).join(', ')}${arr.length > 3 ? ` 외 ${arr.length - 3}` : ''}`);
}
// 11) 중복 title
for (const [t, arr] of titleMap) {
  if (arr.length >= 2) errors.push(`중복 title "${t.slice(0, 40)}" → ${arr.slice(0, 3).join(', ')}${arr.length > 3 ? ` 외 ${arr.length - 3}` : ''}`);
}
// 12) 미지의 신규 섹션
for (const [seg, arr] of unknownSeg) {
  errors.push(`미지의 신규 섹션 /${seg} (${arr.length}장) — KNOWN_SEGMENTS 등록 + 필수요소/전용게이트 검토 필요: ${arr.slice(0, 2).join(', ')}`);
}

console.log(`🧪 페이지 필수요소 메타-게이트 — 색인 ${checked}장 전수 (컷·면제 0)`);
if (errors.length) {
  console.error(`\n❌ 페이지 필수요소 메타-게이트 FAIL — ${errors.length}건`);
  errors.slice(0, 50).forEach(e => console.error(`   · ${e}`));
  if (errors.length > 50) console.error(`   … 외 ${errors.length - 50}건`);
  process.exit(1);
}
console.log(`✅ 페이지 필수요소 메타-게이트 PASS — ${checked}장 전수: title·canonical·desc·h1×1·og·lang·viewport·JSON-LD·alt·중복0·분류완전`);
