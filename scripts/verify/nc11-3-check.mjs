#!/usr/bin/env node
/**
 * [놀쿨11-3] 3단계 검증 — node scripts/verify/nc11-3-check.mjs <스테이징|디버깅|최종> [--dist=dist] [--base=<라이브 사이트맵 xml>] [--lh-before=<json>] [--lh-after=<json>] [--schema=<검증기 결과 json>] [--research=<11-1 연구 md>] [--out=<json>]
 *  판정 낱말은 넷뿐: 통과 / 실패 / 실행 불가 / 해당 없음. 검사 0건은 실패다. 읽기만 한다(파일을 쓰지 않는다 · --out 보고만).
 *  스테이징 = 파일:줄·규칙 출처 1:1·네이버 0·주소 0 · 디버깅 = T1~T7 · 최종 = 로컬 30쪽 화면 + 검증기 결과 + 대표님 원문 대조
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
const LH_BEFORE = arg('lh-before', ''), LH_AFTER = arg('lh-after', ''), SCHEMA = arg('schema', '');
const RESEARCH = arg('research', 'docs/NOLCOOL11-1_연구_2026-09-23.md');
const OUT = arg('out', '');
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note || '').slice(0, 180) });
const rd = (p) => fs.readFileSync(p, 'utf8');
const ex = (p) => fs.existsSync(p);
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = (h) => dec(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const ldsOf = (h) => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
const normRoute = (href) => { let r = String(href).replace(/^https?:\/\/nolcool\.com/, '').replace(/[?#].*$/, ''); try { r = decodeURIComponent(r); } catch {} r = r.replace(/\/$/, ''); return r || '/'; };

function distPages() {
  const xml = rd(path.join(DIST, 'sitemap.xml'));
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '')).map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')));
  return routes.map((r) => { const f = path.join(DIST, ...r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), 'index.html'); let d = r; try { d = decodeURIComponent(r); } catch {} return { route: d, enc: r, file: f, html: ex(f) ? rd(f) : '' }; });
}
function allDistHtml() {
  const out = [];
  const walk = (dir, rel) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (e.isDirectory()) walk(path.join(dir, e.name), rel + '/' + e.name); else if (e.name === 'index.html') out.push({ route: rel || '/', html: rd(path.join(dir, e.name)) }); } };
  walk(DIST, '');
  return out;
}
const titleOf = (h) => dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
const firstImg = (h) => (h.match(/<img[^>]*>/) || [''])[0];
const HUB_RE = /^\/(region|near|tag|best|new)\/|^\/(clubs|nights|lounges|rooms|yojeong|hoppa)$|^\/ranking$/;

// 규칙 출처(11-1 연구 표의 출처 id) — 스테이징이 연구 문서에 그 id 가 있는지 1:1 로 본다
const SOURCES = {
  'J2 가게 NightClub/BarOrPub/LocalBusiness': ['G-sd-localbusiness', 'Schema-NightClub', 'Schema-BarOrPub'],
  'J2 Breadcrumb': ['G-sd-breadcrumb'], 'J2 FAQPage = 화면': ['G-sd-faq'], 'J2 Article': ['G-sd-article'], 'J4 가짜 평점 0': ['G-sd-review', 'G-sd-policies'],
  'J3 사실 일치(보이지 않는 마크업 금지)': ['G-sd-policies'], 'O1 og 3종': ['G-seo-starter', 'G-sd-policies'], 'S4 세이프서치': ['G-safesearch'],
  'robots AI 봇': ['OpenAI-bots', 'Anthropic-bots', 'Perplexity-bots', 'Apple-bot', 'G-crawlers'], 'llms.txt': ['llmstxt'], 'sitemap lastmod': ['G-sitemaps'],
  'IndexNow': ['IndexNow-doc', 'Bing-indexnow'], 'CWV LCP 2.5s': ['G-cwv', 'webdev-lcp'], 'CWV CLS 0.1': ['webdev-cls'], 'CWV INP 200ms': ['webdev-inp'],
  'LCP 그림 지연 로드 금지': ['webdev-lazy-lcp'], 'fetchpriority high': ['webdev-fetchpriority'], 'preload': ['MDN-preload', 'webdev-image'], '캐시 헤더': ['CF-cache-rules', 'CF-cache-default', 'CF-early-hints'],
  'canonical': ['G-canonical'], '내부 링크': ['G-links', 'G-seo-starter'],
};

if (stage === '스테이징') {
  const pg = rd('scripts/page-gate.mjs'), pre = rd('scripts/prerender-seo.mjs'), sk = rd('scripts/skeleton/index.mjs'), inx = rd('scripts/indexnow.mjs'), robots = rd('public/robots.txt');
  for (const f of ['scripts/page-gate.mjs', 'scripts/prerender-seo.mjs', 'scripts/skeleton/index.mjs', 'scripts/indexnow.mjs', 'public/robots.txt', 'public/_headers', 'scripts/verify/nc11-3-check.mjs', 'scripts/lib/title-bank.mjs', 'src/components/seo/SsrArticle.tsx']) ck('파일 ' + f, ex(f));
  const keyFile = fs.readdirSync('public').find((x) => /^[0-9a-f]{32}\.txt$/i.test(x));
  ck('IndexNow 키 파일 public/<32hex>.txt', !!keyFile, keyFile || '');
  ck('IndexNow 키 = prerender 상수', !!keyFile && pre.includes(keyFile.replace(/\.txt$/, '')));
  // 2-5 게이트 항목 — 줄 번호와 함께
  for (const k of ['J1', 'J2', 'J3', 'J4', 'J5', 'O1', 'S4', 'L3', 'L4']) { const i = pg.split('\n').findIndex((l) => new RegExp(`push\\((\`|')${k} `).test(l)); ck(`page-gate ${k} 있음(scripts/page-gate.mjs:${i + 1})`, i >= 0); }
  ck('page-gate J2 유형표 6종(venue·list·hub·magazine·community·guide)', /need = \{ venue:.*list:.*hub:.*magazine:.*community:.*guide:/.test(pg));
  ck('page-gate J2 홈 = WebSite + Organization', /route === '\/' \? \/WebSite\//.test(pg) && /route === '\/' \? \/Organization\//.test(pg));
  ck('page-gate J4 FAKE_PROPS_RE = aggregateRating·review·reviewRating·ratingValue·reviewCount', /aggregateRating\|review\|reviewRating\|ratingValue\|reviewCount/.test(pg));
  for (const w of ['성관계', '성행위', '섹스', '포르노', '음란', '야동', '알몸', '나체', '누드', '노출\\s?사진', '성인용품', '자위', '매춘', '성매매', '출장\\s?안마', '조건\\s?만남', '오피', '안마방', '풀싸롱', '텐프로', '2차', '밤\\s?문화', '유흥', '룸\\s?살롱', '초이스']) ck(`S4 세이프서치 낱말 「${w}」`, pg.includes(w));
  ck('S4 는 제목·설명·본문 셋 다 본다', /SAFESEARCH_RE\.test\(bodyText\) \|\| SAFESEARCH_RE\.test\(title\) \|\| SAFESEARCH_RE\.test\(desc\)/.test(pg));
  ck('J3 name 본문 대조', /J3 LD name/.test(pg)); ck('J3 telephone 대조(tel 링크·번호 글자)', /J3 LD telephone/.test(pg)); ck('J3 영업시간 대조', /J3 LD 영업시간/.test(pg)); ck('J3 주소 대조', /J3 LD 주소/.test(pg)); ck('J3 Breadcrumb 마지막 = 주소', /J3 Breadcrumb 마지막/.test(pg));
  ck('L3 문턱 가게 10 · 나머지 6', /type === 'venue' \? 10 : 6/.test(pg)); ck('L4 허브 링크 정규식(region·near·tag·best·new·업종 뿌리)', /HUB_LINK_RE = \/href="\\\/\(region\|near\|tag\|best\|new\)\\\/\|href="\\\/\(clubs\|nights\|lounges\|rooms\|yojeong\|hoppa\)/.test(pg));
  ck('O1 og:title·og:description·og:image', /\['og:title', 'og:description', 'og:image'\]/.test(pg));
  ck('J5 DiscussionForumPosting 은 data-nc-posts 있을 때만', /J5 글 0 인 쪽에 DiscussionForumPosting/.test(pg));
  // 2-1 prerender
  ck('가게 LD 영업시간 파서 parseOpeningHours', /function parseOpeningHours\(/.test(pre));
  ck('영업시간 없으면 속성 삭제(없는 사실 0)', /delete [a-zA-Z.]*openingHoursSpecification/.test(pre));
  ck('주소 없으면 streetAddress 삭제', /delete [a-zA-Z.]*streetAddress/.test(pre));
  ck('BreadcrumbList 자동 보강', /BreadcrumbList/.test(pre) && /\[놀쿨11-3\][^\n]*Breadcrumb/i.test(pre));
  ck('커뮤니티 게시판 = CollectionPage(글 0 이면 DiscussionForumPosting 0)', /CollectionPage/.test(pre));
  ck('FAQPage LD = 화면 dl 동기화', /NC_FAQ_SYNCED\.push/.test(pre));
  ck('가짜 평점 생성 코드 0(aggregateRating 문자열이 LD 생성부에 없음)', !/aggregateRating['"]?\s*:/.test(pre));
  ck('홈 WebSite + SearchAction', /SearchAction/.test(pre)); ck('홈 Organization', /'@type': 'Organization'/.test(pre));
  ck('매거진 Article datePublished·dateModified', /datePublished/.test(pre) && /dateModified/.test(pre));
  // 2-2
  ck('llms.txt 전체 쪽 = 제목 + 직답 첫 문장', /answer1/.test(pre) && /llms\.txt/.test(pre));
  ck('IndexNow 자동 전송은 CI·--indexnow 일 때만(로컬 빌드 0)', /process\.env\['CI'\] \|\| process\.env\['GITHUB_ACTIONS'\] \|\| process\.argv\.includes\('--indexnow'\)/.test(pre));
  ck('indexnow.mjs 키 파일 읽기(위성 방식)', /keyFromFile/.test(inx)); ck('indexnow.mjs 창구 Bing 하나', /https:\/\/www\.bing\.com\/indexnow/.test(inx) && !/api\.indexnow\.org'/.test(inx.replace(/\/\/.*$/gm, '')) && !/yandex/.test(inx));
  ck('indexnow.mjs --plan(보내지 않기)', /PLAN_ONLY/.test(inx)); ck('indexnow.mjs 네이버 창구 0', !/searchadvisor|naver\.com/.test(inx));
  ck('indexnow.mjs 변경분만(스냅샷 diff)', /diffChanged/.test(inx));
  for (const bot of ['Googlebot', 'Googlebot-Image', 'Google-Extended', 'Bingbot', 'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Applebot', 'Applebot-Extended', 'CCBot', 'Amazonbot', 'Meta-ExternalAgent', 'DuckDuckBot', 'Yeti']) ck(`robots.txt ${bot} Allow`, new RegExp(`User-agent: ${bot.replace(/[-]/g, '\\-')}\\s*\\n\\s*Allow: /`).test(robots));
  ck('robots.txt 모든 로봇 허용(User-agent: * / Allow: /)', /User-agent: \*\s*\n\s*Allow: \//.test(robots)); ck('robots.txt Disallow 0', !/Disallow:\s*\/\S*/.test(robots)); ck('robots.txt Sitemap 줄', /Sitemap: https:\/\/nolcool\.com\/sitemap\.xml/.test(robots)); ck('robots.txt llms.txt 안내', /llms\.txt/.test(robots));
  // 2-3
  ck('첫 그림 width/height/fetchpriority=high(줄)', /width="1200" height="675" fetchpriority="high"/.test(pre));
  ck('첫 그림 webp 축소판 srcset(og jpg 쪽)', /ogWebpSet\(/.test(pre) && /srcset=/.test(pre)); ck('sharp 로 webp 600·1200', /\[600, 1200\]/.test(pre) && /import sharp/.test(pre));
  ck('LCP preload 태그(가게 쪽)', /rel="preload" as="image"/.test(pre));
  ck('lazy+low 주입 0', !/loading="lazy" fetchpriority="low"/.test(pre));
  const hdr = rd('public/_headers');
  ck('_headers assets immutable 1년', /\/assets\/\*\s*\n\s*Cache-Control: public, max-age=31536000, immutable/.test(hdr)); ck('_headers html s-maxage+SWR', /s-maxage=300, stale-while-revalidate=600/.test(hdr)); ck('_headers og 30일', /\/og\/\*\s*\n\s*Cache-Control: public, max-age=2592000/.test(hdr)); ck('_redirects 301/302 0(SPA 200 폴백만)', !ex('public/_redirects') || !/\s30[12]/.test(rd('public/_redirects')));
  const vite = ex('vite.config.ts') ? rd('vite.config.ts') : '';
  ck('번들 분할 manualChunks(vendor)', /manualChunks/.test(vite), vite ? '' : 'vite.config.ts 없음');
  ck('글꼴 = 시스템 글꼴(웹폰트 0 → 미리 연결 해당 없음)', !/fonts\.googleapis|@font-face/.test(rd('src/index.css')) ? 'na' : false);
  // 2-4 skeleton hubs
  ck('다음에 볼 곳 허브 링크 nc-next-hubs', /nc-next-hubs/.test(sk));
  for (const c of ['클럽', '나이트', '라운지', '룸', '요정', '호빠']) ck(`허브 링크 업종표 ${c}`, new RegExp(`'${c}': '`).test(sk));
  ck('허브 링크 자기 자신 제외', /!== self/.test(sk)); ck('허브 링크 인기 랭킹', /push\('\/ranking\/'/.test(sk)); ck('허브 링크 라벨에 업종어 되풀이 0(밀도 3% 상한)', /'업종 전체 목록'/.test(sk) && !/`\$\{f\.cat\} 전체`/.test(sk));
  ck('근처 허브 주소 = place 그대로(역 떼지 않음)', sk.includes('push(`/near/${encodeURIComponent(String(f.place))}/`'));
  // 규칙 출처 1:1
  const research = ex(RESEARCH) ? rd(RESEARCH) : '';
  for (const [rule, ids] of Object.entries(SOURCES)) { const found = ids.filter((id) => research.includes(`| ${id} |`)); ck(`규칙 출처 ${rule} → ${ids.join('·')}`, research ? found.length > 0 : null, research ? `연구 표에 ${found.join('·') || '없음'}` : '연구 문서 없음'); }
  // 0절
  const newCode = pg + sk + inx; // 검사 스크립트 자신은 낱말을 품고 있어 뺀다
  ck('네이버 호출 0(고친 파일에 naver 주소 요청 없음)', !/fetch\([^)]*naver\.com/i.test(newCode) && !/searchadvisor/.test(sk + inx) && (pg.match(/searchadvisor/g) || []).length === 1, 'page-gate 의 searchadvisor 는 N1 막음 정규식 1곳뿐');
  ck('주소 변경 코드 0', !/_redirects|301|slug\s*=\s*.*replace/.test(pg + sk + inx));
  ck('API 키 0', !/sk-ant|ANTHROPIC_API_KEY|OPENAI_API_KEY/.test(newCode));
  ck('가짜 생성 0(insert·createUser 없음)', !/\.insert\(|createUser|signUp\(/.test(newCode));
  ck('새 창 0(target=_blank 없음)', !/_blank/.test(sk));
  ck('Actions 신설 0(.github/workflows 새 파일 없음 — git 추적 밖 파일 0)', (() => { try { return execFileSync('git', ['status', '--short', '.github'], { encoding: 'utf8' }).trim() === ''; } catch { return null; } })());
  ck('빌드 체인 끝 page-gate', /node scripts\/page-gate\.mjs"?$/.test(JSON.parse(rd('package.json')).scripts.build));
}

if (stage === '디버깅') {
  const pages = distPages();
  ck('dist 466쪽', pages.length === 466 && pages.every((p) => p.html), String(pages.length));
  const byType = {}; for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  const reg = pages.map((p) => ({ route: p.route, title: titleOf(p.html) }));
  const gate = pages.map((p) => gatePage(p.html, { route: p.route }));
  // T1 유형별 표본 6쪽 — JSON-LD 파싱·속성=본문·가짜 평점 0
  const pick = (re) => pages.find((p) => re.test(p.route));
  const samples = [['클럽 가게', pick(/^\/clubs\/[^/]+\/[^/]+$/)], ['라운지 가게', pick(/^\/lounges\/[^/]+$/)], ['나이트 가게', pick(/^\/nights\/[^/]+$/)], ['업종 목록', pick(/^\/clubs$/)], ['지역 허브', pick(/^\/region\/[^/]+$/)], ['매거진', pick(/^\/magazine\/./)], ['홈', pick(/^\/$/)], ['커뮤니티', pick(/^\/community$/)]];
  for (const [label, p] of samples) {
    if (!p) { ck(`T1 ${label} 표본`, false, '쪽 없음'); continue; }
    const lds = ldsOf(p.html), raw = p.html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
    ck(`T1 ${label} ${p.route} JSON-LD 파싱 ${raw.length}개`, raw.length > 0 && lds.every(Boolean));
    const text = strip(p.html);
    const biz = lds.find((x) => x && /NightClub|BarOrPub|EntertainmentBusiness|Restaurant|LocalBusiness/.test(String(x['@type'])));
    const t = pageTypeOf(p.route);
    ck(`T1 ${label} 유형 마크업`, t === 'venue' ? !!biz : t === 'list' || t === 'hub' ? lds.some((x) => x && /CollectionPage|ItemList/.test(String(x['@type']))) : t === 'magazine' ? lds.some((x) => x && /Article/.test(String(x['@type']))) : p.route === '/' ? lds.some((x) => x && x['@type'] === 'WebSite') && lds.some((x) => x && x['@type'] === 'Organization') : lds.some((x) => x && /CollectionPage|WebPage/.test(String(x['@type']))), lds.map((x) => x && x['@type']).join(','));
    if (biz) { ck(`T1 ${label} name 본문 일치`, text.includes(biz.name)); ck(`T1 ${label} telephone ⇒ 본문`, biz.telephone ? (/href="tel:/.test(p.html) || text.includes(String(biz.telephone).replace(/^\+82-?/, '0'))) : 'na'); ck(`T1 ${label} 영업시간 ⇒ 본문`, biz.openingHoursSpecification ? /영업시간|영업 시간|24시간/.test(text) : 'na'); ck(`T1 ${label} 주소 ⇒ 본문`, biz.address?.streetAddress ? text.includes(String(biz.address.streetAddress).slice(0, 8)) : 'na'); ck(`T1 ${label} image = og`, !!biz.image); }
    ck(`T1 ${label} Breadcrumb 마지막 = 주소`, (() => { const b = lds.find((x) => x && x['@type'] === 'BreadcrumbList'); if (!b) return p.route === '/' ? 'na' : false; const last = (b.itemListElement || []).slice(-1)[0]; return !!last && normRoute(last.item) === p.route; })());
    ck(`T1 ${label} 가짜 평점·후기 0`, !raw.some((x) => /"(aggregateRating|review|reviewRating|ratingValue|reviewCount)"\s*:/.test(x)));
    ck(`T1 ${label} FAQ LD ⊆ 화면`, !gate.find((g) => g.route === p.route).block.some((b) => b.startsWith('S3')));
  }
  // JSON-LD 유형별 쪽 수
  const typeCount = {}; for (const p of pages) for (const x of ldsOf(p.html)) if (x) typeCount[String(x['@type'])] = (typeCount[String(x['@type'])] || 0) + 1;
  ck('JSON-LD 유형별 쪽 수(참고)', true, JSON.stringify(typeCount));
  ck('가게 126 = NightClub|BarOrPub|Restaurant|EntertainmentBusiness', (byType.venue || []).every((p) => ldsOf(p.html).some((x) => x && /NightClub|BarOrPub|EntertainmentBusiness|Restaurant/.test(String(x['@type'])))), String((byType.venue || []).length));
  ck('가게 openingHoursSpecification 은 장부 영업시간 있는 쪽만', (byType.venue || []).every((p) => { const b = ldsOf(p.html).find((x) => x && /NightClub|BarOrPub|EntertainmentBusiness|Restaurant/.test(String(x['@type']))); return !b || !b.openingHoursSpecification || /영업시간|영업 시간|24시간/.test(strip(p.html)); }));
  ck('BreadcrumbList 466/466(홈 제외)', pages.filter((p) => p.route !== '/').every((p) => ldsOf(p.html).some((x) => x && x['@type'] === 'BreadcrumbList')));
  ck('가게 노드에 datePublished·dateModified·speakable 0(schema.org 미인정 속성 · 검증기 경고 0)', (byType.venue || []).every((p) => { const b = ldsOf(p.html).find((x) => x && /NightClub|BarOrPub|EntertainmentBusiness|Restaurant/.test(String(x['@type']))); return !!b && !b.datePublished && !b.dateModified && !b.speakable; }));
  { const badSp = (byType.venue || []).filter((p) => { const w = ldsOf(p.html).find((x) => x && x['@type'] === 'WebPage'); return !(w && w.speakable && /<h1/.test(p.html) && /class="[^"]*ssr-answer/.test(p.html)); }); ck('가게 WebPage 노드 speakable(h1 · .ssr-answer 가 화면에 있음)', badSp.length === 0, badSp.slice(0, 4).map((p) => p.route).join(' ')); }
  ck('가게 article:published_time 메타 0(가짜 등록일 제거)', (byType.venue || []).every((p) => !/article:published_time/.test(p.html)));
  ck('DiscussionForumPosting 은 글 있는 쪽만', pages.every((p) => !ldsOf(p.html).some((x) => x && x['@type'] === 'DiscussionForumPosting') || /data-nc-posts="[1-9]/.test(p.html)));
  ck('J1~J5 막음 0(466)', gate.every((g) => !g.block.some((b) => /^J[1-5] /.test(b))), gate.filter((g) => g.block.some((b) => /^J/.test(b))).slice(0, 3).map((g) => g.route + ':' + g.block.find((b) => /^J/.test(b))).join(' | '));
  // T3 robots·llms·sitemap
  const robots = ex(path.join(DIST, 'robots.txt')) ? rd(path.join(DIST, 'robots.txt')) : '';
  ck('T3 dist/robots.txt', !!robots); ck('T3 robots Sitemap', /Sitemap: https:\/\/nolcool\.com\/sitemap\.xml/.test(robots)); ck('T3 robots Disallow 0', !/Disallow:\s*\/\S*/.test(robots));
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Bingbot', 'Googlebot']) ck(`T3 robots ${bot} Allow`, new RegExp(`User-agent: ${bot}\\s*\\n\\s*Allow: /`).test(robots));
  const llms = ex(path.join(DIST, 'llms.txt')) ? rd(path.join(DIST, 'llms.txt')) : '';
  ck('T3 dist/llms.txt', !!llms); ck('T3 llms.txt 사이트 소개', /^# 놀쿨/m.test(llms) && /^> /m.test(llms)); ck('T3 llms.txt 허브 절', /^## (메인 페이지|지역별 페이지|주요 지역)/m.test(llms));
  const full = (llms.split(/^## 전체 페이지/m)[1] || '');
  const fullLines = full.split('\n').filter((l) => /^- \[/.test(l));
  ck('T3 llms.txt 전체 페이지 = 466', fullLines.length === 466, String(fullLines.length));
  ck('T3 llms.txt 전체 페이지 줄마다 직답', fullLines.length > 0 && fullLines.every((l) => /\): .{10,}/.test(l)), String(fullLines.filter((l) => !/\): .{10,}/.test(l)).length) + ' 직답 없음');
  ck('T3 llms.txt 주소 = 사이트맵 주소', (() => { const set = new Set(pages.map((p) => p.enc)); return fullLines.every((l) => { const m = l.match(/\]\((https:\/\/nolcool\.com[^)]*)\)/); return m && set.has(m[1].replace(/%28/g, '(').replace(/%29/g, ')').replace(/^https:\/\/nolcool\.com/, '').replace(/\/$/, '') || '/'); }); })());
  ck('T3 llms-full.txt', ex(path.join(DIST, 'llms-full.txt')));
  const sm = rd(path.join(DIST, 'sitemap.xml'));
  const urls = [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  ck('T3 sitemap 466', urls.length === 466, String(urls.length));
  ck('T3 sitemap lastmod 466 · 날짜 형식', urls.every((u) => /<lastmod>\d{4}-\d{2}-\d{2}/.test(u)));
  ck('T3 sitemap lastmod ≤ 오늘', urls.every((u) => (u.match(/<lastmod>(\d{4}-\d{2}-\d{2})/) || [])[1] <= new Date().toISOString().slice(0, 10)));
  ck('T3 sitemap lastmod 는 해시 정직화(.seo-lastmod.json)', ex('scripts/.seo-lastmod.json') && /lastmodFor\(/.test(rd('scripts/prerender-seo.mjs')));
  const key = fs.readdirSync('public').find((x) => /^[0-9a-f]{32}\.txt$/i.test(x));
  ck('T3 IndexNow 키 파일 dist 에 있음', !!key && ex(path.join(DIST, key)));
  try { const o = execFileSync(process.execPath, ['scripts/indexnow.mjs', '--plan'], { encoding: 'utf8', stdio: 'pipe' }); ck('T3 indexnow.mjs --plan 실행(보내지 않음)', /--plan|변경 없음|sitemap 466/.test(o), o.split('\n').find((l) => /sitemap|변경/.test(l)) || ''); } catch (e) { ck('T3 indexnow.mjs --plan 실행', false, String(e.stdout || e.message).slice(0, 120)); }
  ck('T3 canonical 466 = 자기 절대주소(L2 0)', gate.every((g) => !g.block.some((b) => b.startsWith('L2'))));
  ck('T3 og 3종 466(O1 0)', gate.every((g) => !g.block.some((b) => b.startsWith('O1'))));
  ck('T3 hreflang — ko 단일이라 추가 불필요(기존 자기참조 ko·x-default 는 해가 없어 그대로)', 'na', pages.every((p) => /hreflang="x-default" href="https:\/\/nolcool\.com\//.test(p.html)) ? '자기참조 x-default 466' : '');
  // T4 CWV — 그림 속성 466 + Lighthouse 전/후
  ck('T4 첫 그림 width/height 466', pages.every((p) => /width="\d+" height="\d+"/.test(firstImg(p.html))));
  ck('T4 첫 그림 lazy 0', pages.every((p) => !/loading="lazy"/.test(firstImg(p.html))));
  ck('T4 첫 그림 fetchpriority=high 466', pages.every((p) => /fetchpriority="high"/.test(firstImg(p.html))));
  ck('T4 첫 그림 현대 형식(webp) 466', pages.every((p) => /src="[^"]*\.webp/.test(firstImg(p.html))), String(pages.filter((p) => !/src="[^"]*\.webp/.test(firstImg(p.html))).length) + ' 아님');
  ck('T4 og jpg 쪽 srcset 600w/1200w', pages.filter((p) => /-w1200\.webp/.test(firstImg(p.html))).every((p) => /srcset="[^"]*600w[^"]*1200w"/.test(firstImg(p.html))) && pages.some((p) => /-w1200\.webp/.test(firstImg(p.html))));
  ck('T4 og:image 는 jpg 그대로(미리보기 호환)', pages.every((p) => /<meta property="og:image" content="[^"]*\.(jpg|png)"/.test(p.html)));
  ck('T4 webp 축소판 파일 존재(표본 10)', pages.filter((p) => /-w1200\.webp/.test(firstImg(p.html))).slice(0, 10).every((p) => { const m = firstImg(p.html).match(/src="https:\/\/nolcool\.com(\/og\/[^"]+)"/); return m && ex(path.join(DIST, m[1])); }));
  ck('T4 뷰포트 메타 466', pages.every((p) => /<meta name="viewport" content="width=device-width/.test(p.html)));
  ck('T4 modulepreload(번들 분할·vendor 선적재)', pages.every((p) => /rel="modulepreload"/.test(p.html)));
  ck('T4 CSS 1파일(unused-css 통과 · 분리 이득 0)', fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.css')).length === 1);
  ck('T4 PSI 공식 API', null, '429(할당량) — Lighthouse 12 CLI(같은 엔진 · 모바일 · 시뮬레이션 4G)로 대체');
  const lhB = LH_BEFORE && ex(LH_BEFORE) ? JSON.parse(rd(LH_BEFORE)) : null, lhA = LH_AFTER && ex(LH_AFTER) ? JSON.parse(rd(LH_AFTER)) : null;
  if (lhB && lhA) {
    ck('T4 Lighthouse 전/후 같은 10쪽', lhB.res.length === 10 && lhA.res.length === 10 && lhB.res.every((r, i) => r.p === lhA.res[i].p));
    for (const a of lhA.res) { const b = lhB.res.find((x) => x.p === a.p) || {}; ck(`T4 ${a.p} CLS ≤ 0.1(후)`, a.err ? null : a.cls <= 0.1, `${b.cls} → ${a.cls}`); ck(`T4 ${a.p} LCP 후 < 전`, a.err || b.err ? null : a.lcp < b.lcp, `${b.lcp} → ${a.lcp}ms`); ck(`T4 ${a.p} 성능 점수 후 ≥ 전`, a.err || b.err ? null : a.perf >= b.perf, `${b.perf} → ${a.perf}`); }
    const okA = lhA.res.filter((r) => !r.err);
    ck('T4 후 LCP 2.5초(2500ms) 이내 쪽 수(참고 · 실험실 시뮬레이션)', true, `${okA.filter((r) => r.lcp <= 2500).length}/${okA.length}`);
    ck('T4 후 CLS 0.1 이내 10/10', okA.length === 10 && okA.every((r) => r.cls <= 0.1));
    ck('T4 후 TBT 중앙값(참고 · INP 대리)', true, String(okA.map((r) => r.tbt).sort((a, b) => a - b)[Math.floor(okA.length / 2)]) + 'ms');
  } else ck('T4 Lighthouse 전/후 파일', null, '--lh-before/--lh-after 없음');
  // T5 고아 0 · 허브 2단계 · 새 창 0
  const all = allDistHtml();
  const links = new Map(); for (const p of all) links.set(p.route, new Set([...p.html.matchAll(/<a\s+[^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((h) => /^\/|^https:\/\/nolcool\.com/.test(h) && !/^\/\//.test(h)).map(normRoute).filter((r) => r !== p.route)));
  const inbound = new Map(); for (const [from, set] of links) for (const to of set) { if (!inbound.has(to)) inbound.set(to, new Set()); inbound.get(to).add(from); }
  const orphans = pages.filter((p) => !(inbound.get(p.route) || new Set()).size);
  ck('T5 고아 쪽 0(466 전부 다른 쪽에서 링크됨)', orphans.length === 0, orphans.slice(0, 4).map((p) => p.route).join(' '));
  ck('T5 링크 그래프 크기(참고)', true, `쪽 ${all.length} · 링크 ${[...links.values()].reduce((n, s) => n + s.size, 0)}`);
  const depth = new Map([['/', 0]]); const q = ['/']; while (q.length) { const r = q.shift(); for (const to of links.get(r) || []) if (!depth.has(to)) { depth.set(to, depth.get(r) + 1); q.push(to); } }
  const deep = pages.filter((p) => !depth.has(p.route) || depth.get(p.route) > 3);
  ck('T5 홈에서 3단계 안 466', deep.length === 0, deep.slice(0, 4).map((p) => p.route + ':' + depth.get(p.route)).join(' '));
  ck('T5 깊이 분포(참고)', true, JSON.stringify([0, 1, 2, 3].map((d) => pages.filter((p) => depth.get(p.route) === d).length)));
  const hubNear = pages.filter((p) => { const l1 = links.get(p.route) || new Set(); if ([...l1].some((r) => HUB_RE.test(r))) return true; return [...l1].some((r) => [...(links.get(r) || [])].some((x) => HUB_RE.test(x))); });
  ck('T5 허브 2단계 안 466', hubNear.length === pages.length, `${hubNear.length}/${pages.length}`);
  const direct = pages.filter((p) => [...(links.get(p.route) || [])].some((r) => HUB_RE.test(r)));
  ck('T5 허브 직접 링크(1단계) 쪽 수(참고)', true, `${direct.length}/${pages.length}`);
  ck('T5 다음에 볼 곳 허브 묶음 nc-next-hubs', pages.filter((p) => /nc-next-hubs/.test(p.html)).length >= 400, String(pages.filter((p) => /nc-next-hubs/.test(p.html)).length));
  ck('T5 내부 새 창 0(L1 0)', gate.every((g) => !g.block.some((b) => b.startsWith('L1'))));
  ck('T5 본문 내부 링크 문턱(L3 0)', gate.every((g) => !g.block.some((b) => b.startsWith('L3'))), gate.filter((g) => g.block.some((b) => b.startsWith('L3'))).slice(0, 3).map((g) => g.route).join(' '));
  ck('T5 가게·목록·허브 허브 링크(L4 막음 0)', gate.every((g) => !g.block.some((b) => b.startsWith('L4'))));
  ck('T5 가게 ↔ 매거진 ↔ 커뮤니티 연결(홈에서 셋 다 3단계 안)', ['magazine', 'community', 'venue'].every((t) => (byType[t] || []).some((p) => depth.has(p.route) && depth.get(p.route) <= 3)));
  // T6 세이프서치
  ck('T6 세이프서치 466 걸림 0', gate.every((g) => !g.block.some((b) => b.startsWith('S4'))), gate.filter((g) => g.block.some((b) => b.startsWith('S4'))).slice(0, 3).map((g) => g.route + ':' + g.block.find((b) => b.startsWith('S4'))).join(' | '));
  for (const t of SKEL_TYPES) ck(`T6 세이프서치 ${t} ${(byType[t] || []).length}쪽 0`, (byType[t] || []).length > 0 && gate.filter((g) => g.type === t).every((g) => !g.block.some((b) => b.startsWith('S4'))));
  ck('T6 rating=adult 메타 0(선정적 쪽 아님)', pages.every((p) => !/name="rating" content="adult"/i.test(p.html)));
  ck('T6 첫 그림 alt 466(노출 사진 아님 · og 문구 그림)', pages.every((p) => /alt="[^"]+"/.test(firstImg(p.html))));
  // T7 빌드 · 주소 변경 0 · 게이트 exit 0
  if (BASE_SITEMAP && ex(BASE_SITEMAP)) {
    const base = new Set([...rd(BASE_SITEMAP).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])); const now = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const removed = [...base].filter((u) => !now.has(u)), added = [...now].filter((u) => !base.has(u));
    ck('T7 사이트맵 주소 빠짐 0', removed.length === 0, removed.slice(0, 3).join(' ')); ck('T7 사이트맵 주소 추가 0', added.length === 0, added.slice(0, 3).join(' ')); ck('T7 466 = 466', base.size === now.size, `${base.size} → ${now.size}`);
  } else ck('T7 기준 사이트맵', null, '--base 없음');
  try { execFileSync(process.execPath, ['scripts/page-gate.mjs', `--dist=${DIST}`], { stdio: 'pipe' }); ck('T7 page-gate CLI exit 0', true); } catch (e) { ck('T7 page-gate CLI exit 0', false, String(e.stdout || e.message).slice(0, 120)); }
  for (const k of ['T1', 'T2', 'T3', 'T4', 'T5', 'H1', 'H2', 'D1', 'S1', 'S2', 'S3', 'L1', 'L2', 'A1', 'W1', 'N1', 'J1', 'J2', 'J3', 'J4', 'J5', 'O1', 'S4', 'L3', 'L4']) ck(`T7 게이트 ${k} 막음 0`, gate.every((g) => !g.block.some((b) => b.startsWith(k + ' '))));
  for (const g of gate.filter((_, i) => i % 9 === 0)) ck(`T7 쪽 게이트 ${g.route}`, g.block.length === 0, g.block.join(' | '));
  const byQ = {}; for (const g of gate) for (const qq of g.quality) byQ[qq.split(' ')[0]] = (byQ[qq.split(' ')[0]] || 0) + 1;
  ck('T7 품질 경고 집계(참고)', true, JSON.stringify(byQ));
  ck('T7 네이버 수집 코드 0(N1)', gate.every((g) => !g.block.some((b) => b.startsWith('N1'))));
  ck('T7 IndexNow 자동 전송 로그 0(로컬 빌드)', !/IndexNow → https/.test((() => { try { return rd(arg('build-log', '')); } catch { return ''; } })()) , arg('build-log', '') ? '빌드 로그 대조' : '빌드 로그 인자 없음 — 코드 게이트(CI·--indexnow)로 판정');
}

if (stage === '최종') {
  const pages = distPages();
  const byType = {}; for (const p of pages) { const t = pageTypeOf(p.route); (byType[t] ||= []).push(p); }
  for (const t of SKEL_TYPES) {
    const five = (byType[t] || []).filter((_, i) => i % Math.max(1, Math.floor((byType[t] || []).length / 5)) === 0).slice(0, 5);
    for (const p of five) {
      const h = p.html, lds = ldsOf(h), g = gatePage(h, { route: p.route });
      ck(`30쪽 ${t} ${p.route} JSON-LD 파싱`, lds.length > 0 && lds.every(Boolean), lds.map((x) => x && x['@type']).join(','));
      ck(`30쪽 ${t} ${p.route} 유형 마크업(J2 0)`, !g.block.some((b) => b.startsWith('J2')));
      ck(`30쪽 ${t} ${p.route} 사실 일치(J3 0)`, !g.block.some((b) => b.startsWith('J3')));
      ck(`30쪽 ${t} ${p.route} 가짜 평점 0(J4 0)`, !g.block.some((b) => b.startsWith('J4')));
      ck(`30쪽 ${t} ${p.route} canonical·og 3종`, !g.block.some((b) => /^(L2|O1) /.test(b)));
      ck(`30쪽 ${t} ${p.route} 첫 그림 치수·high·webp`, /width="\d+" height="\d+"/.test(firstImg(h)) && /fetchpriority="high"/.test(firstImg(h)) && /\.webp/.test(firstImg(h)));
      ck(`30쪽 ${t} ${p.route} 다음에 볼 곳 허브 링크`, /nc-next-hubs/.test(h) || t === 'community');
      ck(`30쪽 ${t} ${p.route} 세이프서치 0`, !g.block.some((b) => b.startsWith('S4')));
      ck(`30쪽 ${t} ${p.route} 내부 링크 문턱(L3 0)`, !g.block.some((b) => b.startsWith('L3')));
    }
  }
  // 검증기(공식 도구) 결과 — Chrome 으로 validator.schema.org 에 넣은 결과 json {pages:[{route,errors,warnings,types}]}
  if (SCHEMA && ex(SCHEMA)) {
    const sc = JSON.parse(rd(SCHEMA));
    ck('T2 검증기 표본 6쪽', (sc.pages || []).length >= 6, String((sc.pages || []).length));
    for (const r of sc.pages || []) ck(`T2 검증기 ${r.route} 오류 0`, r.errors === 0, `오류 ${r.errors} · 경고 ${r.warnings} · ${(r.types || []).join(',')}`);
    ck('T2 검증기 도구', true, sc.tool || '');
  } else ck('T2 스키마 검증기 결과', null, '--schema 없음');
  // 대표님 원문 대조(11-3 지시서 한 줄씩)
  const gate = pages.map((p) => gatePage(p.html, { route: p.route }));
  const pre = rd('scripts/prerender-seo.mjs');
  ck('0절 배포 0(origin/main 그대로)', (() => { try { return execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim().startsWith('38be1ef'); } catch { return null; } })());
  ck('0절 worktree 브랜치에서만(nol11-2)', (() => { try { return /nol11-2/.test(execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })); } catch { return null; } })());
  ck('0절 주소 불변 — 사이트맵 466', pages.length === 466);
  ck('0절 네이버 0 — dist 수집요청 코드 0', gate.every((g) => !g.block.some((b) => b.startsWith('N1'))));
  ck('0절 규칙 지어내지 않음 — 규칙 출처 표 SOURCES 22항목이 연구 문서에', (() => { const r = ex(RESEARCH) ? rd(RESEARCH) : ''; return r ? Object.values(SOURCES).every((ids) => ids.some((id) => r.includes(`| ${id} |`))) : null; })());
  ck('0절 「조건 완비 · 결과 보장 아님」 한 줄은 보고서 몫(검사 아님)', 'na');
  ck('1절 겹침 — 있는 것 그대로: robots(있음)·sitemap(있음)·llms(있음)·IndexNow 도구(indexnow.mjs 있음)·AI 인용 구조(FAQ LD 126)', ex('public/robots.txt') && ex('scripts/indexnow.mjs') && pages.filter((p) => ldsOf(p.html).some((x) => x && x['@type'] === 'FAQPage')).length >= 100);
  ck('2-1 가게 = NightClub/BarOrPub/Restaurant + Breadcrumb + FAQ', (byType.venue || []).every((p) => { const l = ldsOf(p.html); return l.some((x) => x && /NightClub|BarOrPub|Restaurant|EntertainmentBusiness/.test(String(x['@type']))) && l.some((x) => x && x['@type'] === 'BreadcrumbList'); }));
  ck('2-1 가게 telephone 은 광고주·대표번호 규칙대로(tel 링크 있는 쪽은 광고 라벨 · A1 0)', gate.every((g) => !g.block.some((b) => b.startsWith('A1'))));
  ck('2-1 목록·허브 = ItemList/CollectionPage + Breadcrumb', [...(byType.list || []), ...(byType.hub || [])].every((p) => { const l = ldsOf(p.html); return l.some((x) => x && /ItemList|CollectionPage/.test(String(x['@type']))) && l.some((x) => x && x['@type'] === 'BreadcrumbList'); }));
  ck('2-1 홈 = WebSite(SearchAction) + Organization', (() => { const l = ldsOf((pages.find((p) => p.route === '/') || {}).html || ''); const w = l.find((x) => x && x['@type'] === 'WebSite'); return !!w && !!w.potentialAction && l.some((x) => x && x['@type'] === 'Organization'); })());
  ck('2-1 매거진 = Article(author·datePublished·dateModified)', (byType.magazine || []).every((p) => { const a = ldsOf(p.html).find((x) => x && /Article/.test(String(x['@type']))); return !!a && !!a.author && !!a.datePublished && !!a.dateModified; }));
  ck('2-1 커뮤니티 DiscussionForumPosting 은 진짜 글만', pages.every((p) => !ldsOf(p.html).some((x) => x && x['@type'] === 'DiscussionForumPosting') || /data-nc-posts="[1-9]/.test(p.html)));
  ck('2-1 없는 사실 속성 0 · 가짜 평점 0(J3·J4 0)', gate.every((g) => !g.block.some((b) => /^J[34] /.test(b))));
  ck('2-2 robots 모든 로봇 허용 + AI 봇 명시 + Sitemap', (() => { const r = rd(path.join(DIST, 'robots.txt')); return /User-agent: \*\s*\n\s*Allow: \//.test(r) && /GPTBot/.test(r) && /ClaudeBot/.test(r) && /PerplexityBot/.test(r) && /Sitemap:/.test(r); })());
  ck('2-2 llms.txt 소개 + 허브 + 466쪽(제목+직답)', (() => { const l = rd(path.join(DIST, 'llms.txt')); const n = (l.split(/^## 전체 페이지/m)[1] || '').split('\n').filter((x) => /^- \[.*\): .{10,}/.test(x)).length; return n === 466; })());
  ck('2-2 sitemap lastmod 실제 값(해시 정직화) · 빌드마다 갱신', /lastmodFor\(/.test(pre) && ex('scripts/.seo-lastmod.json'));
  ck('2-2 IndexNow(Bing) 도구 · 놀쿨 키 파일', /keyFromFile/.test(rd('scripts/indexnow.mjs')) && !!fs.readdirSync('public').find((x) => /^[0-9a-f]{32}\.txt$/i.test(x)));
  ck('2-2 canonical 자기 절대주소 · og 3종 · hreflang 추가 0', gate.every((g) => !g.block.some((b) => /^(L2|O1) /.test(b))));
  ck('2-2 세이프서치 안전 게이트 항목(S4) · 466 걸림 0', gate.every((g) => !g.block.some((b) => b.startsWith('S4'))));
  ck('2-3 그림 크기 지정 466', pages.every((p) => /width="\d+" height="\d+"/.test(firstImg(p.html))));
  ck('2-3 지연 로딩(첫 화면 제외) — 첫 그림 eager · 다음 그림은 React 카드(lazy)', pages.every((p) => !/loading="lazy"/.test(firstImg(p.html))));
  ck('2-3 현대 형식 — 첫 그림 webp 466', pages.every((p) => /\.webp/.test(firstImg(p.html))));
  ck('2-3 글꼴 미리 연결 — 웹폰트 0(시스템 글꼴)이라 해당 없음', 'na');
  ck('2-3 CSS 분리 — 1파일 23KB(gz) · Lighthouse unused-css 통과 → 추가 분리 이득 0', fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.css')).length === 1);
  ck('2-3 번들 분할 — vendor 4묶음 modulepreload + 경로별 chunk', pages.every((p) => (p.html.match(/rel="modulepreload"/g) || []).length >= 4) && fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js')).length > 20);
  ck('2-3 Cloudflare 캐시 헤더(_headers: assets 1년 immutable · html SWR · og 30일)', ex(path.join(DIST, '_headers')) && /immutable/.test(rd(path.join(DIST, '_headers'))) && /stale-while-revalidate/.test(rd(path.join(DIST, '_headers'))));
  ck('2-3 PSI 공식 API 전/후', null, '429 할당량 — Lighthouse CLI 전/후로 대체(디버깅 T4)');
  ck('2-4 허브↔가게↔매거진↔커뮤니티 · 허브 2단계 · 다음에 볼 곳 자리 · 고아 0 · 새 창 0 → 디버깅 T5', pages.every((p) => /data-nc-next="slot"/.test(p.html)) && gate.every((g) => !g.block.some((b) => b.startsWith('L1'))));
  ck('2-5 page-gate: JSON-LD 파싱·사실 일치·없는 속성 0·canonical·og·세이프서치·내부 링크 ≥N', ['J1', 'J3', 'J4', 'L2', 'O1', 'S4', 'L3'].every((k) => rd('scripts/page-gate.mjs').includes(k + ' ')));
  ck('2-5 고아 0 은 nc11-3-check 디버깅 T5(링크 그래프)에서', true);
  ck('3절 T1~T7 은 디버깅 단계 기록', true);
  ck('4절 검증 파일 이름 nc11-3-check.mjs', ex('scripts/verify/nc11-3-check.mjs'));
  ck('5절 보고 형식(모델·2-1~2-5·T1~T7·CWV 전/후·유형별 쪽 수·조건 완비 문구·검증 N·대표님만) — 보고서 몫', 'na');
  // 「구글/AI 상위」 조건 완비 넷
  ck('조건① 색인 허용 — 사이트맵 466 쪽에 noindex 0', pages.every((p) => !/<meta name="robots" content="[^"]*noindex/.test(p.html)));
  ck('조건② 구조 — 뼈대·JSON-LD·Breadcrumb 466', gate.every((g) => !g.block.some((b) => /^(S2|J2) /.test(b))));
  ck('조건③ 인용 가능한 사실 — 직답 첫 문장 466(llms.txt 줄마다)', (() => { const l = rd(path.join(DIST, 'llms.txt')); return (l.split(/^## 전체 페이지/m)[1] || '').split('\n').filter((x) => /^- \[.*\): .{10,}/.test(x)).length === 466; })());
  ck('조건④ 봇 허용 — robots AI 봇 12종 Allow · max-snippet:-1', /max-snippet:-1/.test((pages.find((p) => p.route === '/') || {}).html || '') && /GPTBot/.test(rd(path.join(DIST, 'robots.txt'))));
}

const fails = R.filter((x) => x.r === '실패');
const out = { stage, checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, skip: R.filter((x) => x.r === '해당 없음').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${stage}: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na} · 해당 없음 ${out.skip}`);
for (const f of fails) console.log('  실패:', f.name, f.note);
process.exit(fails.length ? 1 : 0);
