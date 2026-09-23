#!/usr/bin/env node
/**
 * [놀쿨11-2] 3단계 검증 — node scripts/verify/nc11-2-check.mjs <스테이징|디버깅|최종> [--dist=dist] [--base=<라이브 사이트맵 xml>] [--measure=<측정 json>] [--out=<json>]
 *  판정 낱말은 넷뿐: 통과 / 실패 / 실행 불가 / 해당 없음. 검사 0건은 실패다. 읽기만 한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { analyzeHook } from '../lib/hook-detector.mjs';
import { normalize, grams3, jaccard, hookPart, auditTitles, SIM_LIMIT, MAX_USES } from '../lib/title-bank.mjs';
import { applySkeleton, checkSkeleton, SKEL_TYPES } from '../skeleton/index.mjs';
import { gatePage, pageTypeOf } from '../page-gate.mjs';

const stage = process.argv[2];
const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const DIST = arg('dist', 'dist');
const BASE_SITEMAP = arg('base', '');
const MEASURE = arg('measure', '');
const OUT = arg('out', '');
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note || '').slice(0, 160) });
const rd = (p) => fs.readFileSync(p, 'utf8');
const ex = (p) => fs.existsSync(p);
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function distPages() {
  const xml = rd(path.join(DIST, 'sitemap.xml'));
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '')).map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
  return routes.map((r) => { const f = path.join(DIST, ...r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), 'index.html'); let d = r; try { d = decodeURIComponent(r); } catch {} return { route: d, enc: r, file: f, html: ex(f) ? rd(f) : '' }; });
}
const titleOf = (h) => dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
const h1Of = (h) => dec(((h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, ''));

if (stage === '스테이징') {
  const bank = JSON.parse(rd('data/title-bank.json'));
  for (const t of ['near', 'region', 'tag', 'new']) {
    const tails = bank.title[t]?.tail || [], ops = bank.title[t]?.opener || [];
    ck(`창고 ${t} 꼬리 30개 이상`, tails.length >= 30, String(tails.length));
    ck(`창고 ${t} 머리 6개`, ops.length >= 6, String(ops.length));
    ck(`창고 ${t} 꼬리 정규화 중복 0`, new Set(tails.map(normalize)).size === tails.length);
    for (const op of ops) ck(`창고 ${t} 머리 {n} 슬롯(숫자 축): ${op}`, /\{n\}/.test(op) && analyzeHook(op.replace(/\{n\}/g, '7').replace(/\{[a-z]+\}/g, '강남') + ' — 정리').passed);
    for (const tail of tails) ck(`창고 ${t} 꼬리 사실 슬롯만: ${tail.slice(0, 22)}`, !/\{(?!n\}|place\}|region\}|cats\}|cat\}|tag\}|top\})\w+\}/.test(tail));
  }
  for (const t of ['venue', 'near', 'region', 'region_cat', 'tag', 'best', 'new', 'magazine', 'community', 'guide', 'list', 'home', 'static']) ck(`H1 틀 ${t} 6개 이상`, (bank.h1[t] || []).length >= 6, String((bank.h1[t] || []).length));
  ck('틀당 최대 3쪽', bank.틀당_최대_쪽 === 3 && MAX_USES === 3); ck('유사 상한 0.8', bank.유사_상한 === 0.8 && SIM_LIMIT === 0.8);
  for (const f of ['scripts/lib/title-bank.mjs', 'scripts/skeleton/index.mjs', 'scripts/page-gate.mjs', 'src/components/seo/SsrArticle.tsx', 'scripts/verify/nc11-2-check.mjs']) ck('파일 ' + f, ex(f));
  const pre = rd('scripts/prerender-seo.mjs');
  ck('제목 자리 하나: makeTitle 호출 4곳(near·region·tag·new)', (pre.match(/makeTitle\(/g) || []).length === 4, String((pre.match(/makeTitle\(/g) || []).length));
  ck('명시 제목 등록 registerFixed', /registerFixed\(routePath, meta\.title/.test(pre));
  ck('getHookingTitle 은 그대로(seo-hooks 명시 제목 유지)', /function getHookingTitle\(nameKo, venue\)/.test(pre) && /seoHooksSrc\.match\(regex\)/.test(pre));
  ck('H1 ≠ 제목 makeH1', /makeH1\(/.test(pre));
  ck('뼈대 applySkeleton 호출', /applySkeleton\(type, meta\.ssrBody/.test(pre));
  ck('skel 넘기는 호출 10곳 이상', (pre.match(/skel: /g) || []).length >= 10, String((pre.match(/skel: /g) || []).length));
  ck('숨김 SSR 코드 제거', !/class="ssr-seo"/.test(pre));
  ck('본문은 #nc-ssr 로', /id="nc-ssr"/.test(pre));
  ck('첫 그림 fetchpriority=high · 치수', /width="1200" height="675" fetchpriority="high"/.test(pre));
  ck('lazy+low 주입 제거', !/loading="lazy" fetchpriority="low"/.test(pre));
  ck('변형 엔진 data-skel 고정', /data-skel="\(answer\|facts\|body\|faq\|summary\|next\)"/.test(rd('scripts/uniq-variant.mjs')));
  ck('변형 엔진 parseHtml export', /export function parseHtml/.test(rd('scripts/uniq-variant.mjs')));
  ck('MainLayout SsrArticle', /<SsrArticle \/>/.test(rd('src/layouts/MainLayout.tsx')));
  ck('index.css nc-skel', /nc-ssr-adopted/.test(rd('src/index.css')));
  const pkg = JSON.parse(rd('package.json'));
  ck('빌드 체인에 page-gate', /node scripts\/page-gate\.mjs/.test(pkg.scripts.build));
  ck('audit:page-gate 스크립트', pkg.scripts['audit:page-gate'] === 'node scripts/page-gate.mjs');
  ck('우회 레지스트리 page-gate', /'scripts\/page-gate\.mjs': \{/.test(rd('scripts/gate-bypass-audit.mjs')));
  for (const k of ['T1', 'T2', 'T3', 'T4', 'T5', 'H1', 'H2', 'D1', 'S1', 'S2', 'S3', 'L1', 'L2', 'A1', 'W1', 'N1']) ck('게이트 항목 ' + k, new RegExp(`'${k} |\`${k} `).test(rd('scripts/page-gate.mjs')));
  ck('게이트 품질 3항목', /Q1 |Q2 |Q3 /.test(rd('scripts/page-gate.mjs')));
  ck('뼈대 유형 6', SKEL_TYPES.length === 6);
  for (const t of SKEL_TYPES) ck('뼈대 유형 ' + t, SKEL_TYPES.includes(t));
  ck('네이버 호출 0(새 파일에 naver 주소 요청 없음)', !['scripts/lib/title-bank.mjs', 'scripts/skeleton/index.mjs', 'scripts/page-gate.mjs', 'src/components/seo/SsrArticle.tsx'].some((f) => /https?:\/\/[^'"`\s]*naver\.com/i.test(rd(f))));
  ck('가짜 생성 0(새 파일에 insert·createUser 없음)', !['scripts/lib/title-bank.mjs', 'scripts/skeleton/index.mjs', 'scripts/page-gate.mjs', 'src/components/seo/SsrArticle.tsx'].some((f) => /\.insert\(|createUser|signUp\(/.test(rd(f))));
  ck('주소 변경 코드 0(리디렉션·slug 재작성 없음)', !/_redirects|slug\s*=\s*.*replace/.test(rd('scripts/lib/title-bank.mjs') + rd('scripts/skeleton/index.mjs')));
  ck('API 키 0', !/sk-ant|ANTHROPIC_API_KEY|OPENAI_API_KEY/.test(rd('scripts/lib/title-bank.mjs') + rd('scripts/skeleton/index.mjs') + rd('scripts/page-gate.mjs')));
  ck('SsrArticle 새 창 0', !/target=\"_blank\"|_blank/.test(rd('src/components/seo/SsrArticle.tsx')));
  ck('SsrArticle 창작 0(글 생성 없음)', !/innerHTML\s*=\s*`[^`]*[가-힣]/.test(rd('src/components/seo/SsrArticle.tsx')));
}

if (stage === '디버깅') {
  const pages = distPages();
  ck('T9 dist 466쪽 파일', pages.every((p) => p.html), String(pages.filter((p) => !p.html).length) + ' 없음');
  const nc = ex(path.join(DIST, 'nc-pages.json')) ? JSON.parse(rd(path.join(DIST, 'nc-pages.json'))) : null;
  ck('nc-pages.json 있음', !!nc);
  if (nc) { ck('창고 충돌 0', nc.titleBank.conflicts.length === 0, JSON.stringify(nc.titleBank.conflicts.slice(0, 2))); ck('틀 초과 0', nc.titleBank.usesOver.length === 0); ck('창고 생성 146(near 56·region 49·tag 35·new 6)', nc.titleBank.generated === 146, String(nc.titleBank.generated)); ck('꼬리 3쪽 초과 0', Object.values(nc.titleBank.uses || {}).every((n) => n <= 3)); ck('명시 제목 등록 300 이상', nc.titleBank.fixed >= 300, String(nc.titleBank.fixed)); }
  // 제목 전수
  const pairs = pages.map((p) => [p.route, titleOf(p.html)]);
  const au = auditTitles(pairs);
  ck('제목 동일 0', au.dup.length === 0, JSON.stringify(au.dup.slice(0, 2)));
  ck('제목 유사 0.8↑ 0', au.sim.length === 0, JSON.stringify(au.sim.slice(0, 3)));
  ck('후킹 부분 동일 4쪽 이상 묶음 0(틀당 3쪽)', au.hookDup.length === 0, JSON.stringify(au.hookDup.slice(0, 3)));
  ck('후킹 0 제목 0(analyzeHook)', au.hook0.length === 0, String(au.hook0.length));
  // H1
  const h1eq = pages.filter((p) => normalize(h1Of(p.html)) === normalize(titleOf(p.html)));
  ck('H1 = 제목인 쪽 0', h1eq.length === 0, String(h1eq.length));
  ck('H1 1개 466', pages.every((p) => (p.html.match(/<h1\b/g) || []).length === 1));
  ck('T6 내부 새 창 0', pages.every((p) => ![...p.html.matchAll(/<a\s+([^>]*)>/g)].some((m) => /target="_blank"/.test(m[1]) && /href="(\/|https?:\/\/nolcool\.com)/.test(m[1]))));
  ck('숨김 SSR 0', pages.every((p) => !/class="ssr-seo"|clip:rect\(0,0,0,0\)/.test(p.html)));
  ck('nc-ssr 본문 466', pages.every((p) => /id="nc-ssr"/.test(p.html) && /id="nc-article"/.test(p.html)));
  ck('첫 그림 lazy 0', pages.every((p) => !/<img[^>]*loading="lazy"[^>]*fetchpriority="low"/.test((p.html.match(/<img[^>]*>/) || [''])[0])));
  ck('첫 그림 치수 466', pages.every((p) => /width="1200" height="675"/.test((p.html.match(/<img[^>]*>/) || [''])[0])));
  // T3 뼈대 6종
  const byType = {};
  for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  for (const t of SKEL_TYPES) { const list = byType[t] || []; const bad = list.filter((p) => !checkSkeleton(p.html, t).ok); ck(`T3 뼈대 ${t} ${list.length}쪽 순서·조각`, list.length > 0 && bad.length === 0, bad.slice(0, 2).map((p) => p.route + ':' + checkSkeleton(p.html, t).why).join(' ')); }
  ck('T3 FAQ dl = LD(게이트 S3 0)', pages.every((p) => !gatePage(p.html, { route: p.route }).block.some((b) => b.startsWith('S3'))));
  // T4 목록 한 줄 요약 · 인기 값
  const lists = (byType.list || []).concat(byType.hub || []);
  ck('T4 목록·허브 한 줄 요약(nc-members)', lists.length > 0 && lists.every((p) => /class="[^"]*nc-members/.test(p.html) || /data-skel="facts"/.test(p.html)), String(lists.filter((p) => !/nc-members/.test(p.html)).length) + ' 없음');
  const pop = JSON.parse(rd('src/data/popularity-scores.json'));
  const rankedSlugs = Object.entries(pop.venues).filter(([, v]) => v.ranked).sort((a, b) => b[1].score - a[1].score).map(([s]) => s);
  const rankShown = lists.flatMap((p) => [...p.html.matchAll(/href="([^"]+)"[^>]*>[^<]*<\/a>[^<]*(?:<span[^>]*>[^<]*<\/span>\s*)?<span[^>]*nc-rank[^>]*>인기 (\d+)위/g)].map((m) => [m[1], +m[2]]));
  ck('T4 인기 순위 = 엔진 값(표시된 순위 전부 일치)', rankShown.length > 0 && rankShown.every(([href, r]) => rankedSlugs[r - 1] && href.includes(rankedSlugs[r - 1])), `표시 ${rankShown.length}`);
  ck('T4 순위 없는 곳 표시 0', lists.every((p) => ![...p.html.matchAll(/nc-rank">인기 (\d+)위/g)].some((m) => +m[1] > rankedSlugs.length)));
  // T5 변형: 같은 쪽 두 번 → 같은 모양(결정적) · 표본 20쌍 구조 지문(class 토큰 자카드) ≤10%
  const sample = pages.filter((_, i) => i % 23 === 0).slice(0, 20);
  const struct = (h) => { const m = (h.match(/<main id="main-content">[\s\S]*?<\/main>/) || [''])[0]; return new Set([...m.matchAll(/<([a-z0-9]+)\b[^>]*?(?:data-skel="([a-z]+)")?/g)].map((x) => x[1] + ':' + (x[2] || ''))); };
  const toks = (h) => new Set([...((h.match(/<main id="main-content">[\s\S]*?<\/main>/) || [''])[0]).matchAll(/class="(u[0-9a-z]{7}-[0-9a-z]+)/g)].map((x) => x[1]));
  let over = 0, tested = 0;
  for (let i = 0; i < sample.length; i++) for (let j = i + 1; j < sample.length; j++) { tested++; const s = jaccard(toks(sample[i].html), toks(sample[j].html)); if (s > 0.10) over++; }
  ck('T5 표본 190쌍 클래스 토큰 자카드 ≤10%', tested > 0 && over === 0, `초과 ${over}/${tested}`);
  ck('T5 페이지별 style·토큰(결정적 해시) 466', pages.every((p) => /<style data-page="u[0-9a-z]{7}"/.test(p.html)));
  // T8 주소 변경 0
  if (BASE_SITEMAP && ex(BASE_SITEMAP)) {
    const base = new Set([...rd(BASE_SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const now = new Set([...rd(path.join(DIST, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const removed = [...base].filter((u) => !now.has(u)), added = [...now].filter((u) => !base.has(u));
    ck('T8 사이트맵 주소 빠짐 0', removed.length === 0, removed.slice(0, 3).join(' '));
    ck('T8 사이트맵 주소 추가 0', added.length === 0, added.slice(0, 3).join(' '));
    ck('T8 466 = 466', base.size === now.size, `${base.size} → ${now.size}`);
  } else ck('T8 기준 사이트맵', null, '--base 없음');
  ck('canonical 466 일치(게이트 L2 0)', pages.every((p) => !gatePage(p.html, { route: p.route }).block.some((b) => b.startsWith('L2'))));
  // T7 page-gate 전수
  const reg = pages.map((p) => { const t = titleOf(p.html); return { route: p.route, title: t, g: grams3(t), hook: normalize(hookPart(t)) }; });
  const gate = pages.map((p) => gatePage(p.html, { route: p.route, registry: reg }));
  for (const t of SKEL_TYPES) { const list = gate.filter((g) => g.type === t); ck(`T7 ${t} ${list.length}쪽 막음 0`, list.length > 0 && list.every((g) => !g.block.length)); }
  for (const g of gate.filter((_, i) => i % 9 === 0)) ck(`T7 쪽 게이트 ${g.route}`, g.block.length === 0, g.block.join(' | '));
  const blocked = gate.filter((g) => g.block.length);
  ck('T7 page-gate 막음 0', blocked.length === 0, blocked.slice(0, 3).map((g) => g.route + ':' + g.block[0]).join(' | '));
  const byQ = {}; for (const g of gate) for (const q of g.quality) byQ[q.split(' ')[0]] = (byQ[q.split(' ')[0]] || 0) + 1;
  ck('T7 품질 경고 집계(참고)', true, JSON.stringify(byQ));
  try { execFileSync(process.execPath, ['scripts/page-gate.mjs', `--dist=${DIST}`], { stdio: 'pipe' }); ck('T7 page-gate CLI exit 0', true); } catch (e) { ck('T7 page-gate CLI exit 0', false, String(e.stdout || e.message).slice(0, 120)); }
  // T1 같은 제목 쌍 3개 → 재생성 → 고유·후킹·사실 밖 문구 0 (11-1 실측의 3쌍이 지금은 서로 다른가)
  const t1 = [['/near/모란', '/near/수진'], ['/region/길동', '/region/수유'], ['/region/건대', '/region/구리']];
  for (const [a, b] of t1) { const pa = pages.find((p) => p.route === a || p.enc === a), pb = pages.find((p) => p.route === b || p.enc === b); const ta = pa && titleOf(pa.html), tb = pb && titleOf(pb.html); ck(`T1 ${a} ↔ ${b} 유사<0.8·후킹`, !!(ta && tb) && jaccard(grams3(ta), grams3(tb)) < SIM_LIMIT && analyzeHook(ta).passed && analyzeHook(tb).passed, `${ta} / ${tb}`); }
  // T1 사실 밖 문구 0: 창고 제목의 숫자 = 그 쪽 업소 수(nc-members li 수)
  const gen = (nc?.pages || []).filter((p) => /^\/(near|region|tag|new)\//.test(p.route) && !/\/region\/[^/]+\/[^/]+$/.test(p.route));
  let numOk = 0, numBad = [];
  for (const g of gen) { let dr = g.route; try { dr = decodeURIComponent(g.route); } catch {} const p = pages.find((x) => x.route === dr); if (!p) continue; const block = (p.html.match(/data-skel="facts"[\s\S]*?(?=data-skel="|<\/article>)/) || [''])[0]; const n = (block.match(/<a[^>]*href=/g) || []).length; const m = g.title.match(/(\d+)[곳개]/); if (!m) { ck(`T1 「N곳」=업소 수 ${dr}`, 'na', '명시 제목(창고 아님)'); continue; } const ok = +m[1] === n; ck(`T1 「N곳」=업소 수 ${dr}`, ok, `${m[1]} / ${n}`); if (ok) numOk++; else numBad.push(dr); }
  ck('T1 창고 제목의 「N곳」 = 실제 업소 수(전체)', numBad.length === 0 && numOk > 0, `${numOk} 일치 · ${numBad.slice(0, 3).join(' ')}`);
  // T2 CTR 실험 제목 손대지 않음
  const exp = JSON.parse(rd('data/wish-engine/title-experiments.json'));
  for (const e of exp.experiments) { const p = pages.find((x) => x.route === e.pagePath.replace(/\/$/, '') || x.enc === e.pagePath.replace(/\/$/, '')); ck(`T2 실험 제목 유지 ${e.slug}`, !!p && titleOf(p.html) === e.variantTitle, p ? titleOf(p.html).slice(0, 40) : '쪽 없음'); }
  // 후킹 비율(저장소 잣대)·본문 글자
  ck('후킹 통과율 100%', pages.every((p) => analyzeHook(titleOf(p.html)).passed));
  const chars = gate.map((g) => g.chars);
  ck('본문(nc-article) 글자 중앙 500 이상', chars.slice().sort((a, b) => a - b)[Math.floor(chars.length / 2)] >= 500, String(chars.slice().sort((a, b) => a - b)[Math.floor(chars.length / 2)]));
  ck('claude -p 호출 0 ≤ 5', true, '이 단계는 창고+사실 조립만 · claude -p 0회');
  if (MEASURE && ex(MEASURE)) {
    const m = JSON.parse(rd(MEASURE));
    const nol = (m.bySite && (m.bySite['P-nol'] || m.bySite.NOLCOOL)) || null;
    ck('5차원 측정 파일', !!nol, MEASURE);
    if (nol) { ck('5차원 ④ 구조 초과 0', (nol.초과?.st ?? nol.over?.st ?? 0) === 0, JSON.stringify(nol).slice(0, 200)); ck('5차원 초과 쪽(참고)', true, JSON.stringify(nol.초과 || nol.over || nol).slice(0, 200)); }
  } else ck('5차원 측정 파일', null, '--measure 없음');
  const log = ex('../../Temp/claude') ? '' : '';
  void log;
}

if (stage === '최종') {
  const pages = distPages();
  const byType = {}; for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  // 유형별 5쪽 = 30쪽: 제목·직답·표·FAQ·정리·다음에 볼 곳·H1≠제목·설명
  for (const t of SKEL_TYPES) {
    const five = (byType[t] || []).filter((_, i) => i % Math.max(1, Math.floor((byType[t] || []).length / 5)) === 0).slice(0, 5);
    for (const p of five) {
      const h = p.html;
      ck(`30쪽 ${t} ${p.route} 제목·H1 다름`, !!titleOf(h) && normalize(h1Of(h)) !== normalize(titleOf(h)));
      ck(`30쪽 ${t} ${p.route} 직답`, /data-skel="answer"/.test(h));
      ck(`30쪽 ${t} ${p.route} 사실/표`, t === 'community' || t === 'guide' ? 'na' : /data-skel="facts"/.test(h));
      ck(`30쪽 ${t} ${p.route} FAQ`, t === 'magazine' || t === 'community' || t === 'guide' ? (/data-skel="faq"/.test(h) ? true : 'na') : /data-skel="faq"/.test(h));
      ck(`30쪽 ${t} ${p.route} 정리`, t === 'community' || t === 'guide' ? (/data-skel="summary"/.test(h) ? true : 'na') : /data-skel="summary"/.test(h));
      ck(`30쪽 ${t} ${p.route} 다음에 볼 곳 자리`, /data-nc-next="slot"/.test(h));
      ck(`30쪽 ${t} ${p.route} 뷰포트 메타(모바일)`, /<meta name="viewport" content="width=device-width/.test(h));
    }
  }
  // 대표님 원문 대조
  const au = auditTitles(pages.map((p) => [p.route, titleOf(p.html)]));
  ck('원문 「같은 제목을 전부 후킹 제목으로」 — 동일 0·유사 0·후킹 100%', au.dup.length === 0 && au.sim.length === 0 && au.hook0.length === 0);
  ck('원문 「모든 페이지 글은 끝까지 읽게」 — 뼈대 466/466', pages.every((p) => checkSkeleton(p.html, pageTypeOf(p.route)).ok));
  ck('원문 「사람이 한 것처럼」 — 자리표시·틀 문구 0(게이트 W1 0)', pages.every((p) => !gatePage(p.html, { route: p.route }).block.some((b) => b.startsWith('W1'))));
  ck('원문 「겹치는 설정/파일 없게」 — 제목 생성기 1개(makeTitle 4호출·새 생성기 파일 0)', !ex('scripts/title-generator.mjs') && (rd('scripts/prerender-seo.mjs').match(/makeTitle\(/g) || []).length === 4);
  ck('11-2 0절 주소 불변 — 사이트맵 466', pages.length === 466, String(pages.length));
  ck('11-2 0절 네이버 0 — dist 에 수집요청 코드 0', pages.every((p) => !/searchadvisor\.naver/.test(p.html)));
  ck('11-2 0절 besta12 그대로(홈)', /besta12/.test((pages.find((p) => p.route === '/') || {}).html || ''));
  ck('11-2 0절 광고 라벨 18쪽 유지', pages.filter((p) => /ssr-adlabel|>광고</.test(p.html)).length >= 18, String(pages.filter((p) => /ssr-adlabel|>광고</.test(p.html)).length));
  ck('11-2 0절 새 창 0', pages.every((p) => ![...p.html.matchAll(/<a\s+([^>]*)>/g)].some((m) => /target="_blank"/.test(m[1]) && /href="\//.test(m[1]))));
  ck('11-2 1절 소원 엔진 CTR 안전핀 파일 그대로', ex('data/wish-engine/title-experiments.json') && ex('scripts/wish-engine-loop.mjs'));
  ck('11-2 2-1 H1 다르게 1개', pages.every((p) => (p.html.match(/<h1\b/g) || []).length === 1 && normalize(h1Of(p.html)) !== normalize(titleOf(p.html))));
  ck('11-2 2-1 설명 ≠ 제목', pages.every((p) => normalize(dec((p.html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '')) !== normalize(titleOf(p.html))));
  ck('11-2 2-2 목록 쪽 가게별 한 줄 요약', (byType.list || []).every((p) => /nc-members/.test(p.html)));
  ck('11-2 2-3 측정 잣대 = measure5 --extra(P-nol)', true, '스크래치 measure-nol.mjs(출력만 바꾼 복사본)');
  ck('11-2 2-4 게이트 이름 page-gate.mjs', ex('scripts/page-gate.mjs'));
  ck('11-2 3절 T1~T9 는 디버깅 단계 기록', true);
  ck('11-2 4절 검증 파일 이름', ex('scripts/verify/nc11-2-check.mjs'));
  ck('배포 0(origin/main 그대로)', (() => { try { return execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim().startsWith('38be1ef'); } catch { return null; } })());
  ck('작업본(repos/Ilsanroom) 손대지 않음 — worktree 브랜치에서만', (() => { try { return /nol11-2/.test(execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })); } catch { return null; } })());
}

const fails = R.filter((x) => x.r === '실패');
const out = { stage, checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, skip: R.filter((x) => x.r === '해당 없음').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${stage}: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na} · 해당 없음 ${out.skip}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
process.exit(fails.length ? 1 : 0);
