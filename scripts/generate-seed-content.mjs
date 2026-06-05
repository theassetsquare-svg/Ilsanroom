#!/usr/bin/env node
/**
 * ★ 커뮤니티 시드 콘텐츠 자동 생성
 * venues.ts에서 업소 데이터를 읽고, 업소별 후기/팁/Q&A를 생성
 * 출력: SQL INSERT문 → 사용자가 Supabase에서 직접 실행
 *
 * 규칙:
 * - AI 냄새 절대 금지 → 실제 사람이 쓴 것처럼
 * - 금지어: 2차, 무료체험, 성매매 암시어
 * - 가격 비노출
 * - 각 업소별 UNIQUE 콘텐츠
 */
import fs from 'fs';

const venuesSrc = fs.readFileSync('src/data/venues.ts', 'utf8');

function parseVenues() {
  const venues = [];
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
    const nearbyStation = block.match(/nearbyStation:\s*'([^']+)'/)?.[1];
    const features = [];
    const featMatch = block.match(/features:\s*\[([^\]]*)\]/);
    if (featMatch) {
      const fItems = featMatch[1].match(/'([^']+)'/g);
      if (fItems) fItems.forEach(f => features.push(f.replace(/'/g, '')));
    }
    const atmosphere = [];
    const atmoMatch = block.match(/atmosphere:\s*\[([^\]]*)\]/);
    if (atmoMatch) {
      const aItems = atmoMatch[1].match(/'([^']+)'/g);
      if (aItems) aItems.forEach(a => atmosphere.push(a.replace(/'/g, '')));
    }
    const bestTime = block.match(/bestTime:\s*'([^']+)'/)?.[1] || '';
    const dressCode = block.match(/dressCode:\s*'([^']+)'/)?.[1] || '';

    if (slug && cat && region) {
      venues.push({ slug, cat, region, regionKo: regionKo || '', nameKo: nameKo || slug, shortDesc: shortDesc || '', description: desc || '', staffNickname: staffNickname || '', nearbyStation: nearbyStation || '', features, atmosphere, bestTime, dressCode });
    }
  }
  return venues;
}

const catLabelMap = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

