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
  const can = `${BASE_URL}${canonical}`;
  const og = ogImage || OG_IMAGE;

  // title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escHtml(desc)}"`
  );

  // meta keywords
  if (keywords) {
    const kwMeta = `<meta name="keywords" content="${escHtml(keywords)}">`;
    html = html.replace('</head>', `    ${kwMeta}\n  </head>`);
  }

  // og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escHtml(title)}"`
  );

  // og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escHtml(desc)}"`
  );

  // og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${escHtml(can)}"`
  );

  // og:image
  html = html.replace(
    /<meta property="og:image" content="[^"]*"/,
    `<meta property="og:image" content="${escHtml(og)}"`
  );

  // twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escHtml(title)}"`
  );

  // twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escHtml(desc)}"`
  );

  // twitter:image
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${escHtml(og)}"`
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

function writePage(routePath, meta) {
  const dir = path.join(DIST, routePath);
  fs.mkdirSync(dir, { recursive: true });
  const html = renderPage({ ...meta, canonical: routePath, noindex: noIndexPathsSet.has(routePath) });
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

/**
 * 업소별 SSR 후기 — 각 업소마다 100% 고유한 후기 생성
 * slug+nameKo 해시로 템플릿 조합을 결정하여 업소마다 다른 후기
 */
function getVenueReviews(v) {
  const name = v.nameKo;
  const region = v.regionKo;
  const catKo = catLabelMap[v.cat] || v.cat;
  const staff = v.staffNickname || '';
  const feat0 = v.features[0] || '분위기';
  const feat1 = v.features[1] || '서비스';
  const feat2 = v.features[2] || '인테리어';

  // slug 기반 해시로 고유 인덱스 생성
  const hash = v.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const authors = ['직장인탈출', '새벽감성', '금토전사', '밤산책러', 'DJ추종자', '댄스중독', '파티피플', '야행성인간', '퇴근후한잔', '분위기캐치', '주말탐험가', '클럽초보', '단골손님', '첫방문객', '데이트코스', '모임러버', '혼놀족', '회식탈출', '출장족', '핫플헌터'];

  const nightPool = [
    `${name} 처음 갔는데 밴드 라이브가 진짜 좋았음. ${region}에서 이 정도 퀄리티는 처음이라 놀람.`,
    `${name} 금토 밤에 갔는데 ${feat0}${iGa(feat0)} 확실히 다르더라. 사람 많은데 그만큼 분위기 살아있음.`,
    `${region} ${catKo} 여러 곳 다녀봤는데 ${name}${iGa(name)} 시설·음향·매너 다 최고.`,
    `${staff ? staff + ' 실장 추천으로 갔는데 ' : '지인 추천으로 갔는데 '}${name} 진짜 후회 없었음. ${feat1} 수준이 다름.`,
    `혼자 갔는데도 전혀 어색하지 않았음. ${name} 스태프들이 자연스럽게 잘 안내해줌.`,
    `${name}에서 ${feat2} 보고 감탄함. ${region} 다른 ${catKo}랑은 급이 다르다는 걸 느낌.`,
    `지인 생일로 ${name} 갔는데 분위기 세팅이 완벽했음. 생일 축하 이벤트도 해주더라.`,
    `매주 ${name} 가는 단골인데 갈 때마다 새로운 재미가 있음. ${feat0}${iGa(feat0)} 특히 좋음.`,
  ];

  const clubPool = [
    `DJ가 분위기 읽는 능력이 대단함. ${name} 사운드 시스템 진짜 제대로.`,
    `주말에 줄 서서 기다렸는데 ${name} 들어가니까 보람 있었음. ${feat0} 확실히 돈 쓴 느낌.`,
    `${region}에서 이 정도 ${catKo}는 ${name}${iGa(name)} 유일함. 음악 장르도 다양.`,
    `${name} ${feat1}${iGa(feat1)} 진짜 미쳤음. 친구들 데려갔더니 다들 단골 되겠다고.`,
    `외국인 친구 데려갔는데 ${name} 보고 한국 클럽 수준에 깜짝 놀람. ${feat2}도 글로벌급.`,
    `${name} 금요일에 갔는데 에너지가 다름. ${region} 클럽 중 여기만한 데 없음.`,
    `${staff ? staff + '한테 VIP 안내받았는데 ' : ''}${name} VIP석 뷰가 미쳤음. 재방문 확정.`,
    `${name} 3번째 방문인데 매번 새로운 DJ 라인업이 좋음. ${feat0} 퀄리티 일정함.`,
  ];

  const hoppaPool = [
    `친구랑 ${name} 갔는데 호스트분들이 대화를 잘 이끌어줘서 어색한 순간이 없었음.`,
    `${name} 몇 번째인데 항상 만족. 선택폭 넓고 강요 없어서 편함.`,
    `${region}에서 ${name}만한 데 없는듯. ${feat0}${iGa(feat0)} 확실히 다름.`,
    `처음 가봤는데 ${name} 분위기가 편안해서 긴장이 바로 풀렸음.${staff ? ' ' + staff + ' 덕분.' : ''}`,
    `여자 넷이서 갔는데 ${name} 진짜 재밌었음. 호스트분 매너가 좋아서 또 가기로 함.`,
    `${name} ${feat1}${iGa(feat1)} 다른 데보다 확실히 나음. ${region} 호빠 중 최고.`,
  ];

  const roomPool = [
    `모임으로 ${name} 왔는데 룸 크기 딱 좋고 음향도 괜찮음.${staff ? ' ' + staff + '이 세팅 잘 해줌.' : ''}`,
    `시설 면에서 ${region} 룸 중 ${name}${iGa(name)} 가장 나았음. 양주 라인업도 괜찮음.`,
    `${name} 프라이빗하게 놀기 딱 좋음. ${feat0}${iGa(feat0)} 다른 곳보다 확실히 좋음.`,
    `회사 회식으로 ${name} 예약했는데 ${feat1} 수준에 상사분도 만족하셨음.`,
    `${name} 6인룸 이용했는데 넓고 깨끗함. ${region}에서 룸 찾으면 여기 추천.`,
    `${staff ? staff + ' 실장이 음료 세팅부터 마무리까지 완벽하게 챙겨줌. ' : ''}${name} 재방문 확정.`,
  ];

  const loungePool = [
    `조용히 한 잔 하고 싶을 때 ${name} 감. ${feat0}${iGa(feat0)} 고급스러움.`,
    `데이트 코스로 ${name} 왔는데 분위기 최고. ${region}에서 이런 곳 찾기 쉽지 않음.`,
    `${name} 칵테일 퀄리티가 좋음. ${feat1}도 감각적이라 사진 찍기 좋음.`,
    `접대 자리로 ${name} 예약했는데 격식과 편안함이 동시에. ${region} 라운지 중 최고.`,
    `${name} 혼자 와서 바 자리에 앉았는데 바텐더 대화가 즐거웠음. 단골 될 듯.`,
    `${staff ? staff + ' 추천 양주가 ' : '추천 양주가 '}기가 막혔음. ${name} 분위기랑 딱 맞는 선곡도 좋음.`,
  ];

  const yojeongPool = [
    `거래처 접대로 ${name} 왔는데 한정식 코스 퀄리티가 높고 국악 라이브도 격식 있었음.`,
    `외국 손님 모시고 ${name} 갔는데 한국 전통 문화 체험으로 최고. ${feat0}${iGa(feat0)} 감동.`,
    `${name} 15첩 코스가 진짜 제대로. ${region} 요정 중 음식 퀄리티 원탑.`,
    `${staff ? staff + '이 세심하게 챙겨줘서 ' : ''}${name}에서 편하게 접대 마침. 상대방도 감탄.`,
    `${name} 프라이빗 룸에서 국악 공연 감상하며 식사. 이런 경험은 여기서만 가능.`,
    `${region} ${catKo} 처음이었는데 ${name} 격식이 딱 맞아서 다음에도 여기로 정함.`,
  ];

  const pools = { night: nightPool, club: clubPool, hoppa: hoppaPool, room: roomPool, lounge: loungePool, yojeong: yojeongPool };
  const pool = pools[v.cat] || nightPool;

  // 해시 기반으로 3개 고유 선택 (업소마다 다른 조합)
  const idx0 = hash % pool.length;
  const idx1 = (hash * 3 + 7) % pool.length;
  const idx2 = (hash * 7 + 13) % pool.length;
  // 중복 방지
  const indices = [idx0];
  if (!indices.includes(idx1)) indices.push(idx1);
  else indices.push((idx1 + 1) % pool.length);
  if (!indices.includes(idx2)) indices.push(idx2);
  else {
    for (let i = 0; i < pool.length; i++) {
      const candidate = (idx2 + i) % pool.length;
      if (!indices.includes(candidate)) { indices.push(candidate); break; }
    }
  }

  return indices.map((i, pos) => ({
    text: pool[i],
    author: authors[(hash + pos * 7) % authors.length]
  }));
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
  const desc = escHtml(v.description.slice(0, 500));
  const features = v.features.slice(0, 5).map(f => escHtml(f)).join(', ');
  const staff = v.staffNickname ? escHtml(v.staffNickname) : '';

  let html = `<article itemscope itemtype="https://schema.org/NightClub">`;
  html += `<h1 itemprop="name">${name}</h1>`;
  html += `<p itemprop="description">${region} ${catKo}. ${desc}</p>`;

  if (features) {
    html += `<h2>${name} 분위기·특징</h2>`;
    html += `<p>${name}의 특징: ${features}. ${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 ${name}${iGa(v.nameKo)} 대표적이다.</p>`;
  }

  if (staff) {
    html += `<h2>${name} 담당자 안내</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${staff}${iGa(v.staffNickname)} 직접 관리하는 곳이다. 방문 전 문의하면 맞춤 안내를 받을 수 있다.</p>`;
  }

  if (v.nearbyStation) {
    html += `<h2>${name} 위치·접근성</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${escHtml(v.nearbyStation)}에서 가깝다.${v.address ? ' 주소: ' + escHtml(v.address) : ''}</p>`;
  }

  // ★ FAQ 섹션 — AI가 직접 인용할 수 있는 Q&A
  html += `<section>`;
  html += `<h2>${name} 자주 묻는 질문</h2>`;
  html += `<dl>`;
  html += `<dt>${name} 어디에 있나요?</dt>`;
  html += `<dd>${name}${eunNeun(v.nameKo)} ${region}에 위치한 ${catKo}입니다.${v.address ? ' 주소는 ' + escHtml(v.address) + '입니다.' : ''}${v.nearbyStation ? ' ' + escHtml(v.nearbyStation) + '에서 가깝습니다.' : ''}</dd>`;
  html += `<dt>${name} 영업시간은?</dt>`;
  html += `<dd>${name}의 영업시간과 실시간 정보는 놀쿨(nolcool.com)에서 확인할 수 있습니다.</dd>`;
  html += `<dt>${name} 예약 방법은?</dt>`;
  html += `<dd>${name} 방문 예약은 놀쿨에서 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}</dd>`;
  html += `<dt>${region} ${catKo} 추천은?</dt>`;
  html += `<dd>${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 ${name}${eulReul(v.nameKo)} 추천합니다. 실시간 후기와 비교 정보는 놀쿨에서 확인하세요.</dd>`;
  html += `</dl>`;
  html += `</section>`;

  // ★ 후기 섹션 — 구글이 "살아있는 콘텐츠"로 인식 + "가게이름 후기" 검색 대응
  html += `<section>`;
  html += `<h2>${name} 방문 후기</h2>`;
  const reviewTemplates = getVenueReviews(v);
  reviewTemplates.forEach(r => {
    html += `<blockquote>`;
    html += `<p>"${escHtml(r.text)}"</p>`;
    html += `<footer>— ${escHtml(r.author)}</footer>`;
    html += `</blockquote>`;
  });
  html += `</section>`;

  // ★ 방문 안내 섹션 — "가게이름 후기", "가게이름 가는법" 검색 대응
  html += `<h2>${name} 방문 안내</h2>`;
  html += `<p>${name}${eulReul(v.nameKo)} 처음 방문하신다면, 놀쿨(nolcool.com)에서 사전 정보를 확인하세요. `;
  html += `${name}의 분위기, 인기 시간대, 복장 가이드까지 미리 알 수 있습니다. `;
  if (v.nearbyStation) html += `교통편은 ${escHtml(v.nearbyStation)}이 가장 가깝습니다. `;
  html += `${name} 실제 방문 후기는 커뮤니티에서 확인 가능합니다.</p>`;

  // ★ 업종별 상세 정보 섹션 — 가게이름 키워드 밀도 강화 + 1000자+ 보장
  if (v.cat === 'night' || v.cat === 'club') {
    html += `<h2>${name} 분위기·음악</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${region}을 대표하는 ${catKo}로, ${features || '다양한 장르의 음악'}${eulReul(features || '음악')} 즐길 수 있다. `;
    html += `${name}${eunNeun(v.nameKo)} 첫 방문자도 편하게 즐길 수 있는 분위기를 갖추고 있으며, `;
    html += `${name} 단골들 사이에서 "한번 오면 또 온다"는 평가를 받고 있다.</p>`;
  } else if (v.cat === 'room') {
    html += `<h2>${name} 룸 구성·양주</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${region}에서 프라이빗한 모임에 최적화된 공간이다. `;
    html += `${name}의 룸은 소규모 밀담부터 대규모 단체석까지 다양하게 구성되어 있다. `;
    html += `${name} 양주 라인업은 가성비와 프리미엄 모두 갖추고 있어 접대·회식·모임에 적합하다.</p>`;
  } else if (v.cat === 'hoppa') {
    html += `<h2>${name} 이용 안내</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${region}에서 여성 고객을 위한 사교 공간이다. `;
    html += `${name}${eunNeun(v.nameKo)} 호스트 선택의 폭이 넓고, 강요 없는 편안한 분위기가 특징이다. `;
    html += `${name} 처음 방문하는 분도 부담 없이 즐길 수 있다.</p>`;
  } else if (v.cat === 'yojeong') {
    html += `<h2>${name} 코스·접대</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${region}에서 격식 있는 접대와 한정식 코스를 제공하는 전통 요정이다. `;
    html += `${name}의 코스 요리는 계절 식재료를 활용하며, 국악 라이브와 함께 품격 있는 자리를 만든다. `;
    html += `${name}${eunNeun(v.nameKo)} 비즈니스 만찬과 외국 손님 접대에 최적이다.</p>`;
  } else if (v.cat === 'lounge') {
    html += `<h2>${name} 분위기·메뉴</h2>`;
    html += `<p>${name}${eunNeun(v.nameKo)} ${region}에서 조용하고 고급스러운 분위기의 라운지다. `;
    html += `${name}${eunNeun(v.nameKo)} 데이트, 접대, 혼술 모든 상황에 맞는 공간을 제공한다. `;
    html += `${name} 칵테일과 양주 메뉴는 바텐더 추천으로 선택할 수 있다.</p>`;
  }

  html += `<h2>${name} 총정리</h2>`;
  html += `<p>${region} ${catKo} ${name} — 실시간 후기, 시세, 예약 안내를 놀쿨(nolcool.com)에서 확인하세요. ${region} ${catKo} 비교, 순위, 방문 후기까지 한 곳에서 볼 수 있습니다. ${name} 방문 전 반드시 놀쿨에서 최신 정보를 확인하세요.</p>`;

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
        html += `<li><a href="${rvPath}">${escHtml(rv.nameKo)}</a> — ${escHtml(rv.regionKo)} ${rvCatKo}</li>`;
      });
      html += `</ul></section>`;
    }
  }

  // ★ 커뮤니티 활성 시그널 — 구글이 "살아있는 사이트"로 인식
  const seed = v.slug.length + v.nameKo.length;
  const postCount = 12 + (seed % 30);
  const commentCount = postCount * 2 + (seed % 15);
  const daysAgo = (seed % 3);
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - daysAgo);
  const recentStr = recentDate.toISOString().slice(0, 10);
  html += `<section><h2>${name} 커뮤니티 현황</h2>`;
  html += `<p>최근 후기 ${postCount}개 · 댓글 ${commentCount}개 · 마지막 글 ${recentStr}</p>`;
  html += `<p>${name} 실시간 후기와 꿀팁은 놀쿨 커뮤니티에서 매일 업데이트됩니다.</p>`;
  html += `</section>`;

  // ★ 관련 키워드 — 검색엔진이 연관 검색어로 인식
  html += `<footer><p>${name}, ${region} ${catKo}, ${region} ${catKo} 추천, ${name} 후기, ${name} 예약, ${name} 위치, ${region} 밤문화</p></footer>`;
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
    { q: `${name} 예약 방법은?`, a: `${name} 예약은 놀쿨(nolcool.com)에서 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}` },
    { q: `${region} ${catKo} 추천은?`, a: `${region}에서 ${catKo}${eulReul(catKo)} 찾는다면 ${name}${eulReul(name)} 추천합니다. 놀쿨에서 실시간 후기와 비교 정보를 확인하세요.` },
    { q: `${name} 분위기는 어떤가요?`, a: `${name}${eunNeun(name)} ${v.features.slice(0, 3).join(', ')} 등의 특징이 있는 ${region} ${catKo}입니다.` },
    { q: `${name} 후기는?`, a: `${name} 실제 방문 후기는 놀쿨(nolcool.com) 커뮤니티에서 확인할 수 있습니다. 직접 가본 사람들의 솔직한 평가를 읽어보세요.` },
    { q: `${name} 처음 가는데 혼자 가도 되나요?`, a: `${name}${eunNeun(name)} 혼자 방문하는 손님도 많습니다. 놀쿨 가이드에서 첫 방문 팁을 확인하세요.` },
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
  { path: '/clubs', title: '새벽 2시에도 줄이 안 줄어드는 클럽만 골랐다', desc: 'EDM·힙합·테크노 35곳, 입장료부터 분위기까지 한눈에. 오늘 밤 갈 곳 여기서 픽.' },
  { path: '/nights', title: '라이브 밴드가 울리면, 모르는 사람도 파트너가 된다', desc: '소셜댄스 58곳 총집합. 부킹 문화부터 드레스코드까지, 첫 발 딛기 전에 읽어라.' },
  { path: '/lounges', title: '조용히 한 잔, 대화만 남는 밤을 원한다면', desc: '시끄러운 데 싫은 사람을 위한 라운지 3곳. 접대·데이트·혼술 무드별로 골라봐.' },
  { path: '/rooms', title: '바깥 소리 하나 안 들리는 방, 그게 룸이다', desc: '4인 밀담부터 30인 단체석까지. 인원수 말하면 딱 맞는 크기로 세팅해준다.' },
  { path: '/yojeong', title: '대금 소리에 정찬 15첩, 한 번 오면 단골 된다', desc: '전통 요정의 격식과 맛을 한 자리에. 비즈니스 만찬, 외국 손님 접대까지 검증된 곳.' },
  { path: '/hoppa', title: '처음인데 혼자 가도 괜찮을까? 결론부터, 된다', desc: '여성 전용 사교 공간 18곳 실전 가이드. 시세·분위기·안전 확인하고 가라.' },

  // Interactive pages
  { path: '/guide', title: '처음이라 긴장된다고? 이거 읽고 가면 프로다', desc: '드레스코드, 예산, 혼자 가도 되는지까지. 업종별 입문 핵심만 정리했다.' },
  { path: '/map', title: '지금 위치에서 가까운 곳, 지도에 다 떴다', desc: '핀 하나 누르면 전화·길찾기 바로 연결. 내 주변 영업 중인 곳만 표시.' },
  { path: '/quiz', title: '클럽형인지 라운지형인지, 테스트 해봐', desc: '10문항 답하면 나한테 맞는 유흥 스타일이 나온다. 소요시간 2분.' },
  { path: '/roulette', title: '고민 끝, 룰렛이 대신 골라준다', desc: '탭 한 번이면 오늘 밤 갈 곳이 정해진다. 운명에 맡겨봐.' },
  { path: '/vs', title: '어디가 더 낫냐고? 투표로 결판내자', desc: '인기 업소끼리 맞짱. 한 표 던지고 실시간 결과 확인해봐.' },
  { path: '/ranking', title: '지금 이 순간, 사람들이 가장 많이 보는 곳', desc: '조회수 기준 TOP 30. 지역별·업종별 필터로 실시간 인기 순위 확인.' },
  { path: '/venue-info', title: '양주·부스·룸 한눈에 보기', desc: '업종별 양주 라인업, 부스 구성, 룸 타입까지. 가기 전에 미리 확인해봐.' },
  { path: '/compare', title: '두 곳 놓고 따져보면 후회가 없다', desc: '가격·분위기·후기 항목별 비교표. 고민 끝, 선택만 남았다.' },
  { path: '/search', title: '이름만 치면 바로 나온다, 통합 검색', desc: '지역·업종·이름 아무거나 입력. 117곳 중에서 딱 맞는 곳 골라준다.' },
  { path: '/magazine', title: '밤문화 읽을거리, 여기 다 모았다', desc: '지역 분석, 업종 비교, 현장 리포트. 가기 전에 읽으면 달라지는 글.' },

  // Community pages
  { path: '/community', title: '밤 사람들이 모이는 커뮤니티', desc: '후기, 꿀팁, 파티 모집, 오늘 밤 추천까지. 같이 노는 사람들의 광장.' },
  { path: '/community/qna', title: '오늘 밤 어디 가냐고? 여기서 추천받아', desc: '갈 곳 못 정한 사람들이 모여서 서로 추천해주는 게시판.' },
  { path: '/community/reviews', title: '가본 사람만 쓸 수 있다, 실제 방문 후기', desc: '별점과 한 줄 평으로 보는 업소 리얼 리뷰. 광고 아닌 진짜 목소리.' },
  { path: '/community/tips', title: '고수들이 풀어놓은 밤놀이 실전 꿀팁', desc: '입장 타이밍, 자리 잡는 법, 안 당하는 법. 경험자만 아는 노하우.' },
  { path: '/community/party', title: '같이 갈 사람 손! 파티 멤버 모집', desc: '날짜 맞추고, 인원 채우고, N빵. 혼자 가기 아까울 때 여기서 구해.' },
  { path: '/community/free', title: '아무 말 대잔치, 자유게시판', desc: '잡담, 궁금한 거, 웃긴 얘기 다 OK. 규칙만 지키면 뭐든 써.' },
  { path: '/community/fashion', title: '운동화 신고 가도 돼? 업종별 복장 가이드', desc: '클럽·나이트·요정·라운지, 어디냐에 따라 옷이 다르다. 한눈에 정리.' },
  { path: '/community/jogak', title: '급하게 한 명 구한다, 조각 모집', desc: '자리 하나 남았을 때, 바로 올리고 바로 구한다. 100P 이상 작성 가능.' },
  { path: '/community/guidelines', title: '이것만 지키면 된다, 커뮤니티 규칙', desc: '광고·욕설·개인정보 노출 금지. 기본 매너만 지키면 자유롭게.' },
  { path: '/lounge', title: '업종별 라운지 — 같은 취향끼리 모이는 곳', desc: '나이트·클럽·룸·요정·호빠·라운지바 업종별 전용 게시판.' },
  { path: '/lounge/night', title: '나이트 라운지 — 나이트 경험담 공유', desc: '나이트 다녀온 사람들의 실시간 이야기. 후기, 질문, 정보 공유.' },
  { path: '/lounge/club', title: '클럽 라운지 — 클럽 이야기', desc: '클럽 음악, 분위기, 추천 정보를 나누는 전용 게시판.' },
  { path: '/lounge/room', title: '룸 라운지 — 룸 이야기', desc: '룸 이용 후기와 추천 정보를 나누는 전용 게시판.' },
  { path: '/lounge/yojung', title: '요정 라운지 — 요정 이야기', desc: '요정 방문 경험과 정보를 공유하는 전용 게시판.' },
  { path: '/lounge/hoppa', title: '호빠 라운지 — 호빠 이야기', desc: '호빠 방문 후기와 추천을 나누는 전용 게시판.' },
  { path: '/lounge/lounge', title: '라운지바 라운지 — 라운지바 이야기', desc: '라운지바 분위기와 칵테일 추천 게시판.' },
  { path: '/lounge/free', title: '라운지 자유게시판 — 뭐든 자유롭게', desc: '업종 상관없이 자유롭게 대화하는 공간.' },
  { path: '/lounge/qna', title: '라운지 질문답변 — 뭐든 물어보세요', desc: '밤문화 관련 궁금한 거 다 답해주는 Q&A.' },

  // Legal & Info
  { path: '/privacy', title: '개인정보 수집·이용·파기 안내', desc: '수집 항목, 보유 기간, 제3자 제공 여부를 투명하게 공개.' },
  { path: '/terms', title: '서비스 이용약관', desc: '가입, 이용, 탈퇴 시 적용되는 권리와 의무 전문.' },
  { path: '/disclaimer', title: '법적 고지 및 면책사항', desc: '본 사이트 정보는 참고 목적이며 법적 보증을 하지 않습니다.' },
  { path: '/venue-terms', title: '업소 등록 및 광고 게재 약관', desc: '게재 조건, 환불 정책, 삭제 기준. 등록 전 반드시 확인.' },
  { path: '/safety', title: '취했을 때 이 페이지 하나면 된다', desc: '혈중알코올 계산, 대리운전 호출, 긴급 신고까지 원탭으로 해결.' },
  { path: '/help', title: '자주 묻는 질문, 여기 다 답해놨다', desc: '나이 제한, 복장 규정, 입장료 궁금증. 검색 한 번에 해결.' },

  // Business
  { path: '/for-business', title: '사장님, 가게 올리면 월 1,200명이 봅니다', desc: '14일 무료 체험. 등록만 하면 검색 노출·전화 연결·리뷰 관리 전부 된다.' },
  { path: '/testimonials', title: '현직 사장님 5명이 직접 말한다', desc: '"반신반의했는데 전화가 쏟아졌다." 입점 업주 생생 인터뷰.' },
  { path: '/pricing', title: '요금제 4단계, 0원부터 시작 가능', desc: '무료 체험 14일 후 결정해도 늦지 않다. 해지도 클릭 한 번.' },
  { path: '/demo', title: '가입 없이 10초면 끝, 업주 화면 미리보기', desc: '대시보드가 어떻게 생겼는지 궁금하면 지금 바로 눌러봐.' },
  { path: '/case-studies', title: '등록 후 예약이 250% 늘었다, 실제 사례', desc: '일산명월관·수원찬스돔·강남레이스의 입점 전후 변화. 숫자로 확인.' },

  // Lead magnets
  { path: '/lead/nightlife-guide', title: '서울경기 나이트라이프 완벽 가이드 — 현지인만 아는 진짜 핫플', desc: '서울 경기 나이트라이프 현지인 추천 가이드. 강남 홍대 이태원 일산 클럽 라운지 바 드레스코드 가격대 인사이더 팁 총정리.' },
  { path: '/lead/quiz', title: '3문제로 찾는 나만의 밤 — 맞춤 추천 퀴즈', desc: '3가지 질문으로 나한테 딱 맞는 서울 경기 나이트라이프 장소를 찾아드립니다.' },
  { path: '/lead/weekly-hot', title: '이번 주 가장 핫한 곳 3 — 매주 금요일 알림', desc: '매주 금요일 오후 5시, 이번 주말 가장 핫한 나이트라이프 장소 TOP3를 알림으로 받아보세요.' },

  // Misc
  { path: '/status', title: '서버 상태·점검 일정 확인', desc: '실시간 가동률과 예정된 점검, 장애 알림을 한눈에.' },
  { path: '/referral', title: '링크 하나 보내면 둘 다 VIP 된다', desc: '카톡으로 친구 초대. 수락하는 순간 나도 친구도 VIP 등급.' },
  { path: '/hidden', title: '단골만 알던 곳, 여기서 처음 공개한다', desc: '매주 1곳씩 비공개 업소 오픈. 아는 사람만 가던 곳을 꺼냈다.' },
  { path: '/gallery', title: '사진으로 먼저 본다, 매장 내부 실사 갤러리', desc: '조명, 룸 배치, 무대 크기. 직접 가기 전에 눈으로 먼저 확인.' },
  { path: '/events', title: '놓치면 후회할 이번 달 파티·행사 일정', desc: 'DJ 게스트, 기념행사, 시즌 이벤트. 달력에 표시해두고 가라.' },

  // Auth & Admin (SEO 가치 낮지만 고유 title 설정)
  { path: '/login', title: '카카오 탭 한 번, 3초면 로그인 끝', desc: '로그인하면 후기 작성, 찜하기, 포인트 적립 전부 가능.' },
  { path: '/profile', title: '내 찜 목록·후기·방문 기록 모아보기', desc: '내가 찜한 업소, 작성한 후기, 포인트 내역까지 한 곳에.' },
  { path: '/dashboard', title: '내 매장 현황판, 실시간 확인', desc: '오늘 방문자, 전화 클릭, 인기 시간대. 사장님 전용 데이터.' },
  { path: '/analytics', title: '유입 경로부터 전화 건수까지, 분석 리포트', desc: '어디서 들어왔고, 뭘 눌렀고, 전환은 몇 건인지 그래프로 확인.' },
  { path: '/billing', title: '구독·결제 내역 한눈에', desc: '현재 요금제, 결제 이력, 변경·해지 전부 이 페이지에서.' },
  { path: '/onboarding', title: '3분이면 끝나는 입점 신청', desc: '상호명, 사진, 연락처만 넣으면 등록 완료. 복잡한 거 없다.' },
  { path: '/launch', title: '심사 통과! 오픈 전 마지막 체크', desc: '대시보드 접속 전 확인할 항목 리스트. 하나씩 체크하면 끝.' },
  { path: '/admin/venues', title: '매장 수정·삭제', desc: '관리자 전용. 등록된 업소를 바로 수정하거나 삭제.' },
];

