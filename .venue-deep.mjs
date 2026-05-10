#!/usr/bin/env node
// 시즌29-F — 120 venue 페이지 deep crawl (PC+Mobile, console/network/H1/CWV)
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>https:\/\/nolcool\.com([^<]+)<\/loc>/g)].map(m => m[1]);
const venueUrls = urls.filter(u => /^\/(clubs|rooms|yojeong)\/[^/]+\/[^/]+\/$|^\/(nights|hoppa|lounges)\/[^/]+\/$/.test(u));
console.log(`Venue URLs: ${venueUrls.length}`);

const browser = await puppeteer.launch({
  executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const stats = { runs: 0, ok: 0, console: 0, page: 0, net: 0, h1Bad: 0, lcpFails: 0, clsFails: 0, fails: [], consoleSamples: [], lcpSamples: [], clsSamples: [], url404Samples: [] };
const concurrency = 6;
const queue = [];
for (const vp of [{ name: 'PC', w: 1280, h: 800 }, { name: 'M', w: 390, h: 844, m: true }]) {
  for (const url of venueUrls) queue.push({ vp, url });
}

async function process(item) {
  const { vp, url } = item;
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: vp.w, height: vp.h, isMobile: !!vp.m });
  let consoleErr = 0, pageErr = 0, netErr = 0;
  page.on('console', m => { if (m.type() === 'error') { consoleErr++; if (stats.consoleSamples.length < 8) stats.consoleSamples.push({ vp: vp.name, url, msg: m.text().slice(0, 120) }); } });
  page.on('pageerror', () => { pageErr++; });
  page.on('requestfailed', r => {
    const u = r.url();
    if (u.includes('nolcool.com')) netErr++;
  });
  page.on('response', r => {
    if (r.status() === 404 && r.url().includes('nolcool.com') && stats.url404Samples.length < 8) {
      stats.url404Samples.push({ vp: vp.name, url, dst: r.url().replace('https://nolcool.com', '') });
    }
  });
  await page.evaluateOnNewDocument(() => {
    window.__cwv = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__cwv.lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cwv.cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
  });
  try {
    const resp = await page.goto(`https://nolcool.com${url}`, { waitUntil: 'networkidle2', timeout: 25000 });
    if (!resp || resp.status() >= 400) {
      stats.fails.push({ vp: vp.name, url, status: resp?.status() });
    } else stats.ok++;
    await new Promise(r => setTimeout(r, 1000));
    const h1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    if (h1 !== 1) { stats.h1Bad++; stats.fails.push({ vp: vp.name, url, h1 }); }
    const cwv = await page.evaluate(() => window.__cwv);
    if (cwv.lcp > 2500) { stats.lcpFails++; if (stats.lcpSamples.length < 5) stats.lcpSamples.push({ vp: vp.name, url, lcp: Math.round(cwv.lcp) }); }
    if (cwv.cls > 0.1) { stats.clsFails++; if (stats.clsSamples.length < 5) stats.clsSamples.push({ vp: vp.name, url, cls: cwv.cls.toFixed(3) }); }
  } catch (e) {
    stats.fails.push({ vp: vp.name, url, err: e.message.slice(0, 50) });
  }
  if (consoleErr) stats.console += consoleErr;
  if (pageErr) stats.page += pageErr;
  if (netErr) stats.net += netErr;
  stats.runs++;
  await ctx.close();
}

const workers = Array.from({ length: concurrency }, () => (async () => {
  while (queue.length) {
    const item = queue.shift();
    if (!item) break;
    await process(item);
  }
})());
await Promise.all(workers);
await browser.close();

console.log(`\nVenue deep crawl — ${stats.runs} runs (${venueUrls.length} venues × 2 viewports)`);
console.log(`  status<400 (success):      ${stats.ok}/${stats.runs}`);
console.log(`  console errors:            ${stats.console}`);
console.log(`  page errors (uncaught):    ${stats.page}`);
console.log(`  network failures (nolcool): ${stats.net}`);
console.log(`  H1 not exactly 1:          ${stats.h1Bad}`);
console.log(`  LCP > 2500ms:              ${stats.lcpFails}`);
console.log(`  CLS > 0.1:                 ${stats.clsFails}`);
if (stats.fails.length) {
  console.log(`\n  First 8 failures:`);
  stats.fails.slice(0, 8).forEach(f => console.log(`    ${JSON.stringify(f)}`));
}
if (stats.consoleSamples.length) {
  console.log(`\n  Console error samples:`);
  stats.consoleSamples.forEach(s => console.log(`    [${s.vp}] ${s.url}: ${s.msg}`));
}
if (stats.lcpSamples.length) {
  console.log(`\n  LCP fails (>2500ms):`);
  stats.lcpSamples.forEach(s => console.log(`    [${s.vp}] ${s.url}: ${s.lcp}ms`));
}
if (stats.clsSamples.length) {
  console.log(`\n  CLS fails (>0.1):`);
  stats.clsSamples.forEach(s => console.log(`    [${s.vp}] ${s.url}: ${s.cls}`));
}