// ── 닉네임 풀 (실제 사람처럼) ──
const nicknames = [
  '밤산책러', '금토전사', '댄스중독', '혼술파', '새벽감성', '불금마스터',
  '주말탈출', '노는게제일좋아', '야행성인간', '파티피플', '사교맨',
  '밤하늘별', '클럽초보', '직장인탈출', '퇴근후한잔', '춤추는곰',
  '분위기캐치', '소주한잔', '양주파', '맥주매니아', '불토마감',
  '놀자놀자', '힙합러버', '트로트킹', 'DJ추종자', '밤바리',
  '열정파', '자유영혼', '금요일왕', '늦은밤', '나이트라이프탐험가',
  '새벽두시', '카운터석단골', '첫방문자', '재방문러', '추천받아왔어',
  '동네토박이', '출장족', '여행자', '데이트코스', '친구모임',
  '생일파티', '퇴근파', '스트레스해소', '월급날기념', '연말모임'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function esc(s) { return s.replace(/'/g, "''"); }

// 과거 날짜 생성 (최근 30일 내)
function randomDate() {
  const now = Date.now();
  const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

// ── 후기 템플릿 (업종별) ──
function generateReviews(v) {
  const name = v.nameKo;
  const region = v.regionKo;
  const catKo = catLabelMap[v.cat] || v.cat;
  const feat = v.features.slice(0, 2).join(', ');
  const staff = v.staffNickname;

  const templates = {
    night: [
      { title: `${name} 첫 방문 후기`, content: `${region}에서 ${catKo} 찾다가 ${name} 갔는데 진짜 괜찮았음. ${feat ? feat + ' 이런 특징이 있어서 ' : ''}분위기가 딱 내 스타일이었음. 밴드 라이브 퀄리티가 생각보다 높아서 놀람. 처음이라 좀 쭈뼛거렸는데 옆 테이블 분이 먼저 말 걸어줘서 금방 적응함${staff ? '. ' + staff + ' 실장한테 자리 안내받았는데 센스있더라' : ''}. 다음 주말에 또 갈 예정.`, rating: 5 },
      { title: `금토 밤 ${name} 다녀왔습니다`, content: `친구가 ${name} 추천해줘서 토요일에 갔는데 사람 꽤 많더라. ${region} 쪽에서는 여기가 젤 유명한 듯. 음악은 트로트 위주인데 올드팝도 섞어주니까 다양하게 즐길 수 있었음. 댄스 플로어 크기도 적당하고 조명도 좋았음. 주차는 좀 일찍 가야 자리 있을듯.`, rating: 4 },
      { title: `${region} ${catKo} 비교해봤는데`, content: `${region}에서 ${catKo} 3군데 돌아봤는데 ${name}${v.nameKo.endsWith('트') ? '이' : '가'} 제일 나았음. 시설도 깨끗하고 음향도 좋고. 특히 밴드 실력이 다름. 스텝 잘 못 춰도 분위기에 취해서 그냥 몸이 움직여짐ㅋㅋ 혼자 온 사람도 꽤 많아서 부담없이 갈 수 있음.`, rating: 5 },
    ],
    club: [
      { title: `${name} 솔직후기`, content: `${region} ${catKo} 중에 ${name} 처음 가봤는데 음악이 진짜 좋았음. DJ가 분위기 읽는 능력이 대단함. EDM 좋아하는 사람이면 무조건 가야 됨. 드레스코드 있으니까 운동화는 안 됨. 밤 12시 넘으면 대기 있을 수 있으니 일찍 가는 게 좋음.`, rating: 5 },
      { title: `주말 ${name} 갔다왔음`, content: `금요일 밤에 갔는데 줄 서서 20분 기다림. 근데 들어가니까 기다린 보람 있었음. ${feat ? feat + ' 이게 진짜 좋았고 ' : ''}사운드 시스템이 제대로임. VIP 쪽은 테이블 잡으면 편하게 놀 수 있음. ${region}에서 밤놀이 하려면 여기가 답인듯.`, rating: 4 },
      { title: `${name} 분위기 어떤지 궁금한 분들께`, content: `저번 주 처음 가봤는데 ${region}에서 이 정도 ${catKo}는 처음이었음. 조명이랑 인테리어가 확실히 돈 쓴 느낌. 음악 장르도 다양하게 틀어줌. 사람들 매너도 좋고 스태프들도 친절했음. 단점이라면 주말엔 너무 사람 많다는 거?`, rating: 4 },
    ],
    hoppa: [
      { title: `${name} 다녀온 후기 (여성)`, content: `친구랑 둘이서 ${name} 갔는데 되게 재밌었음. 호스트분들이 대화를 잘 이끌어줘서 어색한 순간이 없었음. ${region} 쪽에서 여기만한 데 없는 것 같음. ${staff ? staff + '한테 예약했는데 좋은 자리로 안내해줌. ' : ''}분위기도 깔끔하고 안전한 느낌이어서 다음에 또 가려구요.`, rating: 5 },
      { title: `${region} ${catKo} 찾는 분들 참고`, content: `${name} 몇 번째 방문인데 항상 만족함. 호스트 선택폭이 넓어서 좋고 강요하는 분위기가 아니라 편함. ${feat ? '특히 ' + feat + ' 부분이 마음에 듦. ' : ''}친구들한테도 추천해줬더니 다들 괜찮다고 하더라.`, rating: 5 },
    ],
    room: [
      { title: `${name}에서 모임했는데 만족`, content: `회사 동료들이랑 ${name}에서 모임했는데 룸 크기가 딱 좋았음. 음향 시설도 괜찮고 서비스도 빠름. ${staff ? staff + '이 세팅 잘 해줘서 ' : ''}불편한 거 없이 잘 놀았음. ${region}에서 프라이빗하게 놀기 좋은 곳.`, rating: 5 },
      { title: `${region} 룸 여기 추천`, content: `몇 군데 비교해봤는데 ${name}이 시설 면에서 가장 나았음. 룸 종류도 다양하고 인원수에 맞게 추천해줌. 양주 라인업도 괜찮고. 프라이빗한 공간이 필요하면 여기 가면 됨.`, rating: 4 },
    ],
    lounge: [
      { title: `${name} 분위기 최고`, content: `조용하게 한 잔 하고 싶을 때 ${name} 감. ${region}에서 이런 분위기 찾기 쉽지 않은데 여기는 확실히 다름. 인테리어가 고급스럽고 음악도 잔잔해서 대화하기 좋음. 데이트 코스로 추천.`, rating: 5 },
    ],
    yojeong: [
      { title: `${name} 접대로 이용해봤는데`, content: `거래처 접대 자리로 ${name} 이용했는데 상대방이 굉장히 만족하셨음. 한정식 코스가 퀄리티 높고 국악 라이브도 격식 있어서 분위기 잡기 좋았음. ${staff ? staff + '이 전체 진행을 잘 해줘서 ' : ''}편하게 진행함.`, rating: 5 },
    ],
  };

  return (templates[v.cat] || templates.night).map(t => ({
    ...t,
    category: 'reviews',
    venue_slug: v.slug,
    nickname: pick(nicknames),
    created_at: randomDate(),
  }));
}

// ── 팁 글 ──
function generateTips(v) {
  const name = v.nameKo;
  const region = v.regionKo;
  const catKo = catLabelMap[v.cat] || v.cat;

  const tips = [
    { title: `${name} 처음 가는 분들 팁`, content: `${name} 몇 번 가봤는데 알게 된 것들 공유함.\n\n1. ${v.bestTime ? '가장 좋은 시간대는 ' + v.bestTime : '주말은 10시 이후가 피크'}\n2. ${v.dressCode ? '복장은 ' + v.dressCode : '깔끔한 캐주얼이면 충분'}\n3. ${v.nearbyStation ? v.nearbyStation + '에서 가까움' : '택시 타고 가는 게 편함'}\n4. 혼자 가도 전혀 어색하지 않음\n\n${region} ${catKo} 중에 ${name}이 무난하고 좋음.`, category: 'tips', nickname: pick(nicknames), created_at: randomDate() },
  ];
  return tips;
}

// ── Q&A 글 ──
function generateQnA(v) {
  const name = v.nameKo;
  const region = v.regionKo;
  const catKo = catLabelMap[v.cat] || v.cat;

  return [
    { title: `${name} 가보신 분?`, content: `${region}에서 ${catKo} 가보려고 하는데 ${name} 어떤지 아시는 분 계신가요? 처음이라 좀 긴장되는데 혼자 가도 괜찮을까요? 분위기랑 사람들 매너 어떤지 알려주시면 감사하겠습니다.`, category: 'discussion', nickname: pick(nicknames), created_at: randomDate() },
  ];
}

// ══════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════
const venues = parseVenues();
console.log(`📝 ${venues.length}개 업소 시드 콘텐츠 생성 시작\n`);

let sql = `-- ★ 놀쿨 커뮤니티 시드 콘텐츠 — ${new Date().toISOString().slice(0,10)} 자동 생성
-- 실행 방법: Supabase SQL Editor에 붙여넣기 후 실행
-- 주의: user_id는 NULL (시스템 글), 닉네임은 별도 표시용

`;

let totalPosts = 0;

for (const v of venues) {
  const reviews = generateReviews(v);
  const tips = generateTips(v);
  const qna = generateQnA(v);
  const allPosts = [...reviews, ...tips, ...qna];

  sql += `\n-- ── ${v.nameKo} (${v.regionKo} ${catLabelMap[v.cat]}) ──\n`;

  for (const post of allPosts) {
    sql += `INSERT INTO posts (category, title, content, venue_slug, rating, likes, views, is_pinned, created_at, updated_at) VALUES ('${esc(post.category)}', '${esc(post.title)}', '${esc(post.content)}', ${post.venue_slug ? `'${esc(post.venue_slug)}'` : 'NULL'}, ${post.rating || 'NULL'}, ${Math.floor(Math.random() * 30 + 5)}, ${Math.floor(Math.random() * 200 + 50)}, false, '${post.created_at}', '${post.created_at}');\n`;
    totalPosts++;
  }
}

// 자유게시판 시드 글
sql += `\n-- ── 자유게시판 시드 ──\n`;
const freeTopics = [
  { title: '금요일인데 어디 갈지 못 정했음', content: '강남 쪽에서 놀건데 클럽이랑 나이트 고민 중.. 클럽은 시끄럽고 나이트는 나이대가 좀 있고.. 추천 좀요', nickname: pick(nicknames) },
  { title: '혼자 나이트 간 썰', content: '처음에 개쫄았는데 막상 가니까 혼자 온 사람 진짜 많더라ㅋㅋ 옆 테이블 아저씨가 먼저 춤 신청해주셔서 감동받음. 이제 매주 감', nickname: pick(nicknames) },
  { title: '클럽 드레스코드 질문', content: '이번 주말 강남 클럽 가려는데 운동화 되나요? 찾아보니까 어떤 데는 되고 어떤 데는 안 되고 헷갈림', nickname: pick(nicknames) },
  { title: '부산 출장인데 밤에 갈 곳', content: '해운대 근처에서 숙소 잡았는데 밤에 혼자 갈 만한 곳 있나요? 조용한 데가 좋긴 한데 사람 만나고 싶기도 하고', nickname: pick(nicknames) },
  { title: '나이트 처음인데 스텝 몰라도 괜찮나요', content: '유튜브로 지르박 봤는데 실전은 다르다고 하더라고요.. 초보자도 가면 적응 가능한가요? 주변에 같이 갈 사람도 없고', nickname: pick(nicknames) },
  { title: '오늘 불금인데 같이 갈 사람', content: '강남 쪽에서 놀 건데 남자 2명임. 나이트든 클럽이든 같이 갈 사람 구함. 20대 후반 직장인', nickname: pick(nicknames) },
  { title: '라운지 vs 클럽 뭐가 더 좋음?', content: '데이트로 가려는데 라운지가 나을까 클럽이 나을까.. 여자친구가 시끄러운 거 별로 안 좋아하는데 그래도 분위기는 있었으면', nickname: pick(nicknames) },
  { title: '놀쿨에서 후기 보고 갔는데 대만족', content: '원래 아는 곳만 가다가 놀쿨에서 새로운 데 찾아서 갔는데 진짜 좋았음. 후기 믿어도 됨. 앞으로 여기서 계속 찾을 듯', nickname: pick(nicknames) },
];

for (const post of freeTopics) {
  sql += `INSERT INTO posts (category, title, content, venue_slug, rating, likes, views, is_pinned, created_at, updated_at) VALUES ('free', '${esc(post.title)}', '${esc(post.content)}', NULL, NULL, ${Math.floor(Math.random() * 50 + 10)}, ${Math.floor(Math.random() * 300 + 100)}, false, '${randomDate()}', '${randomDate()}');\n`;
  totalPosts++;
}

// 파일 저장
const outPath = 'scripts/seed-content.sql';
fs.writeFileSync(outPath, sql);
console.log(`✅ 총 ${totalPosts}개 시드 글 생성 완료`);
console.log(`📄 파일: ${outPath}`);
console.log(`\n💡 실행 방법:`);
console.log(`   1. Supabase 대시보드 → SQL Editor`);
console.log(`   2. ${outPath} 내용 복사 → 붙여넣기`);
console.log(`   3. Run 클릭`);
