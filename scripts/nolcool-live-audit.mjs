#!/usr/bin/env node
// 놀쿨 라이브 사이트 정기 감사 — nolcool.com sitemap 전 페이지 fetch + 가드 룰 적용
// 사용: node scripts/nolcool-live-audit.mjs [--limit N] [--save report.json]
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;
const saveIdx = args.indexOf('--save');
const SAVE = saveIdx >= 0 ? args[saveIdx + 1] : null;

const BASE = 'https://nolcool.com';
const SITEMAP = `${BASE}/sitemap.xml`;
const CONCURRENCY = 8;

const stripHtml = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'nolcool-live-audit/1.0' } });
    return { status: r.status, text: await r.text() };
  } catch (e) {
    return { status: 0, text: '', err: e.message };
  }
}

console.log(`\ud83c\udf10 sitemap fetching\u2026 ${SITEMAP}`);
const sm = await fetchText(SITEMAP);
if (sm.status !== 200) { console.error(`sitemap fetch failed: ${sm.status}`); process.exit(1); }
let urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (LIMIT > 0) urls = urls.slice(0, LIMIT);
console.log(`\ud83d\udcc2 sitemap URL ${urls.length}\uac1c`);

const issues = [];
let done = 0;

async function audit(url) {
  const r = await fetchText(url);
  done++;
  if (done % 50 === 0) process.stdout.write(`  \u2026 ${done}/${urls.length}\r`);
  if (r.status !== 200) {
    issues.push({ url, sev: 'ERR', msg: `HTTP ${r.status}` });
    return;
  }
  const html = r.text;
  const path = new URL(url).pathname;
  const isHome = path === '/' || path === '/index.html';
  const add = (sev, msg) => issues.push({ url: path, sev, msg });

  const titleM = html.match(/<title>([^<]*)<\/title>/);
  const title = titleM ? titleM[1].trim() : '';
  if (!title) add('ERR', 'title \ub204\ub77d');
  else {
    if (title.length > 60) add('WARN', `title ${title.length}\uc790`);
    const tokens = title.replace(/[\u2014\-\u00b7,!?:|]/g, ' ').split(/\s+/).filter(t => t.length >= 2);
    const seen = new Map();
    for (const t of tokens) seen.set(t, (seen.get(t) || 0) + 1);
    const exactDup = [...seen.entries()].filter(([, n]) => n >= 2).map(([w]) => w);
    const shortSolo = tokens.filter(t => /^[\uac00-\ud7a3]{2,3}$/.test(t));
    const longCompound = tokens.filter(t => /^[\uac00-\ud7a3]{4,}$/.test(t));
    const partial = [...new Set(shortSolo)].filter(k => longCompound.some(L => L.includes(k)));
    if (exactDup.length || partial.length) add('ERR', `title \uc911\ubcf5 [${[...exactDup, ...partial].join(', ')}]`);
    if (!isHome && /\ub180\ucfe8/.test(title)) add('ERR', 'title \uc5d0 "\ub180\ucfe8"');
  }

  if (!/<meta\s+name=["']description["']/.test(html)) add('ERR', 'meta description \ub204\ub77d');
  if (!/<link\s+rel=["']canonical["']/.test(html)) add('ERR', 'canonical \ub204\ub77d');
  if (!/og:image/.test(html)) add('ERR', 'og:image \ub204\ub77d');
  if (!/<h1[\s>]/i.test(html)) add('ERR', 'H1 \ub204\ub77d');
  if (/ilsanroom\.pages\.dev/.test(html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/)?.[1] || '')) {
    add('ERR', 'canonical ilsanroom \ud558\ub4dc\ucf54\ub4dc');
  }

  const body = stripHtml(html);
  // 시즌82 정합 — "만원"은 가격 컨텍스트에서만 차단. 혜택/차비/이벤트 컨텍스트는 허용 (feedback_rules_serve_intent)
  for (const w of ['입장료', '가성비', '시세', '가격대']) {
    if (body.includes(w)) add('ERR', `본문 "${w}"`);
  }
  const MANWON_PRICE_RE = /(룸비|기본료|보증금|세팅비|입장(?!\s*가능)|메뉴|요금|가격|코스)\s*[\d일이삼사오육칠팔구십백천]*만원|[\d일이삼사오육칠팔구십백천]+\s*만원\s*(부터|이상|이하|선|대|짜리|상당)|만원대(?![가-힣])/;
  if (MANWON_PRICE_RE.test(body)) add('ERR', '본문 가격 컨텍스트 "만원"');
  const BANNED_RE = [
    /2\ucc28\s*(\uc11c\ube44\uc2a4|\ubaa8\uc784|\ucf5c|\uac00\ub2a5|\uac00\uaca9|\ube44\uc6a9|\uc9c4\ud589|\uc5f0\uacc4)/,
    /\ubb34\ub8cc\s*\uccb4\ud5d8/, /\ubd80\ubaa8\ub2d8\s*\uc0dd\uc2e0/, /\uc0c1\uacac\ub840/,
    /\uac00\uc871\s*\ubaa8\uc784/, /\ub3cc\uc794\uce58/, /\uacb0\ud63c\s*\uae30\ub150\uc77c/
  ];
  for (const re of BANNED_RE) if (re.test(body)) add('ERR', `\uae08\uc9c0\uc5b4 /${re.source}/`);

  if (/(thum\.io|microlink\.io|screenshotone)/.test(html)) add('ERR', '3rd-party \uc774\ubbf8\uc9c0');

  // 시즌55 — JSON-LD root @type 중복 차단 (Google Rich Results FAQPage \uc911\ubcf5 \ud68c\uadc0 \uac10\uc9c0)
  const ldRe = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi;
  const rootTypeCounts = {};
  let ldMatch;
  while ((ldMatch = ldRe.exec(html))) {
    try {
      const parsed = JSON.parse(ldMatch[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        if (it && typeof it === 'object' && it['@type']) {
          const t = Array.isArray(it['@type']) ? it['@type'].join('+') : it['@type'];
          rootTypeCounts[t] = (rootTypeCounts[t] || 0) + 1;
        }
      }
    } catch { add('ERR', 'JSON-LD parse \uc2e4\ud328'); }
  }
  for (const [t, c] of Object.entries(rootTypeCounts)) {
    if (c >= 2) add('ERR', `JSON-LD root @type "${t}" \uc911\ubcf5 ${c}\uac1c`);
  }

  const iframes = html.match(/<iframe[^>]*src=["'][^"']+["'][^>]*>/g) || [];
  for (const i of iframes) if (/(map\.kakao|map\.naver|maps\.google)/.test(i)) { add('ERR', '\uc9c0\ub3c4 iframe'); break; }
}

// 동시성 풀
const queue = [...urls];
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const u = queue.shift();
    if (u) await audit(u);
  }
});
await Promise.all(workers);

const errCnt = issues.filter(i => i.sev === 'ERR').length;
const warnCnt = issues.filter(i => i.sev === 'WARN').length;
console.log(`\n\ud83d\udcca \uacb0\uacfc: ${urls.length} URL / \ud83d\uded1 ERR ${errCnt} / \u26a0\ufe0f WARN ${warnCnt}`);

if (issues.length) {
  const byUrl = new Map();
  for (const i of issues) {
    if (!byUrl.has(i.url)) byUrl.set(i.url, []);
    byUrl.get(i.url).push(i);
  }
  let printed = 0;
  for (const [u, list] of byUrl) {
    if (printed >= 30) { console.log(`\u2026 (+${byUrl.size - 30}\ud398\uc774\uc9c0 \ub354)`); break; }
    console.log(`\n${u}`);
    for (const i of list) console.log(`  ${i.sev === 'ERR' ? '\ud83d\uded1' : '\u26a0\ufe0f'} ${i.msg}`);
    printed++;
  }
}

if (SAVE) {
  writeFileSync(SAVE, JSON.stringify({ ts: new Date().toISOString(), urls: urls.length, errCnt, warnCnt, issues }, null, 2));
  console.log(`\n\ud83d\udcbe \uc800\uc7a5: ${SAVE}`);
}

process.exit(errCnt > 0 ? 1 : 0);
