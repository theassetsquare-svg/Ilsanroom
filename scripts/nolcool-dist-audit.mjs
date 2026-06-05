#!/usr/bin/env node
// 놀쿨 dist HTML 감사 — vite build + prerender-seo 직후 실행
// 위반 시 exit 1로 빌드/배포 중단.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] || 'dist';
const stripHtml = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (e.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
console.log(`📂 ${ROOT} HTML ${files.length}개 감사 시작…`);

// ★ 위험단어(불법 연관·SEO 페널티) — dist 본문/타이틀 전수 차단 (재발 방지 게이트).
//   매핑 가이드: 밤문화/유흥→나이트라이프 · 노래방→가라오케 · 룸살롱/룸싸롱→프라이빗룸 · 초이스→셀렉션
const DANGEROUS = ['밤문화', '유흥', '룸살롱', '룸싸롱', '노래방', '초이스'];
// owner 승인 예외: { '/some/url/': ['초이스'] } 형태로 URL별 허용 단어 등록 (기본 0건 — dist는 깨끗해야 함).
const DANGEROUS_EXCEPTIONS = {};

const issues = [];
const titleMap = new Map();

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = relative('.', f);
  const isHome = rel === `${ROOT}/index.html` || rel === 'dist/index.html';
  const is404 = /\/404\.html$/.test(rel);
  const url = rel.replace(/^dist\//, '/').replace(/\/index\.html$/, '/').replace(/^\//, '/');
  const add = (sev, msg) => issues.push({ url, sev, msg });

  const titleM = html.match(/<title>([^<]*)<\/title>/);
  const title = titleM ? titleM[1].trim() : '';
  if (!title) add('ERR', 'title 누락');
  else {
    if (title.length > 60) add('WARN', `title ${title.length}\uc790 (60\uc790 \ud55c\uacc4)`);
    const tokens = title.replace(/[\u2014\-\u00b7,!?:|]/g, ' ').split(/\s+/).filter(t => t.length >= 2);
    const seen = new Map();
    for (const t of tokens) seen.set(t, (seen.get(t) || 0) + 1);
    const exactDup = [...seen.entries()].filter(([, n]) => n >= 2).map(([w]) => w);
    const standaloneShort = tokens.filter(t => /^[\uac00-\ud7a3]{2,3}$/.test(t));
    const longCompound = tokens.filter(t => /^[\uac00-\ud7a3]{4,}$/.test(t));
    const partialDup = [];
    for (const k of new Set(standaloneShort)) {
      if (longCompound.some(L => L.includes(k))) partialDup.push(k);
    }
    if (exactDup.length || partialDup.length) {
      add('ERR', `title \uc911\ubcf5\ub2e8\uc5b4 [${[...exactDup, ...partialDup].join(', ')}]`);
    }
    if (!isHome && !is404 && /\ub180\ucfe8/.test(title)) add('ERR', `title \ub0b4 "\ub180\ucfe8"`);
    titleMap.set(title, (titleMap.get(title) || []).concat(url));
  }

  // content 값에 single-quote가 들어가는 경우가 있어 같은 따옴표만 종결자로 사용
  const descM = html.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/)
              || html.match(/<meta\s+name=["']description["']\s+content='([^']*)'/);
  const desc = descM ? descM[1].trim() : '';
  if (!desc) add('ERR', 'meta description \ub204\ub77d');
  else if (desc.length > 165) add('WARN', `description ${desc.length}\uc790`);

  const canon = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/);
  if (!canon) add('ERR', 'canonical \ub204\ub77d');
  else if (/ilsanroom\.pages\.dev/.test(canon[1])) add('ERR', `canonical \ud558\ub4dc\ucf54\ub4dc ilsanroom`);

  if (!/og:image/.test(html)) add('ERR', 'og:image \ub204\ub77d');

  const isVenueDetail = /\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/[^/]+\/[^/]+\//.test(url)
    || /\/(nights|lounges|hoppa)\/[^/]+\//.test(url);
  if (isVenueDetail && !/application\/ld\+json/.test(html)) add('ERR', 'venue detail JSON-LD \ub204\ub77d');

  // venue detail: title 맨 앞 토큰이 H1 첫 단어와 일치해야 함 (가게이름 노출 우선순위)
  if (isVenueDetail && title) {
    const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1m ? stripHtml(h1m[1]).trim() : '';
    const titleHead = title.split(/[\s\u2014\-\u00b7|:]+/)[0];
    const h1Head = h1.split(/[\s\u2014\-\u00b7|:(\(]+/)[0];
    if (titleHead && h1Head && titleHead !== h1Head && !h1Head.includes(titleHead) && !titleHead.includes(h1Head)) {
      add('WARN', `title \uba3c\uc55e "${titleHead}" \u2260 H1 \uba3c\uc55e "${h1Head}" (\uac00\uac8c\uc774\ub984 \ub178\ucd9c \ud655\uc778)`);
    }
  }

  if (!/<h1[\s>]/i.test(html)) add('ERR', 'H1 \ub204\ub77d');

  const body = stripHtml(html);
  // "\ub9cc\uc6d0"\uc740 \uac00\uaca9 \ub178\ucd9c \ucee8\ud14d\uc2a4\ud2b8\uc5d0\uc11c\ub9cc \ucc28\ub2e8. \ud61c\ud0dd(\ucc28\ube44/\uc774\ubca4\ud2b8) \ucee8\ud14d\uc2a4\ud2b8\ub294 \ud5c8\uc6a9 (\uc2dc\uc98c82)
  const PRICE = ['\uc785\uc7a5\ub8cc', '\uac00\uc131\ube44', '\uc2dc\uc138', '\uac00\uaca9\ub300'];
  for (const w of PRICE) if (body.includes(w)) add('ERR', `\ubcf8\ubb38 \uac00\uaca9\ub2e8\uc5b4 "${w}"`);
  const MANWON_PRICE_RE = /(\ub8f8\ube44|\uae30\ubcf8\ub8cc|\ubcf4\uc99d\uae08|\uc138\ud305\ube44|\uc785\uc7a5(?!\s*\uac00\ub2a5)|\uba54\ub274|\uc694\uae08|\uac00\uaca9|\ucf54\uc2a4)\s*[\d\uc77c\uc774\uc0bc\uc0ac\uc624\uc721\uce60\ud314\uad6c\uc2ed\ubc31\ucc9c]*\ub9cc\uc6d0|[\d\uc77c\uc774\uc0bc\uc0ac\uc624\uc721\uce60\ud314\uad6c\uc2ed\ubc31\ucc9c]+\s*\ub9cc\uc6d0\s*(\ubd80\ud130|\uc774\uc0c1|\uc774\ud558|\uc120|\ub300|\uc9dc\ub9ac|\uc0c1\ub2f9)|\ub9cc\uc6d0\ub300(?![\uac00-\ud7a3])/;
  if (MANWON_PRICE_RE.test(body)) add('ERR', `\ubcf8\ubb38 \uac00\uaca9 \ucee8\ud14d\uc2a4\ud2b8 "\ub9cc\uc6d0" \ub178\ucd9c`);

  const BANNED_RE = [
    /2\ucc28\s*(\uc11c\ube44\uc2a4|\ubaa8\uc784|\ucf5c|\uac00\ub2a5|\uac00\uaca9|\ube44\uc6a9|\uc9c4\ud589|\uc5f0\uacc4|\uc57d\uc18d|\uc7a5\uc18c)/,
    /\ubb34\ub8cc\s*\uccb4\ud5d8/, /\ubd80\ubaa8\ub2d8\s*\uc0dd\uc2e0/, /\uc0c1\uacac\ub840/,
    /\uac00\uc871\s*\ubaa8\uc784/, /\ub3cc\uc794\uce58/, /\uacb0\ud63c\s*\uae30\ub150\uc77c/
  ];
  for (const re of BANNED_RE) if (re.test(body)) add('ERR', `\ubcf8\ubb38 \uae08\uc9c0\ub2e8\uc5b4 /${re.source}/`);

  // ★ 위험단어 게이트 — owner 예외 외 1건이라도 dist 본문/타이틀에 있으면 배포 차단
  const allow = DANGEROUS_EXCEPTIONS[url] || [];
  for (const w of DANGEROUS) {
    if (body.includes(w) && !allow.includes(w)) add('ERR', `본문 위험단어 "${w}" (불법 연관·SEO 페널티)`);
  }

  if (!isHome) {
    const cnt = (body.match(/\ub180\ucfe8/g) || []).length;
    if (cnt >= 12) add('WARN', `\ubcf8\ubb38 "\ub180\ucfe8" ${cnt}\ud68c`);
  }

  const iframes = html.match(/<iframe[^>]*src=["'][^"']+["'][^>]*>/g) || [];
  for (const i of iframes) {
    if (/(map\.kakao|map\.naver|maps\.google|kakao\.com\/map|naver\.com\/map)/.test(i)) {
      add('ERR', '\uc9c0\ub3c4 iframe'); break;
    }
  }

  if (/(thum\.io|microlink\.io|screenshotone)/.test(html)) add('ERR', '3rd-party \uc774\ubbf8\uc9c0');

  // 시즌55 — Google Rich Results "FAQPage/Organization/NightClub 중복" 회귀 차단
  // 별도 <script type="application/ld+json"> 블록에서 root @type이 2회 이상 등장하면 ERR.
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
    } catch {
      add('ERR', 'JSON-LD parse \uc2e4\ud328');
    }
  }
  for (const [t, c] of Object.entries(rootTypeCounts)) {
    if (c >= 2) add('ERR', `JSON-LD root @type "${t}" \uc911\ubcf5 ${c}\uac1c (Google Rich Results \uacbd\uace0)`);
  }
}

for (const [t, urls] of titleMap) {
  if (urls.length >= 5 && t) {
    issues.push({ url: '(\ub2e4\uc218)', sev: 'WARN', msg: `\uc911\ubcf5 title ${urls.length}\ud398\uc774\uc9c0: ${t.slice(0, 40)}` });
  }
}

const errCnt = issues.filter(i => i.sev === 'ERR').length;
const warnCnt = issues.filter(i => i.sev === 'WARN').length;
console.log(`\n\ud83d\udcca \uacb0\uacfc: ${files.length} HTML / \ud83d\uded1 ERR ${errCnt} / \u26a0\ufe0f  WARN ${warnCnt}`);

if (issues.length) {
  const byUrl = new Map();
  for (const i of issues) {
    if (!byUrl.has(i.url)) byUrl.set(i.url, []);
    byUrl.get(i.url).push(i);
  }
  let printed = 0;
  for (const [u, list] of byUrl) {
    if (printed >= 50) { console.log(`\u2026 (+${byUrl.size - 50}\uac1c \ud398\uc774\uc9c0 \ub354)`); break; }
    console.log(`\n${u}`);
    for (const i of list) console.log(`  ${i.sev === 'ERR' ? '\ud83d\uded1' : '\u26a0\ufe0f'} ${i.msg}`);
    printed++;
  }
}

if (errCnt > 0) { console.error(`\n\u274c ERR ${errCnt}\uac74 \u2192 \ubc30\ud3ec \ucc28\ub2e8`); process.exit(1); }
console.log(`\n\u2705 dist \uac10\uc0ac \ud1b5\uacfc (WARN ${warnCnt}\uac74)`);
process.exit(0);
