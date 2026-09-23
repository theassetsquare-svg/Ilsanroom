#!/usr/bin/env node
/**
 * [놀쿨11-2] 쪽 게이트 하나 — dist 466쪽 전수. 위성 page-gate.mjs 와 이름을 맞췄다(규칙은 놀쿨 명세 11-1 4절).
 *
 *   막음(하나라도 걸리면 exit 1 = 배포 금지):
 *     T1 제목 없음 · T2 제목 동일 · T3 제목 3-gram 유사 0.8↑ · T4 후킹 부분 동일 4쪽 이상(같은 틀 3쪽까지) · T5 후킹 0(analyzeHook)
 *     H1 H1 1개가 아님 · H2 H1 = 제목 · D1 설명 없음/제목과 같음
 *     S1 숨김 SSR(1px clip) · S2 완독 뼈대(조각·순서) · S3 FAQ 화면 dl ≠ FAQPage JSON-LD
 *     L1 내부 링크 새 창 · L2 canonical ≠ 주소 · A1 tel 링크 있는데 광고 라벨 없음
 *     W1 금칙어(가격 단어·자리표시) · N1 네이버 수집 코드 0(놀쿨은 구글+AI)
 *   품질(경고만 · exit 0): Q1 제목 40자 초과 · Q2 본문 글자 하한(가게 1,700 · 목록/허브 2,000) · Q3 H2 5개 미만
 *
 *   순수 함수 gatePage(html, ctx) 를 nc11-2-check 가 그대로 쓴다. 파일을 쓰지 않는다(보고 JSON 은 --out=).
 */
import fs from 'node:fs';
import path from 'node:path';
import { analyzeHook } from './lib/hook-detector.mjs';
import { normalize, grams3, jaccard, hookPart, SIM_LIMIT } from './lib/title-bank.mjs';
import { checkSkeleton } from './skeleton/index.mjs';

