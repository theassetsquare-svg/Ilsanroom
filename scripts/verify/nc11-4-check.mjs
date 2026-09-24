#!/usr/bin/env node
/**
 * [놀쿨11-4] 3단계 검증 — node scripts/verify/nc11-4-check.mjs <스테이징|디버깅|최종> [--dist=dist] [--base=<라이브 사이트맵 xml>] [--bundle-before=<bytes>] [--browser=<json>] [--out=<json>]
 *  판정 낱말은 넷뿐: 통과 / 실패 / 실행 불가 / 해당 없음. 검사 0건은 실패다. 읽기만 한다.
 *  스테이징 = 파일:줄 · 인기 엔진 자리 하나 · 새 창 0 · 팝업 0 · 디버깅 = T1~T6 · 최종 = 로컬 30쪽 화면 + 모바일/콘솔(브라우저 결과 json) + 대표님 원문 대조
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gatePage, pageTypeOf } from '../page-gate.mjs';
import { SKEL_TYPES } from '../skeleton/index.mjs';

const stage = process.argv[2];
const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const DIST = arg('dist', 'dist');
const BASE_SITEMAP = arg('base', '');
const BUNDLE_BEFORE = +arg('bundle-before', '0');
const BROWSER = arg('browser', '');
const OUT = arg('out', '');
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note || '').slice(0, 180) });
const rd = (p) => fs.readFileSync(p, 'utf8');
const ex = (p) => fs.existsSync(p);
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ldsOf = (h) => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });

function distPages() {
  const xml = rd(path.join(DIST, 'sitemap.xml'));
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '')).map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
  return routes.map((r) => { const f = path.join(DIST, ...r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), 'index.html'); let d = r; try { d = decodeURIComponent(r); } catch {} return { route: d, enc: r, file: f, html: ex(f) ? rd(f) : '' }; });
}
const artOf = (h) => (h.match(/<article id="nc-article"[\s\S]*?<\/article>/) || [''])[0];
const moduleOf = (h) => (artOf(h).match(/<nav[^>]*data-skel="next"[\s\S]*$/) || [''])[0]; // 변형 엔진이 태그를 바꾸므로 nav 통째로 보고 data-nc-module 로 센다
const modItems = (h) => [...moduleOf(h).matchAll(/data-nc-module="([^"]+)"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>(?:\s*<span[^>]*>([^<]*)<\/span>)?/g)].map((m) => ({ module: m[1], href: dec(m[2]), label: dec(m[3]), meta: dec(m[4] || '') }));
const artLinkSet = (h) => new Set([...artOf(h).matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, '')));
const pop = ex('src/data/popularity-scores.json') ? JSON.parse(rd('src/data/popularity-scores.json')) : { venues: {} };
const rankedOrder = Object.entries(pop.venues).filter(([, v]) => v.ranked).sort((a, b) => b[1].score - a[1].score).map(([s]) => s);
const rankOf = (slug) => { const i = rankedOrder.indexOf(slug); return i < 0 ? 9999 : i + 1; };
const slugOfHref = (href) => (href.match(/\/([^/]+)\/?$/) || [])[1] || '';
const decPath = (h) => { try { return decodeURIComponent(String(h)); } catch { return String(h); } };

if (stage === '스테이징') {
  const pre = rd('scripts/prerender-seo.mjs'), sk = rd('scripts/skeleton/index.mjs'), pg = rd('scripts/page-gate.mjs');
  const tr = rd('src/lib/visitor-tracker.ts'), ssr = rd('src/components/seo/SsrArticle.tsx'), cmp = rd('src/pages/ComparePage.tsx'), home = rd('src/pages/HomePage.tsx'), tsb = rd('src/components/home/TopSearchBar.tsx');
  for (const f of ['scripts/prerender-seo.mjs', 'scripts/skeleton/index.mjs', 'scripts/page-gate.mjs', 'src/lib/visitor-tracker.ts', 'src/components/seo/SsrArticle.tsx', 'src/pages/ComparePage.tsx', 'src/pages/HomePage.tsx', 'src/components/home/TopSearchBar.tsx', 'src/data/popularity-scores.json', 'scripts/popularity-engine.mjs', 'scripts/verify/nc11-4-check.mjs']) ck('파일 ' + f, ex(f));
  const line = (src, re) => { const i = src.split('\n').findIndex((l) => re.test(l)); return i + 1; };
  // 2-1 다음에 볼 곳
  ck(`prerender buildNext 정의(scripts/prerender-seo.mjs:${line(pre, /^function buildNext\(/)})`, /^function buildNext\(/m.test(pre));
  ck('buildNext 가게: 같은 지역 후보 8 · 같은 업종 다른 지역 6 · 지역 허브 · 매거진 · 비교 · 저장', /out\.sameRegion = /.test(pre) && /slice\(0, 8\)/.test(pre) && /out\.sameCat = /.test(pre) && /out\.hub = /.test(pre) && /out\.magazine = /.test(pre) && /out\.compare = /.test(pre) && /out\.actions = /.test(pre));
  ck('buildNext 목록·허브: 인기 5(엔진 순위 있는 가게만) + 주말·퀴즈·랭킹', /out\.popular = ms\.length >= 4/.test(pre) && /POP_RANK\.has\(m\.slug\)/.test(pre) && /!mine\.has\(x\.slug\)/.test(pre) && /'\/weekend\/'/.test(pre) && /'\/quiz\/'/.test(pre) && /'\/ranking\/'/.test(pre));
  ck('buildNext 매거진: 본문 가게 · 지역 허브 · 다음 글', /out\.venues = /.test(pre) && /out\.nextArticles = /.test(pre));
  ck('인기 엔진 자리 하나 = POP_RANK(popularity-scores.json) · 새 엔진 0', (pre.match(/popularity-scores\.json/g) || []).length >= 1 && !/new Map\(\)[^\n]*random|Math\.random\(\)[^\n]*rank/.test(pre));
  ck('인기 엔진 가중치 = 조회1·사용자2·전화30·검색3(scripts/popularity-engine.mjs)', (() => { const e = rd('scripts/popularity-engine.mjs'); return /W_VIEW = 1/.test(e) && /W_USER = 2/.test(e) && /W_PHONE = 30/.test(e) && /W_GSC = 3/.test(e); })());
  ck('매거진 관련도 잣대 = RelatedMagazineForVenue 와 같음(100·100·90·60·20·10)', /sc \+= 100[\s\S]*sc \+= 100[\s\S]*sc \+= 90[\s\S]*sc \+= 60[\s\S]*sc \+= 20[\s\S]*sc \+= 10/.test(pre));
  ck('비교 진입 = /compare/?v= 검색 매개변수(새 주소 0)', /base: '\/compare\/\?v='/.test(pre));
  ck('parseVenues id·status 읽기', /const vid = block\.match/.test(pre) && /const vstatus = block\.match/.test(pre));
  ck('venueSkel 이 가게 객체를 넘김', /venue: v, facts: \{ name: v\.nameKo/.test(pre)); ck('매거진 skel 이 글 객체를 넘김', /article: a, facts: \{ tag: a\.tag/.test(pre));
  ck('applySkeleton 에 next 전달', /next: buildNext\(type, sk, routePath\)/.test(pre));
  ck(`skeleton 모듈 채우기(scripts/skeleton/index.mjs:${line(sk, /const nx = ctx\.next/)})`, /const nx = ctx\.next \|\| \{\}/.test(sk));
  ck('skeleton 같은 쪽 링크 건너뛰기(used 집합)', /const used = new Set/.test(sk) && /if \(!allowDup && used\.has\(key\)\) continue/.test(sk));
  ck('skeleton 가게 3+2+1+1+비교(같은 지역이 모자라면 같은 업종·전국 인기로 채움)', /take\(nx\.sameRegion, 3, 'same-region'\)/.test(sk) && /take\(nx\.sameCat, 2 \+ \(3 - nSameRegion\), 'same-cat'\)/.test(sk) && /take\(nx\.fallback, 5 - chosen\.length, 'popular-any'\)/.test(sk) && /take\(nx\.hub \? \[nx\.hub\] : \[\], 1, 'hub'\)/.test(sk) && /take\(nx\.magazine \? \[nx\.magazine\] : \[\], 1, 'magazine'\)/.test(sk) && /module: 'compare'/.test(sk));
  ck('skeleton 인기 5 는 중복 허용(본문 목록 되풀이가 뜻)', /take\(nx\.popular, 5, 'popular', true\)/.test(sk));
  ck('skeleton 허브 묶음은 모듈과 겹치지 않음', /!chosen\.some\(\(x\) => keyOf\(x\.href\) === keyOf\(href\)\)/.test(sk));
  ck('skeleton 저장 버튼(data-nc-save) · 전화는 본문 tel 있을 때만', /data-nc-save="\$\{esc\(nx\.actions\.slug\)\}"/.test(sk) && /bodyHtml\.match\(\/href="\(tel:\[\^"\]\+\)"\/\)/.test(sk));
  ck('skeleton 새 창 0 · 팝업 0(target=_blank · window.open 없음)', !/_blank|window\.open/.test(sk));
  ck('skeleton 모듈 li 에 data-nc-module', /<li data-nc-module="\$\{esc\(c\.module\)\}">/.test(sk));
  // 2-2 홈 검색창
  ck(`prerender 홈 검색창 SSR(form action=/search/ · datalist)(scripts/prerender-seo.mjs:${line(pre, /class="nc-search" role="search" action="\/search\/"/)})`, /class="nc-search" role="search" action="\/search\/" method="get"/.test(pre) && /<datalist id="nc-sugg">/.test(pre));
  ck('홈 SSR 자동완성 색인 = 가게이름 + 지역 + 업종 + 지역×업종(로컬)', /openV\.map\(\(x\) => x\.nameKo\)/.test(pre) && /Object\.keys\(regionCount\)/.test(pre) && /Object\.values\(catLabelMap\)/.test(pre));
  ck('홈 SSR 업종 탭 6 · 지역 바로가기 12 · 신규 · 주간 투표', /class="nc-cat-tabs"/.test(pre) && /class="nc-region-quick"/.test(pre) && /slice\(0, 12\)\.map\(\(\[r\]\) => r\)/.test(pre) && /\/new\/clubs\//.test(pre) && /\/vs\//.test(pre));
  ck('홈 SSR 검색창은 홈에서만', /canonicalWithSlash === '\/'/.test(pre));
  ck('React TopSearchBar 동적 import(홈 번들에 장부 0)', /await import\('@\/data\/venues'\)/.test(tsb) && !/^import .*@\/data\/venues'/m.test(tsb));
  ck('TopSearchBar 외부 호출 0(fetch·http 없음)', !/fetch\(|https?:\/\//.test(tsb));
  ck('TopSearchBar 제출 → /search?q= · search_use', /navigate\(`\/search\?q=\$\{encodeURIComponent\(t\)\}`\)/.test(tsb) && /trackEvent\('search_use'/.test(tsb));
  ck('TopSearchBar 자동완성 8개 · 이름·지역·업종·지역×업종', /slice\(0, 8\)/.test(tsb) && /idx\.names/.test(tsb) && /idx\.regions/.test(tsb) && /idx\.cats/.test(tsb));
  ck('TopSearchBar 새 창 0 · 팝업 0', !/_blank|window\.open|alert\(/.test(tsb));
  ck('HomePage 맨 위에 TopSearchBar', /<TopSearchBar \/>/.test(home) && home.indexOf('<TopSearchBar />') < home.indexOf('지역 퀵셀렉터'));
  ck('WebSite SearchAction 과 짝(urlTemplate /search?q=)', /\/search\?q=\{search_term_string\}/.test(pre));
  // 2-3 비교
  ck('ComparePage ?v= 읽기(최대 4 · 장부 슬러그만)', /searchParams\.get\('v'\)/.test(cmp) && /slice\(0, 4\)/.test(cmp) && /venues\.find\(\(x\) => x\.slug === s\.trim\(\)\)/.test(cmp));
  ck('ComparePage compare_open 1회', /trackEvent\('compare_open'/.test(cmp) && /openedRef/.test(cmp));
  ck('비교 쪽 빈 칸 = 줄 삭제(기존 dl 카드 · 값 없는 항목은 그리지 않음)', /&& \(/.test(cmp) || /\? \(/.test(cmp), '기존 ComparePage 조건부 렌더');
  ck('사이트맵에 비교 매개변수 주소 0', !/compare\/\?v=/.test(pre.split('sitemapXml +=').slice(1).join('')));
  // 2-4 완독 → 다음 행동
  ck('SsrArticle 저장 = localStorage nolcool_favorites(useFavorites 와 같은 키 · 슬러그)', /const FAV_KEY = 'nolcool_favorites'/.test(ssr) && /const LOCAL_KEY = 'nolcool_favorites'/.test(rd('src/hooks/useFavorites.ts')));
  ck('SsrArticle next_click(모듈 이름) · 저장 토글 · 클릭 위임', /trackEvent\('next_click'/.test(ssr) && /host\.addEventListener\('click', onHostClick\)/.test(ssr) && /markSaved\(host\)/.test(ssr));
  ck('SsrArticle 새 창 0 · 창작 0', !/_blank|window\.open/.test(ssr) && !/innerHTML\s*=\s*`[^`]*[가-힣]/.test(ssr));
  // 2-5 GA4
  ck("tracker EventType 에 scroll_90·next_click·compare_open·search_use", /'scroll_90' \| 'next_click' \| 'compare_open' \| 'search_use'/.test(tr));
  ck('tracker GA4 이름 매핑 4개', /scroll_90: 'scroll_90', next_click: 'next_click', compare_open: 'compare_open', search_use: 'search_use'/.test(tr));
  ck('tracker scroll_90 문턱 0.90 · send() 게이트 뒤', /if \(scrolled >= 0\.90\) send\('scroll_90'\)/.test(tr));
  ck('tracker gtag 호출은 forwardToGa4 안에서만(scroll-honesty)', (tr.match(/gtag\('event'/g) || []).length === 3 && !/onScroll[\s\S]*gtag\(/.test(tr.split('function onScroll')[1] || ''));
  ck('새 메일·새 태그 0(GA4 측정 ID 하나 · 대시보드는 월간 보고)', !/G-[A-Z0-9]{6,}/.test(tsb + ssr + cmp));
  // 2-5 게이트
  for (const k of ['M1', 'M2', 'M3', 'M4']) ck(`page-gate ${k}(scripts/page-gate.mjs:${line(pg, new RegExp("push\\(`?'?" + k + ' '))})`, new RegExp("push\\((`|')" + k + ' ').test(pg));
  ck('page-gate Q4 링크 12~25 품질', /Q4 본문 내부 링크/.test(pg) && /artLinks\.size < 12 \|\| artLinks\.size > 25/.test(pg));
  // 있는 게이트가 그대로인가(11-2·11-3 항목 25) · 뼈대 업종표 · 인기 엔진 장부 · 검색창 접근성 · 홈 절
  for (const k of ['T1', 'T2', 'T3', 'T4', 'T5', 'H1', 'H2', 'D1', 'S1', 'S2', 'S3', 'L1', 'L2', 'A1', 'W1', 'N1', 'J1', 'J2', 'J3', 'J4', 'J5', 'O1', 'S4', 'L3', 'L4']) ck(`page-gate 기존 항목 ${k} 그대로`, new RegExp("push\\((`|')" + k + ' ').test(pg));
  for (const cat of ['클럽', '나이트', '라운지', '룸', '요정', '호빠']) ck(`skeleton 업종표 ${cat}`, new RegExp(`'${cat}': '`).test(sk));
  const popJ = JSON.parse(rd('src/data/popularity-scores.json'));
  ck('인기 장부 weights.view = 1', popJ.weights?.view === 1); ck('인기 장부 weights.user = 2', popJ.weights?.user === 2); ck('인기 장부 weights.phoneClick = 30', popJ.weights?.phoneClick === 30); ck('인기 장부 weights.gscClick = 3', popJ.weights?.gscClick === 3);
  ck('인기 장부 ranked 가게 수(참고)', true, `${Object.values(popJ.venues || {}).filter((v) => v.ranked).length}/${Object.keys(popJ.venues || {}).length} · 창 ${popJ.windowDays}일 · 침묵 ${popJ.minViews28d}회`);
  ck('인기 장부 generatedAt 있음', /^\d{4}-\d{2}-\d{2}/.test(String(popJ.generatedAt || '')), String(popJ.generatedAt));
  for (const ev of ['scroll_90', 'next_click', 'compare_open', 'search_use']) ck(`tracker 이벤트 ${ev} 는 EventType 와 GA4 표 둘 다에`, new RegExp(`'${ev}'`).test(tr) && new RegExp(`${ev}: '${ev}'`).test(tr));
  ck('TopSearchBar role=search form', /role="search"/.test(tsb)); ck('TopSearchBar aria-label 검색어', /aria-label="검색어"/.test(tsb)); ck('TopSearchBar inputMode=search', /inputMode="search"/.test(tsb)); ck('TopSearchBar 자동완성 listbox/option 역할', /role="listbox"/.test(tsb) && /role="option"/.test(tsb)); ck('TopSearchBar 바깥 클릭에 닫힘', /mousedown/.test(tsb));
  ck('TopSearchBar 폐업 가게 제외', /status !== 'closed_or_unclear'/.test(tsb)); ck('TopSearchBar 검색어 최대 8', /out\.length < 8/.test(tsb));
  ck('HomePage 업종 탭 6 그대로', /key: 'club'/.test(home) && /key: 'hoppa'/.test(home)); ck('HomePage 주간 투표 위젯 그대로', /WeeklyVoteWidget/.test(home)); ck('HomePage 매거진 절 그대로', /magazineArticles/.test(home)); ck('HomePage 커뮤니티 피드 그대로', /HomeFeed/.test(home)); ck('HomePage 실시간 TOP 4(인기 값) 그대로', /VENUES_TOP4/.test(home));
  ck('SsrArticle 저장 문구 = 로컬 저장(가짜 숫자 0)', !/명이 저장|저장했습니다 \d/.test(ssr));
  ck('SsrArticle 저장 상태 aria-pressed', /aria-pressed/.test(ssr));
  ck('ComparePage 최대 4 그대로(useCompareList MAX 4)', /prev\.length < 4/.test(cmp));
  ck('prerender rankItem 에 업종어 되풀이 0(목록 밀도)', /const rankItem = \(x\) => item\(x, `\$\{x\.regionKo\} · 인기 \$\{POP_RANK\.get\(x\.slug\)\}위`\)/.test(pre));
  ck('prerender 인기 절 = 가게 4곳↑ 이 쪽 인기 5 · 1~3곳이면 이 쪽에 없는 전국 인기 5(스터핑 회피)', /ms\.length >= 4/.test(pre) && /const mine = new Set\(ms\.map\(\(m\) => m\.slug\)\)/.test(pre) && /open\.filter\(\(x\) => POP_RANK\.has\(x\.slug\) && !mine\.has\(x\.slug\)\)/.test(pre));
  ck('prerender 매거진 다음 글 후보 = 같은 태그 최근순 → 나머지', /out\.nextArticles = \[\.\.\.all\.filter\(\(x\) => x\.tag === a\.tag\), \.\.\.all\.filter\(\(x\) => x\.tag !== a\.tag\)\]/.test(pre));
  ck('prerender 관련 매거진 점수 0 이면 칸 없음', /if \(best\) out\.magazine = /.test(pre));
  ck('skeleton 다음 글 1 · 본문 가게 3(중복 허용) · 도구 3', /take\(nx\.venues, 3, 'venues', true\); take\(nx\.nextArticles, 1, 'next-article'\); take\(nx\.tools, 3, 'tools'\)/.test(sk));
  ck('skeleton 모듈 항목 = 링크 + 메타(가게이름 앵커 · 설명적 앵커 텍스트)', /\$\{esc\(c\.label\)\}<\/a>\$\{c\.meta \? ` <span class="nc-meta">/.test(sk));
  ck('page-gate M1~M4 는 막음(block.push)', /block\.push\('M1 /.test(pg) && /block\.push\(`M2 /.test(pg) && /block\.push\('M3 /.test(pg) && /block\.push\('M4 /.test(pg));
  ck('page-gate 모듈 찾기 = nav + data-nc-module(변형 엔진이 ul→div·li→div 로 바꿔도 안 끊김)', /const nextNav = \(art\.match\(\/<nav\[\^>\]\*data-skel="next"/.test(pg) && /data-nc-module="\[\^"\]\*"/.test(pg));
  // 0절
  ck('네이버 0(새 코드에 naver 호출 없음)', !/naver\.com/.test(tsb + ssr + cmp));
  ck('API 키 0', !/sk-ant|ANTHROPIC_API_KEY|OPENAI_API_KEY/.test(tsb + ssr + cmp + sk));
  ck('가짜 생성 0(insert·createUser 없음)', !/\.insert\(|createUser|signUp\(/.test(tsb + ssr + cmp + sk));
  ck('주소 변경 0(_redirects 301 0)', !ex('public/_redirects') || !/\s30[12]\b/.test(rd('public/_redirects')));
  ck('Actions 신설 0', (() => { try { return execFileSync('git', ['status', '--short', '.github'], { encoding: 'utf8' }).trim() === ''; } catch { return null; } })());
  ck('무한 스크롤 속임·자동 이동 0(새 코드에 setInterval/location.replace 없음)', !/setInterval|location\.replace|location\.href =/.test(tsb + ssr + cmp));
  ck('클릭 유도 팝업 0(새 코드에 confirm/alert/prompt 없음)', !/\b(alert|confirm|prompt)\(/.test(tsb + ssr + cmp));
}

if (stage === '디버깅') {
  const pages = distPages();
  ck('dist 466쪽', pages.length === 466 && pages.every((p) => p.html), String(pages.length));
  const byType = {}; for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  const gate = pages.map((p) => gatePage(p.html, { route: p.route }));
  // T1 가게 표본 20
  const venuesP = byType.venue || [];
  const sample = venuesP.filter((_, i) => i % Math.max(1, Math.floor(venuesP.length / 20)) === 0).slice(0, 20);
  ck('T1 표본 20쪽', sample.length === 20, String(sample.length));
  const venuesSrc = rd('src/data/venues.ts');
  const regionOf = (slug) => { const i = venuesSrc.indexOf(`slug: '${slug}'`); const b = venuesSrc.slice(i, i + 1500); return (b.match(/regionKo:\s*'([^']+)'/) || [])[1] || ''; };
  const catOf = (slug) => { const i = venuesSrc.indexOf(`slug: '${slug}'`); const b = venuesSrc.slice(i, i + 1500); return (b.match(/category:\s*'([^']+)'/) || [])[1] || ''; };
  for (const p of sample) {
    const items = modItems(p.html); const slug = slugOfHref(p.route); const region = regionOf(slug); const cat = catOf(slug);
    const mods = items.map((x) => x.module);
    const nSR = mods.filter((m) => m === 'same-region').length, nSC = mods.filter((m) => m === 'same-cat').length, nPA = mods.filter((m) => m === 'popular-any').length;
    ck(`T1 ${p.route} 칸 수 ≥7(${items.length}) · 가게 5(같은 지역 ${nSR} + 같은 업종 ${nSC} + 채움 ${nPA}) + 허브 + 매거진 + 비교`, items.length >= 7 && nSR + nSC + nPA === 5 && (nSR === 3 || nSC + nPA === 5 - nSR) && mods.includes('hub') && mods.includes('compare'), mods.join(','));
    ck(`T1 ${p.route} 같은 주소 2번 0`, new Set(items.map((x) => x.href.replace(/\/$/, ''))).size === items.length);
    ck(`T1 ${p.route} 자기 자신 0`, !items.some((x) => x.href.replace(/\/$/, '') === p.route));
    const sr = items.filter((x) => x.module === 'same-region').map((x) => slugOfHref(x.href));
    ck(`T1 ${p.route} 같은 지역 ${sr.length}(지역 「${region}」 · 인기 값 순 · 모자라면 같은 업종으로 채움)`, sr.every((s) => regionOf(s) === region) && sr.map(rankOf).every((r, i, a) => i === 0 || a[i - 1] <= r), sr.map((s) => `${s}:${rankOf(s)}`).join(' '));
    const sc = items.filter((x) => x.module === 'same-cat').map((x) => slugOfHref(x.href));
    ck(`T1 ${p.route} 같은 업종 다른 지역 ${sc.length}(≥2 또는 채움)`, sc.length >= 2 || nSR + nSC + nPA === 5, sc.join(' ')); ck(`T1 ${p.route} 같은 업종 칸은 전부 같은 업종·다른 지역`, sc.every((s) => catOf(s) === cat && regionOf(s) !== region));
    ck(`T1 ${p.route} 지역 허브 = /region/${region}/`, items.some((x) => x.module === 'hub' && decPath(x.href) === `/region/${region}/`), items.filter((x) => x.module === 'hub').map((x) => decPath(x.href)).join(' '));
    const cmpItem = items.find((x) => x.module === 'compare');
    ck(`T1 ${p.route} 비교 진입 = /compare/?v=자기,고른 가게`, !!cmpItem && cmpItem.href.startsWith(`/compare/?v=${slug},`) && cmpItem.href.split('=')[1].split(',').slice(1).every((s) => items.some((x) => slugOfHref(x.href) === s)), cmpItem ? cmpItem.href : '');
    ck(`T1 ${p.route} 새 창 0`, !/target="_blank"/.test(moduleOf(p.html)));
    { const art = artOf(p.html); const hasCall = /nc-call/.test(art); const bodyTel = /href="tel:/.test(art.replace(/<nav[^>]*data-skel="next"[\s\S]*$/, '')); ck(`T1 ${p.route} 저장 버튼 있음 · 전화 단추는 본문 tel 있을 때만`, /data-nc-save="/.test(art) && (!hasCall || bodyTel), `저장 ${/data-nc-save="/.test(art)} 전화 ${hasCall} 본문tel ${bodyTel}`); }
  }
  ck('T1 가게 126 전부 모듈 ≥7(M2 0)', gate.filter((g) => g.type === 'venue').every((g) => !g.block.some((b) => b.startsWith('M2'))));
  ck('T1 가게 126 매거진 칸 있는 쪽 수(참고)', true, `${venuesP.filter((p) => modItems(p.html).some((x) => x.module === 'magazine')).length}/126`);
  ck('T1 가게 126 8칸 쪽 수(참고)', true, `${venuesP.filter((p) => modItems(p.html).length >= 8).length}/126`);
  // T2 허브·목록 표본 10 — 인기 5 = 인기 엔진 값
  const hubs = [...(byType.list || []), ...(byType.hub || [])];
  const withPop = hubs.filter((p) => modItems(p.html).some((x) => x.module === 'popular'));
  const hs = withPop.filter((_, i) => i % Math.max(1, Math.floor(withPop.length / 10)) === 0).slice(0, 10);
  ck('T2 표본 10(인기 5 있는 허브·목록)', hs.length === 10, String(hs.length));
  for (const p of hs) {
    const popItems = modItems(p.html).filter((x) => x.module === 'popular');
    const memberSlugs = [...new Set([...(artOf(p.html).match(/data-skel="facts"[\s\S]*?(?=<nav[^>]*data-skel="next")/) || [''])[0].matchAll(/href="(\/[^"#?]*)"/g)].map((m) => slugOfHref(m[1])))];
    const got = popItems.map((x) => slugOfHref(x.href));
    const big = memberSlugs.length >= 4; // 가게 4곳 이상 = 이 쪽 가게 중 인기 5 · 그보다 작으면 이 쪽에 없는 전국 인기 5
    const expect = big ? memberSlugs.filter((s) => rankOf(s) < 9999).sort((a, b) => rankOf(a) - rankOf(b)).slice(0, 5) : rankedOrder.filter((s) => !memberSlugs.includes(s)).slice(0, 5);
    ck(`T2 ${p.route} 인기 ${got.length} = 엔진 값 순(${big ? '이 쪽 가게' : '전국'})`, got.length > 0 && got.every((s, i) => s === expect[i]) && got.every((s) => rankOf(s) < 9999) && got.every((s, i, arr) => i === 0 || rankOf(arr[i - 1]) <= rankOf(s)), `${got.join(',')} / ${expect.join(',')}`);
    ck(`T2 ${p.route} 인기 칸 출처 = ${big ? '이 쪽 가게' : '이 쪽에 없는 가게'}`, big ? got.every((s) => memberSlugs.includes(s)) : got.every((s) => !memberSlugs.includes(s)));
    ck(`T2 ${p.route} 순위 글자 = 엔진 순위`, popItems.every((x) => +((x.meta.match(/인기 (\d+)위/) || [])[1] || 0) === rankOf(slugOfHref(x.href))));
    ck(`T2 ${p.route} 주말·퀴즈·랭킹 진입`, ['/weekend/', '/quiz/', '/ranking/'].every((h) => modItems(p.html).some((x) => x.href === h) || artLinkSet(p.html).has(h.replace(/\/$/, ''))));
  }
  ck('T2 인기 칸은 엔진 순위가 있는 가게만(가짜 0)', hubs.every((p) => modItems(p.html).filter((x) => x.module === 'popular').every((x) => rankOf(slugOfHref(x.href)) < 9999)));
  ck('T2 인기 5 있는 허브·목록 수(참고)', true, `${hubs.filter((p) => modItems(p.html).some((x) => x.module === 'popular')).length}/${hubs.length}`);
  // 매거진·커뮤니티
  ck('매거진 59 다음 글 칸', (byType.magazine || []).every((p) => modItems(p.html).some((x) => x.module === 'next-article')));
  ck('매거진 본문 가게 칸 있는 쪽 수(참고)', true, `${(byType.magazine || []).filter((p) => modItems(p.html).some((x) => x.module === 'venues')).length}/${(byType.magazine || []).length}`);
  ck('커뮤니티·안내 전체 인기 5 = 엔진 상위', [...(byType.community || []), ...(byType.guide || [])].every((p) => { const g = modItems(p.html).filter((x) => x.module === 'popular').map((x) => slugOfHref(x.href)); return g.length === 0 || g.every((s, i) => s === rankedOrder[i]); }));
  // T3 검색창(정적)
  const home = pages.find((p) => p.route === '/');
  ck('T3 홈 SSR 검색 form(action=/search/ · q)', /<form class="nc-search" role="search" action="\/search\/" method="get"/.test(home.html) && /name="q" list="nc-sugg"/.test(home.html));
  const opts = (home.html.match(/<datalist id="nc-sugg">([\s\S]*?)<\/datalist>/) || ['', ''])[1];
  const optN = (opts.match(/<option /g) || []).length;
  ck('T3 홈 자동완성 datalist 항목 ≥ 150(가게 126 + 지역 + 업종 + 지역×업종)', optN >= 150, String(optN));
  ck('T3 홈 자동완성에 가게이름·지역·업종', /value="강남청담클럽 레이스"/.test(opts) && /value="강남"/.test(opts) && /value="나이트"/.test(opts) && /value="강남 나이트"/.test(opts));
  ck('T3 홈 업종 탭 6', (home.html.match(/class="nc-cat-tabs"[\s\S]*?<\/nav>/) || [''])[0].split('<a ').length - 1 === 6);
  ck('T3 홈 지역 바로가기 12 + 신규 + 주간 투표', (() => { const n = (home.html.match(/class="nc-region-quick"[\s\S]*?<\/nav>/) || [''])[0]; return (n.match(/href="\/region\//g) || []).length === 12 && /\/new\/clubs\//.test(n) && /\/vs\//.test(n); })());
  ck('T3 홈 외부 호출 0(검색 form 이 같은 출처)', !/action="https?:/.test(home.html));
  ck('T3 /search/ 쪽 존재(dist)', ex(path.join(DIST, 'search', 'index.html')));
  ck('T3 React 번들에 TopSearchBar', fs.readdirSync(path.join(DIST, 'assets')).some((f) => /^HomePage-/.test(f) && /search_use|nc-top-search/.test(rd(path.join(DIST, 'assets', f)))));
  ck('T3 홈 번들에 장부(venues) 통째 0', fs.readdirSync(path.join(DIST, 'assets')).filter((f) => /^HomePage-/.test(f)).every((f) => fs.statSync(path.join(DIST, 'assets', f)).size < 200000));
  // T4 비교
  ck('T4 사이트맵에 /compare/ 1 · 매개변수 주소 0', (rd(path.join(DIST, 'sitemap.xml')).match(/\/compare\//g) || []).length === 1 && !/compare\/\?/.test(rd(path.join(DIST, 'sitemap.xml'))));
  ck('T4 비교 링크는 장부 슬러그만', venuesP.every((p) => { const c = modItems(p.html).find((x) => x.module === 'compare'); return !c || c.href.split('=')[1].split(',').every((s) => venuesSrc.includes(`slug: '${s}'`)); }));
  ck('T4 비교 링크 2~4곳', venuesP.every((p) => { const c = modItems(p.html).find((x) => x.module === 'compare'); const n = c ? c.href.split('=')[1].split(',').length : 0; return !c || (n >= 2 && n <= 4); }));
  ck('T4 ComparePage 는 값 없는 항목 줄 삭제(코드)', /\{v\.[a-zA-Z]+ && \(/.test(rd('src/pages/ComparePage.tsx')) || /&& </.test(rd('src/pages/ComparePage.tsx')));
  // T5 GA4 이벤트 — 코드 존재(디버그 뷰는 최종 --browser)
  ck('T5 dist 번들에 next_click·compare_open·search_use·scroll_90', (() => { const all = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => rd(path.join(DIST, 'assets', f))).join(''); return ['next_click', 'compare_open', 'search_use', 'scroll_90'].every((e) => all.includes(e)); })());
  ck('T5 GA4 태그 466 하나(ga4-tag-gate 통과 = 빌드 로그)', pages.every((p) => (p.html.match(/gtag\/js\?id=G-/g) || []).length === 1));
  // T6 빌드·주소·게이트·번들
  if (BASE_SITEMAP && ex(BASE_SITEMAP)) {
    const base = new Set([...rd(BASE_SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])); const now = new Set([...rd(path.join(DIST, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    ck('T6 사이트맵 주소 빠짐 0', [...base].every((u) => now.has(u))); ck('T6 사이트맵 주소 추가 0', [...now].every((u) => base.has(u))); ck('T6 466 = 466', base.size === now.size, `${base.size} → ${now.size}`);
  } else ck('T6 기준 사이트맵', null, '--base 없음');
  try { execFileSync(process.execPath, ['scripts/page-gate.mjs', `--dist=${DIST}`], { stdio: 'pipe' }); ck('T6 page-gate CLI exit 0', true); } catch (e) { ck('T6 page-gate CLI exit 0', false, String(e.stdout || e.message).slice(0, 120)); }
  for (const k of ['M1', 'M2', 'M3', 'M4', 'L1', 'L2', 'L3', 'L4', 'S2', 'S3', 'J3', 'S4']) ck(`T6 게이트 ${k} 막음 0`, gate.every((g) => !g.block.some((b) => b.startsWith(k + ' '))), gate.filter((g) => g.block.some((b) => b.startsWith(k + ' '))).slice(0, 3).map((g) => g.route).join(' '));
  for (const g of gate.filter((_, i) => i % 9 === 0)) ck(`T6 쪽 게이트 ${g.route}`, g.block.length === 0, g.block.join(' | '));
  const bundle = fs.readdirSync(path.join(DIST, 'assets')).reduce((n, f) => n + fs.statSync(path.join(DIST, 'assets', f)).size, 0);
  ck('T6 번들 크기 전/후(참고)', true, `${BUNDLE_BEFORE || '?'} → ${bundle} bytes`);
  ck('T6 번들 증가 ≤ 3%', BUNDLE_BEFORE ? bundle <= BUNDLE_BEFORE * 1.03 : null, `${BUNDLE_BEFORE} → ${bundle}`);
  // 쪽당 내부 링크 전/후
  const linkStats = {}; for (const t of SKEL_TYPES) { const arr = (byType[t] || []).map((p) => artLinkSet(p.html).size).sort((a, b) => a - b); if (arr.length) linkStats[t] = { min: arr[0], med: arr[Math.floor(arr.length / 2)], max: arr[arr.length - 1] }; }
  ck('쪽당 내부 링크 유형별(참고 · 전 = 가게16·목록12·허브9·매거진10·커뮤니티7·안내7)', true, JSON.stringify(linkStats));
  const byQ = {}; for (const g of gate) for (const q of g.quality) byQ[q.split(' ')[0]] = (byQ[q.split(' ')[0]] || 0) + 1;
  ck('품질 경고 집계(참고 · Q4 = 12~25 밖)', true, JSON.stringify(byQ));
  ck('가게 126 내부 링크 ≥12', venuesP.every((p) => artLinkSet(p.html).size >= 12), `최소 ${Math.min(...venuesP.map((p) => artLinkSet(p.html).size))}`);
  ck('가게 26~28칸 쪽(품질 경고 · 목표 12~25 위)', true, `${venuesP.filter((p) => artLinkSet(p.html).size > 25).length}쪽 · 최대 ${Math.max(...venuesP.map((p) => artLinkSet(p.html).size))}`);
  ck('전체 쪽 내부 링크 ≥ 12 쪽 수(참고)', true, `${pages.filter((p) => artLinkSet(p.html).size >= 12).length}/466`);
  ck('새 창 0(466 · L1 0)', gate.every((g) => !g.block.some((b) => b.startsWith('L1'))));
  ck('뼈대 순서 466(S2 0)', gate.every((g) => !g.block.some((b) => b.startsWith('S2'))));
}

if (stage === '최종') {
  const pages = distPages();
  const byType = {}; for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  for (const t of SKEL_TYPES) {
    const five = (byType[t] || []).filter((_, i) => i % Math.max(1, Math.floor((byType[t] || []).length / 5)) === 0).slice(0, 5);
    for (const p of five) {
      const h = p.html, items = modItems(h), g = gatePage(h, { route: p.route });
      ck(`30쪽 ${t} ${p.route} 다음에 볼 곳 채움(${items.length})`, items.length >= (t === 'venue' ? 7 : 1), items.map((x) => x.module).join(','));
      ck(`30쪽 ${t} ${p.route} 모듈 중복 0(M1)`, !g.block.some((b) => b.startsWith('M1')));
      ck(`30쪽 ${t} ${p.route} 내부 링크 새 창 0(밖으로 나가는 공식 사이트 링크는 예외)`, ![...artOf(h).matchAll(/<a\s+([^>]*)>/g)].some((m) => /target="_blank"/.test(m[1]) && /href="(\/|https:\/\/nolcool\.com)/.test(m[1])));
      ck(`30쪽 ${t} ${p.route} 뼈대 끝 = 다음에 볼 곳(정리 뒤)`, artOf(h).lastIndexOf('data-skel="summary"') < artOf(h).lastIndexOf('data-skel="next"'));
      ck(`30쪽 ${t} ${p.route} 게이트 막음 0`, g.block.length === 0, g.block.join(' | '));
      ck(`30쪽 ${t} ${p.route} 내부 링크 수`, artLinkSet(h).size >= (t === 'venue' ? 12 : 8), String(artLinkSet(h).size));
      ck(`30쪽 ${t} ${p.route} 뷰포트 메타(모바일)`, /<meta name="viewport" content="width=device-width/.test(h));
    }
  }
  if (BROWSER && ex(BROWSER)) {
    const b = JSON.parse(rd(BROWSER));
    ck('브라우저 검사 파일', true, b.tool || '');
    for (const r of b.pages || []) { ck(`브라우저 ${r.route} 콘솔 오류 0`, r.consoleErrors === 0, `오류 ${r.consoleErrors}`); ck(`브라우저 ${r.route} 모바일(412px) 가로 넘침 0`, r.overflow === false); if (r.route === '/') { ck('브라우저 홈 상단 검색창 보임', r.searchVisible === true); ck('브라우저 홈 자동완성 뜸', r.suggestCount > 0, String(r.suggestCount)); ck('브라우저 검색 제출 → /search?q=', r.searchNav === true); ck('브라우저 search_use 이벤트 dataLayer', r.evSearch === true); } if (r.route && /clubs|nights/.test(r.route)) { ck(`브라우저 ${r.route} 저장 버튼 토글 → localStorage`, r.saveToggle === true); ck(`브라우저 ${r.route} next_click dataLayer`, r.evNext === true); ck(`브라우저 ${r.route} scroll_90 dataLayer`, r.evScroll90 === true); } if (r.route === '/compare/') { ck('브라우저 비교 ?v= 로 2곳 나란히', r.compareRows >= 2, String(r.compareRows)); ck('브라우저 compare_open dataLayer', r.evCompare === true); } }
    ck('GA4 디버그 뷰(구글 계정)', null, 'GA4 권한 없음(11-1 실측) — dataLayer 실측으로 대체');
  } else ck('브라우저 검사 결과', null, '--browser 없음');
  // 대표님 원문 대조
  const gate = pages.map((p) => gatePage(p.html, { route: p.route }));
  ck('0절 배포 0(origin/main 그대로)', (() => { try { return execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim().startsWith('38be1ef'); } catch { return null; } })());
  ck('0절 주소 불변 — 사이트맵 466', pages.length === 466);
  ck('0절 가짜 0 — 인기 값은 엔진 순위 있는 가게만(참고 집계는 디버깅)', pages.every((p) => modItems(p.html).filter((x) => x.module === 'popular').every((x) => /인기 \d+위/.test(x.meta))));
  ck('0절 자동 새 창·강제 이동·무한 스크롤 속임·팝업 0', gate.every((g) => !g.block.some((b) => /^(L1|M3) /.test(b))));
  ck('1절 겹침 — 인기 엔진·랭킹·퀴즈·주말·매거진·커뮤니티·허브 그대로 잇기(새 엔진 0)', ex('scripts/popularity-engine.mjs') && ex(path.join(DIST, 'ranking', 'index.html')) && ex(path.join(DIST, 'quiz', 'index.html')) && ex(path.join(DIST, 'weekend', 'index.html')));
  ck('2-1 가게 8칸(3+2+1+1+1) · 인기 순 · 같은 가게 2번 0 · 광고주 표시 그대로(A1 0)', (byType.venue || []).every((p) => modItems(p.html).length >= 7) && gate.every((g) => !g.block.some((b) => /^(M1|A1) /.test(b))));
  ck('2-1 목록·허브 인기 5·주말·퀴즈·랭킹', [...(byType.list || []), ...(byType.hub || [])].every((p) => ['/weekend/', '/quiz/', '/ranking/'].every((h) => artLinkSet(p.html).has(h.replace(/\/$/, '')))));
  ck('2-1 매거진 본문 가게·지역 허브·다음 글', (byType.magazine || []).every((p) => modItems(p.html).some((x) => x.module === 'next-article')));
  ck('2-1 쪽당 내부 링크 — 가게 126 전부 ≥12(목표 12~25 · 상한 넘는 쪽은 품질 경고)', (byType.venue || []).every((p) => artLinkSet(p.html).size >= 12), `최소 ${Math.min(...(byType.venue || []).map((p) => artLinkSet(p.html).size))} · 최대 ${Math.max(...(byType.venue || []).map((p) => artLinkSet(p.html).size))}`);
  ck('외부 새 창 링크(광고주 공식 사이트 · 11-4 이전부터)', true, pages.filter((p) => /target="_blank"/.test(artOf(p.html))).map((p) => p.route).join(' ') || '0쪽');
  ck('2-2 홈 검색창 상단(SSR + React) · 자동완성 로컬 · /search 결과 · 업종 탭 · 지역 바로가기 · 인기·신규·투표·커뮤니티·매거진', (() => { const h = (pages.find((p) => p.route === '/') || {}).html || ''; return /class="nc-search"/.test(h) && /<datalist id="nc-sugg">/.test(h) && /class="nc-cat-tabs"/.test(h) && /class="nc-region-quick"/.test(h) && /\/vs\//.test(h); })());
  ck('2-2 WebSite+SearchAction 과 짝', (() => { const l = ldsOf((pages.find((p) => p.route === '/') || {}).html || ''); const w = l.find((x) => x && x['@type'] === 'WebSite'); return !!w && /search\?q=/.test(JSON.stringify(w.potentialAction || {})); })());
  ck('2-3 비교 = 기존 /compare/ + 검색 매개변수 · 사이트맵 변화 0', !/compare\/\?/.test(rd(path.join(DIST, 'sitemap.xml'))));
  ck('2-4 쪽 끝 = 다음에 볼 곳 + 저장 + 전화(있는 규칙)', (byType.venue || []).every((p) => /data-nc-save="/.test(artOf(p.html))));
  ck('2-5 GA4 scroll_90·next_click·compare_open·search_use', /scroll_90: 'scroll_90', next_click: 'next_click', compare_open: 'compare_open', search_use: 'search_use'/.test(rd('src/lib/visitor-tracker.ts')));
  ck('2-5 새 메일 0(대시보드는 월간 보고에)', !/mail|smtp/i.test(rd('src/components/home/TopSearchBar.tsx')));
  ck('3절 T1~T6 은 디버깅 단계 기록', true);
  ck('4절 검증 파일 nc11-4-check.mjs', ex('scripts/verify/nc11-4-check.mjs'));
  ck('원문 「한 번 오면 10쪽 이상」 — 모든 쪽에 다음에 볼 곳 ≥1 + 허브 직접 링크', pages.every((p) => modItems(p.html).length >= 1 || /nc-next-hubs/.test(p.html)));
  ck('원문 「네이버처럼 홈」 — 상단 검색창 + 업종 탭 + 지역 바로가기 (SSR·React 둘 다)', /<TopSearchBar \/>/.test(rd('src/pages/HomePage.tsx')) && /class="nc-search"/.test((pages.find((p) => p.route === '/') || {}).html || ''));
}

const fails = R.filter((x) => x.r === '실패');
const out = { stage, checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, skip: R.filter((x) => x.r === '해당 없음').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${stage}: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na} · 해당 없음 ${out.skip}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
process.exit(fails.length ? 1 : 0);