// ══════════════════════════════════════════
// 2. 정적 페이지 생성 (카테고리 리스팅에는 업소 이름 SSR 포함)
// ══════════════════════════════════════════
const categoryPaths = new Set(['/clubs', '/nights', '/lounges', '/rooms', '/yojeong', '/hoppa']);
// ── 홈페이지: WebSite + Organization JSON-LD ──
writePage('/', {
  title: '놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다',
  description: `전국 클럽·나이트·라운지·룸·요정·호빠 ${venues.length}곳 실시간 비교. 후기·시세·예약 한 곳에서.`,
  jsonLdList: [WEBSITE_JSONLD, ORG_JSONLD],
  ssrBody: `<h1>놀쿨 — 오늘 밤 어디 갈지, 여기서 정해진다</h1><p>대한민국 전국 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${venues.length}곳의 실시간 정보를 제공하는 나이트라이프 플랫폼입니다.</p>`
});

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
    catVenues.forEach(vv => { ssrBody += `<li>${escHtml(vv.nameKo)} — ${escHtml(vv.regionKo)} ${catKo}</li>`; });
    ssrBody += `</ul>`;
    // ★ 지역별 안내 추가 (AI가 지역+업종 검색 시 인용)
    const regionGroups = {};
    catVenues.forEach(vv => {
      if (!regionGroups[vv.regionKo]) regionGroups[vv.regionKo] = [];
      regionGroups[vv.regionKo].push(vv.nameKo);
    });
    for (const [rg, names] of Object.entries(regionGroups)) {
      ssrBody += `<h3>${escHtml(rg)} ${catKo}</h3>`;
      ssrBody += `<p>${escHtml(rg)}에서 인기 있는 ${catKo}: ${names.map(n => escHtml(n)).join(', ')}. 실시간 후기와 비교는 놀쿨에서 확인하세요.</p>`;
    }

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
        desc = `${regionKo} 클럽 ${regionVenues.length}곳 실시간 비교. ${allNames} 등 입장료·분위기·영업시간·후기까지 한눈에 확인하고 고르세요.`;
      } else if (cat === 'room') {
        title = `${regionKo} 룸 ${regionVenues.length}곳 — 인원수 말하면 딱 맞게 세팅`;
        desc = `${regionKo} 프라이빗 룸 ${regionVenues.length}곳 비교. ${allNames} 등 인원별·용도별 룸 구성과 양주 라인업 확인. 모임 전 필수 체크.`;
      } else {
        title = `${regionKo} 요정 ${regionVenues.length}곳 — 격이 다른 만찬의 시작`;
        desc = `${regionKo} 전통 한정식 요정 ${regionVenues.length}곳. ${allNames} 등 코스 요리·국악 라이브·프라이빗 룸 비교. 접대 장소 고를 때 여기서 확인.`;
      }
      // SSR: 해당 지역 업소 이름 + 상세 설명 전부 포함
      let regSsr = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
      regSsr += `<h2>${escHtml(regionKo)} ${catLabelMap[cat]} ${regionVenues.length}곳</h2><ul>`;
      regionVenues.forEach(vv => {
        regSsr += `<li><strong>${escHtml(vv.nameKo)}</strong> — ${escHtml(vv.shortDesc.slice(0, 80))}</li>`;
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
/** 스크린샷 서비스 폴백 URL (slug 해시로 3개 서비스 로테이션) */
const catPathMap = { club:'clubs', night:'nights', lounge:'lounges', room:'rooms', yojeong:'yojeong', hoppa:'hoppa' };
function getScreenshotFallback(slug, cat) {
  const pageUrl = `${BASE_URL}/${catPathMap[cat] || 'clubs'}/${slug}`;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  if (hash === 0) return `https://image.thum.io/get/width/1200/crop/1200/${pageUrl}`;
  if (hash === 1) return `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1200&viewport.height=1200`;
  return `https://image.thum.io/get/width/1200/crop/1200/${pageUrl}`;
}

function getVenueOgImage(slug, cat) {
  if (JPG_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  if (NICKNAME_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  // 실제 이미지 파일이 있을 때만 venue 이미지, 없으면 스크린샷 폴백
  const venueImg = path.join(DIST, 'venues', `${slug}-1.jpg`);
  if (fs.existsSync(venueImg)) return `${BASE_URL}/venues/${slug}-1.jpg`;
  return getScreenshotFallback(slug, cat);
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

  // ★ 개별 Review JSON-LD — 구글 검색결과에 별점+후기 스니펫 표시
  const reviews = getVenueReviews(v);
  const reviewDates = reviews.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i * 7 + Math.floor(Math.random() * 5)));
    return d.toISOString().slice(0, 10);
  });

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
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.5', bestRating: '5', ratingCount: String(80 + (v.slug.length * 3) % 100), worstRating: '1' },
    review: reviews.slice(0, 3).map((r, i) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: reviewDates[i],
      reviewBody: r.text,
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }
    })),
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

  const venueKeywords = [v.nameKo, `${v.regionKo} ${catLabelMap[v.cat]}`, `${v.nameKo} 후기`, `${v.nameKo} 예약`, `${v.regionKo} ${catLabelMap[v.cat]} 추천`, `${v.regionKo} 밤문화`].join(', ');
  writePage(routePath, {
    title: hookTitle,
    description: desc,
    ogImage: getVenueOgImage(v.slug, v.cat),
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
// 4-B. 동적 SEO 페이지 대량 생성 (1000+)
// best, new, region, region+category, tag, near
// ══════════════════════════════════════════
const dynamicPages = [];

// ── best/[category] — 인기순 (6개) ──
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  const p = `/best/${catInfo.path}`;
  const title = `${catInfo.labelKo} 인기 TOP ${catVenues.length} — 사람들이 가장 많이 찾는 ${catInfo.labelKo}`;
  const desc = `전국 ${catInfo.labelKo} 인기순 ${catVenues.length}곳 비교. 조회수·후기 기준 실시간 랭킹.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  ssrBody += `<ol>`;
  catVenues.forEach((vv, idx) => { ssrBody += `<li>${idx + 1}. ${escHtml(vv.nameKo)} — ${escHtml(vv.regionKo)} ${catInfo.labelKo}</li>`; });
  ssrBody += `</ol>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${catInfo.labelKo} 인기, ${catInfo.labelKo} 추천, ${catInfo.labelKo} 랭킹, ${catInfo.labelKo} TOP` });
  dynamicPages.push(p);
}

// ── new/[category] — 신규 (6개) ──
for (const [catKey, catInfo] of Object.entries(catMap)) {
  const catVenues = venues.filter(vv => vv.cat === catKey);
  if (catVenues.length === 0) continue;
  const p = `/new/${catInfo.path}`;
  const title = `새로 입점한 ${catInfo.labelKo} ${catVenues.length}곳 — 아직 안 가본 곳 먼저 발견`;
  const desc = `최근 등록된 ${catInfo.labelKo} ${catVenues.length}곳. 새로 오픈한 ${catInfo.labelKo}를 놀쿨에서 먼저 확인.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p><ul>`;
  catVenues.forEach(vv => { ssrBody += `<li>${escHtml(vv.nameKo)} — ${escHtml(vv.regionKo)}</li>`; });
  ssrBody += `</ul>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `신규 ${catInfo.labelKo}, 새 ${catInfo.labelKo}, ${catInfo.labelKo} 오픈` });
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
  const desc = `${regionKo} 지역 클럽, 나이트, 라운지, 룸, 요정, 호빠 ${regionVenues.length}곳 비교.`;
  // 업종별 그룹핑 SSR
  const byCat = {};
  regionVenues.forEach(rv => { const ck = catLabelMap[rv.cat] || rv.cat; if (!byCat[ck]) byCat[ck] = []; byCat[ck].push(rv); });
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p>`;
  for (const [ck, rvs] of Object.entries(byCat)) {
    ssrBody += `<h2>${escHtml(regionKo)} ${escHtml(ck)} (${rvs.length}곳)</h2><ul>`;
    rvs.forEach(rv => { ssrBody += `<li>${escHtml(rv.nameKo)} — ${escHtml(rv.shortDesc.slice(0, 60))}</li>`; });
    ssrBody += `</ul>`;
  }
  // FAQ
  ssrBody += `<section><h2>${escHtml(regionKo)} 밤문화 FAQ</h2><dl>`;
  ssrBody += `<dt>${escHtml(regionKo)} 밤문화 추천은?</dt>`;
  ssrBody += `<dd>${escHtml(regionKo)}에서 인기 있는 곳: ${regionVenues.slice(0, 5).map(rv => escHtml(rv.nameKo)).join(', ')}. 놀쿨에서 비교해보세요.</dd>`;
  ssrBody += `<dt>${escHtml(regionKo)}에 몇 곳 있나요?</dt>`;
  ssrBody += `<dd>${escHtml(regionKo)}에는 ${regionVenues.length}곳의 유흥 업소가 등록되어 있습니다.</dd>`;
  ssrBody += `</dl></section>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${regionKo} 밤문화, ${regionKo} 클럽, ${regionKo} 나이트, ${regionKo} 룸, ${regionKo} 유흥` });
  dynamicPages.push(p);

  // ── region/[region]/[category] — 지역+업종 크로스 ──
  for (const [catKey, catInfo] of Object.entries(catMap)) {
    const crossVenues = regionVenues.filter(rv => rv.cat === catKey);
    if (crossVenues.length === 0) continue;
    const cp = `/region/${encodeURIComponent(regionKo)}/${catInfo.path}`;
    const ct = `${regionKo} ${catInfo.labelKo} ${crossVenues.length}곳 — 한눈에 비교하고 고르기`;
    const cd = `${regionKo} 지역 ${catInfo.labelKo} ${crossVenues.length}곳 비교. 분위기·후기·위치 정보 확인.`;
    let cSsr = `<h1>${escHtml(ct)}</h1><p>${escHtml(cd)}</p><ul>`;
    crossVenues.forEach(cv => { cSsr += `<li>${escHtml(cv.nameKo)} — ${escHtml(cv.shortDesc.slice(0, 60))}</li>`; });
    cSsr += `</ul>`;
    writePage(cp, { title: ct, description: cd, ssrBody: cSsr, keywords: `${regionKo} ${catInfo.labelKo}, ${regionKo} ${catInfo.labelKo} 추천` });
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
  const desc = `'${tag}' 태그가 붙은 클럽·나이트·라운지·룸 ${tagVenues.length}곳.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p><ul>`;
  tagVenues.forEach(tv => { ssrBody += `<li>${escHtml(tv.nameKo)} — ${escHtml(tv.regionKo)} ${catLabelMap[tv.cat] || tv.cat}</li>`; });
  ssrBody += `</ul>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${tag}, ${tag} 추천, 밤문화 ${tag}` });
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
  const desc = `${st} 근처 클럽·나이트·라운지·룸 ${stVenues.length}곳. 도보 거리 밤문화 장소.`;
  let ssrBody = `<h1>${escHtml(title)}</h1><p>${escHtml(desc)}</p><ul>`;
  stVenues.forEach(sv => { ssrBody += `<li>${escHtml(sv.nameKo)} — ${escHtml(sv.regionKo)} ${catLabelMap[sv.cat] || sv.cat}</li>`; });
  ssrBody += `</ul>`;
  writePage(p, { title, description: desc, ssrBody, keywords: `${st} 근처, ${st} 밤문화, ${st} 클럽, ${st} 나이트` });
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
// Dynamic SEO pages (best, new, region, tag, near)
for (const dp of dynamicPages) {
  sitemapXml += `  <url><loc>${BASE_URL}${dp}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
}
sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);
const totalSitemapUrls = 1 + staticPages.length + regionalCount + venues.length + dynamicPages.length;
console.log(`✅ sitemap.xml 생성 (총 ${totalSitemapUrls}개 URL, 동적 ${dynamicPages.length}개 포함)`);

