#!/usr/bin/env node
// 시즌23 — 라이브 PC+Mobile 풀크롤
// 전체 sitemap URL × 2 viewport
// 콘솔/네트워크/pageerror/anchor target 검증
import puppeteer from 'puppeteer-core';

const CHROME = '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium';
const BASE = 'https://nolcool.com';

// Sample (sitemap의 1/4 critical + 모든 카테고리/지역/매거진/유틸 헤드)
const sitemapXml = await (await fetch(BASE + '/sitemap.xml')).text();
const allUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(BASE, ''));
console.log(`Total sitemap URLs: ${allUrls.length}`);

// Stratified sample: critical(home/cat/listing) 100% + venue/tag/region every 4th
const critical = allUrls.filter(u =>
  u === '/' || /^\/(clubs|nights|lounges|rooms|yojeong|hoppa|magazine|community|search|guide|safety|help|map|ranking|quiz|roulette|vs|compare|hidden|venue-info|events|gallery|welcome|profile|login|onboarding|pricing|dashboard|analytics|billing|launch|demo|case-studies|testimonials|status|privacy-promise|disclaimer|terms|privacy|venue-terms|lounge|lead)\/?$/.test(u)
  || /^\/(community|magazine|lounge|lead|best|new)\//.test(u)
);
const sampled = allUrls.filter((u, i) => !critical.includes(u) && i % 4 === 0);
const urls = [...new Set([...critical, ...sampled])];
console.log(`Sampled: ${urls.length} URLs`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});

async function probe(viewport, label) {
  const errors = { console: 0, network: 0, pageError: 0, nonOk: 0, anchorNoTab: 0 };
  const errorSamples = [];
  let pageCount = 0;
  let anchorTotal = 0;
  let anchorTabOk = 0;

  const sem = new Array(4).fill(null);
  let idx = 0;

  async function worker() {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    page.on('console', m => { if (m.type() === 'error') { errors.console++; if (errorSamples.length < 5) errorSamples.push(`console: ${m.text().slice(0, 120)}`); } });
    page.on('pageerror', e => { errors.pageError++; if (errorSamples.length < 5) errorSamples.push(`pageError: ${e.message.slice(0, 120)}`); });
    page.on('response', r => {
      const s = r.status();
      const u = r.url();
      if (u.startsWith(BASE) && s >= 400 && !u.includes('/api/')) {
        errors.network++;
        if (errorSamples.length < 8) errorSamples.push(`net ${s}: ${u}`);
      }
    });

    while (idx < urls.length) {
      const u = urls[idx++];
      pageCount++;
      try {
        const r = await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!r || r.status() !== 200) { errors.nonOk++; if (errorSamples.length < 8) errorSamples.push(`status ${r?.status()}: ${u}`); continue; }
        // anchor target 검사 (hydration 후)
        await new Promise(res => setTimeout(res, 200));
        const anchorStats = await page.evaluate(() => {
          const out = { total: 0, blank: 0, noBlank: [] };
          for (const a of document.querySelectorAll('a[href]')) {
            const href = a.getAttribute('href') || '';
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
            // 외부+내부 모두 새탭 정책
            out.total++;
            if (a.target === '_blank') out.blank++;
            else if (out.noBlank.length < 3) out.noBlank.push(href.slice(0, 60));
          }
          return out;
        });
        anchorTotal += anchorStats.total;
        anchorTabOk += anchorStats.blank;
        if (anchorStats.noBlank.length > 0) {
          errors.anchorNoTab += (anchorStats.total - anchorStats.blank);
          if (errorSamples.length < 12) errorSamples.push(`${u} anchor !target=_blank: ${anchorStats.noBlank.join(' | ')}`);
        }
      } catch (e) {
        errors.nonOk++;
        if (errorSamples.length < 8) errorSamples.push(`exc: ${u} ${e.message.slice(0, 60)}`);
      }
    }
    await page.close();
  }

  idx = 0;
  await Promise.all(sem.map(() => worker()));
  console.log(`\n=== ${label} ===`);
  console.log(`pages: ${pageCount}`);
  console.log(`console err: ${errors.console}, pageerr: ${errors.pageError}, network4xx-5xx: ${errors.network}, nonOk: ${errors.nonOk}`);
  console.log(`anchors: ${anchorTotal} total, ${anchorTabOk} target=_blank (${anchorTotal ? ((anchorTabOk/anchorTotal)*100).toFixed(1) : 0}%)`);
  if (errorSamples.length) console.log('samples:\n  ' + errorSamples.join('\n  '));
}

await probe({ width: 1366, height: 900 }, 'PC');
await probe({ width: 390, height: 844 }, 'Mobile');

await browser.close();
console.log('\n✅ 풀크롤 완료');
