-- ═══════════════════════════════════════════════════════
-- 24시간 자동 콘텐츠 생성 시스템
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

-- 1. 가상 유저 테이블 (시드 콘텐츠 전용)
CREATE TABLE IF NOT EXISTS seed_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  is_seed BOOLEAN DEFAULT TRUE
);

-- 가상 유저 50명 삽입 (이미 있으면 무시)
INSERT INTO seed_authors (nickname) VALUES
  ('강남불주먹'), ('택시비폭탄'), ('부산바다남'), ('수원첫방문'), ('강남프린스'),
  ('새벽감성러'), ('첫호빠녀'), ('접대성공'), ('홍대미아'), ('압구정도련님'),
  ('나이트고수'), ('처음이라'), ('부산갈매기'), ('야근탈출'), ('혼놀러'),
  ('대전사나이'), ('인싸되고싶다'), ('소주파이터'), ('라운지초보'), ('일산토박이'),
  ('대구형님'), ('새벽감성'), ('접대왕'), ('가성비왕'), ('금요일좋아'),
  ('첫클럽녀'), ('인천터미널'), ('수원조각'), ('퇴근후맥주'), ('호빠고수녀'),
  ('광주사자'), ('헬스끝나이트'), ('양주초보'), ('울산코알라'), ('불금전사'),
  ('클럽중독'), ('강남유령'), ('부산파도'), ('새벽택시'), ('인생한방'),
  ('소주천잔'), ('퇴근전사'), ('대전사람'), ('춤초보'), ('일산시민'),
  ('감성충만'), ('가성비킹'), ('호빠퀸'), ('주말전사'), ('서울야경')
ON CONFLICT DO NOTHING;

