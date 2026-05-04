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
  const nameLen = v.nameKo.length;
  const nameSize = nameLen > 12 ? 110 : nameLen > 9 ? 130 : nameLen > 6 ? 150 : 170;
  const nick = v.nick || '';
  const nickLine = nick
    ? `<text x="600" y="820" text-anchor="middle" font-family="KO" font-size="${nick.length > 4 ? 130 : 150}" font-weight="900" fill="#FCD34D" letter-spacing="0.02em">${esc(nick)}</text>
       <text x="600" y="900" text-anchor="middle" font-family="KO" font-size="42" font-weight="600" fill="rgba(255,255,255,0.7)">담당 닉네임</text>`
    : '';
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
  <rect x="500" y="140" width="200" height="64" rx="32" fill="rgba(255,255,255,0.18)"/>
  <text x="600" y="184" text-anchor="middle" font-family="KO" font-size="40" font-weight="900" fill="white">${esc(label)}</text>
  ${v.region ? `<text x="600" y="270" text-anchor="middle" font-family="KO" font-size="48" font-weight="700" fill="rgba(255,255,255,0.85)">${esc(v.region)}</text>` : ''}
  <text x="600" y="${nick ? 480 : 600}" text-anchor="middle" font-family="KO" font-size="${nameSize}" font-weight="900" fill="white" letter-spacing="-0.02em">${esc(v.nameKo)}</text>
  ${nick ? `<line x1="400" y1="600" x2="800" y2="600" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
            <text x="600" y="700" text-anchor="middle" font-family="KO" font-size="48" font-weight="600" fill="rgba(255,255,255,0.7)">실시간 응대</text>` : ''}
  ${nickLine}
  <text x="600" y="1100" text-anchor="middle" font-family="KO" font-size="44" font-weight="700" fill="rgba(255,255,255,0.6)">놀쿨 — nolcool.com</text>
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
