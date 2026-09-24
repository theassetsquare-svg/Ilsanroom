#!/usr/bin/env node
/**
 * 광고주 4줄 카드의 「닉네임 · 전화번호」 두 줄만 다시 그린다(썸네일 표준 · 2026-09-24 긴급 수원찬스돔).
 *  배경·테두리·가게이름·노란 줄·맨아래 줄은 옛 카드 그대로 — 두 줄 자리를 옛 카드의 배경색으로 덮고 같은 글꼴로 새 값을 쓴다.
 *  색은 옛 카드에서 픽셀로 뜬다(지어내지 않음). 값의 유일 기준 = naver-watch/data/advertisers.json.
 *
 *  node scripts/redraw-adv-card.mjs <옛 카드 jpg> <새 카드 jpg> <닉네임> <전화번호>
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [src, out, nick, phone, bottom] = process.argv.slice(2); // bottom(선택): 비광고주 3줄 카드를 광고주 4줄로 바꿀 때 맨아래 줄 글자(예: 광고문의 카톡 besta12)
if (!src || !out || !nick || !phone) { console.log('쓰는 법: node scripts/redraw-adv-card.mjs <옛 jpg> <새 jpg> <닉네임> <전화번호>'); process.exit(2); }
const img = sharp(src);
const { width: W, height: H } = await img.metadata();
const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (Math.round(y) * info.width + Math.round(x)) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
// 배경 = 닉네임과 번호 사이 빈 띠 가운데 · 글자색 = 옛 글자 획 위 가장 밝은 점(닉네임은 초록, 번호는 흰색)
const bg = px(W * 0.08, H * 0.47);
const brightest = (y0, y1) => { let best = [0, 0, 0], bs = -1; for (let y = y0; y < y1; y += 3) for (let x = W * 0.1; x < W * 0.9; x += 3) { const c = px(x, y); const s = c[0] + c[1] + c[2]; if (s > bs) { bs = s; best = c; } } return best; };
const nickColor = (() => { let best = [0, 0, 0], bs = -1; for (let y = H * 0.29; y < H * 0.43; y += 3) for (let x = W * 0.3; x < W * 0.7; x += 3) { const c = px(x, y); const s = c[1] - c[0]; if (s > bs) { bs = s; best = c; } } return best; })(); // 초록 성분이 가장 센 점
const phoneColor = brightest(Math.round(H * 0.57), Math.round(H * 0.71));
const creamColor = (() => { let best = [0, 0, 0], bs = -1; for (let y = H * 0.12; y < H * 0.19; y += 2) for (let x = W * 0.25; x < W * 0.75; x += 2) { const c = px(x, y); const s = c[0] + c[1] - c[2]; if (s > bs) { bs = s; best = c; } } return best; })(); // 가게이름 줄 크림색
const font = fs.readFileSync(path.join('scripts', 'og-fonts', 'NotoSansKR-Bold.ttf')).toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// 글자 폭을 실제로 그려 재고 카드 폭 안에 맞춘다(librsvg 는 textLength 를 따르지 않는다)
async function fitSize(text, target, start) {
  const probe = (sz) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H}"><style>@font-face{font-family:NK;src:url(data:font/ttf;base64,${font});font-weight:700}</style><text x="10" y="${H * 0.6}" font-family="NK" font-weight="700" font-size="${sz}" fill="#fff">${esc(text)}</text></svg>`;
  const t = await sharp(Buffer.from(probe(start))).trim().toBuffer({ resolveWithObject: true });
  return Math.floor(start * target / t.info.width);
}
const nickSize = Math.min(H * 0.155, await fitSize(nick, W * 0.8, H * 0.155));
const phoneSize = await fitSize(phone, W * 0.88, H * 0.165);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<style>@font-face{font-family:NK;src:url(data:font/ttf;base64,${font});font-weight:700}</style>
<rect x="${W * 0.04}" y="${H * 0.275}" width="${W * 0.92}" height="${H * 0.175}" fill="${hex(bg)}"/>
<rect x="${W * 0.022}" y="${H * 0.545}" width="${W * 0.956}" height="${H * 0.185}" fill="${hex(bg)}"/>
<text x="${W / 2}" y="${H * 0.418}" text-anchor="middle" font-family="NK" font-weight="700" font-size="${nickSize}" fill="${hex(nickColor)}">${esc(nick)}</text>
<text x="${W / 2}" y="${H * 0.705}" text-anchor="middle" font-family="NK" font-weight="700" font-size="${phoneSize}" fill="${hex(phoneColor)}">${esc(phone)}</text>
${bottom ? `<rect x="${W * 0.04}" y="${H * 0.8}" width="${W * 0.92}" height="${H * 0.13}" fill="${hex(bg)}"/><text x="${W / 2}" y="${H * 0.878}" text-anchor="middle" font-family="NK" font-weight="700" font-size="${H * 0.048}" fill="${hex(creamColor)}">${esc(bottom)}</text>` : ''}
</svg>`;
await sharp(src).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toFile(out);
console.log(`새 카드 ${out} · ${W}x${H} · 번호 글자 ${phoneSize}px · 배경 ${hex(bg)} · 닉네임색 ${hex(nickColor)} · 번호색 ${hex(phoneColor)} · 「${nick}」「${phone}」`);
