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
 * 출력: public/og/{slug}-v2.jpg  (clubs/nights/rooms/lounges/yojeong/hoppa · 판 이름은 src/lib/venue-file-ver.mjs catOgFile 한 곳)
 *
 * [놀쿨86-1 · 2026-11-22] 글자는 SVG <text> 로 그리지 않는다. sharp(librsvg)는 SVG 안의 @font-face 를 읽지 않아
 *   Cloudflare 빌드 서버에서는 대체 글꼴에 억지 굵기(900)를 씌워 「클럽」 · 「강남호빠」 획 끝이 깨져 나갔다(라이브 그림 원본 크기 실측 13:1x).
 *   이제 배경만 SVG 로 그리고, 글자는 sharp 글자 그림(text · fontfile = 넣어 둔 NotoSansKR-Bold.ttf)으로 그려 얹는다 —
 *   어느 컴퓨터에서 빌드해도 같은 글꼴이다(sharp 공식 문서 「new sharp → options.text.fontfile」 · v0.34.5 · 확인 2026-11-22).
 *   그림이 바뀌므로 파일 이름 판을 올린다(-v2): /og/*.jpg 는 엣지가 30일 들고 있어(max-age=2592000 · cf-cache-status HIT 실측) 같은 이름이면 옛 그림이 나간다.
 *   옛 이름 파일(clubs.jpg …)은 저장소에 그대로 둔다(이미 퍼진 공유 주소가 404 가 되지 않게).
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { catOgFile } from '../src/lib/venue-file-ver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_PATH = path.join(__dirname, 'og-fonts/NotoSansKR-Bold.ttf');
const FONT_FAMILY = 'Noto Sans KR'; // 글꼴 파일의 이름 표 1번(16번 없음) · 굵기 700 한 벌

// 카테고리 페이지 slug → 라벨/색 (venue category key와 색 일관: generate-og-1to1.mjs)
const CATS = [
  { slug: 'clubs',   label: '클럽',   bg: '#7C3AED' },
  { slug: 'nights',  label: '나이트', bg: '#EC4899' },
  { slug: 'rooms',   label: '룸',     bg: '#1E3A5F' },
  { slug: 'lounges', label: '라운지', bg: '#D4AF37' },
  { slug: 'yojeong', label: '요정',   bg: '#059669' },
  { slug: 'hoppa',   label: '호빠',   bg: '#DC2626' },
];

// [놀쿨16-1] 4 키워드 허브 카드(강남호빠·장안동호빠·건대호빠) — 목록은 data/hub-og-cards.json 한 곳(prerender 도 같은 파일을 읽는다)
const HUB_CARDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-og-cards.json'), 'utf8')).cards.filter((c) => !c.committed).map((c) => ({ slug: c.slug, label: c.label, bg: c.bg, sub: '한눈에 비교', ad: c.ad || null, oldSlugs: Array.isArray(c.oldSlugs) ? c.oldSlugs.filter((s) => /^[a-z0-9-]+$/.test(s) && s !== c.slug) : [] })); // [펩시17-2 17:0x] committed 카드(광고주 4줄 · 표준 생성기로 그려 저장소에 넣음)는 건너뛴다 — 빌드 서버 대체 글꼴로 번호가 잘리던 것
// [놀쿨86-1] oldSlugs = 판 이름을 올리기 전의 옛 이름. 허브 카드는 빌드 때만 생기고 저장소에 없으므로, 옛 이름으로도 같은 그림을 써 두어야
//   이미 퍼진 공유 주소(/og/hub-gangnam-hoppa.jpg …)가 404 가 되지 않는다. 업종 6장의 옛 이름은 저장소에 커밋되어 있어 손대지 않는다.

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// 글자 한 줄 = 넣어 둔 글꼴로 그린 투명 그림(sharp 글자 그림은 잉크 상자 크기로 잘려 나온다 — 시험 「ㅡ」 294×25)
//   자리: 가로 = 카드 가운데 · 세로 = 옛 SVG 바탕선(y)에서 글자 크기의 0.375 만큼 위가 잉크 상자 가운데(한글 · 영문 소문자 모두 이 비율)
//   글자 간격: em 비율 → Pango 단위(1/1024 pt · dpi 72 에서 1pt = 1px)
async function textLayer(str, { y, size, color = '#FFFFFF', alpha = 1, spacingEm = 0 }) {
  const attrs = [`foreground="${color}"`];
  if (alpha < 1) attrs.push(`alpha="${Math.round(alpha * 100)}%"`);
  if (spacingEm) attrs.push(`letter_spacing="${Math.round(spacingEm * size * 1024)}"`);
  const { data, info } = await sharp({
    text: { text: `<span ${attrs.join(' ')}>${esc(str)}</span>`, font: `${FONT_FAMILY} Bold ${size}`, fontfile: FONT_PATH, rgba: true, dpi: 72 },
  }).png().toBuffer({ resolveWithObject: true });
  const cy = y - 0.375 * size;
  return { input: data, left: Math.round(600 - info.width / 2), top: Math.round(cy - info.height / 2) };
}

// [펩시17-2] 광고주 4줄 카드 — 가게이름 / 닉네임 / 번호 / 광고문의 카톡 besta12 (대표님지시_한장 3절 · 가게이름이 가장 크게)
//   지금은 광고주 카드가 모두 committed(표준 생성기로 그려 저장소에 넣음)라 여기로 오지 않는다 — 오더라도 같은 글꼴 길로 그린다.
async function buildAd(c) {
  const nameSize = c.ad.shop.length >= 6 ? 170 : 200;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="${esc(c.bg)}"/>
  <rect x="150" y="880" width="900" height="8" fill="#FDE047"/>
</svg>`;
  const layers = [
    await textLayer(c.ad.shop, { y: 330, size: nameSize, spacingEm: -0.03 }),
    await textLayer(c.ad.nick, { y: 560, size: 150, color: '#FDE047' }),
    await textLayer(c.ad.phone, { y: 800, size: 150, spacingEm: -0.02 }),
    await textLayer('광고문의 카톡 besta12', { y: 1030, size: 72 }),
  ];
  return { bg, layers };
}

async function build(c) {
  if (c.ad) return buildAd(c);
  // 글자 수에 맞춘 크기 — 카드 안쪽 폭 1080 안에 들어가게(5자 200 · 4자 250 · 3자 300 · 2자 360)
  const labelSize = c.label.length >= 5 ? 200 : c.label.length >= 4 ? 250 : c.label.length >= 3 ? 300 : 360;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${esc(c.bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0a0a14;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="1080" rx="48" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
</svg>`;
  const layers = [
    await textLayer('놀쿨', { y: 320, size: 60, alpha: 0.7, spacingEm: 0.05 }),
    await textLayer(c.label, { y: 720, size: labelSize, spacingEm: -0.03 }),
    await textLayer(c.sub || '전체보기', { y: 900, size: 64, alpha: 0.85 }),
    await textLayer('nolcool.com', { y: 1090, size: 42, alpha: 0.55 }),
  ];
  return { bg, layers };
}

// 글꼴 확인 — 「클럽」 100px 잉크 상자가 넣어 둔 글꼴의 크기와 같은지 · 다르면 빌드를 멈춘다(깨진 그림을 올리지 않음 · 라이브는 앞 판 그대로)
//   잣대 170×94 = 이 컴퓨터(윈도우 · sharp 0.34.5)에서 넣어 둔 글꼴로 잰 값. 윈도우에는 같은 글꼴이 깔려 있어 가려질 수 있으므로
//   가족 이름만 바꾼 사본(어디에도 없는 이름)으로 다시 재어 같은 값을 얻었다 — 사본 없이는 맑은 고딕(대체), 사본과 함께는 Noto 모양(2026-11-22 13:3x).
//   대체 글꼴 크기도 같이 적어 둔다(빌드 기록에서 어느 쪽으로 그려졌는지 바로 보이게). 운영체제끼리 글자 맞춤 차이는 ±6px 안.
{
  const probe = async (font, fontfile) => (await sharp({ text: { text: '클럽', font, ...(fontfile ? { fontfile } : {}), rgba: true, dpi: 72 } }).png().toBuffer({ resolveWithObject: true })).info;
  const fallback = await probe('Zzqx Nofont Bold 100', null); // 어디에도 없는 가족 이름 = 그 컴퓨터의 대체 글꼴
  const mine = await probe(`${FONT_FAMILY} Bold 100`, FONT_PATH);
  const WANT = { width: 170, height: 94 };
  const ok = Math.abs(mine.width - WANT.width) <= 6 && Math.abs(mine.height - WANT.height) <= 6;
  const line = `og 글꼴 확인 — 「클럽」 100px ${mine.width}×${mine.height} (넣어 둔 글꼴 ${WANT.width}×${WANT.height} ±6 · 이 컴퓨터 대체 글꼴 ${fallback.width}×${fallback.height})`;
  if (!ok) {
    console.error(`❌ ${line} → 넣어 둔 글꼴로 그려지지 않았다. og 그림을 만들지 않고 빌드를 멈춘다.`);
    process.exit(1);
  }
  console.log(`✅ ${line}`);
}

const outDir = path.join(ROOT, 'public/og');
fs.mkdirSync(outDir, { recursive: true });

for (const c of [...CATS, ...HUB_CARDS]) {
  const { bg, layers } = await build(c);
  const file = CATS.includes(c) ? catOgFile(c.slug) : c.slug; // 업종 6장은 판 이름(-v2) · 허브 카드는 자료 파일 slug 에 판이 들어 있다
  const jpgPath = path.join(outDir, `${file}.jpg`);
  await sharp(Buffer.from(bg)).composite(layers).jpeg({ quality: 88 }).toFile(jpgPath);
  // stale SVG 정리 (참조 없음 — prerender가 .jpg만 가리킴)
  const svgPath = path.join(outDir, `${c.slug}.svg`);
  if (fs.existsSync(svgPath)) fs.rmSync(svgPath);
  const meta = await sharp(jpgPath).metadata();
  const size = fs.statSync(jpgPath).size;
  console.log(`✅ ${file}.jpg ${meta.width}×${meta.height} (${(size/1024).toFixed(1)}KB) — ${c.label}`);
  for (const old of c.oldSlugs || []) {
    fs.copyFileSync(jpgPath, path.join(outDir, `${old}.jpg`));
    console.log(`   ↳ ${old}.jpg (옛 이름 · 같은 그림 — 이미 퍼진 공유 주소용)`);
  }
}
console.log(`\n총 ${CATS.length}개 카테고리 + ${HUB_CARDS.length}개 허브 1:1 OG JPG 생성 완료 (stale SVG 제거)`);
