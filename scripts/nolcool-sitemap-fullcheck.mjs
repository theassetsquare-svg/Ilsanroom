#!/usr/bin/env node
/**
 * nolcool-sitemap-fullcheck.mjs
 *
 * sitemap.xml의 모든 URL을 HEAD 요청으로 검증한다.
 * - 200 OK가 아닌 URL을 모두 수집
 * - 콘솔 + audit-reports/sitemap-fullcheck-YYYY-MM-DD.md 양쪽에 보고
 * - 4xx/5xx 1건 이상이면 exit 1
 *
 * 사용:
 *   node scripts/nolcool-sitemap-fullcheck.mjs                    # 라이브 (nolcool.com)
 *   SITE=https://ilsanroom.pages.dev node scripts/nolcool-sitemap-fullcheck.mjs
 *   CONCURRENCY=20 node scripts/nolcool-sitemap-fullcheck.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SITE = (process.env.SITE || 'https://nolcool.com').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY || 12);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

async function fetchText(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow' });
    return { ok: res.ok, status: res.status, text: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

async function checkUrl(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    // HEAD를 먼저 시도. CF Pages는 일부 404 페이지에 HEAD 미지원이라 GET 폴백.
    let res = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal: ctl.signal, redirect: 'follow' });
    }
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 0, ok: false, error: String(err?.message || err) };
  } finally {
    clearTimeout(t);
  }
}

function parseSitemap(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].trim());
  return locs;
}

async function runBatched(items, fn, concurrency) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

function fmtDateUTC() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

(async () => {
  console.log(`[fullcheck] site=${SITE} concurrency=${CONCURRENCY}`);
  const sitemapUrl = `${SITE}/sitemap.xml`;
  const sm = await fetchText(sitemapUrl);
  if (!sm.ok) {
    console.error(`[fullcheck] sitemap fetch failed: ${sm.status}`);
    process.exit(2);
  }
  const urls = parseSitemap(sm.text);
  console.log(`[fullcheck] sitemap URLs: ${urls.length}`);
  if (urls.length === 0) {
    console.error('[fullcheck] no <loc> entries');
    process.exit(2);
  }

  const startedAt = Date.now();
  const results = await runBatched(urls, checkUrl, CONCURRENCY);
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  const okCount = results.filter((r) => r.ok).length;
  const notOk = results.filter((r) => !r.ok);
  const by3xx = results.filter((r) => r.status >= 300 && r.status < 400);
  const by4xx = results.filter((r) => r.status >= 400 && r.status < 500);
  const by5xx = results.filter((r) => r.status >= 500);
  const netErr = results.filter((r) => r.status === 0);

  console.log('');
  console.log(`[fullcheck] elapsed=${elapsed}s`);
  console.log(`[fullcheck] total=${urls.length} ok=${okCount} 3xx=${by3xx.length} 4xx=${by4xx.length} 5xx=${by5xx.length} netErr=${netErr.length}`);

  if (notOk.length) {
    console.log('');
    console.log('[fullcheck] non-200 URLs:');
    for (const r of notOk.slice(0, 50)) {
      console.log(`  ${r.status}  ${r.url}${r.error ? ` (${r.error})` : ''}`);
    }
    if (notOk.length > 50) console.log(`  ... (+${notOk.length - 50} more)`);
  }

  // 마크다운 리포트 작성
  const reportsDir = resolve(ROOT, 'audit-reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const out = resolve(reportsDir, `sitemap-fullcheck-${fmtDateUTC()}.md`);
  const lines = [];
  lines.push(`# Sitemap Fullcheck — ${fmtDateUTC()}`);
  lines.push('');
  lines.push(`- site: ${SITE}`);
  lines.push(`- total URLs: ${urls.length}`);
  lines.push(`- 200 OK: ${okCount}`);
  lines.push(`- 3xx: ${by3xx.length}`);
  lines.push(`- 4xx: ${by4xx.length}`);
  lines.push(`- 5xx: ${by5xx.length}`);
  lines.push(`- net err: ${netErr.length}`);
  lines.push(`- elapsed: ${elapsed}s`);
  lines.push('');
  if (notOk.length === 0) {
    lines.push('## ✅ 모든 URL 200 OK');
  } else {
    lines.push(`## ⚠️ 비정상 ${notOk.length}건`);
    lines.push('');
    lines.push('| status | url | error |');
    lines.push('|---|---|---|');
    for (const r of notOk) {
      lines.push(`| ${r.status} | ${r.url} | ${r.error || ''} |`);
    }
  }
  writeFileSync(out, lines.join('\n') + '\n');
  console.log(`[fullcheck] report: ${out}`);

  // CI에서 4xx/5xx 발견 시 실패 표시
  const fatal = by4xx.length + by5xx.length + netErr.length;
  if (fatal > 0) {
    console.error(`[fullcheck] FAIL — ${fatal} URL(s) not 2xx/3xx`);
    process.exit(1);
  }
  console.log('[fullcheck] OK');
})();
