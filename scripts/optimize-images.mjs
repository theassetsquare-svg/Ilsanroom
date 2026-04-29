#!/usr/bin/env node
/**
 * 이미지 최적화: JPG → WebP 변환 + 리사이징
 * public/venues/*.jpg → public/venues/*.webp (원본 유지, WebP 추가)
 * 빌드 전 실행: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const VENUES_DIR = path.resolve('public/venues');
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;

async function optimizeImages() {
  const files = fs.readdirSync(VENUES_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`🖼️ ${files.length}개 JPG 이미지 최적화 시작...`);

  let totalSaved = 0;
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const jpgPath = path.join(VENUES_DIR, file);
    const webpPath = path.join(VENUES_DIR, file.replace('.jpg', '.webp'));

    // WebP가 이미 있고 JPG보다 최신이면 스킵
    if (fs.existsSync(webpPath)) {
      const jpgStat = fs.statSync(jpgPath);
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= jpgStat.mtimeMs) {
        skipped++;
        continue;
      }
    }

    try {
      const jpgSize = fs.statSync(jpgPath).size;
      await sharp(jpgPath)
        .resize(MAX_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      const saved = jpgSize - webpSize;
      totalSaved += saved;
      converted++;

      if (saved > 100000) {
        console.log(`  ${file} → ${(jpgSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB (${(saved / 1024).toFixed(0)}KB 절감)`);
      }
    } catch (e) {
      console.error(`  ❌ ${file}: ${e.message}`);
    }
  }

  // JPG 원본도 리사이징 (WebP 미지원 브라우저 대비)
  console.log(`\n📐 JPG 원본 리사이징 (${MAX_WIDTH}px 이하)...`);
  let jpgResized = 0;
  for (const file of files) {
    const jpgPath = path.join(VENUES_DIR, file);
    try {
      const meta = await sharp(jpgPath).metadata();
      if (meta.width > MAX_WIDTH) {
        const tmpPath = jpgPath + '.tmp';
        await sharp(jpgPath)
          .resize(MAX_WIDTH, null, { withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toFile(tmpPath);
        fs.renameSync(tmpPath, jpgPath);
        jpgResized++;
      }
    } catch (e) {
      // skip
    }
  }

  console.log(`\n✅ 이미지 최적화 완료!`);
  console.log(`   WebP 변환: ${converted}개 (스킵: ${skipped}개)`);
  console.log(`   JPG 리사이징: ${jpgResized}개`);
  console.log(`   총 절감: ${(totalSaved / 1024 / 1024).toFixed(1)}MB`);
}

optimizeImages();
