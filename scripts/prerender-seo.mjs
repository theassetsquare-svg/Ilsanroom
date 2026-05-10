#!/usr/bin/env node
/**
 * ★ SEO 프리렌더링 스크립트
 * vite build 후 실행 → 모든 라우트에 고유 HTML 생성
 * 각 페이지별 <title>, <meta description>, og:title, og:description, canonical 개별 설정
 */
import fs from 'fs';
import path from 'path';

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
const baseHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

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
function renderPage({ title, description, canonical, ogImage, ssrBody, jsonLdList, noindex, datePublished, dateModified, keywords }) {
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
  if (ssrBody) {
    html = html.replace(
      /<div id="root"([^>]*)><\/div>/,
      `<div id="root"$1><div class="ssr-seo" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">${ssrBody}</div></div>`
    );
  }

  return html;
}

const noIndexPathsSet = new Set(['/login', '/profile', '/dashboard', '/analytics', '/billing', '/onboarding', '/launch', '/admin/venues']);

// 시즌21 — SSR 내부링크: JS 미실행 봇(Yeti/Daum)도 anchor depth 1로 카테고리 도달
function venueHref(v) {
  if (['club', 'room', 'yojeong'].includes(v.cat)) return `/${catMap[v.cat].path}/${v.region}/${v.slug}/`;
  return `/${catMap[v.cat].path}/${v.slug}/`;
}
const SITE_NAV_ANCHORS = `<nav aria-label="카테고리"><ul><li><a href="/clubs/">클럽</a></li><li><a href="/nights/">나이트</a></li><li><a href="/lounges/">라운지</a></li><li><a href="/rooms/">룸</a></li><li><a href="/yojeong/">요정</a></li><li><a href="/hoppa/">호빠</a></li><li><a href="/community/">커뮤니티</a></li><li><a href="/magazine/">매거진</a></li><li><a href="/search/">검색</a></li></ul></nav>`;
// 시즌22 — 사이트 footer SSR 내부링크 (정적 유틸/lounge/lead 페이지 reachable)
const SITE_FOOTER_ANCHORS = `<footer aria-label="사이트맵"><h2>전체 메뉴</h2><nav aria-label="사이트맵 링크"><ul><li><a href="/guide/">입문 가이드</a></li><li><a href="/safety/">안전 가이드</a></li><li><a href="/help/">자주 묻는 질문</a></li><li><a href="/venue-info/">양주·부스·룸 안내</a></li><li><a href="/events/">이벤트 일정</a></li><li><a href="/gallery/">매장 사진</a></li><li><a href="/map/">지도</a></li><li><a href="/ranking/">인기 랭킹</a></li><li><a href="/quiz/">스타일 퀴즈</a></li><li><a href="/roulette/">룰렛 추천</a></li><li><a href="/vs/">VS 매치업</a></li><li><a href="/compare/">업소 비교</a></li><li><a href="/hidden/">숨은 명소</a></li><li><a href="/welcome/">놀쿨 소개</a></li><li><a href="/login/">로그인</a></li><li><a href="/profile/">내 프로필</a></li><li><a href="/referral/">친구 초대</a></li><li><a href="/onboarding/">업소 입점</a></li><li><a href="/pricing/">요금제</a></li><li><a href="/dashboard/">매장 대시보드</a></li><li><a href="/analytics/">분석 리포트</a></li><li><a href="/billing/">결제 관리</a></li><li><a href="/launch/">오픈 체크</a></li><li><a href="/demo/">업주 데모</a></li><li><a href="/case-studies/">운영 사례</a></li><li><a href="/testimonials/">업주 인터뷰</a></li><li><a href="/status/">서비스 상태</a></li><li><a href="/privacy-promise/">프라이버시 정책</a></li><li><a href="/disclaimer/">고지 사항</a></li><li><a href="/terms/">이용 약관</a></li><li><a href="/privacy/">개인정보 처리</a></li><li><a href="/venue-terms/">업주 약관</a></li><li><a href="/lounge/">업종별 라운지</a></li><li><a href="/lounge/club/">클럽 라운지</a></li><li><a href="/lounge/night/">나이트 라운지</a></li><li><a href="/lounge/room/">룸 라운지</a></li><li><a href="/lounge/lounge/">라운지바 라운지</a></li><li><a href="/lounge/yojung/">요정 라운지</a></li><li><a href="/lounge/hoppa/">호빠 라운지</a></li><li><a href="/lounge/free/">자유 라운지</a></li><li><a href="/lounge/qna/">Q&A 라운지</a></li><li><a href="/lead/nightlife-guide/">밤문화 가이드</a></li><li><a href="/lead/quiz/">스타일 진단</a></li><li><a href="/lead/weekly-hot/">주간 핫스팟</a></li></ul></nav></footer>`;

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
    // 시즌27 — SSR anchor 전부 target="_blank" rel="noopener noreferrer" 자동 주입 (#hash·mailto·tel 제외)
    ssrBody = ssrBody.replace(/<a\s+([^>]*?)>/gi, (full, attrs) => {
      if (/target=/i.test(attrs)) return full;
      const hrefM = attrs.match(/href=["']([^"']+)["']/i);
      if (!hrefM) return full;
      const href = hrefM[1];
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return full;
      return `<a ${attrs.trim()} target="_blank" rel="noopener noreferrer">`;
    });
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
    const address = block.match(/address:\s*'([^']+)'/)?.[1];
    const nearbyStation = block.match(/nearbyStation:\s*'([^']+)'/)?.[1];
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
    if (slug && cat && region) {
      venues.push({
        slug, cat, region,
        regionKo: regionKo || '',
        nameKo: nameKo || slug,
        shortDesc: shortDesc || (desc || '').slice(0, 120),
        description: desc || '',
        staffNickname: staffNickname || '',
        staffPhone: staffPhone || '',
        address: address || '',
        nearbyStation: nearbyStation || '',
        lat: latMatch ? parseFloat(latMatch[1]) : 0,
        lng: lngMatch ? parseFloat(lngMatch[1]) : 0,
        features,
        tags,
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
  html += `<p itemprop="description">${region} ${catKo}. ${desc}</p>`;

  if (features) {
    html += `<h2>분위기·특징</h2>`;
    html += `<p>특징: ${features}. ${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 대표적인 곳이다.</p>`;
  }

  if (staff) {
    html += `<h2>담당자 안내</h2>`;
    html += `<p>${staff}${iGa(v.staffNickname)} 직접 관리하는 곳이다. 방문 전 문의하면 맞춤 안내를 받을 수 있다.</p>`;
  }

  if (v.nearbyStation) {
    html += `<h2>위치·접근성</h2>`;
    html += `<p>${escHtml(v.nearbyStation)}에서 가깝다.${v.address ? ' 주소: ' + escHtml(v.address) : ''}</p>`;
  }

  // ★ FAQ 섹션 — AI가 직접 인용할 수 있는 Q&A (dt 검색쿼리 매칭은 nameKo 유지, dd는 본문)
  html += `<section>`;
  html += `<h2>${name} 자주 묻는 질문</h2>`;
  html += `<dl>`;
  html += `<dt>${name} 어디에 있나요?</dt>`;
  html += `<dd>${region}에 위치한 ${catKo}입니다.${v.address ? ' 주소는 ' + escHtml(v.address) + '입니다.' : ''}${v.nearbyStation ? ' ' + escHtml(v.nearbyStation) + '에서 가깝습니다.' : ''}</dd>`;
  html += `<dt>${name} 영업시간은?</dt>`;
  html += `<dd>영업시간과 실시간 정보는 본 페이지에서 확인할 수 있습니다.</dd>`;
  html += `<dt>${name} 예약 방법은?</dt>`;
  html += `<dd>방문 예약은 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}</dd>`;
  html += `<dt>${region} ${catKo} 추천은?</dt>`;
  html += `<dd>${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 추천 후보입니다. 실시간 후기와 비교 정보는 카테고리 안에서 확인하세요.</dd>`;
  html += `</dl>`;
  html += `</section>`;

  // 가공된 SSR blockquote 후기 제거 (놀쿨 신뢰 규칙 + 구글 fake review 스팸 정책 회피).
  // 실제 후기는 /community/reviews 에서 회원이 직접 작성한 것만 노출.
  html += `<section>`;
  html += `<h2>${name} 방문 후기</h2>`;
  html += `<p>방문 후기는 <a href="/community/reviews" target="_blank" rel="noopener noreferrer">놀쿨 커뮤니티 후기 게시판</a>에서 회원이 직접 작성한 글만 모아두었습니다. 별점·블록쿼트 형태의 가공 후기는 게시하지 않습니다.</p>`;
  html += `</section>`;

  // ★ 방문 안내 섹션 — "가게이름 후기", "가게이름 가는법" 검색 대응
  html += `<h2>방문 안내</h2>`;
  html += `<p>처음 방문하신다면 본 페이지에서 사전 정보를 확인하세요. `;
  html += `분위기, 인기 시간대, 복장 가이드까지 미리 알 수 있습니다. `;
  if (v.nearbyStation) html += `교통편은 ${escHtml(v.nearbyStation)}이 가장 가깝습니다. `;
  html += `실제 방문 후기는 커뮤니티에서 확인 가능합니다.</p>`;

  // ★ 업종별 상세 정보 섹션 — H2에는 nameKo 미포함 (stuffing 회피, body 키워드는 H1·FAQ·총정리에서 보충)
  if (v.cat === 'night' || v.cat === 'club') {
    html += `<h2>분위기·음악</h2>`;
    html += `<p>${region}을 대표하는 ${catKo}로, ${features || '다양한 장르의 음악'}${eulReul(features || '음악')} 즐길 수 있다. `;
    html += `첫 방문자도 편하게 즐길 수 있는 분위기를 갖추고 있으며, 단골들 사이에서 "한번 오면 또 온다"는 평가를 받고 있다.</p>`;
  } else if (v.cat === 'room') {
    html += `<h2>룸 구성·양주</h2>`;
    html += `<p>${region}에서 프라이빗한 모임에 최적화된 공간이다. `;
    html += `룸은 소규모 밀담부터 대규모 단체석까지 다양하게 구성되어 있다. `;
    html += `양주 라인업은 캐주얼부터 프리미엄까지 폭넓어 비즈니스·모임·파티에 적합하다.</p>`;
  } else if (v.cat === 'hoppa') {
    html += `<h2>이용 안내</h2>`;
    html += `<p>${region}에서 여성 고객을 위한 사교 공간이다. `;
    html += `호스트 선택의 폭이 넓고, 강요 없는 편안한 분위기가 특징이다. `;
    html += `처음 방문하는 분도 부담 없이 즐길 수 있다.</p>`;
  } else if (v.cat === 'yojeong') {
    html += `<h2>코스·접대</h2>`;
    html += `<p>${region}에서 격식 있는 접대와 한정식 코스를 제공하는 전통 요정이다. `;
    html += `코스 요리는 계절 식재료를 활용하며, 국악 라이브와 함께 품격 있는 자리를 만든다. `;
    html += `비즈니스 만찬과 외국 손님 접대에 최적이다.</p>`;
  } else if (v.cat === 'lounge') {
    html += `<h2>분위기·메뉴</h2>`;
    html += `<p>${region}에서 조용하고 고급스러운 분위기의 라운지다. `;
    html += `데이트, 접대, 혼술 모든 상황에 맞는 공간을 제공한다. `;
    html += `칵테일과 양주 메뉴는 바텐더 추천으로 선택할 수 있다.</p>`;
  }

  html += `<h2>${name} 총정리</h2>`;
  html += `<p>${region} ${catKo} — 실시간 후기, 분위기, 예약 안내를 본 페이지에서 확인하세요. 비교, 순위, 방문 후기까지 한 곳에서 볼 수 있습니다. 방문 전 반드시 최신 정보를 확인하세요.</p>`;

  // ★ 관련 업소 내부 링크 — 크롤러 깊이 탐색 유도
  if (allVenues) {
    const related = allVenues.filter(vv =>
      vv.slug !== v.slug && (vv.regionKo === v.regionKo || vv.cat === v.cat)
    ).slice(0, 6);
    if (related.length > 0) {
      html += `<section><h2>${region} 주변 추천 업소</h2><ul>`;
      related.forEach(rv => {
        const rvCatKo = catLabelMap[rv.cat] || rv.cat;
        const rvCm = catMap[rv.cat];
        if (!rvCm) return;
        let rvPath;
        if (['club', 'room', 'yojeong'].includes(rv.cat)) {
          rvPath = `/${rvCm.path}/${rv.region}/${rv.slug}`;
        } else {
          rvPath = `/${rvCm.path}/${rv.slug}`;
        }
        html += `<li><a href="${rvPath}" target="_blank" rel="noopener noreferrer">${escHtml(rv.nameKo)}</a> — ${escHtml(rv.regionKo)} ${rvCatKo}</li>`;
      });
      html += `</ul></section>`;
    }
  }

  // ★ 커뮤니티 안내 — 가공 카운터(후기N·댓글N·마지막글) 제거 (놀쿨 신뢰 규칙)
  html += `<section><h2>커뮤니티</h2>`;
  html += `<p>관련 글과 질문은 <a href="/community" target="_blank" rel="noopener noreferrer">놀쿨 커뮤니티</a>에서 회원이 직접 작성한 글만 모아두었습니다. 가공된 후기 수·댓글 수·"마지막 글" 자동 카운터는 게시하지 않습니다.</p>`;
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

  // ★ 관련 키워드 — 검색엔진이 연관 검색어로 인식 (nameKo 1회 + 카테고리·지역)
  html += `<footer><p>${name}, ${region} ${catKo}, ${region} ${catKo} 추천, ${region} 밤문화</p></footer>`;
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
    const trait = venue.staffNickname
      ? `${venue.staffNickname}${iGa(venue.staffNickname)} 이끄는 ${venue.regionKo} 명소`
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
  { path: '/clubs', title: '클럽 줄 서다 입장컷 당하기 싫죠? 10년 MD가 들어갈 곳만 알려줌', desc: '줄 서서 1시간 기다렸는데 컷이면 그날 끝납니다. 10년 일한 클럽 MD가 들어갈 수 있는 곳·물·DJ 솔직하게 다 깝니다. 택시비 날리기 전에 →' },
  { path: '/nights', title: '나이트 부킹 한 번도 못 잡고 집 간 적? 10년 웨이터가 거를 곳 알려줘요', desc: '부킹 안 잡히는 나이트 가면 1차로 끝나요. 10년 짠밥 웨이터가 홀·부스·물·진행 다 풀어드립니다. 1,000+ 업소 갈 곳 vs 거를 곳 →' },
  { path: '/lounges', title: '라운지 시끄러워서 데이트 망친 적 한 번이라도? 10년 실장이 거름', desc: '분위기 보고 갔는데 어수선하면 데이트도 망합니다. 10년 본 라운지 실장이 인테리어·시그니처·만남 결까지 다 풀어드립니다. 조용히 가서 조용히 나와요 →' },
  { path: '/rooms', title: '룸 초이스 한 번이라도 후회해본 사람만 봐요. 10년 실장이 까드림', desc: '사진이랑 다르면 그 순간 분위기 끝납니다. 10년 일한 룸 실장이 초이스·양주 라인·진행 케어까지 매장별로 솔직하게. 후회하기 전에 일단 물어봐요 →' },
  { path: '/yojeong', title: '요정에서 격 떨어지면 다음은 없죠 — 20년 실장이 봐드림', desc: '사장님 모시는데 격 떨어지면 다음은 없어요. 20년 일한 요정 실장이 한정식·접대·진행 매너 한 줄로 정리합니다. 강남·일산·부산 진짜 격 있는 곳만 골라서 보여드릴게요 →' },
  { path: '/hoppa', title: '호빠 가서 사진이랑 다른 선수면 어떡해요? 10년 실장이 미리 봐줌', desc: '처음 가서 어색한 시간 30분이면 그날 끝나요. 10년 일한 호빠 실장이 외모·매너·진행 다 봐드립니다. 강남·홍대·일산 진짜 케어되는 곳만 골라서 보여드릴게요 →' },

  // Interactive pages
  { path: '/guide', title: '처음이라 긴장된다고? 이거 읽고 가면 프로다', desc: '클럽·나이트·라운지·룸·요정·호빠 6개 업종별 입문 가이드. 강남 홍대 이태원 일산 부산 드레스코드, 혼자 가도 안전한 곳, 첫방문 매너, 부킹·초이스 흐름까지 5분 정독 완성.' },
  { path: '/map', title: '지금 위치에서 가까운 곳, 지도에 다 떴다', desc: '강남 홍대 이태원 일산 부산 수원 핫스팟 인터랙티브 지도. 핀 한 번 클릭으로 전화 연결, 길찾기, 평점, 영업시간 즉시 확인. 영업 중인 업소만 실시간 자동 표시.' },
  { path: '/quiz', title: '클럽형인지 라운지형인지, 테스트 해봐', desc: '10문항 2분이면 나한테 딱 맞는 유흥 스타일 결과. 클럽·라운지·나이트·룸·요정·호빠 6가지 유형 자동 매칭. 결과별 강남 홍대 이태원 일산 추천 업소 리스트, 친구와 비교 공유, 카톡 결과 발송 가능.' },
  { path: '/roulette', title: '고민 끝, 룰렛이 대신 골라준다', desc: '오늘 밤 갈 곳 못 정했을 때 탭 한 번이면 결정. 지역·업종·예산·인원 필터 적용 후 평점 가중치 랜덤 추천. 강남 홍대 이태원 일산 부산 120곳 풀에서 선택, 다시 돌리기 무제한, 결과 카톡 공유 가능.' },
  { path: '/vs', title: '어디가 더 낫냐고? 투표로 결판내자', desc: '인기 업소 맞대결을 회원 투표로 비교합니다. 회원이 직접 매치업을 제안하고, 결과 댓글에서 선택 이유를 토론합니다. 강남·홍대·이태원·일산 클럽·나이트·라운지 어디가 진짜 분위기 좋은지 매주 갱신되는 VS 매치업 게시판.' },
  { path: '/ranking', title: '인기 랭킹 TOP 20 — 회원이 직접 투표한 카테고리별 1위', desc: '회원 직접 투표 기반 카테고리·지역별 랭킹. 강남 홍대 이태원 일산 부산 클럽·나이트·룸·요정·라운지·호빠 1위 업소를 매월 1일 시즌 초기화로 확인. 가짜 점수·등락 표시 없음.' },
  { path: '/venue-info', title: '처음 가는 사람용 — 양주·부스·룸 구성 한눈에 보기', desc: '업종별 양주 라인업(발렌타인 12·17·21년산, 조니워커 블루, 로얄살루트), 부스 4~12인 사이즈, 룸 4~30인 타입까지 정리. 강남 홍대 일산 부산 인기 업소 가이드. 가기 전에 미리 확인하고 예약하세요.' },
  { path: '/compare', title: '두 곳 놓고 따져보면 후회가 없다', desc: '분위기·후기·평점·접근성·매너 5개 항목별 두 업소 1대1 비교표. 강남 vs 홍대, 클럽 vs 라운지 등 인기 매치업 모음. 매니저 평판, 음악 장르, 드레스코드까지 한눈에. 고민 끝 선택만.' },
  { path: '/search', title: '이름만 치면 바로 나온다, 통합 검색', desc: '지역·업종·이름·분위기·예산 무엇이든 입력하면 강남 홍대 이태원 일산 부산 120곳 중 딱 맞는 곳. 자동완성, 오타 보정, 인기 검색어 추천, 한글·영문·초성 검색까지 지원하는 놀쿨 통합 검색 엔진.' },
  { path: '/magazine', title: '밤문화 읽을거리, 여기 다 모았다', desc: '강남 홍대 이태원 일산 부산 수원 지역 분석, 클럽 vs 라운지 vs 룸 업종 비교, 신규 매장 현장 리포트, 시즌별 트렌드, 단골 인터뷰까지. 가기 전에 읽으면 후회가 없어지는 놀쿨 밤문화 매거진 모음.' },

  // Community pages
  { path: '/community', title: '밤 사람들이 모이는 커뮤니티', desc: '강남 홍대 이태원 일산 부산 수원 클럽 나이트 라운지 룸 요정 호빠 후기 꿀팁 파티모집 Q&A 자유게시판 패션 조각모임 9개 게시판. 회원 익명 활동 광장.' },
  { path: '/community/qna', title: '오늘 밤 어디 가냐고? 여기서 추천받아', desc: '갈 곳 못 정한 사람들이 모여 서로 추천해주는 Q&A 게시판. 인원·예산·분위기·지역만 적으면 강남 홍대 이태원 일산 부산 단골 회원들이 즉시 답해줍니다. 실제 다녀본 사람의 솔직한 추천만 모이는 곳.' },
  { path: '/community/reviews', title: '가본 사람만 쓸 수 있다, 실제 방문 후기', desc: '별점·한 줄 평으로 보는 업소 리얼 리뷰. 광고 아닌 진짜 목소리만 모은 후기 광장. 강남 홍대 이태원 일산 부산 클럽·나이트·라운지·룸·요정·호빠 전 업종 분위기·서비스·매너 솔직 평가 정리.' },
  { path: '/community/tips', title: '고수들이 풀어놓은 밤놀이 실전 꿀팁', desc: '입장 타이밍, 자리 잡는 법, 안 당하는 법, 단골 만드는 매너까지. 경험자만 아는 실전 가이드. 강남 홍대 이태원 일산 수원 부산 지역별 꿀팁과 안전 팁 총정리.' },
  { path: '/community/party', title: '같이 갈 사람 손! 파티 멤버 모집', desc: '날짜 맞추고 인원 채우고 N빵으로 비용 분담. 혼자 가기 아까울 때 여기서 구해. 클럽 4인 N빵, 라운지 짝매칭, 룸 단체석, 출장 동행, 주말 1박2일 클럽투어까지 빠른 매칭 게시판.' },
  { path: '/community/free', title: '아무 말 대잔치, 자유게시판', desc: '잡담 질문 자랑 푸념 황당썰 추천음악 맛집 해장정보 다 OK. 익명 보장, 규칙만 지키면 자유롭게 쓸 수 있는 자유게시판. 밤문화 입문자 환영.' },
  { path: '/community/fashion', title: '운동화 신고 가도 돼? 업종별 복장 가이드', desc: '클럽·나이트·요정·라운지·룸·호빠 업종별 드레스코드 한눈 정리. 운동화·반바지 가능 여부, 시즌별 옷차림 가이드, 첫방문 안전한 룩, 강남/홍대 클럽별 입장 거절 리스크, 비즈니스 만찬용 정장 라인업까지 모두 안내.' },
  { path: '/community/jogak', title: '급하게 한 명 구한다, 조각 모집', desc: '자리 하나 남았을 때 바로 올리고 바로 구하는 조각 매칭판. 여성조각·남성조각·제휴조각·벙개까지 실시간 모집. 강남 홍대 이태원 일산 클럽·룸·라운지 자리 채우기. 100P 이상 작성 가능.' },
  { path: '/community/guidelines', title: '이것만 지키면 된다, 커뮤니티 규칙', desc: '놀쿨 커뮤니티 운영 규칙 전문. 광고·욕설·개인정보 노출·도배·불법 거래·암시 표현은 차단 대상. 신고·블락 시스템으로 익명성을 유지하면서도 깨끗한 광장을 유지합니다.' },
  { path: '/lounge', title: '업종별 라운지 — 같은 취향끼리 모이는 곳', desc: '나이트·클럽·룸·요정·호빠·라운지바 6개 업종별 전용 게시판. 같은 곳 다녀온 사람끼리 후기 공유, 추천 받기, 단골 매장 비교까지. 강남 홍대 이태원 일산 부산 회원들이 익명으로 솔직하게 대화하는 곳.' },
  { path: '/lounge/night', title: '나이트 라운지 — 다녀온 사람들의 경험담', desc: '강남 부산 수원 일산 광주 평택 나이트 다녀온 사람들의 실시간 이야기. 부킹 성공기, 부스 분위기, 매니저 평판, 양주 라인업 비교까지. 솔직 후기와 질문이 오가는 나이트 전용 게시판.' },
  { path: '/lounge/club', title: '클럽 라운지 — 다녀온 사람들의 진짜 후기', desc: '강남 홍대 이태원 일산 클럽 음악·DJ·분위기·게스트 라인업 추천 정보. EDM 힙합 테크노 장르별 추천, 입장 줄 짧은 시간대, 친구와 가는 코스 등 클럽 다니는 사람들의 전용 게시판.' },
  { path: '/lounge/room', title: '룸 라운지 — 단체석·인원별 인사이더 정보', desc: '일산 강남 수원 부산 해운대 룸 이용 후기와 추천 정보. 4인 소형부터 30인 단체석까지 인원별 룸 구성, 발렌타인 12·17년 조니워커 블루 로얄살루트 양주 라인업, 매니저 평판, 예약 팁, 단골 인사이더 공유.' },
  { path: '/lounge/yojung', title: '요정 라운지 — 정찬 코스와 비즈니스 만찬 후기', desc: '전통 요정 방문 경험과 정보 공유. 정찬 15첩 코스, 국악 라이브, 비즈니스 만찬 후기. 일산명월관·종로요정·강남요정 등 코스 구성, 드레스코드, 예약 매너까지.' },
  { path: '/lounge/hoppa', title: '호빠 라운지 — 여자 혼자 가는 사람들의 안전 후기', desc: '여성 전용 사교 공간 호빠 방문 후기·추천. 강남 종로 영등포 해운대 대구 분위기, 마담 인증, 매니저 평판, 첫방문 동선, 안전 정보, 카드 결제 가능 업소까지. 여자 혼자 가도 안전한 호빠 정보 전용 게시판.' },
  { path: '/lounge/lounge', title: '라운지바 게시판 — 칵테일·위스키 데이트 후기', desc: '강남 홍대 이태원 일산 부산 라운지바 분위기·칵테일·위스키 추천 게시판. 데이트 코스, 접대용 프라이빗 라운지, 야경 좋은 루프탑·호텔 라운지 후기. 분위기별 추천과 매너 공유.' },
  { path: '/lounge/free', title: '라운지 자유게시판 — 뭐든 자유롭게', desc: '업종 상관없이 자유롭게 대화하는 라운지 공간. 잡담, 질문, 황당썰, 후기, 추천, 푸념, 맛집·해장 정보까지 익명으로 OK. 강남 홍대 이태원 일산 부산 회원들의 광장.' },
  { path: '/lounge/qna', title: '라운지 질문답변 — 뭐든 물어보세요', desc: '밤문화 관련 궁금한 거 다 답해주는 Q&A 게시판. 첫방문 매너, 강남 홍대 이태원 일산 부산 분위기 비교, 업소 추천, 안전 팁, 드레스코드까지. 단골 회원들이 빠르게 답변해주는 실시간 질문방.' },

  // Launch & Privacy
  { path: '/welcome', title: '처음 오셨다면 — 익명 가입·후기·찜 한 번에', desc: '본명·주민번호 없이 닉네임만으로 가입. 전국 클럽·나이트·라운지·룸·요정·호빠 분위기·라인업·후기 비교. 커뮤니티에서 회원들과 정보를 나눕니다.' },
  { path: '/privacy-promise', title: '프라이버시 보호 정책 — 익명 활동 원칙', desc: '본명·주민번호는 받지 않습니다. 닉네임만 노출되고, 광고·팝업은 최소화하며, 탈퇴 시 즉시 삭제됩니다. 익명 활동을 원칙으로 운영하는 놀쿨의 프라이버시 정책을 한 페이지로 정리했습니다.' },

  // Legal & Info
  { path: '/privacy', title: '개인정보 수집·이용·파기 안내', desc: '수집 항목·보유 기간·제3자 제공 여부 투명 공개. 개인정보보호법 준수, SSL 암호화, 자동 파기 정책, 회원 탈퇴 시 즉시 삭제. 안전하고 투명한 데이터 처리 방침 전문 공시.' },
  { path: '/terms', title: '이용약관 전문 — 가입·활동·탈퇴 시 적용되는 회원 권리', desc: '놀쿨 회원 가입·이용·탈퇴 시 적용되는 회원 권리와 의무 전문 공시입니다. 서비스 운영 정책, 금지 행위, 콘텐츠 저작권, 분쟁 해결, 약관 변경 절차까지 모두 명문화했습니다. 가입 전 반드시 확인하시기 바랍니다.' },
  { path: '/disclaimer', title: '법적 고지·면책사항 — 사이트 이용 전 꼭 확인', desc: '본 사이트 정보는 참고 목적이며 법적 보증을 하지 않습니다. 업소 정보 변경 시 책임 한계, 사용자 작성 콘텐츠 면책, 외부 링크 책임 범위, 광고성 글 처리, 분쟁 시 관할 법원까지 명확히 안내드립니다.' },
  { path: '/venue-terms', title: '업소 등록 및 광고 게재 약관', desc: '업소 게재 조건·환불 정책·삭제 기준 명시. 신청 절차, 콘텐츠 검수 기준, 부적절 광고 처리, 결제·환불·해지, 분쟁 시 중재 절차까지. 사장님 등록 전 반드시 읽으세요.' },
  { path: '/safety', title: '취했을 때 이 페이지 하나면 된다', desc: '혈중알코올 계산기, 대리운전 즉시 호출, 112·119 긴급 신고, 가까운 응급실, 카카오T·24시 콜택시 호출까지 원탭 해결. 술자리 안전 가이드, 음주운전 방지, 동행자 챙기는 매너 정리한 안전 페이지.' },
  { path: '/help', title: '자주 묻는 질문, 여기 다 답해놨다', desc: '나이 제한, 복장 규정, 예약 방법, 환불 정책, 회원 등급, 포인트 사용, 카카오·네이버 로그인 문제까지 자주 묻는 질문 한 번에 해결. 검색 한 번이면 답이 나오는 놀쿨 통합 FAQ 페이지.' },

  // Business
  // /for-business → 301 to /pricing (server-level in _redirects). 중복 title 방지.
  { path: '/testimonials', title: '사장님 진짜 인터뷰 모음 — 가공 없이 발화 원문 그대로', desc: '사장님 인터뷰는 검증된 분만 게시합니다. 가공된 인용이나 과장된 수치 없이 발화 원문 그대로 공개합니다. 인터뷰 참여를 원하시는 업주분은 운영자에게 문의해주세요.' },
  { path: '/pricing', title: '요금제 안내 — 매장 규모별 단계 선택', desc: '매장 규모와 노출 필요도에 맞춰 단계별 요금제를 선택할 수 있습니다. 결제·환불·법인 세금계산서 등 자세한 사항은 약관·결제 문서에서 확인하실 수 있습니다.' },
  { path: '/demo', title: '사장님 가입 전 5분 — 대시보드 미리 만져보고 결정', desc: '가입 전에 사장님 대시보드 구성을 미리 확인해 보세요. 리뷰 관리, 사진 업로드, 영업 상태 변경, 알림 설정 등 화면을 직접 둘러볼 수 있는 데모 페이지입니다.' },
  { path: '/case-studies', title: '잘 되는 매장만 모아둔 운영 사례집 — 입소문 핫플의 공통점', desc: '매장 운영을 잘하는 곳들이 공통적으로 챙기는 항목을 정리했습니다. 검증되지 않은 매출·증가율 수치는 게시하지 않으며, 사장님이 직접 확인한 항목 위주로 공개합니다.' },

  // Lead magnets
  { path: '/lead/nightlife-guide', title: '서울경기 나이트라이프 완벽 가이드 — 현지인만 아는 진짜 핫플', desc: '서울·경기 나이트라이프 현지인 추천 가이드. 강남 홍대 이태원 일산 수원 분당 클럽·라운지·바·룸·나이트 드레스코드, 입장 골든타임, 부킹 흐름, 인사이더 팁까지 총정리.' },
  { path: '/lead/quiz', title: '3문제로 찾는 나만의 밤 — 맞춤 추천 퀴즈', desc: '3가지 질문으로 나한테 딱 맞는 서울·경기 나이트라이프 장소를 찾아드립니다. 강남 홍대 이태원 일산 수원 부산 클럽·라운지·룸·요정·호빠 취향 맞춤 추천. 결과별 추천 업소 리스트, 친구와 결과 비교 공유 가능.' },
  { path: '/lead/weekly-hot', title: '이번 주 핫플 큐레이션 — 준비 중', desc: '커뮤니티 후기와 검색 추이를 종합한 주간 핫플 큐레이션은 데이터 파이프라인이 연결되는 대로 공개됩니다. 발송 일정은 미리 약속하지 않으며, 검증된 결과만 회원에게 공유합니다.' },

  // Misc
  { path: '/status', title: '지금 서비스 상태 — 점검·장애·복구 실시간 공지', desc: '현재 서비스 상태와 예정된 점검 일정을 안내합니다. 검증된 측정값이 확보된 후에만 가동률 등 구체 수치를 게시하며, 장애·복구 이력은 시간순으로 공개합니다.' },
  { path: '/referral', title: '친구 초대하고 등급 올리기 — 매너있는 회원만 모이는 법', desc: '친구 초대 링크 공유 안내 페이지입니다. 적립·등급 정책은 운영 정책 문서를 참고하시고, 부정 가입 행위는 자동 차단되니 초대는 평소 친한 분에게만 보내주세요.' },
  { path: '/hidden', title: '검색 안 해본 사람만 모르는 곳 — 입소문 운영 숨은 업소', desc: '광고보다 입소문으로 운영되는 업소를 모았습니다. 등록 여부는 업소 협조에 따라 달라지며, 회원이 추천하실 곳이 있으면 커뮤니티 게시판으로 제보해주세요.' },
  { path: '/gallery', title: '가기 전에 분위기부터 — 매장 내부 실제 사진 갤러리', desc: '업주·회원이 등록한 매장 내부 사진을 모았습니다. 조명·룸 배치·무대 분위기·라인업까지 가기 전에 눈으로 확인하실 수 있도록 카테고리·지역별로 정리했습니다.' },
  { path: '/events', title: '이번 주 갈만한 이벤트 — DJ 게스트·시즌 파티 일정', desc: 'DJ 게스트 라인업, 시즌 이벤트, 코스튬 파티 등 업소가 직접 등록한 일정을 모았습니다. 정확한 정보는 매장 페이지에서 다시 확인해주세요. 일정은 변경될 수 있습니다.' },

  // Auth & Admin (SEO 가치 낮지만 고유 title 설정)
  { path: '/login', title: '카카오·네이버·구글 로그인', desc: 'OAuth 한 번으로 로그인. 본명·주민번호 입력 없이 닉네임만으로 활동. 찜·후기·VS 투표 등 회원 전용 기능을 사용할 수 있습니다.' },
  { path: '/profile', title: '내 찜·후기·활동 기록', desc: '찜한 업소·작성 후기·포인트 내역·등급 현황·알림 설정을 한 곳에. 닉네임만 노출되며 본명·연락처는 공개되지 않습니다.' },
  { path: '/dashboard', title: '업주 대시보드', desc: '등록 업소의 페이지뷰·전화 클릭·찜·후기 지표를 사장님 전용으로 확인. 모바일에서도 동일하게 확인할 수 있습니다.' },
  { path: '/analytics', title: '유입 경로·전환 분석 리포트', desc: '유입 경로·요일·시간대 트래픽·전화 클릭률·평점 추이를 그래프로 확인. 표시되는 값은 실측치이며 가공된 비교 수치는 게시하지 않습니다.' },
  { path: '/billing', title: '구독·결제 내역 관리', desc: '현재 요금제·결제 이력·결제수단 변경·해지를 한 페이지에서 처리. 자세한 환불 정책은 약관·결제 문서를 확인하세요.' },
  { path: '/onboarding', title: '입점 신청 안내', desc: '사업자등록증과 매장 사진을 등록하면 입점 신청이 가능합니다. 정확한 1차 정보 등록을 권장하며, 잘못된 정보는 노출에 영향을 줄 수 있습니다.' },
  { path: '/launch', title: '오픈 전 마지막 체크', desc: '대시보드 접속 전 사진·영업시간·메뉴·알림 설정·연락처 체크리스트. 정확한 1차 정보를 유지하면 검색 신뢰도에 긍정적입니다.' },
  { path: '/admin/venues', title: '매장 수정·삭제', desc: '관리자 전용 페이지로 등록된 모든 업소 일괄 관리. 업소 정보 수정·사진 교체·영업 상태 토글·리뷰 신고 처리·광고 노출 영역 변경·SEO 메타 수정·캐시 갱신까지 모든 권한 통합 제공.' },
];

// ══════════════════════════════════════════
// 2. 정적 페이지 생성 (카테고리 리스팅에는 업소 이름 SSR 포함)
// ══════════════════════════════════════════
const categoryPaths = new Set(['/clubs', '/nights', '/lounges', '/rooms', '/yojeong', '/hoppa']);
// 카테고리별 evergreen 가이드 — 업소 수가 적어도 SEO 본문 풍부하게
const CAT_GUIDE_BLURBS = {
  club: `<h2>클럽 처음 가는 사람을 위한 5분 가이드</h2><p>클럽은 EDM·힙합·테크노 등 장르별로 분위기가 완전히 다릅니다. 강남은 트렌디한 EDM 라운지가 많고, 홍대는 인디·언더그라운드가, 이태원은 힙합·라틴이 강세입니다. 입장 시간은 보통 23시~01시가 피크이고, 새벽 2시 이후가 가장 뜨겁습니다.</p><h2>클럽 드레스코드 — 운동화 ok 가능한 곳 vs 막는 곳</h2><p>대형 클럽은 운동화·반바지 입장 거부가 많고, 중소형은 캐주얼 ok입니다. 여성은 원피스·스커트 무난, 남성은 셔츠·치노바지 안전합니다. 모자·삼선 슬리퍼·찢어진 청바지는 대부분 거절됩니다.</p><h2>피크타임·자리 잡는 법</h2><p>강남·홍대·이태원 메인 클럽은 23시 이후 줄이 길어지고, 새벽 2시 전후가 가장 활기찹니다. 테이블·부스는 사전 예약하면 좋은 자리에서 시작할 수 있고, 인원수에 맞는 사이즈를 미리 골라두면 동선이 편합니다.</p>`,
  night: `<h2>나이트 처음인데 부킹 어떻게 하나요?</h2><p>나이트는 웨이터가 부킹을 잡아주는 시스템입니다. 입장 후 자리에 앉으면 담당 웨이터가 인사하고, 원하는 스타일(직장인·연상·연하 등)을 말하면 매칭해줍니다. 마음에 안 들면 거절 자유, 추가 매칭 가능합니다.</p><h2>나이트 양주·안주 라인업</h2><p>나이트 양주 라인업은 발렌타인·조니워커·로얄살루트 등 메이저 위스키가 기본이며, 부킹 자리는 양주+맥주+과일 안주 세트가 가장 흔합니다. 첫 방문 시 웨이터 추천 받는 것이 안전합니다.</p><h2>나이트 영업시간·피크타임</h2><p>대부분 21시 오픈, 03~05시 마감입니다. 부킹 활성 시간은 23~02시이고, 평일은 한산, 금토일은 만석입니다. 사전 예약하면 좋은 자리·좋은 부킹을 받을 수 있습니다.</p>`,
  lounge: `<h2>라운지바와 클럽의 차이</h2><p>라운지바는 음악이 작고 좌석 위주이며, 대화·데이트·접대 목적이 많습니다. 클럽처럼 댄스플로어 중심이 아니라 칵테일·위스키·와인을 천천히 즐기는 공간입니다. 드레스코드는 스마트 캐주얼이 무난합니다.</p><h2>라운지 추천 상황별 가이드</h2><p><strong>데이트:</strong> 야경 좋은 루프탑·창가 자리. 시그니처 칵테일과 와인 페어링 추천.<br/><strong>비즈니스 미팅:</strong> 프라이빗 룸이 있는 호텔 라운지. 사전 예약 필수.<br/><strong>혼술:</strong> 바 자리가 잘 갖춰진 위스키 라운지. 1~2시간 머물기 좋음.</p><h2>라운지 메뉴 — 칵테일·위스키·와인</h2><p>시그니처 칵테일은 바텐더 추천을 따르는 게 안전하고, 위스키는 싱글몰트·블렌디드 라인업을 미리 확인하면 좋습니다. 와인 한 병 + 치즈 플래터 조합은 데이트·접대에 두루 무난합니다.</p>`,
  room: `<h2>룸 — 인원수별 추천 사이즈</h2><p>4~6인은 소형 룸, 8~12인은 중형, 15~30인은 대형 룸이 적합합니다. 무대·노래방기기 유무, 양주 라인업, 이모님 응대 방식이 업소마다 다릅니다. 미리 통화로 인원·시간·콘셉트를 말하면 맞춤 세팅됩니다.</p><h2>룸 양주·세트 구성</h2><p>발렌타인 12·17·21년산, 조니워커 블루, 로얄살루트 등이 메인 양주 라인업입니다. 양주 + 맥주 + 안주 + 과일 세트가 일반적이며, 인원과 콘셉트에 맞춰 세팅을 조정할 수 있습니다.</p><h2>룸 예약 팁 — 평일 vs 주말</h2><p>평일은 당일 예약 가능, 금·토는 최소 2~3일 전 예약 권장입니다. 단체석은 1주일 전, 연말·송년회 시즌은 2주 전이 안전합니다. 첫 방문 시 단골 손님 소개 받으면 응대가 더 좋습니다.</p>`,
  yojeong: `<h2>요정이란 — 한정식 + 국악 + 프라이빗 룸</h2><p>요정은 일반 음식점이 아니라 전통 한정식과 국악 라이브, 프라이빗 룸이 결합된 격식 있는 공간입니다. 비즈니스 만찬, 외국 손님 접대, 회사 임원 모임에 자주 사용됩니다. 일반 룸살롱과 다르게 음식이 메인입니다.</p><h2>요정 코스 구성</h2><p>기본 한정식 코스는 보통 15~20첩으로 구성되고, 전복·송이·한우 등이 추가되는 프리미엄 코스가 있습니다. 국악 라이브 옵션과 프라이빗 룸 사이즈는 사전 협의가 필수입니다.</p><h2>요정 예약 — 사전 확인 필수</h2><p>요정은 대부분 예약제로 운영되며 당일 방문이 어렵습니다. 최소 2~3일 전 전화 예약, 인원·코스·국악 유무·룸 사이즈를 미리 정해야 합니다. 외국 손님이 동반될 경우 영어 가능 여부도 사전 확인 필수입니다.</p>`,
  hoppa: `<h2>호빠 처음인데 어떻게 가나요?</h2><p>호빠는 여성 전용 사교 공간으로, 남성 호스트와 대화·술·노래를 즐기는 곳입니다. 입장 시 마담(매니저)이 안내하고 호스트 프로필을 보여줍니다. 마음에 드는 호스트를 지목하거나 추천 받을 수 있습니다.</p><h2>호빠 세트 — 양주·안주·호스트 구성</h2><p>기본 세트는 양주 1병 + 안주 + 호스트 매칭으로 구성되고, 추가 호스트 지목과 노래방·게임이 옵션입니다. 단골이 되면 마담 인증으로 더 안정적인 세팅을 받을 수 있습니다.</p><h2>호빠 안전 팁 — 처음 가는 여성 필독</h2><p>1) 첫 방문은 친구와 함께. 2) 신뢰 가는 마담 있는 곳을 추천 받기. 3) 영업시간·세트 구성을 사전 확인. 4) 카드 결제 가능 업소가 안전. 5) 술 강요·과도한 매출 압박이 있으면 즉시 자리 이동. 6) 귀가는 콜택시·대리운전 활용.</p>`,
};
// ── 홈페이지: WebSite + Organization JSON-LD ──
// 홈 SSR 강화: H2×6 카테고리 + 각 카테고리 TOP 5 + 지역 분포
let homeSsr = `<h1>놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다</h1>`;
homeSsr += `<p>대한민국 전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${venues.length}곳의 실시간 후기·분위기·정보. 모바일에서 바로 비교하고 오늘 갈 곳을 정하세요.</p>`;
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
writePage('/', {
  title: '놀쿨 — 오늘 어디 갈지 못 정했죠? 20년 굴러본 사람이 골라드림',
  description: `오늘 어디 갈지 못 정했죠? 거를 곳 천지예요. 클럽·나이트·룸·요정·라운지·호빠 20년 본 사람이 ${venues.length}+ 업소 1줄로 정리. 주말 망치기 전에 →`,
  jsonLdList: [WEBSITE_JSONLD, ORG_JSONLD],
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
  '/community/free': () => `<h1>아무 말 대잔치, 자유게시판</h1><p>잡담, 궁금한 거, 웃긴 얘기 다 OK. 규칙만 지키면 뭐든 써.</p><h2>인기 주제</h2><ul><li>오늘 있었던 일</li><li>밤문화 입문 질문</li><li>황당했던 경험</li><li>추천하고 싶은 음악</li><li>맛집·해장 정보</li></ul><h2>자주 올라오는 글 유형</h2><ul><li>처음 부킹 받은 날 썰</li><li>매니저 이야기</li><li>동행자 관련 에피소드</li><li>강남 vs 홍대 vs 이태원 비교</li><li>단골 만든 후기</li></ul><h2>자유게시판 매너</h2><p>욕설·비방·개인정보 노출은 금지입니다. 광고성 글은 업주 인증 후 별도 게시판에 올려주세요. 같은 글 반복 도배는 차단됩니다. 그 외에는 잡담, 질문, 자랑, 푸념 모두 자유롭게 작성할 수 있고 익명이 보장됩니다.</p>`,
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
  '/quiz': () => `<h1>클럽형인지 라운지형인지, 테스트 해봐</h1><p>10문항 답하면 나한테 맞는 유흥 스타일이 나옵니다. 소요시간 2분, 결과 공유 가능. 친구들과 비교해보세요.</p><h2>퀴즈 결과 6가지 유형</h2><ul><li>클럽 마니아형 — 댄스플로어가 집</li><li>라운지 데이트형 — 조용한 칵테일파</li><li>나이트 부킹형 — 새로운 인연 찾는 사람</li><li>룸 모임형 — 친구들과 노래방 양주파</li><li>요정 정찬형 — 격식 있는 만찬 선호</li><li>호빠 단골형 — 호스트와 대화 즐김</li></ul><h2>퀴즈 항목 미리보기</h2><ul><li>주말 밤 가장 끌리는 음악은?</li><li>모임 인원수는 보통 몇 명?</li><li>드레스코드는 어디까지 신경?</li><li>목소리 큰 곳 OK vs NO?</li><li>드레스코드 신경 쓰는 편?</li></ul><h2>결과 활용 팁</h2><p>퀴즈 결과로 나온 유형에 맞춰 추천 업소 리스트가 자동 생성됩니다. 카톡으로 친구한테 공유하면 함께 갈 수 있고, 결과 페이지에서 바로 예약·찜하기 가능합니다.</p>`,
  '/roulette': () => `<h1>고민 끝, 룰렛이 대신 골라준다</h1><p>탭 한 번이면 오늘 밤 갈 곳이 정해집니다. 조건만 입력하면 룰렛이 한 곳을 골라줍니다.</p><h2>룰렛 사용 가이드</h2><ul><li>지역 선택 — 강남/홍대/이태원/일산 등</li><li>업종 선택 — 클럽/라운지/룸/호빠 등</li><li>콘셉트 — 라이브/EDM/정찬/사교</li><li>인원수 — 1인/2~3인/4~6인/단체</li><li>분위기 — 활기참/조용함/럭셔리</li></ul><h2>이런 상황에 추천</h2><ul><li>오늘 어디 갈지 정하기 어려울 때</li><li>평소 안 가본 새로운 업종 시도</li><li>4인 모임 장소 빠르게 결정</li><li>데이트 코스 후보 좁히기</li><li>고민 시간 줄이고 바로 출발</li></ul><h2>룰렛 동작 방식</h2><p>입력한 조건에 맞는 업소 중에서 무작위로 한 곳을 추천합니다. 다시 돌리기는 무제한 가능하며, 추천 결과 페이지에서 바로 업소 상세로 이동할 수 있습니다.</p>`,
  '/vs': () => `<h1>어디가 더 낫냐고? 투표로 결판내자</h1><p>업소 두 곳을 나란히 놓고 한 표 던지면 결과를 바로 확인할 수 있습니다. 회원이 직접 만든 매치업으로 토론을 이어가세요.</p><h2>VS 매치업 종류</h2><ul><li>같은 지역 같은 업종 비교</li><li>지역 간 대표 업소 비교</li><li>업종 간 콘셉트 비교 (예: 라운지 vs 룸)</li></ul><h2>VS 투표 참여 방법</h2><ul><li>투표는 회원만 가능, 1매치당 1표</li><li>회원이 매치업 직접 제안 가능</li><li>마감 후 결과 페이지로 전환</li><li>댓글로 선택 이유 공유</li></ul><h2>VS 결과 활용</h2><p>결과 댓글에서 왜 그곳을 선택했는지 토론이 이어집니다. 실제 방문을 고민하는 사람들이 가장 많이 참고하는 페이지 중 하나이며, 회원 의견을 통해 분위기·후기·접근성을 객관적으로 비교할 수 있습니다.</p>`,
  '/login': () => `<h1>카카오 한 번에 로그인</h1><p>가입하면 후기 작성, 찜하기, 1줄 글쓰기, VS 투표 전부 가능합니다. 카카오·네이버·구글 OAuth로 탭 한 번이면 됩니다.</p><h2>로그인하면 뭐가 달라지나</h2><ul><li>1줄 글쓰기 — 한 줄로 다녀온 곳 자랑</li><li>찜하기 — 가고 싶은 곳 모아두기</li><li>후기 작성</li><li>VS 투표 참여</li><li>퀴즈·룰렛 결과 저장</li></ul><h2>가입 안내</h2><ul><li>가입은 무료, 본명·주민번호 입력 없음</li><li>닉네임만 정하면 끝</li><li>탈퇴 1클릭 가능</li></ul><h2>개인정보 보호</h2><p>닉네임만 공개되고 본명·연락처는 공개되지 않습니다. 채팅·댓글에서도 익명이 보장되며, 탈퇴 시 모든 데이터가 즉시 삭제됩니다.</p>`,
  '/guide': () => `<h1>처음이라 긴장된다고? 이거 읽고 가면 프로다</h1><p>드레스코드, 분위기, 혼자 가도 되는지까지. 업종별 입문 핵심만 정리했습니다. 5분이면 다 읽을 수 있습니다.</p><h2>업종별 입문 가이드</h2><ul><li>클럽 — 입장 시간, 드레스코드, 부킹</li><li>나이트 — 부스 잡는 법, 양주 라인업</li><li>라운지 — 칵테일 추천, 데이트 코스</li><li>룸 — 인원별 사이즈, 양주 구성</li><li>요정 — 한정식 코스, 예약 필수</li><li>호빠 — 첫 방문, 안전 매너</li></ul><h2>상황별 추천 코스</h2><ul><li>가벼운 한 잔 — 라운지바 칵테일</li><li>댄스플로어 입문 — 클럽 입장 + 한 잔</li><li>4인 모임 — 룸 양주 1병 N빵</li><li>여성 사교 — 호빠 기본 세트</li><li>비즈니스 만찬 — 요정 정찬 + 룸</li></ul><h2>처음 가는 사람을 위한 5계명</h2><p>1) 평일 저녁이 가장 안전합니다. 2) 첫 잔은 천천히 마시고 분위기 파악하세요. 3) 신용카드 결제 가능한 곳이 안전합니다. 4) 일행과 연락 자주 하고 위치 공유 켜두세요. 5) 술 강요·과도한 매출 압박이 있으면 즉시 자리 이동하세요.</p>`,
  '/map': () => `<h1>지금 위치에서 가까운 곳, 지도에서 확인</h1><p>핀 하나 누르면 업소 상세·전화·길찾기로 바로 이동합니다.</p><h2>지도에서 확인 가능한 정보</h2><ul><li>업소명·주소·전화번호</li><li>영업시간 안내</li><li>대표 사진</li><li>업종과 분위기 키워드</li><li>주차 가능 여부</li></ul><h2>지역별 분포</h2><ul><li>서울 — 강남/홍대/이태원/압구정</li><li>경기 — 일산/수원/성남/파주</li><li>광역시 — 부산/대구/광주/대전/인천/울산</li></ul><h2>지도 사용 팁</h2><p>줌인 하면 골목 단위로 표시되고, 클러스터 클릭하면 해당 영역 업소 리스트가 펼쳐집니다. 핀을 눌러 업소 상세 페이지로 이동하면 사진·후기·라인업을 확인할 수 있습니다.</p>`,
  '/search': () => `<h1>이름만 치면 바로 나온다, 통합 검색</h1><p>지역·업종·업소명 아무거나 입력하면 등록된 업소 중에서 일치하는 곳을 찾아드립니다.</p><h2>검색 가능 항목</h2><ul><li>업소명 — "레이스" "찬스돔" 등</li><li>지역명 — "강남" "홍대" "일산"</li><li>업종 — "클럽" "룸" "호빠"</li><li>분위기 — "조용한" "단체" "데이트"</li><li>콘셉트 — "라이브" "EDM" "정찬"</li></ul><h2>검색 잘 하는 팁</h2><ul><li>지역+업종 조합이 정확도 높음</li><li>최근 검색 기록 저장</li><li>필터로 추가 좁히기</li></ul><h2>검색 결과 활용</h2><p>검색 결과에서 업소 카드를 누르면 상세 페이지로 이동합니다. 지역+업종+인원 키워드 조합이 결과를 좁히는 데 가장 효과적이며, 결과 화면에서 추가 필터를 적용해 분위기·콘셉트로 다시 정렬할 수 있습니다.</p>`,
  '/profile': () => `<h1>내 찜 목록·후기·활동 기록 모아보기</h1><p>내가 찜한 업소, 작성한 후기, 포인트 내역을 한 곳에 모았습니다.</p><h2>프로필 메뉴</h2><ul><li>찜 목록 — 가고 싶은 곳 모음</li><li>내 후기 — 작성한 후기 관리</li><li>포인트 내역 — 적립·사용 기록</li><li>등급 현황</li><li>알림 설정 — 새 글·답글 알림</li></ul><h2>활동 안내</h2><p>찜·후기·VS 투표·퀴즈 등 활동에 따라 포인트가 적립되며, 자세한 적립 기준과 등급 정책은 운영 정책 페이지에서 확인하세요. 닉네임만 노출되고 본명·연락처는 공개되지 않습니다.</p>`,
  '/dashboard': () => `<h1>내 매장 현황판</h1><p>등록 업소의 페이지뷰·전화 클릭·찜·후기 지표를 사장님 전용으로 확인할 수 있는 페이지입니다.</p><h2>대시보드 주요 지표</h2><ul><li>페이지뷰</li><li>전화번호 클릭 수</li><li>찜하기 추가 수</li><li>후기 작성 수</li><li>유입 지역 분포</li></ul><h2>매장 운영 인사이트</h2><ul><li>요일별 방문자 추이</li><li>시간대별 클릭 분포</li><li>리뷰 평점 추이</li></ul><h2>대시보드 활용 팁</h2><p>지표가 정체되면 사진·메뉴를 업데이트해보세요. 부정 후기에는 가능한 한 빠르게 답변할수록 좋습니다. 데이터는 모바일에서도 동일하게 확인할 수 있습니다.</p>`,
  '/billing': () => `<h1>구독·결제 내역 관리</h1><p>현재 요금제, 결제 이력, 변경·해지를 이 페이지에서 처리할 수 있습니다.</p><h2>관리 가능한 항목</h2><ul><li>현재 요금제 확인</li><li>결제 이력 조회</li><li>결제수단 변경</li><li>요금제 업/다운그레이드</li><li>해지 요청</li></ul><h2>결제 방법</h2><ul><li>카드 자동 결제</li><li>계좌이체</li><li>법인은 세금계산서 발행</li></ul><h2>해지·환불 안내</h2><p>해지는 페이지 내 버튼으로 처리되며, 자세한 환불 정책과 세금계산서 발행 일정은 운영 정책 문서를 확인하세요.</p>`,
  '/onboarding': () => `<h1>입점 신청 안내</h1><p>상호명·사진·연락처만 넣으면 등록 가능합니다.</p><h2>입점 신청 절차</h2><ul><li>1단계 — 사업자등록증 업로드</li><li>2단계 — 매장 사진 3장 이상</li><li>3단계 — 영업시간·연락처 입력</li><li>4단계 — 메뉴·양주 라인업 등록</li><li>5단계 — 노출 영역 선택</li></ul><h2>입점 후 추천 작업</h2><ul><li>리뷰 응대 알림 설정</li><li>대시보드 접속 확인</li><li>요금제 선택</li><li>사진·메뉴 보강</li></ul><h2>등록 시 유의사항</h2><p>사진은 가급적 최근 1년 내 촬영본을 사용하시고, 영업시간·연락처는 정확하게 기입해주세요. 잘못된 정보는 노출에 부정적인 영향을 줄 수 있습니다.</p>`,
  '/admin/venues': () => `<h1>매장 수정·삭제</h1><p>관리자 전용 페이지입니다. 등록된 업소를 바로 수정하거나 삭제할 수 있습니다.</p><h2>관리 기능</h2><ul><li>업소 정보 일괄 수정</li><li>사진 추가·교체</li><li>영업 상태 토글</li><li>리뷰 신고 처리</li><li>광고 노출 영역 변경</li></ul>`,
  '/launch': () => `<h1>오픈 전 마지막 체크</h1><p>대시보드 접속 전 확인할 항목 리스트. 하나씩 체크하면 됩니다.</p><h2>오픈 전 체크리스트</h2><ul><li>사진 3장 이상 업로드 완료</li><li>영업시간 정확히 등록</li><li>대표 메뉴·양주 라인업 등록</li><li>알림 받을 휴대폰 번호 확인</li><li>요금제 선택</li></ul><h2>오픈 후 권장 행동</h2><p>사진·정보 누락 없이 등록하고, 후기 응대를 꾸준히 하는 것이 노출에 도움됩니다. 정확한 1차 정보(영업시간·연락처·메뉴)를 유지하면 검색 신뢰도에 긍정적입니다.</p>`,
  '/analytics': () => `<h1>유입 경로·전환 분석 리포트</h1><p>어디서 들어왔고, 뭘 눌렀고, 어떤 후기가 작성됐는지 그래프로 확인하세요.</p><h2>리포트 항목</h2><ul><li>유입 경로 분석 (검색/직접/SNS)</li><li>지역별 방문자 분포</li><li>요일·시간대별 트래픽</li><li>전화 클릭률 (CTR)</li><li>리뷰 평점 추이</li></ul><h2>지표 해석 안내</h2><ul><li>페이지뷰 — 일정 기간 노출 횟수</li><li>전화 클릭 — 실제 행동 전환 신호</li><li>찜·후기 — 관심도와 충성도 신호</li></ul><h2>리포트 활용 팁</h2><p>주간 리포트는 정해진 주기로 갱신됩니다. 클릭률이 낮으면 사진·헤드라인 교체를 시도해보세요. 가공·과장된 비교 수치는 표시하지 않으며, 표시되는 값은 실측치입니다.</p>`,
  '/safety': () => `<h1>취했을 때 이 페이지 하나면 된다</h1><p>혈중알코올 계산, 대리운전 호출, 긴급 신고까지 원탭으로 해결하는 안전 가이드.</p><h2>긴급 상황별 대응</h2><ul><li>술자리에서 만취 — 대리운전 즉시 호출</li><li>일행 실종 — 위치 공유 확인</li><li>강요·괴롭힘 — 112 긴급 신고</li><li>다툼 발생 — 매장 매니저 호출</li><li>지갑·휴대폰 분실 — 매장 CCTV 확인 요청</li></ul><h2>안전 귀가 체크리스트</h2><ul><li>대리운전 또는 콜택시 이용</li><li>일행과 연락 유지</li><li>위치 공유 ON</li><li>술 마신 후 운전 절대 금지</li><li>혼자 인적 드문 곳 피하기</li></ul><h2>혈중알코올 계산 가이드</h2><p>소주 한 병(360ml, 17.5도) 기준 체중 70kg 남성은 약 0.08% 도달, 면허취소 수준입니다. 술 깨는 시간은 시간당 0.015% 정도이므로 한 병 마시면 5~6시간 후에야 면허 가능 수준이 됩니다. 안전을 위해 마신 다음날 오전까지도 운전을 피하세요.</p>`,
  '/help': () => `<h1>자주 묻는 질문</h1><p>나이 제한, 복장 규정, 첫 방문 매너 궁금증을 모았습니다.</p><h2>일반 이용 FAQ</h2><ul><li>나이 제한이 있나요? — 만 19세 이상</li><li>혼자 가도 되나요? — 업종에 따라 다름</li><li>예약은 필수인가요? — 룸·요정은 권장</li><li>드레스코드는? — 업종별 가이드 참고</li><li>주차 가능한가요? — 업소 페이지 확인</li></ul><h2>회원 FAQ</h2><ul><li>가입 비용 있나요? — 무료</li><li>탈퇴는 어떻게? — 프로필에서 1클릭</li><li>닉네임 변경 가능한가요? — 운영 정책 참고</li><li>비밀번호 분실 시? — OAuth 재로그인</li></ul><h2>업주 FAQ</h2><p>입점 신청은 onboarding 페이지에서 가능하며, 사업자등록증과 매장 사진 3장 이상이 필요합니다. 요금제 비교는 pricing 페이지에서 확인하세요. 가공된 효과 수치는 안내하지 않으며, 자기 매장의 실측 지표는 대시보드에서 확인 가능합니다.</p>`,
  '/compare': () => `<h1>두 곳 놓고 항목별로 비교</h1><p>분위기·후기·접근성을 항목별 비교표로 확인할 수 있습니다.</p><h2>비교 가능한 항목</h2><ul><li>분위기·콘셉트</li><li>양주 라인업</li><li>후기 평점·개수</li><li>분위기 키워드</li><li>인기 시간대</li><li>주차·접근성</li></ul><h2>비교 활용 시나리오</h2><ul><li>같은 지역 같은 업종 후보 좁히기</li><li>지역 간 대표 업소 비교</li><li>업종 간 콘셉트 비교 (예: 라운지 vs 룸)</li></ul><h2>비교표 사용 팁</h2><p>두 업소를 나란히 펼쳐서 항목별로 직접 확인할 수 있습니다. 후기 키워드를 통해 강점·약점을 파악하면 자기 모임 성격에 맞는 곳을 고르기 쉽습니다. VS 투표 페이지의 회원 선호도와 함께 보면 더 객관적입니다.</p>`,
  '/welcome': () => `<h1>놀쿨에 오신 것을 환영합니다</h1><p>유흥 정보를 안전하게 비교하고 커뮤니티에서 정보를 나누는 가이드 플랫폼입니다. 가입은 무료이며 본명·주민번호 입력 없이 닉네임만 정하면 끝.</p><h2>플랫폼에서 할 수 있는 일</h2><ul><li>업소 분위기·라인업·후기 비교</li><li>커뮤니티에서 정보 교류</li><li>VS 투표·룰렛·퀴즈로 결정 도움</li><li>찜하기로 가고 싶은 곳 모으기</li></ul><h2>가입 안내</h2><p>카카오·네이버·구글 OAuth로 빠르게 가입할 수 있습니다. 본명·주민번호는 받지 않고 닉네임만 노출됩니다. 탈퇴는 1클릭으로 처리됩니다.</p><h2>플랫폼 소개</h2><p>전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 업소의 분위기·라인업·후기를 비교하고, 커뮤니티에서 회원들과 정보를 나눕니다. 매월 콘텐츠가 갱신됩니다.</p>`,
  '/privacy-promise': () => `<h1>프라이버시 보호 정책</h1><p>유흥 정보를 다루는 플랫폼이라 더 엄격하게 익명성·개인정보 보호 원칙을 운영합니다.</p><h2>본명·주민번호 비수집</h2><p>가입 시 본명·주민번호·생년월일을 받지 않습니다. 카카오/네이버/구글 OAuth는 사용자 식별 토큰만 사용하며, 닉네임만으로 활동합니다.</p><h2>익명 활동</h2><p>댓글·후기·채팅에서 닉네임만 표시되며 본명은 노출되지 않습니다.</p><h2>광고·팝업 최소화</h2><p>강압적인 가입 유도 팝업과 외부 침투형 배너를 최소화하여 후기·정보 중심으로 화면을 구성합니다.</p><h2>탈퇴·삭제</h2><p>탈퇴는 1클릭으로 처리되며, 즉시 데이터 삭제 절차가 실행됩니다. 자세한 보유 기간·삭제 정책은 운영 문서를 참고하세요.</p><h2>변경 고지</h2><p>본 정책의 중대한 변경은 사전 고지 후에만 적용됩니다. 시행 일자와 변경 사항은 사이트 내 공지에 안내됩니다.</p>`,
  '/venue-info': () => `<h1>양주·부스·룸 한눈에 보기</h1><p>업종별 양주 라인업, 부스 구성, 룸 타입까지. 가기 전에 미리 확인하세요.</p><h2>업종별 핵심 정보</h2><ul><li>나이트 — 부스 + 룸 둘 다 보유</li><li>클럽 — VIP 부스 위주</li><li>룸 — 인원별 룸 사이즈</li><li>요정 — 프라이빗 룸 + 한정식</li><li>호빠 — 룸별 호스트 배정</li></ul><h2>양주 라인업 표준</h2><ul><li>발렌타인 12·17·21년산</li><li>조니워커 블랙·그린·블루</li><li>로얄살루트 21·25년</li><li>맥캘란 12·18년</li><li>국내산 양주 (앱솔루트, 잭다니엘)</li></ul><h2>부스·룸 사이즈 가이드</h2><p>4인 룸은 노래방기기 + 소파 + 양주 1병이 표준이고, 8인 룸은 무대 + 대형 소파 + 양주 2병 이상이 일반적입니다. 부스는 클럽·나이트의 좌석 단위로 4~6인 기준이 많고, VIP 부스는 8~12인까지 수용합니다. 인원에 맞는 사이즈로 예약해야 동선이 편합니다.</p>`,
  '/magazine': () => {
    const articleLis = _earlyMagazineList.map(a => `<li><a href="/magazine/${a.id}/">${escHtml(a.title)}</a></li>`).join('');
    return `<h1>밤문화 매거진</h1><p>지역 분석, 업종 비교, 현장 리포트 등 가기 전에 읽으면 도움 되는 글을 모았습니다.</p><h2>최신 매거진 글 ${_earlyMagazineList.length}편</h2><ul>${articleLis}</ul><h2>매거진 카테고리</h2><ul><li>지역 분석 — 강남/홍대/이태원 등</li><li>업종 비교 — 클럽 vs 라운지 등</li><li>현장 리포트 — 신규 오픈 매장</li><li>인터뷰 — 업주·매니저 이야기</li><li>트렌드 — 최신 음악·시즌 이벤트</li></ul><h2>매거진 이용 안내</h2><p>새 글이 등록되면 회원 알림 설정에 따라 안내됩니다. 좋아요·댓글이 활발한 글은 홈 영역에 노출될 수 있습니다.</p>`;
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
    catVenues.forEach(vv => { ssrBody += `<li><a href="${venueHref(vv)}">${escHtml(vv.nameKo)}</a> — ${escHtml(vv.regionKo)} ${catKo}</li>`; });
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
      ssrBody += `<h3><a href="${regionHref}">${escHtml(rg)} ${catKo}</a></h3>`;
      ssrBody += `<p>${escHtml(rg)}에서 인기 있는 ${catKo}: ${names.map(n => escHtml(n)).join(', ')}. 실시간 후기와 비교는 각 업소 페이지에서 확인하세요.</p>`;
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
      allRegionsForCat.forEach(rk => { ssrBody += `<li><a href="/region/${encodeURIComponent(rk)}/">${escHtml(rk)} 밤문화</a></li>`; });
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
    // ★ FAQPage JSON-LD — 카테고리 리스팅 페이지용
    const topNames = catVenues.slice(0, 5).map(vv => vv.nameKo).join(', ');
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: `${catKo} 추천은?`, acceptedAnswer: { '@type': 'Answer', text: `전국에서 인기 있는 ${catKo}는 ${topNames} 등 ${catVenues.length}곳이 있습니다. 놀쿨(nolcool.com)에서 비교해보세요.` } },
        { '@type': 'Question', name: `${catKo} 몇 곳 있나요?`, acceptedAnswer: { '@type': 'Answer', text: `놀쿨에 등록된 ${catKo}는 전국 ${catVenues.length}곳입니다.` } },
        { '@type': 'Question', name: `${catKo} 처음인데 어떻게 가나요?`, acceptedAnswer: { '@type': 'Answer', text: `놀쿨 입문 가이드(nolcool.com/guide)에서 ${catKo} 첫 방문 팁을 확인하세요. 드레스코드, 예산, 분위기까지 정리되어 있습니다.` } },
      ]
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
  writePage(pg.path, { title: pg.title, description: pg.desc, ssrBody, jsonLdList: jsonLdList.length > 0 ? jsonLdList : undefined });
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

let regionalCount = 0;
for (const [cat, regions] of Object.entries(regionsByCategory)) {
  const cm = catMap[cat];
  if (!cm) continue;

  // clubs/:region, rooms/:region, yojeong/:region
  if (['club', 'room', 'yojeong'].includes(cat)) {
    for (const [region, regionKo] of Object.entries(regions)) {
      const regionVenues = venues.filter(vv => vv.cat === cat && vv.region === region);
      let title, desc;
      const topVenue = regionVenues[0];
      const topName = topVenue ? topVenue.nameKo : '';
      const allNames = regionVenues.slice(0, 3).map(vv => vv.nameKo).join(', ');
      if (cat === 'club') {
        title = `${regionKo} 클럽 ${regionVenues.length}곳 — 오늘 밤 갈 곳 여기서 고른다`;
        desc = `${regionKo} 클럽 ${regionVenues.length}곳 실시간 비교. ${allNames} 등 분위기·드레스코드·영업시간·후기·게스트 라인업·부킹 문화·첫방문 매너까지 한눈에 확인하고 골라보세요. EDM·힙합·테크노 ${regionKo} 인기 핫스팟 정리.`;
      } else if (cat === 'room') {
        title = `${regionKo} 룸 ${regionVenues.length}곳 — 인원수 말하면 딱 맞게 세팅`;
        desc = `${regionKo} 프라이빗 룸 ${regionVenues.length}곳 비교. ${allNames} 등 4인 소형부터 30인 단체석까지 인원별 사이즈, 발렌타인·조니워커·로얄살루트 양주 라인업, 룸 구성, 예약 팁까지 모임 전 필수 체크.`;
      } else {
        title = `${regionKo} 요정 ${regionVenues.length}곳 — 격이 다른 만찬의 시작`;
        desc = `${regionKo} 전통 한정식 요정 ${regionVenues.length}곳. ${allNames} 등 정찬 15첩 코스·국악 라이브·프라이빗 룸 비교. 비즈니스 만찬 외국 손님 접대 장소, 코스 구성, 예약·드레스코드 매너 가이드까지.`;
      }
      // SSR: 해당 지역 업소 이름 + 상세 설명 전부 포함
      let regSsr = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
      regSsr += `<h2>${escHtml(regionKo)} ${catLabelMap[cat]} ${regionVenues.length}곳</h2><ul>`;
      regionVenues.forEach(vv => {
        regSsr += `<li><a href="${venueHref(vv)}"><strong>${escHtml(vv.nameKo)}</strong></a> — ${escHtml(vv.shortDesc.slice(0, 80))}</li>`;
      });
      regSsr += `</ul>`;
      // ★ AI 인용용 FAQ
      regSsr += `<section><h2>${escHtml(regionKo)} ${catLabelMap[cat]} 자주 묻는 질문</h2>`;
      regSsr += `<dl>`;
      regSsr += `<dt>${escHtml(regionKo)} ${catLabelMap[cat]} 추천은?</dt>`;
      regSsr += `<dd>${escHtml(regionKo)}에서 인기 있는 ${catLabelMap[cat]}은 ${regionVenues.map(vv => escHtml(vv.nameKo)).join(', ')}입니다. 놀쿨(nolcool.com)에서 비교해보세요.</dd>`;
      regSsr += `<dt>${escHtml(regionKo)} ${catLabelMap[cat]} 몇 곳 있나요?</dt>`;
      regSsr += `<dd>${escHtml(regionKo)}에는 ${regionVenues.length}곳의 ${catLabelMap[cat]}${iGa(catLabelMap[cat])} 있습��다.</dd>`;
      regSsr += `</dl></section>`;

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

let venueCount = 0;
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;

  const hookTitle = getHookingTitle(v.nameKo, v);
  // meta description: shortDesc 보충 → "가게이름 — 설명" 형태 150자
  let descBase = v.shortDesc || '';
  if (descBase.length < 80 && v.description) {
    const sentences = v.description.split(/[.!?]\s*/).filter(s => s.length > 10);
    for (const s of sentences) {
      if (descBase.length >= 120) break;
      if (descBase.includes(s.slice(0, 15))) continue;
      descBase = descBase ? `${descBase}. ${s}` : s;
    }
  }
  if (!descBase || descBase.length < 30) descBase = v.description.slice(0, 130);
  const desc = truncateDesc(`${v.nameKo} — ${descBase}`, 150);

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
    name: v.nameKo,
    description: v.description.slice(0, 300),
    address: { '@type': 'PostalAddress', streetAddress: v.address || `${v.regionKo} ${v.nameKo}`, addressLocality: v.regionKo, addressCountry: 'KR' },
    url: `${BASE_URL}${routePath}`,
    image: getVenueOgImage(v.slug),
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

  // BreadcrumbList: 홈 > 카테고리 > 지역(있으면) > 업소
  const breadcrumbItems = [
    { name: '놀쿨', url: BASE_URL },
    { name: `${catLabelMap[v.cat]}`, url: `${BASE_URL}/${cm.path}` },
  ];
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    breadcrumbItems.push({ name: v.regionKo, url: `${BASE_URL}/${cm.path}/${v.region}` });
  }
  breadcrumbItems.push({ name: v.nameKo, url: `${BASE_URL}${routePath}` });
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

  const venueKeywords = [v.nameKo, `${v.regionKo} ${catLabelMap[v.cat]}`, `${v.nameKo} 후기`, `${v.nameKo} 예약`, `${v.regionKo} ${catLabelMap[v.cat]} 추천`, `${v.regionKo} 밤문화`].join(', ');
  writePage(routePath, {
    title: hookTitle,
    description: desc,
    ogImage: getVenueOgImage(v.slug),
    ssrBody: generateVenueSsrBody(v, venues),
    jsonLdList: [venueJsonLd, faqJsonLd, breadcrumbJsonLd],
    datePublished,
    dateModified,
    keywords: venueKeywords,
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
  const ssrBody = `<article>
<h1>${escHtml(a.title)}</h1>
<p><strong>${escHtml(a.tag)}</strong> · <time datetime="${escHtml(a.date)}">${escHtml(a.date)}</time></p>
${a.content}
<p><a href="${BASE_URL}/magazine" target="_blank" rel="noopener noreferrer">← 매거진 전체 보기</a></p>
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
    keywords: `${a.title}, ${a.tag}, 밤문화 매거진, 놀쿨 매거진, 밤문화 ${a.tag}`,
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
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  const p = `/best/${catInfo.path}`;
  const title = `${catInfo.labelKo} 인기 TOP ${catVenues.length} — 회원들이 가장 많이 찾는 핫스팟 랭킹`;
  const topNames = catVenues.slice(0, 3).map(vv => vv.nameKo).join(', ');
  const desc = `전국 ${catInfo.labelKo} TOP ${catVenues.length}곳 비교 가이드 — ${topNames} 등 인기 ${catInfo.labelKo} 분위기, 매니저 평판, 드레스코드, 전화번호, 예약 팁까지 정리. 매일 자동 갱신되는 ${catInfo.labelKo} 추천 리스트.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>${escHtml(catInfo.labelKo)} 인기 TOP ${catVenues.length} 랭킹</h2>`;
  ssrBody += `<ol>`;
  catVenues.forEach((vv, idx) => { ssrBody += `<li>${idx + 1}. <a href="${venueHref(vv)}">${escHtml(vv.nameKo)}</a> — ${escHtml(vv.regionKo)} ${catInfo.labelKo}</li>`; });
  ssrBody += `</ol>`;
  ssrBody += `<h2>${escHtml(catInfo.labelKo)} 처음 가는 분 체크 포인트</h2>`;
  ssrBody += `<p>${escHtml(catInfo.labelKo)} 처음이면 분위기·매니저 응대·드레스코드·예약 가능 시간을 먼저 확인하세요. 같은 ${catInfo.labelKo}라도 지역마다 손님 연령대와 음악 톤이 다릅니다. 위 랭킹은 회원들이 가장 많이 찾고 다시 방문하는 곳 순서로, 각 업소 상세 페이지에서 룸 구성·양주 라인업·실장 코멘트까지 비교해서 본인 스타일에 맞는 곳을 고르는 게 좋습니다.</p>`;
  ssrBody += `<h2>${escHtml(catInfo.labelKo)} 자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>${escHtml(catInfo.labelKo)} 어디가 제일 인기 있나요?</dt>`;
  ssrBody += `<dd>현재 회원 검색·재방문 기준 TOP은 ${escHtml(topNames)} 입니다. 지역별로 다르니 가까운 곳부터 확인하세요.</dd>`;
  ssrBody += `<dt>${escHtml(catInfo.labelKo)} 예약은 어떻게 하나요?</dt>`;
  ssrBody += `<dd>각 업소 상세 페이지에 직통 번호가 있고, 평일 저녁이면 당일 통화로도 가능합니다. 주말은 미리 확인하세요.</dd></dl>`;
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
  const desc = `최근 새로 오픈한 ${catInfo.labelKo} ${catVenues.length}곳 신규 입점 리스트와 첫방문 가이드. ${newNames} 등 강남 홍대 이태원 일산 부산 수원 신생 핫스팟. 오픈 직후라 손님 적고 서비스 좋은 신규 ${catInfo.labelKo}만 모아 분위기·콘셉트·예약 팁까지 비교.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>신규 ${escHtml(catInfo.labelKo)} ${catVenues.length}곳</h2><ul>`;
  catVenues.forEach(vv => { ssrBody += `<li><a href="${venueHref(vv)}">${escHtml(vv.nameKo)}</a> — ${escHtml(vv.regionKo)}</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>신규 ${escHtml(catInfo.labelKo)} 첫 방문 팁</h2>`;
  ssrBody += `<p>오픈 직후의 ${escHtml(catInfo.labelKo)}는 손님이 아직 적어 매니저 응대가 꼼꼼하고 자리 선택도 자유로운 편입니다. 다만 운영 동선이 정착되기 전이라 평일 저녁이나 오픈 1~2시간 후에 가면 분위기를 더 정확히 볼 수 있습니다. 각 업소 페이지에서 콘셉트·룸 구성·실장 코멘트를 확인하고 직통 번호로 미리 통화해두면 첫방문이 훨씬 편합니다.</p>`;
  ssrBody += `<h2>신규 ${escHtml(catInfo.labelKo)} 자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>최근 오픈한 ${escHtml(catInfo.labelKo)} 어디가 좋아요?</dt>`;
  ssrBody += `<dd>현재 신규 입점 리스트는 ${escHtml(newNames)} 입니다. 지역과 콘셉트로 추려서 비교하세요.</dd>`;
  ssrBody += `<dt>신규 ${escHtml(catInfo.labelKo)}는 손님이 적나요?</dt>`;
  ssrBody += `<dd>오픈 초기에는 평일 손님이 적은 편이라 분위기를 여유롭게 즐길 수 있고, 주말은 미리 예약하는 게 안전합니다.</dd></dl>`;
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
  const title = `${regionKo} 밤문화 ${regionVenues.length}곳 — 클럽·나이트·룸·라운지 한눈에`;
  const regionTopNames = regionVenues.slice(0, 3).map(rv => rv.nameKo).join(', ');
  const desc = `${regionKo} 지역 클럽·나이트·라운지·룸·요정·호빠 ${regionVenues.length}곳 통합 정리. ${regionTopNames} 등 인기 업소 평점·후기·분위기·전화번호 한눈에 비교. ${regionKo} 밤문화 처음 가는 사람도 후회 없이 고르는 핫스팟 가이드.`;
  // 업종별 그룹핑 SSR
  const byCat = {};
  regionVenues.forEach(rv => { const ck = catLabelMap[rv.cat] || rv.cat; if (!byCat[ck]) byCat[ck] = []; byCat[ck].push(rv); });
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  for (const [ck, rvs] of Object.entries(byCat)) {
    ssrBody += `<h2>${escHtml(regionKo)} ${escHtml(ck)} (${rvs.length}곳)</h2><ul>`;
    rvs.forEach(rv => { ssrBody += `<li><a href="${venueHref(rv)}">${escHtml(rv.nameKo)}</a> — ${escHtml(rv.shortDesc.slice(0, 60))}</li>`; });
    ssrBody += `</ul>`;
  }
  // FAQ
  ssrBody += `<section><h2>${escHtml(regionKo)} 밤문화 FAQ</h2><dl>`;
  ssrBody += `<dt>${escHtml(regionKo)} 밤문화 추천은?</dt>`;
  ssrBody += `<dd>${escHtml(regionKo)}에서 인기 있는 곳: ${regionVenues.slice(0, 5).map(rv => escHtml(rv.nameKo)).join(', ')}. 각 업소 페이지에서 비교해보세요.</dd>`;
  ssrBody += `<dt>${escHtml(regionKo)}에 몇 곳 있나요?</dt>`;
  ssrBody += `<dd>${escHtml(regionKo)}에는 ${regionVenues.length}곳의 유흥 업소가 등록되어 있습니다.</dd>`;
  ssrBody += `</dl></section>`;
  // 시즌22 — 지역×업종 anchor (region/{ko}/{cat} reachable)
  ssrBody += `<h2>${escHtml(regionKo)} 업종별 더보기</h2><ul>`;
  for (const [catKey, catInfo] of Object.entries(catMap)) {
    const cv = regionVenues.filter(rv => rv.cat === catKey);
    if (cv.length === 0) continue;
    ssrBody += `<li><a href="/region/${encodeURIComponent(regionKo)}/${catInfo.path}/">${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} ${cv.length}곳</a></li>`;
  }
  ssrBody += `</ul>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${regionKo} 밤문화, ${regionKo} 클럽, ${regionKo} 나이트, ${regionKo} 룸, ${regionKo} 유흥`, jsonLdList: collectionJsonLd(p, title, desc, regionVenues) });
  dynamicPages.push(p);

  // ── region/[region]/[category] — 지역+업종 크로스 ──
  for (const [catKey, catInfo] of Object.entries(catMap)) {
    const crossVenues = regionVenues.filter(rv => rv.cat === catKey);
    if (crossVenues.length === 0) continue;
    const cp = `/region/${encodeURIComponent(regionKo)}/${catInfo.path}`;
    const ct = `${regionKo} ${catInfo.labelKo} ${crossVenues.length}곳 — 한눈에 비교하고 고르기`;
    const crossNames = crossVenues.slice(0, 3).map(cv => cv.nameKo).join(', ');
    const cd = `${regionKo} ${catInfo.labelKo} ${crossVenues.length}곳 실시간 비교 가이드 — ${crossNames} 등 인기 ${catInfo.labelKo} 분위기, 후기, 평점, 매니저 평판, 드레스코드, 전화번호, 영업시간, 예약 팁, 첫방문 동선까지 한눈에 정리한 ${regionKo} 핫스팟 비교 페이지.`;
    let cSsr = `<h1>${escHtml(ct)}</h1><p>${escHtml(cd)}</p>`;
    cSsr += `<h2>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} ${crossVenues.length}곳 리스트</h2><ul>`;
    crossVenues.forEach(cv => { cSsr += `<li><a href="${venueHref(cv)}">${escHtml(cv.nameKo)}</a> — ${escHtml(cv.shortDesc.slice(0, 60))}</li>`; });
    cSsr += `</ul>`;
    cSsr += `<h2>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} 고를 때 체크 포인트</h2>`;
    cSsr += `<p>${escHtml(regionKo)} 안에서도 ${escHtml(catInfo.labelKo)}는 골목·분위기·연령대가 다 다릅니다. 평일·주말 손님 톤이 크게 갈리는 곳도 있어 같은 ${escHtml(catInfo.labelKo)}라고 하나로 묶어 비교하면 실수합니다. 위 ${crossVenues.length}곳은 회원들이 ${escHtml(regionKo)}에서 자주 비교하는 ${escHtml(catInfo.labelKo)}만 모아둔 리스트로, 각 페이지에서 룸 구성·양주 라인업·실장 코멘트·예약 가능 시간을 확인하고 본인 모임 컨셉에 맞춰 고르세요.</p>`;
    cSsr += `<h2>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} 자주 묻는 질문</h2>`;
    cSsr += `<dl><dt>${escHtml(regionKo)}에서 ${escHtml(catInfo.labelKo)} 어디가 인기 있나요?</dt>`;
    cSsr += `<dd>${escHtml(crossNames)} 등이 회원 검색·재방문 기준 인기 ${escHtml(catInfo.labelKo)}로 자주 언급됩니다.</dd>`;
    cSsr += `<dt>${escHtml(regionKo)} ${escHtml(catInfo.labelKo)} 예약은 어떻게 하나요?</dt>`;
    cSsr += `<dd>각 업소 상세 페이지에서 직통 전화로 예약 가능 시간과 룸 사이즈를 미리 확인하세요. 주말은 일찍 마감되는 곳이 많습니다.</dd></dl>`;
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
  const title = `#${tag} 관련 업소 ${tagVenues.length}곳 — 태그로 찾는 밤문화`;
  const tagTopNames = tagVenues.slice(0, 3).map(tv => tv.nameKo).join(', ');
  const desc = `'${tag}' 태그로 모은 클럽·나이트·라운지·룸·요정·호빠 ${tagVenues.length}곳 큐레이션. ${tagTopNames} 등 강남 홍대 이태원 일산 부산 핫스팟 정리. 같은 분위기·콘셉트끼리 묶어 한번에 비교 가능한 ${tag} 전용 페이지.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>#${escHtml(tag)} 태그 업소 ${tagVenues.length}곳</h2><ul>`;
  tagVenues.forEach(tv => { ssrBody += `<li><a href="${venueHref(tv)}">${escHtml(tv.nameKo)}</a> — ${escHtml(tv.regionKo)} ${catLabelMap[tv.cat] || tv.cat}</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>#${escHtml(tag)} 태그 비교 가이드</h2>`;
  ssrBody += `<p>같은 #${escHtml(tag)} 태그라도 지역과 업종에 따라 분위기와 손님 톤이 다릅니다. 위 ${tagVenues.length}곳은 회원들이 ${escHtml(tag)} 키워드로 자주 묶어 검색하는 업소만 모은 큐레이션이고, 각 페이지에서 룸 구성·양주 라인업·매니저 코멘트·예약 가능 시간을 비교하면 본인 모임에 맞는 곳을 더 빠르게 고를 수 있습니다.</p>`;
  ssrBody += `<h2>#${escHtml(tag)} 자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>#${escHtml(tag)} 태그 업소는 어떤 곳인가요?</dt>`;
  ssrBody += `<dd>${escHtml(tagTopNames)} 등 ${tagVenues.length}곳이 이 태그로 묶여 있습니다. 각 업소 상세 페이지에서 정확한 분위기를 확인하세요.</dd>`;
  ssrBody += `<dt>#${escHtml(tag)} 처음 가는데 뭐 챙겨야 하나요?</dt>`;
  ssrBody += `<dd>드레스코드와 예약 가능 시간은 업소마다 달라서, 직통 전화로 미리 확인하면 첫방문이 훨씬 편합니다.</dd></dl>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${tag}, ${tag} 추천, 밤문화 ${tag}`, jsonLdList: collectionJsonLd(p, title, desc, tagVenues) });
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
  const stTopNames = stVenues.slice(0, 3).map(sv => sv.nameKo).join(', ');
  const desc = `${st} 근처 도보 5분 거리 클럽·나이트·라운지·룸·요정·호빠 ${stVenues.length}곳 위치 정리. ${stTopNames} 등 ${st} 인근 핫스팟 평점·후기·전화번호 비교. ${st}에서 술 한잔, 클럽, 룸 가기 좋은 곳을 거리순으로 안내.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<h2>${escHtml(st)} 근처 업소 ${stVenues.length}곳</h2><ul>`;
  stVenues.forEach(sv => { ssrBody += `<li><a href="${venueHref(sv)}">${escHtml(sv.nameKo)}</a> — ${escHtml(sv.regionKo)} ${catLabelMap[sv.cat] || sv.cat}</li>`; });
  ssrBody += `</ul>`;
  ssrBody += `<h2>${escHtml(st)} 도보 가이드</h2>`;
  ssrBody += `<p>${escHtml(st)}에서 출구를 나와 도보 5분 안쪽으로 갈 수 있는 ${stVenues.length}곳을 모았습니다. 늦은 시간에는 택시 잡기가 어렵기 때문에 역 근처에서 끝나는 코스가 안전합니다. 각 업소 페이지에서 정확한 도보 시간·골목 위치·매니저 직통 번호를 확인하고, 모임 시작 시간을 역 기준으로 잡으면 합류와 이동이 훨씬 편합니다.</p>`;
  ssrBody += `<h2>${escHtml(st)} 근처 자주 묻는 질문</h2>`;
  ssrBody += `<dl><dt>${escHtml(st)}에서 도보 5분 안에 갈 수 있는 곳은?</dt>`;
  ssrBody += `<dd>${escHtml(stTopNames)} 등 총 ${stVenues.length}곳이 도보권 안에 있습니다. 출구 번호는 각 업소 페이지에서 확인하세요.</dd>`;
  ssrBody += `<dt>${escHtml(st)} 늦은 시간에도 영업하나요?</dt>`;
  ssrBody += `<dd>대부분 새벽까지 운영하지만 마감 시간은 업소마다 다릅니다. 직통 통화로 마감 전 입장 가능 여부를 확인하세요.</dd></dl>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${st} 근처, ${st} 밤문화, ${st} 클럽, ${st} 나이트`, jsonLdList: collectionJsonLd(p, title, desc, stVenues) });
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
  llmsTxt += `- [${regionKo} 밤문화](${BASE_URL}/region/${encodeURIComponent(regionKo)})\n`;
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
놀쿨(NOLCOOL)은 대한민국 최대 유흥·나이트라이프 정보 플랫폼입니다.
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
- MBTI 유흥 성향 테스트
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
    llmsFull += `**Q: ${regionKo} 유흥 추천은?**\n`;
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
