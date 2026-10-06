#!/usr/bin/env node
/**
 * [놀쿨11-2] 쪽 게이트 하나 — dist 466쪽 전수. 위성 page-gate.mjs 와 이름을 맞췄다(규칙은 놀쿨 명세 11-1 4절).
 *
 *   막음(하나라도 걸리면 exit 1 = 배포 금지):
 *     T1 제목 없음 · T2 제목 동일 · T3 제목 3-gram 유사 0.8↑ · T4 후킹 부분 동일 4쪽 이상(같은 틀 3쪽까지) · T5 후킹 0(analyzeHook)
 *     H1 H1 1개가 아님 · (옛 H2 「H1 = 제목이면 막음」은 34-1 에서 G2 로 뒤집힘) · D1 설명 없음/제목과 같음
 *     S1 숨김 SSR(1px clip) · S2 완독 뼈대(조각·순서) · S3 FAQ 화면 dl ≠ FAQPage JSON-LD
 *     L1 내부 링크 새 창 · L2 canonical ≠ 주소 · A1 tel 링크 있는데 광고 라벨 없음
 *     W1 금칙어(가격 단어·자리표시) · N1 네이버 수집 코드 0(놀쿨은 구글+AI)
 *   [놀쿨11-3] J1 JSON-LD 파싱 오류 · J2 유형별 필수 마크업(가게 LocalBusiness류+Breadcrumb · 목록/허브 CollectionPage|ItemList+Breadcrumb · 매거진 Article+Breadcrumb · 홈 WebSite+Organization)
 *                 J3 사실 일치(가게 name=본문 이름 · telephone ⇒ tel 링크 · openingHours ⇒ 본문 영업시간 · Breadcrumb 마지막 = 이 주소) · J4 가짜 평점·후기 속성 0 · J5 DiscussionForumPosting 은 글 0 인 게시판에 0
 *                 O1 og:title·og:description·og:image · S4 세이프서치 안전(성적 묘사·성매매·노출 표현 0 · 위험어 미러) · L3 본문 내부 링크 ≥ 10 · L4 허브(지역·업종) 링크 있음
 *   [놀쿨12-2] A2 명단 밖 번호 · A3 금지 낱말(신실장·WT창민 · 흔한 낱말 천사·태양·둘리·따봉·수빈은 번호와 붙을 때만) · A4 일산 총책임자 두 쪽만 · A5 그림(판정표 밖 가게 사진 · 금지 그림 해시)
 *   [놀쿨26-1] 놀쿨 전용 광고주 명단(src/data/advertisers.nolcool.json · 따봉)은 명단에 적힌 쪽에서만 A2·A3 통과 — 그 밖의 쪽에서는 그대로 막음
 *   [놀쿨11-4] M1 「다음에 볼 곳」 모듈 안 같은 주소 2번 · M2 가게 쪽 모듈 7칸 미만 · M3 모듈 링크 새 창 · M4 저장 버튼 없는 가게 쪽
 *   [놀쿨34-1 · 노출34 연구표 G2~G7] G2 H1 = 제목 글자 그대로 · og:title = 제목(11-2 의 「H2 H1 = 제목이면 막음」을 뒤집음 — 충돌 C5 · 구글 title-link 「제목 글자를 첫 보이는 h1 에」)
 *                 G3 첫 그림 = og:image 와 같은 파일(data URI 아님 · 치수 속성 = 파일의 실제 치수 · 가로 1200 이상 · fetchpriority=high · alt 있음 · <picture> 로 감쌌으면 가벼운 판 = 같은 카드의 -w1200.webp 하나 · 있는 파일 · 같은 치수)
 *                 G4 hreflang 0 · nosnippet/data-nosnippet 0 · max-snippet 은 -1 만 · rating 메타 0 · max-image-preview:large
 *                 G6 「정보 확인: YYYY-MM-DD」는 가게 쪽에 0~1곳(출처 장부 fetchedAt 과 같은 날 · 장부에 없으면 0) · 빌드 날짜 문구 0 · 날짜 메타·매거진 수정일 = lastmod
 *                 G7 가게 LD 전화 +82-… · addressCountry KR · 자정 넘는 영업 spec 을 둘로 쪼개지 않음 · priceRange 100자 미만 · 맨 위 Organization 은 홈에만 · logo 는 있는 파일
 *   품질(경고만 · exit 0): Q1 제목 40자 초과 · Q2 본문 글자 하한(가게 1,700 · 목록/허브 2,000) · Q3 H2 5개 미만 · Q4 본문 내부 링크 12~25 밖(11-4 목표 · 실측 중앙 가게 16·허브 9)
 *
 *   순수 함수 gatePage(html, ctx) 를 nc11-2-check 가 그대로 쓴다. 파일을 쓰지 않는다(보고 JSON 은 --out=).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { analyzeHook } from './lib/hook-detector.mjs';
import { normalize, grams3, jaccard, hookPart, SIM_LIMIT } from './lib/title-bank.mjs';
import { checkSkeleton } from './skeleton/index.mjs';

const DIST = process.argv.find((a) => a.startsWith('--dist='))?.slice(7) || 'dist';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6) || '';
const PRICE_WORDS = ['만원', '입장료', '가성비', '시세', '가격대'].map((w) => w); // 사이트 규칙: 가격 단어 전면 금지
// 「만원」은 저장소 nolcool-guard.mjs 와 같은 잣대 — 가격 노출 문맥(룸비·기본료·입장 N만원 …)만 막고 혜택 문맥(차비·쿠폰)은 둔다
const MANWON_PRICE_RE = /(룸비|기본료|보증금|세팅비|입장(?!\s*가능)|메뉴|요금|가격|코스)\s*[\d일이삼사오육칠팔구십백천]*만원|[\d일이삼사오육칠팔구십백천]+\s*만원\s*(부터|이상|이하|선|대|짜리|상당)|만원대(?![가-힣])/;
const PLACEHOLDER_RE = /\{\{|\bTODO\b|undefined|NaN|\[object Object\]|lorem ipsum/;
// [놀쿨12-2 R10 · 2026-09-27] 연락처 금지 목록 — 쪽에 나오는 전화번호는 가게 자료(src/data/venues.ts)의 staffPhone(= 광고주 명단 · StickyPhoneBar 와 같은 기준)과
//   일산 총책임자(대표님 지시 · 일산룸·일산명월관)만 허용한다. 번호를 하나씩 막는 대신 허용 밖 번호를 전부 막는다(새 명단 밖 번호도 걸린다).
//   신실장 · WT창민 같은 옛 닉네임은 번호가 없어도 막는다(대표님지시_한장 3절 「신실장 = 모든 쪽·모든 그림 0」). 흔한 낱말(천사·태양 등)은 막지 않는다.
const ALLOWED_PHONES = (() => {
  const set = new Set(['01041175556']);
  try { for (const m of fs.readFileSync('src/data/venues.ts', 'utf8').matchAll(/staffPhone:\s*'([^']+)'/g)) set.add(m[1].replace(/\D/g, '')); } catch {}
  return set;
})();
const PHONE_RE = /(?<![\d.])(?:01[016789][-. ]?\d{3,4}[-. ]?\d{4}|0(?:2|[3-6][1-5]|70|50\d)[-. )]\d{3,4}[-. ]\d{4}|1[5-8]\d{2}[-. ]\d{4})(?![\d.])/g;
const FORBIDDEN_WORDS = ['신실장', 'WT창민', 'W.T창민'];
// [놀쿨12-2 R12] 일산 총책임자 번호는 일산룸·일산명월관 두 가게 쪽에만(naver-watch CLAUDE.md 0순위 7)
const ILSAN_PHONE = '01041175556';
const ILSAN_ROUTES = new Set(['/rooms/ilsan/ilsanroom/', '/yojeong/ilsan/ilsanmyeongwolgwanyojeong/']);
// [놀쿨12-2 R10 · 13:18-9] 흔한 낱말(천사·태양·둘리·따봉·수빈)은 번호와 붙어 나올 때만 막는다(명단 밖 옛 닉네임+번호 꼴)
const NICK_NEAR_NUMBER_RE = /(천사|태양|둘리|따봉|수빈)[\s:·)]{0,4}0\d{1,2}[-. ]?\d{3,4}[-. ]?\d{4}/g;
// [놀쿨26-1 · 2026-10-04 · 대표님 03:43] 놀쿨 전용 광고주 명단(src/data/advertisers.nolcool.json) — 적힌 쪽(pages)에서만 그 닉네임·번호를 허용한다.
//   그 밖의 쪽에 그 번호가 나오면 지금처럼 A2 로 막는다(venues.ts staffPhone 에 있어도 쪽 밖이면 막음).
const PAGE_ONLY = (() => {
  const map = new Map();
  try { for (const a of JSON.parse(fs.readFileSync('src/data/advertisers.nolcool.json', 'utf8')).advertisers || []) map.set(String(a.phone).replace(/\D/g, ''), { nick: a.nickname, pages: new Set(a.pages) }); } catch {}
  return map;
})();
// [놀쿨12-2 R7·R10] 그림 — ① 가게 사진(/venues/*)은 사진 판정표 여섯 가지를 넘은 것만(지금 0장 → 참조 0) ② 번호·신실장이 그려진 것으로 확인된 그림(해시 목록 scripts/forbidden-images.json) 참조 0
const FORBIDDEN_IMG = (() => { try { return JSON.parse(fs.readFileSync('scripts/forbidden-images.json', 'utf8')).sha1 || {}; } catch { return {}; } })();
const PHOTO_PASS = (() => { try { return new Set([...fs.readFileSync('src/data/venue-image-manifest.ts', 'utf8').matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1])); } catch { return new Set(); } })();
const _imgSha = new Map();
export function imageProblems(html, dist = DIST) {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href|content|srcset)="([^"]+)"/g)) for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u) && !u.startsWith('data:')) refs.add(u.replace(/^https?:\/\/(www\.)?nolcool\.com/, '').split('?')[0]); }
  const photos = [...refs].filter((u) => /^\/venues\//.test(u) && !PHOTO_PASS.has((u.match(/^\/venues\/(.+?)-\d+(?:-v\d+)?\./) || [])[1]));
  const bad = [];
  for (const u of refs) {
    if (!u.startsWith('/')) continue;
    const f = path.join(dist, decodeURIComponent(u));
    if (!_imgSha.has(f)) { let h = null; try { h = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch { h = null; } _imgSha.set(f, h); }
    const h = _imgSha.get(f);
    if (h && FORBIDDEN_IMG[h]) bad.push(`${u}(${FORBIDDEN_IMG[h]})`);
  }
  return { photos, bad };
}
// [놀쿨34-1 · G3] 그림 파일의 실제 가로·세로 — jpg(SOF 칸) · png(IHDR) · webp(VP8X·VP8·VP8L) 머리만 읽는다. 못 읽으면 null.
const _imgDim = new Map();
export function imageSize(file) {
  if (_imgDim.has(file)) return _imgDim.get(file);
  let out = null;
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0xFF && b[1] === 0xD8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xFF) { i++; continue; }
        const mk = b[i + 1];
        if (mk >= 0xC0 && mk <= 0xCF && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) { out = { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }; break; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    } else if (b.slice(1, 4).toString() === 'PNG') out = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    else if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
      const k = b.slice(12, 16).toString();
      if (k === 'VP8X') out = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      else if (k === 'VP8 ') out = { w: b.readUInt16LE(26) & 0x3FFF, h: b.readUInt16LE(28) & 0x3FFF };
      else if (k === 'VP8L') { const n = b.readUInt32LE(21); out = { w: 1 + (n & 0x3FFF), h: 1 + ((n >> 14) & 0x3FFF) }; }
    }
  } catch { out = null; }
  _imgDim.set(file, out);
  return out;
}
// [놀쿨34-1 · G6] 출처 장부 — 「정보 확인」 날짜가 장부의 fetchedAt 과 같은지(지어낸 날짜 0) 본다
const PLACES_PROV = (() => { try { return JSON.parse(fs.readFileSync('src/data/places-provenance.json', 'utf8')); } catch { return {}; } })();
const sameOriginPath = (u) => String(u || '').replace(/^https?:\/\/(www\.)?nolcool\.com/, '').split(/[?#]/)[0];
/** [놀쿨34-1] 노출34 연구표 G2~G7 검사(순수 · 쪽 하나) — ctx: { route, type, dist, lastmod, today, prov } */
export function exposureProblems(html, ctx = {}) {
  const route = ctx.route || '/';
  const type = ctx.type || pageTypeOf(route);
  const dist = ctx.dist || DIST;
  const out = [];
  const one = (s) => dec(String(s || '')).replace(/\s+/g, ' ').trim();
  const title = one((html.match(/<title>([^<]*)<\/title>/) || [])[1]);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
  const metaOf = (re) => one((html.match(re) || [])[1]);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  // G2 — 제목 = h1 = og:title (글자 그대로 · 빈칸은 하나로 접어 견줌)
  if (h1s.length === 1 && title && h1s[0] !== title) out.push(`G2 H1 ≠ 제목 (「${h1s[0].slice(0, 30)}」)`);
  const ogTitle = metaOf(/<meta property="og:title" content="([^"]*)"/);
  if (ogTitle && title && ogTitle !== title) out.push('G2 og:title ≠ 제목');
  // G3 — 첫 그림 = og:image 파일
  const body = html.slice(Math.max(0, html.indexOf('<body')));
  const img = (body.match(/<img\b[^>]*>/) || [''])[0];
  const attr = (tag, k) => (tag.match(new RegExp(`\\s${k}="([^"]*)"`)) || [])[1];
  const og = sameOriginPath((html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1]);
  if (!img) out.push('G3 첫 그림 없음');
  else {
    const src = attr(img, 'src') || '';
    if (/^data:/.test(src)) out.push('G3 첫 그림이 data URI(주소 있는 파일이 아님)');
    else if (!og || sameOriginPath(src) !== og) out.push(`G3 첫 그림 ≠ og:image 파일 (${sameOriginPath(src).slice(0, 50)})`);
    else {
      const real = imageSize(path.join(dist, decodeURIComponent(og)));
      const w = Number(attr(img, 'width')), h = Number(attr(img, 'height'));
      if (!real) out.push('G3 og:image 파일을 못 읽음');
      else {
        if (real.w < 1200) out.push(`G3 대표 그림 가로 ${real.w} < 1200`);
        if (!w || !h) out.push('G3 첫 그림 치수 속성 없음');
        else if (w !== real.w || h !== real.h) out.push(`G3 치수 속성 ${w}x${h} ≠ 파일 ${real.w}x${real.h}`);
      }
    }
    if (attr(img, 'fetchpriority') !== 'high') out.push('G3 첫 그림 fetchpriority=high 없음');
    if (/\sloading="lazy"/.test(img)) out.push('G3 첫 그림 lazy');
    if (!(attr(img, 'alt') || '').trim()) out.push('G3 첫 그림 alt 없음');
    // [놀쿨34-1 · G3 · 속도] 첫 그림을 <picture> 로 감쌌으면 — source 는 같은 카드의 가벼운 판(<og 이름>-w1200.webp) 하나뿐 · 있는 파일 · 치수 = og 파일
    //   (source 가 없는 파일이면 webp 를 아는 브라우저에서는 그림이 깨진다 — <img src> 로 물러나지 않는다)
    const picHead = (body.slice(Math.max(0, body.indexOf(img) - 600), body.indexOf(img)).match(/<picture>((?:\s*<source\b[^>]*>)+)\s*$/) || [])[1];
    if (picHead && og) {
      const srcs = [...picHead.matchAll(/<source\b[^>]*>/g)].map((m) => m[0]);
      const want = og.replace(/\.jpe?g$/i, '-w1200.webp');
      const ss = sameOriginPath((attr(srcs[0], 'srcset') || '').trim());
      if (srcs.length !== 1) out.push(`G3 첫 그림 가벼운 판 source ${srcs.length}개(1개만)`);
      else if (attr(srcs[0], 'type') !== 'image/webp' || ss !== want) out.push(`G3 첫 그림 가벼운 판 ≠ 같은 카드 (${ss.slice(0, 50)})`);
      else {
        const light = imageSize(path.join(dist, decodeURIComponent(want))), real = imageSize(path.join(dist, decodeURIComponent(og)));
        if (!light) out.push('G3 첫 그림 가벼운 판 파일 없음');
        else if (real && (light.w !== real.w || light.h !== real.h)) out.push(`G3 가벼운 판 치수 ${light.w}x${light.h} ≠ og 파일 ${real.w}x${real.h}`);
      }
    }
  }
  // G4 — AI 자격(스니펫을 막는 것 0) · hreflang 0
  const hl = (html.match(/<link[^>]*\shreflang=/g) || []).length;
  if (hl) out.push(`G4 hreflang ${hl}줄(한국어 한 판 — 0 이어야)`);
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '';
  if (/nosnippet/.test(robots) || /\sdata-nosnippet/.test(html)) out.push('G4 nosnippet');
  { const ms = robots.match(/max-snippet:\s*(-?\d+)/); if (ms && ms[1] !== '-1') out.push(`G4 max-snippet ${ms[1]}(-1 만)`); }
  if (/<meta name="rating"/i.test(html)) out.push('G4 rating 메타');
  if (!noindex && !/max-image-preview:large/.test(robots)) out.push('G4 max-image-preview:large 없음');
  // G6 — 날짜
  const visible = strip(body);
  const checked = [...visible.matchAll(/정보 확인\s*:\s*(\S{0,12})/g)].map((m) => m[1]); // 「정보 확인: 날짜」 꼴(쌍점 있는 표기)만 센다
  const slug = type === 'venue' ? (route.split('/').filter(Boolean).pop() || '') : ''; // 주소의 마지막 토막을 읽기만 한다(주소를 바꾸는 코드 아님)
  const prov = ctx.prov || PLACES_PROV;
  const today = ctx.today || new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const want = slug && prov[slug] && /^\d{4}-\d{2}-\d{2}$/.test(String(prov[slug].fetchedAt || '')) && String(prov[slug].fetchedAt) <= today ? String(prov[slug].fetchedAt) : '';
  if (checked.length > 1) out.push(`G6 「정보 확인」 ${checked.length}곳(쪽에 1곳)`);
  if (checked.length === 1 && !/^\d{4}-\d{2}-\d{2}$/.test(checked[0])) out.push(`G6 「정보 확인」 날짜 꼴 아님 (${checked[0]})`);
  if (checked.length >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(checked[0])) {
    if (checked[0] > today) out.push(`G6 「정보 확인」 미래 날짜 ${checked[0]}`);
    if (!want) out.push('G6 「정보 확인」 날짜가 있는데 출처 장부에 확인일이 없음(지어낸 날짜)');
    else if (checked[0] !== want) out.push(`G6 「정보 확인」 ${checked[0]} ≠ 장부 ${want}`);
  }
  if (want && checked.length === 0) out.push(`G6 「정보 확인」 없음(장부 확인일 ${want})`);
  if (/콘텐츠 최근 갱신\s*\d{4}-\d{2}-\d{2}|마지막 업데이트\s*\d{4}-\d{2}-\d{2}/.test(visible)) out.push('G6 빌드 날짜 문구(「최근 갱신 <날짜>」)');
  const lds = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean).flatMap((x) => (Array.isArray(x) ? x : (x['@graph'] || [x])));
  if (ctx.lastmod) {
    for (const k of ['last-modified', 'date']) { const v = (html.match(new RegExp(`<meta name="${k}" content="([^"]*)"`)) || [])[1]; if (v !== undefined && v !== ctx.lastmod) out.push(`G6 날짜 메타 ${k} ${v} ≠ lastmod ${ctx.lastmod}`); }
    for (const ld of lds) if (/Article/.test(String(ld['@type'])) && ld.dateModified) { const exp = ld.datePublished && String(ld.datePublished) > ctx.lastmod ? String(ld.datePublished) : ctx.lastmod; if (String(ld.dateModified) !== exp) out.push(`G6 dateModified ${ld.dateModified} ≠ 바뀐 날 ${exp}`); }
    const amt = (html.match(/<meta property="article:modified_time" content="([^"]*)"/) || [])[1];
    const apt = (html.match(/<meta property="article:published_time" content="([^"]*)"/) || [])[1];
    if (amt !== undefined) { const exp = apt && apt > ctx.lastmod ? apt : ctx.lastmod; if (amt !== exp) out.push(`G6 article:modified_time ${amt} ≠ 바뀐 날 ${exp}`); }
  }
  // G7 — 구조화 데이터
  const fileOk = (u) => { const p = sameOriginPath(u); if (!p.startsWith('/')) return true; try { return fs.existsSync(path.join(dist, decodeURIComponent(p))); } catch { return false; } };
  for (const ld of lds) {
    const t = String(ld['@type']);
    if (/NightClub|BarOrPub|EntertainmentBusiness|Restaurant|LocalBusiness/.test(t)) {
      if (ld.telephone !== undefined && !/^\+82-\d{1,2}-\d{3,4}-\d{4}$/.test(String(ld.telephone))) out.push(`G7 전화 국제 표기 아님 (${ld.telephone})`);
      if (ld.address && ld.address.addressCountry !== 'KR') out.push('G7 addressCountry ≠ KR');
      if (ld.priceRange !== undefined && String(ld.priceRange).length >= 100) out.push('G7 priceRange 100자 이상'); // 구글 local-business 원문: 100자 **미만**이어야 한다(「must be shorter than 100 characters」 · 100자부터 표시 안 함)
      const sp = Array.isArray(ld.openingHoursSpecification) ? ld.openingHoursSpecification : (ld.openingHoursSpecification ? [ld.openingHoursSpecification] : []);
      const late = sp.filter((s) => /^(23:59|24:00)$/.test(String(s.closes)) && String(s.opens) >= '12:00'), early = sp.filter((s) => String(s.opens) === '00:00' && String(s.closes) <= '12:00');
      if (late.length && early.length) out.push('G7 자정 넘는 영업을 둘로 쪼갬(spec 하나로)');
    }
    if (t === 'Organization' && route !== '/') out.push('G7 홈 밖 쪽의 Organization(맨 위 항목)');
    const logo = ld.logo ? (typeof ld.logo === 'string' ? ld.logo : ld.logo.url) : (ld.publisher && ld.publisher.logo ? (typeof ld.publisher.logo === 'string' ? ld.publisher.logo : ld.publisher.logo.url) : '');
    if (logo && !fileOk(logo)) out.push(`G7 logo 파일 없음 (${sameOriginPath(logo)})`);
  }
  return out;
}
export function contactProblems(html, route = '') {
  const noJs = html.replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  const nums = [...new Set([...noJs.matchAll(PHONE_RE)].map((m) => m[0].replace(/\D/g, '')))];
  const tels = [...new Set([...noJs.matchAll(/href="tel:([^"]+)"/g)].map((m) => m[1].replace(/\D/g, '')))];
  const here = String(route).replace(/\/?$/, '/');
  const pageOnlyOk = (n) => { const p = PAGE_ONLY.get(n); return !!p && p.pages.has(here); }; // [놀쿨26-1] 놀쿨 명단 번호는 적힌 쪽에서만
  const off = [...new Set([...nums, ...tels])].filter((n) => (PAGE_ONLY.has(n) ? !pageOnlyOk(n) : !ALLOWED_PHONES.has(n)));
  const words = FORBIDDEN_WORDS.filter((w) => noJs.includes(w));
  for (const m of noJs.matchAll(NICK_NEAR_NUMBER_RE)) {
    const n = m[0].replace(/\D/g, '');
    if (pageOnlyOk(n) && m[1] === PAGE_ONLY.get(n).nick) continue; // 놀쿨 명단의 닉네임+번호 꼴은 그 쪽에서만 통과
    words.push(m[0]); break;
  }
  const ilsan = [...new Set([...nums, ...tels])].includes(ILSAN_PHONE);
  return { off, words, ilsan };
}
const NAVER_RE = /searchadvisor\.naver|naver\.com\/.*(request|submit)|Yeti.{0,20}Disallow/i;
// [놀쿨11-3] 세이프서치 안전 — 구글 「선정적인 콘텐츠」 기준(노골적 성적 콘텐츠·과도한 노출·성매매 알선)에 걸릴 표현 + 저장소 위험어(dist-audit DANGEROUS 미러)
const SAFESEARCH_RE = /성관계|성행위|(?<![가-힣])섹스(?![가-힣])|포르노|음란|야동|알몸|나체|누드|노출\s?사진|성인용품|(?<![가-힣])자위(?![가-힣])|매춘|성매매|출장\s?안마|조건\s?만남|(?<![가-힣])오피(?![가-힣스])|안마방|풀싸롱|텐프로|2차\s*(서비스|모임|콜|가능|가격|비용|진행|연계|약속|장소)|밤\s?문화|유흥|룸\s?살롱|룸\s?싸롱|노래\s?방(?!송)|초이스/;
const FAKE_PROPS_RE = /"(aggregateRating|review|reviewRating|ratingValue|reviewCount)"\s*:/;
const HUB_LINK_RE = /href="\/(region|near|tag|best|new)\/|href="\/(clubs|nights|lounges|rooms|yojeong|hoppa)\/?"/;
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
  // [놀쿨34-1 · C5] 예전 규칙 「H2 H1 이 제목과 같으면 막음」은 없앴다 — 이제는 거꾸로 H1 = 제목이어야 한다(아래 exposureProblems 의 G2)
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
  { const cp = contactProblems(html, route); if (cp.off.length) block.push(`A2 명단 밖 번호 ${cp.off.join(',')}`); if (cp.words.length) block.push(`A3 금지 낱말 ${cp.words.join(',')}`); if (cp.ilsan && !ILSAN_ROUTES.has(route.replace(/\/?$/, '/'))) block.push('A4 일산 총책임자 번호는 일산 두 가게 쪽에만'); }
  { const ip = imageProblems(html, ctx.dist || DIST); if (ip.photos.length) block.push(`A5 판정표 밖 가게 사진 ${ip.photos.slice(0, 3).join(',')}`); if (ip.bad.length) block.push(`A5 금지 그림 ${ip.bad.slice(0, 3).join(',')}`); }
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
  // [놀쿨11-3] 구조화 데이터·노출 기반
  const rawLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (rawLd.some((x) => { try { JSON.parse(x); return false; } catch { return true; } })) block.push('J1 JSON-LD 파싱 오류');
  const ldTypes = lds.filter(Boolean).map((x) => String(x['@type']));
  const need = { venue: [/NightClub|BarOrPub|EntertainmentBusiness|Restaurant|LocalBusiness/, /BreadcrumbList/], list: [/CollectionPage|ItemList/, /BreadcrumbList/], hub: [/CollectionPage|ItemList/, /BreadcrumbList/], magazine: [/Article/, /BreadcrumbList/], community: [/CollectionPage|WebPage/, /BreadcrumbList/], guide: [route === '/' ? /WebSite/ : /WebPage|CollectionPage|FAQPage|Restaurant/, route === '/' ? /Organization/ : /BreadcrumbList/] };
  for (const re of (need[type] || [])) if (!ldTypes.some((t) => re.test(t))) block.push(`J2 마크업 없음 ${re.source.slice(0, 30)}`);
  const pageText = strip(html);
  for (const ld of lds.filter(Boolean)) {
    if (/NightClub|BarOrPub|EntertainmentBusiness|Restaurant/.test(String(ld['@type']))) {
      if (ld.name && !pageText.includes(ld.name)) block.push(`J3 LD name 「${ld.name}」 본문에 없음`);
      if (ld.telephone && !hasTel && !pageText.includes(String(ld.telephone).replace(/^\+82-?/, '0'))) block.push('J3 LD telephone 이 본문(tel 링크·번호 글자)에 없음');
      if (ld.openingHoursSpecification && !/영업시간|영업 시간|24시간/.test(pageText)) block.push('J3 LD 영업시간 있는데 본문에 영업시간 없음');
      if (ld.address && ld.address.streetAddress && !pageText.includes(String(ld.address.streetAddress).slice(0, 8))) block.push('J3 LD 주소가 본문에 없음');
    }
    if (String(ld['@type']) === 'BreadcrumbList') { const last = (ld.itemListElement || []).slice(-1)[0]; if (last && last.item && decodeURIComponent(String(last.item).replace(/\/$/, '')) !== decodeURIComponent(want.replace(/\/$/, ''))) block.push(`J3 Breadcrumb 마지막 ≠ 주소 (${last.item})`); }
    if (String(ld['@type']) === 'DiscussionForumPosting' && !/data-nc-posts="[1-9]/.test(html)) block.push('J5 글 0 인 쪽에 DiscussionForumPosting');
  }
  if (rawLd.some((x) => FAKE_PROPS_RE.test(x))) block.push('J4 평점·후기 속성(가짜 0 규칙)');
  for (const k of ['og:title', 'og:description', 'og:image']) if (!new RegExp(`<meta property="${k}" content="[^"]+"`).test(html)) block.push(`O1 ${k} 없음`);
  // [놀쿨34-1] 노출34 연구표 G2~G7(제목 = h1 = og:title · 첫 그림 = og 파일 · hreflang 0 · 날짜 · 구조화 값)
  for (const b of exposureProblems(html, { route, type, dist: ctx.dist || DIST, lastmod: ctx.lastmod, today: ctx.today, prov: ctx.prov })) block.push(b);
  if (SAFESEARCH_RE.test(bodyText) || SAFESEARCH_RE.test(title) || SAFESEARCH_RE.test(desc)) block.push(`S4 세이프서치 위험 표현 「${(bodyText.match(SAFESEARCH_RE) || title.match(SAFESEARCH_RE) || desc.match(SAFESEARCH_RE) || [''])[0]}」`);
  const art = (html.match(/<article id="nc-article"[\s\S]*?<\/article>/) || [''])[0];
  const artLinks = new Set([...art.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, '')));
  // 링크 문턱은 유형별 — 가게·목록·허브 10(막음) · 매거진·커뮤니티·가이드 6(막음) · 허브 링크는 가게·목록·허브에서 막음, 나머지는 품질(「다음에 볼 곳」은 11-4 가 채운다)
  const linkMin = type === 'venue' ? 10 : 6; // 목록·허브는 업소 1~2곳짜리가 있어 6(「다음에 볼 곳」 채우기는 11-4)
  if (art && artLinks.size < linkMin) block.push(`L3 본문 내부 링크 ${artLinks.size} < ${linkMin}`);
  if (art && !HUB_LINK_RE.test(art)) { if (type === 'venue' || type === 'list' || type === 'hub') block.push('L4 허브(지역·업종) 링크 없음'); else quality.push('L4 허브 링크 없음(11-4 다음에 볼 곳)'); }
  // [놀쿨11-4] 다음에 볼 곳 모듈
  // 변형 엔진이 ul→ol·li→p·div 로 바꾸므로 닫는 태그로 자르지 않는다 — nav 안의 data-nc-module 항목을 직접 센다
  const nextNav = (art.match(/<nav[^>]*data-skel="next"[\s\S]*$/) || [''])[0];
  const modHrefs = [...nextNav.matchAll(/data-nc-module="[^"]*"[^>]*>\s*<a[^>]*href="([^"#]+)"/g)].map((m) => m[1].replace(/\/$/, ''));
  const nextList = nextNav;
  if (new Set(modHrefs).size !== modHrefs.length) block.push('M1 다음에 볼 곳 안 같은 주소 2번');
  if (type === 'venue' && modHrefs.length < 7) block.push(`M2 가게 쪽 다음에 볼 곳 ${modHrefs.length}칸 < 7`);
  if (/<a\s[^>]*target="_blank"/.test(nextList)) block.push('M3 다음에 볼 곳 새 창');
  if (type === 'venue' && !/data-nc-save="/.test(art)) block.push('M4 가게 쪽 저장 버튼 없음');
  // 품질
  if (artLinks.size < 12 || artLinks.size > 25) quality.push(`Q4 본문 내부 링크 ${artLinks.size}(목표 12~25)`);
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
  // [놀쿨34-1 · G6] 쪽마다의 lastmod(사이트맵) — 머리 날짜 메타·매거진 수정일이 이 값과 같은지 본다
  const lastmodOf = new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => { const r = m[1].replace(/^https?:\/\/[^/]+/, ''); return [r === '/' ? '/' : r.replace(/\/$/, ''), m[2]]; }));
  const results = pages.map((p) => (p.missing ? { route: p.route, block: ['F0 파일 없음'], quality: [] } : gatePage(p.html, { route: p.route, registry, lastmod: lastmodOf.get(p.route) })));
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
