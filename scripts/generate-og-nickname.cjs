#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const VENUES_DIR = path.join(__dirname, '..', 'public', 'venues');
const OG_DIR = path.join(__dirname, '..', 'public', 'og');
const WIDTH = 1200;
const HEIGHT = 630;

// 수동 합성 og 보호 목록 — 여기 있는 slug는 이 스크립트가 절대 덮어쓰지 않는다.
// (전화번호 등 별도 오버레이가 합성된 og. 재생성하면 합성 내용이 유실됨)
const MANUAL_OG_SLUGS = new Set([
  'ilsanroom', // 2026-08-01 전화번호(010 3695 4929) 합성본 — backup/venue-images/20260801-ilsanroom-phone
]);

const NICKNAME_MAP = {
  'ilsanmyeongwolgwanyojeong': '신실장',
  'ilsanroom': '신실장',
  'seongnamshampoonight': '박찬호',
  'suwonchancenight': '강호동',
  'sinlimgrandprixnight': '태양',
  'cheongdamh2onight': '펩시맨',
  'pajuyadangskydomenight': '막내',
  'ulsanchampionnight': '춘자',
  'gangnamjuliananight': '태양',
  'daejeonsevennight': '4인1조 w.t원숭이',
  'daejeononenight': '',
};

function findImage(slug) {
  for (const ext of ['jpg', 'jpeg', 'webp', 'png']) {
    const p = path.join(VENUES_DIR, `${slug}-1.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function generateOg(slug, nickname) {
  if (MANUAL_OG_SLUGS.has(slug)) { console.log(`SKIP ${slug}: manual og (보호 목록)`); return; }
  const imgPath = findImage(slug);
  if (!imgPath) { console.log(`SKIP ${slug}: no image`); return; }
  const outPath = path.join(OG_DIR, `${slug}.jpg`);

  try {
    const resized = await sharp(imgPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const barHeight = Math.round(HEIGHT / 3);
    const barY = HEIGHT - barHeight;
    const fontSize = Math.round(barHeight * 0.55);

    const svgOverlay = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="${barY}" width="${WIDTH}" height="${barHeight}" fill="rgba(0,0,0,0.65)"/>
        <text x="${WIDTH / 2}" y="${barY + barHeight / 2 + fontSize * 0.35}"
              text-anchor="middle"
              font-family="Pretendard"
              font-weight="900"
              font-size="${fontSize}"
              fill="white">${nickname}</text>
      </svg>`;

    await sharp(resized)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toFile(outPath);

    const size = fs.statSync(outPath).size;
    console.log(`OK ${slug} → ${nickname} (${Math.round(size / 1024)}KB)`);
  } catch (e) {
    console.log(`ERR ${slug}: ${e.message}`);
  }
}

async function main() {
  console.log(`Generating ${Object.keys(NICKNAME_MAP).length} OG images...`);
  for (const [slug, nickname] of Object.entries(NICKNAME_MAP)) {
    await generateOg(slug, nickname);
  }
  console.log('Done!');
}

main();
