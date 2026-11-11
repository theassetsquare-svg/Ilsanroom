/**
 * 전 업소 "가게이름" 1:1 표준 카드 (1200×1200) — og:image · 목록 썸네일 · 가게 쪽 첫 그림이 모두 이 한 장.
 * [놀쿨12-2 · 대표님 13:18-7 · 2026-09-24] 새 판(-v8): 가게 이름이 가장 크게(목록 표시 100px 에서도 읽히게 — 원본 글자 높이 140px 이상)
 *   · 긴 이름은 두세 줄 자동 맞춤 · 어두운 바탕에 밝은 글자(대비 4.5:1 이상) · 쪽마다 고유(이름이 다르고 바탕 색조도 가게마다 다름)
 *   · 줄 수 = 썸네일 표준: 광고주 4줄(가게 이름 / 닉네임 / 번호 / 광고문의 카톡 besta12) · 그 밖 3줄(가게 이름 / 광고문의 / 카톡 besta12)
 *   · 광고주 = venues.ts staffNickname+staffPhone(= naver-watch data/advertisers.json 명단 + 놀쿨 명단 src/data/advertisers.nolcool.json)
 *   · [놀쿨44-1 → 일산74-1] 일산명월관요정 = 3줄(-v11 · 광고문의 · 배치 VENUE_LOOK) · 일산룸 = 3줄(-v10 · 광고문의) · 쪽 카드 = PAGE_CARD
 * - 출력: public/og/{slug}{판}.jpg (판 = src/lib/venue-file-ver.mjs ogVer · 파일 이름을 올려야 엣지 캐시가 옛 그림을 안 준다)
 * - 옛 판 파일은 지우지 않는다.
 * 사용: node scripts/generate-og-name11.mjs [slug]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { ogVer, ogOwnVer, MAGAZINE_OG, PAGE_CARD, pageKey } from '../src/lib/venue-file-ver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_B64 = fs.readFileSync(path.join(__dirname, 'og-fonts/NotoSansKR-Bold.ttf')).toString('base64');

const venuesContent = fs.readFileSync(path.join(ROOT, 'src/data/venues.ts'), 'utf-8');
const blocks = venuesContent.split(/\n  \{/);
const venues = [];
// [일산74-1 · 2026-11-12] 가게 카드 하나의 배치·색조를 따로 정하는 자리(PAGE_CARD 의 hue·variant 와 같은 뜻).
//   일산명월관요정 3줄 판을 기본 배치로 그리면 다른 가게 3줄 카드와 dHash 거리 7(닮음 잣대 10 이하)이라 오른쪽 아래 배치로 그린다(-v11 · 가장 가까운 카드와 거리 21).
const VENUE_LOOK = {
  ilsanmyeongwolgwanyojeong: { variant: 'right-low' },
};
for (const block of blocks) {
  const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
  const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
  const cat = block.match(/category:\s*'([^']+)'/)?.[1];
  const nick = block.match(/staffNickname:\s*'([^']+)'/)?.[1] || '';
  const phone = block.match(/staffPhone:\s*'([^']+)'/)?.[1] || '';
  if (slug && nameKo && cat) venues.push({ slug, nameKo, cat, nick, phone, ...(VENUE_LOOK[slug] || {}) });
}
// [놀쿨26-1 · 대표님 2026-10-04 03:43] 놀쿨 전용 광고주 명단(src/data/advertisers.nolcool.json)도 읽는다 — 명단의 매거진 쪽은 가게이름 자리에 명단의 가게 이름을 넣은 4줄 카드
//   (파일 = venue-file-ver.mjs MAGAZINE_OG · 바탕 색조는 쪽마다 다름). 명단의 가게 쪽은 venues.ts 담당 칸으로 4줄이 되고 판은 ogOwnVer(-v9).
const nolcoolAds = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/advertisers.nolcool.json'), 'utf-8')).advertisers || [];
for (const a of nolcoolAds) {
  for (const p of a.pages) {
    const id = p.match(/^\/magazine\/([^/]+)\/$/)?.[1];
    if (id && MAGAZINE_OG[id]) venues.push({ slug: `magazine-${id}`, nameKo: a.shop, cat: 'magazine', nick: a.nickname, phone: a.phone, file: MAGAZINE_OG[id] });
  }
}
// [놀쿨44-1 · 대표님 2026-10-11 18:09] 쪽 카드(src/lib/venue-file-ver.mjs PAGE_CARD) — 쪽마다 파일 하나(바탕 색조는 파일 이름마다 다름).
//   kind 'ad' = 명단에 그 쪽이 적힌 광고주의 4줄(가게이름 / 닉네임 / 번호 / 광고문의 카톡 besta12) — 명단에 없으면 그리지 않는다.
//   kind 'inquiry' = 3줄(가게이름 / 광고문의 / 카톡 besta12 · 번호 0). 부를 때: node scripts/generate-og-name11.mjs <file 이름>
for (const [route, pc] of Object.entries(PAGE_CARD)) {
  const ad = pc.kind === 'ad' ? nolcoolAds.find((a) => (a.pages || []).some((p) => pageKey(p) === pageKey(route))) : null;
  if (pc.kind === 'ad' && !ad) continue;
  venues.push({ slug: pc.file, nameKo: ad ? ad.shop : pc.shop, cat: 'page', nick: ad ? ad.nickname : '', phone: ad ? ad.phone : '', file: pc.file, hue: pc.hue, variant: pc.variant || '' }); // [구글69-1] variant: 낱말을 -로 이어 조합(variantTokens) — low(아래로) · mid(세로 가운데) · split(줄 나눔) · small(글자 0.7배) · left/right(왼쪽/오른쪽 맞춤 · 0.7배 · 세로 가운데) — 같은 글자 카드끼리 dHash(옆 칸 밝기 비교) 거리를 벌림
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const KAKAO_LINE = '광고문의 카톡 besta12';

/** 가게 이름 줄 나누기 — 한 줄 최대 글자 수(maxPer) 안에서 띄어쓰기 → 업종 꼬리(나이트·클럽…) → 고르게 */
export function splitName(name, maxPer) {
  if (name.length <= maxPer) return [name];
  // 낱말을 자르지 않는다 — 띄어쓰기로 나누고, 한 낱말이 길면 업종 꼬리(나이트·클럽…) 앞에서, 그래도 길면 반으로
  const tokens = [];
  let halved = false;
  for (const w of name.split(/\s+/).filter(Boolean)) {
    if (w.length <= maxPer) { tokens.push(w); continue; }
    const m = w.match(/^(.+?)(나이트|클럽|라운지|호빠|요정|룸)$/);
    const parts = m ? [m[1], m[2]] : [w];
    for (const p of parts) {
      if (p.length <= maxPer) tokens.push(p);
      else { const h = Math.ceil(p.length / 2); tokens.push(p.slice(0, h), p.slice(h)); halved = true; }
    }
  }
  const lines = [];
  for (const t of tokens) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + t).length <= maxPer) lines[lines.length - 1] = last + ' ' + t;
    else lines.push(t);
  }
  lines.halved = halved; // 낱말을 반으로 가른 판(고를 때 덜 좋게 친다)
  return lines;
}

