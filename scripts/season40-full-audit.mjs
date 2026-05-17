#!/usr/bin/env node
// 시즌40 라이브 풀크롤: nolcool.com sitemap × PC+Mobile, 콘솔/네트워크/JS 에러 수집
import puppeteer from 'puppeteer';
import { execSync } from 'node:child_process';

const SITEMAP = 'https://nolcool.com/sitemap.xml';
const CHROMIUM = '/nix/store/lpdrfl6n16q5zdf8acp4bni7yczzcx3h-idx-builtins/bin/chromium';
const PC = { width: 1280, height: 800 };
const MOB = { width: 390, height: 844 };

// sitemap에서 URL 추출
const xml = execSync(`curl -s ${SITEMAP}`).toString();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(`📍 sitemap URL ${urls.length}개 로드`);

const browser = await puppeteer.launch({
  executablePath: CHROMIUM,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const stats = { total: 0, ok: 0, console: 0, jsErr: 0, netErr: 0, http4xx5xx: 0 };
const issues = [];

async function crawl(url, viewport, label) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const consoleErrs = [];
  const jsErrs = [];
  const netErrs = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', e => jsErrs.push(String(e)));
  page.on('requestfailed', r => {
    const fa = r.failure();
    // ERR_ABORTED는 puppeteer 자체 정리로 흔히 발생 — 무시
    if (fa && !/ERR_ABORTED/.test(fa.errorText)) netErrs.push(`${r.url()} ${fa.errorText}`);
  });
  page.on('response', r => { if (r.status() >= 400) stats.http4xx5xx++; });

  let httpStatus = 0;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    httpStatus = resp ? resp.status() : 0;
    if (httpStatus >= 200 && httpStatus < 400) stats.ok++;
  } catch (e) {
    issues.push(`[${label}] ${url} GOTO ${e.message.slice(0, 80)}`);
  }
  stats.console += consoleErrs.length;
  stats.jsErr += jsErrs.length;
  stats.netErr += netErrs.length;
  if (consoleErrs.length || jsErrs.length || netErrs.length) {
    issues.push(`[${label}] ${url} console=${consoleErrs.length} js=${jsErrs.length} net=${netErrs.length}`);
    if (consoleErrs[0]) issues.push(`   console: ${consoleErrs[0].slice(0, 100)}`);
    if (jsErrs[0]) issues.push(`   js: ${jsErrs[0].slice(0, 100)}`);
    if (netErrs[0]) issues.push(`   net: ${netErrs[0].slice(0, 100)}`);
  }
  await page.close();
}

console.log('🖥️  PC 풀크롤 시작...');
for (const u of urls) {
  stats.total++;
  await crawl(u, PC, 'PC');
  if (stats.total % 50 === 0) console.log(`   ${stats.total}/${urls.length} (ok=${stats.ok} err=${stats.console + stats.jsErr + stats.netErr})`);
}
console.log(`✅ PC 완료 — ok=${stats.ok} console=${stats.console} jsErr=${stats.jsErr} netErr=${stats.netErr}`);

console.log('📱 Mobile 풀크롤 시작...');
const pcOk = stats.ok;
for (const u of urls) {
  stats.total++;
  await crawl(u, MOB, 'MOB');
  if ((stats.total - urls.length) % 50 === 0) console.log(`   ${stats.total - urls.length}/${urls.length}`);
}
console.log(`✅ Mobile 완료 — 누적 ok=${stats.ok} (PC ${pcOk}, MOB ${stats.ok - pcOk})`);

await browser.close();

console.log('\n📊 시즌40 풀크롤 종합');
console.log(`   총 로드: ${stats.total} / 2xx-3xx: ${stats.ok}`);
console.log(`   콘솔 에러: ${stats.console}`);
console.log(`   JS 에러: ${stats.jsErr}`);
console.log(`   네트워크 에러: ${stats.netErr}`);
console.log(`   HTTP 4xx/5xx 응답: ${stats.http4xx5xx}`);
if (issues.length) {
  console.log(`\n⚠️  이슈 ${issues.length}건 (상위 30건):`);
  for (const i of issues.slice(0, 30)) console.log(`   ${i}`);
} else {
  console.log('\n🎉 0 이슈');
}
process.exit(issues.length ? 1 : 0);
