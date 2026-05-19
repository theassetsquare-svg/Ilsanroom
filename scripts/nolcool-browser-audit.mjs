#!/usr/bin/env node
/**
 * 놀쿨 PC+Mobile 헤드리스 브라우저 감사
 *
 * sitemap의 URL을 헤드리스 chrome으로 PC(1280×800) + Mobile(390×844) 양쪽 로드
 * 4축 캡처:
 *   - 콘솔 에러 (`console.on('error')`)
 *   - JS 런타임 에러 (`pageerror`)
 *   - 네트워크 4xx/5xx (`response`)
 *   - HTTP 상태 (load timeout 포함)
 *
 * 사용:
 *   node scripts/nolcool-browser-audit.mjs                          # 기본 50 URL × 2vp (smoke)
 *   node scripts/nolcool-browser-audit.mjs --limit 0                # 전체 sitemap
 *   node scripts/nolcool-browser-audit.mjs --vp pc                  # PC만
 *   node scripts/nolcool-browser-audit.mjs --vp mobile              # Mobile만
 *   node scripts/nolcool-browser-audit.mjs --save /tmp/browser.json # JSON 리포트
 *
 * 환경변수:
 *   CHROMIUM_PATH — chrome 실행 경로 (CI는 setup-chrome 액션, 로컬은 자동 탐지)
 */

import { writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const arg = (k, dflt) => {
  const i = args.indexOf(k);
  if (i < 0) return dflt;
  return args[i + 1];
};
const LIMIT = parseInt(arg('--limit', '50'), 10);
const VP = arg('--vp', 'both'); // 'pc' | 'mobile' | 'both'
const SAVE = arg('--save', null);
const BASE = arg('--base', 'https://nolcool.com');
const CONCURRENCY = parseInt(arg('--concurrency', '4'), 10);

function findChromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  // try `which` for nix-store paths
  try {
    const w = execSync('which chromium 2>/dev/null || which google-chrome 2>/dev/null', { encoding: 'utf8' }).trim();
    if (w && existsSync(w)) return w;
  } catch {}
  return null;
}

const CHROME = findChromium();
if (!CHROME) {
  console.error('❌ chromium 미설치. CHROMIUM_PATH 환경변수 또는 setup-chrome 액션 필요');
  process.exit(1);
}
console.log(`🌐 chromium: ${CHROME}`);

const puppeteer = (await import('puppeteer-core')).default;

async function fetchSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`);
  if (!r.ok) throw new Error(`sitemap fetch ${r.status}`);
  const text = await r.text();
  return [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

const VIEWPORTS = {
  pc: { width: 1280, height: 800, isMobile: false, deviceScaleFactor: 1, ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
  mobile: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 3, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
};

async function auditOne(browser, url, vpName) {
  const vp = VIEWPORTS[vpName];
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, deviceScaleFactor: vp.deviceScaleFactor });
  await page.setUserAgent(vp.ua);
  const issues = [];
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      // ignore noise: 404 favicon, third-party tracker blocks
      if (/favicon|chrome-extension|net::ERR_BLOCKED_BY_CLIENT/.test(t)) return;
      issues.push({ sev: 'CONSOLE', msg: t.slice(0, 200) });
    }
  });
  page.on('pageerror', e => issues.push({ sev: 'JS', msg: (e.message || String(e)).slice(0, 200) }));
  page.on('response', r => {
    const s = r.status();
    if (s >= 400) {
      const u = r.url();
      // ignore: external trackers, GA, etc
      if (/google-analytics|googletagmanager|googleads|doubleclick|gstatic|fonts\.googleapis/.test(u)) return;
      issues.push({ sev: 'NET', msg: `${s} ${u.slice(0, 120)}` });
    }
  });
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    if (!resp || resp.status() >= 400) issues.push({ sev: 'HTTP', msg: `${resp ? resp.status() : 'no-response'}` });
  } catch (e) {
    issues.push({ sev: 'LOAD', msg: (e.message || String(e)).slice(0, 200) });
  }
  await page.close();
  return issues;
}

async function main() {
  console.log(`📂 sitemap fetching: ${BASE}/sitemap.xml`);
  let urls = await fetchSitemap();
  console.log(`📄 sitemap URL: ${urls.length}`);
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);
  const viewports = VP === 'both' ? ['pc', 'mobile'] : [VP];
  console.log(`🚀 ${urls.length} URL × ${viewports.length} viewport = ${urls.length * viewports.length} loads (concurrency ${CONCURRENCY})`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];
  let done = 0;
  const total = urls.length * viewports.length;

  // job queue: [url, vp] pairs
  const queue = [];
  for (const u of urls) for (const v of viewports) queue.push([u, v]);

  async function worker() {
    while (queue.length) {
      const [u, v] = queue.shift();
      const issues = await auditOne(browser, u, v);
      done++;
      if (done % 10 === 0 || done === total) process.stdout.write(`  … ${done}/${total}\r`);
      if (issues.length) results.push({ url: u.replace(BASE, '') || '/', vp: v, issues });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await browser.close();

  const stats = { CONSOLE: 0, JS: 0, NET: 0, HTTP: 0, LOAD: 0 };
  for (const r of results) for (const i of r.issues) stats[i.sev] = (stats[i.sev] || 0) + 1;
  const totalErrors = Object.values(stats).reduce((a, b) => a + b, 0);

  console.log('\n');
  console.log(`📊 ${total} loads / 🛑 ${totalErrors} 이슈`);
  console.log(`   CONSOLE: ${stats.CONSOLE}  JS: ${stats.JS}  NET: ${stats.NET}  HTTP: ${stats.HTTP}  LOAD: ${stats.LOAD}`);

  if (results.length) {
    console.log('\n📋 이슈 상위 20:');
    for (const r of results.slice(0, 20)) {
      console.log(`\n[${r.vp}] ${r.url}`);
      for (const i of r.issues.slice(0, 3)) console.log(`  🛑 ${i.sev}: ${i.msg}`);
    }
    if (results.length > 20) console.log(`\n… (+${results.length - 20}건 더)`);
  }

  if (SAVE) {
    writeFileSync(SAVE, JSON.stringify({
      ts: new Date().toISOString(),
      base: BASE,
      total_loads: total,
      total_issues: totalErrors,
      stats,
      results,
    }, null, 2));
    console.log(`\n💾 저장: ${SAVE}`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
