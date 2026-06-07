#!/usr/bin/env node
/**
 * 놀쿨 OG 자산 게이트 (★재발 방지 — 시즌91/4단계).
 *
 * 막는 것:
 *   1) 공개(색인) 페이지 og:image가 .svg  → 소셜 스크레이퍼(FB/X/카톡)는 SVG 미렌더 = 빈 카드.
 *   2) 6 카테고리 og JPG 치수 ≠ 1200×1200 → 1:1 깨짐.
 *   3) 카테고리 og JPG 두부/빈카드(글리프 누락) → 흰 텍스트 픽셀 비율로 탐지.
 *      JPG는 래스터라이즈되어 글리프가 박히므로 소비자 폰트 의존 0. 단 생성 시 폰트가
 *      안 먹으면 빈 카드가 됨 → 흰 텍스트 픽셀이 거의 0 → 차단(woman 두부 교훈).
 *
 * dist(og:image 메타) + public/og(JPG 실측) 양쪽을 본다 → 빌드(prerender) 후 실행.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIST = 'dist';
const CAT_SLUGS = ['clubs', 'nights', 'rooms', 'lounges', 'yojeong', 'hoppa'];
const WHITE_MIN = 1.5;   // % — 이하면 빈 카드/두부(텍스트 미렌더)
const WHITE_MAX = 20.0;  // % — 이상이면 솔리드 블록(글리프 깨짐)

if (!existsSync(join(DIST, 'index.html'))) { console.log('⏭️  dist 없음 — 빌드 후 실행'); process.exit(0); }

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}
function ogImage(html) {
  const m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

const errors = [];

// ── 1) dist 전 페이지 og:image .svg 차단 ──
let svgOg = 0, pagesChecked = 0;
for (const f of walk(DIST)) {
  const html = readFileSync(f, 'utf8');
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) continue; // 비색인은 제외
  const og = ogImage(html);
  pagesChecked++;
  if (og && /\.svg(\?|$)/i.test(og)) {
    svgOg++;
    if (svgOg <= 5) errors.push(`og:image SVG (스크레이퍼 미렌더): ${f.replace(/^dist/, '')} → ${og}`);
  }
}

// ── 2)+3) 6 카테고리 og JPG 치수 1200² + 두부/빈카드 ──
for (const slug of CAT_SLUGS) {
  const jpg = `public/og/${slug}.jpg`;
  if (!existsSync(jpg)) { errors.push(`카테고리 og 누락: ${jpg}`); continue; }
  // stale .svg 가 남아있으면(미참조) 경고성 차단 — 동일 slug .svg/.jpg 공존 금지
  if (existsSync(`public/og/${slug}.svg`)) errors.push(`stale 카테고리 og SVG 잔존(미정리): public/og/${slug}.svg`);
  let meta, raw;
  try {
    meta = await sharp(jpg).metadata();
    raw = await sharp(jpg).raw().toBuffer({ resolveWithObject: true });
  } catch (e) { errors.push(`${jpg} 디코드 실패: ${e.message}`); continue; }
  if (meta.format !== 'jpeg') errors.push(`${jpg} 포맷 ${meta.format} (jpeg 아님)`);
  if (meta.width !== 1200 || meta.height !== 1200) errors.push(`${jpg} 치수 ${meta.width}×${meta.height} (1200×1200 아님)`);
  const { data, info } = raw;
  const ch = info.channels, total = info.width * info.height;
  let white = 0;
  for (let i = 0; i < data.length; i += ch) {
    if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) white++;
  }
  const pct = 100 * white / total;
  if (pct < WHITE_MIN) errors.push(`${jpg} 두부/빈카드 의심 — 흰 텍스트 ${pct.toFixed(2)}% < ${WHITE_MIN}% (한글 미렌더)`);
  else if (pct > WHITE_MAX) errors.push(`${jpg} 글리프 깨짐 의심 — 흰 픽셀 ${pct.toFixed(2)}% > ${WHITE_MAX}% (솔리드 블록)`);
}

console.log('🖼️  OG 자산 게이트');
console.log(`   색인 페이지 og 검사 ${pagesChecked} · SVG og ${svgOg} · 카테고리 JPG ${CAT_SLUGS.length}개`);

if (errors.length) {
  console.error(`\n🛑 OG 자산 게이트 FAIL ${errors.length}건:`);
  for (const e of errors) console.error(`   ❌ ${e}`);
  console.error('\n   → 카테고리 og는 node scripts/gen-category-og.mjs 로 JPG 1200² 재생성. og:image .svg 금지.');
  process.exit(1);
}
console.log(`✅ OG 자산 게이트 PASS — 색인 og SVG 0 · 카테고리 JPG 1200² · 한글 렌더 정상`);
