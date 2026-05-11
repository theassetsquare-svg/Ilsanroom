#!/usr/bin/env node
// dist HTML 전수 — 동일 title / 동일 description 가진 페이지 검출 (SEO 중복 페널티)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DUP_THRESHOLD = 3; // 같은 title/desc 3페이지 이상이면 WARN

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}

const files = walk('dist');
const titleMap = new Map();
const descMap = new Map();

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const t = (html.match(/<title>([^<]+)<\/title>/) || [, ''])[1].trim();
  const dm = html.match(/<meta\s+name=["']description["']\s+content="([^"]+)"/)
          || html.match(/<meta\s+name=["']description["']\s+content='([^']+)'/);
  const d = (dm || [, ''])[1].trim();
  if (t) {
    if (!titleMap.has(t)) titleMap.set(t, []);
    titleMap.get(t).push(f);
  }
  if (d) {
    if (!descMap.has(d)) descMap.set(d, []);
    descMap.get(d).push(f);
  }
}

const titleDups = [...titleMap.entries()].filter(([, v]) => v.length >= DUP_THRESHOLD);
const descDups = [...descMap.entries()].filter(([, v]) => v.length >= DUP_THRESHOLD);

console.log(`📄 ${files.length} HTML / 고유 title ${titleMap.size} / 고유 desc ${descMap.size}`);
console.log(`\n📊 중복 (≥${DUP_THRESHOLD}): title ${titleDups.length}건 / desc ${descDups.length}건`);

let err = 0;
for (const [t, fs] of titleDups) {
  console.log(`\n🛑 동일 title (${fs.length}건): "${t.slice(0, 70)}"`);
  for (const f of fs.slice(0, 5)) console.log(`   - ${f}`);
  if (fs.length > 5) console.log(`   ... +${fs.length - 5}`);
  err++;
}
for (const [d, fs] of descDups) {
  console.log(`\n🛑 동일 desc (${fs.length}건): "${d.slice(0, 70)}"`);
  for (const f of fs.slice(0, 5)) console.log(`   - ${f}`);
  if (fs.length > 5) console.log(`   ... +${fs.length - 5}`);
  err++;
}

process.exit(err > 0 ? 1 : 0);
