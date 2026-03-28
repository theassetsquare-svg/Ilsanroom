const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const VENUES_DIR = 'public/venues';
const lines = fs.readFileSync('/tmp/need_images.txt', 'utf8').trim().split('\n');

function searchNaver(query) {
  const enc = encodeURIComponent(query);
  try {
    const html = execSync(
      `curl -sL -m 15 -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Accept-Language: ko-KR,ko;q=0.9" "https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${enc}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    ).toString();
    const urls = [...new Set(
      (html.match(/https?:\/\/search\.pstatic\.net\/common\/\?src=[^"&\s<>]+/g) || [])
        .filter(u => !u.includes('profileImage') && !u.includes('sstatic') && !u.includes('og_v3'))
    )];
    return urls;
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
for (let li = 0; li < lines.length; li++) {
  const [slug, name, haveStr, needStr] = lines[li].split('|');
  const have = parseInt(haveStr);
  const need = parseInt(needStr);

  // Find existing image numbers
  const existing = fs.readdirSync(VENUES_DIR)
    .filter(f => new RegExp('^' + slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-\\d').test(f))
    .map(f => parseInt(f.match(/-(\d)/)?.[1] || '0'))
    .filter(n => n > 0);

  const missing = [];
  for (let n = 1; n <= 6; n++) {
    if (!existing.includes(n)) missing.push(n);
  }

  if (missing.length === 0) continue;

  console.log(`[${li}/${lines.length}] ${name} (${slug}) need ${missing.length} more`);

  const urls = searchNaver(name);
  if (urls.length === 0) {
    console.log(`  NO RESULTS, trying shorter query`);
    // Try without spaces
    const urls2 = searchNaver(name.replace(/ /g, ''));
    urls.push(...urls2);
  }

  if (urls.length === 0) {
    console.log(`  STILL NO RESULTS`);
    continue;
  }

  let ui = 0;
  for (const n of missing) {
    let downloaded = false;
    while (ui < urls.length && !downloaded) {
      const fp = path.join(VENUES_DIR, `${slug}-${n}.jpg`);
      if (dl(urls[ui++], fp)) {
        totalDl++;
        downloaded = true;
      }
    }
    if (!downloaded) break;
  }
  console.log(`  done (${totalDl} total downloaded)`);
}

console.log(`\nFINISHED: ${totalDl} images downloaded`);