const DIST = process.argv.find((a) => a.startsWith('--dist='))?.slice(7) || 'dist';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6) || '';
const PRICE_WORDS = ['만원', '입장료', '가성비', '시세', '가격대'].map((w) => w); // 사이트 규칙: 가격 단어 전면 금지
// 「만원」은 저장소 nolcool-guard.mjs 와 같은 잣대 — 가격 노출 문맥(룸비·기본료·입장 N만원 …)만 막고 혜택 문맥(차비·쿠폰)은 둔다
const MANWON_PRICE_RE = /(룸비|기본료|보증금|세팅비|입장(?!\s*가능)|메뉴|요금|가격|코스)\s*[\d일이삼사오육칠팔구십백천]*만원|[\d일이삼사오육칠팔구십백천]+\s*만원\s*(부터|이상|이하|선|대|짜리|상당)|만원대(?![가-힣])/;
const PLACEHOLDER_RE = /\{\{|\bTODO\b|undefined|NaN|\[object Object\]|lorem ipsum/;
const NAVER_RE = /searchadvisor\.naver|naver\.com\/.*(request|submit)|Yeti.{0,20}Disallow/i;
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const strip = (h) => dec(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

export function pageTypeOf(route) {
  const p = route.replace(/\/$/, '') || '/';
  if (p === '/') return 'guide';
  if (/^\/(clubs|nights|rooms|yojeong|lounges|hoppa)\/[^/]+\/[^/]+$/.test(p) || /^\/(nights|hoppa|lounges)\/[^/]+$/.test(p)) return 'venue';
  if (/^\/(clubs|rooms|yojeong)\/[^/]+$/.test(p) || /^\/(clubs|nights|rooms|yojeong|lounges|hoppa)$/.test(p) || /^\/(best|new)\//.test(p)) return 'list';
  if (/^\/(region|near|tag)\//.test(p)) return 'hub';
  if (/^\/magazine\/./.test(p)) return 'magazine';
  if (/^\/community/.test(p) || /^\/lounge\//.test(p)) return 'community';
  return 'guide';
}

/** 한 쪽 검사(순수). ctx.registry = 다른 쪽 제목 목록 [{route,title,g,hook}] */
export function gatePage(html, ctx = {}) {
  const route = ctx.route || '/';
  const type = ctx.type || pageTypeOf(route);
  const block = [], quality = [];
  const title = dec((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '').trim();
  const desc = dec((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').trim();
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (!title) block.push('T1 제목 없음');
  if (!analyzeHook(title).passed) block.push('T5 후킹 0');
  if (h1s.length !== 1) block.push(`H1 H1 ${h1s.length}개`);
  if (h1s[0] && normalize(h1s[0]) === normalize(title)) block.push('H2 H1 이 제목과 같음');
  if (!desc) block.push('D1 설명 없음'); else if (normalize(desc) === normalize(title)) block.push('D1 설명 = 제목');
  if (/class="ssr-seo"|clip:rect\(0,0,0,0\)/.test(html)) block.push('S1 숨김 SSR');
  const sk = checkSkeleton(html, type);
  if (!sk.ok) block.push(`S2 뼈대: ${sk.why}`);
  // FAQ dl ↔ FAQPage LD
  const lds = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
  const faqLd = lds.find((x) => x && x['@type'] === 'FAQPage');
  if (faqLd) {
    const qs = (faqLd.mainEntity || []).map((q) => normalize(q.name));
    const dts = [...html.matchAll(/<(?:dt|h3|h4)\b[^>]*>([\s\S]*?)<\/(?:dt|h3|h4)>/g)].map((m) => normalize(strip(m[1])));
    const missing = qs.filter((q) => !dts.includes(q));
    if (missing.length) block.push(`S3 FAQ LD 질문 ${missing.length}개가 화면에 없음`);
  }
  const anchors = [...html.matchAll(/<a\s+([^>]*)>/g)].map((m) => m[1]);
  const blankInternal = anchors.filter((a) => /target="_blank"/.test(a) && /href="(\/|https?:\/\/nolcool\.com)/.test(a)).length;
  if (blankInternal) block.push(`L1 내부 새 창 ${blankInternal}`);
  const want = 'https://nolcool.com' + (route === '/' ? '/' : route.replace(/\/$/, '') + '/');
  if (!noindex && ctx.canonicalMap && ctx.canonicalMap[route]) { /* 병합 canonical 은 허용 */ }
  else if (!noindex && decodeURIComponent(canonical) !== decodeURIComponent(want)) block.push(`L2 canonical ${canonical} ≠ ${want}`);
  const hasTel = /href="tel:/.test(html);
  if (hasTel && !/ssr-adlabel|>광고</.test(html)) block.push('A1 tel 링크 있는데 광고 라벨 없음');
  const bodyText = strip((html.match(/<article id="nc-article"[\s\S]*?<\/article>/) || [html])[0]);
  for (const w of PRICE_WORDS) { const hit = w === '만원' ? (MANWON_PRICE_RE.test(bodyText) || MANWON_PRICE_RE.test(title)) : (bodyText.includes(w) || title.includes(w)); if (hit) { block.push(`W1 가격 단어 「${w}」`); break; } }
  if (PLACEHOLDER_RE.test(bodyText) || PLACEHOLDER_RE.test(title)) block.push('W1 자리표시 찌꺼기');
  if (NAVER_RE.test(html)) block.push('N1 네이버 수집 코드');
  // 레지스트리 대조
  if (ctx.registry) {
    const g = grams3(title); const hp = normalize(hookPart(title)); const hookSame = [];
    for (const r of ctx.registry) {
      if (r.route === route) continue;
      if (normalize(r.title) === normalize(title)) { block.push(`T2 제목 동일 ↔ ${r.route}`); break; }
      const s = jaccard(g, r.g); if (s >= SIM_LIMIT) { block.push(`T3 제목 유사 ${s.toFixed(2)} ↔ ${r.route}`); break; }
      if (hp.length >= 6 && r.hook === hp) { hookSame.push(r.route); if (hookSame.length >= 3) { block.push(`T4 후킹 부분 동일 4쪽 이상 ↔ ${hookSame.join(',')}`); break; } }
    }
  }
  // 품질
  if (title.length > 40) quality.push(`Q1 제목 ${title.length}자`);
  const chars = bodyText.replace(/\s/g, '').length;
  const min = type === 'venue' ? 1700 : (type === 'list' || type === 'hub') ? 2000 : 0;
  if (min && chars < min) quality.push(`Q2 본문 ${chars}자 < ${min}`);
  const h2n = (html.match(/<h2\b/g) || []).length;
  if (h2n < 5) quality.push(`Q3 H2 ${h2n}개`);
  return { route, type, title, h1: h1s[0] || '', block, quality, chars, noindex };
}

/* ── CLI ── */
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (isMain) {
  const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '')).map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
  const pages = [];
  for (const r of routes) {
    const f = path.join(DIST, ...r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), 'index.html');
    if (!fs.existsSync(f)) { pages.push({ route: r, missing: true }); continue; }
    pages.push({ route: r, html: fs.readFileSync(f, 'utf8') });
  }
  const registry = pages.filter((p) => p.html).map((p) => { const t = dec((p.html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''); return { route: p.route, title: t, g: grams3(t), hook: normalize(hookPart(t)) }; });
  const results = pages.map((p) => (p.missing ? { route: p.route, block: ['F0 파일 없음'], quality: [] } : gatePage(p.html, { route: p.route, registry })));
  const blocked = results.filter((r) => r.block.length);
  const q = results.filter((r) => r.quality.length);
  const summary = { pages: results.length, blocked: blocked.length, quality: q.length, byBlock: {}, byQuality: {} };
  for (const r of blocked) for (const b of r.block) { const k = b.split(' ')[0]; summary.byBlock[k] = (summary.byBlock[k] || 0) + 1; }
  for (const r of q) for (const b of r.quality) { const k = b.split(' ')[0]; summary.byQuality[k] = (summary.byQuality[k] || 0) + 1; }
  console.log(`🚧 page-gate: ${summary.pages}쪽 · 막음 ${summary.blocked}쪽 ${JSON.stringify(summary.byBlock)} · 품질 경고 ${summary.quality}쪽 ${JSON.stringify(summary.byQuality)}`);
  for (const r of blocked.slice(0, 25)) console.log('   ✖', r.route, '—', r.block.join(' | '));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary, results }, null, 1));
  if (blocked.length) { console.error('✖ page-gate 실패 — 미통과 = 배포 금지'); process.exit(1); }
  console.log('✅ page-gate 통과 (품질 경고는 위 숫자대로 회차마다 줄인다)');
}
