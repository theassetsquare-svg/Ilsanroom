// One-shot generator for /yojeong/ilsan/ilsanmyeongwolgwanyojeong/ first image.
// Produces 1200x1200 jpg + webp with "일산명월관 신실장" title for Google image SEO.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const W = 1200;
const H = 1200;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="sky" cx="50%" cy="38%" r="75%">
      <stop offset="0%"  stop-color="#1e2a4a"/>
      <stop offset="55%" stop-color="#0e1530"/>
      <stop offset="100%" stop-color="#05070f"/>
    </radialGradient>
    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ffe7a8" stop-opacity="0.55"/>
      <stop offset="60%"  stop-color="#ffe7a8" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffe7a8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moon" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#fff7d8"/>
      <stop offset="70%"  stop-color="#ffd97a"/>
      <stop offset="100%" stop-color="#e8b85a"/>
    </radialGradient>
    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#8a6a2c" stop-opacity="0"/>
      <stop offset="50%"  stop-color="#d6b25a"/>
      <stop offset="100%" stop-color="#8a6a2c" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="${W}" height="${H}" fill="url(#sky)"/>

  <!-- Stars -->
  ${Array.from({length: 110}, () => {
    const x = (Math.random()*W).toFixed(1);
    const y = (Math.random()*H*0.62).toFixed(1);
    const r = (Math.random()*1.6 + 0.4).toFixed(2);
    const o = (Math.random()*0.6 + 0.25).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${o}"/>`;
  }).join('\n  ')}

  <!-- Moon glow + moon -->
  <circle cx="920" cy="280" r="260" fill="url(#moonGlow)"/>
  <circle cx="920" cy="280" r="130" fill="url(#moon)"/>
  <circle cx="880" cy="250" r="14" fill="#e8b85a" opacity="0.45"/>
  <circle cx="940" cy="305" r="9"  fill="#e8b85a" opacity="0.45"/>
  <circle cx="905" cy="320" r="6"  fill="#e8b85a" opacity="0.35"/>

  <!-- Distant mountain silhouette -->
  <path d="M0,840 L160,720 L300,790 L460,690 L640,800 L820,720 L980,810 L1200,740 L1200,1200 L0,1200 Z" fill="#0a0f22" opacity="0.95"/>
  <path d="M0,900 L220,820 L420,880 L620,800 L820,880 L1020,830 L1200,890 L1200,1200 L0,1200 Z" fill="#070b1a"/>

  <!-- Bamboo accent left -->
  <g opacity="0.32" stroke="#5a7a4a" stroke-width="4" fill="none">
    <path d="M70,1200 C 60,1000 90,820 70,620"/>
    <path d="M120,1200 C 110,1040 140,860 120,700"/>
    <path d="M40,1200 C 50,1080 30,940 50,800"/>
  </g>
  <g opacity="0.45" fill="#7a9a5a">
    <ellipse cx="80"  cy="900"  rx="22" ry="6" transform="rotate(-30 80 900)"/>
    <ellipse cx="60"  cy="760"  rx="22" ry="6" transform="rotate(-25 60 760)"/>
    <ellipse cx="130" cy="820"  rx="22" ry="6" transform="rotate(35 130 820)"/>
    <ellipse cx="110" cy="980"  rx="22" ry="6" transform="rotate(40 110 980)"/>
  </g>

  <!-- Gold frame -->
  <rect x="60" y="60" width="${W-120}" height="${H-120}" fill="none" stroke="#c9a655" stroke-width="2" opacity="0.55"/>
  <rect x="80" y="80" width="${W-160}" height="${H-160}" fill="none" stroke="#c9a655" stroke-width="1" opacity="0.35"/>

  <!-- Top tag -->
  <g transform="translate(${W/2}, 180)">
    <line x1="-220" y1="0" x2="-60" y2="0" stroke="url(#goldLine)" stroke-width="2"/>
    <line x1="60"   y1="0" x2="220" y2="0" stroke="url(#goldLine)" stroke-width="2"/>
    <text x="0" y="10" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo','Apple SD Gothic Neo',serif"
      font-size="38" letter-spacing="14" fill="#e6c878" font-weight="500">정 발 산  요 정</text>
  </g>

  <!-- Main title -->
  <g transform="translate(${W/2}, 470)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo','Apple SD Gothic Neo',serif"
      font-size="180" font-weight="700" fill="#ffffff" letter-spacing="6">일산명월관</text>
  </g>

  <!-- Subtitle ribbon -->
  <g transform="translate(${W/2}, 640)">
    <rect x="-220" y="-58" width="440" height="116" rx="8" ry="8"
      fill="#8a1a2a" stroke="#c9a655" stroke-width="2"/>
    <text x="0" y="20" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo','Apple SD Gothic Neo',serif"
      font-size="84" font-weight="700" fill="#ffe7a8" letter-spacing="20">신 실 장</text>
  </g>

  <!-- Tagline -->
  <g transform="translate(${W/2}, 790)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo','Apple SD Gothic Neo',serif"
      font-size="40" fill="#e8e2cf" letter-spacing="10" font-weight="400">한 정 식 · 국 악 · 프 라 이 빗 룸</text>
  </g>

  <!-- Bottom seal -->
  <g transform="translate(${W/2}, 980)">
    <line x1="-300" y1="0" x2="-90" y2="0" stroke="url(#goldLine)" stroke-width="1.5"/>
    <line x1="90"   y1="0" x2="300" y2="0" stroke="url(#goldLine)" stroke-width="1.5"/>
    <g transform="translate(0,0)">
      <rect x="-42" y="-42" width="84" height="84" fill="#8a1a2a" stroke="#c9a655" stroke-width="2"/>
      <text x="0" y="12" text-anchor="middle"
        font-family="'Noto Serif KR','Nanum Myeongjo',serif"
        font-size="44" fill="#ffe7a8" font-weight="700">料</text>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(${W/2}, 1100)">
    <text x="0" y="0" text-anchor="middle"
      font-family="'Noto Serif KR','Nanum Myeongjo',serif"
      font-size="34" fill="#c9a655" letter-spacing="22" font-weight="500">N O L C O O L</text>
  </g>
</svg>`;

const out = '/home/user/ilsanroom/public/venues/ilsanmyeongwolgwanyojeong-1';

const buf = await sharp(Buffer.from(svg))
  .resize(W, H)
  .toBuffer();

await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(out + '.jpg');
await sharp(buf).webp({ quality: 86 }).toFile(out + '.webp');

console.log('wrote', out + '.jpg', out + '.webp');
