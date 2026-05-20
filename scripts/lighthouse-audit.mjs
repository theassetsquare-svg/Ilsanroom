#!/usr/bin/env node
/**
 * 놀쿨 Lighthouse 일일 감사 (4 카테고리: perf / a11y / best-practices / seo)
 *
 * - 대표 페이지 × PC + Mobile (form factor 2종)
 * - 90 미만 페이지/카테고리 표시 + JSON 저장
 * - CI: GitHub Actions cron (lighthouse-daily.yml) — 매일 KST 04:00
 *
 * 자동 코드 수정은 하지 않음. 미달 리포트만 생성 → 사람이 수정 판단.
 * Core Web Vitals (LCP/CLS/INP) 상세는 scripts/nolcool-perf-audit.mjs 가 별도 담당.
 *
 * 사용:
 *   node scripts/lighthouse-audit.mjs                 # 기본 (7 페이지 × 2 form factor)
 *   node scripts/lighthouse-audit.mjs --save out.json
 *   node scripts/lighthouse-audit.mjs --base https://nolcool.com
 */

import { writeFileSync, existsSync } from 'node:fs';
import { URL } from 'node:url';

const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i < 0 ? dflt : args[i + 1]; };
const SAVE = arg('--save', null);
const BASE = arg('--base', 'https://nolcool.com');
const ONLY = arg('--only', null); // 'mobile' | 'desktop'

// 끝에 슬래시 — CF Pages가 prerender + 308 리다이렉트 회피 (Lighthouse는 리다이렉트 후 측정이라 시간 손해)
const TARGET_PAGES = [
  '/',
  '/clubs/',
  '/nights/',
  '/lounges/',
  '/community/',
  '/magazine/',
  '/best/clubs/',
];

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
const lighthouse = (await import('lighthouse')).default;

const FORM_FACTORS = ['mobile', 'desktop'];
const SCREEN_EMU = {
  mobile:  { width: 390, height: 844,  deviceScaleFactor: 3, mobile: true },
  desktop: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
};
const THROTTLING = {
  mobile:  { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },   // Slow 4G
  desktop: { rttMs: 40,  throughputKbps: 10240,  cpuSlowdownMultiplier: 1 },
};

async function measure(browser, url, formFactor) {
  const port = new URL(browser.wsEndpoint()).port;
  const result = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor,
    throttling: THROTTLING[formFactor],
    screenEmulation: SCREEN_EMU[formFactor],
    emulatedUserAgent: formFactor === 'mobile'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  });

  const lhr = result.lhr;
  const cat = lhr.categories;
  const audit = (id) => lhr.audits[id]?.numericValue;

  return {
    url: url.replace(BASE, '') || '/',
    formFactor,
    perf: Math.round(cat.performance.score * 100),
    a11y: Math.round(cat.accessibility.score * 100),
    bp:   Math.round(cat['best-practices'].score * 100),
    seo:  Math.round(cat.seo.score * 100),
    lcp:  Math.round(audit('largest-contentful-paint') || 0),
    cls:  +(audit('cumulative-layout-shift') || 0).toFixed(3),
    fcp:  Math.round(audit('first-contentful-paint') || 0),
    tbt:  Math.round(audit('total-blocking-time') || 0),
    si:   Math.round(audit('speed-index') || 0),
  };
}

function dot(n) {
  if (n >= 90) return '🟢';
  if (n >= 75) return '🟡';
  return '🔴';
}

async function main() {
  const factors = ONLY ? [ONLY] : FORM_FACTORS;
  const urls = TARGET_PAGES.map(p => `${BASE}${p}`);
  console.log(`🚀 Lighthouse — ${urls.length} pages × ${factors.length} form factors = ${urls.length * factors.length} runs`);
  console.log(`🌐 chromium: ${CHROME}`);
  console.log(`📍 base: ${BASE}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0'],
  });

  const results = [];
  for (const url of urls) {
    for (const ff of factors) {
      try {
        const r = await measure(browser, url, ff);
        results.push(r);
        console.log(`  ${dot(r.perf)}P ${dot(r.a11y)}A ${dot(r.bp)}B ${dot(r.seo)}S  [${ff.padEnd(7)}] ` +
          `perf ${String(r.perf).padStart(3)} / a11y ${String(r.a11y).padStart(3)} / bp ${String(r.bp).padStart(3)} / seo ${String(r.seo).padStart(3)}  ` +
          `LCP ${String(r.lcp).padStart(5)}ms CLS ${r.cls.toFixed(3)}  ${r.url}`);
      } catch (e) {
        const msg = (e?.message || String(e)).slice(0, 80);
        results.push({ url: url.replace(BASE, '') || '/', formFactor: ff, error: msg });
        console.log(`  ❌ [${ff}] ${url.replace(BASE, '')} — ${msg}`);
      }
    }
  }

  await browser.close();

  // Aggregate
  console.log('\n📊 집계 (90 미만 = ⚠️):');
  const failing = [];
  for (const ff of factors) {
    const rs = results.filter(r => r.formFactor === ff && !r.error);
    if (!rs.length) continue;
    const avg = (k) => Math.round(rs.reduce((s, r) => s + (r[k] || 0), 0) / rs.length);
    console.log(`\n  [${ff}] ${rs.length} pages`);
    console.log(`    perf avg ${avg('perf')}  / a11y avg ${avg('a11y')}  / bp avg ${avg('bp')}  / seo avg ${avg('seo')}`);
    for (const cat of ['perf', 'a11y', 'bp', 'seo']) {
      const fails = rs.filter(r => r[cat] < 90);
      if (fails.length) {
        console.log(`    ⚠️  ${cat} < 90 (${fails.length}/${rs.length}): ${fails.map(f => `${f.url}:${f[cat]}`).join(', ')}`);
        fails.forEach(f => failing.push({ ff, url: f.url, cat, score: f[cat] }));
      }
    }
  }

  const summary = {
    ts: new Date().toISOString(),
    base: BASE,
    total: results.length,
    failing_count: failing.length,
    failing,
    results,
  };

  if (SAVE) {
    writeFileSync(SAVE, JSON.stringify(summary, null, 2));
    console.log(`\n💾 저장: ${SAVE}`);
  }

  console.log(`\n${failing.length === 0 ? '✅ 모든 카테고리 90+' : `⚠️  ${failing.length}건 90 미만`}`);
  // CI는 실패시 알림용으로 exit 0 유지 (artifact + 콘솔로 충분)
  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
