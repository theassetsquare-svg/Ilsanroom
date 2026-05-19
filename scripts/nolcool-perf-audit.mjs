#!/usr/bin/env node
/**
 * 놀쿨 PC+Mobile 성능 감사 — Core Web Vitals
 *
 * 측정 항목 (per page × per viewport):
 *   - FCP (First Contentful Paint)
 *   - LCP (Largest Contentful Paint)
 *   - CLS (Cumulative Layout Shift)
 *   - TTFB (Time To First Byte)
 *   - DCL (DOMContentLoaded)
 *   - Load (load event)
 *   - JS heap 사용량
 *   - Resource: total size / count
 *
 * CLAUDE.md 기준:
 *   - LCP < 2.5s
 *   - INP < 200ms (puppeteer로 측정 어려움, 별도)
 *   - CLS < 0.1
 *
 * 사용:
 *   node scripts/nolcool-perf-audit.mjs                              # 기본 샘플 20 URL × 2vp
 *   node scripts/nolcool-perf-audit.mjs --limit 50
 *   node scripts/nolcool-perf-audit.mjs --save /tmp/perf.json
 */

import { writeFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i < 0 ? dflt : args[i + 1]; };
const LIMIT = parseInt(arg('--limit', '20'), 10);
const VP = arg('--vp', 'both');
const SAVE = arg('--save', null);
const BASE = arg('--base', 'https://nolcool.com');

function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  for (const c of ['/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/chrome']) {
    if (existsSync(c)) return c;
  }
  return null;
}

const CHROME = findChromium();
if (!CHROME) { console.error('❌ chromium 없음'); process.exit(1); }

const puppeteer = (await import('puppeteer-core')).default;

// 대표 샘플 URL — 카테고리당 1~2개씩 + 핵심 페이지
const SAMPLE_PATHS = [
  '/',
  '/clubs', '/nights', '/rooms', '/lounges', '/hoppa', '/yojeong',
  '/community', '/magazine', '/best',
  '/tonight', '/weekend', '/budget', '/occasion',
  '/rooms/ilsan/ilsanroom/',
  '/clubs/gangnam/gangnamclub-race/',
  '/nights/ansandontellmamanight/',
  '/lounges/apgujeongcodelounge/',
  '/hoppa/gangnamhoppa-royal/',
  '/yojeong/ilsan/ilsanmyeongwolgwanyojeong/',
];

const VIEWPORTS = {
  pc: { width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1, ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' },
  mobile: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 3, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
};

async function measureOne(browser, url, vpName) {
  const vp = VIEWPORTS[vpName];
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, deviceScaleFactor: vp.deviceScaleFactor });
  await page.setUserAgent(vp.ua);

  // Set up LCP/CLS observers BEFORE navigation
  await page.evaluateOnNewDocument(() => {
    window.__perf = { lcp: 0, cls: 0, fcp: 0 };
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (e.name === 'first-contentful-paint') window.__perf.fcp = e.startTime;
    }).observe({ type: 'paint', buffered: true });
  });

  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    await page.close();
    return { url: url.replace(BASE, '') || '/', vp: vpName, error: e.message };
  }

  // wait briefly for LCP/CLS to stabilize (LCP can fire after networkidle)
  await new Promise(r => setTimeout(r, 1500));

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const resources = performance.getEntriesByType('resource');
    const totalBytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    return {
      fcp: window.__perf?.fcp || 0,
      lcp: window.__perf?.lcp || 0,
      cls: window.__perf?.cls || 0,
      ttfb: nav.responseStart - nav.requestStart,
      dcl: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
      resCount: resources.length,
      resBytes: totalBytes,
      jsHeap: performance.memory?.usedJSHeapSize || 0,
    };
  });

  await page.close();
  return { url: url.replace(BASE, '') || '/', vp: vpName, ...metrics, total: Date.now() - t0 };
}

