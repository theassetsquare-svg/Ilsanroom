const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const VENUES_DIR = 'public/venues';

// Get all venues
const content = fs.readFileSync('src/data/venues.ts', 'utf8');
const re = /slug:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'/g;
let m;
const venues = [];
while ((m = re.exec(content)) !== null) venues.push({ slug: m[1], name: m[2] });

function searchNaver(query) {
  const enc = encodeURIComponent(query);
  try {
    const html = execSync(
      `curl -sL -m 15 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Accept-Language: ko-KR,ko;q=0.9" "https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${enc}"`,
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

let totalDl = 0;

for (let i = 0; i < venues.length; i++) {
  const { slug, name } = venues[i];

  // Check if g1~g6 already exist
  const existing = [1,2,3,4,5,6].filter(n =>
    fs.existsSync(path.join(VENUES_DIR, `${slug}-g${n}.jpg`)) ||
    fs.existsSync(path.join(VENUES_DIR, `${slug}-g${n}.webp`)) ||
    fs.existsSync(path.join(VENUES_DIR, `${slug}-g${n}.png`))
  );
  if (existing.length >= 6) continue;

  const missing = [1,2,3,4,5,6].filter(n => !existing.includes(n));
  console.log(`[${i}/${venues.length}] ${name} need g${missing.join(',g')}`);

  // Search with full name
  let urls = searchNaver(name);

  // Skip first 6 results (those are likely same as body images)
  // Use results 7+ for gallery
  const galleryUrls = urls.slice(6);

  // If not enough from offset, use all but try to skip duplicates
  const finalUrls = galleryUrls.length >= 6 ? galleryUrls : urls.slice(Math.max(0, urls.length - missing.length * 3));

  if (finalUrls.length === 0) {
    // Fallback: copy from existing body images with different numbers
    for (const n of missing) {
      const bodyIdx = ((n - 1) % 4) + 1;
      for (const ext of ['jpg', 'webp', 'png']) {
        const src = path.join(VENUES_DIR, `${slug}-${bodyIdx}.${ext}`);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(VENUES_DIR, `${slug}-g${n}.jpg`));
          totalDl++;
          break;
        }
      }
    }
    console.log(`  fallback copy (${totalDl} total)`);
    continue;
  }

  let ui = 0;
  for (const n of missing) {
    let downloaded = false;
    while (ui < finalUrls.length && !downloaded) {
      const fp = path.join(VENUES_DIR, `${slug}-g${n}.jpg`);
      if (dl(finalUrls[ui++], fp)) {
        totalDl++;
        downloaded = true;
      }
    }
    if (!downloaded) {
      // Fallback: copy from body image
      const bodyIdx = ((n - 1) % 4) + 1;
      for (const ext of ['jpg', 'webp', 'png']) {
        const src = path.join(VENUES_DIR, `${slug}-${bodyIdx}.${ext}`);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(VENUES_DIR, `${slug}-g${n}.jpg`));
          totalDl++;
          break;
        }
      }
    }
  }
  console.log(`  done (${totalDl} total)`);
}

console.log(`\nFINISHED: ${totalDl} gallery images`);
