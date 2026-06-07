/**
 * 카테고리 페이지 OG 이미지 생성 (1200x1200, 1:1) — 6 카테고리 브랜드 카드.
 *
 * 왜: 카테고리 og:image가 .svg(1200×630)였음 → FB/X/카톡 스크레이퍼는 SVG 미렌더 +
 * sans-serif 한글 = 두부. sharp로 임베드 한글폰트(NotoSansKR-Bold) SVG→JPG 변환 →
 * 모든 소셜에서 한글 정상 렌더 + 1:1.
 *
 * 브랜드 카드(카테고리 라벨 텍스트)일 뿐 실사진/창작 사진 아님.
 * venue og 파이프라인(generate-og-1to1.mjs)과 같은 폰트 임베드 패턴 재사용.
 *
 * 출력: public/og/{slug}.jpg  (clubs/nights/rooms/lounges/yojeong/hoppa)
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_PATH = path.join(__dirname, 'og-fonts/NotoSansKR-Bold.ttf');
const FONT_B64 = fs.readFileSync(FONT_PATH).toString('base64');

// 카테고리 페이지 slug → 라벨/색 (venue category key와 색 일관: generate-og-1to1.mjs)
const CATS = [
  { slug: 'clubs',   label: '클럽',   bg: '#7C3AED' },
  { slug: 'nights',  label: '나이트', bg: '#EC4899' },
  { slug: 'rooms',   label: '룸',     bg: '#1E3A5F' },
  { slug: 'lounges', label: '라운지', bg: '#D4AF37' },
  { slug: 'yojeong', label: '요정',   bg: '#059669' },
  { slug: 'hoppa',   label: '호빠',   bg: '#DC2626' },
];

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function buildSvg(c) {
  const labelSize = c.label.length >= 3 ? 300 : 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${esc(c.bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0a0a14;stop-opacity:1"/>
    </linearGradient>
    <style>
      @font-face { font-family: 'KO'; src: url(data:font/ttf;base64,${FONT_B64}) format('truetype'); }
    </style>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="1080" rx="48" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <text x="600" y="320" text-anchor="middle" font-family="KO" font-size="60" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="0.05em">놀쿨</text>
  <text x="600" y="720" text-anchor="middle" font-family="KO" font-size="${labelSize}" font-weight="900" fill="#FFFFFF" letter-spacing="-0.03em">${esc(c.label)}</text>
  <text x="600" y="900" text-anchor="middle" font-family="KO" font-size="64" font-weight="600" fill="rgba(255,255,255,0.85)">전체보기</text>
  <text x="600" y="1090" text-anchor="middle" font-family="KO" font-size="42" font-weight="700" fill="rgba(255,255,255,0.55)">nolcool.com</text>
</svg>`;
}

const outDir = path.join(ROOT, 'public/og');
fs.mkdirSync(outDir, { recursive: true });

for (const c of CATS) {
  const svg = buildSvg(c);
  const jpgPath = path.join(outDir, `${c.slug}.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(jpgPath);
  // stale SVG 정리 (참조 없음 — prerender가 .jpg만 가리킴)
  const svgPath = path.join(outDir, `${c.slug}.svg`);
  if (fs.existsSync(svgPath)) fs.rmSync(svgPath);
  const meta = await sharp(jpgPath).metadata();
  const size = fs.statSync(jpgPath).size;
  console.log(`✅ ${c.slug}.jpg ${meta.width}×${meta.height} (${(size/1024).toFixed(1)}KB) — ${c.label}`);
}
console.log(`\n총 ${CATS.length}개 카테고리 1:1 OG JPG 생성 완료 (stale SVG 제거)`);
