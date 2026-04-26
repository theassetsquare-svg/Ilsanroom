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

/**
 * HTML의 head 메타 태그를 교체
 */
function renderPage({ title, description, canonical, ogImage, ssrBody, jsonLdList }) {
  let html = baseHtml;
  const desc = (description || '').slice(0, 150);
  const can = `${BASE_URL}${canonical}`;
  const og = ogImage || OG_IMAGE;

  // title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escHtml(desc)}"`
  );

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

  // ★ JSON-LD 구조화 데이터 삽입 (AI 검색 크롤러용)
  if (jsonLdList && jsonLdList.length > 0) {
    const jsonLdHtml = jsonLdList.map(data =>
      `<script type="application/ld+json">${JSON.stringify(data)}</script>`
    ).join('\n    ');
    html = html.replace('</head>', `    ${jsonLdHtml}\n  </head>`);
  }

  // SSR body content — inject inside root div for crawlers (React replaces on hydration)
  if (ssrBody) {
    html = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
  }

  return html;
}

function writePage(routePath, meta) {
  const dir = path.join(DIST, routePath);
  fs.mkdirSync(dir, { recursive: true });
  const html = renderPage({ ...meta, canonical: routePath });
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
    const address = block.match(/address:\s*'([^']+)'/)?.[1];
    const nearbyStation = block.match(/nearbyStation:\s*'([^']+)'/)?.[1];
    const features = [];
    const featMatch = block.match(/features:\s*\[([^\]]*)\]/);
    if (featMatch) {
      const fItems = featMatch[1].match(/'([^']+)'/g);
      if (fItems) fItems.forEach(f => features.push(f.replace(/'/g, '')));
    }
    if (slug && cat && region) {
      venues.push({
        slug, cat, region,
        regionKo: regionKo || '',
        nameKo: nameKo || slug,
        shortDesc: shortDesc || (desc || '').slice(0, 120),
        description: desc || '',
        staffNickname: staffNickname || '',
        address: address || '',
        nearbyStation: nearbyStation || '',
        features,
      });
    }
  }
  return venues;
}

const catLabelMap = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

/**
 * Generate SSR body content for venue detail pages.
 * Contains H1 (store name), H2s with store name, and opening paragraphs.
 * React will replace this on hydration.
 * ★ AI 검색 최적화: FAQ, 시맨틱 마크업, 키워드 밀도 강화
 */
