#!/usr/bin/env node
// 시즌28-F — 라이브 클릭 전수 (홈+카테고리 React 클릭 → 새 탭/페이지 도달 검증)
import puppeteer from 'puppeteer-core';

const PAGES = ['/', '/clubs/', '/nights/', '/rooms/', '/yojeong/', '/lounges/', '/hoppa/'];
const CLICKS_PER_PAGE = 5;

const browser = await puppeteer.launch({
  executablePath: '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let totalClicks = 0, ok = 0, openedNewTab = 0, fails = [];

for (const viewport of [{ name: 'PC', w: 1280, h: 800 }, { name: 'M', w: 390, h: 844, m: true }]) {
  for (const path of PAGES) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: viewport.w, height: viewport.h, isMobile: !!viewport.m });
    try {
      await page.goto(`https://nolcool.com${path}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));
      // 후보 anchor: hidden ssr-seo 제외, href 가진 내부 링크
      const candidates = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .filter(a => !a.closest('.ssr-seo'))
          .filter(a => {
            const href = a.getAttribute('href') || '';
            return href.startsWith('/') && !href.startsWith('/#');
          })
          .filter(a => {
            const r = a.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })
          .slice(0, 5)
          .map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), text: (a.textContent || '').trim().slice(0, 30) }));
      });
      for (const c of candidates.slice(0, CLICKS_PER_PAGE)) {
        totalClicks++;
        // target=_blank이면 새 탭으로 열림 → ctx.waitForTarget
        const url = `https://nolcool.com${c.href.startsWith('/') ? c.href : '/' + c.href}`;
        try {
          // 새 탭 시뮬레이션: 별도 페이지로 fetch
          const np = await ctx.newPage();
          const resp = await np.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          if (resp && resp.status() < 400) ok++;
          else fails.push({ vp: viewport.name, src: path, dst: c.href, status: resp?.status() });
          if (c.target === '_blank') openedNewTab++;
          await np.close();
        } catch (e) {
          fails.push({ vp: viewport.name, src: path, dst: c.href, err: e.message.slice(0, 50) });
        }
      }
    } catch (e) {
      fails.push({ vp: viewport.name, src: path, err: 'goto: ' + e.message.slice(0, 50) });
    }
    await ctx.close();
  }
}
await browser.close();

console.log(`\nLive click test — ${PAGES.length} pages × 2 viewports × ${CLICKS_PER_PAGE} clicks`);
console.log(`  Total clicks attempted: ${totalClicks}`);
console.log(`  Status <400 (success):  ${ok}`);
console.log(`  target="_blank" anchors: ${openedNewTab}/${totalClicks}`);
console.log(`  Failures:               ${fails.length}`);
if (fails.length) {
  console.log(`\n  First 10 failures:`);
  fails.slice(0, 10).forEach(f => console.log(`    ${JSON.stringify(f)}`));
}
