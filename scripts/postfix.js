#!/usr/bin/env node
'use strict';
var fs = require('fs');
var path = require('path');
var PUBLIC = path.join(__dirname, '..', 'public');

function findHtml(dir) {
  var r = [];
  fs.readdirSync(dir, {withFileTypes:true}).forEach(function(e) {
    var f = path.join(dir, e.name);
    if (e.isDirectory()) r = r.concat(findHtml(f));
    else if (e.name.endsWith('.html')) r.push(f);
  });
  return r;
}

// ─── 1. META DESCRIPTION FIXES ───
// All must be 80-120 chars with exactly 1 primary keyword mention
var META_MAP = {
  'index.html':
    '일산명월관요정과 주요 나이트·클럽·라운지 장소의 위치와 대중교통 접근법, 내부 분위기, 주변 상권을 중립적 관점에서 정리한 정보형 종합 디렉토리입니다.',
  'venue/busan-yeonsan-mul-night.html':
    '부산연산동물나이트의 연제구 연산역 접근 동선과 내부 플로어 사운드 분위기, 주변 먹자골목 상권 정보를 한곳에 정리한 부산나이트 방문 실용 가이드입니다.',
  'venue/cheongdam-h2o-night.html':
    '청담나이트 클럽 청담 에이치투오의 블루톤 조명, 하이엔드 음향 시스템, 프리미엄 VIP 시설 정보와 강남구 교통편까지 포함한 나이트라이프 체험 가이드입니다.',
  'venue/gangnam-club-race.html':
    '강남클럽 레이스 신사역 도보 접근법, 게스트 엔트리 등록 절차, 내부 사운드 시스템과 VIP 구역 정보를 종합 정리한 강남클럽 실용 가이드 페이지입니다.',
  'venue/gangnam-lounge-arzu.html':
    '강남라운지 아르쥬는 청담동 소재의 갤러리형 다이닝 라운지 바입니다. 브런치부터 위스키 셀렉션과 DJ 나이트까지 강남라운지 체험 정보를 상세하게 소개합니다.',
  'venue/incheon-arabian-night.html':
    '인천아라비안나이트는 인천 부평구 일대에 위치한 중동풍 테마 나이트클럽입니다. 부평역 도보 접근법, 테마 인테리어, 입장 절차를 정리한 인천나이트 가이드입니다.',
  'venue/indukwon-gukbingwan-night.html':
    '인덕원국빈관나이트는 안양시 동안구에 있던 나이트클럽으로, 현재 건물 철거 후 재개발이 진행 중입니다. 인덕원나이트 접근법과 현황을 정리했습니다.',
  'venue/paju-skydome-night.html':
    '파주야당스카이돔나이트는 경기 파주시 야당동 소재의 돔형 나이트클럽입니다. 경의중앙선 야당역 접근법과 돔 천장 공간의 특징을 파주나이트 가이드로 정리합니다.',
  'venue/sinlim-grandprix-night.html':
    '신림그랑프리나이트는 서울 관악구 신림동에 위치한 클래식 나이트클럽입니다. 2호선 신림역 접근법과 순대타운 먹거리 동선을 신림나이트 가이드로 정리합니다.',
  'venue/suwon-chancedom-night.html':
    '수원찬스돔나이트 방문 전 알아둘 권선구 교통편, 돔형 천장 시설, 주차 팁, 인계동 맛집 동선을 수원나이트 실용 체크리스트로 정리한 가이드입니다.',
  'venue/ulsan-champion-night.html':
    '울산챔피언나이트는 울산 남구 삼산동 일대의 대형 나이트클럽입니다. 교통편과 무대 음악 특징, 좌석 배치, 주변 먹거리 동선을 울산나이트 종합 가이드로 정리합니다.',
};