/** 가게마다 다른 어두운 바탕 색조(이름 해시) — 글자 대비는 그대로(바탕 밝기 12% 이하) */
function tint(slug, fixedHue) {
  const h = crypto.createHash('md5').update(slug).digest();
  const hue = Number.isFinite(fixedHue) ? fixedHue : h[0] * 360 / 256; // [놀쿨44-1] 쪽 카드는 색조를 적어 줄 수 있다(PAGE_CARD hue — 같은 글자 카드끼리 겹치지 않게)
  return { a: `hsl(${hue.toFixed(0)},45%,11%)`, b: `hsl(${((hue + 40) % 360).toFixed(0)},40%,6%)` };
}

/** [구글69-1] variant 낱말 — 'low'(아래로 ≤300px) · 'mid'(세로 가운데) · 'split'(줄 나눔) · 'small'(글자 0.7배) · 'left'/'right'(왼쪽/오른쪽 맞춤 · 0.7배 · low 가 없으면 세로 가운데) · '-'로 이어 조합('right-low') */
export const variantTokens = (v) => new Set(String(v.variant || '').split('-').filter(Boolean));

export function layout(v) {
  const isAd = !!(v.nick && v.phone);
  // 이름 칸 세로 예산: 광고주는 아래 세 줄, 그 밖은 두 줄 자리를 남긴다
  const budget = isAd ? 560 : 640;
  let best = null;
  const vt = variantTokens(v); const want = vt.has('split'); // [구글69-1] 'split' = 가장 많은 줄(≤3)로 나눈 판(글자·색 그대로 · 배치만 다름)
  for (let maxPer = (want ? 2 : 4); maxPer <= 8; maxPer++) {
    const lines = splitName(v.nameKo, maxPer);
    if (lines.length > 3) continue;
    const longest = Math.max(...lines.map((l) => l.length));
    const size = Math.floor(Math.min(260, 1060 / longest, budget / (lines.length * 1.08)));
    const score = want ? (lines.halved ? 0 : lines.length * 1000) + size : size * (lines.halved ? 0.85 : 1); // 같은 크기면 낱말을 자르지 않은 판 · split 은 자르지 않은 판 가운데 줄 수 먼저
    if (!best || score > best.score) best = { lines, size, score };
  }
  if (vt.has('left') || vt.has('right') || vt.has('small')) best = { ...best, size: Math.floor(best.size * 0.7) }; // [구글69-1] left·right·small = 글자 0.7배(left·right 는 왼쪽·오른쪽 맞춤 · 세로 가운데 — buildSvg)
  return { isAd, ...best };
}