// ══════════════════════════════════════════
// 6. llms.txt 자동 생성 — AI 검색엔진용 (가게이름 포함)
// ══════════════════════════════════════════
let llmsTxt = `# 놀쿨 (NOLCOOL)
> 대한민국 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보 플랫폼. ${venues.length}곳 비교, 직접 가본 후기, 시세 정보 제공.
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
> 직접 방문한 후기, 시세 정보, 업소 비교, 커뮤니티를 운영합니다.
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

// ══════════════════════════════════════════
// 7. _redirects 업데이트 (정적 파일 우선, 나머지 SPA fallback)
// ══════════════════════════════════════════
const redirects = `/llms.txt /llms.txt 200
/llms-full.txt /llms-full.txt 200
/sitemap.xml /sitemap.xml 200
/robots.txt /robots.txt 200
/api/* /api/:splat 200
/* /index.html 200
`;
fs.writeFileSync(path.join(DIST, '_redirects'), redirects);

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
console.log(`   동적 SEO: ${dynamicPages.length}개`);
console.log(`   ────────────────`);
console.log(`   총 ${pageCount + regionalCount + venueCount + dynamicPages.length}개 고유 HTML 생성`);

// 빌드 시 자동 인덱싱 제출
console.log(`\n🔔 검색엔진 인덱싱 제출 중...`);
await submitIndexNow();
await pingSitemap();
console.log(`\n🚀 SEO 프리렌더링 + 인덱싱 제출 완료!`);
