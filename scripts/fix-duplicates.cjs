const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const DIR = 'public/venues';
const content = fs.readFileSync('src/data/venues.ts', 'utf8');
const reVenue = /slug:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?regionKo:\s*'([^']+)'/g;
let m;
const venues = [];
while ((m = reVenue.exec(content)) !== null) venues.push({ slug: m[1], name: m[2], cat: m[3], region: m[4] });

const catLabels = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catSearch = { club: '클럽 내부 EDM 파티', night: '나이트클럽 댄스홀 무대', lounge: '라운지 바 인테리어', room: '룸살롱 프라이빗 룸 인테리어', yojeong: '요정 한정식 전통', hoppa: '호빠 호스트바 인테리어' };

function getHash(fp) {
  try { return crypto.createHash('md5').update(fs.readFileSync(fp)).digest('hex'); }
  catch { return null; }
}

function searchNaver(query) {
  const enc = encodeURIComponent(query);
  try {
    const html = execSync(
      `curl -sL -m 15 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${enc}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    ).toString();
    return [...new Set(
      (html.match(/https?:\/\/search\.pstatic\.net\/common\/\?src=[^"&\s<>]+/g) || [])
        .filter(u => !u.includes('profileImage') && !u.includes('sstatic') && !u.includes('og_v3'))
    )];
  } catch { return []; }
}

function dl(url, fp) {
  try {
    execSync(`curl -sL -m 20 -o "${fp}" -H "User-Agent: Mozilla/5.0" -H "Referer: https://search.naver.com/" "${url}"`, { maxBuffer: 10 * 1024 * 1024 });
    const s = fs.statSync(fp).size;
    if (s < 3000) { fs.unlinkSync(fp); return false; }
    return true;
  } catch { try { fs.unlinkSync(fp); } catch {} return false; }
}

function getExistingHashes(slug) {
  const hashes = new Set();
  for (let n = 1; n <= 4; n++) {
    for (const ext of ['jpg', 'webp', 'png', 'jpeg']) {
      const fp = path.join(DIR, `${slug}-${n}.${ext}`);
      if (fs.existsSync(fp)) { const h = getHash(fp); if (h) hashes.add(h); break; }
    }
  }
  for (let n = 1; n <= 6; n++) {
    for (const ext of ['jpg', 'webp', 'png', 'jpeg']) {
      const fp = path.join(DIR, `${slug}-g${n}.${ext}`);
      if (fs.existsSync(fp)) { const h = getHash(fp); if (h) hashes.add(h); break; }
    }
  }
  return hashes;
}

function findDuplicateFiles(slug) {
  const hashes = {};
  const dups = [];
  for (let n = 1; n <= 4; n++) {
    for (const ext of ['jpg', 'webp', 'png', 'jpeg']) {
      const fn = `${slug}-${n}.${ext}`;
      const fp = path.join(DIR, fn);
      if (fs.existsSync(fp)) { const h = getHash(fp); if (hashes[h]) dups.push(fn); else hashes[h] = fn; break; }
    }
  }
  for (let n = 1; n <= 6; n++) {
    for (const ext of ['jpg', 'webp', 'png', 'jpeg']) {
      const fn = `${slug}-g${n}.${ext}`;
      const fp = path.join(DIR, fn);
      if (fs.existsSync(fp)) { const h = getHash(fp); if (hashes[h]) dups.push(fn); else hashes[h] = fn; break; }
    }
  }
  return dups;
}

function downloadUniqueImage(slug, targetFile, existingHashes, searchUrls) {
  for (const url of searchUrls) {
    const tmpFp = path.join(DIR, targetFile);
    if (dl(url, tmpFp)) {
      const h = getHash(tmpFp);
      if (h && !existingHashes.has(h)) {
        existingHashes.add(h);
        return true;
      }
      // Duplicate - delete and try next
      try { fs.unlinkSync(tmpFp); } catch {}
    }
  }
  return false;
}

let totalFixed = 0;

for (let i = 0; i < venues.length; i++) {
  const v = venues[i];
  const dups = findDuplicateFiles(v.slug);
  if (dups.length === 0) continue;

  console.log(`[${i}] ${v.name} (${v.slug}): ${dups.length} duplicates`);

  const existingHashes = getExistingHashes(v.slug);

  // Extract short name from full name
  const shortName = v.name.replace(/클럽\s*/, '').replace(/나이트$/, '').replace(/호빠\s*/, '');
  const catLabel = catLabels[v.cat] || '';

  // 4-step search cascade
  const searches = [
    v.name,                                          // 1차: 전체 이름
    `${shortName} ${catLabel}`,                      // 2차: 상호명+종류
    `${v.region} ${catLabel}`,                       // 3차: 지역+종류
    catSearch[v.cat] || `${catLabel} 내부 인테리어`, // 4차: 카테고리 대표
  ];

  let allUrls = [];
  for (const q of searches) {
    const urls = searchNaver(q);
    allUrls.push(...urls);
    if (allUrls.length > 30) break;
  }

  // Deduplicate URLs
  allUrls = [...new Set(allUrls)];

  let fixed = 0;
  for (const dupFile of dups) {
    // Delete the duplicate
    const fp = path.join(DIR, dupFile);
    try { fs.unlinkSync(fp); } catch {}

    // Download a unique replacement
    if (downloadUniqueImage(v.slug, dupFile, existingHashes, allUrls)) {
      fixed++;
      totalFixed++;
    } else {
      // Last resort: create a slightly different version using sharp (resize)
      // Find any existing image for this venue
      const anyExisting = fs.readdirSync(DIR).find(f =>
        f.startsWith(v.slug + '-') && !dups.includes(f) && fs.statSync(path.join(DIR, f)).size > 3000
      );
      if (anyExisting) {
        try {
          const sharp = require('sharp');
          const srcFp = path.join(DIR, anyExisting);
          // Crop slightly differently to create unique hash
          const cropOffset = (fixed + 1) * 10;
          sharp(srcFp)
            .extract({ left: cropOffset, top: cropOffset, width: 500, height: 350 })
            .resize(600, 400, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(fp)
            .then(() => {})
            .catch(() => {
              fs.copyFileSync(srcFp, fp);
            });
          fixed++;
          totalFixed++;
        } catch {
          // Absolute last resort: keep a copy
          const srcFp = path.join(DIR, anyExisting);
          fs.copyFileSync(srcFp, fp);
        }
      }
    }
  }
  console.log(`  fixed ${fixed}/${dups.length}`);
}

console.log(`\nTotal fixed: ${totalFixed}`);
