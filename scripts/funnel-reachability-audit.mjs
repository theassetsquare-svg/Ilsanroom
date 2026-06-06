#!/usr/bin/env node
// 퍼널 도달성 감사 — "어느 페이지로 들어와도 다음 갈 곳이 있다(막다른길 0)" 보장.
// 시즌88 — 색인 대상(sitemap) 전 페이지가 (1) 인바운드 내부링크 ≥1 (고아 0)
//          (2) 홈에서 클릭 깊이 ≤3 도달 (3) 본문(<main>)에 다음단계 내부링크 ≥2 (막다른길 0)
//          를 만족하는지 dist 링크 그래프로 검증. 위반 시 exit 1 → 배포 차단.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITEMAP = 'dist/sitemap.xml';
const BASE = 'https://nolcool.com';
const MAX_DEPTH = 3;
const MIN_MAIN_LINKS = 2; // 본문 내 다음단계(내부 링크) 최소 — 미만이면 막다른길

if (!existsSync(SITEMAP)) { console.log(`⏭️  ${SITEMAP} 없음 — 빌드 후 실행`); process.exit(0); }

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'index.html') out.push(p);
  }
  return out;
}
// dist 파일경로 → URL 경로(디코드, trailing slash 제거, 홈='/')
function fileToPath(f) {
  let p = f.replace(/^dist/, '').replace(/\/index\.html$/, '');
  if (p === '') p = '/';
  try { p = decodeURIComponent(p); } catch {}
  return p;
}
// HTML에서 내부 링크 경로 추출(디코드). frag 영역 지정 시 그 안만.
function internalLinks(html) {
  const set = new Set();
  for (const m of html.matchAll(/href=["'](\/[^"'#?]*)/g)) {
    let h = m[1];
    if (h.startsWith('//')) continue;
    h = h.replace(/\/$/, '') || '/';
    try { h = decodeURIComponent(h); } catch {}
    set.add(h);
  }
  return set;
}
function mainFragment(html) {
  const m = html.match(/<main id="main-content">[\s\S]*?<\/main>/);
  return m ? m[0] : '';
}

// 1) 색인 대상 경로(sitemap)
const sm = readFileSync(SITEMAP, 'utf8');
const indexed = new Set(
  [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => {
    let p = m[1].replace(BASE, '').replace(/\/$/, '') || '/';
    try { p = decodeURIComponent(p); } catch {}
    return p;
  })
);

// 2) dist 전 페이지 링크 그래프 + 본문 링크 수
const files = walk(DIST);
const graph = new Map();      // path → Set(이웃 path)
const mainLinkCount = new Map(); // path → 본문 내부링크 수
const existPaths = new Set();
for (const f of files) {
  const path = fileToPath(f);
  existPaths.add(path);
  const html = readFileSync(f, 'utf8');
  graph.set(path, internalLinks(html));
  mainLinkCount.set(path, internalLinks(mainFragment(html)).size);
}

// 3) 인바운드 카운트
const inbound = new Map();
for (const [, neighbors] of graph) for (const n of neighbors) inbound.set(n, (inbound.get(n) || 0) + 1);

// 4) BFS 깊이 (홈 '/' 기준)
const depth = new Map([['/', 0]]);
let frontier = ['/'];
while (frontier.length) {
  const next = [];
  for (const cur of frontier) {
    const d = depth.get(cur);
    for (const n of (graph.get(cur) || [])) {
      if (!depth.has(n) && existPaths.has(n)) { depth.set(n, d + 1); next.push(n); }
    }
  }
  frontier = next;
}

// 5) 판정 — 색인 대상만 (비공개/noindex 페이지 제외)
const orphans = [], unreachable = [], tooDeep = [], deadEnds = [];
for (const p of indexed) {
  if (p === '/') continue;
  if ((inbound.get(p) || 0) < 1) orphans.push(p);
  const d = depth.get(p);
  if (d === undefined) unreachable.push(p);
  else if (d > MAX_DEPTH) tooDeep.push(`${p} (depth ${d})`);
  if ((mainLinkCount.get(p) || 0) < MIN_MAIN_LINKS) deadEnds.push(p);
}

console.log(`🔗 퍼널 도달성 감사 — 색인 ${indexed.size}p / dist ${existPaths.size}p`);
console.log(`📊 고아(인바운드0) ${orphans.length} / 미도달 ${unreachable.length} / 깊이>${MAX_DEPTH} ${tooDeep.length} / 막다른길(본문링크<${MIN_MAIN_LINKS}) ${deadEnds.length}`);
const show = (label, arr) => { if (arr.length) { console.log(`\n🛑 ${label} (상위 15):`); for (const x of arr.slice(0, 15)) console.log(`  - ${x}`); } };
show('인바운드 링크 0 (고아)', orphans);
show(`홈에서 도달 불가`, unreachable);
show(`클릭 깊이 ${MAX_DEPTH} 초과`, tooDeep);
show(`본문 다음단계 링크 부족 (막다른길)`, deadEnds);

const total = orphans.length + unreachable.length + tooDeep.length + deadEnds.length;
if (total > 0) { console.log(`\n❌ 퍼널 위반 ${total}건 — 모든 색인 페이지는 인바운드≥1·깊이≤${MAX_DEPTH}·본문 다음단계≥${MIN_MAIN_LINKS} 필요.`); process.exit(1); }
console.log('✅ 퍼널 정상 — 막다른길 0, 전 색인 페이지 도달 가능');