-- 2. 시드 글 풀 테이블
CREATE TABLE IF NOT EXISTS seed_post_pool (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- 시드 글 200개 삽입 (카테고리별로 분산)
INSERT INTO seed_post_pool (category, title, content) VALUES
-- 자유 게시판 (free)
('free', '택시비가 술값보다 나온 사람 나만?? ㅋㅋ', '어젯밤 강남에서 집까지 택시 3만5천원 나왔는데 술값 2만원이었음ㅋㅋㅋ 다음부턴 걸어가야하나 심각하게 고민중'),
('free', '어젯밤 일 아직도 술깸ㅋㅋ', '금요일에 양주 2병 까고 토요일 저녁에 일어남.. 이게 사는건가 싶다 근데 또 가고싶음 어쩌지'),
('free', '야근탈출하고 바로 클럽간 사람 있음?', '금요일 9시에 퇴근해서 씻지도 않고 바로 강남 감ㅋㅋ 넥타이 풀면서 입장했는데 오히려 인기많았음'),
('free', '새벽 2시에 혼자 택시타고 집 가면서 듣는 발라드', '아무도 모르겠지만 이 시간이 제일 감성적임ㅠ 오늘도 잘놀았다 내일 출근인데 ㅋㅋ'),
('free', '월요일인데 벌써 금요일 계획 세우는중ㅋ', '이번주는 홍대 갈까 강남 갈까 부산 원정 갈까 고민하는게 일주일의 즐거움'),
('free', '퇴근하고 혼술하다가 여기 들어옴', '소맥 한잔 하면서 놀쿨 보는게 요즘 루틴인데 나만 그럼? 후기 보면서 다음 갈 곳 정하는중'),
('free', '헬스장 갔다가 나이트 가는 사람 나밖에 없지ㅋㅋ', '운동하고 샤워하고 바로 나이트 가면 컨디션 최고임 근데 다음날 근육통이 술깸이랑 같이 와서 죽음'),
('free', '어제 양주 3병 까고 살아남은 나 칭찬해줘', '진심 필름 끊겼는데 카드값 보고 기절할뻔 ㅋㅋ 근데 같이 간 애들이 재밌었대 다행이다'),
('free', '이번주 불금은 진짜 역대급으로 놀거임 선언', '월급도 들어왔고 스트레스도 쌓였고 이번주는 진짜 미친듯이 놀거다 누구 같이갈사람??'),
('free', '나이트 갔다가 아는 사람 만남ㅋㅋ', '세상 좁다는 게 이런건가 회사 동료를 나이트에서 만남 둘 다 어색해서 모른척 했음ㅋㅋㅋ'),
('free', '오늘 비 오는데 나이트 가면 사람 없겠지?', '비 오는 날 오히려 분위기 좋다는 말도 있던데 가본 사람 있음??'),
('free', '강남 택시 잡는 꿀팁 알려줌', '새벽에 강남역 말고 좀 걸어서 논현쪽에서 잡으면 바로 옴 이거 진짜 꿀팁임 아무한테도 말하지마'),
('free', '나이트 가기 전에 뭐 먹고가?', '빈속에 술 마시면 바로 뻗는데 뭐 먹고가야 오래 놀수있어? 고기? 밥? 라면?'),
('free', '클럽 갔는데 DJ가 내 요청곡 틀어줌ㅋㅋ', '원래 안 해준다는데 계속 부탁하니까 틀어줬음 그 순간 홀 분위기 미침 ㅋㅋ'),
('free', '술 안 마시고 나이트 간 사람 있어?', '운전해야해서 물만 마시면서 춤췄는데 솔직히 술 없어도 재밌더라 이게 가능한건가'),
('free', '친구 생일에 나이트 가려는데 추천좀', '3명인데 테이블 잡아야하나 그냥 가야하나 강남쪽으로 생각중인데 조언 부탁'),
('free', '나이트에서 찍은 셀카가 제일 잘나옴ㅋㅋ', '조명빨인건 아는데 그래도 인생샷 나옴 프사 바꿀까 고민중'),
('free', '매주 가면 실장이 알아보기 시작함', '처음엔 그냥 손님이었는데 이제 가면 "형 왔어?" 해줌ㅋㅋ 단골의 맛'),
('free', '나이트 갔다가 지갑 잃어버린 적 있음?', '어제 잃어버렸는데 다행히 실장님이 보관하고 계셨음 진짜 감사해서 다음에 양주 한병 쏘기로 함'),
('free', '요즘 나이트 노래 뭐가 인기야?', '트로트 말고 요즘 세대 노래도 나오나? 2030 많은 데 추천해줘'),

-- 후기 (reviews)
('reviews', '레이스 금요일 다녀옴 역시 사운드 미쳤다', '사운드 진짜 미쳤음 특히 2층 VIP쪽 앉으면 소리가 딱 좋음 웨이터도 친절하고 부킹도 잘됨 금요일은 사람 많으니까 일찍 가는게 좋음'),
('reviews', '찬스돔 부킹 솔직후기', '실장님이 진짜 프로임 자리 배치도 잘해주고 분위기 잡아줌 가격은 뭐 수원치고 적당한편 다만 주말에는 진짜 사람 많음'),
('reviews', '일산 라붐 리뉴얼 다녀왔는데 인테리어 쩔더라', '리뉴얼 하고 완전 달라짐 LED 조명이랑 소파가 호텔급임 음향도 업그레이드됨 일산 사는 사람이면 한번은 가봐야함'),
('reviews', '고구려나이트 토요일 갔는데 사람 미쳤음', '부산 가면 꼭 가는 곳인데 토요일은 ㄹㅇ 전쟁터임 부킹 경쟁 치열하고 밴드 라이브 퀄리티 최고 일찍 가서 자리 잡아야함'),
('reviews', '아르쥬 VIP 후기 돈값은 하는듯', '강남 프리미엄 가격이긴 한데 서비스가 확실히 다름 전담 매니저가 붙어서 케어해줌 접대용으로는 최고인듯'),
('reviews', '대전 세븐나이트 웨이터가 진짜 프로임', '처음 가봤는데 웨이터분이 분위기 잡아주고 부킹도 자연스럽게 연결해줌 대전에 이런데가 있었나 싶음'),
('reviews', '인천 라운지 가봤는데 강남이랑 비교불가', '솔직히 인천이라 기대 안했는데 분위기 좋고 칵테일 맛있고 가격도 착함 오히려 강남보다 가성비 좋을수도'),
('reviews', '거래처 모시고 요정 갔더니 계약 따냄ㅋㅋ', '농담아니고 실화임 분위기 좋고 음식 맛있고 거래처 사장님이 감동받으셔서 그자리에서 계약서 사인함 요정 무시하면 안됨'),
('reviews', '광주 나이트 분위기 생각보다 괜찮던데?', '서울만 좋은줄 알았는데 광주도 나이트 분위기 괜찮음 사람들도 친절하고 가격도 서울의 반값 수준'),
('reviews', '울산 나이트 3곳 비교 결론은 하나임', '챔피언 > 나머지 솔직히 울산에서는 챔피언이 넘사벽임 사운드 분위기 서비스 다 1등'),
('reviews', '강남 레이스 첫방문 후기 솔직하게', '소문대로 사운드 좋고 사람 많음 근데 금요일은 너무 붐벼서 좀 힘들었음 토요일이 더 나을듯 웨이터 친절'),
('reviews', '홍대 버뮤다 주말 다녀옴', '홍대 특유의 자유로운 분위기가 좋음 20대 많고 음악 센스 좋음 가격도 강남보다 착해서 자주 갈듯'),
('reviews', '수원 나이트 처음 가본 후기', '서울까지 안가도 되겠다 싶을정도로 괜찮았음 실장님이 초보인 나한테 잘 알려줘서 편하게 놀았음'),
('reviews', '대구 나이트 다녀옴 분위기 ㄹㅇ', '대구 사람들 놀줄 안다는 말이 괜히 있는게 아님 분위기 미쳤고 사람들도 좋음 또 갈거임'),
('reviews', '일산 요정 접대로 갔는데 거래처가 감동함', '명월관 갔는데 음식도 술도 분위기도 다 좋았음 거래처 사장님이 "여기 어떻게 알았냐"면서 좋아하심'),

-- 팁 (tips)
('tips', '입장료 아끼는 법 3가지 진짜 됨', '1.일찍 가면 프리 입장 많음 2.SNS 팔로우하면 할인 3.단체로 가면 할인해주는 곳 많음 이거 진짜 됨'),
('tips', '부킹 잘 되는 자리 위치 공개함', '무대 기준으로 오른쪽 2번째~3번째 테이블이 부킹 가장 잘됨 웨이터 동선이랑 시야 확보가 다 되는 자리임'),
('tips', '클럽 처음 가는 사람 복장 꿀팁 남자편', '청바지+흰셔츠+깔끔한 운동화 이게 정답임 너무 꾸미면 오히려 튀고 너무 편하면 입장 거절당함 적당히가 베스트'),
('tips', '호빠에서 대접 잘 받는 꿀팁 5가지', '1.첫방문이라 말하기 2.선수한테 관심표현 3.팁 적당히 주기 4.시간 여유롭게 5.친구랑 같이가기 이러면 대접 달라짐'),
('tips', '강남에서 10만원 이하로 노는 법', '1.해피아워 노리기 2.테이블 말고 바카운터 3.양주 대신 하이볼 4.입장료 무료 시간대 5.택시 대신 지하철 막차 이러면 됨'),
('tips', '나이트 가기 전 준비물 체크리스트', '신분증 필수 현금 좀 챙기기 핸드폰 풀충전 편한신발 향수 한번 뿌리기 이정도면 준비 끝'),
('tips', '양주 주문할 때 초보 안 들키는 법', '윈저 발렌타인 잭다니엘 이 세개만 알면 됨 "윈저 하나요" 이러면 자연스러움 괜히 어려운거 시키면 더 티남'),
('tips', '라운지 혼자 가서 안 어색한 방법', '바카운터에 앉아서 바텐더한테 칵테일 추천 받으면 됨 대화하다보면 자연스럽게 분위기 탐 혼자 온 사람 생각보다 많음'),
('tips', '접대할 때 요정 예약하는 법', '최소 하루 전에 예약하고 인원수 정확하게 예산 미리 말하면 맞춰줌 처음이면 솔직하게 처음이라고 하는게 나음'),
('tips', '나이트 부킹 매너 정리해봄', '1.거절당해도 기분나빠하지 않기 2.대화할때 존댓말 3.무리한 요구 안하기 4.한잔만 같이 하자 이정도만 하면 인기남됨'),

-- Q&A (discussion)
('discussion', '호빠 혼자 가면 진짜 괜찮음??', '처음인데 친구가 못간대 혼자 가도 되는건지 분위기가 어색하진 않은지 가본 사람 알려줘'),
('discussion', '룸 갈때 양주 뭐 시켜야됨?', '진심 모르겠음 메뉴판에 양주가 너무 많은데 가성비 좋은거 추천해줘 처음이라 쪽팔림'),
('discussion', '라운지 혼자 가면 좌석 어디 앉음?', '혼자 라운지 가보고 싶은데 2인 테이블 혼자 차지하면 눈치보이지 않음? 바카운터가 나은가?'),
('discussion', '여자 혼자 클럽 가도 괜찮아?', '솔직하게 말해줘 위험하진 않은지 어떤 클럽이 안전한지 경험 있는 사람 알려줘 진심 궁금'),
('discussion', '양주 종류가 너무 많은데 뭐 시켜야 안 망함?', '위스키 보드카 브랜디 럼 뭐가 뭔지도 모르겠고 그냥 무난한거 추천해줘'),
('discussion', '나이트 처음인데 혼자 가도 됨?', '주변에 같이 갈 사람이 없는데 혼자 가면 어색한거 아닌지 경험자 솔직한 답변 부탁'),
('discussion', '클럽 드레스코드 어디까지 허용됨?', '청바지 운동화 되나? 안되면 뭐 입어야하는지 알려줘 옷 사러가야할수도'),
('discussion', '접대 처음인데 어디가 좋아?', '거래처 사장님 모시고 가야하는데 룸이 나은지 요정이 나은지 예산은 인당 20정도'),
('discussion', '나이트 몇시에 가야 제일 좋음?', '너무 일찍 가면 사람 없고 너무 늦게 가면 자리 없다는데 딱 좋은 시간대가 언제야?'),
('discussion', '2차 어디로 가면 좋을까?', '나이트 끝나고 새벽인데 2차 갈만한 곳 추천좀 강남 기준으로'),

-- 모집 (party)
('party', '토요일 강남 같이 갈 사람 2명 구함', '이번주 토요일 밤 10시 강남 레이스 같이 갈 사람 구함 현재 2명 있고 2명 더 구합니다 테이블 엔빵'),
('party', '금요일 홍대 같이 놀 사람??', '불금 홍대에서 같이 놀 사람 구함 남녀 상관없고 20대 30대 다 환영 현재 3명'),
('party', '부산 고구려 주말 조각 급구', '이번주 금요일 부산 고구려 갈건데 4명 더 필요함 해운대 근처 숙소도 있으니까 편하게 연락주세요'),
('party', '수원 찬스돔 오늘 벙개 갈 사람!!', '갑자기 놀고싶어져서 오늘 밤 찬스돔 갈건데 같이 갈 사람 1명만 더 구함 테이블비 엔빵'),
('party', '대전 나이트 주말 같이 가실 분', '대전 세븐나이트 같이 갈 사람 구합니다 현재 2명이고 혼성 5명 목표 토요일 9시'),
('party', '일산 라붐 이번주 같이 가실분', '일산 라붐 금요일에 갈건데 2명 더 구합니다 테이블 잡을거고 엔빵 20대 30대 환영'),
('party', '강남 호빠 첫방문 같이 갈 여자분', '호빠 가보고 싶은데 혼자 가기 좀 그래서 같이 갈 분 구합니다 토요일 저녁 강남'),
('party', '대구 나이트 크루 모집', '대구에서 매주 나이트 같이 갈 크루 모집합니다 남녀 상관없고 20대~40대 누구나'),
('party', '이태원 라운지 소규모 모임', '이태원 라운지에서 조용하게 술 한잔 하실 분 구합니다 4명 정도 금요일 저녁'),
('party', '인천 주말 나이트 멤버 모집', '인천에서 주말마다 나이트 갈 멤버 모집합니다 남녀무관 재미있게 놀 수 있는 분')
ON CONFLICT DO NOTHING;

-- 3. 시드 댓글 풀 테이블
CREATE TABLE IF NOT EXISTS seed_comment_pool (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

INSERT INTO seed_comment_pool (content) VALUES
  ('ㄹㅇ 여기 안 가본 사람 없을듯ㅋㅋ'),
  ('아니 이 가격에 이 퀄이면 미친거 아님?'),
  ('택시비 아끼려고 걸어감 ← 나임 ㅋㅋㅋ'),
  ('한번 가면 매주 가게됨 중독주의 ㄹㅇ'),
  ('혼자가도 재밌음 진심 걱정 ㄴㄴ'),
  ('여기서 여친 만남 ㅋㅋ 아직도 사귐'),
  ('양주 3병 까고 필름 끊겼는데 카드값 보고 기절'),
  ('퇴근 후 여기 오는 게 인생낙인듯'),
  ('대전에도 이런데가 있었음?? 진짜 몰랐네'),
  ('지르박 배우는 중인데 나이트 가도 됨??ㅋㅋ'),
  ('일산 라붐 진짜 리뉴얼 잘했더라 인정'),
  ('새벽 2시 나이트 나오면서 듣는 발라드 ㅠㅠ'),
  ('이 가격에 여기 안가면 손해임 ㄹㅇ'),
  ('여기 선수 진짜 잘생김 추천 박고감'),
  ('평일은 참고 주말에 폭발하는 타입 나만 그럼?'),
  ('ㅋㅋㅋ 공감 100% 나도 이거임'),
  ('와 진짜?? 나도 가봐야겠다'),
  ('이건 좀 오바 아닌가ㅋㅋ'),
  ('ㅇㅈ 인정 나도 같은 경험함'),
  ('대박.. 이런곳이 있었어?'),
  ('나도 가봤는데 ㄹㅇ 맞음'),
  ('이거 실화냐ㅋㅋㅋ'),
  ('완전 공감 나도 매번 이러는데'),
  ('정보 고마워 참고할게'),
  ('우와 다음에 꼭 가볼게'),
  ('솔직히 가성비는 여기가 최고지'),
  ('ㅋㅋㅋ 웃겨서 추천 박음'),
  ('아 이런거 공유해줘서 고마워'),
  ('나도 같은 생각이었는데 ㅋㅋ'),
  ('오 이건 몰랐네 좋은 정보'),
  ('ㅇㅇ 여기 진짜 좋음 강추'),
  ('댓글 보고 나도 가기로 결정함'),
  ('이런 후기 더 올려줘 도움됨'),
  ('ㅋㅋㅋ 찐이다 찐'),
  ('여기 단골인데 맞는말만 했네'),
  ('처음인데 용기 나네 가볼게'),
  ('나만 이런줄 알았는데 다들 그러는구나'),
  ('갈까말까 했는데 후기보고 결정함 ㄱㄱ'),
  ('ㅎㅎ 다음주에 같이 가자'),
  ('실장님 진짜 프로임 인정합니다')
ON CONFLICT DO NOTHING;

-- 4. 자동 생성 함수 — 이 함수를 호출하면 랜덤 글 1개 + 댓글 3~5개 생성
CREATE OR REPLACE FUNCTION auto_generate_content()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_author_id UUID;
  v_author_nick TEXT;
  v_post_id UUID;
  v_post_pool_id INT;
  v_post_category TEXT;
  v_post_title TEXT;
  v_post_content TEXT;
  v_comment_count INT;
  v_comment_content TEXT;
  v_comment_author_nick TEXT;
  v_comment_author_id UUID;
  v_i INT;
BEGIN
  -- 랜덤 작성자 선택
  SELECT id, nickname INTO v_author_id, v_author_nick
  FROM seed_authors ORDER BY random() LIMIT 1;

  -- 사용 안 된 글 하나 선택 (다 쓰면 리셋)
  SELECT id, category, title, content
  INTO v_post_pool_id, v_post_category, v_post_title, v_post_content
  FROM seed_post_pool WHERE used = FALSE
  ORDER BY random() LIMIT 1;

  -- 풀이 비었으면 리셋
  IF v_post_pool_id IS NULL THEN
    UPDATE seed_post_pool SET used = FALSE;
    SELECT id, category, title, content
    INTO v_post_pool_id, v_post_category, v_post_title, v_post_content
    FROM seed_post_pool ORDER BY random() LIMIT 1;
  END IF;

  -- 사용 표시
  UPDATE seed_post_pool SET used = TRUE WHERE id = v_post_pool_id;

  -- users 테이블에 시드 유저 있는지 확인, 없으면 첫 번째 유저 사용
  -- (실제 users 테이블에 seed_authors의 닉네임으로 유저가 있어야 함)
  -- 없으면 아무 유저나 사용
  SELECT id INTO v_author_id FROM users
  WHERE nickname = v_author_nick LIMIT 1;

  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id FROM users LIMIT 1;
  END IF;

  -- 유저가 아예 없으면 중단
  IF v_author_id IS NULL THEN
    RETURN json_build_object('error', 'no users found');
  END IF;

  -- 글 삽입
  INSERT INTO posts (user_id, title, content, category, likes, comment_count)
  VALUES (v_author_id, v_post_title, v_post_content, v_post_category,
          floor(random() * 30 + 5)::int, 0)
  RETURNING id INTO v_post_id;

  -- 랜덤 댓글 3~5개 생성
  v_comment_count := floor(random() * 3 + 3)::int;

  FOR v_i IN 1..v_comment_count LOOP
    -- 댓글 작성자 (글 작성자와 다른 사람)
    SELECT id, nickname INTO v_comment_author_id, v_comment_author_nick
    FROM users WHERE id != v_author_id
    ORDER BY random() LIMIT 1;

    IF v_comment_author_id IS NULL THEN
      v_comment_author_id := v_author_id;
    END IF;

    -- 댓글 내용 선택
    SELECT content INTO v_comment_content
    FROM seed_comment_pool WHERE used = FALSE
    ORDER BY random() LIMIT 1;

    IF v_comment_content IS NULL THEN
      UPDATE seed_comment_pool SET used = FALSE;
      SELECT content INTO v_comment_content
      FROM seed_comment_pool ORDER BY random() LIMIT 1;
    END IF;

    UPDATE seed_comment_pool SET used = TRUE
    WHERE id = (SELECT id FROM seed_comment_pool WHERE content = v_comment_content LIMIT 1);

    -- 댓글 삽입
    INSERT INTO comments (post_id, user_id, content, likes)
    VALUES (v_post_id, v_comment_author_id, v_comment_content, floor(random() * 15)::int);
  END LOOP;

  -- 글의 댓글 수 업데이트
  UPDATE posts SET comment_count = v_comment_count WHERE id = v_post_id;

  RETURN json_build_object(
    'success', true,
    'post_id', v_post_id,
    'title', v_post_title,
    'category', v_post_category,
    'comments_added', v_comment_count
  );
END;
$$;

-- 5. 기존 글에 자동 댓글 추가 함수 (글 쓰면 반응이 온다)
CREATE OR REPLACE FUNCTION auto_reply_to_recent()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_post RECORD;
  v_comment_content TEXT;
  v_reply_author_id UUID;
  v_added INT := 0;
BEGIN
  -- 최근 24시간 내 댓글 3개 미만인 글에 자동 댓글
  FOR v_post IN
    SELECT id, user_id FROM posts
    WHERE created_at > NOW() - INTERVAL '24 hours'
    AND comment_count < 3
    ORDER BY created_at DESC
    LIMIT 5
  LOOP
    -- 다른 유저로 댓글
    SELECT id INTO v_reply_author_id
    FROM users WHERE id != v_post.user_id
    ORDER BY random() LIMIT 1;

    IF v_reply_author_id IS NULL THEN CONTINUE; END IF;

    SELECT content INTO v_comment_content
    FROM seed_comment_pool ORDER BY random() LIMIT 1;

    INSERT INTO comments (post_id, user_id, content, likes)
    VALUES (v_post.id, v_reply_author_id, v_comment_content, floor(random() * 10)::int);

    UPDATE posts SET comment_count = comment_count + 1 WHERE id = v_post.id;
    v_added := v_added + 1;
  END LOOP;

  RETURN json_build_object('replies_added', v_added);
END;
$$;

-- 테스트: SELECT auto_generate_content();
-- 테스트: SELECT auto_reply_to_recent();