export function buildSvg(v) {
  const { isAd, lines, size } = layout(v);
  const t = tint(v.slug, v.hue);
  const gap = size * 1.08;
  const top0 = isAd ? 70 : 110;
  const nameBlockH = gap * lines.length;
  // [구글69-1] variant 'low' — 기본 배치의 맨 아래(카톡 줄 아래)에서 1150 까지 비는 자리 안에서(최대 300px) 전체를 아래로 내린다 · 글자·크기·색은 그대로
  const bottom0 = (() => { let yy = top0 + nameBlockH + (isAd ? 60 : 90); if (isAd) { const ns = Math.min(128, Math.floor(1000 / Math.max(2, v.nick.length)), size - 20); yy += ns * 1.2; const ps = Math.min(110, size - 30); yy += ps * 1.35; return Math.min(yy + 56, 1150) + 20; } const s2 = Math.min(120, size - 30); yy += s2 * 1.3; return yy + s2 * 0.9 + 20; })();
  const vt = variantTokens(v);
  const dy = vt.has('low') ? Math.max(0, Math.min(300, 1150 - bottom0)) : (vt.has('mid') || vt.has('left') || vt.has('right')) ? Math.max(0, Math.round((1200 - (bottom0 - top0)) / 2) - top0) : 0;
  const top = top0 + dy;
  const X = vt.has('left') ? 80 : vt.has('right') ? 1120 : 600; const anchor = vt.has('left') ? 'start' : vt.has('right') ? 'end' : 'middle'; // [구글69-1] left·right 는 모든 줄을 왼쪽(x=80)·오른쪽(x=1120)에 맞춤
  const nameTexts = lines
    .map((l, i) => `<text x="${X}" y="${Math.round(top + gap * i + size * 0.92)}" text-anchor="${anchor}" font-family="KO" font-size="${size}" font-weight="900" fill="#FFD54A" letter-spacing="-0.02em">${esc(l)}</text>`)
    .join('\n  ');
  let y = top + nameBlockH + (isAd ? 60 : 90);
  let rest = '';
  if (isAd) {
    const nickSize = Math.min(128, Math.floor(1000 / Math.max(2, v.nick.length)), size - 20);
    rest += `<text x="${X}" y="${Math.round(y + nickSize * 0.9)}" text-anchor="${anchor}" font-family="KO" font-size="${nickSize}" font-weight="900" fill="#FFFFFF">${esc(v.nick)}</text>`;
    y += nickSize * 1.2;
    const phoneSize = Math.min(110, size - 30);
    rest += `\n  <text x="${X}" y="${Math.round(y + phoneSize * 0.9)}" text-anchor="${anchor}" font-family="KO" font-size="${phoneSize}" font-weight="900" fill="#FFFFFF" letter-spacing="0.01em">${esc(v.phone.replace(/-/g, ' '))}</text>`;
    y += phoneSize * 1.35;
    rest += `\n  <text x="${X}" y="${Math.round(Math.min(y + 56, 1150))}" text-anchor="${anchor}" font-family="KO" font-size="58" font-weight="700" fill="#E8F5E9">${esc(KAKAO_LINE)}</text>`;
  } else {
    const s2 = Math.min(120, size - 30);
    rest += `<text x="${X}" y="${Math.round(y + s2 * 0.9)}" text-anchor="${anchor}" font-family="KO" font-size="${s2}" font-weight="900" fill="#FFFFFF">광고문의</text>`;
    y += s2 * 1.3;
    rest += `\n  <text x="${X}" y="${Math.round(y + s2 * 0.9)}" text-anchor="${anchor}" font-family="KO" font-size="${s2}" font-weight="900" fill="#E8F5E9">카톡 besta12</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${t.a};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${t.b};stop-opacity:1"/>
    </linearGradient>
    <style>@font-face { font-family: 'KO'; src: url(data:font/ttf;base64,${FONT_B64}) format('truetype'); }</style>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect x="24" y="24" width="1152" height="1152" rx="40" fill="none" stroke="#3a3a46" stroke-width="4"/>
  ${nameTexts}
  ${rest}
</svg>`;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const targetSlug = process.argv[2];
  const targets = targetSlug ? venues.filter((v) => v.slug === targetSlug) : venues;
  if (targetSlug && targets.length === 0) {
    console.error(`❌ slug "${targetSlug}" 없음`);
    process.exit(1);
  }
  const outDir = path.join(ROOT, 'public/og');
  fs.mkdirSync(outDir, { recursive: true });
  let adCount = 0;
  for (const v of targets) {
    // [놀쿨26-1] 자기 쪽 판(ogOwnVer)이 따로 있는 가게는 그 판에 4줄을 그리고, 목록용 판(ogVer · 3줄)은 있는 파일을 그대로 둔다(없을 때만 3줄로 그림)
    const name = v.file || `${v.slug}${ogOwnVer(v.slug)}`;
    const jpgPath = path.join(outDir, `${name}.jpg`);
    await sharp(Buffer.from(buildSvg(v))).jpeg({ quality: 86 }).toFile(jpgPath);
    const listPath = path.join(outDir, `${v.slug}${ogVer(v.slug)}.jpg`);
    if (!v.file && ogOwnVer(v.slug) !== ogVer(v.slug) && !fs.existsSync(listPath)) await sharp(Buffer.from(buildSvg({ ...v, nick: '', phone: '' }))).jpeg({ quality: 86 }).toFile(listPath);
    const L = layout(v);
    if (L.isAd) adCount++;
    console.log(`✅ ${name}.jpg — ${v.nameKo} [${L.lines.join(' / ')} · ${L.size}px]${L.isAd ? ` / ${v.nick} ${v.phone}` : ''}`);
  }
  console.log(`\n총 ${targets.length}개 (4줄 ${adCount} · 3줄 ${targets.length - adCount})`);
}