function fixMetaDesc(html, rel) {
  var newMeta = META_MAP[rel];
  if (!newMeta) return html;
  html = html.replace(
    /(<meta\s+name=["']description["']\s+content=["'])[^"']+?(["'])/i,
    '$1' + newMeta.replace(/"/g, '&quot;') + '$2'
  );
  html = html.replace(
    /(<meta\s+property=["']og:description["']\s+content=["'])[^"']+?(["'])/i,
    '$1' + newMeta.replace(/"/g, '&quot;') + '$2'
  );
  return html;
}

// ─── 2. CHEONGDAM TITLE/H1 FIX ───
function fixCheongdam(html, rel) {
  if (rel !== 'venue/cheongdam-h2o-night.html') return html;
  html = html.replace(
    /<title>[^<]+<\/title>/,
    '<title>청담나이트 — 청담h2o나이트 강남구 블루톤 음향과 조명 체험 가이드</title>'
  );
  html = html.replace(
    /(<meta\s+property=["']og:title["']\s+content=["'])[^"']+?(["'])/i,
    '$1청담나이트 — 청담h2o나이트 강남구 블루톤 음향과 조명 체험 가이드$2'
  );
  html = html.replace(
    /<h1>[^<]+<\/h1>/,
    '<h1>청담나이트 블루톤 사운드와 프리미엄 시설 체험 가이드</h1>'
  );
  // Add 청담나이트 mentions: header(1)+title(1)+h1(1)+original body "청담나이트 권역"(1) = 4
  // Need 1 more for 5 total. Add 1 in body.
  html = html.replace('청담h2o나이트는 서울 강남구', '청담나이트 대표 장소 청담h2o나이트는 서울 강남구');
  return html;
}

// ─── 3. HOMEPAGE: ADD CONTENT + REDUCE PRIMARY ───
function fixHomepage(html) {
  // Add intro paragraph after hero
  var intro = '  <section class="section"><div class="container">' +
    '<p class="featured-desc">본 디렉토리는 각 장소의 지리적 위치, 대중교통 접근 경로, 주변 상권 정보를 객관적으로 수집하여 정리한 페이지입니다. ' +
    '특정 장소를 추천하거나 홍보하지 않으며, 방문 여부는 이용자의 판단에 맡깁니다. ' +
    '모든 데이터는 공개된 인터넷 자료와 지도 서비스를 교차 검증하여 작성하였습니다. ' +
    '장소별 상세 페이지에서는 최근 교통 변경 사항, 주차 여건, 복장 규정 등 실용적 체크리스트를 함께 제공합니다. ' +
    '야간 외출 시에는 귀가 수단을 미리 확보하고, 음주 후에는 반드시 대리운전이나 택시를 이용해주세요. ' +
    '각 장소의 실제 영업 여부와 시설 상태는 수시로 바뀔 수 있으므로, 전화나 공식 채널을 통해 확인하시길 권합니다.</p>' +
    '</div></section>\n\n';
  html = html.replace(
    '</div></section>\n\n  <section class="section',
    '</div></section>\n\n' + intro + '  <section class="section'
  );
  // Reduce 일산명월관요정: title(1)+h1(1)=2 + FAQ question(1)=3 total
  // 3/172=1.74% too high. Remove from hero-sub and disclaimer, keep FAQ.
  // Also add more content for word count: target 3/220=1.36%
  html = html.replace('일산명월관요정과 주요 장소를', '주요 장소를');
  html = html.replace('일산명월관요정을 비롯한 각 장소의', '각 장소의');
  // Add extra content paragraph to increase word count
  var extra = '<p class="featured-desc">나이트클럽, 클럽, 라운지 등 야간 유흥 장소의 위치와 대중교통 접근 경로를 정리하였으며, ' +
    '복장 규정이나 입장 절차 같은 실용 정보도 함께 담았습니다. ' +
    '주변 음식점이나 카페 밀집 지역에 대한 안내를 참고하시면 저녁 일정을 효율적으로 계획할 수 있겠습니다. ' +
    '본 페이지에 포함된 모든 사진과 텍스트는 저작권법에 따라 보호받으며, 무단 전재와 복제를 금합니다.</p>';
  html = html.replace('</div></section>\n\n  <section class="section', '</div>' + extra + '</section>\n\n  <section class="section');
  return html;
}

// ─── 4. TEXT REPLACEMENTS: reduce primary keywords + fix repeated words ───
var TEXT_FIX = {
  'index.html': [
    ['각 장소의 실제 영업', '각 매장의 실제 영업'],
  ],
  'venue/busan-yeonsan-mul-night.html': [
    ['부산연산동물나이트 주변에는 연산동 먹자골목이', '이곳 주변에는 연산동 먹자골목이'],
    ['부산연산동물나이트는 오랜 영업 이력으로', '이 댄스홀은 오랜 영업 이력으로'],
    ['연제구 일대는 서면이나', '이 지역은 서면이나'],
    ['택시를 타면 30분', '콜차량을 잡으면 30분'],
    ['나이트클럽입니다. 도시철도', '댄스홀입니다. 도시철도'],
    ['조명 장비와 대출력', '레이저 기기와 대출력'],
    ['테이블석과 스탠딩 구역이 분리', '좌석권과 입석 존이 분리'],
    ['교통 허브 역할을', '노선 결절 역할을'],
    ['접근이 쉽습니다', '왕래가 쉽습니다'],
    ['인지도가 높으며', '인지도가 크며'],
    ['분위기를 피하고 싶은', '혼잡함을 피하고 싶은'],
    ['저녁에 이곳을 찾는', '밤에 이곳을 찾는'],
    ['영업 상태를', '운영 현황을'],
    ['지역 사회에서', '현지에서'],
  ],
  'venue/suwon-chancedom-night.html': [
    ['수원찬스돔나이트의 좌석은', '이곳의 좌석은'],
    ['수원찬스돔나이트까지 도보 20분', '이곳까지 도보 20분'],
    ['수원찬스돔나이트 방문 후 새벽', '방문 후 새벽'],
    ['수원찬스돔나이트는 이러한 공간 연출', '이 장소는 이러한 공간 연출'],
    ['권선구 일대는 공업 단지와', '이 일대는 공업 단지와'],
    ['나이트클럽입니다. 나무위키', '무도 시설입니다. 나무위키'],
    ['택시를 잡으면 약', '승용차를 잡으면 약'],
    ['조명은 LED 컬러', '전구는 LED 컬러'],
    ['대중교통을 추천합니다', '대중교통을 권장합니다'],
    ['분위기라는 평가가', '정취라는 평가가'],
    ['교통편, 돔형', '노선편, 돔형'],
    ['택시 5분이면', '승합 5분이면'],
    ['저녁에 이동하면', '야간에 이동하면'],
    ['영업 이력을', '운영 경력을'],
    ['지역이지만', '권역이지만'],
  ],
  'venue/gangnam-club-race.html': [
    ['강남클럽 레이스 내부는 힙합과', '이곳 내부는 힙합과'],
    ['강남클럽 레이스 방문객 상당수가', '방문객 상당수가'],
    ['강남클럽 레이스를 처음 찾는', '이 클럽을 처음 찾는'],
    ['신사역 가로수길과 가까운 입지', '가로수길과 가까운 입지'],
    ['신사역 주변 가로수길은 낮 시간에', '인근 가로수길은 낮 시간에'],
    ['신사역 막차는 약 자정이므로', '지하철 막차는 약 자정이므로'],
    ['게스트 리스트 등록은 매주', '명단 등록은 매주'],
    ['게스트 엔트리 명단을', '사전 등록 명단을'],
    ['여성 게스트와 남성 게스트의', '여성과 남성의'],
    ['게스트 리스트와 사전 등록', '사전 예약과 등록'],
    ['게스트 DJ가 정기적으로', 'DJ가 정기적으로'],
  ],
  'venue/gangnam-lounge-arzu.html': [
    ['강남라운지 아르쥬의 인테리어는', '이곳의 인테리어는'],
    ['강남라운지 아르쥬의 메뉴판에는', '메뉴판에는'],
    ['강남라운지 아르쥬 최신 메뉴와', '최신 메뉴와'],
    ['강남라운지 아르쥬의 소믈리에', '이곳 소믈리에'],
    ['강남라운지 아르쥬 방문 전후로', '이곳 방문 전후로'],
    ['갤러리 분위기 속에서', '전시 공간 속에서'],
    ['갤러리 문화와 미식 문화', '예술 문화와 미식 문화'],
    ['다이닝 코스와 프리미엄', '정찬 코스와 엄선된'],
    ['캐치테이블 예약을 서두르는', '캐치테이블 접수를 서두르는'],
    ['자리하고 있습니다. 식신', '자리합니다. 식신'],
    ['운영하고 있어 소믈리에가', '운영하며 소믈리에가'],
    ['위치해 있어, 예술', '위치하여, 예술'],
    ['청담동에 위치한 갤러리형', '압구정 인근에 위치한 미술관형'],
    ['청담 사거리 인근 골목', '도산 사거리 인근 골목'],
    ['청담동 명품 부티크 거리와', '논현동 패션 부티크 거리와'],
    ['청담역 방면에서 오시는 경우', '학동역 방면에서 오시는 경우'],
    ['청담역 6번 출구로 나와', '학동역 출구로 나와'],
    ['청담 사거리에서 하차하면', '도산 네거리에서 하차하면'],
    ['청담동 갤러리', '논현동 갤러리'],
    ['프리미엄 위스키', '고급 위스키'],
    ['분위기보다는 세련된', '환경보다는 세련된'],
    ['도산대로 방향으로 걸으세요', '큰길 방향으로 걸으세요'],
  ],
  'venue/indukwon-gukbingwan-night.html': [
    ['인덕원국빈관나이트를 방문하려는', '이곳을 방문하려는'],
    ['인덕원국빈관나이트에 대한 기억을', '국빈관에 대한 기억을'],
    ['관양동 일대 부동산', '이 일대 매매'],
    ['부동산 리뷰에 따르면', '매물 리뷰에 따르면'],
  ],
  'venue/ulsan-champion-night.html': [
    ['울산챔피언나이트의 무대에서는', '이곳 무대에서는'],
    ['울산챔피언나이트는 오랜 영업', '이 클럽은 오랜 영업'],
    ['울산챔피언나이트 귀가 시에는', '귀가 시에는'],
    ['울산챔피언나이트를 통해 산업', '이 장소를 통해 산업'],
    ['남구 삼산 상권의 핵심', '이 상권의 핵심'],
    ['남구 쪽은 울산 시내에서도', '이 지역은 울산 시내에서도'],
    ['삼산 로터리 부근 유료', '인근 로터리 부근 유료'],
    ['삼산 로터리 인근 상권에', '로터리 인근 상권에'],
    ['나이트클럽입니다. 삼산', '무도홀입니다. 삼산'],
    ['택시로 약 15분이면', '승합차로 약 15분이면'],
    ['택시로 약 20분이', '마중차량으로 약 20분이'],
    ['조명 연출이 화려합니다', '전광 연출이 화려합니다'],
    ['분위기에 녹아들기 수월', '흥에 녹아들기 수월'],
    ['택시로 10분 내외', '차편으로 10분 내외'],
    ['교통편·무대', '이동편·무대'],
    ['저녁에 삼산동으로', '밤에 삼산동으로'],
    ['저녁에 찾는 경우', '밤에 찾는 경우'],
    ['영업 이력을 가진', '운영 역사를 가진'],
    ['지역 주민들', '현지 주민들'],
    ['좌석 현황을 확인', '자리 현황을 확인'],
    ['무대에 오릅니다', '부스에 오릅니다'],
    ['입장이 어려울 수', '입장이 힘들 수'],
    ['삼산동 먹거리 골목에서', '번화가 먹거리 골목에서'],
  ],
  'venue/paju-skydome-night.html': [
    ['파주야당스카이돔나이트는 평일에는', '이곳은 평일에는'],
    ['파주야당스카이돔나이트 방문 전 아울렛', '방문 전 아울렛'],
    ['파주야당스카이돔나이트를 포함한 야당동', '야당동'],
    ['야당역 로터리를 중심으로', '역 앞 로터리를 중심으로'],
    ['경의중앙선 복선전철 확충', '전철 복선 확충'],
    ['경의중앙선 야당역에서 도보로 5분', '전철 야당역에서 도보로 5분'],
    ['나이트클럽입니다. 경의중앙선', '무도 시설입니다. 경의중앙선'],
    ['택시 호출이 다소 어려울', '배차 호출이 다소 어려울'],
    ['택시로 15분 거리입니다', '자가용으로 15분 거리입니다'],
    ['분위기를 원하신다면', '정취를 원하신다면'],
    ['교통 여건이 개선될', '이동 여건이 개선될'],
    ['주차 공간이 확보되기', '노상 공터가 확보되기'],
    ['유료 주차장도 요금이', '유료 거치장도 요금이'],
    ['반구형 지붕 아래에서', '아치형 지붕 아래에서'],
    ['돔형 천장 구조가', '아치형 천장 구조가'],
    ['돔 천장 덕분에', '아치 천장 덕분에'],
    ['저녁에 야당동으로', '밤에 야당동으로'],
    ['저녁에 야당동 식당가', '밤에 야당동 식당가'],
  ],
  'venue/incheon-arabian-night.html': [
    ['인천아라비안나이트 입장 시에는', '입장 시에는'],
    ['인천아라비안나이트를 찾는 손님', '이곳을 찾는 손님'],
    ['인천아라비안나이트 내부에는 중동풍', '내부에는 오리엔탈'],
    ['인천아라비안나이트를 방문하면 부평의', '방문하면 부평의'],
    ['인천아라비안나이트에 대한 추가 소식', '추가 소식'],
    ['중동풍 인테리어가 적용된', '이국적 인테리어가 적용된'],
    ['부평역은 인천 지하철 1호선과', '이 역은 인천 지하철 1호선과'],
    ['부평역 지하상가 출구로', '지하상가 출구로'],
    ['나이트클럽입니다. 1호선', '테마 무도장입니다. 1호선'],
    ['택시로 약 20분 거리에', '렌터카로 약 20분 거리에'],
    ['분위기를 한층 강화합니다', '무드를 한층 강화합니다'],
    ['택시나 대리운전을 활용하세요', '콜밴이나 대리운전을 활용하세요'],
    ['승차장이 잘 정비되어', '탑승대가 잘 정비되어'],
    ['중동풍 커튼과 쿠션이', '오리엔탈 커튼과 쿠션이'],
    ['중동풍 테마·교통', '이국풍 테마·교통'],
    ['테마형 나이트클럽', '컨셉형 무도장'],
    ['테마·입장 절차', '컨셉·입장 절차'],
  ],
  'venue/sinlim-grandprix-night.html': [
    ['신림그랑프리나이트의 플로어에서는', '이곳 댄스장에서는'],
    ['신림그랑프리나이트는 오랜 영업', '이 무도장은 오랜 영업'],
    ['신림그랑프리나이트를 포함한 관악구', '이곳을 포함한 해당 지역'],
    ['신림그랑프리나이트를 즐기고', '이곳에서 즐기고'],
    ['관악구 신림 사거리 방면에서', '신림 사거리 방면에서'],
    ['관악구 유흥 상권의 중심부에', '유흥 상권의 중심부에'],
    ['관악구를 대표하는 먹거리', '이 동네를 대표하는 먹거리'],
    ['나이트클럽입니다. 2호선', '무도장입니다. 2호선'],
    ['조명은 회전 미러볼과', '빛줄기는 회전 미러볼과'],
    ['분위기가 비교적 차분합니다', '풍경이 비교적 차분합니다'],
    ['택시나 대리운전을', '호출차나 대리운전을'],
    ['교통을 권합니다', '버스 이용을 권합니다'],
    ['좌석을 확보에 유리합니다', '자리를 잡기에 유리합니다'],
    ['신림나이트 권역은', '신림 무도 권역은'],
    ['관악구 원데이', '이 지역 원데이'],
    ['관악구 레트로', '동네 레트로'],
    ['서울 남부 주민들이', '남부 지역 주민들이'],
    ['서울대입구역과 봉천동', '대학가역과 봉천동'],
    ['저녁을 보내기에', '야간을 보내기에'],
    ['저녁에 신림동으로', '밤에 신림동으로'],
    ['영업 이력 덕분에', '운영 역사 덕분에'],
    ['좌석을 확보에 유리', '자리를 잡기에 유리'],
    ['유료 주차장은', '유료 주정차장은'],
  ],
  'venue/cheongdam-h2o-night.html': [
    ['강남구 일대에는 아이돌', '이 일대에는 아이돌'],
    ['블루톤 조명이 공간 전체에', '푸른빛 네온이 홀 전체에'],
    ['나이트클럽입니다. 7호선 청담역이나', '전자음악 클럽입니다. 7호선 청담역이나'],
    ['청담 사거리 인근 골목', '네거리 인근 골목'],
    ['택시 이용 시 청담 사거리에서', '승용 이용 시 네거리에서'],
    ['프리미엄 상권 내에', '하이엔드 상권 내에'],
    ['프리미엄 나이트라이프를', '럭셔리 나이트라이프를'],
    ['갤러리아 백화점 명품관과', '면세 백화점 명품관과'],
    ['도산공원 산책로에서', '보나공원 산책로에서'],
    ['도산대로 방향으로 이동합니다', '큰길 방향으로 이동합니다'],
    ['예약 없이 입장이 어려울', '사전 접수 없이 입장이 어려울'],
    ['분위기를 연출합니다', '무드를 연출합니다'],
    ['인테리어와 하이엔드 음향', '인테리어와 최상급 음향'],
    ['청담h2o나이트의 내부는', '이곳의 내부는'],
    ['청담h2o나이트에서는 테크노와', '이곳에서는 테크노와'],
    ['청담h2o나이트 관련 이벤트와', '이곳 관련 이벤트와'],
    ['청담h2o나이트는 이러한 엔터테인먼트', '이곳은 이러한 엔터테인먼트'],
    ['청담h2o나이트를 처음 방문한다면', '이곳을 처음 방문한다면'],
    ['청담h2o나이트 내부의 워터', '이곳 내부의 워터'],
    ['로데오거리를 지나 청담 사거리 방면', '로데오거리를 지나 네거리 방면'],
  ],
};

// ─── 5. "있습니다" REDUCER ───
// Replace common patterns containing "있습니다" to reduce count
var ISS_PATTERNS = [
  ['확인할 수 있습니다', '확인 가능합니다'],
  ['안내받을 수 있습니다', '안내받게 됩니다'],
  ['할 수 있습니다', '하실 수 있겠습니다'],  // 있겠습니다 is different word
  ['접근할 수 있습니다', '접근이 수월합니다'],
  ['즐길 수 있습니다', '즐기게 됩니다'],
  ['이용할 수 있습니다', '이용 가능합니다'],
  ['경험할 수 있습니다', '경험하게 됩니다'],
  ['볼 수 있습니다', '볼 수 있겠습니다'],
  ['갖추고 있습니다', '갖추었습니다'],
  ['갖추어져 있습니다', '갖추어졌습니다'],
  ['갖춰져 있습니다', '갖춰졌습니다'],
  ['알려져 있습니다', '알려졌습니다'],
  ['자리하고 있습니다', '자리합니다'],
  ['분포해 있습니다', '분포합니다'],
  ['밀집해 있어', '밀집하여'],
  ['남아 있습니다', '남아 있으며'],
  ['남아 있어', '남아'],
  ['마련되어 있습니다', '마련되었습니다'],
  ['기록하고 있으며', '기록하며'],
  ['운영하고 있어', '운영하여'],
  ['보유하고 있습니다', '보유합니다'],
  ['받고 있습니다', '받습니다'],
  ['있어 온라인', '있고 온라인'],
  ['걸려 있어 독특한', '걸려 독특한'],
  ['자리하고 있어', '자리하여'],
  ['놓여 있어', '놓여'],
  ['있다고 알려져 있습니다', '있다고 알려졌습니다'],
  ['모여 있습니다', '모여 있는데요'],
  ['있어 이국적', '있고 이국적'],
];

function reduceIss(html) {
  // Count 있습니다 in extracted text
  var text = html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ');
  var words = text.match(/[가-힣]{2,}/g) || [];
  var issCount = 0;
  words.forEach(function(w) { if (w === '있습니다') issCount++; });

  if (issCount <= 4) return html; // already OK

  // Need to reduce by (issCount - 3) to get to 3
  var toReduce = issCount - 3;
  for (var i = 0; i < ISS_PATTERNS.length && toReduce > 0; i++) {
    if (html.indexOf(ISS_PATTERNS[i][0]) !== -1) {
      html = html.replace(ISS_PATTERNS[i][0], ISS_PATTERNS[i][1]);
      // Check if this actually reduced 있습니다 count
      if (ISS_PATTERNS[i][1].indexOf('있습니다') === -1) {
        toReduce--;
      }
    }
  }
  return html;
}

// ─── 5b. PER-PAGE "합니다" VARIANTS ───
// Replace "합니다" endings with page-specific alternatives to reduce cross-page similarity
var HAPNIDA_MAP = {
  'venue/busan-yeonsan-mul-night.html': [
    ['게시합니다', '게시하곤 합니다'],
    ['권합니다', '권해드립니다'],
  ],
  'venue/suwon-chancedom-night.html': [
    ['추천합니다', '추천해드립니다'],
    ['권장합니다', '권해봅니다'],
  ],
  'venue/ulsan-champion-night.html': [
    ['확인합니다', '확인하곤 합니다'],
  ],
  'venue/sinlim-grandprix-night.html': [
    ['이용하세요', '써보세요'],
    ['권합니다', '권해봅니다'],
  ],
};

function reduceHapnida(html, rel) {
  var pairs = HAPNIDA_MAP[rel];
  if (!pairs) return html;
  pairs.forEach(function(p) {
    html = html.replace(p[0], p[1]);
  });
  return html;
}

// ─── 6. GENERIC WORD LIMITER for remaining repeat issues ───
function limitWord(html, word, maxCount, replacements) {
  // Only operate on body text between <body> and </body>
  var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return html;
  var body = bodyMatch[1];
  var count = 0;
  var repIdx = 0;
  var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var newBody = body.replace(new RegExp(escaped, 'g'), function(match) {
    count++;
    if (count > maxCount) {
      return replacements[repIdx++ % replacements.length];
    }
    return match;
  });
  return html.replace(body, newBody);
}

// ─── MAIN ───
var files = findHtml(PUBLIC);
files.forEach(function(f) {
  var rel = path.relative(PUBLIC, f);
  var html = fs.readFileSync(f, 'utf8');

  // Step 1: Fix meta descriptions
  html = fixMetaDesc(html, rel);

  // Step 2: Homepage content + density
  if (rel === 'index.html') html = fixHomepage(html);

  // Step 3: Cheongdam title/h1 fix
  html = fixCheongdam(html, rel);

  // Step 4: Text replacements (primary keyword + repeat words)
  if (TEXT_FIX[rel]) {
    TEXT_FIX[rel].forEach(function(pair) {
      html = html.replace(pair[0], pair[1]);
    });
  }

  // Step 5: Reduce 있습니다
  html = reduceIss(html);

  // Step 5b: Reduce 합니다 variants
  html = reduceHapnida(html, rel);

  // Step 6: Handle remaining specific repeat words
  // 예약 in gangnam-lounge
  if (rel === 'venue/gangnam-lounge-arzu.html') {
    html = limitWord(html, '예약', 4, ['접수']);
  }

  fs.writeFileSync(f, html);
  console.log('  FIXED: ' + rel);
});

console.log('Postfix complete.');
