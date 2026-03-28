#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const VENUES_DIR = path.join(__dirname, '..', 'public', 'venues');
const OG_DIR = path.join(__dirname, '..', 'public', 'og');
const WIDTH = 1200;
const HEIGHT = 630;

// Nickname mapping (user-specified)
// 수유샴푸/인덕원국빈관/해운대고구려 = 제외
const NICKNAME_MAP = {
  'ilsanmyeongwolgwanyojeong': '신실장',
  'ilsanroom': '신실장',
  'busanyeonsandongmulnight': '따봉',
  'busanmulnight': '따봉',
  'seongnamshampoonight': '박찬호',
  'suwonchancenight': '강호동',
  'sinlimgrandprixnight': '태양',
  'cheongdamh2onight': '펩시맨',
  'pajuyadangskydomenight': '막내',
  'ulsanchampionnight': '춘자',
  'gangnamjuliananight': '태양',
  'sangbonghangukgwannight': '막내',
  'hwajeonghangukgwannight': '강호동',
  'suwonkoreanight': '박찬호',
  'bundangpongpongnight': '따봉',
  'busanasiadnight': '따봉',
  'ulsannewworldnight': '춘자',
};

function findImage(slug) {
  for (const ext of ['jpg', 'jpeg', 'webp', 'png']) {
    const p = path.join(VENUES_DIR, `${slug}-1.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function generateOg(slug, nickname) {
  const imgPath = findImage(slug);
  if (!imgPath) {
    console.log(`SKIP ${slug}: no source image`);
    return;
  }

  const outPath = path.join(OG_DIR, `${slug}.jpg`);

  try {
    // Resize source image to 1200x630 (cover)
    const resized = await sharp(imgPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    // Create bottom overlay bar (lower 1/3 with semi-transparent black)
    const barHeight = Math.round(HEIGHT / 3);
    const barY = HEIGHT - barHeight;

    // SVG overlay with nickname text
    const fontSize = Math.round(barHeight * 0.55);
    const svgOverlay = `
      <svg width="${WIDTH}" height="${HEIGHT}">
        <rect x="0" y="${barY}" width="${WIDTH}" height="${barHeight}" fill="rgba(0,0,0,0.6)"/>
        <text x="${WIDTH / 2}" y="${barY + barHeight / 2 + fontSize * 0.35}"
              text-anchor="middle"
              font-family="Arial,sans-serif"
              font-weight="900"
              font-size="${fontSize}"
              fill="white">${nickname}</text>
      </svg>`;

    // Composite: base image + overlay
    await sharp(resized)
      .composite([{
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      }])
      .jpeg({ quality: 85 })
      .toFile(outPath);

    const size = fs.statSync(outPath).size;
    console.log(`OK ${slug} → ${nickname} (${Math.round(size / 1024)}KB)`);
  } catch (e) {
    console.log(`ERR ${slug}: ${e.message}`);
  }
}

async function main() {
  console.log(`Generating ${Object.keys(NICKNAME_MAP).length} OG images with nicknames...`);

  for (const [slug, nickname] of Object.entries(NICKNAME_MAP)) {
    await generateOg(slug, nickname);
  }

  console.log('Done!');
}

main();
