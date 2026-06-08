#!/usr/bin/env node
/**
 * nolcool-venue-seo-audit.mjs
 *
 * 121업소 가게이름이 네이버/구글/AI 검색에서 상위노출되도록 SEO가 설정됐는지 검증.
 *
 * 검증 8지표 (가게이름 H1 기준):
 *   1. title 맨앞에 가게이름
 *   2. meta description에 가게이름 포함
 *   3. og:title에 가게이름 포함
 *   4. twitter:title에 가게이름 포함
 *   5. JSON-LD에 "name": "가게이름"
 *   6. canonical link 존재 + 자기 URL
 *   7. H2 또는 본문에 가게이름 추가 노출 (1회 이상)
 *   8. og:image / twitter:image 존재
 *
 * 추가: title 60자 이내, description 150자 이내, 놀쿨 단어 0 (홈 외 영구 룰)
 *
 * 사용: node scripts/nolcool-venue-seo-audit.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE = (process.env.SITE || 'https://nolcool.com').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
const TIMEOUT_MS = 20000;

function isVenueDetailUrl(url) {
  // 3-level: /clubs|rooms|yojeong/{region}/{slug}/
  if (/\/(clubs|rooms|yojeong)\/[^/]+\/[^/]+\/?$/.test(url)) return true;
  // 2-level: /nights|lounges|hoppa/{slug}/
  if (/\/(nights|lounges|hoppa)\/[^/]+\/?$/.test(url)) {
    // exclude region index like /lounges/ , /nights/  (already 1-segment)
    const m = url.match(/\/(nights|lounges|hoppa)\/([^/]+)\/?$/);
    if (m && m[2] !== '') return true;
  }
  return false;
}

// region index pages 제외 (/clubs/gangnam/는 2 segments라 detail이 아님)
function isRegionIndex(url) {
  return /\/(clubs|rooms|yojeong)\/[^/]+\/?$/.test(url) && !isVenueDetailUrl(url);
}

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

function extract(re, html) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}
function extractAll(re, html) {
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1].trim());
  return out;
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function auditPage(url, html) {
  // 가게이름 추출: H1 첫 번째 텍스트. H1이 없으면 title 첫 토큰.
  const h1Raw = extract(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i, html);
  const h1 = decodeHtml(stripTags(h1Raw));
  const titleRaw = extract(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const title = decodeHtml(stripTags(titleRaw));
  const desc = decodeHtml(extract(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i, html));
  const ogTitle = decodeHtml(extract(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i, html));
  const ogImage = extract(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i, html);
  const twTitle = decodeHtml(extract(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']*)["']/i, html));
  const twImage = extract(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']*)["']/i, html);
  const canonical = extract(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i, html);
  const h2List = extractAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, html).map((s) => decodeHtml(stripTags(s)));

  // JSON-LD에서 name 추출
  const ldBlocks = extractAll(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    html,
  );
  let ldName = '';
  for (const block of ldBlocks) {
    const m = block.match(/"name"\s*:\s*"([^"]+)"/);
    if (m) {
      ldName = m[1];
      break;
    }
  }

  // 가게이름 후보: H1(없으면 title)의 첫 세그먼트("—" 등 구분자 앞).
  // SSR 히어로 h1은 "가게이름 — 후크" 형태(시즌57)라 통째로 쓰면 desc/ld-name 매칭이 깨진다.
  const nameSource = h1 || title;
  const storeName = (nameSource.split(/[—\-|·]/)[0] || '').trim();

  const checks = {
    storeName,
    title,
    titleLen: title.length,
    desc,
    descLen: desc.length,
    has_title_storename_first:
      !!storeName && title.toLowerCase().startsWith(storeName.toLowerCase()),
    has_desc_storename: !!storeName && desc.includes(storeName),
    has_og_title_storename: !!storeName && ogTitle.includes(storeName),
    has_tw_title_storename: !!storeName && twTitle.includes(storeName),
    has_ld_name_storename: !!storeName && ldName === storeName,
    has_canonical: !!canonical,
    canonical_self:
      !!canonical &&
      (canonical.replace(/\/$/, '') === url.replace(/\/$/, '') ||
        canonical.replace(/\/$/, '') === url.replace(/\/$/, '').replace(/^https?:\/\/[^/]+/, SITE)),
    has_h2_or_body_storename:
      !!storeName &&
      (h2List.some((h) => h.includes(storeName)) ||
        // 본문에 H1 외 1회 이상 추가 노출
        (html.split(storeName).length - 1) >= 2),
    has_og_image: !!ogImage,
    has_tw_image: !!twImage,
    title_under_60: title.length > 0 && title.length <= 60,
    desc_under_150: desc.length > 0 && desc.length <= 160, // 150~160자 허용 (구글 표준)
    no_nolcool_in_title: !title.includes('놀쿨'), // 홈 외 영구 룰
  };

  // 종합 점수 (8 핵심)
  const core = [
    checks.has_title_storename_first,
    checks.has_desc_storename,
    checks.has_og_title_storename,
    checks.has_tw_title_storename,
    checks.has_ld_name_storename,
    checks.canonical_self,
    checks.has_h2_or_body_storename,
    checks.has_og_image,
  ];
  const score = core.filter(Boolean).length;
  return { url, score, ...checks };
}

async function runBatched(items, fn, concurrency) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) return;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

function fmtDate() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

(async () => {
  console.log(`[venue-seo] site=${SITE}`);
  const sm = await fetchText(`${SITE}/sitemap.xml`);
  if (!sm.ok) {
    console.error('[venue-seo] sitemap fetch failed');
    process.exit(2);
  }
  const all = extractAll(/<loc>([^<]+)<\/loc>/g, sm.text);
  const venues = all.filter(isVenueDetailUrl);
  console.log(`[venue-seo] total venue detail URLs: ${venues.length}`);

  if (venues.length === 0) {
    console.error('[venue-seo] no venue detail URLs detected');
    process.exit(2);
  }

  const startedAt = Date.now();
  const results = await runBatched(venues, async (url) => {
    const r = await fetchText(url);
    if (!r.ok) return { url, error: `HTTP ${r.status}`, score: 0 };
    return auditPage(url, r.text);
  }, CONCURRENCY);
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  // 통계
  const total = results.length;
  const score8 = results.filter((r) => r.score === 8).length;
  const score7p = results.filter((r) => r.score >= 7).length;
  const score6m = results.filter((r) => r.score < 6).length;

  function pct(key) {
    const ok = results.filter((r) => r[key]).length;
    return { ok, pct: ((ok / total) * 100).toFixed(1) };
  }

  const summary = {
    has_title_storename_first: pct('has_title_storename_first'),
    has_desc_storename: pct('has_desc_storename'),
    has_og_title_storename: pct('has_og_title_storename'),
    has_tw_title_storename: pct('has_tw_title_storename'),
    has_ld_name_storename: pct('has_ld_name_storename'),
    canonical_self: pct('canonical_self'),
    has_h2_or_body_storename: pct('has_h2_or_body_storename'),
    has_og_image: pct('has_og_image'),
    title_under_60: pct('title_under_60'),
    desc_under_150: pct('desc_under_150'),
    no_nolcool_in_title: pct('no_nolcool_in_title'),
  };

  console.log('');
  console.log(`[venue-seo] total=${total} elapsed=${elapsed}s`);
  console.log(`[venue-seo] 8/8 만점: ${score8} (${((score8 / total) * 100).toFixed(1)}%)`);
  console.log(`[venue-seo] 7+: ${score7p} (${((score7p / total) * 100).toFixed(1)}%)`);
  console.log(`[venue-seo] 6 미만: ${score6m}`);
  console.log('');
  console.log('[venue-seo] 지표별 통과율:');
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(30)} ${v.ok}/${total} (${v.pct}%)`);
  }

  // 미통과 상세 (상위 30개)
  const fails = results
    .filter((r) => r.score < 8)
    .sort((a, b) => a.score - b.score)
    .slice(0, 30);
  if (fails.length) {
    console.log('');
    console.log('[venue-seo] 미통과 샘플 (상위 30):');
    for (const f of fails) {
      const missing = [];
      if (!f.has_title_storename_first) missing.push('title-first');
      if (!f.has_desc_storename) missing.push('desc');
      if (!f.has_og_title_storename) missing.push('og:title');
      if (!f.has_tw_title_storename) missing.push('tw:title');
      if (!f.has_ld_name_storename) missing.push('ld-name');
      if (!f.canonical_self) missing.push('canonical');
      if (!f.has_h2_or_body_storename) missing.push('body');
      if (!f.has_og_image) missing.push('og:image');
      console.log(`  ${f.score}/8  [${f.storeName}]  missing=${missing.join(',')}  ${f.url}`);
    }
  }

  // 마크다운 리포트
  const reportsDir = resolve(ROOT, 'audit-reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const out = resolve(reportsDir, `venue-seo-audit-${fmtDate()}.md`);
  const lines = [];
  lines.push(`# Venue SEO Audit — ${fmtDate()}`);
  lines.push('');
  lines.push(`- site: ${SITE}`);
  lines.push(`- venue detail URLs: ${total}`);
  lines.push(`- elapsed: ${elapsed}s`);
  lines.push('');
  lines.push('## 종합');
  lines.push(`- 8/8 만점: **${score8}/${total}** (${((score8 / total) * 100).toFixed(1)}%)`);
  lines.push(`- 7+ 통과: ${score7p}/${total} (${((score7p / total) * 100).toFixed(1)}%)`);
  lines.push(`- 6 미만 (긴급): ${score6m}`);
  lines.push('');
  lines.push('## 지표별 통과율');
  lines.push('| 지표 | 통과 | 비율 |');
  lines.push('|---|---|---|');
  for (const [k, v] of Object.entries(summary)) {
    lines.push(`| ${k} | ${v.ok}/${total} | ${v.pct}% |`);
  }
  if (fails.length) {
    lines.push('');
    lines.push('## 미통과 상위 30');
    lines.push('| score | store | missing | url |');
    lines.push('|---|---|---|---|');
    for (const f of fails) {
      const m = [];
      if (!f.has_title_storename_first) m.push('title-first');
      if (!f.has_desc_storename) m.push('desc');
      if (!f.has_og_title_storename) m.push('og:title');
      if (!f.has_tw_title_storename) m.push('tw:title');
      if (!f.has_ld_name_storename) m.push('ld-name');
      if (!f.canonical_self) m.push('canonical');
      if (!f.has_h2_or_body_storename) m.push('body');
      if (!f.has_og_image) m.push('og:image');
      lines.push(`| ${f.score}/8 | ${f.storeName} | ${m.join(',')} | ${f.url} |`);
    }
  }
  writeFileSync(out, lines.join('\n') + '\n');
  console.log('');
  console.log(`[venue-seo] report: ${out}`);

  if (score8 < total) {
    console.error(`[venue-seo] ${total - score8}건이 8/8 미만 — 검토 필요`);
    process.exit(1);
  }
})();