async function fetchSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`);
  const text = await r.text();
  return [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

async function main() {
  console.log(`📂 sitemap fetching: ${BASE}/sitemap.xml`);
  const all = await fetchSitemap();
  console.log(`📄 sitemap URL: ${all.length}`);

  // 샘플 우선, 부족하면 sitemap에서 채움
  let urls = SAMPLE_PATHS.map(p => `${BASE}${p}`);
  if (LIMIT > urls.length) {
    const extras = all.filter(u => !urls.includes(u)).slice(0, LIMIT - urls.length);
    urls = [...urls, ...extras];
  } else if (LIMIT > 0 && LIMIT < urls.length) {
    urls = urls.slice(0, LIMIT);
  }

  const viewports = VP === 'both' ? ['pc', 'mobile'] : [VP];
  console.log(`🚀 ${urls.length} URL × ${viewports.length} viewport = ${urls.length * viewports.length} loads`);
  console.log(`🌐 chromium: ${CHROME}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];
  for (const u of urls) {
    for (const v of viewports) {
      const r = await measureOne(browser, u, v);
      results.push(r);
      const lcpEmoji = r.lcp < 2500 ? '🟢' : r.lcp < 4000 ? '🟡' : '🔴';
      const clsEmoji = r.cls < 0.1 ? '🟢' : r.cls < 0.25 ? '🟡' : '🔴';
      if (r.error) {
        console.log(`  ❌ [${v.padEnd(6)}] ${r.url} — ${r.error.slice(0, 60)}`);
      } else {
        console.log(`  ${lcpEmoji} [${v.padEnd(6)}] LCP ${String(Math.round(r.lcp)).padStart(5)}ms  ${clsEmoji} CLS ${r.cls.toFixed(3)}  FCP ${String(Math.round(r.fcp)).padStart(4)}ms  ${Math.round(r.resBytes/1024).toString().padStart(4)}KB ${String(r.resCount).padStart(3)}r  ${r.url}`);
      }
    }
  }

  await browser.close();

  // Aggregate per viewport
  console.log('\n📊 집계:');
  for (const v of viewports) {
    const rs = results.filter(r => r.vp === v && !r.error);
    if (!rs.length) continue;
    const avg = (key) => Math.round(rs.reduce((s, r) => s + (r[key] || 0), 0) / rs.length);
    const p75 = (key) => { const sorted = [...rs].map(r => r[key] || 0).sort((a,b)=>a-b); return sorted[Math.floor(sorted.length * 0.75)]; };
    const lcpFail = rs.filter(r => r.lcp >= 2500).length;
    const clsFail = rs.filter(r => r.cls >= 0.1).length;
    console.log(`\n  [${v}] ${rs.length} pages`);
    console.log(`    LCP : avg ${avg('lcp')}ms / p75 ${Math.round(p75('lcp'))}ms / 🔴 ≥2500ms ${lcpFail}/${rs.length}`);
    console.log(`    CLS : avg ${(rs.reduce((s,r)=>s+r.cls,0)/rs.length).toFixed(3)} / p75 ${p75('cls').toFixed(3)} / 🔴 ≥0.1 ${clsFail}/${rs.length}`);
    console.log(`    FCP : avg ${avg('fcp')}ms / p75 ${Math.round(p75('fcp'))}ms`);
    console.log(`    TTFB: avg ${avg('ttfb')}ms`);
    console.log(`    Load: avg ${avg('load')}ms`);
    console.log(`    리소스 평균: ${avg('resCount')}개 / ${Math.round(avg('resBytes')/1024)}KB`);
  }

  if (SAVE) {
    writeFileSync(SAVE, JSON.stringify({ ts: new Date().toISOString(), base: BASE, results }, null, 2));
    console.log(`\n💾 저장: ${SAVE}`);
  }

  const totalFail = results.filter(r => r.lcp >= 2500 || r.cls >= 0.1).length;
  process.exit(totalFail > 0 ? 0 : 0); // don't fail CI for perf yet, just measure
}

main().catch(e => { console.error('❌', e); process.exit(1); });
