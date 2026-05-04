/**
 * 1:1 OG 이미지 생성 (1200x1200) — 가게이름 + 닉네임 텍스트
 * 사용: node scripts/generate-og-1to1.mjs <slug>
 * 폰트: scripts/og-fonts/NotoSansKR-Bold.ttf (base64 임베드)
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_PATH = path.join(__dirname, 'og-fonts/NotoSansKR-Bold.ttf');
const FONT_B64 = fs.readFileSync(FONT_PATH).toString('base64');

const venuesContent = fs.readFileSync(path.join(ROOT, 'src/data/venues.ts'), 'utf-8');
const blocks = venuesContent.split(/\n  \{/);
const venues = [];
for (const block of blocks) {
  const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
  const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
  const cat = block.match(/category:\s*'([^']+)'/)?.[1];
  const nick = block.match(/staffNickname:\s*'([^']+)'/)?.[1];
  const region = block.match(/regionKo:\s*'([^']+)'/)?.[1];
  if (slug && nameKo && cat) venues.push({ slug, nameKo, cat, nick, region });
}

const CAT_LABEL = { club:'클럽', night:'나이트', lounge:'라운지', room:'룸', yojeong:'요정', hoppa:'호빠' };
const CAT_COLOR = { club:'#7C3AED', night:'#EC4899', lounge:'#D4AF37', room:'#1E3A5F', yojeong:'#059669', hoppa:'#DC2626' };

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function buildSvg(v) {
  const label = CAT_LABEL[v.cat] || '';
  const bg = CAT_COLOR[v.cat] || '#8B5CF6';
  const nick = v.nick || '';
  // 닉네임이 메인 — 가장 크게
  const nickSize = nick.length > 5 ? 280 : nick.length > 3 ? 340 : 400;
  // 가게이름은 상단 작게
  const nameLen = v.nameKo.length;
  const nameSize = nameLen > 12 ? 56 : nameLen > 9 ? 64 : nameLen > 6 ? 72 : 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${esc(bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0a0a14;stop-opacity:1"/>
    </linearGradient>
    <style>
      @font-face { font-family: 'KO'; src: url(data:font/ttf;base64,${FONT_B64}) format('truetype'); }
    </style>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="1080" rx="48" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <!-- 상단: 카테고리 배지 + 지역 -->
  <rect x="500" y="130" width="200" height="60" rx="30" fill="rgba(255,255,255,0.2)"/>
  <text x="600" y="172" text-anchor="middle" font-family="KO" font-size="36" font-weight="900" fill="white">${esc(label)}</text>
  ${v.region ? `<text x="600" y="240" text-anchor="middle" font-family="KO" font-size="40" font-weight="700" fill="rgba(255,255,255,0.7)">${esc(v.region)}</text>` : ''}
  <!-- 가게이름 (작게, 상단) -->
  <text x="600" y="340" text-anchor="middle" font-family="KO" font-size="${nameSize}" font-weight="700" fill="rgba(255,255,255,0.9)" letter-spacing="-0.02em">${esc(v.nameKo)}</text>
  <!-- 닉네임 (메인 — 가장 크게) -->
  ${nick ? `<text x="600" y="${nick.length > 3 ? 720 : 780}" text-anchor="middle" font-family="KO" font-size="${nickSize}" font-weight="900" fill="#FCD34D" letter-spacing="-0.04em">${esc(nick)}</text>
            <text x="600" y="900" text-anchor="middle" font-family="KO" font-size="44" font-weight="600" fill="rgba(255,255,255,0.8)">담당자에게 직접 연락</text>` : ''}
  <!-- 하단 도메인 -->
  <text x="600" y="1090" text-anchor="middle" font-family="KO" font-size="42" font-weight="700" fill="rgba(255,255,255,0.55)">놀쿨 — nolcool.com</text>
</svg>`;
}

const targetSlug = process.argv[2];
const targets = targetSlug ? venues.filter(v => v.slug === targetSlug) : venues;
if (targetSlug && targets.length === 0) {
  console.error(`❌ slug "${targetSlug}" not found`);
  process.exit(1);
}

const outDir = path.join(ROOT, 'public/og');
fs.mkdirSync(outDir, { recursive: true });

for (const v of targets) {
  const svg = buildSvg(v);
  const jpgPath = path.join(outDir, `${v.slug}.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(jpgPath);
  const size = fs.statSync(jpgPath).size;
  console.log(`✅ ${v.slug}.jpg (${(size/1024).toFixed(1)}KB) — ${v.nameKo}${v.nick ? ' / ' + v.nick : ''}`);
}
console.log(`\n총 ${targets.length}개 1:1 OG 이미지 생성 완료`);
