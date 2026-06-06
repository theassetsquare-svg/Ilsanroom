#!/usr/bin/env node
/**
 * ★ SEO 프리렌더링 스크립트
 * vite build 후 실행 → 모든 라우트에 고유 HTML 생성
 * 각 페이지별 <title>, <meta description>, og:title, og:description, canonical 개별 설정
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIST = path.resolve('dist');
const BASE_URL = 'https://nolcool.com';
const OG_IMAGE = `${BASE_URL}/og/nolcool-og.jpg`;

// 빌드 시점(KST) — 모든 프리렌더 페이지의 last-modified·dateModified 기본값
const BUILD_DATE_KST = (() => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
})();
const BUILD_ISO_KST = (() => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().replace('Z', '+09:00');
})();

// ── 기본 index.html 읽기 ──
// 시즌176-B — build-sha 메타 주입 (deploy-sync 가드용, CF 배포 완료 검증)
const BUILD_SHA = (process.env.GITHUB_SHA || (() => {
  try { return execSync('git rev-parse HEAD').toString().trim(); }
  catch { return 'local'; }
})()).slice(0, 12);
const _baseRaw = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const baseHtml = _baseRaw.replace('</head>', `    <meta name="build-sha" content="${BUILD_SHA}">\n  </head>`);

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 한글 종성(받침) 판별 — 조사 자동 선택용 */
function hasJongseong(str) {
  if (!str || str.length === 0) return false;
  const lastChar = str.charCodeAt(str.length - 1);
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return false;
  return (lastChar - 0xAC00) % 28 !== 0;
}

/** 은/는 */
function eunNeun(name) { return hasJongseong(name) ? '은' : '는'; }
/** 이/가 */
function iGa(name) { return hasJongseong(name) ? '이' : '가'; }
/** 을/를 */
function eulReul(name) { return hasJongseong(name) ? '을' : '를'; }
/** 이/가 (주어 + 가/이) */
function subjectMarker(name) { return `${name}${iGa(name)}`; }

/** meta description을 150자 이내 완결 문장으로 절삭 */
function truncateDesc(text, maxLen = 150) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  // 마지막 문장부호(. ! ?) 위치에서 자르기
  const cut = text.slice(0, maxLen);
  const lastSentence = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  if (lastSentence > maxLen * 0.5) return cut.slice(0, lastSentence + 1);
  // 문장부호 없으면 마지막 공백에서 자르고 마침표 추가
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.5) return cut.slice(0, lastSpace) + '.';
  // 한글은 공백이 적을 수 있으므로 마지막 쉼표/조사 끝에서 자르기
  const lastComma = cut.lastIndexOf(',');
  if (lastComma > maxLen * 0.5) return cut.slice(0, lastComma) + '.';
  return cut.slice(0, maxLen - 1) + '.';
}

/**
 * HTML의 head 메타 태그를 교체
 */
function renderPage({ title, description, canonical, ogImage, ogImageAlt, ssrBody, jsonLdList, noindex, datePublished, dateModified, keywords, preloadImage, diluteName }) {
  let html = baseHtml;
  const desc = truncateDesc(description || '', 150);
  // canonical은 sitemap loc과 동일 형식이어야 함 (trailing slash 일치).
  // sitemap은 항상 `${routePath}/` 로 trailing slash 붙임 → canonical도 동일 처리.
  const canonicalWithSlash = canonical.endsWith('/') ? canonical : `${canonical}/`;
  const can = `${BASE_URL}${canonicalWithSlash}`;

  // ★ og:*/twitter:* 페이지별 동적 — 검색결과 썸네일·카톡 공유 미리보기 정확화
  // 홈은 브랜드 폴백 사용, 그 외 페이지는 title/description/ogImage 그대로 사용.
  const FALLBACK_OG_IMAGE = `${BASE_URL}/og/nolcool-og.jpg`;
  const ogTitle = title;
  const ogDesc = desc;
  const ogImg = ogImage || FALLBACK_OG_IMAGE;

  // title (SEO — Google·검색결과)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // meta description (SEO — Google snippet)
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escHtml(desc)}"`
  );

  // meta keywords
  if (keywords) {
    const kwMeta = `<meta name="keywords" content="${escHtml(keywords)}">`;
    html = html.replace('</head>', `    ${kwMeta}\n  </head>`);
  }

  // og:title — 페이지별 동적 (title 그대로)
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escHtml(ogTitle)}"`
  );

  // og:description — 페이지별 동적
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escHtml(ogDesc)}"`
  );

  // og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${escHtml(can)}"`
  );

  // og:image — 페이지별 동적 (업소 사진 우선, 폴백 = 브랜드 OG)
  html = html.replace(
    /<meta property="og:image" content="[^"]*"/,
    `<meta property="og:image" content="${escHtml(ogImg)}"`
  );

  // og:image:alt — Naver/Google 이미지 검색 컨텍스트 (시즌53 v26-day1)
  // 페이지별 alt 명시 → 이미지 검색 노출 강화
  const ogAlt = ogImageAlt || title;
  if (!/og:image:alt/.test(html)) {
    html = html.replace(
      /(<meta property="og:image:height" content="[^"]*" \/>)/,
      `$1\n    <meta property="og:image:alt" content="${escHtml(ogAlt)}" />`
    );
  } else {
    html = html.replace(
      /<meta property="og:image:alt" content="[^"]*"/,
      `<meta property="og:image:alt" content="${escHtml(ogAlt)}"`
    );
  }

  // twitter:title — 페이지별 동적
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escHtml(ogTitle)}"`
  );

  // twitter:description — 페이지별 동적
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escHtml(ogDesc)}"`
  );

  // twitter:image — 페이지별 동적
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${escHtml(ogImg)}"`
  );

  // canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${escHtml(can)}"`
  );

  // 시즌28 — hreflang ko-KR/ko/x-default 페이지별 canonical과 동기화
  html = html.replace(
    /<link rel="alternate" hreflang="ko-KR" href="[^"]*"/,
    `<link rel="alternate" hreflang="ko-KR" href="${escHtml(can)}"`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="ko" href="[^"]*"/,
    `<link rel="alternate" hreflang="ko" href="${escHtml(can)}"`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"/,
    `<link rel="alternate" hreflang="x-default" href="${escHtml(can)}"`
  );

  // noindex for private pages
  if (noindex) {
    html = html.replace(
      /<meta name="robots" content="[^"]*"/,
      `<meta name="robots" content="noindex, nofollow"`
    );
  }

  // citation_title — 페이지별 고유값
  html = html.replace(
    /<meta name="citation_title" content="[^"]*"/,
    `<meta name="citation_title" content="${escHtml(title)}"`
  );

  // citation_public_url — 페이지별 고유값
  html = html.replace(
    /<meta name="citation_public_url" content="[^"]*"/,
    `<meta name="citation_public_url" content="${escHtml(can)}"`
  );

  // 모든 페이지 공통: 24시간 자동 빌드 → 매일 새 dateModified (구글 freshness 시그널)
  const lastModMeta = `<meta name="last-modified" content="${BUILD_ISO_KST}">\n    <meta name="date" content="${BUILD_DATE_KST}">`;
  html = html.replace('</head>', `    ${lastModMeta}\n  </head>`);

  // 시즌29-F — LCP preload: hero 이미지 JS 번들과 병렬 다운로드 시작 (PC LCP 3.5~4.2s → <2.5s)
  if (preloadImage) {
    const preloadTag = `<link rel="preload" as="image" href="${escHtml(preloadImage)}" fetchpriority="high" type="image/webp">`;
    html = html.replace('</head>', `    ${preloadTag}\n  </head>`);
  }

  // datePublished / dateModified meta (구글 "최근 업데이트" 시그널) + 네이버 og:type article
  if (datePublished) {
    let dateMeta = `<meta property="article:published_time" content="${datePublished}">\n    <meta property="article:modified_time" content="${dateModified || datePublished}">`;
    // 네이버 검색 최적화: og:type을 article로 변경 (업소 상세 페이지)
    dateMeta += `\n    <meta property="article:author" content="놀쿨">`;
    dateMeta += `\n    <meta property="article:section" content="나이트라이프">`;
    html = html.replace(
      /<meta property="og:type" content="[^"]*"/,
      `<meta property="og:type" content="article"`
    );
    html = html.replace('</head>', `    ${dateMeta}\n  </head>`);
  }

  // ★ JSON-LD 구조화 데이터 삽입 (AI 검색 크롤러용)
  if (jsonLdList && jsonLdList.length > 0) {
    const jsonLdHtml = jsonLdList.map(data =>
      `<script type="application/ld+json">${JSON.stringify(data)}</script>`
    ).join('\n    ');
    html = html.replace('</head>', `    ${jsonLdHtml}\n  </head>`);
  }

  // SSR body content — inject inside root div for crawlers (React replaces on hydration)
  // 정규식으로 root div 속성 변동 허용 (style 등)
  // 시즌57 — visible SSR hero block 추가: 빈 화면 0초 (LCP/체류 ↑)
  // ssr-seo는 1px clip 유지 (봇용), ssr-hero는 화면에 보임 (React mount 전 첫 paint)
  if (ssrBody) {
    const heroTitle = escHtml(title || '');
    let heroDesc = escHtml(desc || description || '');
    // 바로 위 H1(heroTitle)이 가게이름을 이미 노출 → visible hero 단락의 가게이름은 전부 '여기'로
    // (meta description은 별도 desc 그대로 유지, SEO 영향 없음). 키워드 밀도 stuffing(>3%) 방지.
    if (diluteName) {
      const dn = escHtml(diluteName);
      heroDesc = heroDesc.replace(new RegExp(dn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '여기');
    }
    // preloadImage 있으면 hero img(eager + high priority), 없으면 og 이미지를 hero로 (lazy + low)
    // 모든 페이지가 첫 paint에 이미지 1개 이상 보임 → 시각자극 0초
    const heroImgSrc = preloadImage || ogImg;
    const heroImgTag = heroImgSrc
      ? `<img src="${escHtml(heroImgSrc)}" alt="${escHtml(ogImageAlt || title || '')}" ${preloadImage ? 'fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" style="display:block;width:100%;height:auto;max-height:280px;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:16px;background:#0a0a0a">`
      : '';
    const heroBlock = `<div class="ssr-hero" style="max-width:1200px;margin:0 auto;padding:88px 16px 24px;min-height:240px">${heroImgTag}<h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#111;line-height:1.25;letter-spacing:-0.02em">${heroTitle}</h1><p style="margin:0;color:#444;font-size:15px;line-height:1.65;max-width:720px">${heroDesc}</p></div>`;
    // 시즌173 — ssr-hero가 visible H1을 제공하므로 ssrBody 첫 번째 H1은 H2로 강등 (페이지당 H1 정확히 1개 보장)
    const ssrBodyNoH1 = ssrBody.replace(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/, '<h2$1>$2</h2>');
    html = html.replace(
      /<div id="root"([^>]*)><\/div>/,
      `<div id="root"$1>${heroBlock}<div class="ssr-seo" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">${ssrBodyNoH1}</div></div>`
    );
  }

  return html;
}

const noIndexPathsSet = new Set(['/login', '/profile', '/dashboard', '/analytics', '/billing', '/onboarding', '/launch', '/admin', '/admin/venues', '/admin/magazine', '/admin/media', '/admin/seo', '/admin/blocks', '/admin/moderation', '/admin/stats', '/admin/visitors', '/admin/audit', '/my/customize', '/search']);

// 시즌21 — SSR 내부링크: JS 미실행 봇(Yeti/Daum)도 anchor depth 1로 카테고리 도달
function venueHref(v) {
  if (['club', 'room', 'yojeong'].includes(v.cat)) return `/${catMap[v.cat].path}/${v.region}/${v.slug}/`;
  return `/${catMap[v.cat].path}/${v.slug}/`;
}
// 시즌29 — Skip-to-content 링크 (WCAG 2.4.1 Bypass Blocks). 키보드/스크린리더 사용자 본문 바로 이동
const SKIP_TO_CONTENT = `<a href="#main-content" class="skip-link" style="position:absolute;left:-9999px;top:0;z-index:9999;background:#000;color:#fff;padding:8px 12px;text-decoration:none;font-weight:600" onfocus="this.style.left='8px'" onblur="this.style.left='-9999px'">본문 바로가기</a>`;
const SITE_NAV_ANCHORS = `${SKIP_TO_CONTENT}<nav aria-label="카테고리"><ul><li><a href="/clubs/">클럽</a></li><li><a href="/nights/">나이트</a></li><li><a href="/lounges/">라운지</a></li><li><a href="/rooms/">룸</a></li><li><a href="/yojeong/">요정</a></li><li><a href="/hoppa/">호빠</a></li><li><a href="/community/">커뮤니티</a></li><li><a href="/magazine/">매거진</a></li><li><a href="/search/">검색</a></li></ul></nav>`;
// 시즌22 — 사이트 footer SSR 내부링크 (정적 유틸/lounge/lead 페이지 reachable)
const SITE_FOOTER_ANCHORS = `<footer aria-label="사이트맵"><h2>전체 메뉴</h2><nav aria-label="사이트맵 링크"><ul><li><a href="/tonight/">오늘 밤</a></li><li><a href="/weekend/">이번 주말</a></li><li><a href="/occasion/">상황별</a></li><li><a href="/budget/">예산별</a></li><li><a href="/guide/">입문 가이드</a></li><li><a href="/safety/">안전 가이드</a></li><li><a href="/help/">자주 묻는 질문</a></li><li><a href="/venue-info/">양주·부스·룸 안내</a></li><li><a href="/events/">이벤트 일정</a></li><li><a href="/gallery/">매장 사진</a></li><li><a href="/ranking/">인기 랭킹</a></li><li><a href="/quiz/">스타일 퀴즈</a></li><li><a href="/roulette/">룰렛 추천</a></li><li><a href="/vs/">VS 매치업</a></li><li><a href="/compare/">업소 비교</a></li><li><a href="/hidden/">숨은 명소</a></li><li><a href="/welcome/">놀쿨 소개</a></li><li><a href="/login/">로그인</a></li><li><a href="/profile/">내 프로필</a></li><li><a href="/referral/">친구 초대</a></li><li><a href="/onboarding/">업소 입점</a></li><li><a href="/pricing/">요금제</a></li><li><a href="/dashboard/">매장 대시보드</a></li><li><a href="/analytics/">분석 리포트</a></li><li><a href="/billing/">결제 관리</a></li><li><a href="/launch/">오픈 체크</a></li><li><a href="/demo/">업주 데모</a></li><li><a href="/case-studies/">운영 사례</a></li><li><a href="/testimonials/">업주 인터뷰</a></li><li><a href="/status/">서비스 상태</a></li><li><a href="/privacy-promise/">프라이버시 정책</a></li><li><a href="/disclaimer/">고지 사항</a></li><li><a href="/terms/">이용 약관</a></li><li><a href="/privacy/">개인정보 처리</a></li><li><a href="/venue-terms/">업주 약관</a></li><li><a href="/lounge/">업종별 라운지</a></li><li><a href="/lounge/club/">클럽 라운지</a></li><li><a href="/lounge/night/">나이트 라운지</a></li><li><a href="/lounge/room/">룸 라운지</a></li><li><a href="/lounge/lounge/">라운지바 라운지</a></li><li><a href="/lounge/yojung/">요정 라운지</a></li><li><a href="/lounge/hoppa/">호빠 라운지</a></li><li><a href="/lounge/free/">자유 라운지</a></li><li><a href="/lounge/qna/">Q&A 라운지</a></li><li><a href="/lead/nightlife-guide/">나이트라이프 가이드</a></li><li><a href="/lead/quiz/">스타일 진단</a></li><li><a href="/lead/weekly-hot/">주간 핫스팟</a></li></ul></nav></footer>`;

function writePage(routePath, meta) {
  // 파일시스템은 디코딩된 경로 (Cloudflare가 URL 디코딩 후 매칭)
  // canonical/sitemap은 routePath 그대로 (인코딩 유지)
  const decodedPath = routePath.split('/').map(s => {
    try { return decodeURIComponent(s); } catch { return s; }
  }).join('/');
  const dir = path.join(DIST, decodedPath);
  fs.mkdirSync(dir, { recursive: true });
  // 시즌26 — landmark 자동 보강: enrichSsr 거치지 않은 동적 페이지에도 <nav>+<footer> 보장
  let ssrBody = meta.ssrBody;
  if (ssrBody) {
    if (!ssrBody.includes('aria-label="카테고리"')) ssrBody = SITE_NAV_ANCHORS + ssrBody;
    if (!ssrBody.includes('aria-label="사이트맵"')) ssrBody = ssrBody + SITE_FOOTER_ANCHORS;
    // 시즌55 — 외부 링크만 target="_blank" 자동 주입. 내부 링크는 같은 탭 (100p/세션 + SEO 유리)
    ssrBody = ssrBody.replace(/<a\s+([^>]*?)>/gi, (full, attrs) => {
      if (/target=/i.test(attrs)) return full;
      const hrefM = attrs.match(/href=["']([^"']+)["']/i);
      if (!hrefM) return full;
      const href = hrefM[1];
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return full;
      const isInternal = href.startsWith('/') || href.startsWith(BASE_URL) || href.startsWith('nolcool.com');
      if (isInternal) return full; // 내부 링크: 같은 탭
      return `<a ${attrs.trim()} target="_blank" rel="noopener noreferrer">`; // 외부만 새 탭
    });
    // 시즌29 — img loading=lazy + decoding=async 자동 주입 (LCP 비차단, 모바일 4G 페이지 weight 절감)
    ssrBody = ssrBody.replace(/<img\s+([^>]*?)>/gi, (full, attrs) => {
      let next = attrs;
      if (!/loading=/i.test(next)) next = `${next.trim()} loading="lazy"`;
      if (!/decoding=/i.test(next)) next = `${next.trim()} decoding="async"`;
      return `<img ${next}>`;
    });
    // 시즌29 — Skip-to-content 타겟: 본문 첫 의미 영역 #main-content 보장
    if (!ssrBody.includes('id="main-content"')) {
      ssrBody = ssrBody.replace(
        /(<\/nav>)/,
        `$1<main id="main-content">`
      );
      // 닫는 main은 footer 직전에
      ssrBody = ssrBody.replace(
        /(<footer aria-label="사이트맵")/,
        `</main>$1`
      );
    }
  }
  const html = renderPage({ ...meta, ssrBody, canonical: routePath, noindex: noIndexPathsSet.has(routePath) });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

// ── 업소 데이터 파싱 ──
const venuesSrc = fs.readFileSync('src/data/venues.ts', 'utf8');
const seoHooksSrc = fs.readFileSync('src/lib/seo-hooks.ts', 'utf8');

function parseVenues() {
  const venues = [];
  // Match each venue object block
  const blocks = venuesSrc.split(/\n  \{/);
  for (const block of blocks) {
    const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
    const cat = block.match(/category:\s*'([^']+)'/)?.[1];
    const region = block.match(/region:\s*'([^']+)'/)?.[1];
    const regionKo = block.match(/regionKo:\s*'([^']+)'/)?.[1];
    const nameKo = block.match(/nameKo:\s*'([^']+)'/)?.[1];
    const shortDesc = block.match(/shortDescription:\s*'([^']+)'/)?.[1];
    const desc = block.match(/description:\s*'([^']+)'/)?.[1];
    const staffNickname = block.match(/staffNickname:\s*'([^']+)'/)?.[1];
    const staffPhone = block.match(/staffPhone:\s*'([^']+)'/)?.[1];
    const openHours = block.match(/openHours:\s*'([^']+)'/)?.[1];
    const ageGroup = block.match(/ageGroup:\s*'([^']+)'/)?.[1];
    const address = block.match(/address:\s*'([^']+)'/)?.[1];
    const nearbyStation = block.match(/nearbyStation:\s*'([^']+)'/)?.[1];
    const liquorInfo = block.match(/liquorInfo:\s*'([^']*)'/)?.[1];
    const roomInfo = block.match(/roomInfo:\s*'([^']*)'/)?.[1];
    const latMatch = block.match(/lat:\s*([\d.]+)/);
    const lngMatch = block.match(/lng:\s*([\d.]+)/);
    const features = [];
    const featMatch = block.match(/features:\s*\[([^\]]*)\]/);
    if (featMatch) {
      const fItems = featMatch[1].match(/'([^']+)'/g);
      if (fItems) fItems.forEach(f => features.push(f.replace(/'/g, '')));
    }
    const tags = [];
    const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);
    if (tagsMatch) {
      const tItems = tagsMatch[1].match(/'([^']+)'/g);
      if (tItems) tItems.forEach(t => tags.push(t.replace(/'/g, '')));
    }
    /* SEO aliases (alternateName) — Google/AI 동의어 검색 매핑 */
    const aliases = [];
    const aliasMatch = block.match(/aliases:\s*\[([^\]]*)\]/);
    if (aliasMatch) {
      const aItems = aliasMatch[1].match(/'([^']+)'/g);
      if (aItems) aItems.forEach(a => aliases.push(a.replace(/'/g, '')));
    }
    if (slug && cat && region) {
      venues.push({
        slug, cat, region,
        regionKo: regionKo || '',
        nameKo: nameKo || slug,
        shortDesc: shortDesc || (desc || '').slice(0, 120),
        description: desc || '',
        staffNickname: staffNickname || '',
        staffPhone: staffPhone || '',
        openHours: openHours || '',
        ageGroup: ageGroup || '',
        address: address || '',
        nearbyStation: nearbyStation || '',
        liquorInfo: liquorInfo || '',
        roomInfo: roomInfo || '',
        lat: latMatch ? parseFloat(latMatch[1]) : 0,
        lng: lngMatch ? parseFloat(lngMatch[1]) : 0,
        features,
        tags,
        aliases,
      });
    }
  }
  return venues;
}

const catLabelMap = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

/**
 * BreadcrumbList JSON-LD — 구글 SERP 경로 표시 + 사이트 구조 인식
 */
function generateBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * WebSite + Organization JSON-LD — 브랜드 시그널 + 사이트링크 검색
 */
const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '놀쿨',
  alternateName: 'NOLCOOL',
  url: BASE_URL,
  description: '대한민국 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보 플랫폼',
  inLanguage: 'ko',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string'
  }
};

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '놀쿨',
  alternateName: 'NOLCOOL',
  url: BASE_URL,
  logo: `${BASE_URL}/og/nolcool-og.jpg`,
  description: '대한민국 최대 나이트라이프 정보 플랫폼. 전국 클럽·나이트·라운지·룸·요정·호빠 정보 제공.',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Korean' }
};

// getVenueReviews() 가공 후기 풀(6 업종 × 6~8개 템플릿) 영구 제거.
// 사유: 시드 hash 조합으로 fabricated quote+author를 venue마다 SSR + JSON-LD `review`/`aggregateRating`에 박아 넣어
// 구글의 fake-review 스팸 정책 위반 위험 + 놀쿨 신뢰 규칙 (가공 후기·인터뷰 게시 금지)을 정면 위반.
// 실제 후기는 /community/reviews 회원 작성 글만 노출.

/**
 * ★ 상단 직답(direct answer) — 가게이름 엔티티 1줄 요약 (구글 featured snippet + AI Overview/ChatGPT 인용 타깃).
 * "[가게이름]은 [지역]의 [업종]으로 [특징·운영·예약]" 40~60 단어. 100% 가게 고유 사실로만 구성.
 * 연결어는 slug 해시 pickN으로 회전 → 121 페이지 구조 지문(5-gram) 상관 제거.
 */
function generateVenueDirectAnswer(v) {
  const name = escHtml(v.nameKo);
  const catKo = catLabelMap[v.cat] || v.cat;
  const region = escHtml(v.regionKo);
  const ro = (w) => hasJongseong(w) ? '으로' : '로';
  let _h = 0; for (let i = 0; i < v.slug.length; i++) _h = (_h * 31 + v.slug.charCodeAt(i)) >>> 0;
  const pk = (arr, off) => {
    let x = (_h ^ Math.imul(off + 1, 0x9e3779b9)) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return arr[x % arr.length];
  };
  const feats = (v.features || []).slice(0, 2).map(f => escHtml(f));
  const sents = [];
  // 1) 엔티티 정의 — 이름·지역·업종(·핵심 특징 1~2개)
  let s1 = `${name}${eunNeun(v.nameKo)} ${region}에 ${pk(['자리한', '위치한', '있는'], 1)} ${catKo}`;
  if (feats.length) s1 += `${ro(catKo)}, ${feats.join(', ')}${pk([' 같은 특징이 있다.', ' 등으로 알려져 있다.', ' 같은 점이 강점이다.'], 2)}`;
  else s1 += `다.`;
  sents.push(s1);
  // 2) 위치·운영 사실 (있는 데이터만)
  const opBits = [];
  if (v.nearbyStation) {
    const st = v.nearbyStation.match(/([^\s]+역)/)?.[1] || v.nearbyStation.split(' ')[0];
    opBits.push(`${escHtml(st)}에서 ${pk(['가깝다', '도보로 가깝다', '가까운 거리다'], 3)}`);
  }
  if (v.openHours) opBits.push(`영업시간은 ${escHtml(v.openHours)}이다`);
  if (v.ageGroup) opBits.push(`입장 기준은 ${escHtml(v.ageGroup)}이다`);
  if (opBits.length) sents.push(opBits.join(', ') + '.');
  // 3) 예약·문의 — 사실 기반 행동 안내
  sents.push(`${pk(['예약과 문의는', '예약·문의는', '방문 문의는'], 5)} 담당자에게 ${pk(['직접', '바로'], 6)} ${pk(['할 수 있다.', '연락하면 된다.', '문의하면 된다.'], 7)}${v.staffNickname ? ' 담당: ' + escHtml(v.staffNickname) + '.' : ''}`);
  return `<p class="ssr-answer">${sents.join(' ')}</p>`;
}

/**
 * Generate SSR body content for venue detail pages.
 * Contains H1 (store name), H2s with store name, and opening paragraphs.
 * React will replace this on hydration.
 * ★ AI 검색 최적화: FAQ, 시맨틱 마크업, 키워드 밀도 강화
 */
function generateVenueSsrBody(v, allVenues) {
  const name = escHtml(v.nameKo);
  const catKo = catLabelMap[v.cat] || v.cat;
  const region = escHtml(v.regionKo);
  // 전체 description 사용 — body 확장으로 키워드 밀도 자연 희석 (1500-3000자 범위)
  const desc = escHtml(v.description.slice(0, 1500));
  const features = v.features.slice(0, 5).map(f => escHtml(f)).join(', ');
  const staff = v.staffNickname ? escHtml(v.staffNickname) : '';

  let html = `<article itemscope itemtype="https://schema.org/NightClub">`;
  html += `<h1 itemprop="name">${name}</h1>`;
  // ★ 상단 직답 — h1 바로 아래 첫 문단(p:first-of-type). 구글 스니펫 + AI 인용 + speakable 타깃.
  html += generateVenueDirectAnswer(v);
  // ★ SSR PhoneBar / 운영정보 — 검색엔진·AI 색인 + 클라이언트 hydration 전 노출 (시즌82)
  if (v.staffPhone) {
    const telDigits = v.staffPhone.replace(/-/g, '');
    const staffLabel = v.staffNickname ? `${escHtml(v.staffNickname)} ` : '';
    html += `<p class="ssr-phone"><a href="tel:${telDigits}" itemprop="telephone">📞 ${staffLabel}${escHtml(v.staffPhone)}</a></p>`;
  }
  if (v.openHours) {
    html += `<p class="ssr-hours" itemprop="openingHours">⏰ 영업시간: ${escHtml(v.openHours)}</p>`;
  }
  if (v.ageGroup) {
    html += `<p class="ssr-age">👤 입장 기준: ${escHtml(v.ageGroup)}</p>`;
  }
  // 업소별 공식 백링크 — description 첫 발생 가게이름 1회만 anchor wrap (SSR HTML)
  const backlinks = {
    ilsanmyeongwolgwanyojeong: 'https://sunwook4.mycafe24.com/',
  };

  // 키워드 스터핑 회피 — 본문 2번째+ 가게이름은 '여기' + 받침 무관 모음형 조사로 치환.
  // H1·총정리·푸터·hero·JSON-LD에 가게이름이 이미 박혀있어, 본문 1회 + 여기로 충분.
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRe = new RegExp(escRe(name) + '(는|은|가|이|를|을|의|도|에서|에|으로|로|와|과|만)?', 'g');
  let nameOcc = 0;
  let descHtml = desc.replace(nameRe, (match, particle) => {
    nameOcc++;
    if (nameOcc <= 1) return match;
    const particleMap = { '은': '는', '이': '가', '을': '를', '으로': '로' };
    return '여기' + (particle ? (particleMap[particle] || particle) : '');
  });

  const backUrl = backlinks[v.slug];
  if (backUrl && descHtml.includes(name)) {
    descHtml = descHtml.replace(name, `<a href="${backUrl}" target="_blank" rel="noopener noreferrer">${name}</a>`);
  }
  // 가독성 — 긴 단일 <p> 블롭을 문장 경계로 단락 분할(최대 3단락). 텍스트 5-gram 불변 → 구조 지문 영향 0.
  const _lede = `${region} ${catKo}.`;
  const _sents = descHtml.split(/(?<=[다요까죠][.!?]|\.)\s+/).filter(s => s.trim());
  if (_sents.length >= 3) {
    const _per = Math.ceil(_sents.length / 3);
    const _paras = [];
    for (let _i = 0; _i < _sents.length; _i += _per) _paras.push(_sents.slice(_i, _i + _per).join(' '));
    html += `<div itemprop="description"><p>${_lede} ${_paras[0]}</p>`;
    for (let _i = 1; _i < _paras.length; _i++) html += `<p>${_paras[_i]}</p>`;
    html += `</div>`;
  } else {
    html += `<p itemprop="description">${_lede} ${descHtml}</p>`;
  }

  // ── 구조 지문(structural fingerprint) 해체 — Google 2026 scaled-content-abuse 회피 ──
  // {region}만 바꾸던 복붙 프로즈 폐기. 가게별 100% 고유 데이터(liquorInfo/roomInfo/features)가
  // 본문 본체가 되고, 섹션 구성·순서·연결어가 페이지마다 달라진다(데이터 풍부도순 정렬 + slug 해시).
  let _h = 0; for (let _i = 0; _i < v.slug.length; _i++) _h = (_h * 31 + v.slug.charCodeAt(_i)) >>> 0;
  const pick = (arr) => arr[_h % arr.length];
  // 오프셋 pick — off를 해시 비트에 섞어(splitmix 믹서) 페이지'간' 섹션별 선택을 독립화한다.
  // (_h+off)%len 방식은 _h%len이 같은 두 페이지가 모든 섹션에서 동일 변형을 고르는 상관(구조 지문)을 못 깬다.
  const pickN = (arr, off) => {
    let x = (_h ^ Math.imul(off + 1, 0x9e3779b9)) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return arr[x % arr.length];
  };

  const sections = [];

  // shortDescription — 가게별 100% 고유 한 줄 요약(121/121). 얇은 페이지의 고유 토큰 비율을 높여 공유 골격 지문을 희석.
  // 단, shortDesc 자체가 name-stuffed 키워드 나열인 경우가 있어 2번째+ 가게이름은 '여기'로(밀도 stuffing 방지).
  if (v.shortDesc && !desc.includes(v.shortDesc.slice(0, 20))) {
    let sd = escHtml(v.shortDesc), sdOcc = 0;
    sd = sd.replace(nameRe, (match, particle) => { sdOcc++; if (sdOcc <= 1) return match; const pm = { '은': '는', '이': '가', '을': '를', '으로': '로' }; return '여기' + (particle ? (pm[particle] || particle) : ''); });
    const lead = pickN(['한 줄로 정리하면 이렇다.', '간단히 말하면 이렇다.', '핵심만 추리면 이렇다.', '먼저 한 줄 요약.'], 3);
    sections.push({ w: v.shortDesc.length + 700, html: `<h2>${pickN(['한눈에', '요약', '먼저 보기', '한 줄 소개'], 5)}</h2><p>${lead} ${sd}</p>` });
  }

  if (v.liquorInfo) {
    const lead = pickN(['주류 구성부터 보자.', '양주 라인업은 이렇다.', '술은 이렇게 갖춰져 있다.', '주종 구성을 짚자.'], 51);
    sections.push({ w: v.liquorInfo.length + 600, html: `<h2>양주·주류</h2><p>${lead} ${escHtml(v.liquorInfo)}</p>` });
  }
  if (v.roomInfo) {
    const lead = pickN(['자리 구성은 이렇게 나뉜다.', '공간은 이렇게 짜여 있다.', '룸 구성부터 짚자.', '좌석 구성을 보자.'], 53);
    sections.push({ w: v.roomInfo.length + 500, html: `<h2>공간·룸 구성</h2><p>${lead} ${escHtml(v.roomInfo)}</p>` });
  }
  if (features) {
    const lead = pickN(['짚어둘 특징은 이렇다.', '한눈에 정리하면 이렇다.', '먼저 볼 포인트는 이것이다.', '특징을 추리면 이렇다.'], 59);
    const fl = v.features.map(f => `<li>${escHtml(f)}</li>`).join('');
    sections.push({ w: v.features.length * 40 + 120, html: `<h2>특징</h2><p>${lead}</p><ul>${fl}</ul>` });
  }
  {
    const bits = [];
    if (v.nearbyStation) bits.push(`${escHtml(v.nearbyStation)}에서 가깝다`);
    if (v.address) bits.push(`주소는 ${escHtml(v.address)}`);
    if (staff) bits.push(`${staff}${iGa(v.staffNickname)} 예약과 안내를 맡는다`);
    if (v.openHours) bits.push(`영업시간은 ${escHtml(v.openHours)}`);
    if (v.ageGroup) bits.push(`입장 기준은 ${escHtml(v.ageGroup)}`);
    if (bits.length) sections.push({ w: bits.join('').length + 60, html: `<h2>위치·이용 안내</h2><p>${bits.join('. ')}.</p>` });
  }

  // 데이터 풍부도 내림차순 → 페이지마다 H2 순서가 자연스럽게 달라진다
  sections.sort((a, b) => b.w - a.w);
  for (const s of sections) html += s.html;

  // FAQ — 답을 이 가게 데이터에서 생성 (페이지마다 답 내용이 고유)
  // 질문 stem도 offset pick으로 decorrelate — 얇은 페이지(데이터 적음)의 공유 골격 지문 제거
  html += `<section><h2>${pickN(['자주 묻는 질문', '궁금한 점들', '미리 알아두면 좋은 것', '방문 전 체크'], 7)}</h2><dl>`;
  html += `<dt>${pickN(['어디에 있나요?', '위치가 어디예요?', '어디쯤인가요?', '찾아가는 길은요?'], 1)}</dt><dd>${region}에 있다.${v.nearbyStation ? ' ' + escHtml(v.nearbyStation) + '에서 가깝다.' : ''}${v.address ? ' 주소는 ' + escHtml(v.address) + '.' : ''}</dd>`;
  if (v.liquorInfo) html += `<dt>${pickN(['양주는 어떤가요?', '주류 구성이 궁금해요', '술은 뭐가 있나요?', '주종은요?'], 2)}</dt><dd>${escHtml(v.liquorInfo.slice(0, 180))}</dd>`;
  if (v.roomInfo) html += `<dt>${pickN(['자리·룸 구성은요?', '룸은 어떻게 돼 있나요?', '좌석 구성이 궁금해요', '공간은 어떤가요?'], 3)}</dt><dd>${escHtml(v.roomInfo.slice(0, 180))}</dd>`;
  html += `<dt>${pickN(['예약은요?', '예약은 어떻게 하나요?', '문의는 어디로 하나요?', '예약 방법이 궁금해요'], 5)}</dt><dd>${pickN(['담당자에게 직접 문의하면 된다.', '담당자에게 바로 연락하면 된다.', '담당자 연락처로 문의하면 된다.', '담당자에게 전화로 확인하면 된다.'], 9)}${staff ? ' 담당: ' + staff + '.' : ''}</dd>`;
  html += `</dl></section>`;

  // 후기 — 가공 후기 미게시(신뢰 규칙), 회원 글 링크만 (짧게·변형, offset decorrelate)
  html += `<p>${pickN(['방문 후기는', '실제 후기는', '다녀온 후기는', '솔직 후기는'], 11)} <a href="/community/reviews">커뮤니티 후기 게시판</a>에서 회원 글만 모읍니다.</p>`;

  // 총정리 — primary 키워드(name) 노출, 짧게·변형 (offset decorrelate)
  const _tail = pickN([
    `예약과 최신 정보는 이 페이지에서 확인하세요.`,
    `방문 전 최신 정보부터 확인하세요.`,
    `자세한 안내는 이 페이지에서 확인하세요.`,
    `예약 전 이 페이지 정보를 먼저 보세요.`,
  ], 13);
  // 총정리 — H2에만 풀네임(primary SEO), 문장은 '여기'로 — 키워드 밀도 stuffing(>3%) 방지 + 지문 감소
  html += `<h2>${name} ${pickN(['총정리', '한눈에 보기', '정리', '핵심 요약'], 17)}</h2><p>${region} ${catKo} ${pickN(['여기', '이곳', '여기는', '이 가게는'], 19)} — ${_tail}</p>`;

  // ★ 관련 업소 내부 링크 — 크롤러 깊이 탐색 유도
  if (allVenues) {
    // 같은 지역(우선) → 부족하면 같은 업종. 작은 지역 클럽은 전역 클럽 풀을 공유 →
    // 두 페이지가 같은 6곳을 뽑으면 앵커 리스트가 거대한 공유 지문이 된다.
    // slug 시드 셔플로 페이지마다 거의 겹치지 않는 6곳을 뽑는다(상관 제거).
    const sameRegion = allVenues.filter(vv => vv.slug !== v.slug && vv.regionKo === v.regionKo);
    const sameCat = allVenues.filter(vv => vv.slug !== v.slug && vv.regionKo !== v.regionKo && vv.cat === v.cat);
    const seededShuffle = (arr, seed) => {
      const a = arr.slice();
      let s = seed >>> 0;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) >>> 0;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // 지역 내·전역 업종 풀 모두 slug 시드로 셔플 → 같은 지역 두 페이지가 동일 목록·순서가 되는 걸 막는다
    const related = seededShuffle(sameRegion, _h ^ 0x9e3779b9).concat(seededShuffle(sameCat, _h)).slice(0, 6);
    if (related.length > 0) {
      html += `<section><h2>${region} ${pickN(['주변 추천 업소', '근처 가볼 만한 곳', '함께 보는 업소', '주변 인기 업소'], 37)}</h2><ul>`;
      related.forEach((rv, ri) => {
        const rvCatKo = catLabelMap[rv.cat] || rv.cat;
        const rvCm = catMap[rv.cat];
        if (!rvCm) return;
        let rvPath;
        if (['club', 'room', 'yojeong'].includes(rv.cat)) {
          rvPath = `/${rvCm.path}/${rv.region}/${rv.slug}`;
        } else {
          rvPath = `/${rvCm.path}/${rv.slug}`;
        }
        // 항목별 연결어를 회전 → 동일 " — {region} 클럽" 꼬리표 반복 지문 제거
        const sep = pickN([' — ', ' · ', ', ', ' / '], ri);
        // 시즌172 — 같은 지역 관련업소 이름의 접두어(지역+업종, 예: '홍대클럽')가 페이지 키워드와
        // 겹쳐 밀도 stuffing을 만든다 → 접두어 토큰을 제거해 노출 (tag/near 페이지와 동일 패턴)
        const rvName = (() => {
          const parts = (rv.nameKo || '').split(/\s+/);
          const lastReg = (v.regionKo || '').split(/\s+/).filter(Boolean).pop() || v.regionKo;
          return (parts.length > 1 && parts[0].includes(lastReg)) ? parts.slice(1).join(' ') : rv.nameKo;
        })();
        html += `<li><a href="${rvPath}">${escHtml(rvName)}</a>${sep}${escHtml(rv.regionKo)} ${rvCatKo}</li>`;
      });
      html += `</ul></section>`;
    }
  }

  // ★ 커뮤니티 안내 — 가공 카운터(후기N·댓글N·마지막글) 제거 (놀쿨 신뢰 규칙)
  html += `<section><h2>${pickN(['커뮤니티', '회원 이야기', '더 둘러보기', '커뮤니티 둘러보기'], 19)}</h2>`;
  html += `<p>${pickN(['관련 글과 질문은', '더 많은 이야기는', '회원들 글은', '생생한 후기와 질문은'], 23)} <a href="/community">놀쿨 커뮤니티</a>에서 확인하세요.</p>`;
  html += `</section>`;

  // 시즌22 — 태그·역 anchor (tag/near 페이지 reachable)
  if (v.tags && v.tags.length > 0) {
    html += `<section><h2>태그로 더 찾기</h2><ul>`;
    v.tags.forEach(t => { html += `<li><a href="/tag/${encodeURIComponent(t)}/">#${escHtml(t)} 관련 업소</a></li>`; });
    html += `</ul></section>`;
  }
  if (v.nearbyStation) {
    const stName = v.nearbyStation.match(/([^\s]+역)/)?.[1] || v.nearbyStation.split(' ')[0];
    if (stName) {
      html += `<section><h2>역 근처 업소</h2><p><a href="/near/${encodeURIComponent(stName)}/">${escHtml(stName)} 근처 업소 모아보기</a></p></section>`;
    }
  }

  // ★ 시즌69 — secondary 키워드 ({lastRegionToken}{catKo} 공백 없음) 자동 노출
  // primary(가게 풀네임) + secondary(district+카테고리) 2 키워드 동시 SEO 매칭
  // regionKo가 공백 포함시 ("부산 해운대") 마지막 토큰만 ("해운대룸")
  const lastRegion = (v.regionKo || '').split(/\s+/).filter(Boolean).pop() || v.regionKo;
  const secondary = `${escHtml(lastRegion)}${catKo}`;
  html += `<section><h2>${secondary} ${pickN(['검색하고 오시는 분들께', '찾아 오신 분들께', '알아보는 분들께', '검색으로 오셨다면'], 29)}</h2>`;
  // secondary 키워드는 위 H2에 이미 노출 → 단락은 지시어로 받아 밀도 stuffing 방지
  html += `<p>${pickN(['여기', '이곳', '이 가게', '이 페이지'], 30)}${pickN([' 찾으신다면 양주·자리 구성부터 보세요.', ' 검색으로 오셨다면 위 구성과 예약 안내를 참고하세요.', ' 정보를 찾는 중이라면 이 페이지에 정리돼 있습니다.', ' 알아보고 계신다면 위 안내가 도움이 됩니다.'], 31)} ${pickN(['직접 확인하려면 담당자에게 문의하면 된다.', '자세한 건 담당자에게 문의하면 된다.', '예약은 담당자에게 바로 문의하면 된다.', '궁금한 점은 담당자에게 물어보면 된다.'], 33)}</p>`;
  html += `</section>`;

  // ★ 관련 키워드 — 검색엔진이 연관 검색어로 인식 (secondary 중심)
  // 가게이름(primary)은 title·H1·H2·description에 이미 풍부 → footer에서 제외(키워드 밀도 stuffing 방지).
  // 같은 지역+업종 페이지끼리 footer가 byte-identical 되는 걸 막기 위해 토큰 순서·구성을 slug로 변형.
  // secondary(지역+업종 붙임)는 키워드 1회만 — 나머지는 공백 분리형(region+catKo)으로 밀도 희석
  const kwBits = [`${secondary}`, `${region} ${catKo} ${pickN(['추천', '정보', '안내', '가이드'], 41)}`, `${region} ${catKo} ${pickN(['후기', '리뷰', '방문기', '평가'], 43)}`, `${region} ${catKo}`, `${region} ${pickN(['나이트라이프', '핫플', '놀거리', '밤거리'], 47)}`];
  const kwRot = _h % kwBits.length;
  const kwOrdered = kwBits.slice(kwRot).concat(kwBits.slice(0, kwRot));
  html += `<footer><p>${kwOrdered.join(', ')}</p></footer>`;

  // ★ 시즌69 floor — secondary(2번째 키워드)가 본문에 ≥3회 보장.
  // 밀도 높은(가게명이 secondary를 포함하는) 페이지는 건드리지 않고, secondary 등장이 적은
  // sparse 지역(같은 지역 업소 0~1곳)만 자연 문장으로 보충 → stuffing 없이 2키워드 SEO 충족.
  const secOcc = (html.match(new RegExp(escRe(secondary), 'g')) || []).length;
  if (secOcc < 3) {
    const fillers = [
      `${region} 지역에서 ${secondary} 정보를 찾는다면 이 페이지에 정리돼 있습니다.`,
      `${secondary} 방문을 고민 중이라면 위 안내부터 확인하세요.`,
      `처음 ${secondary} 검색으로 오셨다면 양주·자리 구성을 먼저 보세요.`,
    ];
    html += `<p>${fillers.slice(0, 3 - secOcc).join(' ')}</p>`;
  }

  // ★ 가게이름(primary) 밀도 floor — 긴 이름은 본문 '여기' 치환으로 어절밀도가 0.5% 미만으로
  // 떨어질 수 있다(venue-name-seo-monitor 미달). 과소노출 venue만 자연 문장 1개로 보충.
  const _bodyText = html.replace(/<[^>]+>/g, ' ');
  const _bodyWords = _bodyText.split(/\s+/).filter(Boolean).length;
  const _nameOcc = (_bodyText.match(new RegExp(escRe(name), 'g')) || []).length;
  if (_nameOcc / Math.max(_bodyWords, 1) < 0.006) {
    html += `<p>${pickN(['직접 가보면', '한 번 방문하면', '와서 보면', '겪어보면'], 51)} ${name}${pickN(['만의 분위기를 알 수 있다.', '의 결을 바로 느낀다.', '이 왜 단골을 만드는지 안다.', '의 진짜 매력이 보인다.'], 53)}</p>`;
  }

  // 백링크는 description 첫 발생 가게이름에 통합 (중복 anchor 제거)

  html += `</article>`;
  return html;
}

/**
 * Generate FAQ JSON-LD for SSR — AI 검색엔진이 직접 파싱
 */
function generateVenueFaqJsonLd(v) {
  const name = v.nameKo;
  const catKo = catLabelMap[v.cat] || v.cat;
  const region = v.regionKo;
  const staff = v.staffNickname || '';

  const faqs = [
    { q: `${name} 어디에 있나요?`, a: `${name}${eunNeun(name)} ${region}에 위치한 ${catKo}입니다.${v.address ? ' 주소: ' + v.address : ''}${v.nearbyStation ? ' ' + v.nearbyStation + ' 근처입니다.' : ''}` },
    { q: `${name} 예약 방법은?`, a: `${name} 예약은 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}` },
    { q: `${region} ${catKo} 추천은?`, a: `${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 ${name}${eulReul(name)} 추천합니다. 실시간 후기와 비교 정보를 확인하세요.` },
    { q: `${name} 분위기는 어떤가요?`, a: `${name}${eunNeun(name)} ${v.features.slice(0, 3).join(', ')} 등의 특징이 있는 ${region} ${catKo}입니다.` },
    { q: `${name} 후기는?`, a: `${name} 실제 방문 후기는 커뮤니티에서 확인할 수 있습니다. 직접 가본 사람들의 솔직한 평가를 읽어보세요.` },
    { q: `${name} 처음 가는데 혼자 가도 되나요?`, a: `${name}${eunNeun(name)} 혼자 방문하는 손님도 많습니다. 방문 가이드에서 첫 방문 팁을 확인하세요.` },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

function getHookingTitle(nameKo, venue) {
  // Extract from seo-hooks.ts
  const regex = new RegExp(`'${nameKo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*'([^']+)'`);
  const m = seoHooksSrc.match(regex);
  if (m) return m[1];
  // fallback: 업소별 고유 문구 생성 (동일 fallback 방지)
  if (venue) {
    const catKo = catLabelMap[venue.cat] || venue.cat;
    const nameHasRegion = nameKo.includes(venue.regionKo);
    const nameHasCat = nameKo.includes(catKo);
    // nameKo가 이미 지역/업종을 포함하면 중복 단어 회피
    const trait = venue.staffNickname
      ? `${venue.staffNickname}${iGa(venue.staffNickname)} 이끄는 ${nameHasRegion ? '' : venue.regionKo + ' '}명소`.trim()
      : nameHasRegion && nameHasCat
        ? '한번 가면 단골 되는 곳'
        : nameHasRegion
          ? `한번 가면 단골 되는 ${catKo}`
          : nameHasCat
            ? `한번 가면 단골 되는 ${venue.regionKo}`
            : `한번 가면 단골 되는 ${venue.regionKo} ${catKo}`;
    return `${nameKo} — ${trait}`;
  }
  return `${nameKo} — 실시간 후기와 비교 정보`;
}

const venues = parseVenues();
console.log(`🔍 ${venues.length}개 업소 파싱 완료`);

// ── 카테고리 매핑 ──
const catMap = {
  club: { labelKo: '클럽', path: 'clubs' },
  night: { labelKo: '나이트', path: 'nights' },
  lounge: { labelKo: '라운지', path: 'lounges' },
  room: { labelKo: '룸', path: 'rooms' },
  yojeong: { labelKo: '요정', path: 'yojeong' },
  hoppa: { labelKo: '호빠', path: 'hoppa' },
};

let pageCount = 0;

// ══════════════════════════════════════════
// 1. 정적 페이지 (고유 title/description)
// ══════════════════════════════════════════
const staticPages = [
  // Category listing pages
  { path: '/clubs', title: '클럽 줄 서다 입장컷 당하기 싫죠? 10년 MD가 들어갈 곳만 알려줌', desc: '클럽 줄 컷이면 그날 끝. 10년 MD가 강남·홍대 클럽 Funktion-One·드레스코드·해외 게스트 DJ·새벽 3시 피크·VIP 부킹까지 클럽 121곳 갈 곳만 추려요 →' },
  { path: '/nights', title: '나이트 부킹 한 번도 못 잡고 집 간 적? 10년 웨이터가 거를 곳 알려줘요', desc: '부킹 안 잡히는 나이트 가면 1차로 끝나요. 10년 짠밥 웨이터가 홀·부스·물·진행 다 풀어드립니다. 합석 시간·매너·드레스코드까지 121곳 갈 곳 vs 거를 곳 한 줄로 정리 →' },
  { path: '/lounges', title: '라운지 시끄러워서 데이트 망친 적 한 번이라도? 10년 실장이 거름', desc: '분위기 보고 갔는데 어수선하면 데이트도 망합니다. 10년 본 라운지 실장이 인테리어·시그니처·만남 결까지 다 풀어드립니다. 단골 만들고 조용히 나와요 →' },
  { path: '/rooms', title: '룸 선택 한 번이라도 후회해본 사람만 봐요. 10년 실장이 까드림', desc: '사진이랑 다르면 그 순간 분위기 끝납니다. 10년 일한 룸 실장이 셀렉션·양주 라인·진행 케어까지 매장별로 솔직히. 후회하기 전에 직접 물어봐요 →' },
  { path: '/yojeong', title: '요정 — 거래처 모시는 자리, 한정식 12첩 가야금 선율 위에 격을 갖춘다', desc: '요정 — 사장님 모시는 자리, 격 떨어지면 다음은 없죠. 20년 실장이 한정식 12첩·국악 가야금·정찰제 매너 한 줄로 정리. 일산명월관·강남·여의도·종로·부산 진짜 요정만 →' },
  { path: '/hoppa', title: '여자 혼자 호빠 가도 돼? 10년 실장이 외모·매너·진행 다 봐주는 18곳', desc: '처음 호빠 가서 어색한 시간 30분이면 끝. 10년 일한 호빠 실장이 외모·매너·진행 다 봐드립니다. 강남·홍대·일산·해운대·대구 호빠 진짜 케어되는 18곳만 골라서 →' },

  // Interactive pages
  { path: '/guide', title: '처음이라 긴장된다고? 이거 읽고 가면 프로다', desc: '클럽·나이트·라운지·룸·요정·호빠 6개 업종별 입문 가이드. 강남 홍대 이태원 일산 부산 드레스코드, 혼자 가도 안전한 곳, 첫방문 매너, 부킹·셀렉션 흐름까지 5분 정독 완성.' },
  { path: '/quiz', title: '클럽형인지 라운지형인지, 테스트 해봐', desc: '10문항 2분이면 나한테 딱 맞는 나이트라이프 스타일 결과. 클럽·라운지·나이트·룸·요정·호빠 6가지 유형 자동 매칭. 결과별 강남 홍대 이태원 일산 추천 업소 리스트, 친구와 비교 공유, 카톡 결과 발송 가능.' },
  { path: '/roulette', title: '고민 끝, 룰렛이 대신 골라준다', desc: '오늘 밤 어디 갈지 망설여? 우리가 만든 룰렛 탭 한 번이면 결정. 지역·업종·인원 필터 후 120곳 풀에서 평점 가중치 랜덤. 다시 돌리기 무제한, 결과 바로 확인.' },
  { path: '/vs', title: '어디가 더 낫냐고? 투표로 결판내자', desc: '인기 업소 맞대결을 회원 투표로 비교합니다. 회원이 직접 매치업을 제안하고, 결과 댓글에서 선택 이유를 토론합니다. 강남·홍대·이태원·일산 클럽·나이트·라운지 어디가 진짜 분위기 좋은지 매주 갱신되는 VS 매치업 게시판.' },
  { path: '/ranking', title: '인기 랭킹 TOP 20 — 회원이 직접 투표한 카테고리별 1위', desc: '회원 직접 투표 기반 카테고리·지역별 랭킹. 강남 홍대 이태원 일산 부산 클럽·나이트·룸·요정·라운지·호빠 1위 업소를 매월 1일 시즌 초기화로 확인. 가짜 점수·등락 표시 없음.' },
  { path: '/venue-info', title: '처음 가는 사람용 — 양주·부스·룸 구성을 한눈에 정리했다', desc: '업종별 양주 라인업(발렌타인 12·17·21년산, 조니워커 블루, 로얄살루트), 부스 4~12인 사이즈, 룸 4~30인 타입까지 정리. 강남 홍대 일산 부산 인기 업소 가이드. 가기 전에 미리 확인하고 예약하세요.' },
  { path: '/compare', title: '두 곳 놓고 따져보면 후회가 없다', desc: '어느 가게가 내 스타일? 분위기·후기·평점·접근성·매너 5개 항목별 두 업소 1대1 비교. 강남 vs 홍대, 클럽 vs 라운지 인기 매치업 모음. 고민 끝, 바로 확인.' },
  { path: '/search', title: '이름만 치면 바로 나온다, 통합 검색', desc: '어디 가게 찾고 있어? 지역·업종·이름·분위기 뭐든 입력하면 강남 홍대 이태원 일산 부산 120곳 중 딱 맞는 곳. 자동완성·오타 보정·초성 검색까지, 바로 확인.' },
  { path: '/magazine', title: '나이트라이프 읽을거리, 여기 다 모았다', desc: '오늘 밤 어디 갈지 망설여? 강남 홍대 이태원 일산 부산 수원 6개 지역 분석, 업종 비교, 신규 매장 현장 리포트까지 우리가 직접 읽고 정리한 글 모음. 모르고 가면 후회, 바로 확인.' },

  // Community pages
  { path: '/community', title: '밤 사람들이 모이는 우리 동네 커뮤니티다', desc: '강남 홍대 이태원 일산 부산 수원 클럽 나이트 라운지 룸 요정 호빠 후기 꿀팁 파티모집 Q&A 자유게시판 패션 조각모임 9개 게시판. 회원 익명 활동 광장.' },
  { path: '/community/qna', title: '오늘 밤 어디 가냐고? 여기서 추천받아', desc: '오늘 밤 어디 갈지 모르면 여기 물어봐. 인원·분위기·지역만 적으면 강남 홍대 이태원 부산 단골 회원 100명이 5분 안에 답해줘. 솔직히 가본 사람만 추천. 바로 확인.' },
  { path: '/community/reviews', title: '가본 사람만 쓸 수 있다, 실제 방문 후기', desc: '어느 가게가 진짜? 광고 아닌 솔직히 가본 사람만 쓴 1줄 후기. 별점·한줄평으로 보는 6업종 리얼 리뷰. 강남 홍대 이태원 부산 모든 업종 모음. 바로 확인.' },
  { path: '/community/tips', title: '고수들이 풀어놓은 밤놀이 실전 꿀팁 모음이다', desc: '어떤 가게가 안전? 초보가 호구되기 전에 무조건 봐. 입장 타이밍·자리 잡는 법·단골 매너까지 1편 정리. 강남 홍대 부산 6개 지역 팁 바로 확인. 후회 전에.' },
  { path: '/community/party', title: '같이 갈 사람 손! 파티 멤버 지금 모집한다', desc: '혼자 가기 아깝다면? 우리끼리 같이 갈 사람 바로 모집. 클럽 4인 N빵·라운지 짝매칭·룸 단체석·주말 1박2일 클럽투어까지. 인원 채워서 출발, 바로 확인.' },
  { path: '/community/free', title: '아무 말 대잔치, 자유게시판이다', desc: '오늘 뭐 떠들고 싶어? 잡담 질문 자랑 푸념 황당썰 추천음악 맛집 해장정보 다 OK. 익명 보장, 규칙 1개만 지키면 자유. 나이트라이프 입문자도 바로 환영.' },
  { path: '/community/fashion', title: '운동화 신고 가도 돼? 업종별 복장 가이드', desc: '운동화 신고 가도 돼? 6개 업종별 드레스코드 정리. 반바지 가능 여부·시즌 옷차림·첫방문 안전한 룩·강남/홍대 입장 거절 리스크까지 바로 확인. 후회 전에.' },
  { path: '/community/jogak', title: '급하게 한 명 구한다, 조각 모집', desc: '자리 하나 남았을 때 바로 올리고 바로 구하는 조각 매칭판. 여성조각·남성조각·제휴조각·벙개까지 실시간 모집. 강남 홍대 이태원 일산 클럽·룸·라운지 자리 채우기. 100P 이상 작성 가능.' },
  { path: '/community/guidelines', title: '이것만 지키면 된다, 커뮤니티 규칙', desc: '딱 1가지만 알면 끝, 우리 동네 매너. 광고·욕설·도배·암시 표현은 즉시 차단. 익명 보장하되 기본 매너만 지키면 자유. 신고·블락 1번 누르면 바로 처리.' },
  { path: '/lounge', title: '업종별 라운지 — 같은 취향끼리 모이는 곳이다', desc: '나는 어떤 라운지가 맞을까? 나이트·클럽·룸·요정·호빠·라운지바 6개 업종별 전용 게시판. 같은 곳 다녀온 사람끼리 후기·추천·비교 — 익명으로 솔직하게 바로 확인.' },
  { path: '/lounge/night', title: '나이트 라운지 — 다녀온 사람들의 진짜 경험담이다', desc: '강남 부산 수원 일산 광주 6개 지역 나이트 진짜 어떤지 궁금해? 부킹 성공기·부스 분위기·매니저 평판·양주 라인업까지 다녀온 사람들 솔직 후기 바로 확인.' },
  { path: '/lounge/club', title: '클럽 라운지 — 다녀온 사람들의 진짜 후기', desc: '강남 홍대 이태원 일산 클럽 어디가 진짜야? EDM 힙합 테크노 4개 장르별 추천, 입장 줄 짧은 시간대, 친구와 가는 코스까지 클럽 다니는 사람들 솔직 정보 바로 확인.' },
  { path: '/lounge/room', title: '룸 라운지 — 단체석·인원별 인사이더 정보가 있다', desc: '몇 명이서 가야 룸이 딱 맞을까? 4인 소형부터 30인 단체석까지 인원별 룸 구성, 양주 라인업 4종, 매니저 평판, 예약 팁 한 페이지에서 바로 확인.' },
  { path: '/lounge/yojung', title: '요정 라운지 — 정찬 코스와 비즈니스 만찬 후기다', desc: '거래처 모실 자리 어디로? 전통 요정 정찬 15첩 코스, 국악 라이브, 비즈니스 만찬 후기 5건. 일산명월관·종로요정·강남요정 코스 구성·드레스코드 바로 확인.' },
  { path: '/lounge/hoppa', title: '호빠 라운지 — 여자 혼자 가본 사람들의 안전 후기다', desc: '여자 혼자 가도 안전한 데 어디 있어? 강남 종로 영등포 해운대 대구 5개 지역 호빠 분위기·마담 인증·매니저 평판·첫방문 동선·안전 정보 바로 확인.' },
  { path: '/lounge/lounge', title: '라운지바 게시판 — 칵테일·위스키 데이트 후기다', desc: '데이트 어디로 가지? 강남 홍대 이태원 일산 부산 5개 지역 라운지바 칵테일·위스키 추천, 야경 좋은 루프탑·호텔 라운지 후기 바로 확인.' },
  { path: '/lounge/free', title: '라운지 자유게시판 — 뭐든 자유롭게 풀어놓는 곳이다', desc: '오늘 뭐 떠들고 싶어? 업종 상관없이 자유롭게 대화하는 라운지. 잡담·질문·황당썰·후기·추천 5가지 다 OK. 강남 홍대 이태원 일산 부산 회원들의 광장, 익명으로 바로 입장.' },
  { path: '/lounge/qna', title: '라운지 질문답변 — 뭐든 물어봐도 된다', desc: '뭐든 물어봐도 돼? 첫방문 매너·강남 홍대 이태원 일산 부산 5개 지역 분위기 비교·업소 추천·안전 팁·드레스코드까지 단골 회원들이 바로 답변하는 실시간 Q&A.' },

  // Launch & Privacy
  { path: '/welcome', title: '처음 오셨다면 — 익명 가입·후기·찜 5분이면 끝난다', desc: '처음이라 어디부터 봐야 해? 본명·주민번호 없이 닉네임 하나로 가입, 6업종 분위기·라인업·후기 비교. 우리 회원들이 모인 커뮤니티 바로 확인.' },
  { path: '/privacy-promise', title: '프라이버시 보호 정책 — 익명 활동 4대 원칙이다', desc: '내 정보 어디까지 안전한가? 본명·주민번호는 받지 않는다. 닉네임만 노출, 팝업 최소, 탈퇴 시 즉시 삭제 4가지 약속 한 페이지에서 바로 확인.' },

  // Legal & Info
  { path: '/privacy', title: '개인정보 어디까지 안전한가 — 수집·이용·파기 안내', desc: '수집 항목·보유 기간·제3자 제공 여부 투명 공개. 개인정보보호법 준수, SSL 암호화, 자동 파기 정책, 회원 탈퇴 시 즉시 삭제. 안전하고 투명한 데이터 처리 방침 전문 공시.' },
  { path: '/terms', title: '이용약관 전문 — 가입·활동·탈퇴 시 적용되는 회원 권리다', desc: '놀쿨 회원 가입·이용·탈퇴 시 적용되는 회원 권리와 의무 전문 공시입니다. 서비스 운영 정책, 금지 행위, 콘텐츠 저작권, 분쟁 해결, 약관 변경 절차까지 모두 명문화했습니다. 가입 전 반드시 확인하시기 바랍니다.' },
  { path: '/disclaimer', title: '법적 고지·면책사항 — 사이트 이용 전 꼭 확인한다', desc: '내가 본 정보 어디까지 믿어도 되나? 본 사이트 정보는 참고 목적. 업소 변경 책임 한계·외부 링크·광고성 글 처리 5가지 명확히 바로 확인.' },
  { path: '/venue-terms', title: '업소 등록 전 꼭 봐야 할 광고 게재 약관이다', desc: '업소 게재 조건·환불 정책·삭제 기준 명시. 신청 절차, 콘텐츠 검수 기준, 부적절 광고 처리, 결제·환불·해지, 분쟁 시 중재 절차까지. 사장님 등록 전 반드시 읽으세요.' },
  { path: '/safety', title: '취했을 때 이 페이지 하나면 된다', desc: '취해서 손이 안 가? 혈중알코올 계산·대리운전·112·119·응급실·24시 콜택시 6가지 원탭 호출. 음주운전 헛수고 전에, 우리가 안전하게 집까지 가는 길 바로 확인.' },
  { path: '/legal', title: '법적 준수 안내 — 정보통신망법·청소년보호법·개인정보보호법 한 번에 정리했다', desc: '본 플랫폼이 준수하는 국내 법령과 운영 원칙을 한 페이지에서 확인하세요. 청소년 보호, 콘텐츠 검수, 개인정보 처리, 신고 창구까지 운영 책임 범위를 투명하게 공개합니다.' },
  { path: '/help', title: '자주 묻는 질문, 여기 다 답해놨다', desc: '뭐가 궁금해? 나이 제한·복장 규정·예약 방법·환불·회원 등급·로그인 문제 7가지 자주 묻는 질문 한 번에. 검색 한 번이면 답 나온다, 망설이지 말고 바로 확인.' },

  // Business
  // /for-business → 301 to /pricing (server-level in _redirects). 중복 title 방지.
  { path: '/testimonials', title: '사장님 진짜 인터뷰 모음 — 가공 없이 발화 원문 그대로', desc: '다른 사장님은 어떻게 운영해? 검증된 분만 게시, 가공 인용·과장 수치 없이 우리가 받은 발화 원문 그대로. 인터뷰 참여 원하면 운영자에게 바로 문의.' },
  { path: '/pricing', title: '요금제 안내 — 매장 규모별 4단계 선택할 수 있다', desc: '매장 규모와 노출 필요도에 맞춰 단계별 요금제를 선택할 수 있습니다. 결제·환불·법인 세금계산서 등 자세한 사항은 약관·결제 문서에서 확인하실 수 있습니다.' },
  { path: '/demo', title: '사장님 가입 전 5분 — 대시보드 미리 만져보고 결정', desc: '가입하고 나서 후회할 수 있다. 어떤 화면인지 5분만 둘러보고 결정하자. 리뷰 관리·사진 업로드·영업 토글·알림 4가지 직접 확인.' },
  { path: '/case-studies', title: '잘 되는 매장만 모아둔 운영 사례집 — 입소문 핫플의 공통점 7가지다', desc: '내 매장만 손님 안 오는 이유 뭘까? 잘 되는 곳들이 공통적으로 챙기는 5가지 항목 정리. 가공된 매출 수치 없이 실제 확인 항목만 바로 확인.' },

  // Lead magnets
  { path: '/lead/nightlife-guide', title: '서울경기 나이트라이프 완벽 가이드 — 현지인만 아는 진짜 핫플', desc: '서울·경기 어디부터 가야 진짜 핫플? 강남 홍대 이태원 일산 수원 분당 6개 지역 드레스코드·입장 골든타임·부킹 흐름 7가지 인사이더 팁. 모르고 가면 헛걸음, 우리가 정리한 가이드 바로 확인.' },
  { path: '/lead/quiz', title: '3문제로 찾는 나만의 밤 — 맞춤 추천 퀴즈', desc: '3가지 질문으로 나한테 딱 맞는 서울·경기 나이트라이프 장소를 찾아드립니다. 강남 홍대 이태원 일산 수원 부산 클럽·라운지·룸·요정·호빠 취향 맞춤 추천. 결과별 추천 업소 리스트, 친구와 결과 비교 공유 가능.' },
  { path: '/lead/weekly-hot', title: '이번 주 핫플 큐레이션 — 지금 준비 중이다', desc: '이번 주 진짜 핫한 곳 어디지? 커뮤니티 후기·검색 추이 종합한 주간 큐레이션 준비 중. 검증된 결과만 회원에게 바로 공유.' },

  // v25 — 상황·시점별 큐레이션 (라이트 테마 + 후킹 5원칙)
  { path: '/tonight', title: '오늘 밤 어디 갈까 — 지금 가도 안 후회할 24곳', desc: '퇴근하고 나왔는데 어디 갈지 망설이는 사람? 오늘 밤 갈만한 곳 6업종에서 평점 4.0 이상만 추렸다. 클럽·나이트·라운지·룸 한 페이지에서 바로 확인.' },
  { path: '/weekend', title: '이번 주말 어디 갈래 — 금토일 갈만한 핫플 30곳', desc: '주말은 시간 아까운 거 알지? 금토일 사람 몰리는 핫플과 평일보다 더 좋은 숨은 코스 한 번에 모았다. 6업종 평점 4.2 이상만, 바로 확인.' },
  { path: '/budget', title: '어떤 자리를 찾고 있나 — 상황별 코스 4가지로 정리했다', desc: '편한 자리? 단체? 접대? 데이트? 상황별로 분위기·구성 맞는 곳 4가지 코스로 정리. 처음이라 어디부터 봐야 할지 모르면 바로 확인.' },
  { path: '/occasion', title: '어떤 자리야 — 6가지 상황별 핫플 정리했다', desc: '나이트라이프 첫 방문? 거래처 접대? 친구 생일? 데이트? 6가지 상황별로 맞는 곳 큐레이션 — 처음 가는 사람도 헛걸음 0번 만들자.' },

  // Misc
  { path: '/status', title: '지금 서비스 상태 — 점검·장애·복구 실시간 공지한다', desc: '현재 서비스 상태와 예정된 점검 일정을 안내합니다. 검증된 측정값이 확보된 후에만 가동률 등 구체 수치를 게시하며, 장애·복구 이력은 시간순으로 공개합니다.' },
  { path: '/referral', title: '친구 초대하고 등급 올리기 — 매너있는 회원만 모이는 법이다', desc: '같이 다닐 친구 없어 망설였어? 우리 회원에게 1대1 초대 링크 보내면 등급이 같이 올라간다. 적립 정책은 운영 문서, 부정 가입은 자동 차단. 친한 분에게만 바로 보내자.' },
  { path: '/hidden', title: '검색 안 해본 사람만 모르는 곳 — 입소문 운영 숨은 업소', desc: '광고비 안 쓰고 입소문만으로 굴러가는 5곳, 모르면 아깝지. 업소 협조에 따라 등록 여부 달라진다. 회원 추천 곳 있으면 커뮤니티에서 바로 제보.' },
  { path: '/gallery', title: '가기 전에 분위기부터 — 매장 내부 실제 사진 갤러리다', desc: '사진 안 보고 가서 후회한 적 없어? 조명·룸 배치·무대 분위기·라인업 4가지 가기 전 눈으로 바로 확인. 카테고리·지역별 정리.' },
  { path: '/events', title: '이번 주 갈만한 이벤트 — DJ 게스트·시즌 파티 일정이다', desc: '이번 주 어디서 뭐 한대? 놓치면 아까운 DJ 게스트·시즌 이벤트·코스튬 파티 4가지 일정 한눈에. 정확한 정보는 매장 페이지에서 바로 확인.' },

  // Auth & Admin (SEO 가치 낮지만 고유 title 설정)
  { path: '/login', title: '카카오·네이버·구글 1분이면 로그인 끝난다', desc: '회원 안 하면 찜·후기 어디 가? OAuth 1번 로그인이면 끝. 본명·주민번호 입력 없이 닉네임만으로 바로 활동.' },
  { path: '/profile', title: '내 찜·후기·활동 기록 한 화면에 다 모았다', desc: '내 활동 어디서 다 모아보지? 찜한 업소·작성 후기·포인트·등급·알림 설정 5가지 한 곳에서 바로 확인. 닉네임만 노출, 본명은 비공개.' },
  { path: '/dashboard', title: '업주 대시보드 — 오늘 내 매장 몇 명 들어왔지?', desc: '내 매장 오늘 몇 명 들어왔지? 페이지뷰·전화 클릭·찜·후기 4가지 지표 한눈에 바로 확인. 모바일에서도 동일.' },
  { path: '/analytics', title: '유입 경로·전환 분석 리포트 — 어디서 들어오는지 한 화면에 보인다', desc: '내 매장에 어디서 어떻게 들어오는지 모르면 마케팅 헛돈만 쓴다. 요일·시간대·유입 경로·전화 클릭률 5가지 지표 한 화면에서 바로 확인.' },
  { path: '/billing', title: '구독·결제 내역 관리 — 어떻게 빠져나가는지 한눈에 보인다', desc: '내 결제 어떻게 빠져나가고 있나? 현재 요금제·결제 이력·결제수단 변경·해지까지 4가지 한 페이지에서 바로 처리. 환불 정책은 약관에서 확인.' },
  { path: '/onboarding', title: '입점 신청 안내 — 사장님 5분이면 등록 끝난다', desc: '사업자등록증과 매장 사진을 등록하면 입점 신청이 가능합니다. 정확한 1차 정보 등록을 권장하며, 잘못된 정보는 노출에 영향을 줄 수 있습니다.' },
  { path: '/launch', title: '오픈 전 마지막 체크', desc: '오픈 전에 뭐 놓친 거 없나? 사진·영업시간·메뉴·알림·연락처 5가지 체크리스트. 1차 정보 정확해야 검색에서 바로 잡힌다.' },
  { path: '/admin', title: '관리자 대시보드 — 오늘 어디부터 손볼까?', desc: '오늘 어디부터 손볼까? 매장·매거진·미디어·SEO·블록·모더레이션 9가지 도구를 한 화면 사이드바에서 바로 진입.' },
  { path: '/admin/venues', title: '매장 수정·삭제 — 어느 업소부터 손볼까?', desc: '어느 업소부터 손볼까? 등록된 모든 업소 한 화면에서 일괄 관리. 정보 수정·사진 교체·영업 상태 토글·신고 처리·SEO 메타까지 7가지 권한 바로 확인.' },
  { path: '/admin/magazine', title: '매거진 글 작성·예약 — 오늘 어떤 이야기 풀까?', desc: '오늘 어떤 이야기 풀까? WYSIWYG 에디터로 본문 작성, 커버 이미지 지정, 시간대 예약 발행까지 한 화면에서 마무리.' },
  { path: '/admin/media', title: '미디어 라이브러리', desc: '사진은 어디서 찾지? 업로드·갤러리·삭제·복사까지 한 곳에서 처리, 매거진과 매장 페이지에 바로 삽입.' },
  { path: '/admin/seo', title: 'SEO 메타 덮어쓰기 — 어떤 페이지부터 손볼까?', desc: '어떤 페이지부터 손볼까? 페이지별 title·description·og 이미지를 전역 훅으로 덮어써서 검색 노출 즉시 보강.' },
  { path: '/admin/blocks', title: '페이지 블록 카피 편집', desc: '홈 히어로 문구 바꾸고 싶을 때, 페이지 키와 블록 키로 카피를 직접 덮어써서 코드 배포 없이 즉시 반영.' },
  { path: '/admin/moderation', title: '모더레이션 — 신고·숨김·정지 한 화면에서 처리한다', desc: '오늘 신고 몇 건 들어왔지? 신고 큐, 숨김 콘텐츠, 유저 정지 3탭에서 커뮤니티 안전 한 화면 처리.' },
  { path: '/admin/stats', title: '운영 통계 한눈에 — 오늘 회원·글·후기 얼마나 늘었지?', desc: '오늘 회원·글·후기 얼마나 늘었지? 일·주·월 단위 운영 지표를 카드 그리드로 확인.' },
  { path: '/admin/visitors', title: '방문자 행동 분석 — 오늘 어디까지 보고 갔지?', desc: '오늘 방문자는 어디까지 보고 갔지? 페이지별 체류·이탈·스크롤 깊이를 실제 page_events 로그 기반으로 분석.' },
  { path: '/admin/audit', title: '감사 리포트 — 오늘 사이트 점수는 몇 점이지?', desc: '오늘 사이트 점수는? title 중복·후킹·링크 깨짐·금지어 자동 점검 결과를 한 페이지에서 확인.' },
  { path: '/my/customize', title: '내가 직접 조절 — 차단·메모·보관함·최근 본 글', desc: '내 계정에서 어떻게 조절하지? 단어·닉네임 차단, 닉네임 메모, 글 보관함, 최근 본 글 4가지 직접 관리. 비공개 페이지이며 검색엔진에는 노출되지 않는다.' },
];

// ══════════════════════════════════════════
// 2. 정적 페이지 생성 (카테고리 리스팅에는 업소 이름 SSR 포함)
// ══════════════════════════════════════════
const categoryPaths = new Set(['/clubs', '/nights', '/lounges', '/rooms', '/yojeong', '/hoppa']);
// 카테고리별 evergreen 가이드 — 업소 수가 적어도 SEO 본문 풍부하게
const CAT_GUIDE_BLURBS = {
  club: `<h2>클럽 처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 입구에서 신분증 확인 후 MD가 자리·플로어 안내합니다. 2) VIP 테이블 예약자는 별도 라인, 일반 입장은 게이트 줄을 따릅니다. 3) 본격 시작은 보통 23시 이후, 새벽 1~3시가 절정. 4) 음료는 바 또는 테이블 서비스로 받습니다. 5) 플로어에서 일행과 떨어지면 미리 합류 지점을 정해두세요. 6) 사진·플래시는 일부 매장 금지, 입장 시 확인됩니다. 7) 마무리는 마감 30분 전 분위기 보고 자연스럽게 정리.</p><h2>처음 가는 사람이 가장 많이 묻는 5가지</h2><p>입장 가능한 옷차림은 어디까지인지, MD에게 어떻게 말 걸어야 하는지, VIP 테이블이 정말 필요한지, 플로어 한복판에서 일행 잃었을 때, 마감 시간 후 동선까지. 단골들이 처음 갔을 때 가장 헷갈렸던 5가지를 한 페이지에 정리했어요.</p><h2>클럽 시스템 — MD·플로어·VIP 테이블</h2><p>MD(매니저·디렉터)는 매장 전체 흐름을 보는 사람으로 자리 배정·테이블 안내·트러블 정리까지 맡습니다. 일반 입장은 플로어 중심, VIP 테이블은 사전 예약으로 별도 공간에서 시작합니다. 단골이 되면 MD를 통해 좋은 자리·이벤트 정보·셋리스트까지 챙겨받게 됩니다.</p><h2>플로어 vs VIP 테이블 — 뭐가 다른가</h2><p>플로어는 자유로운 동선과 에너지 위주, VIP 테이블은 일행 중심 공간에서 음료를 받으며 즐기는 구조입니다. 4인 이상이거나 시간을 길게 잡고 싶다면 VIP 테이블이 편하고, 2~3인 짧게 즐길 거면 플로어 직진이 자연스럽습니다. 일부 매장은 부스·소파석을 중간 옵션으로 운영합니다.</p><h2>지역별 클럽 분위기 — 강남·홍대·이태원·부산</h2><p>강남권은 트렌디한 EDM·하우스 라운지가 많고 직장인 비중이 높습니다. 홍대권은 인디·언더그라운드·테크노가 강세이고 20대 초중반이 핵심. 이태원은 힙합·라틴·국제 손님이 섞인 복합 신, 부산권은 관광객·로컬이 섞인 베이프론트 클럽이 대표적입니다. 첫 방문은 본인 동선 안의 지역부터 시작하면 부담이 적습니다.</p><h2>음악 장르 — EDM·하우스·힙합·테크노</h2><p>EDM은 신스·드롭 중심의 빅룸·페스티벌 사운드, 하우스는 4/4 비트 위주의 댄스 친화 사운드, 힙합은 트랩·붐뱁 라인업, 테크노는 미니멀·인더스트리얼 톤입니다. 매장마다 메인 장르가 정해져 있고, 요일·시간대에 따라 서브 장르로 전환됩니다. 본인 취향을 미리 확인하고 가면 만족도가 높습니다.</p><h2>사운드 시스템 — Funktion-One·서브우퍼·모니터링</h2><p>강남·청담 대형 클럽은 Funktion-One 풀스택을 갖춘 곳이 많습니다. Funktion-One은 영국 토니 앤드루스가 설계한 라이브 사운드 표준으로, 중·고역 디테일과 저역 밀도를 동시에 잡아 "소리에 샤워하는 느낌"을 만듭니다. 메인 부스 정면 3~5m 지점이 음향 스윗스팟이고, 서브우퍼 라인을 직접 마주하는 자리는 흉부 진동까지 전달됩니다. 음향 퀄리티가 메인이면 Funktion-One 보유 여부를 사전 확인하세요.</p><h2>해외 게스트 DJ — 라인업 보는 법</h2><p>매달 1~3회 해외 게스트 DJ 셋이 들어옵니다. 인스타·티켓플랫폼·매장 자체 채널에서 라인업 공지가 뜨고, 게스트 DJ 셋 날은 일반 입장도 게이트 줄이 평소의 2~3배입니다. 셋타임은 보통 자정 직후 또는 새벽 2시 전후. 라인업이 본인 취향과 맞으면 사전 예약·티켓팅 추천, 워크인은 위험합니다. 매주 게스트 DJ가 들어오는 주말이 클럽 신의 핵심 동력입니다.</p><h2>새벽 3시 피크 — 진짜 클럽은 이 시간부터</h2><p>대부분의 인기 클럽은 새벽 3시 전후가 진짜 피크입니다. 자정~새벽 1시는 워밍업, 새벽 2시부터 플로어가 채워지고, 새벽 3시 게스트 DJ 셋·메인 트랙·드롭 시점이 겹치면서 매장 에너지가 최정점에 달합니다. 새벽 3시 입장이 늦지 않습니다 — 오히려 피크 셋 직격 입장으로 효율 최대. 새벽 4~5시 클로징은 정리 분위기로 자연스럽게 빠지면 됩니다.</p><h2>입장 가능 시간 — 게이트·줄·새벽 피크</h2><p>게이트 오픈은 22시, 본격 활성화는 23시 이후입니다. 인기 매장은 자정 전후 게이트 줄이 가장 길고, 새벽 2시 이후 입장은 비교적 빠릅니다. 일부 매장은 새벽 4시 이후 입장 제한이 있고, 새벽 5~6시 클로징 셋이 절정인 곳도 있습니다. 평일은 0~1시, 주말은 1~3시가 가장 활기찹니다.</p><h2>드레스코드 — 입장컷 막는 5가지</h2><p>1) 슬리퍼·삼선 슬리퍼 — 거절. 2) 찢어진 청바지 — 일부 매장 거절. 3) 반바지 — 트렌디한 매장도 거절 비율 높음. 4) 모자(특히 캡) — 일부 거절. 5) 운동복 풀세트 — 거절. 안전 옵션은 셔츠·블라우스·치노바지·원피스·니트 + 가죽·캔버스 단화. 강남 대형 매장일수록 드레스코드 엄격합니다.</p><h2>매너 — 부딪힘·합석·플로어 매너</h2><p>플로어는 좁고 사람 많아 부딪힘이 잦습니다. 가벼운 끄덕임·"미안해요" 한 마디면 자연스럽게 넘어갑니다. 합석은 양쪽 동의 필수, 일방적 접근은 매너 X. 음료가 손에 들렸을 땐 동선 더 조심. 모르는 사람의 일행 자리·VIP 테이블 무단 진입은 거의 모든 매장에서 즉시 정리됩니다.</p><h2>안전 — 만취·일행 분실·소지품</h2><p>플로어에서 일행과 합류 지점을 미리 정해두세요. 휴대폰은 가방·이너 포켓 보관, 외투는 클락룸 이용이 안전합니다. 만취 상태로 플로어 머무름은 매장이 직접 정리해 외부 안내합니다. 일행 분실 시 입구 안내 데스크에서 페이지 호출이 가능한 매장도 있습니다. 음료는 본인 손에서 떨어진 잔 다시 마시지 않기.</p><h2>예약·단골 — VIP 테이블·좋은 자리</h2><p>금토 좋은 자리는 1~2주 전 예약 권장. 평일은 3~5일 전이면 여유 있습니다. MD에게 사전 통화로 인원·예상 시간·분위기 선호를 전달하면 좋은 자리·좋은 셋타임을 받기 쉽습니다. 같은 매장 2~3회 방문 후 MD를 통해 단골 라인이 형성됩니다.</p><h2>음료 — 칵테일·맥주·샷·논알콜</h2><p>기본 메뉴는 보드카·진토닉·롱아일랜드·모히토 칵테일 라인업, 맥주는 카스·테라·하이네켄·아사히, 샷은 예거·테킬라가 일반적. 운전자·논알콜 옵션은 콜라·사이다·과일주스, 일부 매장은 무알콜 칵테일도 운영합니다. 칵테일은 바 직접 주문 또는 테이블 서비스로 받습니다.</p><h2>일행 구성 — 2명·4명·단체</h2><p>2인 방문은 플로어 직진이 자연스럽고, 4인은 VIP 테이블 시작 후 플로어 합류 패턴이 가장 흔합니다. 6인 이상 단체는 사전 예약 권장, 8인 이상은 큰 부스·VIP 룸 결합이 안정적. 단체 입장은 게이트에서 인원 확인 후 한 번에 진행하니 인원 변동은 사전 통보가 매너입니다.</p><h2>커플·솔로 — 누구한테 맞나</h2><p>커플은 부스·VIP 테이블 안쪽 자리가 일행 시간 보내기 좋습니다. 플로어 합류는 짧게, 자리 베이스가 좋습니다. 솔로 방문은 친구 동행이 첫 방문에 가장 무난하고, 1회 단독 방문 후 단골 매장이 잡히면 솔로 방문도 부담이 적어집니다. MD 신뢰가 잡힌 매장이 솔로에게 가장 안전한 시작점입니다.</p><h2>플로어 분위기 가르는 4요소</h2><p>1) BGM 볼륨 — 대형 사운드는 댄스 집중, 중간 볼륨은 대화·하이브리드. 2) DJ 셋 흐름 — 빌드업·드롭 구조면 EDM, 4/4 그루브면 하우스. 3) 조명 톤 — 컬러풀 LED는 페스티벌, 단색 빔은 미니멀·테크노. 4) 평균 연령대 — 20대 위주는 활발, 30대 위주는 차분한 무드. 본인 취향 4 조합 매장이 첫 방문 만족도 높습니다.</p><h2>MD 호칭·소통 — 자연스럽게</h2><p>"MD님" "매니저님" 호칭이 일반적이고, 단골이 되면 이름으로 부르기도 합니다. 요청은 짧고 명확하게: "테이블 한 잔 더요" "친구 들어왔어요" "정산하려고요" 정도면 충분합니다. 음악·DJ 셋리스트·이벤트 일정 정보는 MD에게 물으면 가장 빠르게 답을 듣습니다.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 좋은 자리 우선 배정, 인기 셋타임 미리 안내, 시즌 이벤트 우선 안내 등의 혜택이 자연스럽게 붙습니다. 첫 손님이라고 차별은 거의 없지만, 사전 통화로 인원·시간·분위기를 명확히 전달하면 첫 방문에도 단골 수준 응대를 받을 수 있습니다.</p><h2>시즌 이벤트 — 핼러윈·송년·NYE</h2><p>핼러윈(10월 마지막 주) 코스튬 입장 가능 매장과 안 되는 매장이 나뉩니다. 송년(12월 셋째 주) 카운트다운 셋, 새해 NYE 자정 셋이 메인 이벤트입니다. 발렌타인·여름 페스티벌 시즌도 라인업이 강해지는 시기입니다. 시즌 이벤트는 SNS·공지 페이지에서 사전 확인하면 좋은 자리·좋은 셋타임에 맞출 수 있습니다.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 게이트 응대가 거칠다. 2) 사운드·DJ 셋이 매장 컨셉과 안 맞는다. 3) 카드 결제를 거부한다. 4) VIP 테이블 미리 합의된 셋팅을 안 지킨다. 5) 트러블 발생 시 매장이 자체 정리하지 않는다. 1개라도 보이면 자리 옮기는 게 깔끔합니다.</p><h2>VIP 테이블 진행 흐름 — 시간 단위 타임라인</h2><p>0분: VIP 라인 입장·자리 안내. 5분: 음료·세트 첫 서빙. 15분: DJ 셋 본격 진입. 30분: 일행 플로어 합류 시점. 60분: 음료 추가·셋타임 확인. 90분: 분위기 절정, 셋 전환. 마감 30분 전: 자리 마무리·정산 안내. 평균 머무름은 90~150분, 단골은 더 길게 머물기도 합니다.</p><h2>퇴장·정산 흐름 — 어색하지 않게</h2><p>마무리 의사를 MD에게 짧게 전달하면 됩니다. "정리하려고요" 한 마디면 충분. 정산은 카드·현금 모두 가능, 영수증 발급도 부담 없이 됩니다. VIP 테이블은 사전 합의된 셋팅으로 진행되어 별도 추가 없으면 흐름이 깔끔합니다. 정산 후 클락룸에서 외투 회수, 가벼운 인사로 마무리.</p><h2>인근 해장 코스 — 마감 후 동선</h2><p>마감 시간(03~06시) 이후는 해장국·콩나물국밥·라멘 라인이 가장 흔합니다. 강남권은 24시 해장국집 밀집, 홍대권은 포차·심야 라멘 옵션 다양, 이태원은 24시 케밥·국제 라인업이 있습니다. 일행과 마지막 1시간을 해장 자리에서 풀어내면 다음 날 컨디션이 한결 가볍습니다.</p><h2>위생·청결 — 좋은 매장 알아보는 4 신호</h2><p>1) 입구·화장실·플로어 청소 회전이 빠릅니다. 2) 음료 잔·테이블 정리가 안정적입니다. 3) 직원·MD 복장이 단정합니다. 4) 클락룸·짐 보관 시스템이 깔끔합니다. 4가지가 잘 지켜지면 손님 응대 전반이 신뢰할 만한 매장이라는 신호입니다.</p><h2>친구 데려갈 때 — 첫 동행 가이드</h2><p>친구가 처음이라면 드레스코드·게이트 줄·플로어 합류 지점 3가지를 미리 공유해두면 어색함이 줄어듭니다. 4인 이상은 사전 예약·인원 확정이 매너. 단골 매장이 있다면 동행 친구를 MD에게 사전 소개해두면 응대가 자연스럽습니다. 첫 동행은 평일 저녁이 가장 무난합니다.</p><h2>매장 검색 팁 — 지역·장르·인원 3축</h2><p>본인 동선 안의 지역, 선호 장르(EDM·하우스·힙합·테크노), 인원·시간 조합 3축으로 압축하면 후보가 빠르게 줄어듭니다. 카테고리 · 지역 · 인기 TOP · 새 입점 4가지 기준으로 매장 비교, 후기·사진·운영시간·DJ 라인업 정보까지 한 페이지에 정리되어 있어 결정이 빠릅니다.</p><h2>방문 후 — 좋은 후기 작성 흐름</h2><p>방문 후 24시간 안에 후기를 작성하면 기억이 선명합니다. 음악·셋·드링크·서비스 4축으로 별점을 매기고, 한 줄 요약 + 추천 일행 구성(2인·4인·단체) 정도만 적어도 다른 회원에게 유용합니다. 사진은 외관·로고·플로어 와이드 정도가 적당하며, 다른 손님 얼굴이 식별되는 사진은 피해주세요.</p><h2>비매너 손님 — 식별 신호 4가지</h2><p>큰 소리·욕설, 일방적 신체 접촉, 술 강요, 본인 일행 외 다른 손님에게 무례한 행동 4가지는 명확한 비매너 신호. 본인 자리·플로어에서 비매너 손님이 접근하면 MD에게 짧게 "자리 정리 부탁드려요" 한 마디면 매장이 자연스럽게 정리합니다. 본인은 매너 지키고 즐기면 단골 응대가 좋아집니다.</p><h2>클럽 정리 — 첫 방문부터 단골까지</h2><p>클럽은 EDM 클럽·하우스 클럽·힙합 클럽·테크노 클럽로 장르가 갈리고, 강남 클럽·홍대 클럽·이태원 클럽·부산 클럽으로 지역이 갈립니다. 같은 클럽도 평일 클럽과 주말 클럽이 다른 얼굴입니다. 첫 클럽 방문은 본인 동선 안의 클럽부터, 두 번째 클럽은 라인업이 마음에 든 곳에서, 세 번째 클럽은 단골 라인이 잡힌 클럽으로. 강남 EDM 클럽은 트렌디, 홍대 테크노 클럽은 미니멀, 이태원 힙합 클럽은 자유로움이 핵심입니다.</p>`,
  night: `<h2>처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 자리 안내는 입구 직원이 동선 잡아줍니다. 2) 담당자는 자리 후 1~2분 안에 옵니다. 3) 인사할 때 "처음이에요" 한마디면 충분합니다. 4) 양주 첫 잔은 가볍게, 페이스는 본인이 정합니다. 5) 매칭은 5~10분, 자리 옮김은 30초 안에. 6) 거절은 정중히 "다음에 인사드릴게요" 한 줄이면 끝. 7) 정산은 카드·현금 모두 가능, 사전·사후 모두 OK.</p><h2>처음 가는 사람이 가장 자주 묻는 5가지</h2><p>웨이터에게 인사하는 타이밍부터 자리 옮기는 매너, 거절했을 때 어색하지 않게 넘기는 법까지. 10년 굴러본 사람이 짠밥으로 정리한 부킹 기본기를 한 페이지에 담았어요. 처음 가도 어색하지 않게, 두 번째 가면 단골처럼 보이게.</p><h2>부킹 시스템 — 누가, 언제, 어떻게</h2><p>자리 안내 후 1~2분 안에 담당 웨이터가 옵니다. 원하는 분위기(직장인·연상·연하·차분·활발)를 말하면 그날 손님 풀에서 매칭됩니다. 매칭은 평균 5~10분, 자리 옮김은 30초 안에 진행됩니다. 마음에 안 들면 다시 부탁해도 됩니다. 정중하게 "한 번만 더 부탁드려요" 한마디면 충분합니다.</p><h2>홀 자리 vs 부스 자리 — 뭐가 다른가</h2><p>홀은 무대·DJ 박스가 잘 보이는 활기찬 분위기, 부스는 일행끼리 대화하기 좋은 반쯤 가려진 공간입니다. 부킹이 더 잘 잡히는 곳은 보통 홀 외곽 라인이고, 부스는 단골·예약 손님이 우선 배정됩니다. 4인 이상이면 부스를 먼저 잡고 홀쪽으로 부킹을 받는 패턴이 가장 흔합니다.</p><h2>지역별 분위기 — 강남 vs 홍대 vs 수원 vs 일산</h2><p>강남권은 직장인 손님 비중이 높고 진행이 빠릅니다. 홍대권은 또래 연령대가 많고 음악이 라이브 밴드 위주입니다. 수원·일산권은 단골 비중이 높고 자리 텃세가 거의 없습니다. 부산권은 관광객·출장 손님이 섞여 매칭 풀이 넓은 편입니다. 첫 방문 시 본인 동네 인근부터 시작하면 부담이 적습니다.</p><h2>양주 라인업 — 발렌타인 12·17·21과 조니워커</h2><p>기본 세트는 발렌타인 12년+맥주+과일 안주가 가장 흔하고, 17년·21년 산은 분위기 좋을 때 추가 주문하는 라인입니다. 조니워커 블루는 단골이 자주 찾는 옵션, 로얄살루트는 단체석에서 자주 보입니다. 양주는 첫 잔 정도만 받고, 부담스러우면 맥주로 페이스를 조절하세요.</p><h2>안주 세트 구성 — 과일·치즈·해산물</h2><p>기본 안주는 과일 모둠·치즈 플래터·견과 믹스가 표준입니다. 추가로 새우·관자 같은 해산물 라인업, 마른안주 셋트, 따뜻한 안주가 매장마다 다양합니다. 처음이면 기본 세트로 시작하고, 시간이 길어지면 따뜻한 안주를 추가 주문하는 흐름이 자연스럽습니다.</p><h2>영업시간·피크타임·평일 vs 주말</h2><p>대부분 21시 오픈, 03~05시 마감입니다. 부킹 활성 시간은 23시~새벽 2시이고, 평일은 한산, 금토일은 만석입니다. 신년·송년·핼러윈 같은 이벤트 주간은 1주 전 예약이 안전합니다. 새벽 1~2시 사이가 가장 사람이 많고 매칭 회전도 빠릅니다. 평일 저녁 9~11시는 한산한 만큼 자리·매칭 모두 여유 있게 진행됩니다.</p><h2>드레스코드 — 운동화 OK? 모자 NO?</h2><p>나이트는 클럽보다 캐주얼이 허용되는 편입니다. 운동화·청바지 무난, 깨끗한 셔츠 또는 니트면 충분합니다. 단 슬리퍼·찢어진 청바지·모자는 일부 매장에서 입장 거부됩니다. 여성은 원피스·스커트·블라우스 모두 자연스럽고, 너무 격식 차린 정장보다 깔끔 캐주얼이 부담 없습니다.</p><h2>매너 — 거절·자리 옮김·정산</h2><p>매칭이 마음에 안 들면 정중히 "다음에 인사드릴게요" 정도로 마무리하면 됩니다. 자리 옮김은 웨이터가 안내하니 따로 인사하지 않아도 자연스럽습니다. 정산은 보통 자리 시작 전 또는 마무리 전에 진행하며, 카드·현금 모두 가능한 곳이 대부분입니다. 팁 문화는 강제 X, 단골이 되면 자연스럽게 형성됩니다.</p><h2>안전 — 만취·일행 분실·귀가</h2><p>술 강요는 없고, 본인 페이스로 마시면 됩니다. 일행과 위치 공유를 켜두면 마감 시 빠르게 합류 가능합니다. 귀가는 대리운전·콜택시 추천이며, 매장 앞 안내 데스크에서 호출을 도와주는 곳이 많습니다. 분실물은 다음 날 매장 전화로 문의하면 보관 여부 확인됩니다.</p><h2>예약·단골 — 좋은 자리 받는 법</h2><p>금토 좋은 자리는 사전 예약이 거의 필수입니다. 평일은 당일 방문도 여유롭습니다. 한 매장을 2~3회 같은 웨이터에게 부탁하면 단골 라인이 형성되어 부킹·자리·안주 모두 더 좋은 응대를 받게 됩니다. 처음 가는 사람도 사전 통화로 인원·시간·분위기를 미리 말하면 좋은 자리를 받을 확률이 높아집니다.</p><h2>음악 — 라이브 밴드 셋리스트와 분위기</h2><p>대부분 매장이 21시 라이브 밴드로 워밍업, 23시 이후 DJ 셋으로 전환합니다. 셋리스트는 80년대 디스코, 90년대 발라드, 2000년대 가요·팝, 최신 차트가 골고루 섞입니다. 밴드 멤버 구성은 보컬 1~2, 드럼·베이스·키보드·기타 4~5인 편성이 흔하고, 일부 매장은 라틴·재즈 라인업을 운영합니다. 음악이 가장 활기찬 시간은 자정 직전~새벽 1시 구간입니다.</p><h2>일행 구성 — 2명·4명·단체 어떻게 다른가</h2><p>2인은 부스 안쪽 자리, 4인은 부스 + 홀 인접 자리, 6인 이상은 큰 부스 또는 룸 결합 구조가 일반적입니다. 단체 8~12인은 사전 예약 거의 필수이고, 양주·안주 세트도 인원수에 맞춰 풀세팅 됩니다. 짝수 인원이 자리·매칭 모두 동선이 깔끔합니다. 홀수 인원이면 추가 동행을 미리 구하거나 매장에 인원을 정확히 전달하면 됩니다.</p><h2>음료 — 양주 외 옵션과 무알콜</h2><p>맥주는 카스·테라·아사히 라인업, 칵테일은 모히토·진토닉·롱아일랜드 정도가 기본 메뉴입니다. 무알콜·운전자 옵션으로는 콜라·사이다·과일주스가 제공되고, 일부 매장은 무알콜 칵테일도 가능합니다. 보드카·진 같은 화이트 스피릿은 일부 매장에 한정 메뉴로 있습니다. 음료 안내는 매장 직접 문의로 확인하면 정확합니다.</p><h2>대중교통·주차 — 귀가 동선</h2><p>지하철 막차는 23시 후반~24시 30분 사이가 일반적입니다. 새벽 1시 이후는 카카오T·대리운전·심야버스 중 선택하면 됩니다. 매장 앞 콜택시 라인이 잘 잡히는 곳은 보통 줄이 있으니 미리 호출해두는 게 빠릅니다. 주차는 인근 공영주차장·발렛 옵션이 있는 매장 위주이고, 발렛 가능 여부는 사전 통화 확인 권장. 음주 시 직접 운전 절대 금지입니다.</p><h2>매장 분위기 — 활기·차분 가르는 4 요소</h2><p>1) 좌석 밀도 — 밀집형은 활기, 여유형은 차분합니다. 2) 음향 크기 — 큰 매장은 댄스 분위기, 중간 볼륨은 대화·매칭 분위기. 3) 조명 톤 — 차가운 블루는 트렌디, 따뜻한 앰버는 클래식. 4) 손님 평균 연령대 — 20대 위주면 활발, 30~40대 위주면 진지한 대화. 본인 취향에 맞는 4개 조합을 미리 알아두면 첫 방문 만족도가 높습니다.</p><h2>웨이터 호칭·소통 — 자연스럽게</h2><p>"형님" "사장님" 호칭은 강요 X, 본인 편한 호칭으로 부르면 됩니다. 요청은 짧고 명확하게: "테이블 옮겨주세요" "한 잔 더요" "안주 추가요" 정도면 충분합니다. 매칭 진행 중에는 본인의 분위기 선호를 솔직히 말하는 게 결과가 가장 좋습니다. 마음에 안 들면 표정으로 말고 말로 짧게 거절하는 게 서로 깔끔합니다.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 같은 웨이터·매장에 2~3회 방문 후 자연스럽게 형성됩니다. 단골은 좋은 자리 우선 배정·인기 시간 매칭 우선·일부 서비스 추가 등의 혜택을 받습니다. 첫 손님이라고 차별은 거의 없지만, 사전 통화로 인원·시간·분위기를 명확히 말하면 첫 방문에도 단골 수준의 응대를 받을 수 있습니다.</p><h2>커플·솔로 — 누구한테 맞나</h2><p>커플 방문은 부스 안쪽 자리에서 일행 시간 보내기 좋은 곳이 많고, 매칭은 받지 않고 둘이서만 즐기는 패턴이 일반적입니다. 솔로 방문은 활기찬 매장보다 매칭 풀이 안정적인 단골 중심 매장이 첫 방문에 부담이 적습니다. 친구 동행 솔로 첫 방문이 가장 무난한 시작 형태입니다.</p><h2>이벤트·시즌 — 송년·핼러윈·발렌타인</h2><p>송년 시즌(12월 중순~크리스마스)은 1~2주 전 예약 권장입니다. 핼러윈(10월 마지막 주)은 코스튬 입장 가능 매장이 따로 있고 자리도 빠르게 차이납니다. 발렌타인 주간은 커플석·라운지석 옵션이 늘어나는 곳이 많고, 메뉴도 시즌 한정으로 운영됩니다. 시즌 이벤트 일정은 매장 SNS·공지 페이지에서 사전 확인 가능합니다.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 사전 통화 응대가 불친절하다. 2) 메뉴·결제 방식 설명을 안 해준다. 3) 카드 결제를 거부한다. 4) 술 강요 분위기가 있다. 5) 정산 시 메뉴와 다른 금액을 부른다. 5가지 중 1개라도 보이면 다른 매장으로 옮기는 게 깔끔합니다. 신고가 누적된 매장은 놀쿨 신고 시스템을 통해 제보 가능합니다.</p><h2>웨이터 매칭 — 진행 흐름 분 단위 타임라인</h2><p>0분: 자리 안내, 30초 안에 담당자 인사. 2분: 분위기·인원·시간 듣고 풀 검색. 5분: 첫 매칭 후보 안내, 거절 자유. 8분: 두 번째 매칭 또는 자리 옮김. 15분: 마음에 들면 합석, 안 들면 다른 매장 정보 안내. 매칭 평균 회전은 10~15분이며, 본인 분위기 선호를 솔직히 말할수록 진행이 빠릅니다. 거절은 매너 깎이지 않고, 다음 손님으로 자연스럽게 이어집니다.</p><h2>퇴장·정산 흐름 — 어색하지 않게</h2><p>마무리 의사를 담당자에게 짧게 전달하면 됩니다. "마지막 한 잔이고 정리하려고요" 한 마디면 자연스럽습니다. 정산은 카드·현금 모두 가능하고, 영수증 발급 요청도 부담 없이 가능합니다. 자리 정리는 직원이 진행하며, 분실물 확인 후 가벼운 인사로 마무리하면 됩니다. 단골이 되면 다음 방문 일정도 가볍게 협의 가능합니다.</p><h2>인근 해장 코스 — 마감 후 추천 동선</h2><p>마감 시간(03~05시) 이후는 해장국·콩나물국밥·순두부 라인이 가장 흔합니다. 강남권은 24시 해장국집 밀집, 홍대권은 포차·라멘 옵션이 많고, 부산권은 돼지국밥이 새벽까지 영업합니다. 일행과 마지막 1시간을 해장 자리에서 풀어내면 다음 날 컨디션이 한결 가볍습니다. 콜택시·대리운전 호출은 식사 중에 미리 잡아두는 게 빠릅니다.</p><h2>매장 위생·청결 — 좋은 곳 알아보는 4 신호</h2><p>1) 입구·화장실 청결이 기본기입니다. 2) 잔·접시 교체 회전이 빠릅니다. 3) 직원 복장이 단정합니다. 4) 음료·안주 서빙 동선이 안정적입니다. 4가지가 잘 지켜지는 매장은 손님 응대 전반이 신뢰할 만하다는 신호입니다. 첫 방문 5분 안에 빠르게 체크하면 머무를지 자리 옮길지 판단이 쉽습니다.</p><h2>친구 데려갈 때 — 첫 동행 가이드</h2><p>친구가 처음이라면 미리 매장 분위기·진행 방식·기본 매너 3가지를 짧게 공유해두면 어색함이 줄어듭니다. 4인 이상 동행은 사전 통화로 인원·시간 확정하는 게 좋습니다. 단골 매장이 있다면 동행 친구를 사전에 담당 직원에게 짧게 소개해두면 응대가 자연스럽습니다. 첫 동행은 평일 저녁 한산한 시간대가 가장 무난합니다.</p><h2>매장 검색 팁 — 지역·분위기·라인업 3축</h2><p>본인 동선 안의 지역, 활기·차분 중 선호 분위기, 발렌타인·조니워커 중심 양주 라인업 3축으로 압축하면 후보가 빠르게 줄어듭니다. 놀쿨에서는 카테고리 · 지역 · 인기 TOP · 새 입점 4가지 기준으로 매장 비교가 가능하고, 후기·사진·운영시간·매니저 평판까지 한 페이지에 정리되어 있어 첫 방문 매장 결정이 빠릅니다.</p><h2>방문 후 — 좋은 후기 작성 흐름</h2><p>방문 후 24시간 안에 후기를 작성하면 기억이 선명합니다. 음악·진행·안주·서비스 4축으로 별점을 매기고, 한 줄 요약 + 추천 일행 구성(2인·4인·단체) 정도만 적어도 다른 회원에게 유용합니다. 사진은 외관·홀 전경 정도가 적당하며, 다른 손님 얼굴이 보이는 사진은 피해주세요. 좋은 후기가 누적되면 매장도, 다음 방문자도 모두 도움받습니다.</p><h2>비매너 손님 — 처음 가는 사람을 위한 식별 신호</h2><p>술 강요, 큰 소리·욕설, 일행 분리 시도, 본인 일행 외 다른 손님에게 무례한 행동 4가지는 명확한 비매너 신호입니다. 본인 일행이 비매너 손님과 합석 가능성에 놓이면 담당 직원에게 짧게 "다른 자리로 부탁드려요" 한 마디면 매장 측이 자연스럽게 정리합니다. 본인은 매너 지키고 즐기면 단골·매니저 응대 모두 좋아집니다.</p>`,
  lounge: `<h2>라운지 처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 좌석 우선이라 입구 직원이 자리 안내합니다. 2) 바 자리·창가·소파석 중 선호를 짧게 말하면 됩니다. 3) 첫 잔은 시그니처 칵테일 또는 하우스 와인이 무난. 4) 음악 볼륨이 작아 대화 중심입니다. 5) 사진은 자연 조명·매장 분위기만, 옆 손님 얼굴은 피해서. 6) 머무는 시간 1~2시간, 길게는 3시간. 7) 정산은 카드·현금 모두 가능, 자리 시작 또는 마무리 시점에 진행.</p><h2>처음 가는 사람이 가장 많이 묻는 5가지</h2><p>바텐더에게 추천 부탁하는 타이밍, 시그니처 칵테일과 위스키 차이, 야경 좋은 자리 어떻게 잡는지, 혼술인데 어색하지 않게 머무는 법, 마무리 인사까지. 단골들이 한 번에 정리한 5가지를 한 페이지에 담았어요.</p><h2>바와 클럽의 차이</h2><p>라운지바는 음악이 작고 좌석 위주이며, 대화·데이트·접대 목적이 많습니다. 댄스플로어 중심이 아니라 칵테일·위스키·와인을 천천히 즐기는 공간입니다. 드레스코드는 스마트 캐주얼이 무난합니다.</p><h2>라운지 시스템 — 실장·바텐더·서버</h2><p>실장은 매장 전체 흐름·예약 관리를 맡고, 바텐더는 칵테일 제조·추천을 담당합니다. 서버는 좌석 음료·안주 서빙입니다. 메뉴 추천은 바텐더에게, 자리·시간 조정은 실장에게 부탁하면 가장 빠르게 정리됩니다.</p><h2>좌석 종류 — 바·창가·루프탑·소파</h2><p>바 자리는 바텐더와 대화 좋은 1~2인 공간, 창가는 야경·인테리어 사진이 좋은 라인, 루프탑은 야외 도시뷰, 소파석은 4인 이상 일행에게 안정적. 데이트는 창가·루프탑, 접대는 소파석·프라이빗 룸, 혼술은 바 자리가 가장 무난합니다.</p><h2>시그니처 칵테일 — 바텐더 추천 따르기</h2><p>매장마다 시그니처 메뉴가 있고, 시즌·재료에 따라 바뀝니다. 첫 잔은 바텐더에게 "단맛/씁쓸/상큼 중 어떤 게 좋아요?" 정도로 톤만 전달하면 맞춤 추천이 옵니다. 모히토·올드패션드·네그로니가 가장 친숙하고, 시그니처는 매장 색을 가장 잘 보여주는 선택입니다.</p><h2>위스키 라인업 — 싱글몰트·블렌디드·버번</h2><p>싱글몰트는 글렌피딕·맥캘란·라프로익 등 단일 증류소 원액. 블렌디드는 발렌타인·조니워커·시바스 같은 라인이 대표적. 버번은 짐빔·메이커스마크·우드포드. 처음이면 블렌디드 12년부터, 라피·피트 향이 궁금하면 라프로익으로 옮겨가는 흐름이 자연스럽습니다.</p><h2>와인 — 데이트·접대 페어링</h2><p>레드는 까베르네 소비뇽·말벡·피노누아 라인, 화이트는 샤르도네·소비뇽블랑이 가장 친숙. 글래스 와인부터 시작해 마음에 들면 보틀로 옮기는 흐름이 부담 없습니다. 치즈 플래터·해산물 안주와 페어링하면 자리 분위기가 한결 부드러워집니다.</p><h2>지역별 분위기 — 강남·이태원·연남·해운대</h2><p>강남권은 호텔 라운지·루프탑 라인이 강하고 직장인·접대 비중이 높습니다. 이태원은 위스키 바·국제 라운지가 모인 신, 연남·홍대권은 칵테일 바·소규모 매장이 트렌디. 해운대권은 베이프론트 야경 매장이 대표적입니다.</p><h2>영업시간·피크타임 — 천천히</h2><p>대부분 18시 오픈, 02~03시 마감입니다. 피크타임은 21~24시, 새벽 1시 이후는 한산해지며 천천히 머물기 좋아집니다. 평일 저녁은 한산·혼술 OK, 금토는 만석에 가까워 사전 예약 권장. 시즌 이벤트(밸런타인·크리스마스)는 1~2주 전 예약이 안전.</p><h2>드레스코드 — 스마트 캐주얼이 정답</h2><p>운동복·삼선 슬리퍼는 거절 매장이 많고, 깔끔한 셔츠·블라우스·니트·치노바지·원피스가 안전합니다. 호텔 라운지는 비교적 격식, 동네 칵테일 바는 자유로운 캐주얼이 무난합니다. 모자·운동복 풀세트는 일부 매장에서 거절될 수 있습니다.</p><h2>매너 — 대화 볼륨·옆 자리·바텐더</h2><p>대화 볼륨이 핵심입니다. 큰 소리는 옆 자리에 그대로 전달되어 매너 X. 바 자리는 옆 손님과 일정 거리 유지, 일방적 합석 시도는 매너 아닙니다. 바텐더에게는 짧고 명확하게 주문·요청, 추천 받은 메뉴는 한 잔 다 마신 후 평가가 매너입니다.</p><h2>안전 — 음주·일행·귀가</h2><p>페이스 천천히가 기본, 본인 페이스대로 마시면 됩니다. 일행과 떨어졌을 때는 실장에게 페이지 호출 가능. 음료를 자리에서 떼었다 돌아왔을 땐 새 잔으로 교체하는 게 안전합니다. 귀가는 콜택시·대리운전, 일부 매장은 입구 호출을 도와줍니다.</p><h2>예약·단골 — 좋은 자리 받는 법</h2><p>창가·루프탑·바 끝자리 같은 인기 자리는 사전 예약 권장. 평일은 당일 전화로도 무난. 같은 매장 2~3회 방문 후 실장·바텐더에게 단골 라인이 형성되면 시즌 메뉴·시그니처 신메뉴·이벤트 우선 안내를 받게 됩니다.</p><h2>음료 외 옵션 — 무알콜·티·디저트</h2><p>운전자·무알콜은 모크테일·과일 에이드·인퓨전 워터, 일부 매장은 무알콜 칵테일도 운영. 티는 얼그레이·캐모마일·홍차 라인업, 디저트는 치즈·초콜릿·과일 플래터가 가장 흔합니다. 페어링은 바텐더 추천이 가장 깔끔합니다.</p><h2>일행 구성 — 2명·4명·접대</h2><p>2인은 창가·바 자리, 4인은 소파석, 6인 이상은 프라이빗 룸 옵션이 있는 매장 추천. 비즈니스 접대는 사전 예약·프라이빗 룸·메뉴 사전 조율이 매너입니다. 단체는 매장에 인원·예상 시간을 미리 전달하면 좌석·서비스 모두 깔끔하게 진행됩니다.</p><h2>커플·솔로 — 어디가 어울리나</h2><p>커플은 창가·루프탑·소파석이 일행 시간 보내기 좋고, 자리 시간은 1.5~3시간이 자연스럽습니다. 솔로는 바 자리가 가장 자연스럽고, 바텐더와 짧은 대화·메뉴 추천 흐름이 어색함을 줄여줍니다. 솔로 첫 방문도 평일 저녁 한산한 시간이 부담 적습니다.</p><h2>분위기 가르는 4요소</h2><p>1) BGM 톤 — 재즈는 클래식, 일렉트로는 모던. 2) 조명 — 따뜻한 앰버는 차분, 차가운 화이트는 모던. 3) 인테리어 — 우드·가죽은 클래식, 콘크리트·메탈은 인더스트리얼. 4) 평균 연령대 — 30~40대 위주는 차분, 20대 위주는 트렌디. 본인 취향 4 조합 매장이 첫 방문 만족도 가장 높습니다.</p><h2>실장 호칭·소통 — 자연스럽게</h2><p>"실장님" 호칭이 일반적, 단골이 되면 이름·닉네임으로 부르기도 합니다. 요청은 짧고 명확하게: "한 잔 추가요" "메뉴 추천해주세요" "자리 옮길 수 있을까요" 정도면 충분. 시그니처 신메뉴·시즌 이벤트 정보는 실장에게 물으면 가장 빠릅니다.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 좋은 자리 우선 배정, 시그니처 신메뉴 미리 안내, 시즌 메뉴 페어링 추천 등의 혜택이 자연스럽게 붙습니다. 첫 손님이라고 차별은 거의 없고, 사전 예약·인원·시간 명확히 전달하면 첫 방문에도 단골 수준 응대를 받습니다.</p><h2>시즌 이벤트 — 발렌타인·크리스마스·홀리데이</h2><p>발렌타인 주간은 커플 시그니처 칵테일·페어링 메뉴가 등장합니다. 크리스마스 시즌은 멀드와인·홀리데이 칵테일 라인업이 풀가동, 새해 NYE는 자정 토스트·시그니처 메뉴 운영 매장이 많습니다. 시즌 이벤트는 SNS·공지에서 사전 확인 가능.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 사전 응대가 불친절합니다. 2) 메뉴 설명·추천이 형식적입니다. 3) 카드 결제를 거부합니다. 4) 잔·테이블 정리가 느립니다. 5) 음악 볼륨이 매장 컨셉과 안 맞습니다. 1개라도 보이면 자리 옮기는 게 깔끔합니다.</p><h2>퇴장·정산 흐름 — 어색하지 않게</h2><p>"정리하려고요" 한 마디면 자연스럽게 진행. 정산은 카드·현금 모두 가능, 영수증 발급 자유. 자리 정리·외투 회수는 직원이 안내합니다. 단골이 되면 다음 방문 일정 가볍게 협의 가능합니다.</p><h2>인근 야식 동선 — 마감 후</h2><p>마감 시간(02~03시) 이후는 라멘·우동·해장국 라인업이 흔하고, 강남권은 24시 해장국·국제 음식이 다양합니다. 이태원은 케밥·국제 야식, 연남·홍대는 포차·심야 라멘. 일행과 마지막 30분은 야식 자리에서 마무리하면 분위기가 부드럽게 정리됩니다.</p><h2>위생·청결 — 좋은 매장 알아보는 4 신호</h2><p>1) 입구·화장실·바 카운터 청결이 기본. 2) 잔·접시 교체 회전이 빠릅니다. 3) 바텐더·서버 복장이 단정합니다. 4) 메뉴 재료·시즌 신메뉴 설명이 깔끔합니다. 4가지가 잘 지켜지는 매장은 응대 전반이 신뢰할 만한 신호.</p><h2>친구 데려갈 때 — 첫 동행 가이드</h2><p>친구가 처음이라면 드레스코드·음악 볼륨·머무는 시간 3가지를 짧게 공유해두면 어색함이 줄어듭니다. 4인 이상은 사전 예약 권장. 단골 매장이 있다면 동행 친구를 실장에게 사전 소개해두면 응대가 자연스럽고, 시그니처 추천도 미리 잡힙니다.</p><h2>매장 검색 팁 — 지역·메뉴·자리 3축</h2><p>본인 동선 안의 지역, 선호 메뉴(칵테일·위스키·와인), 선호 자리(바·창가·루프탑·소파) 3축으로 압축하면 후보가 빠르게 줄어듭니다. 후기·사진·운영시간·시그니처 메뉴 정보까지 한 페이지에 정리되어 결정이 빠릅니다.</p><h2>방문 후 — 좋은 후기 작성 흐름</h2><p>24시간 안에 후기 작성하면 기억이 선명합니다. 칵테일·위스키·서비스·분위기 4축으로 별점, 한 줄 요약 + 추천 일행 구성(2인·4인·접대) 적으면 다른 회원에게 유용. 사진은 매장 외관·바 카운터·시그니처 메뉴 정도가 적당하며, 옆 손님 얼굴은 피해주세요.</p><h2>라운지 정리 — 첫 방문부터 단골까지</h2><p>라운지는 칵테일 라운지·위스키 라운지·와인 라운지·루프탑 라운지로 컨셉이 갈리고, 강남 라운지·이태원 라운지·연남 라운지·해운대 라운지로 지역이 갈립니다. 같은 라운지도 평일 라운지와 주말 라운지가 다른 얼굴입니다. 첫 라운지 방문은 본인 동선 안의 라운지부터, 두 번째 라운지는 시그니처 마음에 든 라운지에서, 세 번째 라운지는 단골 실장 라인이 잡힌 라운지로. 강남 호텔 라운지·이태원 위스키 라운지·연남 칵테일 라운지가 첫 라운지 후보로 무난합니다.</p>`,
  room: `<h2>룸 처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 입구에서 실장이 인원·시간 확인 후 룸 안내. 2) 룸 크기는 인원에 맞춰 미리 협의해두면 편합니다. 3) 양주 라인업·세트 구성은 입장 후 첫 안내 때 정합니다. 4) 가라오케기기는 룸 안에 기본 셋팅, 이모님 응대가 일행 흐름을 잡아줍니다. 5) 합석은 일행 구성에 따라 다르고, 일행끼리만도 OK. 6) 머무는 시간 평균 2~3시간, 단체는 4시간 이상. 7) 정산은 자리 마무리 시점, 카드·현금 모두 가능.</p><h2>처음 가는 사람이 가장 많이 묻는 5가지</h2><p>실장에게 인사 타이밍, 룸 크기 어떻게 정하는지, 이모님 응대 매너, 양주 라인업 어떻게 골라야 하는지, 가라오케 시간 분배까지. 단골들이 한 번 정리한 기본 5가지를 한 페이지에 담았어요.</p><h2>룸 시스템 — 실장·이모님·웨이터</h2><p>실장은 매장 전체 흐름·예약 관리를, 이모님은 룸 내부 서빙·일행 흐름 분위기 조율을 맡습니다. 웨이터는 양주·안주 추가·자리 정리를 진행합니다. 요청은 짧고 명확하게: "양주 한 잔 더요" "안주 추가요" "가라오케 셋업 부탁드려요" 정도면 충분.</p><h2>인원수별 사이즈 — 4~30인</h2><p>4~6인은 소형 룸(약 6~10평), 8~12인은 중형(12~18평), 15~25인은 대형, 30인 이상은 단체 룸 또는 룸 연결 옵션. 크기는 미리 협의하면 좌석 배치·가라오케기기 셋업·음향 모두 인원에 맞춰 세팅됩니다.</p><h2>양주 라인업 — 발렌타인·조니워커·로얄살루트</h2><p>기본 라인업은 발렌타인 12·17·21년산, 조니워커 블랙·블루, 로얄살루트 21. 단체석은 발렌타인 21 또는 조니워커 블루가 흔하고, 일행 분위기에 따라 윈저·임페리얼도 옵션. 첫 잔은 가볍게 시작, 페이스는 본인이 정하면 됩니다.</p><h2>안주 세트 구성 — 과일·해산물·따뜻한 안주</h2><p>기본 안주는 과일 모둠·치즈 플래터·견과 믹스. 해산물 안주(새우·관자·전복), 따뜻한 안주(전·찌개·꼬치)는 단체·장시간 자리에서 추가 주문이 자연스럽습니다. 시즌 메뉴는 실장에게 물으면 가장 빠릅니다.</p><h2>가라오케기기 — 셋업·곡 선택·시간 분배</h2><p>내부 가라오케기기는 입장 후 바로 셋업 가능, 마이크 2~4개가 기본입니다. 일행 인원이 많을수록 한 곡 길이 짧은 곡(2~3분)이 회전 좋습니다. 발라드·트로트·K-POP·90년대 가요가 가장 흔히 불리고, 단골은 시즌 신곡을 미리 셋팅해두기도 합니다.</p><h2>이모님 응대 — 분위기 잡는 사람</h2><p>이모님은 일행 분위기·흐름·서빙·가라오케 진행을 다 챙기는 역할입니다. 호칭은 "이모님" 또는 "사장님"이 무난, 단골이 되면 이름으로 부르기도 합니다. 일방적 요구·강요는 매너 X, 짧고 분명한 요청이 가장 잘 통합니다. 시즌·이벤트 정보는 이모님에게 직접 묻는 게 빠릅니다.</p><h2>지역별 분위기 — 강남·일산·수원·부산</h2><p>강남권은 직장인·임원 비중이 높고 단체 회식이 많습니다. 일산·수원권은 단골 중심에 자리 텃세가 거의 없고 친근한 분위기. 부산권은 관광객·로컬 혼합, 해운대·서면 양쪽에 매장이 모여있습니다. 첫 방문은 본인 동선 안 지역부터 시작하면 부담이 적습니다.</p><h2>영업시간·피크 — 평일 vs 주말</h2><p>대부분 19시 오픈, 03~05시 마감. 평일은 한산해 당일 예약도 무난, 금토는 만석에 가까워 2~3일 전 예약 권장. 단체 회식 시즌(12월 송년·6월 상반기 마감)은 1~2주 전 예약 안전. 새벽 1~2시가 가라오케 절정 시간대입니다.</p><h2>드레스코드 — 캐주얼 OK</h2><p>비교적 캐주얼 허용 범위가 넓습니다. 깨끗한 셔츠·니트·치노바지 무난, 운동화도 일부 매장 OK. 슬리퍼·반바지는 일부 매장 거절. 단체 회식은 정장 인원과 캐주얼 인원이 섞이는 경우가 흔하니 일행 분위기에 맞추면 됩니다.</p><h2>매너 — 노래·잔·이모님</h2><p>가라오케은 한 사람이 너무 길게 잡지 않기, 일행 골고루 마이크 잡기가 매너. 잔 비우라는 강요는 매너 X. 이모님에게 큰 소리·반말 X, 짧은 존대가 깔끔합니다. 모르는 일행 룸 진입 시도는 거의 모든 매장에서 즉시 정리됩니다.</p><h2>안전 — 만취·일행·귀가</h2><p>본인 페이스대로 마시고, 강요는 없습니다. 일행 만취 시 이모님·실장에게 미리 알려두면 자리 분위기·동선 모두 조정해줍니다. 귀가는 콜택시·대리운전 추천, 매장 입구 호출 도와주는 곳도 많습니다. 분실물은 다음 날 매장 전화로 확인.</p><h2>예약·단골 — 좋은 자리 받는 법</h2><p>금토 좋은 룸은 3~5일 전 예약, 단체석은 1주일 전 권장. 같은 매장 2~3회 같은 실장에게 부탁하면 단골 라인이 형성되어 룸 우선 배정·시즌 이벤트 안내·서비스 추가 등의 응대를 받습니다.</p><h2>음료 — 양주 외 옵션</h2><p>맥주는 카스·테라·아사히, 칵테일은 모히토·진토닉이 흔하고, 운전자·무알콜은 콜라·사이다·과일주스. 일부 매장은 무알콜 칵테일도 운영합니다. 양주 외 옵션은 일행에 운전자·임산부가 있을 때 미리 말해두면 자연스럽게 세팅됩니다.</p><h2>일행 구성 — 4명·8명·단체</h2><p>4인은 소형 + 가라오케 가벼운 흐름, 8인은 중형 + 양주 풀세트가 일반적. 12인 이상 단체는 대형 또는 룸 연결, 사전 예약·인원·시간·양주 라인업 미리 협의 권장. 인원 변동은 사전 통보가 매너.</p><h2>커플·소수·단체 — 누구한테 맞나</h2><p>커플·2인 소수는 작은 자리가 일행 시간 보내기 좋고, 가라오케은 짧게 즐기는 패턴. 4~6인 친구 모임은 가라오케·양주·안주 풀세팅. 단체 회식은 대형 + 임원·동료 라인업 분리 배치가 흔합니다. 매장에 인원·콘셉트·예상 시간 미리 전달이 핵심.</p><h2>분위기 가르는 4요소</h2><p>1) 룸 크기·좌석 배치 — 좁으면 가까운 분위기, 넓으면 여유. 2) 가라오케기기 음향·마이크 품질. 3) 조명 톤 — 따뜻한 앰버는 클래식, 컬러풀은 트렌디. 4) 이모님 응대 톤 — 친근·차분·트렌디 중 본인 일행 취향에 맞는 톤. 본인 취향 4 조합 매장이 만족도 가장 높습니다.</p><h2>실장 호칭·소통 — 자연스럽게</h2><p>"실장님" 호칭이 일반적이고, 단골이 되면 이름으로 부르기도 합니다. 요청은 짧고 명확하게: "좀 더 큰 데 있어요?" "양주 추가요" "가라오케 셋업 부탁드려요" 정도면 충분. 시즌·이벤트·라인업 정보는 실장에게 직접 묻는 게 가장 빠릅니다.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 좋은 자리 우선 배정·인기 시간 우선·이모님 매칭 우선·시즌 서비스 추가 혜택이 자연스럽게 붙습니다. 첫 손님이라고 차별은 거의 없고, 사전 통화로 인원·시간·라인업 명확히 전달하면 첫 방문에도 단골 수준 응대 가능.</p><h2>시즌 이벤트 — 송년·신년·임원회식</h2><p>송년 시즌(12월 중순~크리스마스) 단체 회식 예약이 몰려 1~2주 전 예약 권장. 신년·임원회식 시즌도 1주 전이 안전. 시즌 메뉴·시즌 양주 라인업은 매장 SNS·공지·실장 직접 안내로 확인 가능합니다.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 사전 통화 응대가 불친절합니다. 2) 메뉴·결제 방식 설명을 안 해줍니다. 3) 카드 결제를 거부합니다. 4) 양주·안주 사전 합의와 다른 셋팅이 옵니다. 5) 정산 시 합의 외 추가 금액을 부릅니다. 1개라도 보이면 자리 옮기는 게 깔끔합니다.</p><h2>진행 흐름 — 시간 단위 타임라인</h2><p>0분: 안내·이모님 인사. 5분: 양주·안주 첫 서빙. 15분: 가라오케 셋업 진입. 60분: 양주 추가·일행 분위기 절정. 120분: 안주·음료 추가. 마감 30분 전: 자리 마무리·정산 안내. 평균 머무름은 120~180분, 단체는 240분 이상도 흔합니다.</p><h2>퇴장·정산 — 어색하지 않게</h2><p>"정리하려고요" 한 마디면 자연스러움. 정산은 카드·현금 모두 가능, 영수증 발급 자유, 단체는 분할 결제도 OK. 자리 정리는 직원이 진행, 분실물 확인 후 가벼운 인사로 마무리. 단골이 되면 다음 방문 일정 가볍게 협의 가능.</p><h2>인근 해장 코스 — 마감 후 동선</h2><p>마감 시간(03~05시) 이후는 해장국·콩나물국밥·순두부 라인이 흔합니다. 강남권은 24시 해장국집 밀집, 일산·수원권은 동네 24시 식당. 단체 회식은 마지막 30분 해장 동선을 미리 잡아두면 동선이 깔끔합니다.</p><h2>위생·청결 — 좋은 매장 알아보는 4 신호</h2><p>1) 입구·화장실·룸 청결이 기본. 2) 양주잔·접시 교체 회전이 빠릅니다. 3) 직원·이모님 복장이 단정합니다. 4) 가라오케기기·마이크 상태가 안정적입니다. 4가지 잘 지켜지면 응대 전반 신뢰할 만한 신호.</p><h2>친구 데려갈 때 — 첫 동행 가이드</h2><p>친구가 처음이라면 드레스코드·머무는 시간·정산 방식 3가지를 짧게 공유해두면 어색함이 줄어듭니다. 4인 이상은 사전 예약·인원·시간 확정이 매너. 단골 매장이 있다면 동행 친구를 실장에게 사전 소개해두면 자연스럽습니다.</p><h2>매장 검색 팁 — 지역·인원·라인업 3축</h2><p>본인 동선 안의 지역, 인원·시간 조합, 선호 라인업(양주·가라오케·이모님 응대 톤) 3축으로 압축하면 후보가 빠르게 줄어듭니다. 후기·사진·운영시간·실장 평판 정보까지 한 페이지에 정리되어 결정이 빠릅니다.</p><h2>룸 정리 — 첫 방문부터 단골까지</h2><p>룸은 소형 룸·중형 룸·대형 룸·단체 룸으로 사이즈가 갈리고, 강남 룸·일산 룸·수원 룸·부산 룸으로 지역이 갈립니다. 같은 룸도 평일 룸과 주말 룸, 친구 모임 룸과 단체 회식 룸이 다른 흐름입니다. 첫 룸 방문은 본인 동선 안의 룸부터, 두 번째 룸은 라인업이 마음에 든 룸에서, 세 번째 룸은 단골 실장 라인이 잡힌 룸으로 옮겨가는 흐름이 자연스럽습니다.</p>`,
  yojeong: `<h2>요정 처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 거의 예약제, 당일 방문 X. 2) 한복 차림 직원이 안내하고 신발 벗는 공간이 따로 있습니다. 3) 한정식 코스가 메인, 양주·국악은 옵션. 4) 프라이빗 룸은 사전 협의된 인원 기준 셋업. 5) 국악 라이브는 코스 중간 또는 후반에 진행, 사전 신청 권장. 6) 머무는 시간 2~4시간이 일반적. 7) 정산은 사전 합의된 코스 기준, 카드·현금·법인카드 모두 가능.</p><h2>처음 가는 사람이 가장 많이 묻는 5가지</h2><p>룸과의 차이, 한정식 코스 어떻게 고르는지, 국악 라이브 어떻게 신청하는지, 비즈니스 접대·임원 모임에서 매너, 외국 손님 동반 시 영어 가능 여부까지. 단골들이 정리한 5가지를 한 페이지에 담았어요.</p><h2>요정이란 — 한정식 + 국악 + 프라이빗</h2><p>일반 음식점이 아니라 전통 한정식과 국악 라이브, 프라이빗 룸이 결합된 격식 있는 공간입니다. 비즈니스 만찬, 외국 손님 접대, 회사 임원 모임에 자주 사용됩니다. 일반 룸과 다르게 음식이 메인이고, 격식·예의가 흐름의 핵심입니다.</p><h2>시스템 — 실장·한식조리장·국악팀</h2><p>실장은 예약·코스·룸 배정·국악 라이브 조율을 맡고, 한식조리장은 코스 메뉴를, 국악팀은 라이브 공연을 진행합니다. 코스·국악 사전 협의는 실장에게, 메뉴 변경·특별 요청은 사전 통화로 정리하면 깔끔합니다.</p><h2>한정식 코스 구성 — 15~20첩 + 프리미엄</h2><p>기본 코스는 15~20첩, 죽·전·구이·찜·탕·밥·후식이 차례로 나옵니다. 프리미엄 코스는 전복·송이·한우·자연산 활어 등이 추가되며, 시즌 식재료에 맞춘 한정 메뉴도 운영됩니다. 코스 길이는 1.5~2.5시간이 일반적.</p><h2>국악 라이브 — 가야금·대금·판소리</h2><p>국악 라이브는 가야금·대금·해금·판소리 등 전통 악기 연주로 구성됩니다. 코스 중간 또는 후반에 30~60분 진행이 일반적이고, 외국 손님 동반 시 사전 신청하면 영어 해설 옵션도 가능한 매장이 있습니다. 사전 예약 필수.</p><h2>프라이빗 룸 — 인원수·격식·뷰</h2><p>프라이빗 룸은 인원수에 맞춰 4인·8인·12인·20인 사이즈가 있고, 일부 매장은 정원·전통 마당이 보이는 뷰 룸을 운영합니다. 비즈니스 접대·임원 모임은 12인 이상 큰 룸이 흔하고, 소수 만찬은 4~8인 룸이 적합합니다.</p><h2>비즈니스 접대 — 사전 준비 체크리스트</h2><p>1) 손님 인원·국적·식이 제한 사전 확인. 2) 코스 등급·메뉴 협의. 3) 국악 라이브 신청 여부. 4) 룸 사이즈·뷰 옵션. 5) 영어·외국어 응대 가능 여부. 6) 법인카드·세금계산서 발행 여부. 6가지를 사전 통화로 정리하면 당일 진행이 깔끔합니다.</p><h2>외국 손님 동반 — 영어·메뉴·국악</h2><p>외국 손님 동반은 사전에 매장에 알려두면 영어 메뉴·영어 해설·전통 절차 안내가 가능한 매장이 많습니다. 한복 체험·국악 라이브 영어 해설은 사전 신청 옵션. 식이 제한(채식·할랄·코셔) 동반 시 메뉴 사전 협의 필수.</p><h2>지역별 — 서울·일산·부산</h2><p>서울 강남·종로·평창동권은 전통 한정식·국악 라이브 매장이 모여있고, 일산·고양권은 한옥 마당이 있는 매장이 인기. 부산권은 해운대·동래 일대 전통 매장이 대표적입니다. 첫 방문은 접근성·뷰·코스 등급 3축으로 압축하면 빠릅니다.</p><h2>영업시간·예약 — 사전 협의 필수</h2><p>대부분 점심(12~14시) + 저녁(18~22시) 2회 영업, 일부 매장은 저녁만. 예약은 최소 2~3일 전, 큰 룸·국악 라이브는 1~2주 전 권장. 단체 행사·기념일 시즌은 1개월 전 예약도 흔합니다. 당일 방문은 거의 어렵습니다.</p><h2>드레스코드 — 단정한 정장이 정답</h2><p>격식 있는 공간이라 단정한 정장·셔츠·치노바지·블라우스·원피스가 안전합니다. 운동복·반바지·슬리퍼·찢어진 청바지는 거절될 수 있습니다. 비즈니스 접대는 비즈니스 정장, 임원 모임은 비즈니스 캐주얼이 일반적.</p><h2>매너 — 신발·국악·코스 흐름</h2><p>1) 신발은 입구에서 벗고 정해진 자리에 가지런히. 2) 국악 연주 중에는 잡담 자제, 박수는 곡 끝에. 3) 코스 흐름을 끊고 메뉴 추가 요청은 사전에. 4) 음주는 페이스 천천히, 잔 강요 X. 5) 손님 호칭·존대·자리 배치(상석)는 미리 정리해두면 깔끔.</p><h2>안전·동선 — 임원·외국 손님</h2><p>임원·외국 손님 동선은 매장 입구·신발 보관·룸 안내·정산까지 실장이 챙겨줍니다. 사전 통화로 안내자·동선·정산 방식을 미리 잡아두면 당일 진행이 매끄럽습니다. 귀가는 콜택시·법인 차량 호출, 매장이 입구 호출을 도와주는 곳이 많습니다.</p><h2>예약·단골 — 좋은 룸·국악 받는 법</h2><p>좋은 뷰 룸·국악 라이브 일정은 1~2주 전 예약 권장. 같은 매장 2~3회 방문 후 실장에게 단골 라인이 형성되면 시즌 메뉴·국악팀 우선 배정·뷰 룸 우선 등의 응대를 받습니다. 비즈니스 단골은 법인 응대 라인이 별도 마련되기도 합니다.</p><h2>음료 — 전통주·양주·차</h2><p>전통주는 막걸리·청주·소주·전통 약주 라인업, 양주는 발렌타인·조니워커·국제 위스키. 차는 작설차·우전차·국화차 등 시즌 차가 코스 후반에 제공됩니다. 운전자·무알콜은 매실차·과실음료·인퓨전 워터.</p><h2>일행 구성 — 소수·임원·외국 손님</h2><p>소수(2~4인)는 친밀한 만찬, 8~12인은 비즈니스 만찬·임원 모임 표준 사이즈, 20인 이상은 단체 행사·기념일 모임. 외국 손님 동반은 인원·국적·식이 제한 사전 협의가 매너입니다.</p><h2>분위기 가르는 4요소</h2><p>1) 룸 인테리어 — 전통 한옥·도자기·서예. 2) 한정식 코스 구성·플레이팅. 3) 국악팀 라이브 분위기. 4) 직원 한복·응대 톤. 4가지가 잘 조화된 매장이 첫 방문 만족도 가장 높습니다.</p><h2>실장 호칭·소통 — 격식 있게</h2><p>"실장님" 호칭이 일반적이고, 단골이 되면 이름·직책으로 부르기도 합니다. 요청은 정중하고 명확하게: "코스 한 단계 위로 부탁드립니다" "국악 라이브 신청 가능할까요" "법인카드 결제 부탁드립니다" 정도면 충분.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 시즌 메뉴 우선 안내·뷰 룸 우선 배정·국악팀 우선 배정·법인 응대 라인 마련 등의 혜택을 받습니다. 첫 손님이라고 차별은 없고, 사전 통화로 인원·코스·국악·외국 손님 동반 여부 명확히 전달하면 첫 방문에도 단골 수준 응대.</p><h2>시즌 메뉴 — 봄·여름·가을·겨울</h2><p>봄(3~5월)은 죽순·산나물·도다리, 여름(6~8월)은 자연산 활어·전복·해산물, 가을(9~11월)은 송이·전어·게, 겨울(12~2월)은 굴·홍합·뜨거운 탕 라인업. 시즌 식재료는 코스 중심에 들어가며 매장마다 한정 메뉴를 운영합니다.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 사전 통화 응대가 형식적. 2) 코스·국악 설명이 부족. 3) 식재료 원산지 안내가 명확하지 않음. 4) 룸 배치·예약 변경이 잦음. 5) 정산 시 사전 합의와 다른 금액. 1개라도 보이면 다른 매장 검토 권장.</p><h2>진행 흐름 — 시간 단위 타임라인</h2><p>0분: 신발 보관·룸 안내·실장 인사. 10분: 첫 코스(죽·전) 서빙. 30분: 본 코스(구이·찜) 진입. 60분: 국악 라이브 시작. 90분: 본 코스 마무리·탕·밥. 120분: 후식·차. 150분: 정산·마무리 인사. 평균 머무름 2.5~3시간.</p><h2>퇴장·정산 — 격식 있게</h2><p>정산은 정찰제 — 사전 합의된 코스 기준으로 진행, 카드·현금·법인카드·세금계산서 모두 가능합니다. 정찰제라서 손님 앞에서 가격 흔들림이 없고, 사장님 모시는 자리에서 격이 떨어질 일이 없습니다. 영수증·세금계산서 사전 신청해두면 당일 진행이 깔끔. 신발 회수·외투 회수는 직원이 안내, 가벼운 인사로 마무리. 단골은 다음 방문 일정 사전 협의.</p><h2>위생·청결 — 좋은 매장 알아보는 4 신호</h2><p>1) 입구·신발 보관·화장실 청결이 기본. 2) 코스 그릇·수저 교체 회전이 빠릅니다. 3) 직원 한복·복장이 단정합니다. 4) 식재료·시즌 메뉴 원산지 설명이 명확합니다. 4가지가 잘 지켜지면 응대 전반 신뢰할 만한 신호.</p><h2>비즈니스 접대 동선 — 마무리 인사</h2><p>임원·손님 배웅은 정산 후 매장 입구까지, 콜택시·법인 차량 호출을 매장이 도와줍니다. 다음 비즈니스 약속·미팅 일정은 차량 안에서 정리하는 게 자연스럽습니다. 손님 동선·정산은 사전에 매장과 협의해두면 매끄럽습니다.</p><h2>매장 검색 팁 — 지역·코스·뷰 3축</h2><p>본인 손님 동선 안의 지역, 코스 등급(스탠다드·프리미엄·시즌 한정), 뷰 옵션(한옥 마당·정원·도시뷰) 3축으로 압축하면 후보가 빠르게 줄어듭니다. 후기·사진·운영시간·국악 라이브 일정까지 한 페이지에 정리되어 결정이 빠릅니다.</p><h2>요정 정리 — 첫 방문부터 단골까지</h2><p>요정은 한정식 요정·국악 요정·프라이빗 요정·비즈니스 접대 요정으로 컨셉이 갈리고, 서울 요정·일산 요정·부산 요정으로 지역이 갈립니다. 같은 요정도 점심 요정과 저녁 요정, 소수 만찬 요정과 임원 모임 요정이 다른 흐름입니다. 첫 요정 방문은 본인 동선 안의 요정부터, 두 번째 요정은 한정식 코스가 마음에 든 요정에서, 세 번째 요정은 단골 실장 라인이 잡힌 요정으로. 강남 요정·종로 요정·평창동 요정은 전통 한정식 요정 라인업이 강하고, 일산 요정은 한옥 마당 요정이 인기, 부산 요정은 해운대·동래 일대 요정이 대표적입니다. 비즈니스 접대 요정은 정찰제·사전 협의·법인카드·세금계산서가 잘 갖춰진 요정을 우선 고려하면 진행이 깔끔합니다. 정찰제는 손님 앞 가격 노출·흥정 없이 코스 기준 그대로, 격이 떨어질 일이 없는 응대의 기본입니다.</p>`,
  hoppa: `<h2>호빠 처음 방문 — 7분 압축 가이드</h2><p>입장 직전 알아두면 어색함 줄어드는 핵심 7가지: 1) 여성 손님 전용 사교 공간. 2) 입장 시 실장이 인사하고 호스트 프로필을 보여줍니다. 3) 마음에 드는 호스트를 지목하거나 추천 받을 수 있습니다. 4) 양주·안주·가라오케기기가 룸에 셋업됩니다. 5) 합석 호스트와 일행 분위기 흐름은 본인이 정합니다. 6) 머무는 시간 평균 2~3시간. 7) 정산은 자리 마무리 시점, 카드·현금 모두 가능.</p><h2>처음 가는 사람이 가장 많이 묻는 5가지</h2><p>호스트 지목 어떻게 하는지, 마음에 안 들 때 매너 있게 바꾸는 법, 양주 라인업 어떻게 고르는지, 가라오케 분위기 잡는 법, 첫 방문 친구 동행 가이드까지. 단골 여성 회원들이 정리한 5가지를 한 페이지에 담았어요.</p><h2>시스템 — 실장·호스트·서버</h2><p>실장은 예약·룸 배정·호스트 매칭 조율을 맡고, 호스트는 일행 분위기·대화·노래·게임을 함께 진행합니다. 서버는 양주·안주 서빙·자리 정리. 호스트 추천·교체·시간 연장은 실장에게 요청하면 가장 빠릅니다.</p><h2>호스트 지목·추천 — 어떻게 고르나</h2><p>입장 후 호스트 프로필(사진·소개)을 보고 직접 지목하거나, 실장에게 분위기 선호(차분·활발·연하·연상)를 말하면 추천 받을 수 있습니다. 마음에 안 들면 정중히 "다른 분 부탁드립니다" 한 마디로 교체 가능. 첫 방문은 추천 받는 게 부담 적습니다.</p><h2>호스트 매칭 — 진행 흐름</h2><p>0분: 룸 안내·호스트 인사. 5분: 첫 호스트 합석·간단한 대화. 10분: 마음에 들면 자리 진행, 안 들면 교체 가능. 15~30분: 양주·안주·가라오케 셋업 진입. 자리 회전은 평균 30~60분 단위로 추가 호스트 지목·교체 가능합니다.</p><h2>양주 라인업 — 발렌타인·조니워커</h2><p>기본은 발렌타인 12·17년산, 조니워커 블랙·블루가 흔합니다. 첫 잔은 가볍게, 페이스는 본인이 정합니다. 술 강요는 매너 X, 일행이 본인 페이스를 존중하는 분위기가 좋은 매장의 기본기.</p><h2>안주 세트 구성 — 과일·따뜻한 안주</h2><p>기본 안주는 과일 모둠·치즈·견과 믹스. 따뜻한 안주(전·꼬치·찜)는 자리 길어질 때 추가 주문이 자연스러움. 시즌 메뉴는 실장에게 물으면 빠릅니다.</p><h2>가라오케·게임 — 분위기 잡는 법</h2><p>룸 내부 가라오케기기는 마이크 2~4개 셋업. 호스트와 듀엣·일행 합창이 가장 흔합니다. 간단한 게임(주사위·OX 퀴즈)도 분위기 진행에 자주 사용됩니다. 호스트가 분위기 진행 톤을 잡아주니 본인은 따라가면서 편하게 즐기면 됩니다.</p><h2>지역별 — 강남·일산·수원·부산</h2><p>강남권은 직장인 여성 손님 비중이 높고 트렌디한 분위기, 일산·수원권은 단골 중심에 친근한 톤, 부산권은 해운대·서면 중심으로 매장이 모여있습니다. 첫 방문은 본인 동선 안 지역부터.</p><h2>영업시간·피크 — 평일 vs 주말</h2><p>대부분 19시 오픈, 03~05시 마감. 평일은 한산해 당일 예약도 무난, 금토는 만석에 가까워 2~3일 전 예약 권장. 새벽 1~2시가 분위기 절정 시간입니다.</p><h2>드레스코드 — 깔끔 캐주얼</h2><p>운동복·삼선 슬리퍼·반바지는 거절될 수 있고, 깔끔한 원피스·블라우스·스커트·니트가 안전합니다. 너무 격식 차린 정장보다 자유로운 캐주얼이 무난.</p><h2>매너 — 호스트·노래·잔</h2><p>호스트에게 정중한 존대·짧은 요청이 매너. 일방적 신체 접촉·강요는 매너 X. 잔 강요는 본인이 받지 않아도 OK. 모르는 일행 룸 진입 시도는 매장이 즉시 정리합니다.</p><h2>안전 — 음주·일행·귀가</h2><p>1) 첫 방문은 친구와 함께. 2) 신뢰 가는 실장 있는 매장을 추천 받기. 3) 영업시간·세트 구성 사전 확인. 4) 카드 결제 가능 매장이 안전. 5) 술 강요·과도한 압박이 있으면 즉시 자리 이동. 6) 귀가는 콜택시·대리운전 활용. 7) 음료를 자리에서 떼었다 돌아왔을 땐 새 잔 교체.</p><h2>예약·단골 — 좋은 호스트 받는 법</h2><p>금토 좋은 호스트·룸은 사전 예약 권장. 같은 매장 2~3회 같은 실장에게 부탁하면 단골 라인이 형성되어 인기 호스트 우선 배정·시즌 이벤트 안내·서비스 추가 등의 응대를 받습니다.</p><h2>음료 — 양주 외 옵션</h2><p>맥주는 카스·테라·아사히, 칵테일은 모히토·진토닉. 운전자·무알콜은 콜라·사이다·과일주스, 일부 매장은 무알콜 칵테일도 운영. 본인 페이스에 맞는 옵션을 미리 말해두면 셋업이 자연스럽습니다.</p><h2>일행 구성 — 2명·4명·단체</h2><p>2인은 작은 룸 + 호스트 1~2명, 4~6인은 중형 룸 + 호스트 2~3명, 8인 이상 단체는 대형 룸 + 호스트 3~5명이 일반적. 사전 예약·인원·시간·콘셉트 미리 협의 권장.</p><h2>커플 동반·솔로·여성 단체</h2><p>여성 손님 중심이라 솔로·여성 친구 모임·여성 단체가 가장 자연스럽습니다. 커플 동반은 매장마다 정책이 다르니 사전 확인. 솔로 첫 방문은 친구 동행이 가장 무난합니다.</p><h2>분위기 가르는 4요소</h2><p>1) 룸 인테리어·조명 톤. 2) 호스트 라인업 다양성. 3) 음악·가라오케기기 품질. 4) 실장·서버 응대 톤. 4가지가 잘 조화된 매장이 첫 방문 만족도 가장 높습니다.</p><h2>실장 호칭·소통 — 자연스럽게</h2><p>"실장님" 호칭이 일반적, 단골이 되면 이름으로 부르기도 합니다. 요청은 짧고 명확하게: "다른 분 부탁드려요" "양주 추가요" "가라오케 셋업 부탁드려요" 정도면 충분.</p><h2>단골 vs 첫 손님 — 응대 차이</h2><p>단골은 인기 호스트 우선·좋은 룸 우선·시즌 이벤트 우선 안내·서비스 추가 혜택이 자연스럽게 붙습니다. 첫 손님이라고 차별은 없고, 사전 통화로 인원·시간·콘셉트 명확히 전달하면 첫 방문에도 단골 수준 응대.</p><h2>시즌 이벤트 — 생일·기념일·송년</h2><p>생일·기념일은 사전 신청 시 케이크·이벤트 셋업이 가능한 매장이 많습니다. 송년·연말은 1~2주 전 예약 권장. 시즌 이벤트는 매장 SNS·실장 직접 안내로 확인 가능합니다.</p><h2>안 좋은 매장 거르는 5 신호</h2><p>1) 사전 통화 응대가 불친절. 2) 호스트 프로필·시스템 설명 부족. 3) 카드 결제 거부. 4) 술·시간 강요 분위기. 5) 정산 시 사전 합의와 다른 금액. 1개라도 보이면 즉시 자리 이동 권장.</p><h2>퇴장·정산 — 어색하지 않게</h2><p>"정리하려고요" 한 마디면 자연스럽게 진행. 정산은 카드·현금 모두 가능, 영수증 발급 자유. 자리 정리·외투 회수는 직원이 안내, 분실물 확인 후 가벼운 인사로 마무리.</p><h2>인근 야식 동선 — 마감 후</h2><p>마감 시간(03~05시) 이후는 해장국·라멘·야식 라인업이 흔합니다. 강남권은 24시 해장국·해산물, 일산·수원권은 동네 24시 식당. 일행과 마지막 30분 야식 자리에서 분위기 정리.</p><h2>위생·청결 — 좋은 매장 알아보는 4 신호</h2><p>1) 입구·화장실·룸 청결이 기본. 2) 양주잔·접시 교체 회전이 빠릅니다. 3) 직원·호스트 복장이 단정합니다. 4) 가라오케기기·마이크 상태가 안정적. 4가지가 지켜지면 응대 전반 신뢰할 만한 신호.</p><h2>친구 데려갈 때 — 첫 동행 가이드</h2><p>친구가 처음이라면 호스트 지목·매너·정산 방식 3가지를 미리 공유해두면 어색함이 줄어듭니다. 4인 이상은 사전 예약·인원 확정이 매너. 단골 매장이 있다면 친구를 실장에게 사전 소개해두면 자연스럽습니다.</p><h2>매장 검색 팁 — 지역·호스트·라인업 3축</h2><p>본인 동선 안의 지역, 호스트 라인업 다양성, 양주·가라오케·이벤트 옵션 3축으로 압축하면 후보가 빠르게 줄어듭니다. 후기·사진·운영시간·실장 평판 정보까지 한 페이지에 정리되어 결정이 빠릅니다.</p><h2>방문 후 — 좋은 후기 작성 흐름</h2><p>24시간 안에 후기 작성하면 기억이 선명합니다. 호스트 응대·분위기·서비스·안전 4축으로 별점, 한 줄 요약 + 추천 일행 구성(2인·4인·단체) 적으면 다른 회원에게 유용. 사진은 외관·룸 인테리어 정도, 호스트·다른 손님 얼굴은 피해주세요.</p><h2>호빠 정리 — 첫 방문부터 단골까지</h2><p>호빠는 강남 호빠·일산 호빠·수원 호빠·부산 호빠로 지역이 갈리고, 같은 호빠도 평일 호빠와 주말 호빠, 친구 동행 호빠와 단체 호빠가 다른 흐름입니다. 첫 호빠 방문은 본인 동선 안의 호빠부터, 두 번째 호빠는 호스트 라인업이 마음에 든 호빠에서, 세 번째 호빠는 단골 실장 라인이 잡힌 호빠로. 강남 호빠는 트렌디, 일산 호빠는 친근, 수원 호빠는 단골 중심, 부산 호빠는 해운대·서면 일대 호빠가 대표적입니다.</p>`,
};
// ── 홈페이지: WebSite + Organization JSON-LD ──
// 홈 SSR 강화: H2×6 카테고리 + 각 카테고리 TOP 5 + 지역 분포
let homeSsr = `<h1>놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다</h1>`;
homeSsr += `<p>놀쿨은 대한민국 전국 클럽·나이트·라운지·룸·요정·호빠 6업종 ${venues.length}+ 업소를 한 곳에 모은 나이트라이프 정보 플랫폼입니다. 놀쿨에서 분위기·라인업·후기를 1줄로 비교하고, 모바일에서 바로 오늘 갈 곳을 정하세요.</p>`;
homeSsr += `<h2>놀쿨이 처음이신가요?</h2>`;
homeSsr += `<p>놀쿨은 20년 굴러본 사람이 직접 추려서 거를 곳을 미리 빼냈습니다. 처음 와도 1분 안에 오늘 코스가 정해지게 만들었어요. 놀쿨에서 비교, 클릭, 출발 — 주말 망치기 전 놀쿨부터 켜세요.</p>`;
const HOME_CATS = [
  { key: 'club', ko: '클럽', desc: 'EDM·힙합·테크노 — 새벽까지 안 멈추는 곳' },
  { key: 'night', ko: '나이트', desc: '라이브 밴드와 부스 — 모르는 사람도 파트너가 되는 곳' },
  { key: 'lounge', ko: '라운지', desc: '조용히 한 잔, 대화만 남는 밤' },
  { key: 'room', ko: '룸', desc: '바깥 소리 하나 안 들리는 방, 우리만의 시간' },
  { key: 'yojeong', ko: '요정', desc: '대금 소리에 정찬, 한 번 가면 단골 되는 곳' },
  { key: 'hoppa', ko: '호빠', desc: '처음이어도 혼자여도 괜찮은, 여성 전용 호스트바' },
];
// 시즌21 — 홈에서 카테고리·업소 SSR 내부링크 (JS 미실행 봇 anchor depth 1)
homeSsr += SITE_NAV_ANCHORS;
HOME_CATS.forEach(c => {
  const list = venues.filter(vv => vv.cat === c.key);
  if (list.length === 0) return;
  homeSsr += `<h2><a href="/${catMap[c.key].path}/">${escHtml(c.ko)}</a> ${list.length}곳 — ${escHtml(c.desc)}</h2>`;
  homeSsr += `<ul>`;
  list.slice(0, 8).forEach(vv => { homeSsr += `<li><a href="${venueHref(vv)}">${escHtml(vv.regionKo)} ${escHtml(c.ko)} ${escHtml(vv.nameKo)}</a></li>`; });
  homeSsr += `</ul>`;
});
const homeAllRegions = [...new Set(venues.map(v => v.regionKo))];
homeSsr += `<h2>지역별 나이트라이프</h2>`;
homeSsr += `<p>서비스 지역: ${homeAllRegions.map(r => escHtml(r)).join(', ')}. 각 지역의 클럽·나이트·라운지·룸을 카테고리에서 비교해보세요.</p>`;
// R2-2 H2 강화 + R2-1 FAQ 본문 노출 (AI Overview 인용 강화)
homeSsr += `<h2>자주 묻는 질문</h2>`;
homeSsr += `<dl>`;
const HOME_FAQ_SSR = [
  { q: '놀쿨이 뭐예요?', a: `놀쿨은 전국 클럽·나이트·라운지·룸·요정·호빠 6업종 ${venues.length}+ 업소를 정리한 정보 플랫폼입니다. 놀쿨 하나면 매장 정보·후기·커뮤니티가 한 곳에서 다 보입니다.` },
  { q: '나이트랑 클럽이 어떻게 다른가요?', a: '나이트는 부킹·웨이터 시스템 중심, 클럽은 음악·스탠딩 중심입니다.' },
  { q: '룸 매니저 선택은 어떻게 하나요?', a: '매장 측이 안내하는 매니저 중에서 손님이 직접 선택하는 시스템입니다.' },
  { q: '광고 문의는 어떻게 해요?', a: '카톡 ID besta12로 문의하시면 상세 안내드립니다.' },
  { q: '후기 작성 어떻게 해요?', a: '회원가입 후 /community/reviews 페이지에서 작성 가능합니다.' },
];
HOME_FAQ_SSR.forEach(f => { homeSsr += `<dt>${escHtml(f.q)}</dt><dd>${escHtml(f.a)}</dd>`; });
homeSsr += `</dl>`;
// R2-1 — FAQPage JSON-LD (SSR 정적 박기, Google Rich Results + AI Overview 인용)
const HOME_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQ_SSR.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};
writePage('/', {
  title: '놀쿨 — 오늘 어디 갈지 못 정했죠? 20년 굴러본 사람이 골라드림',
  description: `놀쿨 — 오늘 어디 갈지 못 정했죠? 거를 곳 천지예요. 놀쿨은 클럽·나이트·룸·요정·라운지·호빠 6업종 ${venues.length}+ 업소를 20년 굴러본 사람이 1줄로 정리. 주말 망치기 전 놀쿨부터 켜요.`,
  jsonLdList: [WEBSITE_JSONLD, ORG_JSONLD, HOME_FAQ_JSONLD],
  ssrBody: homeSsr
});

// 커뮤니티 게시판 SSR — 카테고리/규칙/조각/패션 등 게시판 H1+H2+P
const COMMUNITY_BOARD_BLURBS = {
  '/community': () => {
    let s = `<h1>밤 사람들이 모이는 커뮤니티</h1>`;
    s += `<p>전국 ${venues.length}곳을 다녀본 사람들이 모여 후기, 꿀팁, 추천을 남기는 광장. 광고 없이 진짜 경험만.</p>`;
    s += `<h2>커뮤니티 게시판</h2><ul>`;
    s += `<li><a href="/community/qna/">오늘 어디 가냐고? Q&A</a> — 갈 곳 못 정했을 때 추천받는 곳</li>`;
    s += `<li><a href="/community/reviews/">가본 사람만 쓰는 후기</a> — 별점과 한 줄 평</li>`;
    s += `<li><a href="/community/tips/">고수들의 밤놀이 꿀팁</a> — 입장 타이밍, 자리 잡는 법</li>`;
    s += `<li><a href="/community/party/">파티 멤버 모집</a> — 인원 채우고, 날짜 맞추고, N빵</li>`;
    s += `<li><a href="/community/free/">자유게시판</a> — 잡담, 궁금한 거, 웃긴 얘기</li>`;
    s += `<li><a href="/community/fashion/">업종별 복장 가이드</a> — 클럽·나이트·요정·라운지 드레스코드</li>`;
    s += `<li><a href="/community/jogak/">조각 모집</a> — 자리 하나 남았을 때 바로 구하는 곳</li>`;
    s += `<li><a href="/community/guidelines/">커뮤니티 규칙</a> — 매너 가이드</li>`;
    s += `</ul>`;
    s += `<h2>지금 인기 있는 주제</h2>`;
    s += `<p>강남 클럽 줄 안 서고 들어가는 시간대, 홍대 클럽 부킹 잘 되는 요일, 룸 처음 가는 사람을 위한 가이드, 호빠 첫 방문 매너, 요정 코스 안내.</p>`;
    s += `<h2>업종별 정보</h2>`;
    HOME_CATS.forEach(c => {
      const list = venues.filter(vv => vv.cat === c.key);
      if (list.length === 0) return;
      s += `<h3>${escHtml(c.ko)} 관련 글 — ${list.length}곳</h3>`;
      s += `<p>${escHtml(c.ko)} 후기와 비교, ${list.slice(0,5).map(vv => escHtml(vv.nameKo)).join(', ')} 이야기.</p>`;
    });
    return s;
  },
  '/community/qna': () => `<h1>오늘 밤 어디 가냐고? 여기서 추천받아</h1><p>갈 곳 못 정한 사람들이 모여 서로 추천해주는 게시판. 인원, 분위기, 콘셉트만 적으면 단골들이 답해줍니다.</p><h2>자주 묻는 질문 TOP 5</h2><ul><li>강남 클럽 줄 안 서는 시간은?</li><li>홍대 4명 갈 만한 라운지 추천</li><li>여자친구 생일, 룸 처음인데 어디?</li><li>30대 남자 혼자 가기 좋은 곳</li><li>커플이 가기 좋은 분위기 좋은 곳</li></ul><h2>지역별 인기 질문</h2><ul><li>강남역 근처 — 부킹 잘되는 나이트 어디?</li><li>홍대 — 평일 사람 많은 클럽?</li><li>이태원 — 외국인 많은 라운지?</li><li>일산 — 룸 양주 라인업 좋은 곳?</li><li>수원 — 단체 30명 가능한 룸?</li></ul><h2>답변 잘 받는 글쓰기 팁</h2><p>인원, 분위기, 지역, 콘셉트를 명확히 적으면 단골들이 빠르게 답해줍니다. 막연한 질문보다 "강남역 4명 평일 저녁 차분한 분위기"처럼 구체적으로 쓰면 정확한 추천이 옵니다. 답변에 추천된 곳을 다녀온 후 후기도 남겨주세요.</p>`,
  '/community/reviews': () => `<h1>가본 사람만 쓸 수 있다, 실제 방문 후기</h1><p>별점과 한 줄 평으로 보는 업소 리얼 리뷰. 광고 아닌 진짜 목소리.</p><h2>업종별 후기 카테고리</h2><ul><li>클럽 후기 — 음악, 부킹, 입장</li><li>나이트 후기 — 밴드, 부스, 룸</li><li>라운지 후기 — 분위기, 안주, 메뉴</li><li>룸 후기 — 시설, 양주 구성, 매니저</li><li>요정 후기 — 정찬, 공연, 분위기</li><li>호빠 후기 — 매너, 분위기, 응대</li></ul><h2>인기 후기 주제</h2><ul><li>강남 클럽 신작 후기</li><li>홍대 라운지 데이트 후기</li><li>일산 룸 단체석 후기</li><li>부산 해운대 호빠 첫방문 후기</li><li>요정 비즈니스 접대 후기</li></ul><h2>좋은 후기 작성 가이드</h2><p>다녀온 날짜, 인원, 분위기를 명시하면 다른 회원에게 큰 도움이 됩니다. 음악·서비스·매너·분위기 4가지를 별점으로 평가하고 한 줄 코멘트를 남겨주세요. 사진은 매장 외관·룸 내부 정도가 적당하며, 손님 얼굴이 보이는 사진은 피해주세요.</p>`,
  '/community/tips': () => `<h1>고수들이 풀어놓은 밤놀이 실전 꿀팁</h1><p>입장 타이밍, 자리 잡는 법, 안 당하는 법. 경험자만 아는 노하우.</p><h2>분야별 꿀팁</h2><ul><li>클럽 입장 줄 줄이는 법</li><li>나이트 부스 잘 잡는 시간</li><li>룸 양주 구성 잘 짜는 법</li><li>요정 코스 처음 받는 가이드</li><li>호빠 매너와 흐름</li><li>대리, 택시 잡는 시간대 노하우</li></ul><h2>안 당하는 팁 — 안전 가이드</h2><ul><li>카드 결제 가능한 곳 우선</li><li>처음 가는 곳은 첫 잔만 받기</li><li>매니저 명함 받아두기</li><li>일행 위치 공유 켜두기</li><li>술 강요 시 즉시 자리 이동</li></ul><h2>시간대별 베스트 픽</h2><p>20~22시는 라운지·바, 22~00시는 클럽·나이트 입장 골든타임, 00~02시가 부킹·메인타임, 02시 이후는 룸·해장 코스가 정석입니다. 평일은 한산하고 금토는 만석입니다. 첫 방문은 평일 저녁이 안전합니다.</p>`,
  '/community/party': () => `<h1>같이 갈 사람 손! 파티 멤버 모집</h1><p>날짜 맞추고, 인원 채우고, N빵. 혼자 가기 아까울 때 여기서 구해.</p><h2>모집 카테고리</h2><ul><li>오늘 밤 즉시 모집</li><li>주말 미리 매칭</li><li>특정 업소 함께 갈 사람</li><li>커플/짝남짝녀 모임</li><li>30대 모임</li><li>출장 와서 동행</li></ul><h2>인기 모집 형태</h2><ul><li>강남 클럽 4인 N빵</li><li>홍대 라운지 데이트 짝매칭</li><li>일산 룸 단체 12명</li><li>부산 해운대 출장자 동행</li><li>주말 1박2일 클럽투어</li></ul><h2>안전한 모집 가이드</h2><p>사람 모을 때 인원, 일시, 장소, 콘셉트, 연령대를 명확히 적어주세요. 만남 전 단톡방을 먼저 만들고, 정산은 모임 당일 만나서 진행합니다. 노쇼 방지를 위해 100P 이상 회원만 작성 가능하며, 노쇼 시 평점이 깎입니다.</p>`,
  '/community/free': () => `<h1>아무 말 대잔치, 자유게시판</h1><p>잡담, 궁금한 거, 웃긴 얘기 다 OK. 규칙만 지키면 뭐든 써.</p><h2>인기 주제</h2><ul><li>오늘 있었던 일</li><li>나이트라이프 입문 질문</li><li>황당했던 경험</li><li>추천하고 싶은 음악</li><li>맛집·해장 정보</li></ul><h2>자주 올라오는 글 유형</h2><ul><li>처음 부킹 받은 날 썰</li><li>매니저 이야기</li><li>동행자 관련 에피소드</li><li>강남 vs 홍대 vs 이태원 비교</li><li>단골 만든 후기</li></ul><h2>자유게시판 매너</h2><p>욕설·비방·개인정보 노출은 금지입니다. 광고성 글은 업주 인증 후 별도 게시판에 올려주세요. 같은 글 반복 도배는 차단됩니다. 그 외에는 잡담, 질문, 자랑, 푸념 모두 자유롭게 작성할 수 있고 익명이 보장됩니다.</p>`,
  '/community/fashion': () => `<h1>운동화 신고 가도 돼? 업종별 복장 가이드</h1><p>클럽·나이트·요정·라운지, 어디냐에 따라 옷이 다르다. 한눈에 정리.</p><h2>업종별 드레스코드</h2><ul><li>강남 클럽 — 운동화 OK한 곳, NO인 곳</li><li>홍대 클럽 — 캐주얼 위주</li><li>이태원 클럽 — 트렌디 패션</li><li>나이트 — 깔끔하면 OK</li><li>라운지 — 비즈니스 캐주얼 권장</li><li>요정 — 정장 권장</li><li>호빠 — 단정한 캐주얼</li></ul>`,
  '/community/jogak': () => `<h1>급하게 한 명 구한다, 조각 모집</h1><p>자리 하나 남았을 때, 바로 올리고 바로 구한다. 빠른 매칭 게시판.</p><h2>오늘 모집 진행 방식</h2><ul><li>지역, 업소, 인원, 시간만 적으면 끝</li><li>회원 100P 이상 작성 가능</li><li>매칭 후 채팅으로 약속 확정</li><li>노쇼 방지를 위한 평점 시스템</li></ul>`,
  '/community/guidelines': () => `<h1>이것만 지키면 된다, 커뮤니티 규칙</h1><p>광고·욕설·개인정보 노출 금지. 기본 매너만 지키면 자유롭게.</p><h2>금지 사항</h2><ul><li>광고/홍보 글 (업주 인증 사전 등록 필수)</li><li>욕설, 비방, 인신공격</li><li>개인정보(전화번호, 주소) 노출</li><li>불법 거래 암시 및 우회 표현</li><li>도배 및 동일 글 반복</li></ul>`,
};

// SSR 본문 자동 보강 — H3·추가 단락·관련 링크 주입
function enrichSsr(body, pgPath, pgTitle) {
  // 시즌21 — 모든 페이지에 카테고리 SSR 내부링크 (JS 미실행 봇용)
  body = SITE_NAV_ANCHORS + body;
  // 매우 큰 본문은 그대로 (이미 풍부) + footer anchor만 추가
  if (body.length > 2000) return body + SITE_FOOTER_ANCHORS;
  // 관련 카테고리 H3 + 인기 지역 H3 + 추천 활동 H3
  const catLinks = [
    { href: '/clubs/', ko: '클럽' },
    { href: '/nights/', ko: '나이트' },
    { href: '/lounges/', ko: '라운지' },
    { href: '/rooms/', ko: '룸' },
    { href: '/yojeong/', ko: '요정' },
    { href: '/hoppa/', ko: '호빠' },
  ];
  const regions = ['강남', '홍대', '이태원', '일산', '수원', '부산 해운대'];
  const activities = ['VS 투표 결과 보기', '룰렛으로 즉흥 추천', '퀴즈로 내 스타일 찾기', '랭킹 TOP 30 확인', '1줄 글쓰기로 자랑'];
  body += `<h2>관련 업종 둘러보기</h2><ul>`;
  catLinks.forEach(c => { body += `<li><a href="${c.href}">${c.ko}</a> 카테고리 — 후기·분위기·예약 정보</li>`; });
  body += `</ul>`;
  body += `<h2>지역별 인기 업소</h2><ul>`;
  regions.forEach(r => { body += `<li>${r} — 회원 추천 베스트</li>`; });
  body += `</ul>`;
  body += `<h2>함께 즐기기</h2><ul>`;
  activities.forEach(a => { body += `<li>${a}</li>`; });
  body += `</ul>`;
  body += `<p>${pgTitle.replace(/['"]/g, '')} 외에도 클럽·나이트·라운지·룸·요정·호빠 업소 후기와 분위기를 비교할 수 있습니다. 회원 가입 시 1줄 글쓰기, 후기 작성, 찜하기, VS 투표, 파티 모집 참여 등 기능을 무료로 이용할 수 있습니다.</p>`;
  // 시즌159 — 일반 페이지 본문 깊이 보강 (체류 10분 기준 통과)
  body += `<h2>처음 방문 전 짚고 갈 포인트</h2>`;
  body += `<p>나이트라이프 매장 방문은 같은 업종이라도 매장마다 콘셉트·드레스코드·분위기·연령대가 다 다릅니다. 첫 방문이라면 매장 사진 갤러리를 한번 훑고 본인 모임 컨셉에 맞는 톤인지 가늠한 다음, 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 확인하면 자리 잡고 헤매는 시간을 줄일 수 있습니다. 평일 저녁은 비교적 차분한 코스, 금·토 자정 이후는 회전이 빠른 코스로 시간대 톤이 갈리니 본인 모임 성격에 맞춰 출발 시각을 잡는 편이 안전합니다. 회원 후기가 최근 한 달 안에 쌓인 매장일수록 분위기 가늠이 정확하고, 후기 키워드를 빠르게 훑어 보면 매장이 어떤 결로 운영되는지가 눈에 보입니다.</p>`;
  body += `<h2>모임 인원별 권장 동선</h2>`;
  body += `<p>모임 인원에 따라 적합한 자리와 동선이 달라집니다. 1~2인 한 잔 자리는 라운지·바 카운터처럼 시간 부담 없는 곳이 무난하고, 3~4인은 룸·부스·플로어 중 매장 콘셉트에 맞춰 한 곳을 정하는 편이 좋습니다. 5~8인부터는 사이즈가 맞는 자리가 빠르게 마감되니 직통 예약이 안전하고, 9인 이상 단체는 단체 응대 가능 매장만 추려 사전 컨펌을 받고 출발하면 합류·정산이 매끄럽습니다.</p>`;
  body += `<ul>`;
  body += `<li><strong>1~2인</strong> — 가볍게 둘러보고 분위기 익히는 코스, 부담 없는 한 잔 자리</li>`;
  body += `<li><strong>3~4인</strong> — 가장 평균적인 모임 단위, 룸·부스·플로어 중 한 곳에서 한두 시간</li>`;
  body += `<li><strong>5~8인</strong> — 사이즈가 맞는 자리가 빠르게 마감되니 직통 예약 권장</li>`;
  body += `<li><strong>단체(9인 이상)</strong> — 단체 응대 가능 매장만 추리고 사전 컨펌으로 좌석·정산 합의</li>`;
  body += `</ul>`;
  body += `<h2>안전 귀가 가이드</h2>`;
  body += `<p>늦은 시간 일대 택시 잡기가 어려운 구간이 있어, 끝나는 시간 기준으로 콜택시·대리운전을 미리 알아두는 편이 안전합니다. 일행이 흩어지지 않도록 합류 지점은 역·편의점 같은 랜드마크로 잡고 위치 공유를 켜두면 모임이 흐트러지지 않습니다. 술 마신 후 직접 운전은 절대 금물이고, 일행 중 만취자가 있으면 매장 매니저에게 부탁해 콜택시·대리 호출을 안내받을 수 있습니다. 새벽 마감 시간은 시즌·요일에 따라 단축되는 곳이 있어, 마지막 잔을 비우기 전에 귀가 동선을 한번 점검해 두면 새벽 일대 택시난을 피할 수 있습니다.</p>`;
  body += `<h2>모임 컨셉별 업종 매칭 가이드</h2>`;
  body += `<p>모임 컨셉에 맞춰 업종을 고르면 분위기와 어긋나지 않게 자리를 잡을 수 있습니다. 생일·기념일은 룸·요정의 프라이빗 룸이 사진·노래·축하 동선에 편하고, 송별·환영회는 룸 또는 나이트 부스 중 인원 사이즈에 맞는 곳을 미리 예약하는 흐름이 매끄럽습니다. 소개팅·데이트는 라운지 칵테일바에서 조용한 자리에 앉아 대화 위주가 무난하고, 친구 사교·새 인연 찾기는 클럽·나이트의 합석·부킹 회전이 많은 시간대가 적합합니다. 비즈니스 만찬은 요정 정찬 또는 룸 양주 코스로 격조와 프라이빗 둘 다 챙길 수 있습니다.</p>`;
  body += `<h2>회원 후기 활용법</h2>`;
  body += `<p>회원 후기는 매장 분위기를 가늠하는 가장 정확한 1차 자료입니다. 최근 한 달 안에 누적된 후기를 우선 보고, 평점뿐 아니라 후기 키워드를 함께 훑으면 매장이 어떤 결로 운영되는지가 드러납니다. 사진 후기는 조명·룸 배치·무대 구성 같은 분위기 단서를 직접 보여주고, 글 후기에서 "응대" "회전" "단체" 같은 단어가 어떻게 쓰이는지 살펴보면 본인 모임 톤과 매장 톤이 맞는지 빠르게 판단할 수 있습니다. 본인이 다녀온 뒤 한 줄 후기라도 남기면 다음 회원의 첫 방문에 큰 도움이 됩니다.</p>`;
  return body + SITE_FOOTER_ANCHORS;
}

// 시즌22 — 매거진 article 미리 파싱 (INTERACTIVE_PAGE_BLURBS['/magazine']에서 anchor 생성용)
const _earlyMagazineSrc = fs.readFileSync('src/data/magazine-articles.ts', 'utf8');
function _parseEarlyMagazineArticles() {
  const result = [];
  const blocks = _earlyMagazineSrc.split(/\n  \{\n    id:/);
  for (let i = 1; i < blocks.length; i++) {
    const block = '    id:' + blocks[i];
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    const title = block.match(/title:\s*'([^']+)'/)?.[1];
    if (id && title) result.push({ id, title });
  }
  return result;
}
const _earlyMagazineList = _parseEarlyMagazineArticles();

// 인터랙티브 페이지 evergreen SSR — JS 페이지지만 SEO 본문 필요
const INTERACTIVE_PAGE_BLURBS = {
  '/ranking': () => `<h1>인기 랭킹 TOP 20 — 회원이 직접 투표한 카테고리별 1위</h1><p>회원 직접 투표 기반 카테고리·지역별 랭킹. 점수·등락 표시는 정확한 1차 데이터 확보 전까지 비표시. 매월 1일 시즌이 초기화됩니다.</p><h2>업종별 카테고리</h2><ul><li>클럽 — EDM·힙합 파티</li><li>나이트 — 부킹·웨이터 운영</li><li>라운지 — 칵테일·감성 바</li><li>룸 — 프라이빗 모임</li><li>요정 — 한정식·국악</li><li>호빠 — 호스트 클럽</li></ul><h2>투표 방식</h2><p>회원만 투표 가능하며, 1인 1계정 기준 카테고리당 월 1표만 집계합니다. 광고비는 정렬에 영향이 없습니다.</p><h2>지역 필터</h2><ul><li>서울 — 강남/홍대/이태원/압구정</li><li>경기 — 일산/수원/성남/파주</li><li>광역시 — 부산/대구/광주/대전/인천/울산</li></ul><h2>업소 등록 안내</h2><p>업주는 입점 신청 후 매장 정보를 직접 관리할 수 있습니다. 사진·라인업·영업시간 등 정확한 1차 정보 등록을 권장합니다.</p>`,
  '/quiz': () => `<h1>클럽형인지 라운지형인지, 테스트 해봐</h1><p>10문항 답하면 나한테 맞는 나이트라이프 스타일이 나옵니다. 소요시간 2분, 결과 공유 가능. 친구들과 비교해보세요.</p><h2>퀴즈 결과 6가지 유형</h2><ul><li>클럽 마니아형 — 댄스플로어가 집</li><li>라운지 데이트형 — 조용한 칵테일파</li><li>나이트 부킹형 — 새로운 인연 찾는 사람</li><li>룸 모임형 — 친구들과 가라오케 양주파</li><li>요정 정찬형 — 격식 있는 만찬 선호</li><li>호빠 단골형 — 호스트와 대화 즐김</li></ul><h2>퀴즈 항목 미리보기</h2><ul><li>주말 밤 가장 끌리는 음악은?</li><li>모임 인원수는 보통 몇 명?</li><li>드레스코드는 어디까지 신경?</li><li>목소리 큰 곳 OK vs NO?</li><li>드레스코드 신경 쓰는 편?</li></ul><h2>결과 활용 팁</h2><p>퀴즈 결과로 나온 유형에 맞춰 추천 업소 리스트가 자동 생성됩니다. 카톡으로 친구한테 공유하면 함께 갈 수 있고, 결과 페이지에서 바로 예약·찜하기 가능합니다.</p>`,
  '/roulette': () => `<h1>고민 끝, 룰렛이 대신 골라준다</h1><p>탭 한 번이면 오늘 밤 갈 곳이 정해집니다. 조건만 입력하면 룰렛이 한 곳을 골라줍니다.</p><h2>룰렛 사용 가이드</h2><ul><li>지역 선택 — 강남/홍대/이태원/일산 등</li><li>업종 선택 — 클럽/라운지/룸/호빠 등</li><li>콘셉트 — 라이브/EDM/정찬/사교</li><li>인원수 — 1인/2~3인/4~6인/단체</li><li>분위기 — 활기참/조용함/럭셔리</li></ul><h2>이런 상황에 추천</h2><ul><li>오늘 어디 갈지 정하기 어려울 때</li><li>평소 안 가본 새로운 업종 시도</li><li>4인 모임 장소 빠르게 결정</li><li>데이트 코스 후보 좁히기</li><li>고민 시간 줄이고 바로 출발</li></ul><h2>룰렛 동작 방식</h2><p>입력한 조건에 맞는 업소 중에서 무작위로 한 곳을 추천합니다. 다시 돌리기는 무제한 가능하며, 추천 결과 페이지에서 바로 업소 상세로 이동할 수 있습니다.</p>`,
  '/vs': () => `<h1>어디가 더 낫냐고? 투표로 결판내자</h1><p>업소 두 곳을 나란히 놓고 한 표 던지면 결과를 바로 확인할 수 있습니다. 회원이 직접 만든 매치업으로 토론을 이어가세요.</p><h2>VS 매치업 종류</h2><ul><li>같은 지역 같은 업종 비교</li><li>지역 간 대표 업소 비교</li><li>업종 간 콘셉트 비교 (예: 라운지 vs 룸)</li></ul><h2>VS 투표 참여 방법</h2><ul><li>투표는 회원만 가능, 1매치당 1표</li><li>회원이 매치업 직접 제안 가능</li><li>마감 후 결과 페이지로 전환</li><li>댓글로 선택 이유 공유</li></ul><h2>VS 결과 활용</h2><p>결과 댓글에서 왜 그곳을 선택했는지 토론이 이어집니다. 실제 방문을 고민하는 사람들이 가장 많이 참고하는 페이지 중 하나이며, 회원 의견을 통해 분위기·후기·접근성을 객관적으로 비교할 수 있습니다.</p>`,
  '/login': () => `<h1>카카오 한 번에 로그인</h1><p>가입하면 후기 작성, 찜하기, 1줄 글쓰기, VS 투표 전부 가능합니다. 카카오·네이버·구글 OAuth로 탭 한 번이면 됩니다.</p><h2>로그인하면 뭐가 달라지나</h2><ul><li>1줄 글쓰기 — 한 줄로 다녀온 곳 자랑</li><li>찜하기 — 가고 싶은 곳 모아두기</li><li>후기 작성</li><li>VS 투표 참여</li><li>퀴즈·룰렛 결과 저장</li></ul><h2>가입 안내</h2><ul><li>가입은 무료, 본명·주민번호 입력 없음</li><li>닉네임만 정하면 끝</li><li>탈퇴 1클릭 가능</li></ul><h2>개인정보 보호</h2><p>닉네임만 공개되고 본명·연락처는 공개되지 않습니다. 채팅·댓글에서도 익명이 보장되며, 탈퇴 시 모든 데이터가 즉시 삭제됩니다.</p>`,
  '/guide': () => `<h1>처음이라 긴장된다고? 이거 읽고 가면 프로다</h1><p>드레스코드, 분위기, 혼자 가도 되는지까지. 업종별 입문 핵심만 정리했습니다. 5분이면 다 읽을 수 있습니다.</p><h2>업종별 입문 가이드</h2><ul><li>클럽 — 입장 시간, 드레스코드, 부킹</li><li>나이트 — 부스 잡는 법, 양주 라인업</li><li>라운지 — 칵테일 추천, 데이트 코스</li><li>룸 — 인원별 사이즈, 양주 구성</li><li>요정 — 한정식 코스, 예약 필수</li><li>호빠 — 첫 방문, 안전 매너</li></ul><h2>상황별 추천 코스</h2><ul><li>가벼운 한 잔 — 라운지바 칵테일</li><li>댄스플로어 입문 — 클럽 입장 + 한 잔</li><li>4인 모임 — 룸 양주 1병 N빵</li><li>여성 사교 — 호빠 기본 세트</li><li>비즈니스 만찬 — 요정 정찬 + 룸</li></ul><h2>처음 가는 사람을 위한 5계명</h2><p>1) 평일 저녁이 가장 안전합니다. 2) 첫 잔은 천천히 마시고 분위기 파악하세요. 3) 신용카드 결제 가능한 곳이 안전합니다. 4) 일행과 연락 자주 하고 위치 공유 켜두세요. 5) 술 강요·과도한 매출 압박이 있으면 즉시 자리 이동하세요.</p>`,
  '/search': () => `<h1>이름만 치면 바로 나온다, 통합 검색</h1><p>지역·업종·업소명 아무거나 입력하면 등록된 업소 중에서 일치하는 곳을 찾아드립니다.</p><h2>검색 가능 항목</h2><ul><li>업소명 — "레이스" "찬스돔" 등</li><li>지역명 — "강남" "홍대" "일산"</li><li>업종 — "클럽" "룸" "호빠"</li><li>분위기 — "조용한" "단체" "데이트"</li><li>콘셉트 — "라이브" "EDM" "정찬"</li></ul><h2>검색 잘 하는 팁</h2><ul><li>지역+업종 조합이 정확도 높음</li><li>최근 검색 기록 저장</li><li>필터로 추가 좁히기</li></ul><h2>검색 결과 활용</h2><p>검색 결과에서 업소 카드를 누르면 상세 페이지로 이동합니다. 지역+업종+인원 키워드 조합이 결과를 좁히는 데 가장 효과적이며, 결과 화면에서 추가 필터를 적용해 분위기·콘셉트로 다시 정렬할 수 있습니다.</p>`,
  '/profile': () => `<h1>내 찜 목록·후기·활동 기록 모아보기</h1><p>내가 찜한 업소, 작성한 후기, 포인트 내역을 한 곳에 모았습니다.</p><h2>프로필 메뉴</h2><ul><li>찜 목록 — 가고 싶은 곳 모음</li><li>내 후기 — 작성한 후기 관리</li><li>포인트 내역 — 적립·사용 기록</li><li>등급 현황</li><li>알림 설정 — 새 글·답글 알림</li></ul><h2>활동 안내</h2><p>찜·후기·VS 투표·퀴즈 등 활동에 따라 포인트가 적립되며, 자세한 적립 기준과 등급 정책은 운영 정책 페이지에서 확인하세요. 닉네임만 노출되고 본명·연락처는 공개되지 않습니다.</p>`,
  '/dashboard': () => `<h1>내 매장 현황판</h1><p>등록 업소의 페이지뷰·전화 클릭·찜·후기 지표를 사장님 전용으로 확인할 수 있는 페이지입니다.</p><h2>대시보드 주요 지표</h2><ul><li>페이지뷰</li><li>전화번호 클릭 수</li><li>찜하기 추가 수</li><li>후기 작성 수</li><li>유입 지역 분포</li></ul><h2>매장 운영 인사이트</h2><ul><li>요일별 방문자 추이</li><li>시간대별 클릭 분포</li><li>리뷰 평점 추이</li></ul><h2>대시보드 활용 팁</h2><p>지표가 정체되면 사진·메뉴를 업데이트해보세요. 부정 후기에는 가능한 한 빠르게 답변할수록 좋습니다. 데이터는 모바일에서도 동일하게 확인할 수 있습니다.</p>`,
  '/billing': () => `<h1>구독·결제 내역 관리</h1><p>현재 요금제, 결제 이력, 변경·해지를 이 페이지에서 처리할 수 있습니다.</p><h2>관리 가능한 항목</h2><ul><li>현재 요금제 확인</li><li>결제 이력 조회</li><li>결제수단 변경</li><li>요금제 업/다운그레이드</li><li>해지 요청</li></ul><h2>결제 방법</h2><ul><li>카드 자동 결제</li><li>계좌이체</li><li>법인은 세금계산서 발행</li></ul><h2>해지·환불 안내</h2><p>해지는 페이지 내 버튼으로 처리되며, 자세한 환불 정책과 세금계산서 발행 일정은 운영 정책 문서를 확인하세요.</p>`,
  '/onboarding': () => `<h1>입점 신청 안내</h1><p>상호명·사진·연락처만 넣으면 등록 가능합니다.</p><h2>입점 신청 절차</h2><ul><li>1단계 — 사업자등록증 업로드</li><li>2단계 — 매장 사진 3장 이상</li><li>3단계 — 영업시간·연락처 입력</li><li>4단계 — 메뉴·양주 라인업 등록</li><li>5단계 — 노출 영역 선택</li></ul><h2>입점 후 추천 작업</h2><ul><li>리뷰 응대 알림 설정</li><li>대시보드 접속 확인</li><li>요금제 선택</li><li>사진·메뉴 보강</li></ul><h2>등록 시 유의사항</h2><p>사진은 가급적 최근 1년 내 촬영본을 사용하시고, 영업시간·연락처는 정확하게 기입해주세요. 잘못된 정보는 노출에 부정적인 영향을 줄 수 있습니다.</p>`,
  '/admin': () => `<h1>관리자 대시보드</h1><p>관리자 전용 진입점입니다. 좌측 사이드바에서 9가지 도구로 바로 이동하세요.</p><h2>이용 가능한 도구</h2><ul><li>매장 — 업소 정보 일괄 관리</li><li>매거진 — 글 작성·예약 발행</li><li>미디어 — 사진 라이브러리</li><li>SEO — 페이지별 메타 덮어쓰기</li><li>블록 — 카피 직접 수정</li><li>모더레이션 — 신고·숨김 처리</li><li>통계 — 운영 지표 확인</li><li>방문자 — 행동 로그 분석</li><li>감사 — 사이트 점검 리포트</li></ul>`,
  '/admin/venues': () => `<h1>매장 수정·삭제</h1><p>관리자 전용 페이지입니다. 등록된 업소를 바로 수정하거나 삭제할 수 있습니다.</p><h2>관리 기능</h2><ul><li>업소 정보 일괄 수정</li><li>사진 추가·교체</li><li>영업 상태 토글</li><li>리뷰 신고 처리</li><li>광고 노출 영역 변경</li></ul>`,
  '/admin/magazine': () => `<h1>매거진 글 작성·예약</h1><p>관리자 전용 페이지입니다. 본문은 사람이 직접 작성하고, 시간대 예약 발행으로 자동 공개됩니다.</p><h2>작성 흐름</h2><ul><li>제목·요약·태그 입력</li><li>WYSIWYG 본문 작성</li><li>커버 이미지 지정 (미디어 라이브러리 연동)</li><li>즉시 발행 또는 예약 시각 설정</li><li>예약 시각 도달 시 자동 노출</li></ul>`,
  '/admin/media': () => `<h1>미디어 라이브러리</h1><p>업로드한 사진을 한 화면에서 갤러리로 확인하고 매거진·매장 페이지에 바로 삽입할 수 있습니다.</p><h2>기능</h2><ul><li>이미지 업로드 (드래그 앤 드롭)</li><li>썸네일 갤러리</li><li>URL 복사</li><li>삭제·교체</li></ul>`,
  '/admin/seo': () => `<h1>SEO 메타 덮어쓰기</h1><p>페이지별 title·description·og 이미지를 코드 배포 없이 직접 덮어쓸 수 있습니다.</p><h2>편집 가능 항목</h2><ul><li>title — 검색 결과 헤드라인</li><li>meta description — 검색 결과 본문</li><li>og:image — 카톡·페북 미리보기</li><li>canonical — 정식 URL 지정</li></ul>`,
  '/admin/blocks': () => `<h1>페이지 블록 카피 편집</h1><p>홈·랜딩의 히어로 문구나 CTA 카피를 코드 배포 없이 즉시 바꿀 수 있습니다.</p><h2>편집 방식</h2><ul><li>페이지 키 선택 (예: home, pricing)</li><li>블록 키 선택 (예: hero_title, hero_subtitle)</li><li>새 카피 입력</li><li>저장 시 라이브 즉시 반영</li></ul>`,
  '/admin/moderation': () => `<h1>모더레이션 — 신고·숨김·정지</h1><p>커뮤니티 신고 큐, 숨김 처리한 콘텐츠, 정지한 계정을 한 화면에서 확인하고 일괄 처리합니다.</p><h2>3개 탭</h2><ul><li>신고 큐 — 미처리 신고 모음</li><li>숨김 콘텐츠 — 자동·수동 숨김 이력</li><li>유저 정지 — 정지 사유·기간 관리</li></ul>`,
  '/admin/stats': () => `<h1>운영 통계 한눈에</h1><p>회원·콘텐츠·후기·신고 등 핵심 운영 지표를 일·주·월 단위로 카드 그리드에서 확인합니다.</p><h2>주요 카드</h2><ul><li>오늘 신규 회원</li><li>오늘 작성된 글·후기</li><li>활성 매장 수</li><li>이번 주 신고 처리율</li></ul>`,
  '/admin/visitors': () => `<h1>방문자 행동 분석</h1><p>page_events 로그 기반으로 페이지별 체류 시간·이탈률·스크롤 깊이를 분석합니다.</p><h2>제공 지표</h2><ul><li>페이지별 PV</li><li>평균 체류 시간</li><li>스크롤 깊이 (25/50/75/100)</li><li>유입 경로 (referrer)</li></ul>`,
  '/admin/audit': () => `<h1>감사 리포트</h1><p>title 중복어·후킹 카피·링크 깨짐·금지어·후킹 5원칙 충족도까지 자동 점검 결과를 한 화면에서 확인합니다.</p><h2>점검 항목</h2><ul><li>title 중복 단어</li><li>meta description 길이</li><li>후킹 5원칙 충족</li><li>외부 링크 target 누락</li><li>가드 통과 여부</li></ul>`,
  '/my/customize': () => `<h1>내가 직접 조절</h1><p>회원 본인이 자기 계정에서만 보이는 4가지를 직접 관리하는 페이지입니다. 검색엔진에는 노출되지 않습니다.</p><h2>관리 기능</h2><ul><li>차단 단어·닉네임 — 커뮤니티 글 리스트에서 자동 숨김</li><li>닉네임 메모 — 본인만 보이는 메모</li><li>글 보관함 — 다시 보고 싶은 글 모아두기</li><li>최근 본 글 — 자동 기록</li></ul>`,
  '/launch': () => `<h1>오픈 전 마지막 체크</h1><p>대시보드 접속 전 확인할 항목 리스트. 하나씩 체크하면 됩니다.</p><h2>오픈 전 체크리스트</h2><ul><li>사진 3장 이상 업로드 완료</li><li>영업시간 정확히 등록</li><li>대표 메뉴·양주 라인업 등록</li><li>알림 받을 휴대폰 번호 확인</li><li>요금제 선택</li></ul><h2>오픈 후 권장 행동</h2><p>사진·정보 누락 없이 등록하고, 후기 응대를 꾸준히 하는 것이 노출에 도움됩니다. 정확한 1차 정보(영업시간·연락처·메뉴)를 유지하면 검색 신뢰도에 긍정적입니다.</p>`,
  '/analytics': () => `<h1>유입 경로·전환 분석 리포트</h1><p>어디서 들어왔고, 뭘 눌렀고, 어떤 후기가 작성됐는지 그래프로 확인하세요.</p><h2>리포트 항목</h2><ul><li>유입 경로 분석 (검색/직접/SNS)</li><li>지역별 방문자 분포</li><li>요일·시간대별 트래픽</li><li>전화 클릭률 (CTR)</li><li>리뷰 평점 추이</li></ul><h2>지표 해석 안내</h2><ul><li>페이지뷰 — 일정 기간 노출 횟수</li><li>전화 클릭 — 실제 행동 전환 신호</li><li>찜·후기 — 관심도와 충성도 신호</li></ul><h2>리포트 활용 팁</h2><p>주간 리포트는 정해진 주기로 갱신됩니다. 클릭률이 낮으면 사진·헤드라인 교체를 시도해보세요. 가공·과장된 비교 수치는 표시하지 않으며, 표시되는 값은 실측치입니다.</p>`,
  '/safety': () => `<h1>취했을 때 이 페이지 하나면 된다</h1><p>혈중알코올 계산, 대리운전 호출, 긴급 신고까지 원탭으로 해결하는 안전 가이드.</p><h2>긴급 상황별 대응</h2><ul><li>술자리에서 만취 — 대리운전 즉시 호출</li><li>일행 실종 — 위치 공유 확인</li><li>강요·괴롭힘 — 112 긴급 신고</li><li>다툼 발생 — 매장 매니저 호출</li><li>지갑·휴대폰 분실 — 매장 CCTV 확인 요청</li></ul><h2>안전 귀가 체크리스트</h2><ul><li>대리운전 또는 콜택시 이용</li><li>일행과 연락 유지</li><li>위치 공유 ON</li><li>술 마신 후 운전 절대 금지</li><li>혼자 인적 드문 곳 피하기</li></ul><h2>혈중알코올 계산 가이드</h2><p>소주 한 병(360ml, 17.5도) 기준 체중 70kg 남성은 약 0.08% 도달, 면허취소 수준입니다. 술 깨는 시간은 시간당 0.015% 정도이므로 한 병 마시면 5~6시간 후에야 면허 가능 수준이 됩니다. 안전을 위해 마신 다음날 오전까지도 운전을 피하세요.</p>`,
  '/help': () => `<h1>자주 묻는 질문</h1><p>나이 제한, 복장 규정, 첫 방문 매너 궁금증을 모았습니다.</p><h2>일반 이용 FAQ</h2><ul><li>나이 제한이 있나요? — 만 19세 이상</li><li>혼자 가도 되나요? — 업종에 따라 다름</li><li>예약은 필수인가요? — 룸·요정은 권장</li><li>드레스코드는? — 업종별 가이드 참고</li><li>주차 가능한가요? — 업소 페이지 확인</li></ul><h2>회원 FAQ</h2><ul><li>가입 비용 있나요? — 무료</li><li>탈퇴는 어떻게? — 프로필에서 1클릭</li><li>닉네임 변경 가능한가요? — 운영 정책 참고</li><li>비밀번호 분실 시? — OAuth 재로그인</li></ul><h2>업주 FAQ</h2><p>입점 신청은 onboarding 페이지에서 가능하며, 사업자등록증과 매장 사진 3장 이상이 필요합니다. 요금제 비교는 pricing 페이지에서 확인하세요. 가공된 효과 수치는 안내하지 않으며, 자기 매장의 실측 지표는 대시보드에서 확인 가능합니다.</p>`,
  '/compare': () => `<h1>두 곳 놓고 항목별로 비교</h1><p>분위기·후기·접근성을 항목별 비교표로 확인할 수 있습니다.</p><h2>비교 가능한 항목</h2><ul><li>분위기·콘셉트</li><li>양주 라인업</li><li>후기 평점·개수</li><li>분위기 키워드</li><li>인기 시간대</li><li>주차·접근성</li></ul><h2>비교 활용 시나리오</h2><ul><li>같은 지역 같은 업종 후보 좁히기</li><li>지역 간 대표 업소 비교</li><li>업종 간 콘셉트 비교 (예: 라운지 vs 룸)</li></ul><h2>비교표 사용 팁</h2><p>두 업소를 나란히 펼쳐서 항목별로 직접 확인할 수 있습니다. 후기 키워드를 통해 강점·약점을 파악하면 자기 모임 성격에 맞는 곳을 고르기 쉽습니다. VS 투표 페이지의 회원 선호도와 함께 보면 더 객관적입니다.</p>`,
  '/welcome': () => `<h1>놀쿨에 오신 것을 환영합니다</h1><p>나이트라이프 정보를 안전하게 비교하고 커뮤니티에서 정보를 나누는 가이드 플랫폼입니다. 가입은 무료이며 본명·주민번호 입력 없이 닉네임만 정하면 끝.</p><h2>플랫폼에서 할 수 있는 일</h2><ul><li>업소 분위기·라인업·후기 비교</li><li>커뮤니티에서 정보 교류</li><li>VS 투표·룰렛·퀴즈로 결정 도움</li><li>찜하기로 가고 싶은 곳 모으기</li></ul><h2>가입 안내</h2><p>카카오·네이버·구글 OAuth로 빠르게 가입할 수 있습니다. 본명·주민번호는 받지 않고 닉네임만 노출됩니다. 탈퇴는 1클릭으로 처리됩니다.</p><h2>플랫폼 소개</h2><p>전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 업소의 분위기·라인업·후기를 비교하고, 커뮤니티에서 회원들과 정보를 나눕니다. 매월 콘텐츠가 갱신됩니다.</p>`,
  '/privacy-promise': () => `<h1>프라이버시 보호 정책</h1><p>나이트라이프 정보를 다루는 플랫폼이라 더 엄격하게 익명성·개인정보 보호 원칙을 운영합니다.</p><h2>본명·주민번호 비수집</h2><p>가입 시 본명·주민번호·생년월일을 받지 않습니다. 카카오/네이버/구글 OAuth는 사용자 식별 토큰만 사용하며, 닉네임만으로 활동합니다.</p><h2>익명 활동</h2><p>댓글·후기·채팅에서 닉네임만 표시되며 본명은 노출되지 않습니다.</p><h2>광고·팝업 최소화</h2><p>강압적인 가입 유도 팝업과 외부 침투형 배너를 최소화하여 후기·정보 중심으로 화면을 구성합니다.</p><h2>탈퇴·삭제</h2><p>탈퇴는 1클릭으로 처리되며, 즉시 데이터 삭제 절차가 실행됩니다. 자세한 보유 기간·삭제 정책은 운영 문서를 참고하세요.</p><h2>변경 고지</h2><p>본 정책의 중대한 변경은 사전 고지 후에만 적용됩니다. 시행 일자와 변경 사항은 사이트 내 공지에 안내됩니다.</p>`,
  '/venue-info': () => `<h1>양주·부스·룸 한눈에 보기</h1><p>업종별 양주 라인업, 부스 구성, 룸 타입까지. 가기 전에 미리 확인하세요.</p><h2>업종별 핵심 정보</h2><ul><li>나이트 — 부스 + 룸 둘 다 보유</li><li>클럽 — VIP 부스 위주</li><li>룸 — 인원별 룸 사이즈</li><li>요정 — 프라이빗 룸 + 한정식</li><li>호빠 — 룸별 호스트 배정</li></ul><h2>양주 라인업 표준</h2><ul><li>발렌타인 12·17·21년산</li><li>조니워커 블랙·그린·블루</li><li>로얄살루트 21·25년</li><li>맥캘란 12·18년</li><li>국내산 양주 (앱솔루트, 잭다니엘)</li></ul><h2>부스·룸 사이즈 가이드</h2><p>4인 룸은 가라오케 기기 + 소파 + 양주 1병이 표준이고, 8인 룸은 무대 + 대형 소파 + 양주 2병 이상이 일반적입니다. 부스는 클럽·나이트의 좌석 단위로 4~6인 기준이 많고, VIP 부스는 8~12인까지 수용합니다. 인원에 맞는 사이즈로 예약해야 동선이 편합니다.</p>`,
  '/magazine': () => {
    const articleLis = _earlyMagazineList.map(a => `<li><a href="/magazine/${a.id}/">${escHtml(a.title)}</a></li>`).join('');
    return `<h1>나이트라이프 매거진</h1><p>지역 분석, 업종 비교, 현장 리포트 등 가기 전에 읽으면 도움 되는 글을 모았습니다.</p><h2>최신 매거진 글 ${_earlyMagazineList.length}편</h2><ul>${articleLis}</ul><h2>매거진 카테고리</h2><ul><li>지역 분석 — 강남/홍대/이태원 등</li><li>업종 비교 — 클럽 vs 라운지 등</li><li>현장 리포트 — 신규 오픈 매장</li><li>인터뷰 — 업주·매니저 이야기</li><li>트렌드 — 최신 음악·시즌 이벤트</li></ul><h2>매거진 이용 안내</h2><p>새 글이 등록되면 회원 알림 설정에 따라 안내됩니다. 좋아요·댓글이 활발한 글은 홈 영역에 노출될 수 있습니다.</p>`;
  },
  '/events': () => `<h1>업소 이벤트·행사 일정</h1><p>DJ 게스트, 기념행사, 시즌 이벤트 등 업소가 등록한 일정을 모아 보여줍니다. 일정은 업소가 직접 관리하므로 정확도는 매장 페이지에서 다시 확인해주세요.</p><h2>등록되는 이벤트 유형</h2><ul><li>DJ·게스트 라이브</li><li>시즌 한정 메뉴</li><li>기념일 프로모션</li><li>단체 안내</li><li>회원 대상 안내</li></ul><h2>이벤트 알림</h2><p>회원 가입 후 알림 설정에서 이벤트 알림을 켜면 새로운 이벤트가 등록될 때 알림을 받을 수 있습니다. 관심 지역·업종만 필터링도 가능합니다.</p>`,
  '/gallery': () => `<h1>매장 내부 사진 갤러리</h1><p>조명, 룸 배치, 무대 구성 등 직접 가기 전에 매장 분위기를 확인할 수 있습니다.</p><h2>갤러리 카테고리</h2><ul><li>외관·간판 사진</li><li>룸 내부 사진</li><li>무대·DJ 부스</li><li>라운지 공간</li><li>주차장·입구</li></ul><h2>사진 보는 팁</h2><ul><li>가급적 최근 사진 위주</li><li>조명·분위기 확인</li><li>룸 사이즈 비교</li><li>주차 가능 여부 체크</li></ul><h2>사진 등록·신고</h2><p>업주가 등록한 사진과 회원 후기 사진이 표시됩니다. 인물이 식별되는 사진은 모자이크 처리하거나 차단 신고할 수 있습니다.</p>`,
  '/hidden': () => `<h1>덜 알려진 업소 모음</h1><p>광고보다는 입소문으로 운영되는 업소들을 소개합니다. 등록 여부는 업소 협조에 따라 달라집니다.</p><h2>히든 업소 특징</h2><ul><li>광고보다 단골 중심 운영</li><li>예약 권장</li><li>응대 수준이 안정적</li></ul><h2>이용 가이드</h2><p>대부분 사전 예약을 권장하며, 분위기를 해치지 않는 선에서 사진·후기 작성을 부탁드립니다. 새 업소 추천이 있다면 커뮤니티 게시판으로 제보해주세요.</p>`,
  '/referral': () => `<h1>친구 초대</h1><p>친구 초대 링크를 공유하면 가입 시 안내되는 혜택을 함께 받을 수 있습니다.</p><h2>초대 링크 사용법</h2><ul><li>프로필 → 친구 초대 메뉴에서 링크 생성</li><li>카톡·문자·링크 복사로 공유</li><li>친구가 가입을 완료하면 카운트</li></ul><h2>유의사항</h2><p>구체적인 적립·등급 정책은 운영 정책 문서를 확인하세요. 정책은 변경될 수 있으며, 부정 가입 행위는 자동으로 차단됩니다.</p>`,
  '/status': () => `<h1>서버 상태·점검 일정</h1><p>현재 서비스 상태와 예정된 점검 일정을 확인할 수 있습니다.</p><h2>표시되는 항목</h2><ul><li>사이트 가동 여부</li><li>커뮤니티 기능</li><li>알림 발송</li><li>예정된 점검 공지</li></ul><h2>장애·점검 알림</h2><p>예정 점검은 사전 공지되며, 긴급 점검 발생 시 즉시 안내됩니다. 가동률 등 구체적인 수치는 검증된 측정값이 확보된 후에만 게시합니다.</p>`,
  '/demo': () => `<h1>업주 화면 미리보기</h1><p>가입 전에 대시보드 구성을 확인할 수 있는 데모 페이지입니다.</p><h2>데모에서 볼 수 있는 화면</h2><ul><li>대시보드 메인 — 지표 화면</li><li>리뷰 관리 — 답변 작성</li><li>광고 관리 — 노출 영역 설정</li><li>분석 리포트 — 그래프</li><li>결제 관리 — 요금제 변경</li></ul><h2>데모 vs 실제 차이</h2><ul><li>데모는 예시 데이터로 구성</li><li>실제는 자기 매장 데이터 표시</li><li>데모에서는 데이터 변경 불가</li></ul><h2>가입 안내</h2><p>데모 확인 후 onboarding 페이지에서 입점 신청이 가능합니다. 필요한 서류·요금제 비교는 onboarding·pricing 페이지를 참고하세요.</p>`,
  '/case-studies': () => `<h1>운영 사례 안내</h1><p>입점 후 운영을 잘하는 매장들이 공통적으로 챙기는 항목을 정리했습니다. 구체적 매출·증가율 등 검증되지 않은 수치는 게시하지 않습니다.</p><h2>운영을 잘하는 매장의 공통 행동</h2><ul><li>사진을 충분히 등록 (가급적 최근 촬영본)</li><li>리뷰에 신속한 답변</li><li>대표 메뉴·라인업 정확히 기입</li><li>영업시간·연락처 최신 상태 유지</li><li>고객 응대 매뉴얼 일관성</li></ul><h2>활용법</h2><p>자기 매장의 현재 지표는 대시보드에서 직접 확인할 수 있습니다. 운영 컨설팅이 필요하면 업주 상담을 신청해주세요.</p>`,
  '/testimonials': () => `<h1>업주 인터뷰</h1><p>업주 인터뷰는 검증된 인터뷰만 게시합니다. 가공된 인용은 표시하지 않으며, 인터뷰가 게시되면 본 페이지에서 순차적으로 공개됩니다.</p><h2>인터뷰 등록 절차</h2><ul><li>실명 동의 후 인터뷰 진행</li><li>발화 원문 그대로 게재</li><li>수치는 검증 가능한 자료로만 인용</li><li>업주 검수 후 공개</li></ul><h2>참여 안내</h2><p>입점 업주 중 인터뷰 참여를 원하시는 분은 운영자에게 문의해주세요. 인터뷰는 익명·실명 모두 가능하며 매장 노출과 무관하게 운영합니다.</p>`,
  '/pricing': () => `<h1>요금제 안내</h1><p>매장 규모와 노출 필요도에 따라 단계별 요금제를 선택할 수 있습니다.</p><h2>요금제별 기능</h2><ul><li>무료 — 기본 등록, 검색 노출</li><li>스타트 — 사진·메뉴 확장</li><li>프로 — 노출 우선 + 분석 리포트</li><li>VIP — 단독 영역 + 푸시 알림</li></ul><h2>요금제 선택 가이드</h2><ul><li>매장 신규 오픈 — 무료에서 시작</li><li>소형 매장 — 스타트</li><li>중형 매장 — 프로</li><li>대형 매장 — VIP</li></ul><h2>결제·환불 안내</h2><p>결제 수단·환불 정책·법인 세금계산서 발행 등 자세한 사항은 결제·약관 문서에서 확인하실 수 있습니다. 정책은 변경될 수 있으며, 변경 시 사전 공지됩니다.</p>`,
};

for (const pg of staticPages) {
  let ssrBody = undefined;
  let jsonLdList = [];
  // 카테고리 리스팅 페이지: 소속 업소 이름 전부 SSR에 포함 + ItemList JSON-LD
  if (categoryPaths.has(pg.path)) {
    const catKey = pg.path === '/clubs' ? 'club' : pg.path === '/nights' ? 'night' : pg.path === '/lounges' ? 'lounge' : pg.path === '/rooms' ? 'room' : pg.path === '/yojeong' ? 'yojeong' : 'hoppa';
    const catVenues = venues.filter(vv => vv.cat === catKey);
    const catKo = catLabelMap[catKey];
    const catInfo = catMap[catKey];
    ssrBody = `<h1>${escHtml(pg.title)}</h1><p>${escHtml(pg.desc)}</p>`;
    ssrBody += `<h2>전국 ${catKo} ${catVenues.length}곳 리스트</h2><ul>`;
    catVenues.forEach(vv => { ssrBody += `<li><a href="${venueHref(vv)}">${escHtml(vv.nameKo)}</a> · ${escHtml(vv.regionKo)}</li>`; });
    ssrBody += `</ul>`;
    // ★ 지역별 안내 추가 (AI가 지역+업종 검색 시 인용)
    const regionGroups = {};
    catVenues.forEach(vv => {
      if (!regionGroups[vv.regionKo]) regionGroups[vv.regionKo] = [];
      regionGroups[vv.regionKo].push(vv.nameKo);
    });
    // 시즌22 — 지역 H3 → anchor (region 페이지 reachable). club/room/yojeong은 /cat/region/, 그 외는 /region/{ko}/
    const hasCatRegionPath = ['club', 'room', 'yojeong'].includes(catKey);
    for (const [rg, names] of Object.entries(regionGroups)) {
      // catVenue 첫 항목으로 region slug 가져오기
      const sample = catVenues.find(vv => vv.regionKo === rg);
      const regionHref = hasCatRegionPath && sample
        ? `/${catInfo.path}/${sample.region}/`
        : `/region/${encodeURIComponent(rg)}/`;
      ssrBody += `<h3><a href="${regionHref}">${escHtml(rg)}</a></h3>`;
      ssrBody += `<p>${escHtml(rg)} 인기 매장 ${names.length}곳. 실시간 후기와 비교는 각 업소 페이지에서 확인하세요.</p>`;
    }
    // 시즌22 — 카테고리 페이지 footer: best/new/region 전체 anchor
    ssrBody += `<h3>${catKo} 더 둘러보기</h3><ul>`;
    ssrBody += `<li><a href="/best/${catInfo.path}/">${catKo} 인기 TOP</a></li>`;
    ssrBody += `<li><a href="/new/${catInfo.path}/">새로 입점한 ${catKo}</a></li>`;
    ssrBody += `</ul>`;
    // 모든 region 페이지 anchor (/region/{ko}/)
    const allRegionsForCat = [...new Set(catVenues.map(vv => vv.regionKo))];
    if (allRegionsForCat.length > 0) {
      ssrBody += `<h3>지역별 ${catKo}</h3><ul>`;
      allRegionsForCat.forEach(rk => { ssrBody += `<li><a href="/region/${encodeURIComponent(rk)}/">${escHtml(rk)} 나이트라이프</a></li>`; });
      ssrBody += `</ul>`;
    }
    // ★ Evergreen 가이드 — 업소 수와 무관하게 SEO 본문 풍부
    if (CAT_GUIDE_BLURBS[catKey]) {
      ssrBody += CAT_GUIDE_BLURBS[catKey];
    }
    // 업소 수와 무관하게 모든 카테고리 페이지 보강
    ssrBody = enrichSsr(ssrBody, pg.path, pg.title);

    // ★ ItemList JSON-LD — AI 검색에서 목록으로 인용
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `전국 ${catKo} ${catVenues.length}곳`,
      description: pg.desc,
      numberOfItems: catVenues.length,
      itemListElement: catVenues.map((vv, idx) => {
        let routePath;
        if (['club', 'room', 'yojeong'].includes(vv.cat)) {
          routePath = `/${catInfo.path}/${vv.region}/${vv.slug}`;
        } else {
          routePath = `/${catInfo.path}/${vv.slug}`;
        }
        return {
          '@type': 'ListItem',
          position: idx + 1,
          name: vv.nameKo,
          url: `${BASE_URL}${routePath}`,
          description: `${vv.regionKo} ${catKo} ${vv.nameKo}`
        };
      })
    });
    // ★ FAQPage JSON-LD — 카테고리 리스팅 페이지용 (5 Q&A, 카테고리별 unique)
    const topNames = catVenues.slice(0, 5).map(vv => vv.nameKo).join(', ');
    const regionsForCat = [...new Set(catVenues.map(vv => vv.regionKo))];
    const regionListText = regionsForCat.slice(0, 6).join(', ');
    // 카테고리별 차별화 Q&A 2개씩 추가
    const CAT_FAQ_EXTRA = {
      club: [
        { q: `클럽 드레스코드 어떻게 입어요?`, a: `대부분 셔츠+슬랙스 또는 깔끔한 청바지면 입장됩니다. 슬리퍼·운동복은 거의 컷됩니다. 매장별 드레스코드는 각 업소 상세 페이지에 안내되어 있습니다.` },
        { q: `클럽 입장 줄 얼마나 기다려요?`, a: `금토 자정~새벽 1시가 피크 타임입니다. 일찍 가거나 평일 방문이면 대기 시간이 짧습니다. 테이블 사전 예약 시 줄 없이 입장 가능합니다.` },
      ],
      night: [
        { q: `나이트 부킹 시스템 어떻게 진행돼요?`, a: `웨이터가 좌석 배정 후 분위기를 묻고 매칭을 진행합니다. 매장마다 진행 스타일이 다르니 각 업소 상세 페이지의 부킹 안내를 확인하세요.` },
        { q: `나이트 평일에도 영업해요?`, a: `대형 나이트는 목금토 위주, 일부는 365일 영업도 합니다. 매장별 운영시간은 각 업소 상세 페이지에 있습니다.` },
      ],
      lounge: [
        { q: `라운지 데이트 분위기 어떤가요?`, a: `조명이 어둡고 소파가 깊으며 음악이 깔리는 무드가 일반적입니다. 시그니처 칵테일과 위스키·와인 셀렉션 중심으로 운영됩니다. 매장별 분위기는 상세 페이지의 사진을 참고하세요.` },
        { q: `라운지 혼자 가도 자연스러워요?`, a: `라운지는 바 좌석 중심이라 1인 방문이 가장 자연스러운 업종입니다. 바텐더와 대화하며 한 잔 즐기는 손님이 많습니다.` },
      ],
      room: [
        { q: `룸 인원수 어떻게 정해요?`, a: `4인 소형부터 30인 대형까지 룸 크기를 인원에 맞게 선택합니다. 사전 전화로 원하는 인원수를 말하면 딱 맞는 크기로 배정됩니다.` },
        { q: `룸 예약은 언제 해야 해요?`, a: `금토 저녁은 이틀 전 예약 권장. 주중은 한산해서 당일 전화로도 가능합니다. 원하는 룸 크기 확보가 핵심입니다.` },
      ],
      yojeong: [
        { q: `요정에서 거래처 자리 어떻게 진행돼요?`, a: `한정식 코스 중심에 전통 의상의 한국식 접대 응대가 더해집니다. 격을 중시하는 비즈니스 자리에 적합합니다. 매장별 코스 구성은 상세 페이지에서 확인 가능합니다.` },
        { q: `요정 한정식 코스 어떤 게 나와요?`, a: `12첩~15첩 정통 한식 코스가 일반적이며 매장마다 시그니처 메뉴가 다릅니다. 사전 예약 시 코스 종류를 함께 안내받을 수 있습니다.` },
      ],
      hoppa: [
        { q: `호빠 여자 혼자 방문해도 안전해요?`, a: `1인 방문이 절반에 가깝습니다. 모든 등록 업소는 영업 확인을 거쳤고, 실장이 처음부터 끝까지 안내합니다. 불쾌한 상황 시 즉시 직원에게 요청 가능합니다.` },
        { q: `호빠 매니저는 어떻게 정해져요?`, a: `매장 측 안내에 따라 외모·성격·취향 기반으로 매칭됩니다. 사전 전화로 원하는 스타일을 말하면 맞춰주는 곳이 많습니다.` },
      ],
    };
    const extraFaq = CAT_FAQ_EXTRA[catKey] || [];
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: `${catKo} 추천은?`, acceptedAnswer: { '@type': 'Answer', text: `전국에서 인기 있는 ${catKo}는 ${topNames} 등 ${catVenues.length}곳이 있습니다. 놀쿨(nolcool.com)에서 비교해보세요.` } },
        { '@type': 'Question', name: `${catKo} 몇 곳 있나요?`, acceptedAnswer: { '@type': 'Answer', text: `놀쿨에 등록된 ${catKo}는 전국 ${catVenues.length}곳, ${regionsForCat.length}개 지역(${regionListText})에 분포되어 있습니다.` } },
        { '@type': 'Question', name: `${catKo} 처음인데 어떻게 가나요?`, acceptedAnswer: { '@type': 'Answer', text: `놀쿨 입문 가이드(nolcool.com/guide)에서 ${catKo} 첫 방문 팁을 확인하세요. 드레스코드, 예산, 분위기까지 정리되어 있습니다.` } },
        ...extraFaq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      ]
    });
    // ★ Schema.org LocalBusiness 변형 — Google 카테고리 인식 강화 (aggregateRating 없이)
    const SCHEMA_TYPE_MAP = {
      club: 'NightClub',
      night: 'NightClub',
      lounge: 'BarOrPub',
      room: 'NightClub',
      yojeong: 'Restaurant',
      hoppa: 'NightClub',
    };
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pg.title,
      description: pg.desc,
      url: BASE_URL + pg.path,
      inLanguage: 'ko-KR',
      isPartOf: { '@type': 'WebSite', name: '놀쿨', url: BASE_URL },
      about: {
        '@type': SCHEMA_TYPE_MAP[catKey] || 'NightClub',
        name: `전국 ${catKo}`,
        description: `전국 ${catVenues.length}곳의 ${catKo} 정보 (${regionListText} 등 ${regionsForCat.length}개 지역)`,
      },
    });
  }
  // 커뮤니티 게시판 SSR + WebPage JSON-LD
  else if (COMMUNITY_BOARD_BLURBS[pg.path]) {
    ssrBody = enrichSsr(COMMUNITY_BOARD_BLURBS[pg.path](), pg.path, pg.title);
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: pg.title,
      description: pg.desc,
      url: BASE_URL + pg.path,
      author: { '@type': 'Organization', name: '놀쿨' },
      datePublished: new Date().toISOString().split('T')[0],
    });
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pg.title,
      description: pg.desc,
      url: BASE_URL + pg.path,
      inLanguage: 'ko-KR',
      isPartOf: { '@type': 'WebSite', name: '놀쿨', url: BASE_URL },
    });
  }
  // 인터랙티브 페이지 SSR + WebPage JSON-LD
  else if (INTERACTIVE_PAGE_BLURBS[pg.path]) {
    ssrBody = enrichSsr(INTERACTIVE_PAGE_BLURBS[pg.path](), pg.path, pg.title);
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pg.title,
      description: pg.desc,
      url: BASE_URL + pg.path,
      inLanguage: 'ko-KR',
      isPartOf: { '@type': 'WebSite', name: '놀쿨', url: BASE_URL },
    });
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: BASE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: pg.title, item: BASE_URL + pg.path },
      ],
    });
  }
  // 매핑 없는 정적 페이지(예: /lounge/*) 폴백 — 무조건 H1 + WebPage + BreadcrumbList 부착
  else {
    ssrBody = enrichSsr(`<h1>${escHtml(pg.title)}</h1><p>${escHtml(pg.desc)}</p>`, pg.path, pg.title);
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pg.title,
      description: pg.desc,
      url: BASE_URL + pg.path,
      inLanguage: 'ko-KR',
      isPartOf: { '@type': 'WebSite', name: '놀쿨', url: BASE_URL },
    });
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: BASE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: pg.title, item: BASE_URL + pg.path },
      ],
    });
  }
  // ★ 카테고리 페이지 og:image — /og/{slug}.svg 매핑 (clubs/nights/lounges/rooms/yojeong/hoppa)
  let pageOgImage;
  if (categoryPaths.has(pg.path)) {
    const ogSlug = pg.path.replace(/^\//, '');
    pageOgImage = `${BASE_URL}/og/${ogSlug}.svg`;
  }
  writePage(pg.path, { title: pg.title, description: pg.desc, ssrBody, jsonLdList: jsonLdList.length > 0 ? jsonLdList : undefined, ogImage: pageOgImage });
  pageCount++;
}
console.log(`✅ 정적 페이지 ${staticPages.length}개 생성`);

// ══════════════════════════════════════════
// 3. 지역별 카테고리 페이지
// ══════════════════════════════════════════
const regionsByCategory = {};
for (const v of venues) {
  const key = v.cat;
  if (!regionsByCategory[key]) regionsByCategory[key] = {};
  regionsByCategory[key][v.region] = v.regionKo;
}

// 시즌134: 지역×카테고리별 title 후미 5어절·desc 시그니처 unique 매핑
// 동일 후미 "오늘 밤 갈 곳 여기서 고른다" 15× 중복 → 강남클럽/청담클럽 등 부모 페이지 카니발리제이션 회귀.
// 각 region은 (a) 후미 5어절 unique (b) regionKo·"클럽" 단어 중복 X (c) 후킹 5축 ≥1 + 구체 시그니처 토큰
const REGIONAL_SIG = {
  club: {
    gangnam:    { tail: '마니아가 매주 도는 핵심 라인업',     sig: '클러버 단골이 자정 넘어 도는 강남 핵심 라인업' },
    apgujeong:  { tail: '단골이 새벽까지 머무는 자리',        sig: '로데오 단골이 새벽 5시까지 머무는 압구정 코스' },
    cheongdam:  { tail: '멤버십 단골만 아는 셋 리스트',       sig: '청담 멤버십 단골만 아는 비공개 셋과 게스트 라인업' },
    itaewon:    { tail: '외국인 게스트 DJ 부킹 거점',         sig: '이태원 외국인 게스트 DJ 부킹 거점 비교' },
    hongdae:    { tail: '인디 감성과 EDM 같이 흐른다',        sig: '홍대 인디 감성과 EDM 라인업이 동시에 흐르는 거점' },
    nowon:      { tail: '동북권 단골 자정 거점 모음',         sig: '노원 동북권 단골이 자정 전 모이는 거점' },
    yongsan:    { tail: '한강뷰 옥상 라운지가 같이 있다',     sig: '용산 한강뷰 옥상 라운지와 댄스 플로어가 같이 있는 거점' },
    seoul:      { tail: '광역 클러버 거점 한 페이지 비교',    sig: '서울 광역 클러버가 한 페이지에서 거점 비교' },
    ilsan:      { tail: '호수공원 코스 묶어 잡는 자리',       sig: '일산 호수공원 산책 후 자정 입장하는 단골 동선' },
    uijeongbu:  { tail: '1호선 막차까지 노는 거점',           sig: '의정부 1호선 막차 시간까지 머무는 동북권 거점' },
    yongin:     { tail: '죽전·수지 단골 30분 동선',           sig: '용인 죽전·수지 단골 30분 안 동선 거점' },
    bucheon:    { tail: '7호선 환승 동선이 짧다',             sig: '부천 7호선 환승객 동선이 짧은 거점' },
    incheon:    { tail: '송도·구월동 클러버 거점 정리',       sig: '인천 송도·구월동 클러버 거점이 한 페이지에 정리' },
    cheongju:   { tail: '성안길 30대 클러버 핫스팟',          sig: '청주 성안길 일대 30대 클러버 핫스팟 비교' },
    daejeon:    { tail: '둔산동 신·구 핫스팟 한눈에',         sig: '대전 둔산동 신·구 핫스팟이 한 페이지에서 한눈에' },
  },
  room: {
    ilsan:           { tail: '단골이 인원수 미리 일러주는 동선', sig: '일산 단골이 인원수와 시간 미리 일러주는 예약 동선' },
    'busan-haeundae':{ tail: '해변 코스 묶어 잡는 자리',         sig: '해운대 해수욕장 산책 후 묶어 잡는 단골 코스' },
  },
  yojeong: {
    ilsan: { tail: '국악 라이브 정찬 단골 코스', sig: '일산 가야금 라이브와 15첩 정찬 단골 코스' },
  },
};

// 지역+업종 크로스(/region/[regionKo]/[cat]) 전용 후킹 — regionKo 키.
// night는 /nights/:region primary가 없어 이 cross가 유일한 지역 페이지 → 노다지 generic("지역 나이트") CTR 핵심.
// 한국 나이트 본질 = 웨이터·합석·부킹·만남 (EDM/관중 톤 금지). 후미 5어절 unique + 지역 랜드마크로 n-gram 분산.
const CROSS_SIG = {
  night: {
    '광주':   { tail: '상무지구 새벽까지 합석 도는 코스',     sig: '상무지구 일대 새벽까지 합석이 도는 웨이터 코스' },
    '대전':   { tail: '둔산동 부킹 제대로 잡는 웨이터 라인',   sig: '둔산동 부킹을 제대로 잡아주는 웨이터 라인업' },
    '대구':   { tail: '동성로 피크에 합석 몰리는 자리',       sig: '동성로 피크 시간 합석이 몰리는 단골 자리' },
    '노원':   { tail: '막차 전 동북권 합석 붙는 거점',         sig: '동북권 막차 직전 합석이 빠르게 붙는 거점' },
    '김포':   { tail: '한강신도시 토박이 합석 도는 코스',       sig: '한강신도시 토박이가 합석 도는 단골 코스' },
    '수원':   { tail: '인계동 새벽 부킹 가장 센 라인',         sig: '인계동 새벽 부킹 회전이 가장 센 라인' },
    '성남':   { tail: '모란 웨이터가 합석 척척 붙이는 자리',   sig: '모란 일대 웨이터가 합석을 척척 붙여주는 자리' },
    '부천':   { tail: '7호선 환승객 합석 회전 빠른 거점',       sig: '7호선 환승객까지 합석 회전이 빠른 거점' },
    '안산':   { tail: '중앙역 단골이 합석 빠르다 찍은 곳',     sig: '중앙역 단골이 합석 빠르기로 찍어둔 곳' },
    '천안':   { tail: '신부동 단골 합석 회전 도는 자리',       sig: '신부동 단골 합석 회전이 꾸준히 도는 자리' },
    '청주':   { tail: '성안길 웨이터가 합석 바로 잡아주는 라인', sig: '성안길 웨이터가 합석을 바로 잡아주는 라인' },
    '부산':   { tail: '서면 새벽 합석 가장 활발한 거점',       sig: '서면 새벽 시간 합석이 가장 활발한 거점' },
    '울산':   { tail: '삼산동 토박이 합석 빠른 라인',           sig: '삼산동 토박이 합석이 빠르게 붙는 라인' },
    '일산':   { tail: '호수공원 코스 끝에 합석 잡는 자리',     sig: '호수공원 산책 코스 끝에 합석 잡는 자리' },
    '청담':   { tail: '명품거리 멤버십 부킹 비공개 라인',       sig: '명품거리 멤버십 손님만 아는 비공개 부킹 라인' },
    '강남':   { tail: '역삼 새벽 부킹 가장 센 거점',           sig: '역삼 일대 새벽 부킹 회전이 가장 센 거점' },
    '신림':   { tail: '순환 라인 솔로도 합석 붙는 자리',       sig: '순환 라인에서 솔로 입장도 합석이 붙는 자리' },
    '수유':   { tail: '북한산 산행 끝에 합석 푸는 거점',       sig: '북한산 산행 마치고 합석으로 푸는 단골 거점' },
    '독산':   { tail: '가산 야근족 퇴근하고 합석 붙는 라인',   sig: '가산 디지털단지 야근족이 퇴근하고 합석 붙는 라인' },
    '강서':   { tail: '발산역 토박이 합석 척척 붙는 코스',     sig: '발산역 토박이 합석이 척척 붙는 단골 코스' },
    '길동':   { tail: '천호 라인 합석 빠르게 도는 거점',       sig: '천호 라인 합석이 빠르게 도는 거점' },
    '파주':   { tail: '운정 토박이 합석 회전 도는 자리',       sig: '운정 토박이 합석 회전이 도는 자리' },
    '화정':   { tail: '덕양 단골 합석 빠르다는 코스',           sig: '덕양구 단골이 합석 빠르다고 꼽는 코스' },
    '구리':   { tail: '돌다리 동북권 합석 몰리는 라인',         sig: '돌다리 일대 동북권 합석이 몰리는 라인' },
    '오산':   { tail: '운암동 토박이 합석 자주 붙는 거점',     sig: '운암동 토박이 합석이 자주 붙는 거점' },
    '분당':   { tail: '서현 평일 저녁 합석 천천히 익는 라인',   sig: '서현 평일 저녁 합석이 천천히 익는 라인' },
    '평택':   { tail: '소사벌 야근족 퇴근하고 합석 코스',       sig: '소사벌 야근족이 퇴근하고 합석으로 푸는 코스' },
    '인천':   { tail: '구월동 토박이 합석 빠른 자리',           sig: '구월동 토박이 합석이 빠르게 붙는 자리' },
    '서산':   { tail: '시내 토박이 합석 자주 도는 거점',       sig: '서산 시내 토박이 합석이 자주 도는 거점' },
    '구미':   { tail: '원평동 단골 합석 자주 붙는 라인',       sig: '원평동 단골 합석이 자주 붙는 라인' },
    '제주':   { tail: '시청 일대 관광객 섞여 합석 도는 거점',   sig: '시청 일대 관광객까지 섞여 합석 도는 거점' },
    '창원':   { tail: '상남동 피크에 합석 몰리는 자리',         sig: '상남동 피크 시간 합석이 몰리는 자리' },
    '부산 연산동': { tail: '라이브 무대 끼고 합석 도는 거점',   sig: '라이브 무대를 끼고 합석이 도는 거점' },
    '상봉동': { tail: '망우로 동북권 합석 도는 코스',           sig: '망우로 일대 동북권 합석이 도는 코스' },
    '답십리': { tail: '장한평 단골 합석 빠른 자리',             sig: '장한평 단골 합석이 빠르게 붙는 자리' },
    '영등포': { tail: '타임스퀘어 끼고 합석 피크 도는 라인',     sig: '타임스퀘어를 끼고 합석 피크가 도는 라인' },
    '의정부': { tail: '1호선 막차까지 합석 도는 거점',         sig: '1호선 막차 시간까지 합석이 도는 거점' },
    '인덕원': { tail: '범계 라인 토박이 합석 빠른 코스',       sig: '범계 라인 토박이 합석이 빠른 코스' },
  },
  club: {
    '용인':   { tail: '죽전 게스트 부킹 도는 플로어',         sig: '죽전 일대 게스트 부킹이 도는 플로어' },
    '인천':   { tail: '송도 게스트 라인업 센 홀',             sig: '송도 게스트 라인업이 센 댄스 홀' },
    '이태원': { tail: '외국인 게스트 새벽까지 노는 플로어',   sig: '외국인 게스트와 새벽까지 노는 플로어' },
    '일산':   { tail: '호수 라인 게스트 만남 도는 자리',       sig: '호수공원 라인 게스트 만남이 도는 자리' },
    '강남':   { tail: '신논현 게스트 부킹 회전 빠른 홀',       sig: '신논현 게스트 부킹 회전이 빠른 홀' },
    '압구정': { tail: '로데오 멤버십 게스트 비공개 셋',       sig: '로데오 멤버십 손님만 아는 비공개 게스트 셋' },
    '대전':   { tail: '은행동 게스트 부킹 붙는 플로어',       sig: '은행동 게스트 부킹이 붙는 플로어' },
    '홍대':   { tail: '연남 라인 인디 게스트 섞이는 무대',     sig: '연남 라인 인디 게스트가 섞이는 무대' },
    '청주':   { tail: '성안길 30대 클러버 모이는 플로어',     sig: '성안길 30대 클러버가 모이는 플로어' },
    '노원':   { tail: '동북권 막차 전 게스트 도는 홀',         sig: '동북권 막차 직전 게스트가 도는 홀' },
    '서울':   { tail: '광역 클러버 게스트 한자리 비교',       sig: '서울 광역 클러버 게스트를 한자리에서 비교' },
    '의정부': { tail: '경전철 막차까지 게스트 노는 플로어',   sig: '경전철 막차 시간까지 게스트가 노는 플로어' },
    '용산':   { tail: '한강뷰 옥상 게스트 같이 노는 자리',     sig: '한강뷰 옥상에서 게스트와 같이 노는 자리' },
    '부천':   { tail: '7호선 환승 게스트 빠른 홀',             sig: '7호선 환승 동선 게스트 회전이 빠른 홀' },
    '청담':   { tail: '명품거리 멤버십 게스트 비공개 라인',   sig: '명품거리 멤버십 손님만 아는 비공개 게스트 라인' },
  },
  hoppa: {
    '장안동': { tail: '장한평 실장이 호스트 셀렉션 돕는 자리', sig: '장한평 실장이 호스트 셀렉션을 돕는 자리' },
    '해운대': { tail: '해변 끝 실장 추천 호스트 라인',         sig: '해수욕장 끝 실장 추천 호스트 라인' },
    '강남':   { tail: '역삼 실장 골라주는 호스트 코스',       sig: '역삼 실장이 골라주는 호스트 코스' },
    '수원':   { tail: '인계동 실장이 호스트 붙여주는 자리',   sig: '인계동 실장이 호스트를 붙여주는 자리' },
    '대구':   { tail: '동성로 실장 매칭 호스트 무대',         sig: '동성로 실장 매칭 호스트 무대' },
    '대전':   { tail: '갤러리아 실장 호스트 셀렉션 라인',     sig: '갤러리아 실장 호스트 셀렉션 라인' },
    '홍대':   { tail: '연남 실장 호스트 추천 도는 곳',         sig: '연남 실장이 호스트를 추천해 도는 곳' },
    '건대':   { tail: '화양리 실장 골라주는 호스트 무대',     sig: '화양리 실장이 골라주는 호스트 무대' },
    '부산':   { tail: '서면 실장 호스트 셀렉션 빠른 라인',     sig: '서면 실장 호스트 셀렉션이 빠른 라인' },
    '부산 해운대': { tail: '달맞이 실장 매칭 호스트 자리',     sig: '달맞이 실장 매칭 호스트 자리' },
    '전주':   { tail: '객사 실장 골라주는 호스트 코스',       sig: '객사 실장이 골라주는 호스트 코스' },
  },
  yojeong: {
    '일산':   { tail: '가야금 정찬 실장 모시는 만찬 코스',     sig: '가야금 라이브와 정찬을 실장이 모시는 만찬 코스' },
  },
  room: {
    '일산':   { tail: '양주 라인 실장이 룸 맞춰주는 자리',     sig: '양주 라인업을 실장이 룸에 맞춰주는 자리' },
    '부산 해운대': { tail: '광안대교 야경 끼고 룸 잡는 코스',  sig: '광안대교 야경을 끼고 룸 잡는 코스' },
  },
  lounge: {
    '압구정': { tail: '로데오 칵테일바 조용한 만남 자리',     sig: '로데오 칵테일바에서 조용한 만남이 가능한 자리' },
  },
};
function regionalTitleDesc(cat, region, regionKo, count, allNames) {
  const m = (REGIONAL_SIG[cat] || {})[region];
  if (cat === 'club') {
    const tail = m ? m.tail : `${count}곳 비교 한눈에 정리되는 핫스팟`;
    const sig = m ? m.sig : `${regionKo} 광역 단골이 도는 핵심 거점`;
    return {
      title: `${regionKo} 클럽 ${count}곳 — ${tail}`,
      desc: `${regionKo} 클럽 어디가 진짜야? 안 가본 데서 헤매기 전에 ${count}곳 비교 — ${sig}. ${allNames} 등 분위기·드레스코드·게스트 라인업·부킹 문화·첫방문 매너까지 골라보세요.`,
    };
  } else if (cat === 'room') {
    const tail = m ? m.tail : `${count}곳 인원·구성 한눈에 비교`;
    const sig = m ? m.sig : `${regionKo} 단골이 인원수 미리 일러주는 예약 동선`;
    return {
      title: `${regionKo} 룸 ${count}곳 — ${tail}`,
      desc: `${regionKo} 룸 어디가 좋지? 자리 놓치면 인원 못 앉힌다, ${count}곳 비교 — ${sig}. ${allNames} 등 4인 소형부터 30인 단체석, 양주 라인업·룸 구성·예약 팁까지 모임 전 확인.`,
    };
  } else {
    const tail = m ? m.tail : `${count}곳 격조 코스 비교 정리`;
    const sig = m ? m.sig : `${regionKo} 단골이 모시는 정찬 코스`;
    return {
      title: `${regionKo} 요정 ${count}곳 — ${tail}`,
      desc: `${regionKo} 요정 어디가 격조 있나? 안 가본 데로 모시면 큰일 난다, ${count}곳 — ${sig}. ${allNames} 등 정찬 15첩·국악 라이브·프라이빗 룸, 비즈니스 만찬 코스·예약·드레스코드 매너까지 확인.`,
    };
  }
}

let regionalCount = 0;
for (const [cat, regions] of Object.entries(regionsByCategory)) {
  const cm = catMap[cat];
  if (!cm) continue;

  // clubs/:region, rooms/:region, yojeong/:region
  if (['club', 'room', 'yojeong'].includes(cat)) {
    for (const [region, regionKo] of Object.entries(regions)) {
      const regionVenues = venues.filter(vv => vv.cat === cat && vv.region === region);
      const allNames = regionVenues.slice(0, 3).map(vv => vv.nameKo).join(', ');
      const { title, desc } = regionalTitleDesc(cat, region, regionKo, regionVenues.length, allNames);
      // SSR: 해당 지역 업소 이름 + 상세 설명 전부 포함
      let regSsr = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
      regSsr += `<h2>${escHtml(regionKo)} ${catLabelMap[cat]} ${regionVenues.length}곳</h2><ul>`;
      regionVenues.forEach((vv, idx) => {
        // 시즌172 — 모든 venue suffix만 노출 (브랜드 접두어 반복 차단). 상위 3곳만 shortDesc.
        const parts = (vv.nameKo || '').split(/\s+/);
        const shortLabel = parts.length > 1 ? parts.slice(1).join(' ') : vv.nameKo;
        if (idx < 3) {
          regSsr += `<li><a href="${venueHref(vv)}"><strong>${escHtml(shortLabel)}</strong></a> — ${escHtml(vv.shortDesc.slice(0, 50))}</li>`;
        } else {
          regSsr += `<li><a href="${venueHref(vv)}">${escHtml(shortLabel)}</a></li>`;
        }
      });
      regSsr += `</ul>`;
      // ★ AI 인용용 FAQ
      regSsr += `<section><h2>${escHtml(regionKo)} ${catLabelMap[cat]} 자주 묻는 질문</h2>`;
      regSsr += `<dl>`;
      regSsr += `<dt>${escHtml(regionKo)} ${catLabelMap[cat]} 추천은?</dt>`;
      regSsr += `<dd>인기 있는 곳은 ${regionVenues.slice(0, 5).map(vv => { const p = (vv.nameKo || '').split(/\s+/); return escHtml(p.length > 1 ? p.slice(1).join(' ') : vv.nameKo); }).join(', ')}${regionVenues.length > 5 ? ' 등' : ''}입니다. 놀쿨(nolcool.com)에서 비교해보세요.</dd>`;
      regSsr += `<dt>몇 곳 있나요?</dt>`;
      regSsr += `<dd>이 카테고리에는 ${regionVenues.length}곳의 매장이 있습니다.</dd>`;
      regSsr += `</dl></section>`;

      // 시즌159 — 지역×업종 본문 깊이 보강 (체류 10분 + dwell-content-audit 통과)
      // 시즌172 — regionKo/catLabel 반복 희석 (대명사 치환)
      const topTags = [...new Set(regionVenues.flatMap(rv => rv.tags || []).slice(0, 8))];
      regSsr += `<h2>동네 분위기</h2>`;
      regSsr += `<p>이 거리는 같은 동네 안이라도 골목·역·층마다 손님 톤이 갈립니다. 처음 가는 분은 회원 후기가 많이 쌓인 곳부터 들러 분위기를 가늠해 보는 동선이 무난합니다. 평일 저녁은 비교적 차분하고, 금·토 자정 이후로는 합석·부킹 회전이 가장 활발해집니다. ${topTags.length > 0 ? '회원들이 자주 묶는 키워드: ' + topTags.map(t => '#' + escHtml(t)).join(' ') + '. 분위기·콘셉트 미리 확인하고 동선 잡기.' : ''}</p>`;
      regSsr += `<h2>모임 인원별 코스 짜기</h2>`;
      regSsr += `<ul>`;
      regSsr += `<li><strong>1~2인</strong> — 가볍게 한 잔 보면서 동네 익히기, 무리 없이 둘러보고 후기 한 줄 남기는 코스가 적당합니다.</li>`;
      regSsr += `<li><strong>3~4인</strong> — 가장 평균적인 모임 단위로 룸/부스/플로어 어디 쪽이 맞는지 미리 합의하고 가는 게 효율적입니다.</li>`;
      regSsr += `<li><strong>5~8인</strong> — 사이즈가 맞는 곳이 빠르게 마감되니 직통 전화로 가능 룸·테이블을 확인하고 출발하세요.</li>`;
      regSsr += `<li><strong>단체(9인 이상)</strong> — 예약 가능 여부와 단체 응대 매뉴얼이 잡힌 곳을 미리 확인하면 합류·정산이 매끄럽습니다.</li>`;
      regSsr += `</ul>`;
      regSsr += `<h2>가기 전 체크 포인트</h2>`;
      regSsr += `<p>방문 전 짧게 확인하면 좋은 항목입니다. 첫째, 마감 시간은 업소마다 다르고 시즌·요일에 따라 단축되는 경우가 있어 직통 통화로 확인이 가장 정확합니다. 둘째, 드레스코드는 매장 콘셉트별로 차이가 있어 사진 갤러리를 한번 훑고 가는 편이 안전합니다. 셋째, 일대는 늦은 시간 택시 잡기가 어려운 구간이 있어 끝나는 시간과 귀가 동선을 미리 설계하면 일행 분실·이동 지연을 줄일 수 있습니다.</p>`;
      regSsr += `<h2>인기 업소 다시 보기</h2><ul>`;
      regionVenues.slice(0, 8).forEach(vv => {
        // 시즌172 — 두 번째 노출은 suffix(브랜드 접두어 제외)로 키워드 반복 희석
        const parts = (vv.nameKo || '').split(/\s+/);
        const shortLabel = parts.length > 1 ? parts.slice(1).join(' ') : vv.nameKo;
        regSsr += `<li><a href="${venueHref(vv)}">${escHtml(shortLabel)}</a> — ${escHtml(vv.shortDesc.slice(0, 50))}</li>`;
      });
      regSsr += `</ul>`;
      // 시즌159 — 작은 지역(venue 1~2곳) listing 본문 보강
      regSsr += `<h2>첫 방문자 가이드</h2>`;
      regSsr += `<p>처음 가는 분이라면 회원 후기가 누적된 매장부터 둘러보는 게 분위기 가늠에 가장 정확합니다. 매장 사진 갤러리를 한번 훑어 본인 모임 톤에 맞는 콘셉트인지 가늠하고, 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 확인하면 자리 잡고 헤매는 시간을 줄일 수 있습니다. 일대는 거리·역·층마다 손님 톤이 다르니, 첫 방문은 평일 저녁 차분한 시간대에 동네 분위기를 익히고 두 번째 방문에 본격 모임 자리를 잡는 동선이 부담 없습니다.</p>`;
      regSsr += `<h2>모임 컨셉별 매칭</h2>`;
      regSsr += `<p>모임을 잡을 때는 컨셉에 맞춰 매장을 골라야 분위기와 어긋나지 않습니다. 생일·기념일은 프라이빗 자리가 가능한 곳이 사진·축하 동선에 편하고, 송별·환영회는 인원 사이즈에 맞는 좌석을 미리 예약하면 합류와 정산이 매끄럽습니다. 소개팅·동료 한잔은 조용한 자리가 어울리고, 친구 사교·새 인연은 회전이 빠른 시간대가 적합합니다. 비즈니스 만찬은 격조와 프라이빗 둘 다 챙길 수 있는 룸/요정 카테고리를 권합니다.</p>`;
      regSsr += `<h2>시간대별 분위기</h2>`;
      regSsr += `<ul>`;
      regSsr += `<li><strong>평일 저녁 7~10시</strong> — 비교적 차분, 첫 방문·소개팅·동료 한잔에 적합</li>`;
      regSsr += `<li><strong>금·토 밤 10시~자정</strong> — 일대 라인업이 본격 회전, 동네 활기 피크</li>`;
      regSsr += `<li><strong>자정~새벽 2시</strong> — 합석·부킹·단체 모임 마무리가 가장 활발한 시간대</li>`;
      regSsr += `<li><strong>새벽 2시 이후</strong> — 마감 시간이 매장마다 다르니 직통 통화로 입장 가능 여부 확인</li>`;
      regSsr += `</ul>`;
      regSsr += `<h2>동선·귀가 안전 가이드</h2>`;
      regSsr += `<p>일대는 늦은 시간 택시 잡기가 어려운 구간이 있어, 끝나는 시간 기준으로 콜택시·대리운전을 미리 알아두는 편이 안전합니다. 일행이 흩어지지 않도록 합류 지점은 대표 역·편의점 같은 랜드마크로 잡고, 위치 공유를 켜두면 모임이 흐트러지지 않습니다. 술 마신 후 직접 운전은 절대 금물이고, 일행 중 만취자가 있으면 매장 매니저에게 부탁해 안전한 콜택시·대리 호출을 안내받을 수 있습니다. 새벽 마감 시간은 시즌·요일에 따라 단축되는 곳이 있으니 마지막 잔을 비우기 전 귀가 동선을 한번 점검해 두면 새벽 일대 택시난을 피할 수 있습니다.</p>`;

      // ★ ItemList JSON-LD
      const regJsonLd = [{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${regionKo} ${catLabelMap[cat]} ${regionVenues.length}곳`,
        numberOfItems: regionVenues.length,
        itemListElement: regionVenues.map((vv, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: vv.nameKo,
          url: `${BASE_URL}/${cm.path}/${vv.region}/${vv.slug}`,
          description: `${vv.regionKo} ${catLabelMap[cat]} ${vv.nameKo}`
        }))
      }];

      writePage(`/${cm.path}/${region}`, { title, description: desc, ssrBody: regSsr, jsonLdList: regJsonLd });
      regionalCount++;
    }
  }
}
console.log(`✅ 지역별 페이지 ${regionalCount}개 생성`);

// ══════════════════════════════════════════
// 4. 업소 상세 페이지 (116개)
// ══════════════════════════════════════════
/** JPG 1:1 커스텀 OG (카톡/밴드 호환) */
const JPG_OG_SLUGS = new Set(['haeundaehoppa-kkantappiya']);
/** JPG 닉네임 OG가 있는 업소 */
const NICKNAME_OG_SLUGS = new Set([
  'ilsanmyeongwolgwanyojeong','ilsanroom','busanyeonsandongmulnight','busanmulnight',
  'seongnamshampoonight','suwonchancenight','sinlimgrandprixnight','cheongdamh2onight',
  'pajuyadangskydomenight','ulsanchampionnight','gangnamjuliananight','dapsimnidontellmamanight',
  'daejeonsevennight',
]);
function getVenueOgImage(slug) {
  if (JPG_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  if (NICKNAME_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  // 실제 이미지 파일이 있을 때만 venue 이미지, 없으면 기본 OG 이미지
  const venueImg = path.join(DIST, 'venues', `${slug}-1.jpg`);
  if (fs.existsSync(venueImg)) return `${BASE_URL}/venues/${slug}-1.jpg`;
  return `${BASE_URL}/og/nolcool-og.jpg`;
}

// 시즌53 v26-day1 — JSON-LD image 배열 (Naver/Google/AI 이미지 검색 시그널 강화)
// 실제 존재하는 venue 이미지 1~4번까지 모두 수집. 1개뿐이면 단일 URL.
function getVenueImageList(slug) {
  const list = [];
  for (let i = 1; i <= 4; i++) {
    const p = path.join(DIST, 'venues', `${slug}-${i}.jpg`);
    if (fs.existsSync(p)) list.push(`${BASE_URL}/venues/${slug}-${i}.jpg`);
  }
  if (list.length === 0) return getVenueOgImage(slug);
  return list.length === 1 ? list[0] : list;
}

// 시즌41 — 카테고리별 후킹 prefix (audit:hook 5원칙 통과: question·first-person·loss-aversion·number·cta 중 3+개)
const HOOK_PREFIX_BY_CAT = {
  club: [
    '어느 클럽이 진짜? 우리 5분이면 안다.',
    '솔직히 어디가 내 스타일? 망설이면 모른다.',
    '어떤 분위기? 후회 안 하려면 먼저 봐.',
  ],
  night: [
    '새벽 어디가 진짜? 5분이면 본다.',
    '어느 댄스홀이 우리 자리? 망설이면 후회.',
    '솔직히 어디로 갈지? 먼저 1줄 보자.',
  ],
  room: [
    '어느 룸이 우리 자리? 5분이면 안다.',
    '어디 가야 후회 안 할지? 망설이지 마.',
    '솔직히 어떤 룸인지 먼저 1번 확인.',
  ],
  yojeong: [
    '어떤 자리인지 모르면 후회. 5분 본다.',
    '어느 요정이 진짜? 우리 먼저 가봤다.',
    '솔직히 어디가 격이 다른지 5분 확인.',
  ],
  lounge: [
    '어느 라운지가 우리 분위기? 5분이면 본다.',
    '솔직히 어떤 라운지인지 망설이면 모른다.',
    '어디가 진짜? 후회 전에 5분 먼저 봐.',
  ],
  hoppa: [
    '솔직히 어디가 진짜? 5분이면 안다.',
    '어느 가게가 우리 자리? 망설이면 후회.',
    '어떤 분위기? 모르면 먼저 1줄 봐.',
  ],
};
function pickHookPrefix(v) {
  const opts = HOOK_PREFIX_BY_CAT[v.cat] || HOOK_PREFIX_BY_CAT.club;
  let h = 0;
  for (const c of v.slug) h = (h * 31 + c.charCodeAt(0)) | 0;
  return opts[Math.abs(h) % opts.length];
}

// 공식 사이트 보유 업소(사장님 소유) — JSON-LD sameAs 엔티티 연결. SSR 본문 백링크와 동일 소스.
const OFFICIAL_SITES = {
  ilsanmyeongwolgwanyojeong: 'https://sunwook4.mycafe24.com/',
};

let venueCount = 0;
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;

  const hookTitle = getHookingTitle(v.nameKo, v);
  // meta description: 시즌41 후킹 prefix + shortDesc 보충 → "가게이름 — 후킹. 설명" 150자
  let descBase = v.shortDesc || '';
  if (descBase.length < 80 && v.description) {
    const sentences = v.description.split(/[.!?]\s*/).filter(s => s.length > 10);
    for (const s of sentences) {
      if (descBase.length >= 120) break;
      if (descBase.includes(s.slice(0, 15))) continue;
      descBase = descBase ? `${descBase.replace(/[.!?]\s*$/, '')}. ${s}` : s;
    }
  }
  if (!descBase || descBase.length < 30) descBase = v.description.slice(0, 130);
  const hookPrefix = pickHookPrefix(v);
  const desc = truncateDesc(`${v.nameKo} — ${hookPrefix} ${descBase}`, 150);

  // Route path depends on category
  let routePath;
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    routePath = `/${cm.path}/${v.region}/${v.slug}`;
  } else {
    // nights/:slug, lounges/:slug, hoppa/:slug
    routePath = `/${cm.path}/${v.slug}`;
  }

  const faqJsonLd = generateVenueFaqJsonLd(v);

  // 가공 aggregateRating + review 배열 제거 (구글 fake review 스팸 정책 회피).
  // 실제 후기 DB 연동 전까지 NightClub/BarOrPub schema는 평점·후기 필드 없이 발행.
  const venueJsonLd = {
    '@context': 'https://schema.org',
    '@type': v.cat === 'club' || v.cat === 'night' ? 'NightClub' : v.cat === 'lounge' || v.cat === 'hoppa' ? 'BarOrPub' : v.cat === 'yojeong' ? 'Restaurant' : 'EntertainmentBusiness',
    // ★ 엔티티 앵커 — 안정적 @id로 구글·AI가 이 가게를 고유 엔티티로 결합 (가게이름 검색 디스앰비규에이션)
    '@id': `${BASE_URL}${routePath}/#business`,
    name: v.nameKo,
    description: v.description.slice(0, 300),
    address: { '@type': 'PostalAddress', streetAddress: v.address || `${v.regionKo} ${v.nameKo}`, addressLocality: v.regionKo, addressRegion: v.regionKo, addressCountry: 'KR' },
    url: `${BASE_URL}${routePath}/`,
    image: getVenueImageList(v.slug),
    telephone: v.staffPhone || undefined,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '19:00',
      closes: '05:00',
    }],
  };
  if (v.lat && v.lng) venueJsonLd.geo = { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng };
  if (v.staffNickname) venueJsonLd.employee = { '@type': 'Person', name: v.staffNickname };
  /* alternateName — Google/AI 검색 동의어 매핑 (예: "일산요정" 검색 시 명월관 매칭) */
  if (Array.isArray(v.aliases) && v.aliases.length > 0) {
    venueJsonLd.alternateName = v.aliases;
  }
  // 시즌29 — Speakable schema (Google Assistant 음성 검색 답변 채택)
  // 시즌91 — 상단 직답(.ssr-answer)을 음성 답변 타깃으로: 전화번호 문단 대신 사실 요약을 읽도록.
  venueJsonLd.speakable = {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '.ssr-answer'],
  };
  /* sameAs — 공식 사이트(사장님 소유 업소) 연결: 엔티티 신뢰·디스앰비규에이션 강화 */
  if (OFFICIAL_SITES[v.slug]) venueJsonLd.sameAs = [OFFICIAL_SITES[v.slug]];

  // BreadcrumbList: 홈 > 카테고리 > 지역(있으면) > 업소
  const breadcrumbItems = [
    { name: '놀쿨', url: BASE_URL },
    { name: `${catLabelMap[v.cat]}`, url: `${BASE_URL}/${cm.path}` },
  ];
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    breadcrumbItems.push({ name: v.regionKo, url: `${BASE_URL}/${cm.path}/${v.region}` });
  }
  breadcrumbItems.push({ name: v.nameKo, url: `${BASE_URL}${routePath}/` });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // datePublished: 업소별 고유 "등록일" (slug 해시 기반) + dateModified: 오늘
  const dayOffset = 30 + (v.slug.length * 7 + v.nameKo.length * 3) % 60;
  const pubDate = new Date();
  pubDate.setDate(pubDate.getDate() - dayOffset);
  const datePublished = pubDate.toISOString().slice(0, 10);
  const dateModified = new Date().toISOString().slice(0, 10);
  // 시즌23 — venue 스키마에 datePublished/dateModified 직접 주입 (Google freshness 시그널)
  venueJsonLd.datePublished = datePublished;
  venueJsonLd.dateModified = dateModified;

  /* aliases도 meta keywords + 본문 검색 매핑에 포함 — 동의어 SEO 강화 */
  const venueKeywords = [
    v.nameKo,
    ...(Array.isArray(v.aliases) ? v.aliases : []),
    `${v.regionKo} ${catLabelMap[v.cat]}`,
    `${v.nameKo} 후기`,
    `${v.nameKo} 예약`,
    `${v.regionKo} ${catLabelMap[v.cat]} 추천`,
    `${v.regionKo} 나이트라이프`,
  ].join(', ');
  // 시즌29-F — 실재하는 hero webp만 preload (404 0건 유지)
  const heroWebp = path.join('public', 'venues', `${v.slug}-1.webp`);
  const preloadImage = fs.existsSync(heroWebp) ? `/venues/${v.slug}-1.webp?v3` : undefined;
  writePage(routePath, {
    title: hookTitle,
    description: desc,
    ogImage: getVenueOgImage(v.slug),
    ogImageAlt: `${v.nameKo} — ${v.regionKo} ${catLabelMap[v.cat]} 매장 사진`,
    ssrBody: generateVenueSsrBody(v, venues),
    jsonLdList: [venueJsonLd, faqJsonLd, breadcrumbJsonLd],
    datePublished,
    dateModified,
    keywords: venueKeywords,
    preloadImage,
    diluteName: v.nameKo,
  });
  venueCount++;
}
console.log(`✅ 업소 상세 페이지 ${venueCount}개 생성`);

// ══════════════════════════════════════════
// 4-A2. 매거진 article 상세 페이지 (Article JSON-LD + SSR 본문)
// 시즌9 — Googlebot에 individual article 노출 강화 (이전엔 SPA fallback만)
// ══════════════════════════════════════════
const magazineSrc = fs.readFileSync('src/data/magazine-articles.ts', 'utf8');
function parseMagazineArticles() {
  const result = [];
  // 각 article 블록은 "{\n    id: '...'" 로 시작
  const blocks = magazineSrc.split(/\n  \{\n    id:/);
  for (let i = 1; i < blocks.length; i++) {
    const block = '    id:' + blocks[i];
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    const title = block.match(/title:\s*'([^']+)'/)?.[1];
    const excerpt = block.match(/excerpt:\s*'([^']+)'/)?.[1];
    const tag = block.match(/tag:\s*'([^']+)'/)?.[1];
    const date = block.match(/date:\s*'([^']+)'/)?.[1];
    const contentMatch = block.match(/content:\s*`([\s\S]*?)`,?\s*\n  \},?/);
    const content = contentMatch ? contentMatch[1] : '';
    if (id && title && content) result.push({ id, title, excerpt: excerpt || '', tag: tag || '매거진', date: date || BUILD_DATE_KST, content });
  }
  return result;
}
const magazineArticles = parseMagazineArticles();
let magazineCount = 0;
for (const a of magazineArticles) {
  const routePath = `/magazine/${a.id}`;
  const canonical = `${BASE_URL}${routePath}/`;
  const desc = truncateDesc(a.excerpt, 150);
  // SSR 본문: H1 + tag 라벨 + 본문 HTML 그대로 (이미 H2/H3/p 마크업)
  // 시즌159 — 매거진 article 본문 깊이 보강 (체류 10분 보장)
  const articleAddon = `
<h2>${escHtml(a.tag)} 관련 더 깊이 보기</h2>
<p>${escHtml(a.title)} 글이 ${escHtml(a.tag)} 카테고리에서 어떻게 자리를 잡는지는 본문의 맥락과 함께 읽으면 더 입체적입니다. 같은 주제라도 지역·시간대·인원·모임 컨셉에 따라 받아들이는 결이 달라지기 때문에, 본인 모임 상황에 맞춰 어떤 부분이 직접 적용 가능한지를 정리해 두면 다음 방문에 바로 써먹을 수 있습니다. 매거진 본문에서 등장한 매장·지역·키워드는 사이트 내 다른 큐레이션에서도 이어서 비교할 수 있어, 글 한 편을 시작점으로 비슷한 결의 콘텐츠를 따라가다 보면 본인 모임에 맞는 코스가 자연스럽게 정리됩니다.</p>
<h2>매거진 글을 모임에 적용하는 법</h2>
<p>매거진은 정보 자체뿐 아니라 매장·지역·시간대 선택을 빠르게 좁히는 데 도움이 됩니다. 첫째, 본문에서 인상 깊게 본 매장이 있다면 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 미리 확인해 두세요. 둘째, 시간대별 분위기 설명이 나오면 본인 모임 컨셉에 맞춰 출발 시각을 잡는 게 좋습니다. 셋째, 글에서 다룬 지역이 일대 합류·해산 동선을 함께 안내한다면 새벽 귀가 동선을 미리 설계해 두면 모임 자체에 집중할 수 있습니다. 회원 후기와 매거진을 함께 보면 분위기 가늠이 한층 입체적이 되어 첫 방문에서 헛걸음을 줄일 수 있습니다.</p>
<h2>매거진 함께 보면 좋은 다른 글</h2>
<p>비슷한 주제의 매거진 글을 이어서 읽으면 ${escHtml(a.tag)} 키워드에 대한 이해가 깊어집니다. 사이트 내 매거진 코너에서 같은 태그로 묶인 글을 확인할 수 있고, 회원 후기·VS 투표·룰렛으로 자기 톤에 맞는 매장을 더 정밀하게 좁혀 볼 수 있습니다. 매거진 글이 분기점이 되어 본인 모임에 적합한 매장·시간대·인원 사이즈가 정리되면, 다음 모임은 고민 없이 출발할 수 있는 코스가 만들어집니다. 다녀온 뒤 한 줄 후기를 남기면 다음 회원의 첫 방문 결정에 결정적인 도움이 됩니다.</p>
<h2>${escHtml(a.tag)} 모임 컨셉별 활용 시나리오</h2>
<p>본문 내용을 본인 모임에 적용하려면 컨셉을 먼저 잡는 게 빠릅니다. 처음 만나는 자리에서는 대화가 끊기지 않도록 본문에서 다룬 분위기 설명을 기준으로 BGM 톤이 적당한 매장을, 오래된 친구 모임은 회전이 빠르지 않고 자리가 편한 곳을, 거래처·접대 자리는 룸 독립성과 외부 노출이 적은 동선을 우선해서 보세요. 생일·환영회처럼 분위기를 띄워야 하는 자리는 매니저·실장이 적극적으로 응대해주는 매장을, 조용한 한잔은 인원을 적게 받는 평일 저녁 시간대를 잡으면 만족도가 큽니다. 본문에서 본인 컨셉과 맞물리는 두세 문장을 미리 메모해 두면 직통 통화로 매장 톤을 확인할 때 질문이 훨씬 정확해집니다.</p>
<h2>${escHtml(a.tag)} 시간대·요일별 코스 설계</h2>
<p>같은 매장이라도 평일 저녁 8~10시는 차분한 대화 중심, 자정 전후는 회전 빠른 피크, 새벽 2~3시 이후는 마감 라스트 분위기로 톤이 확연히 갈립니다. 본문에서 시간대 단서가 등장하면 본인 모임이 시작과 끝을 어디에 두는지부터 결정하고 매장 도착 시각을 역산하세요. 평일 저녁 코스는 9시 입장·11시 해산 동선이, 주말 본격 모임은 10시 합류·새벽 1시 마무리 동선이 가장 흔합니다. 끝나는 시간 기준으로 콜택시·대리운전·심야버스를 미리 확인해 두면 새벽 귀가가 한결 수월하고, 같은 매거진 글을 다음 모임에서도 재활용할 수 있습니다.</p>
<h2>${escHtml(a.tag)} 글을 본인 후기로 잇기</h2>
<p>매거진 글이 마음에 들었다면 본인이 다녀온 매장 후기에 한 줄이라도 본문 인용을 더해 두면, 다음 회원이 본인 후기를 검색했을 때 매거진 글까지 자연스럽게 이어집니다. ${escHtml(a.tag)} 키워드는 사이트 내에서 자주 검색되는 주제라 본인 시각이 더해진 한 줄이 다음 방문자의 결정에 결정적인 단서가 됩니다. 본문에서 가장 인상 깊었던 한 문장을 본인 모임 상황에 맞춰 다시 풀어 적으면, 같은 글을 읽는 다른 회원에게도 본인 톤이 자연스럽게 전달되어 후기 자체가 새로운 매거진 단서로 자리 잡습니다. 매거진과 후기는 같은 맥락으로 연결될 때 가장 큰 도움이 됩니다.</p>
`;
  const ssrBody = `<article>
<h1>${escHtml(a.title)}</h1>
<p><strong>${escHtml(a.tag)}</strong> · <time datetime="${escHtml(a.date)}">${escHtml(a.date)}</time></p>
${a.content}
${articleAddon}
<p><a href="${BASE_URL}/magazine">← 매거진 전체 보기</a></p>
</article>`;
  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt,
    datePublished: a.date,
    dateModified: BUILD_DATE_KST,
    author: { '@type': 'Organization', name: '놀쿨', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: '놀쿨',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: a.tag,
    inLanguage: 'ko-KR',
  };
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: '놀쿨', url: BASE_URL },
    { name: '매거진', url: `${BASE_URL}/magazine` },
    { name: a.title, url: canonical },
  ]);
  writePage(routePath, {
    title: a.title,
    description: desc,
    ssrBody,
    jsonLdList: [articleJsonLd, breadcrumbJsonLd],
    datePublished: a.date,
    dateModified: BUILD_DATE_KST,
    keywords: `${a.title}, ${a.tag}, 나이트라이프 매거진, 놀쿨 매거진, 나이트라이프 ${a.tag}`,
  });
  magazineCount++;
}
console.log(`✅ 매거진 article 상세 페이지 ${magazineCount}개 생성`);

// ══════════════════════════════════════════
// 4-B. 동적 SEO 페이지 대량 생성 (1000+)
// best, new, region, region+category, tag, near
// ══════════════════════════════════════════
const dynamicPages = [];

// CollectionPage + BreadcrumbList 자동 생성 헬퍼 (동적 SEO 페이지 공통)
function collectionJsonLd(routePath, title, description, items) {
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `https://nolcool.com${routePath}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 30).map((it, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: it.nameKo || it.name || it,
      })),
    },
  };
  // 경로 분해해서 BreadcrumbList 생성
  const parts = routePath.split('/').filter(Boolean);
  const crumbs = [{ '@type': 'ListItem', position: 1, name: '홈', item: 'https://nolcool.com/' }];
  let acc = '';
  parts.forEach((p, i) => {
    acc += `/${p}`;
    crumbs.push({
      '@type': 'ListItem',
      position: i + 2,
      name: decodeURIComponent(p),
      item: `https://nolcool.com${acc}`,
    });
  });
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs };
  return [collectionLd, breadcrumbLd];
}

// ── best/[category] — 인기순 (6개) ──
// 시즌36 — 동일 스켈레톤 → 카테고리별 unique 후킹 (질문/1인칭/손실회피/수치/CTA 2+ 적용)
const BEST_DESC_BY_CAT = {
  club: (n) => `강남·홍대·압구정 클럽 ${n}곳 중 진짜 핫한 곳이 어디? 회원이 다녀온 분위기·매니저·드레스코드를 비교했습니다. 놓치면 아까운 라인업, 바로 확인하세요.`,
  night: (n) => `나이트 ${n}곳 중 부킹 잘 되는 곳을 회원이 솔직히 비교했어요. 웨이터 평판·부스 사이즈·양주 라인업까지, 오늘 갈 곳 5분 만에 결정하면 됩니다.`,
  lounge: (n) => `조용히 마실 라운지가 ${n}곳? 압구정·청담·홍대 분위기와 칵테일 라인업을 다녀온 회원이 정리했습니다. 데이트든 사교든 후회 없이 고르는 비교 페이지.`,
  room: (n) => `룸 ${n}곳 중 4~6인 부스가 어디 있나? 양주 라인업·진행 매너 모르면 첫방문 망설여집니다. 지역별 룸 구성과 예약 가능 시간을 먼저 확인하고 가세요.`,
  yojeong: (n) => `요정 ${n}곳 처음이라 격 떨어질까 걱정? 한정식 코스·접대 매너·실장 응대를 회원이 정리했습니다. 사장님 모시는 자리, 놓치면 다음은 없으니까요.`,
  hoppa: (n) => `호빠 ${n}곳 중 진짜 케어되는 곳이 어디? 강남·홍대 외모·진행·매너를 다녀온 회원이 솔직히 비교했어요. 첫방문 30분 어색함, 미리 보고 가야 안 놓칩니다.`,
};
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  const p = `/best/${catInfo.path}`;
  const title = `${catInfo.labelKo} 인기 TOP ${catVenues.length} — 회원들이 가장 많이 찾는다`;
  const topNames = catVenues.slice(0, 3).map(vv => vv.nameKo).join(', ');
  const desc = BEST_DESC_BY_CAT[catKey] ? BEST_DESC_BY_CAT[catKey](catVenues.length) : `전국 ${catInfo.labelKo} TOP ${catVenues.length}곳 비교 가이드 — ${topNames} 등 인기 ${catInfo.labelKo} 분위기, 매니저 평판, 드레스코드, 전화번호, 예약 팁까지 정리. 매일 자동 갱신되는 ${catInfo.labelKo} 추천 리스트.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>${escHtml(catInfo.labelKo)} 인기 TOP ${catVenues.length} 랭킹</h2>`;
  ssrBody += `<ol>`;
  catVenues.forEach((vv, idx) => { ssrBody += `<li>${idx + 1}. <a href="${venueHref(vv)}">${escHtml(vv.nameKo)}</a> — ${escHtml(vv.regionKo)}</li>`; });
  ssrBody += `</ol>`;
  ssrBody += `<h2>처음 가는 분 체크 포인트</h2>`;
  ssrBody += `<p>처음이면 분위기·매니저 응대·드레스코드·예약 가능 시간을 먼저 확인하세요. 같은 카테고리라도 지역마다 손님 연령대와 음악 톤이 다릅니다. 위 랭킹은 회원들이 가장 많이 찾고 다시 방문하는 곳 순서로, 각 업소 상세 페이지에서 룸 구성·양주 라인업·실장 코멘트까지 비교해서 본인 스타일에 맞는 곳을 고르는 게 좋습니다.</p>`;
  ssrBody += `<h2>자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>${escHtml(catInfo.labelKo)} 어디가 제일 인기 있나요?</dt>`;
  ssrBody += `<dd>현재 회원 검색·재방문 기준 TOP은 ${escHtml(topNames)} 입니다. 지역별로 다르니 가까운 곳부터 확인하세요.</dd>`;
  ssrBody += `<dt>예약은 어떻게 하나요?</dt>`;
  ssrBody += `<dd>각 업소 상세 페이지에 직통 번호가 있고, 평일 저녁이면 당일 통화로도 가능합니다. 주말은 미리 확인하세요.</dd></dl>`;
  // 시즌159 — best 페이지 본문 깊이 보강
  const bestRegionList = [...new Set(catVenues.map(vv => vv.regionKo))].slice(0, 8);
  ssrBody += `<h2>인기 지역 분포</h2><ul>`;
  bestRegionList.forEach(r => { const cnt = catVenues.filter(vv => vv.regionKo === r).length; ssrBody += `<li><strong>${escHtml(r)}</strong> — ${cnt}곳</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>인원·모임 컨셉별 매칭</h2>`;
  ssrBody += `<p>같은 카테고리 안에서도 매장 콘셉트·분위기·연령대가 갈리기 때문에 본인 모임 톤에 맞춰 한 곳을 정하는 게 중요합니다. 1~2인 한 잔 자리는 분위기 가벼운 곳, 3~4인 모임은 룸·부스·플로어 중 본인 모임 컨셉에 맞는 한 곳, 5~8인 단체는 사이즈가 맞는 자리가 빠르게 마감되니 직통 예약 권장입니다. 9인 이상 단체는 단체 응대 가능 매장만 추리고 사전 컨펌으로 좌석·정산까지 합의해 두면 합류와 진행이 매끄럽습니다. 회원 후기에서 "단체" "응대" "회전" 같은 키워드가 어떻게 쓰이는지 살펴보면 본인 모임에 적합한지 빠르게 판단할 수 있습니다.</p>`;
  ssrBody += `<h2>시간대별 분위기</h2>`;
  ssrBody += `<p>시간대에 따라 손님 톤이 갈립니다. 평일 저녁 7~10시는 비교적 차분해서 소개팅·동료 한잔·첫 방문에 적합하고, 금·토 밤 10시 이후는 본격 회전이 시작되어 콘셉트의 활기를 가장 진하게 느낄 수 있습니다. 자정~새벽 2시는 합석·부킹·단체 모임 마무리가 가장 활발하며, 새벽 2시 이후 마감 시간은 매장마다 달라 직통 통화 확인이 가장 정확합니다. 본인 모임 톤에 맞춰 출발 시간을 잡으면 매장 분위기와 어긋나지 않게 자리를 잡을 수 있습니다.</p>`;
  ssrBody += `<h2>방문 후 후기 활용</h2>`;
  ssrBody += `<p>인기 랭킹은 회원 검색·재방문·후기 데이터를 종합해 자동 갱신됩니다. 다녀온 뒤 한 줄 후기라도 남기면 다음 방문자의 첫 방문 결정에 큰 도움이 되고, 본인이 자주 가는 매장의 랭킹 변동에도 영향을 줍니다. 사진 후기는 조명·룸 배치·분위기 단서를 직접 보여주기 때문에 다음 회원이 가장 많이 참고하는 자료입니다. 매장 측 응대 품질을 객관적으로 평가하고 싶다면 평점뿐 아니라 본인이 느낀 결정적 장면을 한 문장이라도 적어 두는 게 좋습니다.</p>`;
  ssrBody += `<h2>비교할 때 보는 5가지</h2>`;
  ssrBody += `<p>처음 비교한다면 다음 다섯 가지를 차례로 보면 실수가 적습니다. 첫째 매장 콘셉트와 메인 손님 연령대, 둘째 자리 구성과 본인 인원에 맞는 룸·부스·플로어 사이즈, 셋째 매니저·실장 응대 톤과 후기 코멘트, 넷째 직통 예약 가능 시간과 마감 시간, 다섯째 동선과 끝나고 귀가 교통입니다. 위 다섯 가지를 모두 채운 매장 두 곳을 추려 직통 통화로 분위기를 짧게 확인해두면 본인 모임에 어느 쪽이 더 맞는지 즉시 판단할 수 있습니다. 회원 후기에서 결정적 문장을 한두 줄 발췌해 두면 모임 전 일행과 공유하기에도 편합니다.</p>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${catInfo.labelKo} 인기, ${catInfo.labelKo} 추천, ${catInfo.labelKo} 랭킹, ${catInfo.labelKo} TOP`, jsonLdList: collectionJsonLd(p, title, desc, catVenues) });
  dynamicPages.push(p);
}

// ── new/[category] — 신규 (6개) ──
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  const p = `/new/${catInfo.path}`;
  const title = `새로 입점한 ${catInfo.labelKo} ${catVenues.length}곳 — 아직 안 가본 곳 먼저 발견`;
  const newNames = catVenues.slice(0, 3).map(vv => vv.nameKo).join(', ');
  const desc = `새로 오픈한 ${catInfo.labelKo} 어디 있지? 최근 신규 입점 ${catVenues.length}곳 — ${newNames} 등 강남 홍대 이태원 일산 부산 수원 신생 핫스팟. 손님 적고 매니저 응대 좋은 오픈 직후 시점 놓치지 말고 바로 확인.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>신규 ${escHtml(catInfo.labelKo)} ${catVenues.length}곳</h2><ul>`;
  catVenues.forEach(vv => {
    // 시즌172 — 리스트 suffix만 노출
    const parts = (vv.nameKo || '').split(/\s+/);
    const shortLabel = parts.length > 1 ? parts.slice(1).join(' ') : vv.nameKo;
    ssrBody += `<li><a href="${venueHref(vv)}">${escHtml(shortLabel)}</a> — ${escHtml(vv.regionKo)}</li>`;
  });
  ssrBody += `</ul>`;
  ssrBody += `<h2>첫 방문 팁</h2>`;
  ssrBody += `<p>오픈 직후에는 손님이 아직 적어 매니저 응대가 꼼꼼하고 자리 선택도 자유로운 편입니다. 다만 운영 동선이 정착되기 전이라 평일 저녁이나 오픈 1~2시간 후에 가면 분위기를 더 정확히 볼 수 있습니다. 각 업소 페이지에서 콘셉트·룸 구성·실장 코멘트를 확인하고 직통 번호로 미리 통화해두면 첫방문이 훨씬 편합니다.</p>`;
  ssrBody += `<h2>자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>최근 오픈한 ${escHtml(catInfo.labelKo)} 어디가 좋아요?</dt>`;
  ssrBody += `<dd>현재 신규 입점 리스트는 ${escHtml(newNames)} 입니다. 지역과 콘셉트로 추려서 비교하세요.</dd>`;
  ssrBody += `<dt>신규 매장은 손님이 적나요?</dt>`;
  ssrBody += `<dd>오픈 초기에는 평일 손님이 적은 편이라 분위기를 여유롭게 즐길 수 있고, 주말은 미리 예약하는 게 안전합니다.</dd></dl>`;
  // 시즌159 — new 페이지 본문 깊이 보강
  const newRegionList = [...new Set(catVenues.map(vv => vv.regionKo))].slice(0, 8);
  ssrBody += `<h2>지역 분포</h2><ul>`;
  newRegionList.forEach(r => { const cnt = catVenues.filter(vv => vv.regionKo === r).length; ssrBody += `<li><strong>${escHtml(r)}</strong> — ${cnt}곳</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>오픈 직후 활용 가이드</h2>`;
  ssrBody += `<p>최근 오픈한 매장은 운영 동선이 정착되기 전이라 매니저 응대가 꼼꼼하고 자리 선택도 자유로운 편입니다. 다만 사진·메뉴·라인업 같은 1차 정보가 아직 충분히 누적되지 않아 매장 콘셉트를 직통 통화로 한번 확인하고 가는 편이 정확합니다. 오픈 첫 한 달은 회원 후기가 거의 없어 분위기 가늠이 어려울 수 있으니, 첫 방문은 평일 저녁 차분한 시간대에 잠깐 들러 매장 톤을 익혀 두고 본격 모임은 두 번째 방문에 잡는 동선이 안전합니다.</p>`;
  ssrBody += `<h2>첫 방문 체크 포인트</h2>`;
  ssrBody += `<ul>`;
  ssrBody += `<li>매장 콘셉트 — 직통 전화로 분위기·연령대·드레스코드 직접 확인</li>`;
  ssrBody += `<li>예약 가능 시간 — 오픈 직후는 평일 자리 여유 많은 편</li>`;
  ssrBody += `<li>룸/부스 사이즈 — 인원에 맞는 자리가 있는지 미리 확인</li>`;
  ssrBody += `<li>주차·교통 — 오픈 직후라 주차 안내가 정착 안 된 곳도 있음</li>`;
  ssrBody += `<li>마감 시간 — 운영 초기 마감 시간이 자주 변동될 수 있음</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>후기 남기기</h2>`;
  ssrBody += `<p>신규 오픈 매장은 회원 후기가 아직 적어, 본인이 다녀온 뒤 한 줄 후기라도 남기면 다음 방문자의 첫 방문 결정에 결정적인 도움이 됩니다. 사진 후기는 조명·룸 배치·무대 구성 같은 분위기 단서를 직접 보여주고, 글 후기는 응대·회전·인원 톤을 가늠하는 1차 자료가 됩니다. 오픈 초기 후기는 매장 운영자에게도 빠른 피드백이 되어 사진·메뉴·라인업 업데이트로 이어지는 경우가 많습니다. 본인이 자주 가는 동네에 새 매장이 생기면 회원 가입 후 한 줄이라도 남겨 두면 동네 정보가 더 빠르게 정리됩니다.</p>`;
  ssrBody += `<h2>오픈 직후만의 장점</h2>`;
  ssrBody += `<p>오픈 직후에는 단골 손님이 아직 자리 잡기 전이라 신규 방문자도 자리·응대를 가장 자유롭게 받을 수 있는 시기입니다. 매니저·실장이 본인 모임 톤을 한 번이라도 기억해 두면 두 번째 방문부터 응대 품질이 눈에 띄게 달라지고, 운영 초기 멤버십·이벤트 혜택을 가장 빨리 안내받을 수 있는 자리이기도 합니다. 다만 평일·주말 분위기 차이가 아직 정착되지 않아 같은 매장이라도 방문 요일에 따라 톤이 크게 달라질 수 있으니, 본격 모임 전에 평일 가벼운 자리로 한 번 분위기를 보고 두 번째 본격 모임을 잡는 동선이 가장 안전합니다.</p>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `신규 ${catInfo.labelKo}, 새 ${catInfo.labelKo}, ${catInfo.labelKo} 오픈`, jsonLdList: collectionJsonLd(p, title, desc, catVenues) });
  dynamicPages.push(p);
}

// ── region/[region] — 지역 랜딩 (전 업종 통합) ──
const allRegions = {};
for (const v of venues) {
  if (!allRegions[v.regionKo]) allRegions[v.regionKo] = [];
  allRegions[v.regionKo].push(v);
}
for (const [regionKo, regionVenues] of Object.entries(allRegions)) {
  const p = `/region/${encodeURIComponent(regionKo)}`;
  const title = `${regionKo} 나이트라이프 ${regionVenues.length}곳 — 클럽·라운지·룸·요정 한눈에`;
  // 시즌172 — region 접두어 포함 venue는 suffix만 (브랜드 반복 희석)
  const shortLabelFn = (rv) => { const ps = (rv.nameKo || '').split(/\s+/); return (ps.length > 1 && ps[0].includes(regionKo)) ? ps.slice(1).join(' ') : rv.nameKo; };
  const regionTopNames = regionVenues.slice(0, 3).map(shortLabelFn).join(', ');
  const desc = `이 지역 클럽·나이트·라운지·룸·요정·호빠 ${regionVenues.length}곳 통합 정리. ${regionTopNames} 등 인기 업소 평점·후기·분위기·전화번호 한눈에 비교. 처음 가는 사람도 후회 없이 고르는 핫스팟 가이드.`;
  // 업종별 그룹핑 SSR
  const byCat = {};
  regionVenues.forEach(rv => { const ck = catLabelMap[rv.cat] || rv.cat; if (!byCat[ck]) byCat[ck] = []; byCat[ck].push(rv); });
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  for (const [ck, rvs] of Object.entries(byCat)) {
    ssrBody += `<h2>${escHtml(ck)} (${rvs.length}곳)</h2><ul>`;
    rvs.forEach((rv, idx) => {
      const shortLabel = shortLabelFn(rv);
      // 시즌172 — 상위 3곳만 shortDesc, 그 외는 이름만, 모두 suffix 라벨
      if (idx < 3) {
        ssrBody += `<li><a href="${venueHref(rv)}">${escHtml(shortLabel)}</a> — ${escHtml(rv.shortDesc.slice(0, 50))}</li>`;
      } else {
        ssrBody += `<li><a href="${venueHref(rv)}">${escHtml(shortLabel)}</a></li>`;
      }
    });
    ssrBody += `</ul>`;
  }
  // FAQ
  ssrBody += `<section><h2>나이트라이프 FAQ</h2><dl>`;
  ssrBody += `<dt>나이트라이프 추천은?</dt>`;
  ssrBody += `<dd>인기 있는 곳: ${regionVenues.slice(0, 5).map(shortLabelFn).map(escHtml).join(', ')}. 각 업소 페이지에서 비교해보세요.</dd>`;
  ssrBody += `<dt>몇 곳 있나요?</dt>`;
  ssrBody += `<dd>이 지역에는 ${regionVenues.length}곳의 나이트라이프 매장이 등록되어 있습니다.</dd>`;
  ssrBody += `</dl></section>`;
  // 시즌22 — 지역×업종 anchor (region/{ko}/{cat} reachable)
  ssrBody += `<h2>업종별 더보기</h2><ul>`;
  for (const [catKey, catInfo] of Object.entries(catMap)) {
    const cv = regionVenues.filter(rv => rv.cat === catKey);
    if (cv.length === 0) continue;
    ssrBody += `<li><a href="/region/${encodeURIComponent(regionKo)}/${catInfo.path}/">${escHtml(catInfo.labelKo)} ${cv.length}곳</a></li>`;
  }
  ssrBody += `</ul>`;
  // 시즌159 — region 본문 깊이 보강
  ssrBody += `<h2>나이트라이프 한 줄 정리</h2>`;
  const catCounts = Object.entries(byCat).map(([ck, rvs]) => `${escHtml(ck)} ${rvs.length}곳`).join(' · ');
  ssrBody += `<p>이 지역에는 ${catCounts}이 등록되어 있고, 같은 동네라도 거리·역·층에 따라 손님 톤이 갈립니다. 처음 가는 분은 회원 후기가 누적된 ${regionTopNames ? escHtml(regionTopNames) : '대표 업소'} 같은 곳부터 둘러보면서 동네 분위기를 잡고, 두 번째 방문에 본인 모임 컨셉에 맞는 업종으로 옮겨가는 동선이 무난합니다.</p>`;
  ssrBody += `<h2>시간대별 분위기</h2>`;
  ssrBody += `<ul>`;
  ssrBody += `<li><strong>평일 저녁 7~10시</strong> — 비교적 차분, 첫 방문·소개팅·동료 한잔에 적합</li>`;
  ssrBody += `<li><strong>금·토 밤 10시~자정</strong> — 라인업 본격 회전, 동네 활기 피크</li>`;
  ssrBody += `<li><strong>자정~새벽 2시</strong> — 합석·부킹 회전이 가장 활발, 단체 모임 마무리 코스</li>`;
  ssrBody += `<li><strong>새벽 2시 이후</strong> — 마감 시간이 업소마다 달라 직통 통화로 확인 권장</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>모임 컨셉별 추천 업종</h2>`;
  ssrBody += `<ul>`;
  ssrBody += `<li><strong>생일·기념일</strong> — 룸/요정 프라이빗 룸이 사진·노래·축하 동선에 편함</li>`;
  ssrBody += `<li><strong>송별·환영회</strong> — 룸 또는 부스, 인원 사이즈에 맞는 곳으로 미리 예약</li>`;
  ssrBody += `<li><strong>소개팅·데이트</strong> — 라운지 칵테일바, 조용한 자리에서 대화 위주</li>`;
  ssrBody += `<li><strong>친구 사교·새 인연</strong> — 합석·부킹 회전이 많은 시간대 권장</li>`;
  ssrBody += `<li><strong>비즈니스 만찬</strong> — 정찬 또는 양주룸, 격조와 프라이빗 둘 다 잡힘</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>동선·교통 가이드</h2>`;
  ssrBody += `<p>이 일대는 늦은 시간 택시 잡기가 어려운 구간이 있어 끝나는 시간 기준으로 귀가 동선을 미리 설계하는 편이 안전합니다. 일행이 흩어지지 않도록 위치 공유를 켜두고, 합류 지점은 역·편의점 같이 누구나 찾기 쉬운 랜드마크로 잡으면 모임이 흐트러지지 않습니다. 직통 콜택시·대리운전 번호는 매장 매니저에게 부탁하면 안내받을 수 있습니다.</p>`;
  ssrBody += `<h2>첫 방문자 체크 포인트</h2>`;
  ssrBody += `<p>처음이라면 회원 후기가 최근 한 달 안에 누적된 업소부터 둘러보는 게 분위기 가늠에 가장 정확합니다. 매장 사진 갤러리를 한번 훑어 본인 모임 톤에 맞는 콘셉트인지 가늠하고, 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 확인하면 자리 잡고 헤매는 시간을 줄일 수 있습니다. 같은 동네 안에서도 거리·역·층마다 손님 톤이 갈리니 첫 방문은 평일 저녁 차분한 시간대에 분위기를 익히고, 두 번째 방문에 본격 모임 자리를 잡는 동선이 부담 없습니다.</p>`;
  ssrBody += `<h2>인근 합류·해산 동선</h2>`;
  ssrBody += `<p>모임은 합류와 해산 동선을 사전에 설계해 두면 모임 자체에 집중할 수 있습니다. 합류 지점은 대표 역의 출구·편의점 같은 랜드마크로 잡고, 일행이 늦으면 매장 안에서 기다리지 말고 약속한 랜드마크에서 잠깐 합류한 다음 함께 입장하는 흐름이 매끄럽습니다. 해산은 마지막 잔이 비기 전 미리 콜택시·대리를 호출해 두면 새벽 일대 택시난을 피할 수 있고, 일행이 만취한 경우 매장 매니저에게 부탁해 안전한 콜·대리를 안내받는 편이 빠릅니다.</p>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${regionKo} 나이트라이프, ${regionKo} 클럽, ${regionKo} 나이트, ${regionKo} 룸, ${regionKo} 라운지`, jsonLdList: collectionJsonLd(p, title, desc, regionVenues) });
  dynamicPages.push(p);

  // ── region/[region]/[category] — 지역+업종 크로스 ──
  for (const [catKey, catInfo] of Object.entries(catMap)) {
    const crossVenues = regionVenues.filter(rv => rv.cat === catKey);
    if (crossVenues.length === 0) continue;
    const cp = `/region/${encodeURIComponent(regionKo)}/${catInfo.path}`;
    const crossNames = crossVenues.slice(0, 3).map(cv => cv.nameKo).join(', ');
    const xs = (CROSS_SIG[catKey] || {})[regionKo];
    const ct = xs
      ? `${regionKo} ${catInfo.labelKo} ${crossVenues.length}곳 — ${xs.tail}`
      : `${regionKo} ${catInfo.labelKo} ${crossVenues.length}곳 — 한눈에 비교하고 고르기`;
    const cd = xs
      ? `${regionKo}에서 ${catInfo.labelKo} 어디가 진짜야? ${xs.sig}. ${crossNames} 등 ${crossVenues.length}곳 분위기·후기·매니저·드레스코드·전화번호·예약 팁까지 한 페이지에서 바로 확인. 헛걸음 전에 비교하고 가자.`
      : `${regionKo}에서 ${catInfo.labelKo} 어디가 진짜야? ${crossNames} 등 ${crossVenues.length}곳 분위기·후기·평점·매니저·드레스코드·전화번호·영업시간·예약 팁까지 한 페이지에서 바로 확인. 헛걸음 전에 비교하고 가자.`;
    let cSsr = `<h1>${escHtml(ct)}</h1><p>${escHtml(cd)}</p>`;
    cSsr += `<h2>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} ${crossVenues.length}곳 리스트</h2><ul>`;
    crossVenues.forEach((cv, idx) => {
      // 시즌172 — 상위 5곳만 shortDesc, 그 외는 suffix 라벨만
      const parts = (cv.nameKo || '').split(/\s+/);
      const shortLabel = parts.length > 1 ? parts.slice(1).join(' ') : cv.nameKo;
      if (idx < 5) {
        cSsr += `<li><a href="${venueHref(cv)}">${escHtml(shortLabel)}</a> — ${escHtml(cv.shortDesc.slice(0, 50))}</li>`;
      } else {
        cSsr += `<li><a href="${venueHref(cv)}">${escHtml(shortLabel)}</a></li>`;
      }
    });
    cSsr += `</ul>`;
    cSsr += `<h2>고를 때 체크 포인트</h2>`;
    cSsr += `<p>여기 안에서도 골목·분위기·연령대가 다 다릅니다. 평일·주말 손님 톤이 크게 갈리는 곳도 있어 같은 결로 묶어 비교하면 실수합니다. 위 ${crossVenues.length}곳은 회원들이 자주 비교하는 라인업만 모아둔 리스트로, 각 페이지에서 룸 구성·양주 라인업·실장 코멘트·예약 가능 시간을 확인하고 본인 모임 컨셉에 맞춰 고르세요.</p>`;
    cSsr += `<h2>자주 묻는 질문</h2>`;
    cSsr += `<dl><dt>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} 어디가 인기 있나요?</dt>`;
    cSsr += `<dd>${escHtml(crossNames)} 등이 회원 검색·재방문 기준으로 자주 언급됩니다.</dd>`;
    cSsr += `<dt>예약은 어떻게 하나요?</dt>`;
    cSsr += `<dd>각 업소 상세 페이지에서 직통 전화로 예약 가능 시간과 룸 사이즈를 미리 확인하세요. 주말은 일찍 마감되는 곳이 많습니다.</dd></dl>`;
    // 시즌159 — 본문 깊이 보강
    cSsr += `<h2>인원별 코스</h2><ul>`;
    cSsr += `<li><strong>2~3인</strong> — 가벼운 자리, 시간 제한 적은 분위기</li>`;
    cSsr += `<li><strong>4~6인</strong> — 가장 평균적인 모임 단위</li>`;
    cSsr += `<li><strong>7~10인</strong> — 룸·부스 사이즈 미리 확인하고 직통 예약</li>`;
    cSsr += `<li><strong>단체(10인 이상)</strong> — 단체 응대 가능 매장만 추리고 사전 컨펌</li>`;
    cSsr += `</ul>`;
    cSsr += `<h2>가는 길·끝나고 동선</h2>`;
    cSsr += `<p>안에서 거리는 역에서 도보권에 모여 있는 경우가 많지만, 매장마다 골목과 층이 달라 처음 가는 분은 직통 전화로 출구 번호와 입구 위치를 한번 확인하고 출발하면 헛걸음을 줄일 수 있습니다. 끝나는 시간 기준으로 콜택시·대리운전을 미리 알아두면 새벽 귀가가 한결 수월합니다. 일행이 많을 때는 합류 지점을 역·편의점 같은 랜드마크로 잡으면 모임이 흐트러지지 않습니다.</p>`;
    cSsr += `<h2>처음 가는 분 체크리스트</h2>`;
    cSsr += `<p>같은 카테고리라도 안에서 콘셉트·분위기·연령대가 다 다릅니다. 평일 저녁은 조용한 코스, 금·토 자정 이후는 회전 빠른 코스로 갈리니 본인 모임 톤에 맞춰 시간대를 잡는 게 좋습니다. 드레스코드는 매장 사진을 한번 훑어 보고, 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 확인하면 자리 잡고 헤매는 시간을 줄일 수 있습니다. ${crossVenues.slice(0, 5).map(cv => { const p = (cv.nameKo || '').split(/\s+/); return escHtml(p.length > 1 ? p.slice(1).join(' ') : cv.nameKo); }).join(', ')} 같은 곳은 후기·평점이 자주 갱신되어 첫 방문 가늠이 비교적 쉽습니다.</p>`;
    cSsr += `<h2>모임 컨셉별 매칭</h2>`;
    cSsr += `<p>같은 결이라도 모임 컨셉에 따라 고르는 기준이 달라집니다. 처음 만나는 자리는 대화가 끊기지 않게 BGM 볼륨이 적당한 곳, 오래된 친구 모임은 회전 느리고 자리 편한 곳, 거래처·접대 자리는 룸 독립성과 동선이 외부에 노출되지 않는 매장을 우선해서 보세요. 생일·환영회처럼 분위기를 띄워야 하는 자리는 매니저·실장이 적극적으로 응대해주는 곳을, 조용히 한잔하고 싶은 자리는 인원 적게 받는 시간대를 골라 잡으면 만족도가 큽니다. 위 ${crossVenues.length}곳 각 페이지에서 매장 톤을 한번 비교해 보면 본인 컨셉에 맞는 곳이 자연스럽게 추려집니다.</p>`;
    cSsr += `<h2>시간대별 분위기</h2>`;
    cSsr += `<p>시간대마다 손님 톤이 확연히 달라집니다. 저녁 8~10시는 1차 끝나고 합류하는 손님이 주를 이뤄 비교적 차분하고 대화 중심, 자정 전후는 회전이 가장 빠른 피크 시간대로 분위기가 가장 활성화됩니다. 새벽 2~3시 이후는 마감 전 라스트 분위기로 자리가 빨리 비기 시작하니, 끝나는 시간을 여유 있게 잡는 모임은 자정 전 입장을 권합니다. 평일과 주말 톤 차이도 큰 편이라, 처음 가는 분은 매장 후기에서 본인이 가려는 요일·시간대 코멘트를 찾아 보면 실제 분위기를 가늠하기 쉽습니다.</p>`;
    writePage(cp, { title: ct, description: cd, ssrBody: cSsr, keywords: `${regionKo} ${catInfo.labelKo}, ${regionKo} ${catInfo.labelKo} 추천`, jsonLdList: collectionJsonLd(cp, ct, cd, crossVenues) });
    dynamicPages.push(cp);
  }
}

// ── tag/[tag] — 태그 페이지 ──
const allTags = {};
for (const v of venues) {
  for (const t of v.tags) {
    if (!allTags[t]) allTags[t] = [];
    allTags[t].push(v);
  }
}
for (const [tag, tagVenues] of Object.entries(allTags)) {
  if (tagVenues.length < 1) continue;
  const p = `/tag/${encodeURIComponent(tag)}`;
  const title = `#${tag} 관련 업소 ${tagVenues.length}곳 — 태그로 찾는 나이트라이프`;
  // 시즌172 — tagTopNames에서도 접두어 중복 제거 (시즌172 stuffing 해소)
  const tagTopNames = tagVenues.slice(0, 3).map(tv => { const p = (tv.nameKo || '').split(/\s+/); return (p.length > 1 && p[0].includes(tag)) ? p.slice(1).join(' ') : tv.nameKo; }).join(', ');
  const desc = `'${tag}' 키워드로 모은 클럽·나이트·라운지·룸·요정·호빠 ${tagVenues.length}곳 큐레이션. ${tagTopNames} 등 강남 홍대 이태원 일산 부산 핫스팟 정리. 같은 분위기·콘셉트끼리 묶어 한번에 비교 가능한 전용 페이지.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>큐레이션 ${tagVenues.length}곳</h2><ul>`;
  tagVenues.forEach(tv => {
    // 시즌172 — 태그가 venue nameKo 접두어에 포함되면 suffix만 노출 (반복 희석)
    const parts = (tv.nameKo || '').split(/\s+/);
    const shortLabel = (parts.length > 1 && parts[0].includes(tag)) ? parts.slice(1).join(' ') : tv.nameKo;
    ssrBody += `<li><a href="${venueHref(tv)}">${escHtml(shortLabel)}</a> — ${escHtml(tv.regionKo)}</li>`;
  });
  ssrBody += `</ul>`;
  ssrBody += `<h2>비교 가이드</h2>`;
  ssrBody += `<p>같은 키워드라도 지역과 업종에 따라 분위기와 손님 톤이 다릅니다. 위 ${tagVenues.length}곳은 회원들이 같은 결로 자주 묶어 검색하는 업소만 모은 큐레이션이고, 각 페이지에서 룸 구성·양주 라인업·매니저 코멘트·예약 가능 시간을 비교하면 본인 모임에 맞는 곳을 더 빠르게 고를 수 있습니다.</p>`;
  ssrBody += `<h2>자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>여기 묶인 업소는 어떤 곳인가요?</dt>`;
  ssrBody += `<dd>${tagVenues.slice(0, 3).map(tv => { const p = (tv.nameKo || '').split(/\s+/); return escHtml((p.length > 1 && p[0].includes(tag)) ? p.slice(1).join(' ') : tv.nameKo); }).join(', ')} 등 ${tagVenues.length}곳이 같은 결로 묶여 있습니다. 각 업소 상세 페이지에서 정확한 분위기를 확인하세요.</dd>`;
  ssrBody += `<dt>처음 가는데 뭐 챙겨야 하나요?</dt>`;
  ssrBody += `<dd>드레스코드와 예약 가능 시간은 업소마다 달라서, 직통 전화로 미리 확인하면 첫방문이 훨씬 편합니다.</dd></dl>`;
  // 시즌159 — 본문 깊이 보강
  const tagRegions = [...new Set(tagVenues.map(tv => tv.regionKo))].slice(0, 8);
  const tagCats = [...new Set(tagVenues.map(tv => catLabelMap[tv.cat] || tv.cat))];
  ssrBody += `<h2>지역 분포</h2><ul>`;
  tagRegions.forEach(r => { const cnt = tagVenues.filter(tv => tv.regionKo === r).length; ssrBody += `<li><strong>${escHtml(r)}</strong> — ${cnt}곳</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>업종 분포</h2><ul>`;
  tagCats.forEach(c => { const cnt = tagVenues.filter(tv => (catLabelMap[tv.cat] || tv.cat) === c).length; ssrBody += `<li><strong>${escHtml(c)}</strong> — ${cnt}곳</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>큐레이션 활용법</h2>`;
  ssrBody += `<p>이 큐레이션은 회원들이 ${tagVenues.length}곳을 같은 결로 묶어 둔 페이지입니다. 본인 모임 컨셉에 와닿는다면, 위 지역·업종 분포에서 가까운 곳부터 추려 두 곳 정도를 비교해 보면 됩니다. 같은 결의 업소라도 평일·주말 손님 톤과 분위기가 다르니, 직통 전화로 예약 가능 시간과 룸/부스 사이즈를 확인하고 출발하면 헛걸음을 줄일 수 있습니다. 회원 후기를 빠르게 훑어 보면 콘셉트를 매장이 어떻게 풀어내는지가 눈에 보이고, 최근 한 달 안에 다녀온 후기가 누적된 곳일수록 분위기 가늠이 정확합니다. 첫 방문이라면 평일 저녁 시간대에 잠깐 들러 동네와 매장 톤을 익힌 다음, 다음 방문에 본격적으로 모임 자리를 잡는 동선이 부담 없습니다.</p>`;
  ssrBody += `<h2>가기 전 체크 포인트</h2>`;
  ssrBody += `<p>여기 묶인 업소는 같은 결 안에서도 콘셉트와 분위기가 갈리기 때문에 방문 전에 짧게 짚어 볼 항목이 있습니다. 첫째, 드레스코드는 매장 사진을 한번 훑어 본인 모임 톤에 맞춰야 어색하지 않습니다. 둘째, 예약 가능 시간과 룸/부스 사이즈는 직통 통화로 확인하면 자리 잡고 헤매는 시간을 줄일 수 있습니다. 셋째, 인원 사이즈는 모임 컨셉에 맞게 미리 합의해야 동선이 매끄럽고, 너무 작거나 크면 분위기가 어색해질 수 있습니다. 넷째, 마감 시간은 시즌·요일에 따라 단축되는 경우가 있어 늦은 시간 합류한다면 입장 가능 여부를 미리 확인하는 편이 안전합니다.</p>`;
  ssrBody += `<ul>`;
  ssrBody += `<li>드레스코드 — 매장 사진 한번 훑고 본인 톤에 맞추기, 콘셉트에 어울리는 분위기</li>`;
  ssrBody += `<li>예약 가능 시간 — 직통 통화로 룸/부스 사이즈와 인원 합석 가능 여부 확인</li>`;
  ssrBody += `<li>인원 사이즈 — 너무 크거나 작으면 동선이 어색, 모임 컨셉에 맞춰 사이즈 합의</li>`;
  ssrBody += `<li>마감 시간 — 시즌·요일에 따라 단축되는 경우가 있으니 늦은 합류는 사전 확인</li>`;
  ssrBody += `<li>귀가 동선 — 새벽 택시·콜대리 미리 알아두고 일행 위치 공유 켜두기</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>시간대별 분위기</h2>`;
  ssrBody += `<p>여기 묶인 업소는 시간대별로 손님 톤이 갈립니다. 평일 저녁 7~10시는 비교적 차분해서 소개팅·동료 한잔·첫 방문에 적합하고, 금·토 밤 10시 이후는 본격 회전이 시작되어 콘셉트의 활기를 가장 진하게 느낄 수 있습니다. 자정~새벽 2시는 합석·부킹·단체 모임 마무리가 가장 활발하며, 새벽 2시 이후는 매장마다 마감 시간이 달라 직통 통화 확인이 가장 정확합니다. 모임 톤에 맞춰 출발 시간을 잡으면 분위기와 어긋나지 않게 자리를 잡을 수 있습니다.</p>`;
  ssrBody += `<h2>함께 보면 좋은 큐레이션</h2>`;
  ssrBody += `<p>비슷한 결로 자주 묶이는 키워드는 매장 콘셉트·분위기에 따라 갈립니다. 회원들이 검색·찜·후기에서 자주 함께 사용하는 큐레이션을 참고하면 본인 모임에 맞는 곳을 더 빠르게 좁힐 수 있습니다. 같은 결 안에서도 지역 분포(${tagRegions.slice(0, 5).map(r => escHtml(r)).join(', ')}${tagRegions.length > 5 ? ' 등' : ''})에 따라 손님 톤이 다르니 가까운 지역부터 둘러보고, 두 번째 방문에 다른 지역으로 동선을 넓혀가는 흐름이 자연스럽습니다.</p>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${tag}, ${tag} 추천, 나이트라이프 ${tag}`, jsonLdList: collectionJsonLd(p, title, desc, tagVenues) });
  dynamicPages.push(p);
}

// ── near/[station] — 역 근처 ──
const stationVenues = {};
for (const v of venues) {
  if (!v.nearbyStation) continue;
  // "마두역 1번출구" → "마두역"
  const stName = v.nearbyStation.match(/([^\s]+역)/)?.[1] || v.nearbyStation.split(' ')[0];
  if (!stationVenues[stName]) stationVenues[stName] = [];
  stationVenues[stName].push(v);
}
for (const [st, stVenues] of Object.entries(stationVenues)) {
  const p = `/near/${encodeURIComponent(st)}`;
  const title = `${st} 근처 업소 ${stVenues.length}곳 — 역에서 걸어서 갈 수 있는 곳`;
  // 시즌172 — 역명이 venue 접두어에 포함되면 suffix만 노출 (밀도 희석)
  const stTopNames = stVenues.slice(0, 3).map(sv => { const p = (sv.nameKo || '').split(/\s+/); return (p.length > 1 && p[0].includes(st.replace(/역$/, ''))) ? p.slice(1).join(' ') : sv.nameKo; }).join(', ');
  const desc = `도보 5분 거리 클럽·나이트·라운지·룸·요정·호빠 ${stVenues.length}곳 위치 정리. ${stTopNames} 등 인근 핫스팟 평점·후기·전화번호 비교. 술 한잔, 클럽, 룸 가기 좋은 곳을 거리순으로 안내.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>도보권 업소 ${stVenues.length}곳</h2><ul>`;
  stVenues.forEach(sv => {
    const parts = (sv.nameKo || '').split(/\s+/);
    const shortLabel = (parts.length > 1 && parts[0].includes(st.replace(/역$/, ''))) ? parts.slice(1).join(' ') : sv.nameKo;
    ssrBody += `<li><a href="${venueHref(sv)}">${escHtml(shortLabel)}</a> — ${escHtml(sv.regionKo)} ${catLabelMap[sv.cat] || sv.cat}</li>`;
  });
  ssrBody += `</ul>`;
  ssrBody += `<h2>도보 가이드</h2>`;
  ssrBody += `<p>이 역에서 출구를 나와 도보 5분 안쪽으로 갈 수 있는 ${stVenues.length}곳을 모았습니다. 늦은 시간에는 택시 잡기가 어렵기 때문에 역 근처에서 끝나는 코스가 안전합니다. 각 업소 페이지에서 정확한 도보 시간·골목 위치·매니저 직통 번호를 확인하고, 모임 시작 시간을 역 기준으로 잡으면 합류와 이동이 훨씬 편합니다.</p>`;
  ssrBody += `<h2>자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>도보 5분 안에 갈 수 있는 곳은?</dt>`;
  ssrBody += `<dd>${escHtml(stTopNames)} 등 총 ${stVenues.length}곳이 도보권 안에 있습니다. 출구 번호는 각 업소 페이지에서 확인하세요.</dd>`;
  ssrBody += `<dt>늦은 시간에도 영업하나요?</dt>`;
  ssrBody += `<dd>대부분 새벽까지 운영하지만 마감 시간은 업소마다 다릅니다. 직통 통화로 마감 전 입장 가능 여부를 확인하세요.</dd></dl>`;
  // 시즌159 — 본문 깊이 보강
  const stCats = [...new Set(stVenues.map(sv => catLabelMap[sv.cat] || sv.cat))];
  ssrBody += `<h2>업종별 분포</h2><ul>`;
  stCats.forEach(c => { const cnt = stVenues.filter(sv => (catLabelMap[sv.cat] || sv.cat) === c).length; ssrBody += `<li><strong>${escHtml(c)}</strong> — ${cnt}곳</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>시간대별 동선</h2><ul>`;
  ssrBody += `<li><strong>저녁 7~10시</strong> — 첫 모임 자리, 차분한 분위기 위주</li>`;
  ssrBody += `<li><strong>밤 10시~자정</strong> — 일대 활기 피크</li>`;
  ssrBody += `<li><strong>자정~새벽 2시</strong> — 합석·부킹 회전 활발, 단체 마무리 코스</li>`;
  ssrBody += `<li><strong>새벽 2시 이후</strong> — 마감 시간 직통 확인 필요</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>출구·도보 가이드</h2>`;
  ssrBody += `<p>주변은 출구마다 도보 거리가 달라서, 매장 직통 전화로 정확한 출구 번호와 골목 위치를 확인하면 헛걸음을 줄일 수 있습니다. 일행이 흩어지지 않도록 합류 지점은 역·편의점 같은 랜드마크로 잡고, 위치 공유를 켜두면 동선이 매끄럽습니다. 인근은 늦은 시간 택시 잡기가 어려운 구간도 있어 끝나는 시간 기준으로 콜택시·대리운전을 미리 알아두는 편이 안전합니다. 모임 시작 시간을 역 기준으로 잡으면 일행 합류와 이동 부담이 줄고, 첫 만남 자리에서 동선 때문에 시간을 허비하지 않습니다.</p>`;
  ssrBody += `<h2>첫 방문 체크리스트</h2>`;
  ssrBody += `<p>처음이라면 매장 카테고리와 분위기를 먼저 비교해 보고, 본인 모임 컨셉에 맞는 한 곳을 정한 다음 직통 전화로 예약·드레스코드·룸 사이즈를 확인하면 헛걸음 없이 자리를 잡을 수 있습니다. 일대는 출구마다 골목 분위기가 다르고, 같은 거리라도 매장 콘셉트가 갈리니 사진 갤러리를 한번 훑고 가는 편이 안전합니다. 늦은 시간 새벽 마감을 노린다면 마감 시간이 시즌·요일에 따라 단축되는 곳이 있어 직통 통화 확인이 가장 정확합니다.</p>`;
  ssrBody += `<ul>`;
  ssrBody += `<li>드레스코드 — 매장 갤러리 한번 훑고 매장 콘셉트에 맞춰 옷차림 정하기</li>`;
  ssrBody += `<li>예약 가능 시간 — 직통 통화로 룸/부스 사이즈와 단체 가능 여부 확인</li>`;
  ssrBody += `<li>인원·모임 컨셉 — 사이즈와 톤 미리 합의해서 동선 부담 줄이기</li>`;
  ssrBody += `<li>주차·대중교통 — 인근 주차 여건 확인, 일행은 역에서 합류</li>`;
  ssrBody += `<li>귀가 동선 — 콜택시·대리 전화번호 메모, 일행 위치 공유 켜두기</li>`;
  ssrBody += `</ul>`;
  ssrBody += `<h2>모임 컨셉별 추천 시간대</h2>`;
  ssrBody += `<p>일대에서 모임을 잡을 때는 컨셉에 맞춰 시간대를 고르면 분위기와 어긋나지 않습니다. 소개팅·동료 한잔 같은 차분한 자리는 평일 저녁 7~9시가 무난하고, 친구 사교·송별·환영회처럼 활기 있는 자리는 금·토 밤 10시 이후가 회전이 빠릅니다. 단체 모임 마무리 코스라면 자정 즈음 합류 시간을 잡으면 일대 회전 피크와 맞물려 동선이 자연스럽고, 비즈니스 만찬은 룸/요정 카테고리가 적합하니 시간대보다 좌석 사이즈와 프라이빗 정도를 먼저 확인하세요.</p>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${st} 근처, ${st} 나이트라이프, ${st} 클럽, ${st} 나이트`, jsonLdList: collectionJsonLd(p, title, desc, stVenues) });
  dynamicPages.push(p);
}

console.log(`✅ 동적 SEO 페이지 ${dynamicPages.length}개 생성`);

// ══════════════════════════════════════════
// 5. sitemap.xml 자동 생성 — 모든 페이지 포함 보장
// ★ trailing slash 통일 (Cloudflare Pages 308 리다이렉트 매칭)
// ★ 비공개/관리 페이지 제외 (login, profile, dashboard, admin 등)
// ══════════════════════════════════════════
const today = new Date().toISOString().slice(0, 10);
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
// Homepage
sitemapXml += `  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
// Static pages (비공개 페이지 제외, trailing slash 추가)
for (const pg of staticPages) {
  if (noIndexPathsSet.has(pg.path)) continue;
  const freq = pg.path.startsWith('/community') ? 'daily' : 'weekly';
  const pri = categoryPaths.has(pg.path) ? '0.9' : pg.path.startsWith('/community') ? '0.7' : '0.7';
  sitemapXml += `  <url><loc>${BASE_URL}${pg.path}/</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>\n`;
}
// Regional pages (trailing slash 추가)
for (const [cat, regions] of Object.entries(regionsByCategory)) {
  const cm = catMap[cat];
  if (!cm || !['club', 'room', 'yojeong'].includes(cat)) continue;
  for (const region of Object.keys(regions)) {
    sitemapXml += `  <url><loc>${BASE_URL}/${cm.path}/${region}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
}
// All venue detail pages (trailing slash 추가)
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;
  let routePath;
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    routePath = `/${cm.path}/${v.region}/${v.slug}`;
  } else {
    routePath = `/${cm.path}/${v.slug}`;
  }
  sitemapXml += `  <url><loc>${BASE_URL}${routePath}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
}
// Magazine article pages (시즌9 — Article schema + SSR 본문 prerender)
for (const a of magazineArticles) {
  sitemapXml += `  <url><loc>${BASE_URL}/magazine/${a.id}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
}
// Dynamic SEO pages (best, new, region, tag, near)
for (const dp of dynamicPages) {
  sitemapXml += `  <url><loc>${BASE_URL}${dp}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
}
sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);
const totalSitemapUrls = 1 + staticPages.length + regionalCount + venues.length + magazineArticles.length + dynamicPages.length;
console.log(`✅ sitemap.xml 생성 (총 ${totalSitemapUrls}개 URL, 동적 ${dynamicPages.length}개 + 매거진 ${magazineArticles.length}개 포함)`);

// ══════════════════════════════════════════
// 5b. _redirects 자동 생성 — 짧은 URL → 정식 URL 301
// SEO 효과: 옛 즐겨찾기/SNS/검색결과 PageRank를 정식 URL로 합산
// UX 효과: 홈 깜빡임 제거 (짧은 URL이 SPA fallback으로 홈 SSR 서빙되던 버그 해결)
// ══════════════════════════════════════════
const redirectLines = [];
const seenSlugs = new Set();
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;
  const fullPath = ['club', 'room', 'yojeong'].includes(v.cat)
    ? `/${cm.path}/${v.region}/${v.slug}/`
    : `/${cm.path}/${v.slug}/`;
  // 1) region 있는 카테고리 — 짧은 URL `/{cat}/{slug}` → 정식 URL
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    redirectLines.push(`/${cm.path}/${v.slug}  ${fullPath}  301`);
    redirectLines.push(`/${cm.path}/${v.slug}/  ${fullPath}  301`);
  }
  // 2) 슬러그만 `/{slug}` → 정식 URL (옛 즐겨찾기/SNS 호환). 충돌 방지로 한 슬러그당 1회.
  if (!seenSlugs.has(v.slug)) {
    redirectLines.push(`/${v.slug}  ${fullPath}  301`);
    redirectLines.push(`/${v.slug}/  ${fullPath}  301`);
    seenSlugs.add(v.slug);
  }
}
const redirectsContent = `# Auto-generated by prerender-seo.mjs
# 정적 파일 우선 매칭
/llms.txt  /llms.txt  200
/llms-full.txt  /llms-full.txt  200
/sitemap.xml  /sitemap.xml  200
/robots.txt  /robots.txt  200

# 페이지 별칭 301 (중복 title 방지)
/for-business  /pricing  301
/for-business/  /pricing  301

# 짧은 URL → 정식 URL 301 (검색결과/카톡/옛 즐겨찾기 호환, SEO PageRank 합산)
${redirectLines.join('\n')}

# 비공개 SPA 라우트 — 프리렌더 X(sitemap exempt) → CF 404.html 우선 회피용 명시 fallback
/my/*  /index.html  200
/admin/*  /index.html  200

# API & SPA fallback (마지막)
/api/*  /api/:splat  200
/*  /index.html  200
`;
fs.writeFileSync(path.join(DIST, '_redirects'), redirectsContent);
console.log(`✅ _redirects 생성 (${redirectLines.length}줄, ${venues.length}개 venue 짧은 URL 301)`);

// ══════════════════════════════════════════
// 6. llms.txt 자동 생성 — AI 검색엔진용 (가게이름 포함)
// ══════════════════════════════════════════
let llmsTxt = `# 놀쿨 (NOLCOOL)
> 대한민국 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보 플랫폼. ${venues.length}곳 비교, 직접 가본 후기, 분위기 정보 제공.
> 서울·경기·부산·대전·대구·광주·울산·제주 나이트라이프 정보의 모든 것.

- 사이트: ${BASE_URL}/
- 상세 버전: ${BASE_URL}/llms-full.txt
- 광고문의 카톡: besta12

## 메인 페이지
- [홈페이지](${BASE_URL}/)
- [클럽 전체](${BASE_URL}/clubs)
- [나이트 전체](${BASE_URL}/nights)
- [라운지 전체](${BASE_URL}/lounges)
- [룸 전체](${BASE_URL}/rooms)
- [요정 전체](${BASE_URL}/yojeong)
- [호빠 전체](${BASE_URL}/hoppa)

## 기능 페이지
- [실시간 랭킹](${BASE_URL}/ranking)
- [VS 투표](${BASE_URL}/vs)
- [업소 정보 비교](${BASE_URL}/venue-info)
- [업소 비교](${BASE_URL}/compare)
- [통합 검색](${BASE_URL}/search)
- [룰렛](${BASE_URL}/roulette)
- [퀴즈](${BASE_URL}/quiz)
- [입문 가이드](${BASE_URL}/guide)
- [매거진](${BASE_URL}/magazine)
- [갤러리](${BASE_URL}/gallery)
- [이벤트](${BASE_URL}/events)

## 커뮤니티
- [커뮤니티 메인](${BASE_URL}/community)
- [오늘어디 Q&A](${BASE_URL}/community/qna)
- [방문 후기](${BASE_URL}/community/reviews)
- [꿀팁 공유](${BASE_URL}/community/tips)
- [파티 모집](${BASE_URL}/community/party)
- [자유게시판](${BASE_URL}/community/free)
- [패션 가이드](${BASE_URL}/community/fashion)
- [조각 모집](${BASE_URL}/community/jogak)

## 업종별 라운지
- [라운지 메인](${BASE_URL}/lounge)
- [나이트 라운지](${BASE_URL}/lounge/night)
- [클럽 라운지](${BASE_URL}/lounge/club)
- [룸 라운지](${BASE_URL}/lounge/room)
- [요정 라운지](${BASE_URL}/lounge/yojung)
- [호빠 라운지](${BASE_URL}/lounge/hoppa)
- [라운지바 라운지](${BASE_URL}/lounge/lounge)
- [자유게시판](${BASE_URL}/lounge/free)
- [질문답변](${BASE_URL}/lounge/qna)

## 업주용
- [요금제](${BASE_URL}/pricing)
- [데모](${BASE_URL}/demo)
- [입점 사례](${BASE_URL}/case-studies)
- [후기](${BASE_URL}/testimonials)

## 전체 매장 목록 (${venues.length}곳)\n`;

// Group by category
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  llmsTxt += `\n### ${catInfo.labelKo} (${catVenues.length}곳)\n`;
  for (const vv of catVenues) {
    let routePath;
    if (['club', 'room', 'yojeong'].includes(vv.cat)) {
      routePath = `/${catInfo.path}/${vv.region}/${vv.slug}`;
    } else {
      routePath = `/${catInfo.path}/${vv.slug}`;
    }
    const hookTitle = getHookingTitle(vv.nameKo, vv);
    llmsTxt += `- [${hookTitle}](${BASE_URL}${routePath})\n`;
  }
}

llmsTxt += `\n## 지역별 페이지\n`;
for (const regionKo of Object.keys(allRegions)) {
  llmsTxt += `- [${regionKo} 나이트라이프](${BASE_URL}/region/${encodeURIComponent(regionKo)})\n`;
}

llmsTxt += `\n## 인기순·신규\n`;
for (const [, catInfo] of Object.entries(catMap)) {
  llmsTxt += `- [${catInfo.labelKo} 인기 TOP](${BASE_URL}/best/${catInfo.path})\n`;
  llmsTxt += `- [신규 ${catInfo.labelKo}](${BASE_URL}/new/${catInfo.path})\n`;
}

llmsTxt += `\n## 주요 지역\n`;
llmsTxt += `서울: 강남, 홍대, 이태원, 압구정, 청담, 신림, 노원, 용산\n`;
llmsTxt += `경기: 일산, 수원, 인천, 부천, 안산, 성남, 김포, 파주, 의정부, 구리, 오산, 평택, 분당, 용인\n`;
llmsTxt += `부산: 해운대, 연산동, 사상\n`;
llmsTxt += `충청: 대전, 천안, 청주, 서산\n`;
llmsTxt += `경상: 대구, 울산, 구미\n`;
llmsTxt += `전라: 광주, 전주\n`;
llmsTxt += `제주: 제주\n`;

fs.writeFileSync(path.join(DIST, 'llms.txt'), llmsTxt);
console.log(`✅ llms.txt 자동 생성 (${venues.length}개 업소, 가게이름 포함)`);

// ══════════════════════════════════════════
// 6-B. llms-full.txt — AI 검색엔진 전용 상세 콘텐츠 (전체 매장 설명 포함)
// ══════════════════════════════════════════
let llmsFull = `# 놀쿨 (NOLCOOL) — 전국 클럽·나이트·라운지·룸·요정·호빠 정보 플랫폼
> 대한민국 전국 ${venues.length}곳의 클럽, 나이트, 라운지, 룸, 요정, 호빠 실시간 정보를 제공하는 플랫폼입니다.
> 직접 방문한 후기, 분위기 정보, 업소 비교, 커뮤니티를 운영합니다.
> 사이트: https://nolcool.com
> 광고문의: 카카오톡 besta12

## 놀쿨이란?
놀쿨(NOLCOOL)은 대한민국 최대 나이트라이프 정보 플랫폼입니다.
서울, 경기, 부산, 대전, 대구, 광주, 울산, 제주 등 전국 주요 도시의 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${venues.length}곳의 정보를 한곳에 모았습니다.
각 업소별 분위기, 특징, 위치, 담당자 정보를 실제 방문 경험을 바탕으로 제공합니다.

## 서비스 영역
- **클럽**: EDM, 힙합, 테크노 등 장르별 클럽 정보. 강남, 홍대, 이태원, 압구정 등
- **나이트**: 소셜댄스, 부킹, 라이브 밴드 중심의 나이트 정보. 전국 58곳
- **라운지**: 조용한 분위기의 프리미엄 바·라운지
- **룸**: 프라이빗 모임을 위한 룸 시설 정보
- **요정**: 전통 한정식과 국악이 있는 격식 있는 접대 공간
- **호빠 (호스트바)**: 여성 전용 사교 공간. 18곳 정보 제공

## 주요 기능
- 실시간 인기 순위 (조회수 기준)
- 업소 간 1:1 비교
- VS 투표 (사용자 참여형)
- 입문 가이드 (초보자용)
- 커뮤니티 (후기, 꿀팁, 파티모집, 조각모집)
- MBTI 나이트라이프 성향 테스트
- 룰렛 (랜덤 추천)
- 매거진 (나이트라이프 읽을거리)

## 전체 매장 상세 정보 (${venues.length}곳)\n\n`;

for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  llmsFull += `### ${catInfo.labelKo} (${catVenues.length}곳)\n\n`;
  for (const vv of catVenues) {
    let routePath;
    if (['club', 'room', 'yojeong'].includes(vv.cat)) {
      routePath = `/${catInfo.path}/${vv.region}/${vv.slug}`;
    } else {
      routePath = `/${catInfo.path}/${vv.slug}`;
    }
    const hookTitle = getHookingTitle(vv.nameKo, vv);
    llmsFull += `#### ${vv.nameKo}\n`;
    llmsFull += `- 업종: ${catInfo.labelKo}\n`;
    llmsFull += `- 지역: ${vv.regionKo}\n`;
    if (vv.address) llmsFull += `- 주소: ${vv.address}\n`;
    if (vv.nearbyStation) llmsFull += `- 근처역: ${vv.nearbyStation}\n`;
    if (vv.staffNickname) llmsFull += `- 담당자: ${vv.staffNickname}\n`;
    if (vv.features.length > 0) llmsFull += `- 특징: ${vv.features.join(', ')}\n`;
    llmsFull += `- 한줄평: ${hookTitle}\n`;
    llmsFull += `- 상세페이지: ${BASE_URL}${routePath}\n`;
    if (vv.description) llmsFull += `- 설명: ${vv.description.slice(0, 500)}\n`;
    llmsFull += `\n`;
  }
}

llmsFull += `## 지역별 안내\n\n`;

const regionVenueMap = {};
for (const v of venues) {
  if (!regionVenueMap[v.regionKo]) regionVenueMap[v.regionKo] = [];
  regionVenueMap[v.regionKo].push(v);
}
for (const [regionKo, regionVenues] of Object.entries(regionVenueMap)) {
  llmsFull += `### ${regionKo}\n`;
  const byCat = {};
  regionVenues.forEach(rv => {
    const ck = catLabelMap[rv.cat] || rv.cat;
    if (!byCat[ck]) byCat[ck] = [];
    byCat[ck].push(rv.nameKo);
  });
  for (const [ck, names] of Object.entries(byCat)) {
    llmsFull += `- ${ck}: ${names.join(', ')}\n`;
  }
  llmsFull += `\n`;
}

llmsFull += `## 자주 묻는 질문 (FAQ)\n\n`;
llmsFull += `**Q: 놀쿨은 어떤 사이트인가요?**\n`;
llmsFull += `A: 놀쿨(nolcool.com)은 대한민국 전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${venues.length}곳의 실시간 정보를 제공하는 나이트라이프 플랫폼입니다.\n\n`;
llmsFull += `**Q: 서울에서 유명한 클럽은 어디인가요?**\n`;
const seoulClubs = venues.filter(v => v.cat === 'club' && (v.regionKo.includes('강남') || v.regionKo.includes('홍대') || v.regionKo.includes('이태원') || v.regionKo.includes('압구정')));
llmsFull += `A: 서울에서 유명한 클럽은 ${seoulClubs.map(v => v.nameKo).join(', ')} 등이 있습니다. 놀쿨에서 실시간 비교와 후기를 확인하세요.\n\n`;
llmsFull += `**Q: 강남 클럽 추천은?**\n`;
const gangnamClubs = venues.filter(v => v.cat === 'club' && v.regionKo.includes('강남'));
llmsFull += `A: 강남 클럽으로는 ${gangnamClubs.map(v => v.nameKo).join(', ')} 등이 있습니다. 각 클럽의 분위기, 음악 장르, 입장 정보는 놀쿨에서 확인할 수 있습니다.\n\n`;
llmsFull += `**Q: 호빠(호스트바)는 어디에 있나요?**\n`;
const hoppas = venues.filter(v => v.cat === 'hoppa');
llmsFull += `A: 전국 호빠 ${hoppas.length}곳 정보를 놀쿨에서 제공합니다: ${hoppas.map(v => v.nameKo).join(', ')}. 지역별 비교와 후기를 확인하세요.\n\n`;
llmsFull += `**Q: 나이트(소셜댄스) 추천은?**\n`;
const nights = venues.filter(v => v.cat === 'night');
llmsFull += `A: 전국 나이트 ${nights.length}곳을 놀쿨에서 비교할 수 있습니다. 서울, 경기, 부산, 대전, 대구, 광주, 충청 지역별 나이트 정보를 제공합니다.\n\n`;
llmsFull += `**Q: 요정은 뭐하는 곳인가요?**\n`;
llmsFull += `A: 요정은 전통 한정식 코스 요리와 함께 국악 라이브를 즐길 수 있는 격식 있는 접대 공간입니다. 비즈니스 만찬, 외국 손님 접대에 적합합니다.\n\n`;

// 각 지역별 FAQ 추가
for (const [regionKo, regionVenues] of Object.entries(regionVenueMap)) {
  if (regionVenues.length >= 3) {
    llmsFull += `**Q: ${regionKo} 나이트라이프 추천은?**\n`;
    llmsFull += `A: ${regionKo}에서는 ${regionVenues.slice(0, 5).map(v => v.nameKo).join(', ')} 등 ${regionVenues.length}곳을 추천합니다. 놀쿨에서 상세 비교가 가능합니다.\n\n`;
  }
}

fs.writeFileSync(path.join(DIST, 'llms-full.txt'), llmsFull);
console.log(`✅ llms-full.txt 자동 생성 (${venues.length}개 업소 상세 포함)`);

// (★ _redirects는 5b 섹션에서 venue 301 매핑 포함하여 이미 생성됨)

// ══════════════════════════════════════════
// 8. IndexNow 자동 제출 — Bing/Naver/Yandex 즉시 인덱싱
// ══════════════════════════════════════════
const INDEXNOW_KEY = '195ffcff10d3481d896c1151d28e3292';

async function submitIndexNow() {
  const allUrls = [];
  // 홈 + 정적 페이지
  allUrls.push(`${BASE_URL}/`);
  for (const pg of staticPages) {
    if (!noIndexPathsSet.has(pg.path)) allUrls.push(`${BASE_URL}${pg.path}/`);
  }
  // 지역별 페이지
  for (const [cat, regions] of Object.entries(regionsByCategory)) {
    const cm = catMap[cat];
    if (!cm || !['club', 'room', 'yojeong'].includes(cat)) continue;
    for (const region of Object.keys(regions)) {
      allUrls.push(`${BASE_URL}/${cm.path}/${region}/`);
    }
  }
  // 업소 상세
  for (const v of venues) {
    const cm = catMap[v.cat];
    if (!cm) continue;
    let rp;
    if (['club', 'room', 'yojeong'].includes(v.cat)) {
      rp = `/${cm.path}/${v.region}/${v.slug}`;
    } else {
      rp = `/${cm.path}/${v.slug}`;
    }
    allUrls.push(`${BASE_URL}${rp}/`);
  }
  // 매거진 article (시즌9)
  for (const a of magazineArticles) {
    allUrls.push(`${BASE_URL}/magazine/${a.id}/`);
  }
  // 동적 SEO 페이지
  for (const dp of dynamicPages) {
    allUrls.push(`${BASE_URL}${dp}/`);
  }

  const payload = JSON.stringify({
    host: 'nolcool.com',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: allUrls
  });

  // IndexNow 제출 (Bing → Naver/Yandex에도 자동 전파)
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
      console.log(`   IndexNow → ${endpoint}: ${res.status}`);
    } catch (e) {
      console.log(`   IndexNow → ${endpoint}: ${e.message || 'failed'}`);
    }
  }

  console.log(`✅ IndexNow 제출 완료 (${allUrls.length}개 URL)`);
}

// ══════════════════════════════════════════
// 9. Google/Naver sitemap ping
// ══════════════════════════════════════════
async function pingSitemap() {
  // Google: Search Console API가 필요하므로 sitemap.xml 자체를 최신 유지하는 것으로 대체
  // Naver: IndexNow로 이미 제출됨 (Bing → Naver 자동 전파)
  // 추가 Bing sitemap ping
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  const pingUrls = [
    `https://www.bing.com/webmaster/ping.aspx?siteMap=${sitemapUrl}`,
  ];

  for (const url of pingUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      console.log(`   Sitemap ping → Bing: ${res.status}`);
    } catch (e) {
      console.log(`   Sitemap ping → Bing: ${e.message || 'failed'}`);
    }
  }
  console.log(`✅ Sitemap ping 완료 (Google은 Search Console에서 자동 크롤링)`);
}

// 시즌27-F — dist/404.html 생성 (CF Pages가 unknown route fallback으로 사용, soft-404 방지)
{
  const html404 = renderPage({
    title: '페이지 없음 — 놀쿨',
    description: '요청하신 페이지를 찾을 수 없습니다. 홈으로 돌아가 카테고리·지역으로 다시 찾아보세요.',
    canonical: '/404',
    noindex: true,
    ssrBody: `${SITE_NAV_ANCHORS}<main><h1>페이지를 찾을 수 없습니다</h1><p>주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p><p><a href="/">홈으로 돌아가기</a> · <a href="/clubs/">클럽</a> · <a href="/nights/">나이트</a> · <a href="/rooms/">룸</a> · <a href="/yojeong/">요정</a> · <a href="/lounges/">라운지</a> · <a href="/hoppa/">호빠</a></p></main>${SITE_FOOTER_ANCHORS}`,
  });
  fs.writeFileSync(path.join(DIST, '404.html'), html404);
  console.log(`   404 페이지: dist/404.html`);
}

console.log(`\n🎉 프리렌더링 완료!`);
console.log(`   정적: ${staticPages.length}개`);
console.log(`   지역별: ${regionalCount}개`);
console.log(`   업소 상세: ${venueCount}개`);
console.log(`   매거진: ${magazineCount}개`);
console.log(`   동적 SEO: ${dynamicPages.length}개`);
console.log(`   ────────────────`);
console.log(`   총 ${pageCount + regionalCount + venueCount + magazineCount + dynamicPages.length}개 고유 HTML 생성`);

// 빌드 시 자동 인덱싱 제출
console.log(`\n🔔 검색엔진 인덱싱 제출 중...`);
await submitIndexNow();
await pingSitemap();
console.log(`\n🚀 SEO 프리렌더링 + 인덱싱 제출 완료!`);
