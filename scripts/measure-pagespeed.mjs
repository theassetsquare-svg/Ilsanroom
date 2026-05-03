// 실기기 페이지 속도 측정 — puppeteer-core + 시스템 Chromium
// 모바일 에뮬레이션 + Web Vitals (LCP, FCP, CLS, TTFB) 수집
import puppeteer from 'puppeteer-core';

const CHROMIUM = '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium';

const PAGES = [
  { url: 'https://nolcool.com/', label: '홈' },
  { url: 'https://nolcool.com/clubs/', label: '클럽' },
  { url: 'https://nolcool.com/community/', label: '커뮤니티' },
  { url: 'https://nolcool.com/ranking', label: '랭킹' },
  { url: 'https://nolcool.com/login', label: '로그인' },
];

async function measure(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

  // CDP: 4G mobile network throttle (download 1.6Mbps, upload 750Kbps, RTT 150ms)
  const client = await page.target().createCDPSession();
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
  });
  // 4x CPU slowdown (mid-tier mobile)
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // observers must run before navigation
  await page.evaluateOnNewDocument(() => {
    window.__metrics = { lcp: 0, cls: 0, fcp: 0, longTasks: 0 };
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__metrics.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') window.__metrics.fcp = e.startTime;
      }
    }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) window.__metrics.longTasks += e.duration;
    }).observe({ type: 'longtask', buffered: true });
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
  const navMs = Date.now() - t0;

  // wait extra 3s for LCP/CLS to stabilize
  await new Promise(r => setTimeout(r, 3000));

  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      ttfb: nav.responseStart - nav.requestStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      lcp: window.__metrics.lcp,
      cls: window.__metrics.cls,
      fcp: window.__metrics.fcp,
      longTasks: window.__metrics.longTasks,
    };
  });

  await page.close();
  return { ...m, navMs };
}

const fmt = (n) => n == null ? '-' : n >= 1000 ? (n/1000).toFixed(2)+'s' : Math.round(n)+'ms';
const verdict = (m) => {
  const issues = [];
  if (m.lcp > 2500) issues.push(`LCP느림(${(m.lcp/1000).toFixed(1)}s)`);
  if (m.cls > 0.1) issues.push(`CLS${m.cls.toFixed(2)}`);
  if (m.longTasks > 500) issues.push(`긴JS작업${Math.round(m.longTasks)}ms`);
  if (m.ttfb > 800) issues.push(`서버느림(TTFB${Math.round(m.ttfb)}ms)`);
  return issues;
};

console.log('Chromium 시작 (모바일 4G + 4xCPU throttle)...');
const browser = await puppeteer.launch({
  executablePath: CHROMIUM,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

console.log('='.repeat(110));
console.log('페이지'.padEnd(12), 'TTFB'.padStart(7), 'FCP'.padStart(7), 'LCP'.padStart(8), 'CLS'.padStart(6), 'DCL'.padStart(7), 'Load'.padStart(7), 'longJS'.padStart(7), '판정');
console.log('-'.repeat(110));

const results = [];
for (const p of PAGES) {
  try {
    const m = await measure(browser, p.url);
    results.push({ ...p, ...m });
    const issues = verdict(m);
    console.log(
      p.label.padEnd(12),
      fmt(m.ttfb).padStart(7),
      fmt(m.fcp).padStart(7),
      fmt(m.lcp).padStart(8),
      m.cls.toFixed(3).padStart(6),
      fmt(m.domContentLoaded).padStart(7),
      fmt(m.loadComplete).padStart(7),
      fmt(m.longTasks).padStart(7),
      issues.length === 0 ? '✓' : '⚠ ' + issues.join(', ')
    );
  } catch (e) {
    console.log(p.label.padEnd(12), 'ERROR', e.message.slice(0, 60));
  }
}
console.log('='.repeat(110));
await browser.close();

if (results.length > 0) {
  const avg = (key) => results.reduce((s, r) => s + (r[key] || 0), 0) / results.length;
  console.log(`\n평균: TTFB=${Math.round(avg('ttfb'))}ms FCP=${(avg('fcp')/1000).toFixed(2)}s LCP=${(avg('lcp')/1000).toFixed(2)}s CLS=${avg('cls').toFixed(3)}`);
  const fails = results.filter(r => verdict(r).length > 0);
  if (fails.length === 0) console.log('✓ 5개 페이지 모두 모바일 기준 통과');
  else console.log(`⚠ 보강 필요: ${fails.map(f => f.label).join(', ')}`);
}
