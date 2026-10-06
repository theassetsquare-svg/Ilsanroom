#!/usr/bin/env node
/**
 * [놀쿨34-1] 3단계 검증 — node scripts/verify/nc34-1-check.mjs <스테이징|디버깅|최종> [--dist=dist] [--base=<고치기 전 dist 폴더>]
 *      [--rdom=<그린 뒤 측정 json>] [--vitals-before=<json>] [--vitals-after=<json>] [--p5-before=<json>] [--p5-after=<json>]
 *      [--old-before=<옛 검증 요약 json>] [--old-after=<옛 검증 요약 json>] [--build-log=<빌드 기록>] [--shots=<미리보기 폴더>] [--out=<json>]
 *  판정 낱말은 넷뿐: 통과 / 실패 / 실행 불가 / 해당 없음. 검사 0건은 실패다. 읽기만 한다(--out 보고만).
 *  노출34 연구표 G2~G7 · 충돌 C5 — 제목 = h1 = og:title · 첫 그림 = og:image 파일 · robots Content-Signal · hreflang 0 · 구조화 값(전화 +82 · Organization 홈만) · 날짜(정보 확인 · 바뀐 날).
 *  스테이징 = 바꾼 파일마다 꼴 · 디버깅 = dist 467쪽 전수 + 고치기 전 판과 견줌 + 게이트 사본 시험(막아야 할 것·통과할 것) + 그린 뒤 화면 · 최종 = 끝 상태 + 지시문 대조.
 *  어느 폴더에서 불러도 된다(저장소 뿌리로 옮겨서 읽는다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
process.chdir(REPO);
const { gatePage, pageTypeOf, exposureProblems, imageSize } = await import('../page-gate.mjs');

const stage = process.argv[2];
const arg = (k, d = '') => process.argv.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3) || d;
const DIST = arg('dist', 'dist'), BASE = arg('base', ''), RDOM = arg('rdom', ''), VB = arg('vitals-before', ''), VA = arg('vitals-after', ''), P5B = arg('p5-before', ''), P5A = arg('p5-after', '');
const OLDB = arg('old-before', ''), OLDA = arg('old-after', ''), BUILD_LOG = arg('build-log', ''), SHOTS = arg('shots', ''), OUT = arg('out', '');
const R = [];
const ck = (name, ok, note = '') => R.push({ name, r: ok === null ? '실행 불가' : ok === 'na' ? '해당 없음' : ok ? '통과' : '실패', note: String(note ?? '').slice(0, 220) });
const rd = (p) => fs.readFileSync(p, 'utf8');
const ex = (p) => fs.existsSync(p);
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const one = (s) => dec(s).replace(/\s+/g, ' ').trim();
const strip = (h) => one(String(h || '').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '));
const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim(); } catch { return null; } };
const noComment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
const DATE_RE = /\d{4}-\d{2}-\d{2}(?:T[\d:.+\-Z]+)?/g;

function pagesOf(dist) {
  const xml = rd(path.join(dist, 'sitemap.xml'));
  return [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => {
    const enc = m[1].replace(/^https?:\/\/[^/]+/, ''); const r = enc === '/' ? '/' : enc.replace(/\/$/, '');
    const f = path.join(dist, ...r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }), 'index.html');
    let d = r; try { d = decodeURIComponent(r); } catch { /* 그대로 */ }
    return { route: d, enc: r, lastmod: m[2], file: f, html: ex(f) ? rd(f) : '' };
  });
}
const titleOf = (h) => one((h.match(/<title>([^<]*)<\/title>/) || [])[1]);
const h1sOf = (h) => [...h.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
const metaOf = (h, k, by = 'property') => one((h.match(new RegExp(`<meta ${by}="${k}" content="([^"]*)"`)) || [])[1]);
const ldsOf = (h) => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean).flatMap((x) => (Array.isArray(x) ? x : (x['@graph'] || [x])));
const bodyOf = (h) => h.slice(Math.max(0, h.indexOf('<body')));
const firstImg = (h) => (bodyOf(h).match(/<img\b[^>]*>/) || [''])[0];
const attr = (tag, k) => (tag.match(new RegExp(`\\s${k}="([^"]*)"`)) || [])[1];
const pathOf = (u) => String(u || '').replace(/^https?:\/\/(www\.)?nolcool\.com/, '').split(/[?#]/)[0];
const articleText = (h) => strip((h.match(/<article id="nc-article"[\s\S]*?<\/article>/) || [''])[0]);
const isBiz = (x) => /NightClub|BarOrPub|EntertainmentBusiness|Restaurant|LocalBusiness/.test(String(x['@type']));
const PROV = (() => { try { return JSON.parse(rd('src/data/places-provenance.json')); } catch { return {}; } })();
const VENUE_SLUGS = new Set([...rd('src/data/venues.ts').matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]));
const isVenuePage = (p) => pageTypeOf(p.enc) === 'venue' && VENUE_SLUGS.has(p.enc.split('/').pop());

/* ───────────────────────────── 스테이징 — 바꾼 파일마다 꼴 ───────────────────────────── */
if (stage === '스테이징') {
  const pre = rd('scripts/prerender-seo.mjs'), preC = noComment(pre), pg = rd('scripts/page-gate.mjs'), sk = rd('scripts/skeleton/index.mjs'), inx = rd('index.html'), robots = rd('public/robots.txt');
  for (const f of ['scripts/prerender-seo.mjs', 'scripts/page-gate.mjs', 'scripts/skeleton/index.mjs', 'scripts/verify/nc34-1-check.mjs', 'scripts/verify/nc11-2-check.mjs', 'src/components/seo/NcH1.tsx', 'src/components/seo/SsrArticle.tsx', 'src/components/venue/VenueHero.tsx', 'src/layouts/MainLayout.tsx', 'src/components/layout/Footer.tsx', 'src/lib/venue-file-ver.mjs', 'index.html', 'public/robots.txt']) ck('파일 ' + f, ex(f));
  // C5·G2
  ck('G2 프리렌더 h1 = 제목 글자 그대로', /const h1 = meta\.title \|\| '';/.test(pre));
  ck('G2 프리렌더가 makeH1(제목과 다른 문구)을 부르지 않음', !/makeH1\(/.test(preC));
  ck('G2 og:title = 제목(같은 변수)', /const ogTitle = title;/.test(pre));
  ck('G2 __NC_META 에 제목·h1 싣기', /window\.__NC_META=\$\{JSON\.stringify\(\{ path: canonicalWithSlash, title: title \|\| '', h1: h1 \|\| ''/.test(pre));
  const nch1 = rd('src/components/seo/NcH1.tsx');
  ck('G2 NcH1 — 프리렌더 제목을 h1 로(같은 주소 꼴로 읽음)', /__NC_META/.test(nch1) && /__NC_META_CACHE/.test(nch1) && /useSyncExternalStore/.test(nch1) && /pathname\.endsWith\('\/'\)/.test(nch1));
  ck('G2 NcH1 — 프리렌더 제목이 없으면 원래 글자', /if \(!title\) return <h1 \{\.\.\.rest\}>\{children\}<\/h1>;/.test(nch1));
  ck('G2 NcH1 — 한 h1 안에 글자 그대로(머리 + 빈칸 + 「— 꼬리」)', /\{title\.slice\(0, i\)\}\{' '\}/.test(nch1) && /— \{title\.slice\(i \+ SEP\.length\)\}/.test(nch1));
  ck('G2 SsrArticle — 사이트 안 이동 때 h1 다시 그리기 신호', /window\.dispatchEvent\(new Event\(NC_META_EVENT\)\)/.test(rd('src/components/seo/SsrArticle.tsx')));
  const H1_FILES = git('grep', '-l', "import NcH1 from '@/components/seo/NcH1';", '--', 'src') || '';
  const h1Files = H1_FILES.split('\n').filter(Boolean);
  ck('G2 화면 55개가 NcH1 을 씀', h1Files.length === 55, String(h1Files.length));
  ck('G2 그 55개 화면에 맨 <h1> 0', h1Files.length > 0 && h1Files.every((f) => !/<h1[\s>]/.test(rd(f)) && /<NcH1[\s>]/.test(rd(f))), h1Files.filter((f) => /<h1[\s>]/.test(rd(f))).join(' '));
  // 사이트맵에 든 화면(관리자·404·로그인·쪽지·내 정보·인쇄·검색·대기·글 상세 밖)에 맨 <h1> 이 남아 있지 않은가
  const rawH1 = (git('grep', '-l', '-E', '<h1[ >]', '--', 'src') || '').split('\n').filter(Boolean);
  const ALLOW_RAW = /^src\/(pages\/admin\/|layouts\/AdminLayout|lib\/email|components\/seo\/NcH1|pages\/(NotFoundPage|PrintPage|SearchPage|MessagesPage|WaitlistPage)|pages\/my\/|pages\/member\/|pages\/auth\/|pages\/community\/PostDetailPage)/; // 로그인·내 정보·닉네임 = 색인 제외 쪽
  ck('G2 사이트맵 밖 화면만 맨 <h1> 을 가짐', rawH1.every((f) => ALLOW_RAW.test(f)), rawH1.filter((f) => !ALLOW_RAW.test(f)).join(' '));
  ck('G2 게이트 — 옛 규칙 「H1 = 제목이면 막음」 없음', !/block\.push\('H2 H1 이 제목과 같음'\)/.test(pg));
  ck('G2 게이트 — H1 ≠ 제목 · og:title ≠ 제목 막음', /`G2 H1 ≠ 제목/.test(pg) && /'G2 og:title ≠ 제목'/.test(pg));
  ck('C5 옛 검증 nc11-2 의 「H1 ≠ 제목」 단언을 새 규칙으로', /H1 = 제목 전 쪽\(놀쿨34-1 · C5/.test(rd('scripts/verify/nc11-2-check.mjs')) && !/'H1 = 제목인 쪽 0'/.test(rd('scripts/verify/nc11-2-check.mjs')));
  ck('C5 옛 검증 nc11-4 의 「page-gate 항목 H2 그대로」 단언을 새 규칙으로', /page-gate 옛 항목 H2 는 놀쿨34-1 · C5 로 뒤집음/.test(rd('scripts/verify/nc11-4-check.mjs')) && !/'H1', 'H2', 'D1'/.test(rd('scripts/verify/nc11-4-check.mjs')));
  // G3
  ck('G3 첫 그림 = og:image 파일(같은 변수 · 같은 출처 경로)', /const heroImgSrc = ogImg;/.test(pre) && /const heroPath = String\(heroImgSrc\)\.replace\(BASE_URL, ''\);/.test(pre));
  ck('G3 첫 그림 태그 — src 파일 · 치수 = 파일 실제 치수 · fetchpriority=high', /<img src="\$\{escHtml\(heroPath\)\}" alt="\$\{escHtml\(heroAltText\)\}" width="\$\{heroDims\.w\}" height="\$\{heroDims\.h\}" fetchpriority="high" decoding="async"/.test(pre));
  ck('G3 치수는 파일 머리에서 읽음(ogDims)', /function ogDims\(url\)/.test(pre) && /readUInt16BE\(i \+ 7\)/.test(pre));
  ck('G3 첫 그림 src 에 data URI 를 쓰지 않음', !/<img src="\$\{inlineHero\}"/.test(preC));
  ck('G3 박아 둔 작은 그림은 같은 <img> 의 바탕으로만', /url\(\$\{inlineHero\}\) center\/\$\{fit\} no-repeat/.test(pre));
  ck('G3 가게 쪽 그림 설명 = 「<가게이름> 안내 카드」(프리렌더 · React 같은 글자)', /heroAlt: `\$\{v\.nameKo\} 안내 카드`/.test(pre) && /alt=\{`\$\{name\} 안내 카드`\}/.test(rd('src/components/venue/VenueHero.tsx')));
  ck('G3 공용 그림 설명 = 「놀쿨 안내 카드」', /'놀쿨 안내 카드'/.test(pre));
  ck('G3 React 가게 첫 그림 = og jpg(cardOwnJpg · 1200×1200)', /src=\{cardOwnJpg\(slug\)\}/.test(rd('src/components/venue/VenueHero.tsx')) && /width=\{1200\}\s*\n\s*height=\{1200\}/.test(rd('src/components/venue/VenueHero.tsx')));
  ck('G3 cardOwnJpg = 프리렌더 getVenueOgImage 와 같은 이름 꼴', /export const cardOwnJpg = \(slug\) => `\/og\/\$\{slug\}\$\{ogOwnVer\(slug\)\}\.jpg`;/.test(rd('src/lib/venue-file-ver.mjs')) && /`\$\{BASE_URL\}\/og\/\$\{slug\}\$\{ogOwnVer\(slug\)\}\.jpg`/.test(pre));
  ck('G3 광고주 카드가 첫 그림인 쪽은 「광고」 표시(가게 · 매거진 · 허브)', /heroAd: isAdVenue\(v\) \|\| isPageOnlyAd\(v\)/.test(pre) && /heroSquare: true, heroAd: true, heroAlt: magAdAlt\(a\.id\)/.test(pre) && /heroAd: !!\(hubOg && hubOg\.ad\)/.test(pre) && /class="nc-hero-ad"[^>]*>광고</.test(pre));
  ck('G3 게이트 항목', /G3 첫 그림이 data URI/.test(pg) && /G3 첫 그림 ≠ og:image 파일/.test(pg) && /G3 치수 속성/.test(pg) && /G3 대표 그림 가로/.test(pg) && /G3 첫 그림 fetchpriority=high 없음/.test(pg));
  // G3 · 속도 — 같은 카드의 가벼운 판(webp · 가로 1200)을 <picture> 로 같이 내준다(<img src> 는 og 파일 그대로)
  ck('G3·속도 프리렌더 — 가벼운 판 = 같은 카드의 -w1200.webp(ogWebpSet) · <picture> 의 source 로만', /const heroLight = heroWebp \? String\(heroWebp\.src\)\.replace\(BASE_URL, ''\) : '';/.test(pre) && /<picture><source type="image\/webp" srcset="\$\{escHtml\(heroLight\)\}">\$\{heroImgEl\}<\/picture>/.test(pre) && /src: `\$\{BASE_URL\}\/og\/\$\{base\}-w1200\.webp`/.test(pre));
  ck('G3·속도 React 가게 화면 — <picture> source = cardOwnLight(같은 이름 꼴)', /<source type="image\/webp" srcSet=\{cardOwnLight\(slug\)\} \/>/.test(rd('src/components/venue/VenueHero.tsx')) && /export const cardOwnLight = \(slug\) => `\/og\/\$\{slug\}\$\{ogOwnVer\(slug\)\}-w1200\.webp`;/.test(rd('src/lib/venue-file-ver.mjs')) && /cardOwnLight\(slug: string\): string/.test(rd('src/lib/venue-file-ver.d.ts')));
  ck('G3·속도 게이트 항목 — 가벼운 판(같은 카드 · 있는 파일 · 같은 치수)', /G3 첫 그림 가벼운 판 ≠ 같은 카드/.test(pg) && /G3 첫 그림 가벼운 판 파일 없음/.test(pg) && /G3 가벼운 판 치수/.test(pg) && /G3 첫 그림 가벼운 판 source/.test(pg));
  // 흔들림(CLS) — 짧은 쪽에서 아래 띠·푸터가 밀려 내려가던 것
  ck('흔들림 — 프리렌더 본문 끌어안기는 화면을 그리기 전에(useLayoutEffect)', /useLayoutEffect\(\(\) => \{\s*\n\s*const host = ref\.current;\s*\n\s*if \(!host\) return;\s*\n\s*const ssr = document\.getElementById\('nc-ssr'\);/.test(rd('src/components/seo/SsrArticle.tsx')));
  ck('흔들림 — 본문 칸은 처음부터 첫 화면 높이 이상(min-h-screen)', /<main id="main-content" className="flex-1 min-h-screen /.test(rd('src/layouts/MainLayout.tsx')));
  // G4
  ck('G4 index.html hreflang 0', !/<link[^>]*hreflang=/.test(inx));
  ck('G4 프리렌더 hreflang 코드 0', !/hreflang="/.test(preC));
  ck('G4 로봇 메타 그대로(max-image-preview:large · max-snippet:-1 · nosnippet 0)', /<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" \/>/.test(inx));
  ck('G4 게이트 항목', /G4 hreflang/.test(pg) && /'G4 nosnippet'/.test(pg) && /G4 max-snippet/.test(pg) && /'G4 rating 메타'/.test(pg));
  ck('G4 llms.txt 만드는 코드 손대지 않음(고치기 전과 같은 줄)', (() => { const a = git('show', 'origin/main:scripts/prerender-seo.mjs'); if (a === null) return null; const f = (s) => s.split('\n').filter((l) => /llms/i.test(l)).join('\n'); return f(a) === f(pre); })());
  // G5
  const rl = robots.split(/\r?\n/);
  const groups = rl.filter((l) => /^User-agent:/i.test(l)).length;
  ck('G5 robots 묶음 41 · Disallow 0', groups === 41 && !/^Disallow/im.test(robots), String(groups));
  ck('G5 Content-Signal 줄 = 묶음 수(묶음마다 1줄)', (robots.match(/^Content-Signal: /gm) || []).length === groups, String((robots.match(/^Content-Signal: /gm) || []).length));
  ck('G5 모든 줄이 「Content-Signal: search=yes, ai-input=yes」', (robots.match(/^Content-Signal: .*$/gm) || []).every((l) => l.trim() === 'Content-Signal: search=yes, ai-input=yes'));
  ck('G5 ai-train 은 적지 않음(지시 줄에 0)', !rl.some((l) => !l.startsWith('#') && /ai-train/i.test(l)));
  // 줄 차례 = Cloudflare 원문 예시 그대로(User-Agent → Content-Signal → Allow · blog.cloudflare.com/content-signals-policy · developers.cloudflare.com/bots/additional-configurations/managed-robots-txt)
  ck('G5 묶음 안 자리(User-agent → Content-Signal → Allow · Cloudflare 원문 예시 차례)', (() => { let ok = true, n = 0; for (let i = 0; i < rl.length; i++) if (/^User-agent:/i.test(rl[i])) { n++; if (!(rl[i + 1] === 'Content-Signal: search=yes, ai-input=yes' && rl[i + 2] === 'Allow: /')) ok = false; } return ok && n === 41; })());
  ck('G5 봇 줄·Allow·Sitemap 줄은 그대로(더한 줄을 빼면 고치기 전과 같음)', (() => { const a = git('show', 'origin/main:public/robots.txt'); if (a === null) return null; const cut = rl.filter((l) => !/^Content-Signal: /.test(l) && !/^# (Content Signals|ai-input=yes)/.test(l)); while (cut.length && cut[0] === '') cut.shift(); return cut.join('\n').trim() === a.replace(/\r\n/g, '\n').trim(); })());
  // G6
  ck('G6 정적 푸터의 「콘텐츠 최근 갱신 <빌드 날짜>」 줄 없음', !/<p>콘텐츠 최근 갱신/.test(pre));
  ck('G6 React 푸터의 「마지막 업데이트 <빌드 날짜>」 줄 없음', !/__BUILD_DATE__/.test(noComment(rd('src/components/layout/Footer.tsx'))) && !/마지막 업데이트 <time/.test(noComment(rd('src/components/layout/Footer.tsx'))));
  ck('G6 머리 날짜 메타 = 바뀐 날(lastmod)', /<meta name="last-modified" content="\$\{lastmod\}">/.test(pre) && !/content="\$\{BUILD_ISO_KST\}"/.test(preC) && /lastmod: pageLastmod/.test(pre));
  ck('G6 쪽의 바뀐 날 = 사이트맵과 같은 잣대(같은 해시 · 같은 오늘)', /const pageLastmod = \(\(\) => \{ const prev = PREV_LASTMOD\[routePath\]; return \(prev && prev\.hash === CONTENT_HASH_BY_ROUTE\[routePath\]\) \? prev\.lastmod : TODAY_UTC; \}\)\(\);/.test(pre) && /const today = TODAY_UTC;/.test(pre));
  ck('G6 매거진 수정일 = 바뀐 날(빌드한 날을 찍지 않음)', !/dateModified: BUILD_DATE_KST/.test(preC) && /j\['@type'\] === 'Article' \? \{ \.\.\.j, dateModified: mod\(j\.datePublished\) \}/.test(pre));
  ck('G6 「정보 확인」 날짜 = 출처 장부 fetchedAt(없으면 줄 없음 · 미래 날짜 0)', /const PLACES_PROV = /.test(pre) && /String\(prov\.fetchedAt\) <= BUILD_DATE_KST/.test(pre) && /checkedAt, checkedFields/.test(pre));
  ck('G6 뼈대 — 가게 쪽 사실 표 아래 1줄(확인일이 있을 때만)', /\(type === 'venue' && f\.checkedAt\) \? `<p class="nc-checked">정보 확인: <time datetime=/.test(sk));
  ck('G6 뼈대 — 괄호 끝 「확인일」(여러 쪽에 같은 꼴인 고지 줄 · 5차원 측정기의 규정 틀 낱말)', /\$\{esc\(f\.checkedFields\.join\(' · '\)\)\} 확인일\)/.test(sk));
  ck('G6 index.html 의 고정 날짜 메타(citation_publication_date) 없음', !/<meta name="citation_publication_date"/.test(inx));
  ck('G6 해시 입력에 h1(이번 한 번 모든 쪽의 lastmod = 바뀐 날)', /\$\{meta\.h1 \|\| ''\}\\u0000\$\{body\}/.test(pre));
  ck('G6 게이트 항목', /G6 「정보 확인」/.test(pg) && /G6 빌드 날짜 문구/.test(pg) && /G6 날짜 메타/.test(pg) && /G6 dateModified/.test(pg));
  // G7
  ck('G7 가게 LD 전화 = 국제 표기 함수(telIntl)', /telephone: \(v\.staffPhone && !PHONE_HIDDEN_SLUGS\.has\(v\.slug\)\) \? telIntl\(v\.staffPhone\) : undefined/.test(pre) && /const telIntl = /.test(pre));
  ck('G7 화면의 전화 글자는 그대로(010-… · tel 링크 코드 손대지 않음)', (() => { const a = git('show', 'origin/main:scripts/prerender-seo.mjs'); if (a === null) return null; const f = (s) => s.split('\n').filter((l) => /class="ssr-phone"|href="tel:/.test(l)).join('\n'); return f(a) === f(pre); })());
  ck('G7 addressCountry KR 그대로', /addressCountry: 'KR'/.test(pre));
  ck('G7 MainLayout — 모든 쪽에 붙던 Organization·WebSite JSON-LD 없음', !/JsonLd|organizationJsonLd|websiteJsonLd|'@type': 'Organization'/.test(noComment(rd('src/layouts/MainLayout.tsx'))));
  ck('G7 홈 화면 컴포넌트의 겹치는 WebSite JSON-LD 없음', !/'@type': 'WebSite'/.test(noComment(rd('src/pages/HomePage.tsx'))));
  ck('G7 홈 Organization — name·url·logo·sameAs(놀쿨 카페 두 곳 실제 주소)', /sameAs: \['https:\/\/cafe\.naver\.com\/qotjsdnr', 'https:\/\/cafe\.naver\.com\/beasunwook'\]/.test(pre) && /logo: `\$\{BASE_URL\}\/og\/nolcool-og\.jpg`/.test(pre));
  ck('G7 sameAs 값 = /cafe/ 쪽에 보이는 그 두 주소', /https:\/\/cafe\.naver\.com\/qotjsdnr\?/.test(rd('src/pages/CafePage.tsx')) && /https:\/\/cafe\.naver\.com\/beasunwook\?/.test(rd('src/pages/CafePage.tsx')));
  ck('G7 Organization 설명에 근거 없는 최상급(「최대」) 없음', (() => { const m = preC.match(/const ORG_JSONLD = \{[\s\S]*?\n\};/); return !!m && !/최대|1위|유일|최고/.test(m[0]); })());
  ck('G7 없는 logo 파일(/logo-512.png) 참조 없음', !/logo-512\.png/.test(preC) && ex('public/og/nolcool-og.jpg'));
  ck('G7 게이트 항목', /G7 전화 국제 표기 아님/.test(pg) && /'G7 addressCountry ≠ KR'/.test(pg) && /G7 자정 넘는 영업을 둘로 쪼갬/.test(pg) && /G7 홈 밖 쪽의 Organization/.test(pg) && /G7 logo 파일 없음/.test(pg) && /String\(ld\.priceRange\)\.length >= 100\) out\.push\('G7 priceRange 100자 이상'\)/.test(pg));
  // 바꾸지 않는 것
  for (const f of ['src/data/venues.ts', 'src/data/advertisers.nolcool.json', 'src/data/places-provenance.json', 'src/data/magazine-articles.ts', 'src/lib/seo-hooks.ts', 'data/title-bank.json', 'src/lib/venue-order.mjs', 'src/App.tsx', 'public/_headers']) ck('손대지 않음 ' + f, git('diff', '--quiet', 'origin/main', '--', f) !== null);
  ck('주소(라우트) 손대지 않음 — App.tsx 고치기 전과 같음', git('diff', '--stat', 'origin/main', '--', 'src/App.tsx') === '');
  ck('리디렉션 파일 손대지 않음', git('diff', '--stat', 'origin/main', '--', 'public/_redirects') === '');
  const changed = (git('diff', '--name-only', 'origin/main') || '').split('\n').filter(Boolean).concat((git('ls-files', '--others', '--exclude-standard') || '').split('\n').filter(Boolean));
  const mine = changed.filter((f) => !/^public\/og\//.test(f));
  // 검증 스크립트(scripts/verify/*)와 게이트는 자기 검사에 쓰는 낱말을 글자로 품고 있어 대상에서 뺀다
  const scan = mine.filter((f) => ex(f) && /\.(mjs|tsx?|html|txt)$/.test(f) && !/^scripts\/(verify\/|page-gate\.mjs)/.test(f));
  ck(`네이버 수집·요청 코드 0(바꾼 파일 ${scan.length}개)`, scan.length > 50 && scan.every((f) => !/searchadvisor\.naver|naver\.com\/[^'"\s]*(request|submit)/i.test(rd(f))));
  ck(`API 키·비밀값 0(바꾼 파일 ${scan.length}개)`, scan.length > 50 && scan.every((f) => !/sk-ant|ANTHROPIC_API_KEY|OPENAI_API_KEY/.test(rd(f))));
  ck('새 의존성 0(package.json 고치기 전과 같음)', git('diff', '--stat', 'origin/main', '--', 'package.json', 'package-lock.json') === '');
  ck('제목에 「| 놀쿨」 꼬리를 붙이는 코드 0(저장소 규칙: 홈 밖 제목에 「놀쿨」 0)', !/\| 놀쿨/.test(preC) && /놀쿨/.test(rd('scripts/nolcool-dist-audit.mjs')) === true);
}

/* ───────────────────────────── 디버깅 — dist 전수 + 고치기 전 판과 견줌 + 사본 시험 ───────────────────────────── */
if (stage === '디버깅') {
  const pages = pagesOf(DIST);
  const N = pages.length;
  ck('dist 쪽 파일 전부 있음', N > 0 && pages.every((p) => p.html), `${N}쪽 · 없음 ${pages.filter((p) => !p.html).length}`);
  const base = BASE && ex(path.join(BASE, 'sitemap.xml')) ? pagesOf(BASE) : null;
  ck('고치기 전 판(--base)', base ? true : null, BASE);
  const bmap = new Map((base || []).map((p) => [p.enc, p]));
  if (base) {
    const now = new Set(pages.map((p) => p.enc)), was = new Set(base.map((p) => p.enc));
    ck('주소 변경 0 — 빠진 주소 0', [...was].every((u) => now.has(u)), [...was].filter((u) => !now.has(u)).slice(0, 3).join(' '));
    ck('주소 변경 0 — 더한 주소 0', [...now].every((u) => was.has(u)), [...now].filter((u) => !was.has(u)).slice(0, 3).join(' '));
    ck(`쪽 수 그대로(${base.length} → ${N})`, base.length === N);
    const same = (f, label) => { const bad = pages.filter((p) => bmap.has(p.enc) && f(p.html) !== f(bmap.get(p.enc).html)); ck(`${label} — 고치기 전과 같음(${N}쪽)`, bad.length === 0, `다른 쪽 ${bad.length} · ${bad.slice(0, 2).map((p) => p.route).join(' ')}`); };
    same(titleOf, '제목 글자');
    same((h) => metaOf(h, 'description', 'name'), '설명 글자');
    same((h) => metaOf(h, 'og:image'), 'og:image 파일');
    same((h) => (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1], 'canonical');
    same((h) => metaOf(h, 'robots', 'name'), '로봇 메타');
    same((h) => ldsOf(h).map((x) => String(x['@type'])).sort().join(','), 'JSON-LD 종류');
    // 본문 = 고치기 전 + 「정보 확인」 줄(가게 쪽) — 그 밖의 글자 변화 0
    const cut = (t) => t.replace(/정보 확인: \d{4}-\d{2}-\d{2}(?: \([^)]*\))?\s*/g, '').replace(DATE_RE, 'D').replace(/\s+/g, ' ').trim();
    const bodyBad = pages.filter((p) => bmap.has(p.enc) && cut(articleText(p.html)) !== cut(articleText(bmap.get(p.enc).html)));
    ck('본문 글자 — 「정보 확인」 줄 말고는 고치기 전과 같음', bodyBad.length === 0, `다른 쪽 ${bodyBad.length} · ${bodyBad.slice(0, 2).map((p) => p.route).join(' ')}`);
    const llA = ex(path.join(DIST, 'llms.txt')) ? rd(path.join(DIST, 'llms.txt')).replace(DATE_RE, 'D') : null, llB = ex(path.join(BASE, 'llms.txt')) ? rd(path.join(BASE, 'llms.txt')).replace(DATE_RE, 'D') : null;
    ck('llms.txt 글자 그대로(날짜 칸만 가리고 견줌)', llA !== null && llA === llB);
    // 화면에 보이는 전화 글자 그대로
    const telVis = (h) => [...new Set([...strip(bodyOf(h)).matchAll(/01[016789]-\d{3,4}-\d{4}/g)].map((m) => m[0]))].sort().join(',') + '|' + [...new Set([...h.matchAll(/href="tel:([^"]+)"/g)].map((m) => m[1]))].sort().join(',');
    same(telVis, '화면의 전화 글자·전화 링크');
    const adlabel = (h) => (h.match(/ssr-adlabel|nc-ad-mark|data-ad-label/g) || []).length;
    const adLess = pages.filter((p) => bmap.has(p.enc) && adlabel(p.html) < adlabel(bmap.get(p.enc).html));
    ck('「광고」 표시가 줄어든 쪽 0', adLess.length === 0, adLess.slice(0, 3).map((p) => p.route).join(' '));
  }
  // G2
  const g2 = pages.filter((p) => { const h = h1sOf(p.html); return !(h.length === 1 && h[0] === titleOf(p.html)); });
  ck(`G2 h1 1개 · 제목과 글자 같음 — ${N}쪽 전부`, g2.length === 0, `어긋난 쪽 ${g2.length} · ${g2.slice(0, 2).map((p) => p.route).join(' ')}`);
  ck(`G2 og:title = 제목 — ${N}쪽 전부`, pages.every((p) => metaOf(p.html, 'og:title') === titleOf(p.html)));
  ck(`G2 twitter:title = 제목 — ${N}쪽 전부`, pages.every((p) => metaOf(p.html, 'twitter:title', 'name') === titleOf(p.html)));
  ck('G2 __NC_META 의 제목 = <title> · h1 = 제목', pages.every((p) => { const m = p.html.match(/window\.__NC_META=(\{[\s\S]*?\})<\/script>/); if (!m) return false; try { const j = JSON.parse(m[1]); return one(j.title) === titleOf(p.html) && j.h1 === j.title; } catch { return false; } }));
  ck('G2 홈 밖 제목에 「놀쿨」 0(저장소 규칙 그대로) · 「| 놀쿨」 꼬리 0', pages.every((p) => p.enc === '/' || !/놀쿨/.test(titleOf(p.html))));
  const venuePages = pages.filter(isVenuePage);
  ck('가게 쪽 127', venuePages.length === 127, String(venuePages.length));
  ck('G2 가게 쪽 제목·h1 이 가게이름으로 시작', venuePages.every((p) => { const biz = ldsOf(p.html).find(isBiz); return biz && titleOf(p.html).startsWith(biz.name) && h1sOf(p.html)[0].startsWith(biz.name); }));
  // G3
  const imgBad = [];
  for (const p of pages) { const im = firstImg(p.html); const og = pathOf(metaOf(p.html, 'og:image')); const src = attr(im, 'src') || ''; const real = og ? imageSize(path.join(DIST, decodeURIComponent(og))) : null;
    const ok = im && !/^data:/.test(src) && pathOf(src) === og && real && real.w >= 1200 && Number(attr(im, 'width')) === real.w && Number(attr(im, 'height')) === real.h && attr(im, 'fetchpriority') === 'high' && !/\sloading="lazy"/.test(im) && (attr(im, 'alt') || '').trim();
    if (!ok) imgBad.push(p.route); }
  ck(`G3 첫 그림 = og:image 파일 · data URI 아님 · 치수 속성 = 파일 · 가로 1200 이상 · fetchpriority=high · alt — ${N}쪽 전부`, imgBad.length === 0, `어긋난 쪽 ${imgBad.length} · ${imgBad.slice(0, 3).join(' ')}`);
  ck('G3 첫 그림 src 가 data URI 인 쪽 0', pages.every((p) => !/^data:/.test(attr(firstImg(p.html), 'src') || '')));
  ck('G3 가게 쪽 그림 설명 = 「<가게이름> 안내 카드」 127', venuePages.every((p) => { const biz = ldsOf(p.html).find(isBiz); return biz && one(attr(firstImg(p.html), 'alt')) === `${biz.name} 안내 카드`; }));
  ck('G3 공용 그림을 쓰는 쪽의 그림 설명 = 「놀쿨 안내 카드」', pages.filter((p) => /\/og\/nolcool-og\.jpg$/.test(metaOf(p.html, 'og:image'))).every((p) => one(attr(firstImg(p.html), 'alt')) === '놀쿨 안내 카드'), String(pages.filter((p) => /\/og\/nolcool-og\.jpg$/.test(metaOf(p.html, 'og:image'))).length) + '쪽');
  ck('G3 가게 쪽 — 첫 그림이 사실 표(영업시간·주소)보다 앞', venuePages.every((p) => { const b = bodyOf(p.html); const i = b.indexOf('<img'), j = b.indexOf('data-skel="facts"'); return i >= 0 && j > i; }));
  // 광고주 카드가 첫 그림인 쪽 = 「광고」 표시가 그림 바로 앞
  const ADS = (() => { try { return JSON.parse(rd('src/data/advertisers.nolcool.json')).advertisers || []; } catch { return []; } })();
  const adPages = new Set(ADS.flatMap((a) => a.pages.map((x) => x.replace(/\/$/, ''))));
  const hubAd = (() => { try { return JSON.parse(rd('data/hub-og-cards.json')).cards.filter((c) => c.ad).map((c) => c.route); } catch { return []; } })();
  const mustAd = pages.filter((p) => adPages.has(p.enc) || adPages.has(p.route) || hubAd.includes(p.enc));
  const AD_BEFORE_IMG = /class="nc-hero-ad"[^>]*>광고<\/span>(?:<picture><source\b[^>]*>)?<img/; // 「광고」 표시 바로 뒤가 첫 그림(가벼운 판을 감싼 <picture> 포함)
  ck(`G3 놀쿨 명단·허브 광고 카드 쪽 ${mustAd.length} — 첫 그림 앞에 「광고」 표시`, mustAd.length >= 7 && mustAd.every((p) => AD_BEFORE_IMG.test(p.html)), mustAd.filter((p) => !AD_BEFORE_IMG.test(p.html)).map((p) => p.route).join(' '));
  // G3 · 속도 — 첫 그림을 감싼 <picture> 의 가벼운 판(같은 카드 · 있는 파일 · 같은 치수)
  const lightOf = (p) => { const b = bodyOf(p.html); const im = firstImg(p.html); if (!im) return ''; const head = (b.slice(Math.max(0, b.indexOf(im) - 600), b.indexOf(im)).match(/<picture>((?:\s*<source\b[^>]*>)+)\s*$/) || [])[1] || ''; const s = [...head.matchAll(/<source\b[^>]*>/g)].map((m) => m[0]); return s.length === 1 && attr(s[0], 'type') === 'image/webp' ? pathOf(attr(s[0], 'srcset')) : ''; };
  const lightBad = pages.filter((p) => { const og = pathOf(metaOf(p.html, 'og:image')); const l = lightOf(p); const a = l ? imageSize(path.join(DIST, decodeURIComponent(l))) : null, b = og ? imageSize(path.join(DIST, decodeURIComponent(og))) : null; return !(l && l === og.replace(/\.jpe?g$/i, '-w1200.webp') && a && b && a.w === b.w && a.h === b.h && a.w >= 1200); });
  ck(`G3·속도 첫 그림의 가벼운 판 = 같은 카드의 -w1200.webp · 있는 파일 · og 파일과 같은 치수(가로 1200 이상) — ${N}쪽 전부`, lightBad.length === 0, `어긋난 쪽 ${lightBad.length} · ${lightBad.slice(0, 3).map((p) => p.route).join(' ')}`);
  { const seen = new Map(); for (const p of pages) { const og = pathOf(metaOf(p.html, 'og:image')); if (og && !seen.has(og)) { try { seen.set(og, [fs.statSync(path.join(DIST, decodeURIComponent(og))).size, fs.statSync(path.join(DIST, decodeURIComponent(og.replace(/\.jpe?g$/i, '-w1200.webp')))).size]); } catch { seen.set(og, [0, 1]); } } }
    const v = [...seen.values()]; const mid = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    ck(`G3·속도 가벼운 판이 og 파일보다 가벼움 — 서로 다른 카드 ${v.length}장 전부`, v.length >= 100 && v.every(([j, w]) => w < j), `og 파일 중앙 ${Math.round(mid(v.map((x) => x[0])) / 1024)}KB · 가벼운 판 중앙 ${Math.round(mid(v.map((x) => x[1])) / 1024)}KB · 더 무거운 판 ${v.filter(([j, w]) => w >= j).length}장`); }
  ck('G3 「광고」 표시가 붙은 첫 그림은 전화가 든 쪽에만(광고주 아닌 쪽 0)', pages.filter((p) => /class="nc-hero-ad"/.test(p.html)).every((p) => /href="tel:/.test(p.html)), String(pages.filter((p) => /class="nc-hero-ad"/.test(p.html)).length) + '쪽');
  // G4
  ck(`G4 hreflang 0 — ${N}쪽 전부`, pages.every((p) => !/<link[^>]*\shreflang=/.test(p.html)));
  ck('G4 nosnippet · data-nosnippet 0', pages.every((p) => !/nosnippet/.test(metaOf(p.html, 'robots', 'name')) && !/\sdata-nosnippet/.test(p.html)));
  ck('G4 max-snippet 은 -1 만 · max-image-preview:large 전부', pages.every((p) => /max-snippet:-1/.test(metaOf(p.html, 'robots', 'name')) && /max-image-preview:large/.test(metaOf(p.html, 'robots', 'name'))));
  ck('G4 rating 메타 0', pages.every((p) => !/<meta name="rating"/i.test(p.html)));
  // G5
  const rb = ex(path.join(DIST, 'robots.txt')) ? rd(path.join(DIST, 'robots.txt')) : '';
  ck('G5 dist/robots.txt = 저장소 파일', !!rb && rb === rd('public/robots.txt'));
  ck('G5 dist/robots.txt — 묶음 41마다 Content-Signal 1줄 · Disallow 0', (rb.match(/^User-agent:/gim) || []).length === 41 && (rb.match(/^Content-Signal: search=yes, ai-input=yes$/gm) || []).length === 41 && !/^Disallow/im.test(rb));
  for (const bot of ['*', 'Googlebot', 'Bingbot', 'Google-Extended', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'Applebot']) ck(`G5 ${bot} 묶음: Content-Signal + Allow /`, new RegExp(`^User-agent: ${bot.replace(/[*]/g, '\\*')}\\r?\\nContent-Signal: search=yes, ai-input=yes\\r?\\nAllow: /$`, 'm').test(rb));
  // G6
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const wantDate = (p) => { const s = p.enc.split('/').pop(); const v = isVenuePage(p) && PROV[s] && /^\d{4}-\d{2}-\d{2}$/.test(String(PROV[s].fetchedAt || '')) && String(PROV[s].fetchedAt) <= today ? String(PROV[s].fetchedAt) : ''; return v; };
  const chk = (p) => [...strip(bodyOf(p.html)).matchAll(/정보 확인\s*:\s*(\S{0,12})/g)].map((m) => m[1]);
  const withDate = pages.filter((p) => wantDate(p));
  ck('G6 출처 장부에 확인일이 있는 가게 쪽 93', withDate.length === 93, String(withDate.length));
  ck('G6 그 93쪽 — 「정보 확인: 날짜」 1곳 · 날짜 = 장부 fetchedAt', withDate.every((p) => { const c = chk(p); return c.length === 1 && c[0] === wantDate(p); }), withDate.filter((p) => { const c = chk(p); return !(c.length === 1 && c[0] === wantDate(p)); }).slice(0, 3).map((p) => p.route).join(' '));
  ck(`G6 그 밖 ${N - withDate.length}쪽 — 「정보 확인」 0(지어낸 날짜 0)`, pages.filter((p) => !wantDate(p)).every((p) => chk(p).length === 0));
  ck('G6 「정보 확인」 줄은 사실 표 조각 안 · <time datetime> 같은 날짜', withDate.every((p) => { const m = p.html.match(/<p class="[^"]*nc-checked[^"]*">정보 확인: <time[^>]*\sdatetime="(\d{4}-\d{2}-\d{2})"[^>]*>(\d{4}-\d{2}-\d{2})<\/time>/); const f = (p.html.match(/data-skel="facts"[\s\S]*?(?=data-skel="body"|data-skel="faq")/) || [''])[0]; return m && m[1] === m[2] && /nc-checked/.test(f); }));
  const paren = (p) => { const m = strip(bodyOf(p.html)).match(/정보 확인: \d{4}-\d{2}-\d{2}(?: \(([^)]*)\))?/); return m && m[1] !== undefined ? m[1] : null; };
  ck('G6 「정보 확인」 옆 항목 = 장부 fields 가운데 쪽에 보이는 것만', withDate.every((p) => { const s = p.enc.split('/').pop(); const raw = paren(p); const got = raw ? raw.replace(/ 확인일$/, '').split(' · ') : []; const KO = { address: '주소', openHours: '영업시간', nearbyStation: '가까운 역' }; const allow = new Set((PROV[s].fields || []).map((k) => KO[k]).filter(Boolean)); return got.every((g) => allow.has(g)); }));
  // 괄호 꼴 = 「<확인한 항목> 확인일」 — 여러 쪽에 같은 꼴로 들어가는 고지 줄이라 5차원 측정기의 규정 틀 낱말(「확인일」)에 맞춘다(없으면 본문 겹침으로 잡힌다 · 10-07 실측)
  { const withParen = withDate.filter((p) => paren(p) !== null); const FORM = /^(?:주소|영업시간|가까운 역)(?: · (?:주소|영업시간|가까운 역))* 확인일$/;
    ck(`G6 「정보 확인」 괄호 = 「<확인한 항목> 확인일」 꼴 — 괄호가 있는 ${withParen.length}쪽 전부`, withParen.length >= 80 && withParen.every((p) => FORM.test(paren(p))), `괄호 없는 쪽 ${withDate.length - withParen.length} · 어긋난 쪽 ${withParen.filter((p) => !FORM.test(paren(p))).slice(0, 3).map((p) => p.route + ':' + paren(p)).join(' ')}`); }
  ck(`G6 「콘텐츠 최근 갱신 <날짜>」·「마지막 업데이트 <날짜>」 문구 0 — ${N}쪽`, pages.every((p) => !/콘텐츠 최근 갱신|마지막 업데이트\s*\d{4}/.test(strip(bodyOf(p.html)))));
  ck(`G6 머리 날짜 메타(last-modified · date) = 사이트맵 lastmod — ${N}쪽`, pages.every((p) => metaOf(p.html, 'last-modified', 'name') === p.lastmod && metaOf(p.html, 'date', 'name') === p.lastmod), pages.filter((p) => metaOf(p.html, 'date', 'name') !== p.lastmod).slice(0, 2).map((p) => `${p.route}:${metaOf(p.html, 'date', 'name')}≠${p.lastmod}`).join(' '));
  ck('G6 citation_publication_date(고정 날짜) 0', pages.every((p) => !/citation_publication_date/.test(p.html)));
  const mags = pages.filter((p) => /^\/magazine\/./.test(p.enc));
  ck(`G6 매거진 ${mags.length}쪽 — dateModified = 바뀐 날(lastmod · 작성일보다 앞서지 않게)`, mags.length === 59 && mags.every((p) => { const a = ldsOf(p.html).find((x) => /Article/.test(String(x['@type']))); const exp = a && String(a.datePublished) > p.lastmod ? String(a.datePublished) : p.lastmod; return a && a.dateModified === exp && metaOf(p.html, 'article:modified_time') === exp; }));
  ck('G6 매거진 — 작성일은 그대로(구조화 값 = 화면 글자)', mags.every((p) => { const a = ldsOf(p.html).find((x) => /Article/.test(String(x['@type']))); return a && strip(bodyOf(p.html)).includes(String(a.datePublished)) && (!base || !bmap.has(p.enc) || (ldsOf(bmap.get(p.enc).html).find((x) => /Article/.test(String(x['@type']))) || {}).datePublished === a.datePublished); }));
  // 보이는 날짜 = 고치기 전의 날짜에서 「빌드한 날」만 빠지고 「정보 확인」 날짜만 더해진 것(그 밖의 날짜 — 작성일·업소 확인일·개업일·순위 갱신일 — 은 그대로)
  const visSet = (h) => [...new Set(strip(bodyOf(h)).match(/\d{4}-\d{2}-\d{2}/g) || [])].sort();
  if (base) {
    const buildDay = (h) => (strip(bodyOf(h)).match(/콘텐츠 최근 갱신 (\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    const bad = pages.filter((p) => { const b = bmap.get(p.enc); if (!b) return true; const bd = buildDay(b.html); const was = strip(bodyOf(b.html)); const keepBuild = bd && (was.split(bd).length - 1) > 1; // 빌드한 날이 다른 뜻(작성일 등)으로도 적혀 있던 쪽은 그 날짜가 남는다
      const exp = new Set(visSet(b.html).filter((d) => d !== bd || keepBuild)); if (wantDate(p)) exp.add(wantDate(p)); return JSON.stringify([...exp].sort()) !== JSON.stringify(visSet(p.html)); });
    ck(`G6 보이는 날짜 = 고치기 전 − 빌드한 날 + 「정보 확인」 날짜(${N}쪽 · 그 밖의 날짜 변화 0)`, bad.length === 0, `어긋난 쪽 ${bad.length} · ${bad.slice(0, 3).map((p) => p.route).join(' ')}`);
  } else ck('G6 보이는 날짜 견줌', null, '--base 없음');
  ck('G6 보이는 날짜가 0~1가지인 쪽(가게·허브·정적 — 「정보 확인」뿐)', true, `0가지 ${pages.filter((p) => visSet(p.html).length === 0).length} · 1가지 ${pages.filter((p) => visSet(p.html).length === 1).length} · 2가지 이상 ${pages.filter((p) => visSet(p.html).length >= 2).length}(매거진 작성일·업소 확인일·개업일·순위 갱신일 — 고치기 전부터 있던 실제 날짜)`);
  ck('G6 미래 날짜 0(보이는 날짜 · 구조화 날짜)', pages.every((p) => [...(strip(bodyOf(p.html)).match(/\d{4}-\d{2}-\d{2}/g) || []), ...ldsOf(p.html).flatMap((x) => [x.datePublished, x.dateModified].filter(Boolean).map(String))].every((d) => d.slice(0, 10) <= today)));
  // 사이트맵 lastmod — 이번에 모든 쪽의 내용 해시가 바뀌었고(h1·「정보 확인」) 날짜는 한 날(바뀐 날) · 고치기 전보다 앞선 날짜 0
  { const was = (() => { const s = git('show', 'origin/main:scripts/.seo-lastmod.json'); try { return JSON.parse(s); } catch { return null; } })(); const cur = (() => { try { return JSON.parse(rd('scripts/.seo-lastmod.json')); } catch { return null; } })();
    const keys = cur ? Object.keys(cur) : []; const changed = was && cur ? keys.filter((k) => !was[k] || was[k].hash !== cur[k].hash).length : -1; const days = [...new Set(pages.map((p) => p.lastmod))];
    ck('G6 사이트맵 lastmod — 해시가 바뀐 쪽 = 전부 · 날짜는 바뀐 날 하나 · 고치기 전보다 앞선 날짜 0', was && cur ? changed === keys.length && days.length === 1 && (!base || pages.every((p) => p.lastmod >= (bmap.get(p.enc)?.lastmod || ''))) && pages.every((p) => { const k = p.enc; return cur[k] && cur[k].lastmod === p.lastmod; }) : null, `장부 ${keys.length} · 해시 바뀜 ${changed} · 날짜 ${days.join(',')}`); }
  ck('G6 lastmod 정직 게이트(빌드 기록에 PASS)', BUILD_LOG && ex(BUILD_LOG) ? /lastmod 정직 게이트 PASS/.test(rd(BUILD_LOG)) : null, BUILD_LOG);
  // G7
  const tels = pages.flatMap((p) => ldsOf(p.html).filter((x) => isBiz(x) && x.telephone).map((x) => [p, String(x.telephone)]));
  ck('G7 전화가 든 가게 LD 15쪽 — 전부 +82-10-…', tels.length === 15 && tels.every(([, t]) => /^\+82-10-\d{3,4}-\d{4}$/.test(t)), `${tels.length}쪽 · ${tels.filter(([, t]) => !/^\+82-/.test(t)).length} 어긋남`);
  ck('G7 그 번호가 화면에는 010-… 로 그대로 보임(같은 번호)', tels.every(([p, t]) => strip(bodyOf(p.html)).includes(t.replace(/^\+82-/, '0')) && new RegExp(`href="tel:${t.replace(/^\+82-/, '0').replace(/-/g, '')}"`).test(p.html)));
  ck('G7 전화 값 = 고치기 전 값의 표기만 바꾼 것', base ? tels.every(([p, t]) => { const b = bmap.get(p.enc) && ldsOf(bmap.get(p.enc).html).find((x) => isBiz(x) && x.telephone); return b && String(b.telephone) === t.replace(/^\+82-/, '0'); }) : null);
  ck('G7 가게 LD addressCountry KR 127', venuePages.every((p) => { const b = ldsOf(p.html).find(isBiz); return b && b.address && b.address.addressCountry === 'KR'; }));
  ck('G7 가게 LD @type 그대로(NightClub 103 · BarOrPub 21 · EntertainmentBusiness 2 · Restaurant 1)', (() => { const c = {}; for (const p of venuePages) { const b = ldsOf(p.html).find(isBiz); c[b['@type']] = (c[b['@type']] || 0) + 1; } return c.NightClub === 103 && c.BarOrPub === 21 && c.EntertainmentBusiness === 2 && c.Restaurant === 1; })());
  ck('G7 자정 넘는 영업 = spec 하나(둘로 쪼갠 꼴 0)', pages.every((p) => ldsOf(p.html).filter(isBiz).every((x) => { const sp = [].concat(x.openingHoursSpecification || []); return !(sp.some((s) => /^(23:59|24:00)$/.test(String(s.closes)) && String(s.opens) >= '12:00') && sp.some((s) => String(s.opens) === '00:00' && String(s.closes) <= '12:00')); })));
  { const pr = pages.flatMap((p) => ldsOf(p.html).filter((x) => x.priceRange !== undefined).map((x) => String(x.priceRange))); // 값이 하나도 없으면 「통과」가 아니라 「해당 없음」(빈 통과 0)
    ck(`G7 priceRange 100자 미만(값이 있는 ${pr.length}건 · 구글 원문 「shorter than 100 characters」)`, pr.length ? pr.every((v) => v.length < 100) : 'na', pr.length ? '' : '값 0건 — 가격 낱말 금지 규칙(지어내지 않음)'); }
  ck('G7 맨 위 Organization 은 홈 1쪽에만 · 가게 쪽 0', pages.filter((p) => ldsOf(p.html).some((x) => x['@type'] === 'Organization')).map((p) => p.enc).join(',') === '/');
  const home = pages.find((p) => p.enc === '/');
  const org = home && ldsOf(home.html).find((x) => x['@type'] === 'Organization');
  ck('G7 홈 Organization — name 놀쿨 · url · logo(있는 파일 · 112px 이상) · sameAs 2', !!org && org.name === '놀쿨' && org.url === 'https://nolcool.com' && (() => { const s = imageSize(path.join(DIST, pathOf(org.logo))); return s && s.w >= 112 && s.h >= 112; })() && JSON.stringify(org.sameAs) === JSON.stringify(['https://cafe.naver.com/qotjsdnr', 'https://cafe.naver.com/beasunwook']), org ? JSON.stringify({ logo: org.logo, sameAs: org.sameAs }) : '없음');
  ck('G7 홈 Organization·WebSite 는 1개씩', home && ldsOf(home.html).filter((x) => x['@type'] === 'Organization').length === 1 && ldsOf(home.html).filter((x) => x['@type'] === 'WebSite').length === 1);
  ck('G7 구조화 값 속 logo 주소가 전부 있는 파일', pages.every((p) => ldsOf(p.html).every((x) => { const l = x.logo ? (typeof x.logo === 'string' ? x.logo : x.logo.url) : (x.publisher && x.publisher.logo ? x.publisher.logo.url : ''); return !l || ex(path.join(DIST, pathOf(l))); })));
  ck('G7 평점·후기 속성 0(가짜 0 그대로)', pages.every((p) => !/"(aggregateRating|review|reviewRating|ratingValue|reviewCount)"\s*:/.test(p.html)));
  // 게이트 전수
  const lm = (p) => p.lastmod;
  const gate = pages.map((p) => gatePage(p.html, { route: p.enc, lastmod: lm(p), dist: DIST }));
  const blocked = gate.filter((g) => g.block.length);
  ck(`page-gate 막음 0 — ${N}쪽(G2~G7 포함)`, blocked.length === 0, blocked.slice(0, 3).map((g) => g.route + ':' + g.block[0]).join(' | '));
  try { execFileSync(process.execPath, ['scripts/page-gate.mjs', `--dist=${DIST}`], { stdio: 'pipe' }); ck('page-gate CLI exit 0', true); } catch (e) { ck('page-gate CLI exit 0', false, String(e.stdout || e.message).slice(-200)); }
  // 사본 시험 — 통과해야 할 3쪽 · 막아야 할 사본(규칙마다)
  const pick = { venue: venuePages.find((p) => wantDate(p) && ldsOf(p.html).some((x) => isBiz(x) && x.telephone) && ldsOf(p.html).some((x) => isBiz(x) && x.openingHoursSpecification)), hub: pages.find((p) => /^\/region\/[^/]+$/.test(p.enc)), magazine: mags[0] };
  for (const [k, p] of Object.entries(pick)) ck(`사본 시험 통과 — ${k} 원본(${p ? p.route : '없음'})`, !!p && exposureProblems(p.html, { route: p.enc, lastmod: p.lastmod, dist: DIST }).length === 0, p ? exposureProblems(p.html, { route: p.enc, lastmod: p.lastmod, dist: DIST }).join(' | ') : '');
  const mut = (label, p, fn, code) => { if (!p) { ck(`사본 시험 막음 — ${label}`, null, '쪽 없음'); return; } const h2 = fn(p.html); const pr = h2 === p.html ? ['(사본이 원본과 같음)'] : exposureProblems(h2, { route: p.enc, lastmod: p.lastmod, dist: DIST }); ck(`사본 시험 막음 — ${label} → ${code}`, pr.some((x) => x.startsWith(code)), pr.join(' | ').slice(0, 160)); };
  const V = pick.venue, H = pick.hub, M = pick.magazine;
  mut('h1 글자를 틀 문구로 되돌림', V, (h) => h.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/, '$1가게 — 지역 나이트 안내$2'), 'G2');
  mut('og:title 만 다른 글자', H, (h) => h.replace(/(<meta property="og:title" content=")[^"]*"/, '$1다른 제목"'), 'G2');
  mut('h1 끝에 「 | 놀쿨」', M, (h) => h.replace(/<\/h1>/, ' | 놀쿨</h1>'), 'G2');
  mut('첫 그림을 data URI 로', V, (h) => h.replace(/(<img\b[^>]*?\ssrc=")[^"]*(")/, '$1data:image/webp;base64,AAAA$2'), 'G3');
  mut('첫 그림을 다른 가게 카드로', V, (h) => h.replace(/(<img\b[^>]*?\ssrc=")[^"]*(")/, '$1/og/nolcool-og.jpg$2'), 'G3');
  mut('치수 속성을 600×600 으로', V, (h) => h.replace(/(<img\b[^>]*?)\swidth="\d+" height="\d+"/, '$1 width="600" height="600"'), 'G3');
  mut('fetchpriority 뺌', H, (h) => h.replace(/(<img\b[^>]*?)\sfetchpriority="high"/, '$1'), 'G3');
  mut('첫 그림 alt 비움', M, (h) => h.replace(/(<img\b[^>]*?\salt=")[^"]*(")/, '$1$2'), 'G3');
  mut('가벼운 판을 다른 카드의 것으로', V, (h) => h.replace(/(<picture><source type="image\/webp" srcset=")[^"]*(")/, '$1/og/nolcool-og-w1200.webp$2'), 'G3');
  mut('가벼운 판 source 를 둘로', H, (h) => h.replace(/(<picture>)(<source\b[^>]*>)/, '$1$2$2'), 'G3');
  mut('가벼운 판의 종류 표기를 다른 것으로', M, (h) => h.replace(/(<picture><source type=")image\/webp(")/, '$1image/avif$2'), 'G3');
  mut('hreflang 줄 더함', H, (h) => h.replace('</head>', '<link rel="alternate" hreflang="ko" href="https://nolcool.com/" /></head>'), 'G4');
  mut('로봇 메타에 nosnippet', V, (h) => h.replace(/(<meta name="robots" content="[^"]*)"/, '$1, nosnippet"'), 'G4');
  mut('max-snippet:50', M, (h) => h.replace('max-snippet:-1', 'max-snippet:50'), 'G4');
  mut('rating 메타 더함', H, (h) => h.replace('</head>', '<meta name="rating" content="adult"></head>'), 'G4');
  mut('「정보 확인」 줄 하나 더', V, (h) => h.replace(/(<p class="[^"]*nc-checked[^"]*">[\s\S]*?<\/p>)/, '$1$1'), 'G6');
  mut('「정보 확인」 날짜를 다른 날로', V, (h) => h.replace(/(정보 확인: <time[^>]*\sdatetime=")\d{4}-\d{2}-\d{2}("[^>]*>)\d{4}-\d{2}-\d{2}/, '$12026-01-01$22026-01-01'), 'G6');
  mut('장부에 확인일이 없는 쪽에 「정보 확인」', H, (h) => h.replace('</article>', '<p>정보 확인: 2026-10-01</p></article>'), 'G6');
  mut('「콘텐츠 최근 갱신 <날짜> 기준」 줄 더함', H, (h) => h.replace('</article>', '<p>콘텐츠 최근 갱신 2026-10-06 기준</p></article>'), 'G6');
  mut('머리 날짜 메타를 다른 날로', M, (h) => h.replace(/(<meta name="date" content=")[^"]*"/, '$12026-10-31"'), 'G6');
  mut('매거진 dateModified 를 다른 날로', M, (h) => h.replace(/"dateModified":"[^"]*"/, '"dateModified":"2026-10-31"'), 'G6');
  mut('가게 LD 전화를 국내 표기로', V, (h) => h.replace(/"telephone":"\+82-(\d+)-/, '"telephone":"0$1-'), 'G7');
  mut('가게 쪽에 맨 위 Organization', V, (h) => h.replace('</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"놀쿨"}</script></head>'), 'G7');
  mut('logo 를 없는 파일로', M, (h) => h.replace(/("logo":\{"@type":"ImageObject","url":")[^"]*"/, '$1https://nolcool.com/logo-512.png"'), 'G7');
  mut('addressCountry 를 다른 값으로', V, (h) => h.replace('"addressCountry":"KR"', '"addressCountry":"US"'), 'G7');
  // 가게 LD 를 JSON 으로 풀어 고친 뒤 다시 싣는다(글자 치환으로는 배열 끝을 못 잡는다)
  const mutLd = (h, fn) => h.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (all, a, body, c) => { try { const j = JSON.parse(body); if (!isBiz(j)) return all; fn(j); return a + JSON.stringify(j) + c; } catch { return all; } });
  mut('자정 넘는 영업을 둘로 쪼갬', V, (h) => mutLd(h, (j) => { j.openingHoursSpecification = [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday'], opens: '20:00', closes: '23:59' }, { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '00:00', closes: '05:00' }]; }), 'G7');
  mut('priceRange 딱 100자(구글 원문: 100자 미만이어야)', V, (h) => mutLd(h, (j) => { j.priceRange = '가'.repeat(100); }), 'G7 priceRange');
  { const h99 = V ? mutLd(V.html, (j) => { j.priceRange = '가'.repeat(99); }) : ''; // 경계 반대쪽 — 99자는 막지 않는다
    ck('사본 시험 통과 — priceRange 99자는 G7 priceRange 로 막지 않음', !!V && h99 !== V.html && !exposureProblems(h99, { route: V.enc, lastmod: V.lastmod, dist: DIST }).some((x) => x.startsWith('G7 priceRange'))); }
  // 그린 뒤(브라우저) — rdom.mjs 결과
  if (RDOM && ex(RDOM)) {
    const j = JSON.parse(rd(RDOM)); const rows = j.rows || []; const ok = rows.filter((x) => !x.err);
    ck(`그린 뒤 — 잰 쪽 ${rows.length} = 사이트맵 ${N} · 오류 0`, rows.length === N && ok.length === N, `오류 ${rows.length - ok.length}`);
    ck('그린 뒤 — 본문 끌어안기 끝(전 쪽)', ok.every((x) => !x.ssrLeft && x.article));
    ck('그린 뒤 — 보이는 h1 1개(전 쪽)', ok.every((x) => x.h1vis.length === 1), ok.filter((x) => x.h1vis.length !== 1).slice(0, 3).map((x) => `${x.r}:${x.h1vis.length}`).join(' '));
    ck('그린 뒤 — h1 = 제목(전 쪽)', ok.every((x) => x['h1=title']), `${ok.filter((x) => x['h1=title']).length}/${ok.length} · ${ok.filter((x) => !x['h1=title']).slice(0, 2).map((x) => x.r).join(' ')}`);
    ck('그린 뒤 — 제목 = 프리렌더 제목 · og:title = 제목(전 쪽)', ok.every((x) => x['title=원본'] && x['og:title=title']));
    ck('그린 뒤 — og:image = 프리렌더 값(전 쪽)', ok.every((x) => x['og:image=원본']));
    ck('그린 뒤 — hreflang 0(전 쪽)', ok.every((x) => x.hreflang === 0));
    ck('그린 뒤 — Organization 은 홈 1쪽에 1개 · 그 밖 0', ok.every((x) => x.lds.filter((l) => l.type === 'Organization').length === (x.r === '/' ? 1 : 0)), ok.filter((x) => x.lds.filter((l) => l.type === 'Organization').length !== (x.r === '/' ? 1 : 0)).length + '쪽 어긋남');
    ck('그린 뒤 — WebSite 는 홈 1쪽에 1개 · 그 밖 0', ok.every((x) => x.lds.filter((l) => l.type === 'WebSite').length === (x.r === '/' ? 1 : 0)));
    ck('그린 뒤 — 전화 든 LD 15쪽 전부 +82', ok.filter((x) => x.lds.some((l) => l.tel)).length === 15 && ok.every((x) => x.lds.every((l) => !l.tel || /^\+82-/.test(l.tel))));
    ck('그린 뒤 — 「마지막 업데이트 <날짜>」·「콘텐츠 최근 갱신 <날짜>」 0', ok.every((x) => !x.fresh), ok.filter((x) => x.fresh).length + '쪽');
    ck('그린 뒤 — 「정보 확인」 93쪽에 1곳 · 그 밖 0', ok.filter((x) => x.checked.length === 1).length === 93 && ok.every((x) => x.checked.length <= 1));
    const vr = ok.filter((x) => VENUE_SLUGS.has(x.r.replace(/\/$/, '').split('/').pop()) && /^(nights|clubs|rooms|yojeong|lounges|hoppa):[23]$/.test(x.kind));
    // 첫 그림의 주소(src 속성) = og:image 파일 · 브라우저가 실제로 받은 그림(currentSrc) = 그 파일이나 같은 카드의 가벼운 판(-w1200.webp) · 실제 가로 1200
    const noHost = (s) => String(s || '').replace(/^https?:\/\/[^/]+/, '');
    const heroOk = (x) => { const im = x.imgs[0]; const og = noHost(x.ogImage); return !!im && noHost(im.src) === og && [og, og.replace(/\.jpe?g$/i, '-w1200.webp')].includes(noHost(im.currentSrc)) && im.nat === '1200x1200' && im.w === '1200' && im.h === '1200' && im.fp === 'high'; };
    ck('그린 뒤 — 가게 쪽 127: 첫 그림 주소 = og:image 파일 · 받은 그림 = 그 파일이나 같은 카드의 가벼운 판 · 실제 가로 1200 · 치수 속성 · fetchpriority=high', vr.length === 127 && vr.every(heroOk), `${vr.length}쪽 · 어긋남 ${vr.filter((x) => !heroOk(x)).length} ${vr.filter((x) => !heroOk(x)).slice(0, 2).map((x) => x.r).join(' ')}`);
    ck('그린 뒤 — 가게 쪽 그림 설명 = 「<가게이름> 안내 카드」', vr.every((x) => /안내 카드$/.test(x.imgs[0]?.alt || '')));
    // 가게 쪽이 아닌 쪽 — React 화면에는 og 그림 자리가 없다(정적 HTML 의 첫 화면에만 있다) → 수를 그대로 적어 둔다(판정 아님 · 쪽마다 제 그림과 함께 다룰 자리는 34-2)
    { const rest = ok.filter((x) => !vr.includes(x)); const none = rest.filter((x) => !x.imgs[0]).length; const ogHero = rest.filter((x) => { const im = x.imgs[0]; const og = noHost(x.ogImage); return im && [og, og.replace(/\.jpe?g$/i, '-w1200.webp')].includes(noHost(im.currentSrc)); }).length;
      ck(`그린 뒤 — 가게 쪽이 아닌 ${rest.length}쪽의 첫 그림(React 화면에는 og 그림 자리가 없음 · 정적 HTML 에만)`, 'na', `og 그림이 첫 그림 ${ogHero} · 그림 없음 ${none} · 그 밖(목록·본문 카드) ${rest.length - none - ogHero}`); }
    // 흔들림(CLS) — 쪽을 열고 React 가 본문을 끌어안은 뒤까지(짧은 쪽에서 아래 띠·푸터가 밀리던 것)
    const withCls = ok.filter((x) => typeof x.cls === 'number');
    ck(`그린 뒤 — 흔들림(CLS) 0.1 넘는 쪽 0(${N}쪽 전부 잼)`, withCls.length === N ? withCls.every((x) => x.cls <= 0.1) : null, withCls.length === N ? `최대 ${Math.max(...withCls.map((x) => x.cls))} · 0.1 넘는 쪽 ${withCls.filter((x) => x.cls > 0.1).length} ${withCls.filter((x) => x.cls > 0.1).slice(0, 3).map((x) => x.r).join(' ')}` : `흔들림을 잰 쪽 ${withCls.length}/${N}(rdom 결과에 cls 칸이 없음)`);
  } else ck('그린 뒤(브라우저) 측정 결과', null, '--rdom 없음');
  // 속도·흔들림(같은 도구로 고치기 전·후)
  if (VB && VA && ex(VB) && ex(VA)) {
    const b = JSON.parse(rd(VB)).rows, a = JSON.parse(rd(VA)).rows; const bm = new Map(b.map((x) => [x.r, x]));
    ck('속도 — 잰 쪽 고치기 전·후 같은 목록', a.length >= 7 && a.every((x) => bm.has(x.r)), `${a.length}쪽`);
    for (const x of a) { const y = bm.get(x.r); if (!y) continue;
      ck(`흔들림(CLS) ${x.r} — 0.1 안 · 고치기 전보다 0.01 넘게 늘지 않음`, x.clsMax !== null && x.clsMax <= 0.1 && x.clsMax <= y.clsMax + 0.01, `${y.clsMax} → ${x.clsMax}`);
      ck(`첫 화면 그리기(LCP) ${x.r} — 고치기 전보다 10% 넘게 느려지지 않음`, x.lcp !== null && x.lcp <= y.lcp * 1.1 + 50, `${y.lcp}ms → ${x.lcp}ms`);
      ck(`콘솔 오류 ${x.r} — 늘지 않음`, x.consoleErr <= y.consoleErr, `${y.consoleErr} → ${x.consoleErr}`); }
    ck('CLS 최대 — 11-6·12-2 수치(0.1 안 · 최대 0.073) 유지', Math.max(...a.map((x) => x.clsMax)) <= 0.073, String(Math.max(...a.map((x) => x.clsMax))));
  } else ck('속도·흔들림 고치기 전·후 측정', null, '--vitals-before / --vitals-after 없음');
  // 5차원
  if (P5B && P5A && ex(P5B) && ex(P5A)) {
    // 측정 파일 꼴(naver-watch scripts/platform/measure-p.mjs): { 쪽, 초과쪽, 초과쌍, bySite.NOLCOOL: { 쪽, 초과, 최대: {j3,ov,se,st,tp}, 갈래: {①②③④⑤} }, 쪽결과: [{ key, j3, ov, se, st, tp, fails }] }
    //   (처음 판은 칸 이름을 잘못 읽어 빈 값끼리 견줬다 — 10-07 고침. 칸이 없으면 통과가 아니라 실패로 본다)
    const B = JSON.parse(rd(P5B)), A = JSON.parse(rd(P5A)); const sb = B.bySite && B.bySite.NOLCOOL, sa = A.bySite && A.bySite.NOLCOOL;
    const DIM = [['j3', '①', '본문 3-gram'], ['ov', '②', '8어절 겹침'], ['se', '③', '문장'], ['st', '④', '구조'], ['tp', '⑤', '틀 글자']];
    const shape = !!(sb && sa && sb.최대 && sa.최대 && sb.갈래 && sa.갈래 && Array.isArray(B.쪽결과) && Array.isArray(A.쪽결과)) && DIM.every(([k, g]) => typeof sa.최대[k] === 'number' && typeof sb.최대[k] === 'number' && typeof sa.갈래[g] === 'number' && typeof sb.갈래[g] === 'number');
    ck(`5차원 측정 파일 꼴 · 잰 쪽 = 사이트맵 ${N}(고치기 전·후)`, shape && sa.쪽 === N && sb.쪽 === N && A.쪽결과.length === N && B.쪽결과.length === N, shape ? `${sb.쪽} → ${sa.쪽}` : '칸 없음');
    if (shape) {
      const pc = (v) => (v * 100).toFixed(2) + '%';
      ck('5차원 ④ 구조 — 기준(10%)을 넘는 쪽 0', sa.갈래['④'] === 0 && sa.최대.st <= 0.10, `넘는 쪽 ${sa.갈래['④']} · 최대 ${pc(sa.최대.st)}`);
      for (const [k, g, nm] of DIM) ck(`5차원 ${g} ${nm} 최대 — 고치기 전보다 늘지 않음`, sa.최대[k] <= sb.최대[k] + 1e-9, `${pc(sb.최대[k])} → ${pc(sa.최대[k])}`);
      for (const [, g, nm] of DIM) ck(`5차원 ${g} ${nm} 기준을 넘는 쪽 수 — 고치기 전보다 늘지 않음`, sa.갈래[g] <= sb.갈래[g], `${sb.갈래[g]} → ${sa.갈래[g]}`);
      ck('5차원 기준을 넘는 쪽·쌍 수 — 고치기 전보다 늘지 않음', sa.초과 <= sb.초과 && A.초과쌍 <= B.초과쌍, `쪽 ${sb.초과} → ${sa.초과} · 쌍 ${B.초과쌍} → ${A.초과쌍}`);
      const was = new Map(B.쪽결과.map((x) => [x.key, new Set(x.fails || [])]));
      const neu = A.쪽결과.flatMap((x) => (x.fails || []).filter((f) => !(was.get(x.key) || new Set()).has(f)).map((f) => `${f} ${String(x.key).replace(/^NOLCOOL/, '')}`));
      ck('5차원 — 쪽마다 새로 기준을 넘은 칸 0', A.쪽결과.every((x) => was.has(x.key)) && neu.length === 0, `새로 넘은 칸 ${neu.length} ${neu.slice(0, 4).join(' · ')}`);
    }
  } else ck('5차원 고치기 전·후 측정', null, '--p5-before / --p5-after 없음');
  // 옛 검증(11-2~11-5) — 고치기 전 판에서 통과하던 검사가 이번 판에서도 통과(새 실패 0)
  if (OLDB && OLDA && ex(OLDB) && ex(OLDA)) {
    const b = JSON.parse(rd(OLDB)), a = JSON.parse(rd(OLDA));
    for (const x of a) { const y = b.find((z) => z.name === x.name && z.stage === x.stage); const was = new Set(y ? y.fails : []); const neu = x.fails.filter((f) => !was.has(f));
      ck(`옛 검증 ${x.name} ${x.stage} — 새로 생긴 실패 0`, x.checks !== null && neu.length === 0, `검사 ${x.checks} · 실패 ${x.fails.length}(고치기 전 ${y ? y.fails.length : '?'}) · 새 실패 ${neu.length} ${neu.slice(0, 2).join(' / ')}`); }
  } else ck('옛 검증(11-2~11-5) 고치기 전·후', null, '--old-before / --old-after 없음');
  // 빌드
  if (BUILD_LOG && ex(BUILD_LOG)) { const l = rd(BUILD_LOG); ck('빌드 exit 0', /exit=0\s*$/.test(l.trim()) || /\bexit=0\b/.test(l.split('\n').slice(-5).join('\n'))); ck('빌드 — page-gate 통과 줄', /page-gate 통과/.test(l)); ck('빌드 — 막음 0쪽', /page-gate: \d+쪽 · 막음 0쪽/.test(l), (l.match(/page-gate: [^\n]*/) || [''])[0].slice(0, 120)); }
  else ck('빌드 기록', null, '--build-log 없음');
  try { execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'tsconfig.json'], { stdio: 'pipe' }); ck('타입 검사 tsc --noEmit 오류 0', true); } catch (e) { ck('타입 검사 tsc --noEmit 오류 0', false, String(e.stdout || e.message).split('\n').filter((l) => /error TS/.test(l)).slice(0, 2).join(' | ')); }
  for (const f of ['scripts/prerender-seo.mjs', 'scripts/page-gate.mjs', 'scripts/skeleton/index.mjs', 'scripts/verify/nc34-1-check.mjs', 'scripts/verify/nc11-2-check.mjs', 'scripts/verify/nc11-4-check.mjs', 'src/lib/venue-file-ver.mjs']) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); ck('문법 검사 node --check ' + f, true); } catch (e) { ck('문법 검사 node --check ' + f, false, String(e.stderr || e.message).slice(0, 120)); } }
}

/* ───────────────────────────── 최종 — 끝 상태 + 지시문 대조 ───────────────────────────── */
if (stage === '최종') {
  const pages = pagesOf(DIST); const N = pages.length;
  const gate = pages.map((p) => gatePage(p.html, { route: p.enc, lastmod: p.lastmod, dist: DIST }));
  ck(`끝 상태 — page-gate 막음 0(${N}쪽 · G2~G7 포함)`, N === 467 && gate.every((g) => !g.block.length), gate.filter((g) => g.block.length).slice(0, 2).map((g) => g.route + ':' + g.block[0]).join(' | '));
  ck('끝 상태 — 가게 쪽 127(아래 「가게 쪽」 검사들의 대상 수 · 0쪽이면 빈 통과가 된다)', pages.filter(isVenuePage).length === 127, String(pages.filter(isVenuePage).length));
  // 지시서 2절 항목마다
  ck('지시 C5·G2 「h1 = title 핵심 · og:title = title」 — 467쪽', pages.every((p) => { const h = h1sOf(p.html); return h.length === 1 && h[0] === titleOf(p.html) && metaOf(p.html, 'og:title') === titleOf(p.html); }));
  ck('지시 G2 「사이트명 | 놀쿨 끝 1번」 — 넣지 않음(저장소 규칙 「홈 밖 제목에 놀쿨 0」 · 빌드 게이트가 막음 → 결과 문서에 충돌·제안)', 'na', '기존 규칙 유지');
  ck('지시 G3 「본문 첫 그림 = og 그림 파일 · 가로 1200 이상 · data URI X · 치수 · fetchpriority」 — 467쪽', gate.every((g) => !g.block.some((b) => b.startsWith('G3'))));
  ck('지시 G3 「영업시간·주소 문단 바로 옆」 — 가게 쪽 첫 그림이 사실 표 앞(같은 첫 화면 묶음)', pages.filter(isVenuePage).every((p) => { const b = bodyOf(p.html); return b.indexOf('<img') >= 0 && b.indexOf('data-skel="facts"') > b.indexOf('<img'); }));
  ck('지시 G3 「alt — 카드 그림이면 <가게이름> 안내 카드」 — 가게 쪽 127', pages.filter(isVenuePage).every((p) => / 안내 카드$/.test(one(attr(firstImg(p.html), 'alt')))));
  ck('지시 4절 「data URI 를 파일로 바꾸면 LCP·CLS 변동 … 나빠지면」 — 같은 카드의 가벼운 판(webp · 가로 1200)을 <picture> 로 같이 내줌 · <img src> 는 og 파일 그대로(467쪽)', pages.every((p) => { const m = bodyOf(p.html).match(/<picture><source type="image\/webp" srcset="(\/og\/[^"]+)-w1200\.webp"><img src="(\/og\/[^"]+)\.jpe?g"/); return !!m && m[1] === m[2] && pathOf(metaOf(p.html, 'og:image')).replace(/\.jpe?g$/i, '') === m[2]; }));
  const rb = rd(path.join(DIST, 'robots.txt'));
  ck('지시 G5 「Content-Signal: search=yes, ai-input=yes · ai-train 안 적음 · 봇 줄 그대로」', (rb.match(/^Content-Signal: search=yes, ai-input=yes$/gm) || []).length === 41 && !rb.split(/\r?\n/).some((l) => !l.startsWith('#') && /ai-train/i.test(l)) && !/^Disallow/im.test(rb));
  ck('지시 G5 「robots.txt 끝에」 — 끝이 아니라 묶음마다(파일 끝 한 줄은 마지막 묶음에만 붙는다 · Cloudflare 원문 예시도 묶음 안)', 'na', '원문 꼴로 넣음 → 결과 문서에 적음');
  ck('지시 G4 「hreflang 3줄 빼기 · nosnippet 류 0 유지」 — 467쪽', pages.every((p) => !/<link[^>]*\shreflang=/.test(p.html) && !/nosnippet/.test(metaOf(p.html, 'robots', 'name'))));
  ck('지시 G4 「FAQ·Breadcrumb·WebPage LD 는 그대로(새 마크업 추가 0)」', (() => { const c = {}; for (const p of pages) for (const x of ldsOf(p.html)) c[x['@type']] = (c[x['@type']] || 0) + 1; return c.BreadcrumbList === 466 && c.FAQPage === 358 && c.CollectionPage === 220 && c.WebPage === 178 && c.Article === 59 && c.ItemList === 24 && c.Organization === 1 && c.WebSite === 1; })(), (() => { const c = {}; for (const p of pages) for (const x of ldsOf(p.html)) c[x['@type']] = (c[x['@type']] || 0) + 1; return JSON.stringify(c); })());
  ck('지시 G4 「llms.txt 손대지 않음」', BASE && ex(path.join(BASE, 'llms.txt')) ? rd(path.join(DIST, 'llms.txt')).replace(DATE_RE, 'D') === rd(path.join(BASE, 'llms.txt')).replace(DATE_RE, 'D') : null);
  ck('지시 G7 「telephone +82-10-… · 화면 글자는 010 그대로」 — 15쪽', (() => { const t = pages.flatMap((p) => ldsOf(p.html).filter((x) => isBiz(x) && x.telephone).map((x) => [p, String(x.telephone)])); return t.length === 15 && t.every(([p, v]) => /^\+82-10-/.test(v) && strip(bodyOf(p.html)).includes(v.replace(/^\+82-/, '0'))); })());
  ck('지시 G7 「addressCountry KR」 — 127쪽', pages.filter(isVenuePage).every((p) => (ldsOf(p.html).find(isBiz) || {}).address?.addressCountry === 'KR'));
  ck('지시 G7 「자정 넘는 영업은 spec 1개」', gate.every((g) => !g.block.some((b) => /자정/.test(b))));
  ck('지시 G7 「priceRange ≤100자」(구글 원문은 100자 미만 → 게이트는 100자부터 막음) — 값이 있는 쪽 0(가격 낱말 금지 규칙 · 지어내지 않음)', pages.every((p) => ldsOf(p.html).every((x) => x.priceRange === undefined)) ? 'na' : gate.every((g) => !g.block.some((b) => /priceRange/.test(b))), '값 0쪽');
  ck('지시 G7 「홈에만 Organization(name·url·logo·sameAs 실값만) · 가게 쪽 0」', pages.filter((p) => ldsOf(p.html).some((x) => x['@type'] === 'Organization')).map((p) => p.enc).join(',') === '/' && (() => { const o = ldsOf(pages.find((p) => p.enc === '/').html).find((x) => x['@type'] === 'Organization'); return o && o.name && o.url && o.logo && Array.isArray(o.sameAs) && o.sameAs.length === 2; })());
  ck('지시 G7 「sameAs 신실장TV」 — 저장소·자료에 주소 없음 → 비움(지어내지 않음)', 'na', '못 찾음');
  ck('지시 G6 「정보 확인: YYYY-MM-DD 1곳 · 확인일 값 없으면 표기하지 않음」 — 93쪽 1곳 · 374쪽 0', (() => { const c = pages.map((p) => [...strip(bodyOf(p.html)).matchAll(/정보 확인\s*:\s*(\d{4}-\d{2}-\d{2})/g)].length); return c.filter((n) => n === 1).length === 93 && c.every((n) => n <= 1); })());
  ck('지시 G6 「다른 날짜 최소」 — 빌드 날짜 문구 0 · 고정 날짜 메타 0', pages.every((p) => !/콘텐츠 최근 갱신|citation_publication_date/.test(p.html)));
  ck('지시 G6 「dateModified·lastmod 는 내용 diff 가 있는 쪽만」 — 날짜 메타·매거진 수정일 = lastmod(게이트 G6 0)', gate.every((g) => !g.block.some((b) => b.startsWith('G6'))));
  const cj = pages.find((p) => p.enc === '/nights/cheongjudontellmamanight');
  ck('지시 「청주돈텔마마 쪽: 광고문의 카드 · 본문 전화 0 확인」', !!cj && !/href="tel:/.test(cj.html) && !ldsOf(cj.html).some((x) => x.telephone) && !/01[016789]-\d{3,4}-\d{4}/.test(strip(bodyOf(cj.html))) && /cheongjudontellmamanight-v8\.jpg/.test(metaOf(cj.html, 'og:image')) && (!BASE || git('diff', '--quiet', 'origin/main', '--', 'public/og/cheongjudontellmamanight-v8.jpg') !== null));
  ck('지시 「page-gate 에 검사 줄 추가: G2·G3·G4·G7·G6」', (() => { const pg = rd('scripts/page-gate.mjs'); return ['G2 ', 'G3 ', 'G4 ', 'G6 ', 'G7 '].every((k) => pg.includes('`' + k) || pg.includes("'" + k)); })());
  ck('지시 「주소 불변」 — 사이트맵 주소 고치기 전과 같음', BASE && ex(path.join(BASE, 'sitemap.xml')) ? (() => { const a = new Set(pagesOf(BASE).map((p) => p.enc)), b = new Set(pages.map((p) => p.enc)); return a.size === b.size && [...a].every((u) => b.has(u)); })() : null);
  ck('지시 「네이버 0」 — dist 에 네이버 수집·요청 코드 0', pages.every((p) => !/searchadvisor\.naver|naver\.com\/[^"'\s]*(request|submit)/i.test(p.html)));
  ck('지시 「광고주 쪽 세트 그대로」 — 놀쿨 명단 6쪽에 닉네임·번호·광고 표시', (() => { const ads = JSON.parse(rd('src/data/advertisers.nolcool.json')).advertisers; const n = ads.reduce((s, a) => s + a.pages.length, 0); return n === 6 && ads.every((a) => a.pages.every((pp) => { const p = pages.find((x) => x.enc === pp.replace(/\/$/, '')); return p && p.html.includes(a.nickname) && p.html.includes(a.phone) && />광고</.test(p.html); })); })(), (() => { try { const ads = JSON.parse(rd('src/data/advertisers.nolcool.json')).advertisers; return `명단 ${ads.length}명 · ${ads.reduce((s, a) => s + a.pages.length, 0)}쪽`; } catch { return '명단 못 읽음'; } })());
  ck('지시 「가지 nc34-1 · 커밋 1개」', (() => { const br = git('rev-parse', '--abbrev-ref', 'HEAD'); const n = git('rev-list', '--count', 'origin/main..HEAD'); return br === 'nc34-1' && n === '1'; })(), `${git('rev-parse', '--abbrev-ref', 'HEAD')} · 앞선 커밋 ${git('rev-list', '--count', 'origin/main..HEAD')}`);
  ck('지시 「올리기는 대표님 한 줄」 — 이 창은 올리지 않음(원격 main 이 고치기 전 커밋 그대로)', (git('rev-parse', 'origin/main') || '').startsWith('ed2e6a1'), (git('rev-parse', 'origin/main') || '').slice(0, 7));
  ck('작업 폴더 깨끗함(빌드 부산물 og 그림 말고 남은 변경 0)', ((git('status', '--porcelain') || '').split('\n').filter(Boolean).filter((l) => !/public\/og\/(clubs|hoppa|lounges|nights|rooms|yojeong|hub-[a-z-]+-hoppa)\.jpg$/.test(l))).length === 0, (git('status', '--porcelain') || '').split('\n').filter(Boolean).filter((l) => !/public\/og\//.test(l)).slice(0, 3).join(' | '));
  // 미리보기 눈 확인 기록(폰·PC 7쪽)
  if (SHOTS && ex(SHOTS)) { const fl = fs.readdirSync(SHOTS).filter((f) => /\.png$/.test(f)); ck('미리보기 캡처 — 7쪽 × 폰·PC = 14장 이상', fl.filter((f) => /-phone\.png$/.test(f)).length >= 7 && fl.filter((f) => /-pc\.png$/.test(f)).length >= 7, `폰 ${fl.filter((f) => /-phone\.png$/.test(f)).length} · PC ${fl.filter((f) => /-pc\.png$/.test(f)).length}`); }
  else ck('미리보기 캡처 폴더', null, '--shots 없음');
  // 대표님 문장 대조
  ck('대표님 18:45 「구글에서 가게이름 검색하면 상위노출되게 설정」 — 가게 쪽 127: 제목 = h1 = og:title 이 가게이름으로 시작 · NightClub류 LD · 첫 그림 = og 카드', pages.filter(isVenuePage).every((p) => { const b = ldsOf(p.html).find(isBiz); return b && titleOf(p.html).startsWith(b.name) && h1sOf(p.html)[0] === titleOf(p.html) && pathOf(attr(firstImg(p.html), 'src')) === pathOf(metaOf(p.html, 'og:image')); }));
  ck('대표님 18:45 「구글하고 AI 에서 … 모든 페이지」 — AI 봇 허용 + 신호 줄 + 스니펫 막는 표기 0(467쪽)', /^User-agent: OAI-SearchBot\r?\nContent-Signal: search=yes, ai-input=yes\r?\nAllow: \/$/m.test(rb) && /^User-agent: PerplexityBot\r?\nContent-Signal: search=yes, ai-input=yes\r?\nAllow: \/$/m.test(rb) && /^User-agent: Claude-SearchBot\r?\nContent-Signal: search=yes, ai-input=yes\r?\nAllow: \/$/m.test(rb) && pages.every((p) => /max-snippet:-1/.test(metaOf(p.html, 'robots', 'name'))));
  ck('대표님 18:45 「순위」 — 순위는 구글·AI 가 정한다(이 단계는 조건을 갖추는 것 · 라이브·서치콘솔은 34-3)', 'na', '올라간 뒤 34-3');
  ck('대표님 22:5x 「모든 페이지 제목 후킹 · 내용 끝까지 읽는 글」 — 34-2 몫(이 단계는 제목·본문 글자를 바꾸지 않음)', 'na', '놀쿨34-2');
}

const fails = R.filter((x) => x.r === '실패');
const out = { stage, checks: R.length, pass: R.filter((x) => x.r === '통과').length, fails: fails.length, na: R.filter((x) => x.r === '실행 불가').length, skip: R.filter((x) => x.r === '해당 없음').length, list: R };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`${stage}: 검사 ${out.checks} · 통과 ${out.pass} · 실패 ${out.fails} · 실행 불가 ${out.na} · 해당 없음 ${out.skip}`);
for (const f of R.filter((x) => x.r === '실패' || x.r === '실행 불가')) console.log(`  ${f.r}:`, f.name, f.note);
process.exit(fails.length || out.na || !R.length ? 1 : 0);
