// One-shot generator for /rooms/ilsan/ilsanroom/ first image.
// 1200x1200 jpg + webp with "일산룸 신실장" title — deep blue + gold (room category).
import sharp from 'sharp';

const W = 1200;
const H = 1200;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%">
      <stop offset="0%"  stop-color="#1c2542"/>
      <stop offset="55%" stop-color="#10172e"/>
      <stop offset="100%" stop-color="#060912"/>
    </radialGradient>
    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#7a5a1c" stop-opacity="0"/>
      <stop offset="50%"  stop-color="#d6b25a"/>
      <stop offset="100%" stop-color="#7a5a1c" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="goldFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#ffe7a8"/>
      <stop offset="50%" stop-color="#d6b25a"/>
      <stop offset="100%" stop-color="#8a6a2c"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="0%" r="70%">
      <stop offset="0%"  stop-color="#ffe7a8" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="#ffe7a8" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#ffe7a8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#spot)"/>

  <!-- Subtle diamond pattern -->
  <g opacity="0.08" stroke="#d6b25a" stroke-width="1" fill="none">
    ${Array.from({length: 8}, (_, i) => {
      const y = 150 + i * 130;
      return Array.from({length: 10}, (_, j) => {
        const x = j * 130 - (i % 2 === 0 ? 0 : 65);
        return `<path d="M${x},${y} l65,-65 l65,65 l-65,65 z"/>`;
      }).join('');
    }).join('\n    ')}
  </g>

  <!-- Top decorative crown -->
  <g transform="translate(${W/2}, 200)" fill="none" stroke="url(#goldLine)" stroke-width="2">
    <line x1="-260" y1="0" x2="-40" y2="0"/>
    <line x1="40"   y1="0" x2="260" y2="0"/>
  </g>
  <g transform="translate(${W/2}, 200)">
    <polygon points="-22,0 0,-18 22,0 14,8 0,2 -14,8" fill="url(#goldFill)"/>
  </g>

  <!-- Category tag -->
  <g transform="translate(${W/2}, 270)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Sans KR','Apple SD Gothic Neo',sans-serif"
      font-size="36" letter-spacing="20" fill="#d6b25a" font-weight="500">P R E M I U M  R O O M</text>
  </g>

  <!-- Main title -->
  <g transform="translate(${W/2}, 510)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo','Apple SD Gothic Neo',serif"
      font-size="220" font-weight="800" fill="#ffffff" letter-spacing="12">일산룸</text>
  </g>

  <!-- Underline accent -->
  <g transform="translate(${W/2}, 580)">
    <rect x="-80" y="0" width="160" height="4" fill="url(#goldFill)"/>
  </g>

  <!-- Subtitle ribbon -->
  <g transform="translate(${W/2}, 720)">
    <rect x="-240" y="-62" width="480" height="124" rx="6" ry="6"
      fill="#1a3a6a" stroke="#d6b25a" stroke-width="2"/>
    <text x="0" y="22" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo',serif"
      font-size="92" font-weight="700" fill="#ffe7a8" letter-spacing="22">신 실 장</text>
  </g>

  <!-- Tagline -->
  <g transform="translate(${W/2}, 870)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Sans KR','Apple SD Gothic Neo',sans-serif"
      font-size="42" fill="#e8e2cf" letter-spacing="14" font-weight="500">프 리 미 엄 · 양 주 · 부 스</text>
  </g>

  <!-- Bottom divider -->
  <g transform="translate(${W/2}, 1000)">
    <line x1="-320" y1="0" x2="-50" y2="0" stroke="url(#goldLine)" stroke-width="1.5"/>
    <line x1="50"   y1="0" x2="320" y2="0" stroke="url(#goldLine)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="6" fill="url(#goldFill)"/>
  </g>

  <!-- Region tag -->
  <g transform="translate(${W/2}, 1070)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Sans KR',sans-serif"
      font-size="32" fill="#d6b25a" letter-spacing="16" font-weight="500">I L S A N</text>
  </g>

  <!-- Footer brand -->
  <g transform="translate(${W/2}, 1140)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Sans KR',sans-serif"
      font-size="26" fill="#8a9ab2" letter-spacing="20" font-weight="400">N O L C O O L</text>
  </g>

  <!-- Outer frame -->
  <rect x="60" y="60" width="${W-120}" height="${H-120}" fill="none" stroke="#c9a655" stroke-width="2" opacity="0.5"/>
  <rect x="80" y="80" width="${W-160}" height="${H-160}" fill="none" stroke="#c9a655" stroke-width="1" opacity="0.3"/>
</svg>`;

const out = '/home/user/ilsanroom/public/venues/ilsanroom-1';

const buf = await sharp(Buffer.from(svg)).resize(W, H).toBuffer();
await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(out + '.jpg');
await sharp(buf).webp({ quality: 86 }).toFile(out + '.webp');

console.log('wrote', out + '.jpg', out + '.webp');
