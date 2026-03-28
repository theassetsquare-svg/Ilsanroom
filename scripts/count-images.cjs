const fs = require('fs');
const dir = 'public/venues';
const files = fs.readdirSync(dir);
const content = fs.readFileSync('src/data/venues.ts', 'utf8');
const re = /slug:\s*'([^']+)'[\s\S]*?nameKo:\s*'([^']+)'/g;
let m;
const venues = [];
while ((m = re.exec(content)) !== null) venues.push({ slug: m[1], name: m[2] });

let totalNeed = 0;
const needList = [];
for (const v of venues) {
  const pattern = new RegExp('^' + v.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-\\d');
  const imgs = files.filter(f => pattern.test(f));
  const missing = 6 - imgs.length;
  if (missing > 0) {
    needList.push({ slug: v.slug, name: v.name, have: imgs.length, need: missing });
    totalNeed += missing;
  }
}
console.log(JSON.stringify(needList.map(v => `${v.slug}|${v.name}|${v.have}|${v.need}`), null, 0));
console.log(`Venues needing images: ${needList.length}`);
console.log(`Total images needed: ${totalNeed}`);

// Write to file for the download script
fs.writeFileSync('/tmp/need_images.txt', needList.map(v => `${v.slug}|${v.name}|${v.have}|${v.need}`).join('\n'));