function generateVenueSsrBody(v) {
  const name = escHtml(v.nameKo);
  const catKo = catLabelMap[v.cat] || v.cat;
  const region = escHtml(v.regionKo);
  const desc = escHtml(v.description.slice(0, 500));
  const features = v.features.slice(0, 5).map(f => escHtml(f)).join(', ');
  const staff = v.staffNickname ? escHtml(v.staffNickname) : '';

  let html = `<article itemscope itemtype="https://schema.org/NightClub">`;
  html += `<h1 itemprop="name">${name}</h1>`;
  html += `<p itemprop="description">${region} ${catKo} ${name}. ${desc}</p>`;

  if (features) {
    html += `<h2>${name} 분위기·특징</h2>`;
    html += `<p>${name}의 특징: ${features}. ${region}에서 ${catKo}을 찾는다면 ${name}이 대표적이다.</p>`;
  }

  if (staff) {
    html += `<h2>${name} 담당자 안내</h2>`;
    html += `<p>${name}은(는) ${staff}이(가) 직접 관리하는 곳이다. 방문 전 문의하면 맞춤 안내를 받을 수 있다.</p>`;
  }

  if (v.nearbyStation) {
    html += `<h2>${name} 위치·접근성</h2>`;
    html += `<p>${name}은(는) ${escHtml(v.nearbyStation)}에서 가깝다.${v.address ? ' 주소: ' + escHtml(v.address) : ''}</p>`;
  }

  // ★ FAQ 섹션 — AI가 직접 인용할 수 있는 Q&A
  html += `<section>`;
  html += `<h2>${name} 자주 묻는 질문</h2>`;
  html += `<dl>`;
  html += `<dt>${name} 어디에 있나요?</dt>`;
  html += `<dd>${name}은(는) ${region}에 위치한 ${catKo}입니다.${v.address ? ' 주소는 ' + escHtml(v.address) + '입니다.' : ''}${v.nearbyStation ? ' ' + escHtml(v.nearbyStation) + '에서 가깝습니다.' : ''}</dd>`;
  html += `<dt>${name} 영업시간은?</dt>`;
  html += `<dd>${name}의 영업시간과 실시간 정보는 놀쿨(nolcool.com)에서 확인할 수 있습니다.</dd>`;
  html += `<dt>${name} 예약 방법은?</dt>`;
  html += `<dd>${name} 방문 예약은 놀쿨에서 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}</dd>`;
  html += `<dt>${region} ${catKo} 추천은?</dt>`;
  html += `<dd>${region}에서 ${catKo}을 찾는다면 ${name}을(를) 추천합니다. 실시간 후기와 비교 정보는 놀쿨에서 확인하세요.</dd>`;
  html += `</dl>`;
  html += `</section>`;

  html += `<h2>${name} 총정리</h2>`;
  html += `<p>${region} ${catKo} ${name} — 실시간 후기, 시세, 예약 안내를 놀쿨(nolcool.com)에서 확인하세요. ${region} ${catKo} 비교, 순위, 방문 후기까지 한 곳에서 볼 수 있습니다.</p>`;
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
    { q: `${name} 어디에 있나요?`, a: `${name}은(는) ${region}에 위치한 ${catKo}입니다.${v.address ? ' 주소: ' + v.address : ''}${v.nearbyStation ? ' ' + v.nearbyStation + ' 근처입니다.' : ''}` },
    { q: `${name} 예약 방법은?`, a: `${name} 예약은 놀쿨(nolcool.com)에서 담당자에게 직접 문의할 수 있습니다.${staff ? ' 담당: ' + staff : ''}` },
    { q: `${region} ${catKo} 추천은?`, a: `${region}에서 ${catKo}을 찾는다면 ${name}을(를) 추천합니다. 놀쿨에서 실시간 후기와 비교 정보를 확인하세요.` },
    { q: `${name} 분위기는 어떤가요?`, a: `${name}은(는) ${v.features.slice(0, 3).join(', ')} 등의 특징이 있는 ${region} ${catKo}입니다.` },
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

function getHookingTitle(nameKo) {
  // Extract from seo-hooks.ts
  const regex = new RegExp(`'${nameKo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*'([^']+)'`);
  const m = seoHooksSrc.match(regex);
  return m ? m[1] : `${nameKo} — 실시간 후기·시세·예약 안내`;
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
      if (cat === 'club') {
        title = `${regionKo} 클럽 ${regionVenues.length}곳 — 오늘 밤 갈 곳 여기서 고른다`;
        desc = `${regionKo} 클럽 ${regionVenues.length}곳 비교.${topName ? ' ' + topName + ' 포함.' : ''} 입장료·분위기·영업시간 한눈에.`;
      } else if (cat === 'room') {
        title = `${regionKo} 룸 ${regionVenues.length}곳 — 인원수 말하면 딱 맞게 세팅`;
        desc = `${regionKo} 프라이빗 룸 ${regionVenues.length}곳.${topName ? ' ' + topName + ' 포함.' : ''} 인원별·용도별 비교.`;
      } else {
        title = `${regionKo} 요정 ${regionVenues.length}곳 — 격이 다른 만찬의 시작`;
        desc = `${regionKo} 전통 한정식 요정 ${regionVenues.length}곳.${topName ? ' ' + topName + ' 포함.' : ''} 코스 요리와 국악 라이브.`;
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
      regSsr += `<dd>${escHtml(regionKo)}에는 ${regionVenues.length}곳의 ${catLabelMap[cat]}이 있습니다.</dd>`;
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
]);
function getVenueOgImage(slug) {
  if (JPG_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  if (NICKNAME_OG_SLUGS.has(slug)) return `${BASE_URL}/og/${slug}.jpg`;
  return `${BASE_URL}/venues/${slug}-1.jpg`;
}

let venueCount = 0;
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;

  const hookTitle = getHookingTitle(v.nameKo);
  const desc = v.shortDesc || `${v.nameKo} — ${v.regionKo} ${cm.labelKo}. 실시간 후기·시세·예약 안내.`;

  // Route path depends on category
  let routePath;
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    routePath = `/${cm.path}/${v.region}/${v.slug}`;
  } else {
    // nights/:slug, lounges/:slug, hoppa/:slug
    routePath = `/${cm.path}/${v.slug}`;
  }

  const faqJsonLd = generateVenueFaqJsonLd(v);
  const venueJsonLd = {
    '@context': 'https://schema.org',
    '@type': v.cat === 'club' || v.cat === 'night' ? 'NightClub' : v.cat === 'lounge' || v.cat === 'hoppa' ? 'BarOrPub' : v.cat === 'yojeong' ? 'Restaurant' : 'EntertainmentBusiness',
    name: v.nameKo,
    description: v.description.slice(0, 300),
    address: { '@type': 'PostalAddress', streetAddress: v.address || `${v.regionKo} ${v.nameKo}`, addressLocality: v.regionKo, addressCountry: 'KR' },
    url: `${BASE_URL}${routePath}`,
    image: getVenueOgImage(v.slug),
  };
  if (v.staffNickname) venueJsonLd.employee = { '@type': 'Person', name: v.staffNickname };

  writePage(routePath, {
    title: hookTitle,
    description: desc,
    ogImage: getVenueOgImage(v.slug),
    ssrBody: generateVenueSsrBody(v),
    jsonLdList: [venueJsonLd, faqJsonLd]
  });
  venueCount++;
}
console.log(`✅ 업소 상세 페이지 ${venueCount}개 생성`);

