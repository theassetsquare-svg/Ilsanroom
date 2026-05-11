#!/usr/bin/env node
// 시즌34 — venue 페이지 title 가게이름 맨앞 검증
// dist/<cat>/<region>/<slug>/index.html 각 title이 nameKo 토큰으로 시작하는지 확인
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const VENUE_CATS = ['clubs', 'nights', 'rooms', 'yojeong', 'lounges', 'hoppa'];

// venues.ts에서 직접 nameKo 뽑기
const venuesSrc = readFileSync('src/data/venues.ts', 'utf8');
// id, slug, nameKo, regionKo, category 추출 — slug + nameKo 매핑만 필요
const venueMap = new Map(); // slug -> { nameKo, category }
{
  const re = /\{\s*id:[^}]+?slug:\s*['"]([^'"]+)['"][^]*?nameKo:\s*['"]([^'"]+)['"][^]*?category:\s*['"]([^'"]+)['"][^]*?regionKo:\s*['"]([^'"]+)['"][^]*?\}/g;
  let m;
  while ((m = re.exec(venuesSrc)) !== null) {
    venueMap.set(m[1], { nameKo: m[2], category: m[3], regionKo: m[4] });
  }
}

console.log(`📂 venues.ts 파싱: ${venueMap.size}개 업소`);

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (f === 'index.html') out.push(p);
  }
  return out;
}

const htmls = walk(DIST);
let checked = 0, bad = 0;
const violations = [];

for (const html of htmls) {
  // path = dist/<cat>/<region>/<slug>/index.html
  const parts = html.replace(/^dist[\/\\]/, '').split(/[\/\\]/);
  if (parts.length < 4) continue;
  const [cat, region, slug] = parts;
  if (!VENUE_CATS.includes(cat)) continue;
  if (!venueMap.has(slug)) continue;

  const v = venueMap.get(slug);
  const text = readFileSync(html, 'utf8');
  const tm = text.match(/<title>([^<]+)<\/title>/);
  if (!tm) continue;
  const title = tm[1].trim();
  checked++;

  // nameKo 토큰 첫 등장 위치 — title 시작에서 0~3자 이내여야 함 (제로 위치 권장)
  const idx = title.indexOf(v.nameKo);
  if (idx < 0 || idx > 3) {
    bad++;
    if (violations.length < 20) {
      violations.push(`${cat}/${region}/${slug} → "${title}" (nameKo "${v.nameKo}" idx=${idx})`);
    }
  }
}

console.log(`\n📊 검사 ${checked}개 venue title / 가게이름 맨앞 위반 ${bad}건`);
if (violations.length) {
  console.log(`\n샘플 (상위 ${violations.length}):`);
  for (const v of violations) console.log(`  - ${v}`);
}

process.exit(bad > 0 ? 1 : 0);
