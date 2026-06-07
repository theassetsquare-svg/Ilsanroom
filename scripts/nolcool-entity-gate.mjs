#!/usr/bin/env node
/**
 * 놀쿨 엔티티/색인 게이트 (3단계 — 재발 방지).
 *
 * dist 빌드 결과 + venues.ts를 실측해 아래를 차단한다(FAIL시 exit 1):
 *   1) addressRegion 동네라벨 — 모든 venue regionKo가 행정구역(시/도)으로 매핑돼야 함.
 *      · provinceOf(regionKo) === null 이면 신규 region 미등록 → 차단.
 *      · dist venue JSON-LD의 addressRegion이 addressLocality(동네)와 같으면 동네라벨 누출 → 차단.
 *   2) 단일묶음 tag 색인 노출 — 1업소만 묶인 tag 페이지는 noindex + sitemap 제외여야 함.
 *      · single tag HTML에 noindex 없으면 차단. sitemap.xml에 single tag URL 있으면 차단.
 *      · 다업소(≥2) tag는 반대로 색인 유지(sitemap 존재) 확인.
 *
 * 이미 다른 게이트가 담당(중복 title·가짜별점=dist-audit / thin 패딩=struct-fingerprint·dwell-content).
 * 본 게이트는 3단계에서 새로 도입한 2축만 본다.
 */
import fs from 'fs';
import path from 'path';
import { provinceOf, localityOf, REGION_PROVINCE } from './lib/region-admin.mjs';

const DIST = path.resolve('dist');
const fails = [];
const ok = [];
function fail(m) { fails.push(m); }
function pass(m) { ok.push(m); }

// ── venues.ts 파싱 ──
const vsrc = fs.readFileSync('src/data/venues.ts', 'utf8');
const blocks = vsrc.split(/(?=^\s+id:\s*'v-\d+')/m).slice(1);
const venues = [];
for (const b of blocks) {
  const slug = (b.match(/slug:\s*'([^']+)'/) || [])[1];
  const region = (b.match(/region:\s*'([^']*)'/) || [])[1];
  const regionKo = (b.match(/regionKo:\s*'([^']*)'/) || [])[1];
  const cat = (b.match(/category:\s*'([^']+)'/) || [])[1];
  const tm = b.match(/tags:\s*\[([^\]]*)\]/);
  const tags = tm ? (tm[1].match(/'([^']+)'/g) || []).map((s) => s.replace(/'/g, '')) : [];
  venues.push({ slug, region, regionKo, cat, tags });
}

// ── 1) addressRegion 행정구역 매핑 전수 ──
const regionSet = [...new Set(venues.map((v) => v.regionKo).filter(Boolean))];
const unmapped = regionSet.filter((r) => !provinceOf(r));
if (unmapped.length) {
  fail(`addressRegion 미매핑 region ${unmapped.length}개 → scripts/lib/region-admin.mjs REGION_PROVINCE에 행정구역 추가 필요: ${unmapped.join(', ')}`);
} else {
  pass(`addressRegion: ${regionSet.length}개 region 전부 행정구역(시/도) 매핑됨`);
}
// 행정구역 값 자체가 시/도 형태인지 (동네 라벨이 province로 잘못 들어가지 않게)
const PROVINCE_SUFFIX = /(특별시|광역시|특별자치시|도|특별자치도)$/;
const badProvince = [...new Set(Object.values(REGION_PROVINCE))].filter((p) => !PROVINCE_SUFFIX.test(p));
if (badProvince.length) fail(`행정구역 값이 시/도 형태가 아님(동네 의심): ${badProvince.join(', ')}`);

// ── dist venue JSON-LD addressRegion 실측 ──
function catPath(cat) {
  return { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' }[cat] || cat;
}
let regionChecked = 0;
let regionLeak = 0;
for (const v of venues) {
  const cp = catPath(v.cat);
  const rp = ['club', 'room', 'yojeong'].includes(v.cat)
    ? path.join(DIST, cp, v.region, v.slug, 'index.html')
    : path.join(DIST, cp, v.slug, 'index.html');
  if (!fs.existsSync(rp)) continue;
  const html = fs.readFileSync(rp, 'utf8');
  const ar = html.match(/"addressRegion"\s*:\s*"([^"]+)"/);
  if (!ar) continue;
  regionChecked++;
  const expected = provinceOf(v.regionKo);
  if (expected && ar[1] !== expected) { regionLeak++; if (regionLeak <= 5) fail(`${v.slug}: addressRegion "${ar[1]}" ≠ 행정구역 "${expected}" (동네라벨 누출)`); }
}
if (regionChecked && !regionLeak) pass(`dist venue JSON-LD addressRegion ${regionChecked}곳 전부 행정구역 일치`);
if (!regionChecked) pass('dist venue JSON-LD 미발견(빌드 전 단독 실행) — 소스 매핑만 검증');

// ── 2) 단일묶음 tag noindex + sitemap 제외 ──
const tagCount = {};
for (const v of venues) for (const t of v.tags) tagCount[t] = (tagCount[t] || 0) + 1;
const singleTags = Object.keys(tagCount).filter((t) => tagCount[t] === 1);
const multiTags = Object.keys(tagCount).filter((t) => tagCount[t] >= 2);

const sitemapPath = path.join(DIST, 'sitemap.xml');
const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
if (!sitemap) {
  pass('sitemap.xml 미발견(빌드 전 단독 실행) — tag 색인 검증 건너뜀');
} else {
  let singleNoindexBad = 0;
  let singleInSitemap = 0;
  for (const t of singleTags) {
    const enc = encodeURIComponent(t);
    const hp = path.join(DIST, 'tag', t, 'index.html');
    if (fs.existsSync(hp)) {
      const h = fs.readFileSync(hp, 'utf8');
      if (!/content="noindex/.test(h)) { singleNoindexBad++; if (singleNoindexBad <= 5) fail(`단일묶음 tag #${t} 페이지에 noindex 없음 (venue와 경쟁)`); }
    }
    if (sitemap.includes(`/tag/${enc}/`)) { singleInSitemap++; if (singleInSitemap <= 5) fail(`단일묶음 tag #${t} 가 sitemap에 노출됨 (색인 요청 금지)`); }
  }
  if (!singleNoindexBad && !singleInSitemap) pass(`단일묶음 tag ${singleTags.length}개 전부 noindex + sitemap 제외`);

  // 다업소 tag는 색인 유지 확인 (최소 1개 sitemap 존재 — 회귀로 전부 noindex 되는 일 방지)
  const multiInSitemap = multiTags.filter((t) => sitemap.includes(`/tag/${encodeURIComponent(t)}/`)).length;
  if (multiTags.length && multiInSitemap === 0) fail(`다업소 tag ${multiTags.length}개가 sitemap에서 전부 사라짐 (색인 가치 손실 회귀)`);
  else if (multiTags.length) pass(`다업소 tag ${multiInSitemap}/${multiTags.length}개 sitemap 색인 유지`);
}

// ── 결과 ──
console.log('🔎 엔티티/색인 게이트');
for (const m of ok) console.log(`   ✅ ${m}`);
if (fails.length) {
  console.error(`\n🛑 엔티티 게이트 FAIL ${fails.length}건:`);
  for (const m of fails) console.error(`   ❌ ${m}`);
  process.exit(1);
}
console.log(`✅ 엔티티/색인 게이트 PASS — region ${regionSet.length} 행정구역 / 단일tag ${singleTags.length} noindex / 다업소tag ${multiTags.length} 색인`);