// ══════════════════════════════════════════
// 5. sitemap.xml 자동 생성 — 모든 페이지 포함 보장
// ══════════════════════════════════════════
const today = new Date().toISOString().slice(0, 10);
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
// Homepage
sitemapXml += `  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
// Static pages
for (const pg of staticPages) {
  const freq = pg.path.startsWith('/community') ? 'daily' : 'weekly';
  const pri = categoryPaths.has(pg.path) ? '0.9' : pg.path.startsWith('/community') ? '0.7' : '0.7';
  sitemapXml += `  <url><loc>${BASE_URL}${pg.path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>\n`;
}
// Regional pages
for (const [cat, regions] of Object.entries(regionsByCategory)) {
  const cm = catMap[cat];
  if (!cm || !['club', 'room', 'yojeong'].includes(cat)) continue;
  for (const region of Object.keys(regions)) {
    sitemapXml += `  <url><loc>${BASE_URL}/${cm.path}/${region}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
}
// All venue detail pages — this is the critical part
for (const v of venues) {
  const cm = catMap[v.cat];
  if (!cm) continue;
  let routePath;
  if (['club', 'room', 'yojeong'].includes(v.cat)) {
    routePath = `/${cm.path}/${v.region}/${v.slug}`;
  } else {
    routePath = `/${cm.path}/${v.slug}`;
  }
  sitemapXml += `  <url><loc>${BASE_URL}${routePath}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
}
sitemapXml += `</urlset>`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);
console.log(`✅ sitemap.xml 자동 생성 (${venues.length}개 업소 포함)`);

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
    const hookTitle = getHookingTitle(vv.nameKo);
    llmsTxt += `- [${hookTitle}](${BASE_URL}${routePath})\n`;
  }
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
    const hookTitle = getHookingTitle(vv.nameKo);
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

console.log(`\n🎉 프리렌더링 완료!`);
console.log(`   정적: ${staticPages.length}개`);
console.log(`   지역별: ${regionalCount}개`);
console.log(`   업소 상세: ${venueCount}개`);
console.log(`   ────────────────`);
console.log(`   총 ${pageCount + regionalCount + venueCount}개 고유 HTML 생성`);
