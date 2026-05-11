#!/usr/bin/env node
// 놀쿨 링크/이미지 사망 감사 — sitemap 페이지 fetch → 본문의 href/src 모두 추출 → 200 확인
// 사용: node scripts/nolcool-link-audit.mjs [--limit N] [--external] [--save report.json]
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i+1], 10) : 0; })();
const SAVE = (() => { const i = args.indexOf('--save'); return i >= 0 ? args[i+1] : null; })();
const CHECK_EXTERNAL = args.includes('--external');

const BASE = 'https://nolcool.com';

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'nolcool-link-audit/1.0' }, redirect: 'follow' });
    return { status: r.status, text: r.status === 200 ? await r.text() : '' };
  } catch (e) { return { status: 0, err: e.message }; }
}

async function check(url, method = 'HEAD') {
  try {
    const r = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': 'nolcool-link-audit/1.0' } });
    // 일부 서버는 HEAD를 막거나 405 반환 → GET 재시도
    if (method === 'HEAD' && (r.status === 405 || r.status === 403)) return check(url, 'GET');
    return r.status;
  } catch (e) { return 0; }
}

const sm = await fetchText(`${BASE}/sitemap.xml`);
if (sm.status !== 200) { console.error(`sitemap fail ${sm.status}`); process.exit(1); }
let pages = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (LIMIT > 0) pages = pages.slice(0, LIMIT);
console.log(`\ud83d\udcc2 ${pages.length} \ud398\uc774\uc9c0 \ud06c\ub864\uc911\u2026`);

const links = new Set(); // url
const imgs = new Set();  // src

let pageDone = 0;
const pq = [...pages];
const pageWorkers = Array.from({ length: 6 }, async () => {
  while (pq.length) {
    const u = pq.shift(); if (!u) break;
    const r = await fetchText(u);
    pageDone++;
    if (pageDone % 50 === 0) process.stdout.write(`  crawl ${pageDone}/${pages.length}\r`);
    if (r.status !== 200 || !r.text) continue;
    for (const m of r.text.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/g)) {
      const href = m[1];
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const abs = href.startsWith('http') ? href : new URL(href, u).href;
      if (abs.startsWith(BASE) || CHECK_EXTERNAL) links.add(abs);
    }
    for (const m of r.text.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/g)) {
      const src = m[1];
      if (src.startsWith('data:')) continue;
      const abs = src.startsWith('http') ? src : new URL(src, u).href;
      if (abs.startsWith(BASE) || CHECK_EXTERNAL) imgs.add(abs);
    }
  }
});
await Promise.all(pageWorkers);
console.log(`\n\ud83d\udd17 link ${links.size} / \ud83d\udcf7 img ${imgs.size} \uac80\uc99d\uc911\u2026`);

const broken = [];
const all = [...new Set([...links, ...imgs])];
const q = [...all];
let n = 0;
const workers = Array.from({ length: 10 }, async () => {
  while (q.length) {
    const url = q.shift(); if (!url) break;
    const s = await check(url);
    n++;
    if (n % 100 === 0) process.stdout.write(`  check ${n}/${all.length}\r`);
    if (s === 0 || s >= 400) broken.push({ url, status: s, kind: imgs.has(url) ? 'img' : 'link' });
  }
});
await Promise.all(workers);

console.log(`\n\n\ud83d\udcca \uacb0\uacfc: ${all.length} URL \uac80\uc99d / \uc0ac\ub9dd ${broken.length}`);
if (broken.length) {
  broken.sort((a,b) => a.status - b.status);
  for (const b of broken.slice(0, 40)) console.log(`  ${b.status}  ${b.kind === 'img' ? '\ud83d\udcf7' : '\ud83d\udd17'}  ${b.url}`);
  if (broken.length > 40) console.log(`  \u2026 +${broken.length - 40}\uac74`);
}

if (SAVE) {
  writeFileSync(SAVE, JSON.stringify({ ts: new Date().toISOString(), pages: pages.length, links: links.size, imgs: imgs.size, broken }, null, 2));
  console.log(`\n\ud83d\udcbe ${SAVE}`);
}

process.exit(broken.length > 0 ? 1 : 0);
