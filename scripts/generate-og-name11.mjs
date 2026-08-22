/**
 * 전 업소 "가게이름" 1:1 OG 썸네일 (1200×1200) — 2026-08-22 대표 지시.
 * - 가게이름이 주인공: 초대형 텍스트(모바일 300px 축소에도 판독), 2줄 자동 분할.
 * - 광고주(staffNickname+staffPhone 보유 업소)는 닉네임+전화번호를 이름 아래 크게.
 * - MANUAL_OG_SLUGS(일산룸·명월관 수동 합성본)는 절대 건드리지 않는다.
 * - 출력: public/og/{slug}-v3.jpg  (파일명 버전업 = 엣지 캐시 무관 즉시 반영,
 *   참조는 src/lib/venue-file-ver.mjs OG_DEFAULT_VER '-v3' 단일 소스)
 * 사용: node scripts/generate-og-name11.mjs [slug]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_B64 = fs.readFileSync(path.join(__dirname, 'og-fonts/NotoSansKR-Bold.ttf')).toString('base64');

// 수동 합성 og 보호 목록 (generate-og-nickname.cjs 와 동일 기준)
const MANUAL_OG_SLUGS = new Set(['ilsanroom', 'ilsanmyeongwolgwanyojeong']);

const venuesContent = fs.readFileSync(path.join(ROOT, 'src/data/venues.ts'), 'utf-8');
const blocks = venuesContent.split(/\n  \{/);
const venues = [];
for (const block of blocks) {
  const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
  const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
  const cat = block.match(/category:\s*'([^']+)'/)?.[1];
  const nick = block.match(/staffNickname:\s*'([^']+)'/)?.[1] || '';
  const phone = block.match(/staffPhone:\s*'([^']+)'/)?.[1] || '';
  const region = block.match(/regionKo:\s*'([^']+)'/)?.[1] || '';
  if (slug && nameKo && cat) venues.push({ slug, nameKo, cat, nick, phone, region });
}

const CAT_LABEL = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const CAT_COLOR = { club: '#7C3AED', night: '#EC4899', lounge: '#D4AF37', room: '#1E3A5F', yojeong: '#059669', hoppa: '#DC2626' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 가게이름 2줄 분할 — 8자 초과 시 업종 접미(나이트/클럽/라운지/호빠/요정/룸) 또는 공백/중앙 기준 */
function splitName(name) {
  if (name.length <= 8) return [name];
  const sp = name.lastIndexOf(' ');
  if (sp >= 2 && sp <= name.length - 2) return [name.slice(0, sp), name.slice(sp + 1)];
  const m = name.match(/^(.{2,})(나이트|클럽|라운지|호빠|요정|룸)$/);
  if (m && m[1].length <= 10) return [m[1], m[2]];
  const mid = Math.ceil(name.length / 2);
  return [name.slice(0, mid), name.slice(mid)];
}

function buildSvg(v) {
  const bg = CAT_COLOR[v.cat] || '#8B5CF6';
  const label = CAT_LABEL[v.cat] || '';
  const lines = splitName(v.nameKo);
  const maxLen = Math.max(...lines.map((l) => l.length));
  // 캔버스 안전영역 1040px 안에 꽉 차게 — 한글 글리프 폭 ≈ fontSize
  const nameSize = Math.min(260, Math.floor(1040 / maxLen));
  const isAd = !!(v.nick && v.phone);
  const phoneDisp = v.phone.replace(/-/g, ' ');
  // 세로 배치: 광고주는 이름을 위로 올려 닉네임+번호 공간 확보
  const nameCenterY = isAd ? (lines.length === 2 ? 430 : 480) : (lines.length === 2 ? 540 : 600);
  const lineGap = nameSize * 1.12;
  const nameTexts = lines
    .map((l, i) => {
      const y = lines.length === 2 ? nameCenterY + (i === 0 ? -lineGap / 2 : lineGap / 2) : nameCenterY;
      return `<text x="600" y="${Math.round(y + nameSize * 0.35)}" text-anchor="middle" font-family="KO" font-size="${nameSize}" font-weight="900" fill="#FFFFFF" letter-spacing="-0.03em">${esc(l)}</text>`;
    })
    .join('\n  ');
  const nickSize = v.nick.length > 4 ? 120 : 150;
  const adBlock = isAd
    ? `<text x="600" y="800" text-anchor="middle" font-family="KO" font-size="${nickSize}" font-weight="900" fill="#FCD34D" letter-spacing="-0.02em">${esc(v.nick)}</text>
  <rect x="120" y="870" width="960" height="150" rx="75" fill="rgba(0,0,0,0.35)" stroke="rgba(252,211,77,0.7)" stroke-width="4"/>
  <text x="600" y="972" text-anchor="middle" font-family="KO" font-size="96" font-weight="900" fill="#FFFFFF" letter-spacing="0.01em">${esc(phoneDisp)}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${esc(bg)};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0a0a14;stop-opacity:1"/>
    </linearGradient>
    <style>@font-face { font-family: 'KO'; src: url(data:font/ttf;base64,${FONT_B64}) format('truetype'); }</style>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="1120" rx="48" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
  <rect x="500" y="100" width="200" height="64" rx="32" fill="rgba(255,255,255,0.22)"/>
  <text x="600" y="146" text-anchor="middle" font-family="KO" font-size="38" font-weight="900" fill="#FFFFFF">${esc(label)}</text>
  ${v.region ? `<text x="600" y="230" text-anchor="middle" font-family="KO" font-size="44" font-weight="700" fill="rgba(255,255,255,0.85)">${esc(v.region)}</text>` : ''}
  ${nameTexts}
  ${adBlock}
  <text x="600" y="1120" text-anchor="middle" font-family="KO" font-size="40" font-weight="700" fill="rgba(255,255,255,0.6)">nolcool.com</text>
</svg>`;
}

const targetSlug = process.argv[2];
const targets = (targetSlug ? venues.filter((v) => v.slug === targetSlug) : venues).filter(
  (v) => !MANUAL_OG_SLUGS.has(v.slug)
);
if (targetSlug && targets.length === 0) {
  console.error(`❌ slug "${targetSlug}" 없음 (또는 수동 보호 대상)`);
  process.exit(1);
}

const outDir = path.join(ROOT, 'public/og');
fs.mkdirSync(outDir, { recursive: true });
let adCount = 0;
for (const v of targets) {
  const jpgPath = path.join(outDir, `${v.slug}-v3.jpg`);
  await sharp(Buffer.from(buildSvg(v))).jpeg({ quality: 88 }).toFile(jpgPath);
  if (v.nick && v.phone) adCount++;
  console.log(`✅ ${v.slug}-v3.jpg — ${v.nameKo}${v.nick && v.phone ? ` / ${v.nick} ${v.phone}` : ''}`);
}
console.log(`\n총 ${targets.length}개 (광고주 오버레이 ${adCount}곳, 수동 보호 ${MANUAL_OG_SLUGS.size}곳 제외)`);
