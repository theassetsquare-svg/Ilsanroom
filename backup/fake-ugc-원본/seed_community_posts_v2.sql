-- ============================================================
-- 놀쿨 커뮤니티 시드 글 v2 — 73개 추가 게시글 + 200개 댓글
-- 기존 seed_community_posts.sql (27개)에 추가하여 총 100개
-- user_id = NULL → "탈퇴한 회원"으로 표시
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 자유게시판 (free) — 9개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '금요일밤 혼술하다가 결국 나감ㅋㅋ', '집에서 혼자 맥주먹다가 갑자기 너무 심심한거임.. 결국 택시타고 강남 나갔는데 새벽 2시에 혼자 라운지 앉아있으니까 오히려 힐링되더라ㅋㅋㅋ 바텐더가 말도 잘 걸어주고 옆에 혼자온 사람이랑 얘기도 하고 의외로 재밌었음. 집에서 넷플릭스보는것보다 나은듯', 22, 178, false, NOW() - INTERVAL '15 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '접대 자리에서 양주 모르면 창피함?', '다음주에 거래처 접대 잡혔는데 양주를 하나도 모름ㅠㅠ 발렌타인이랑 조니워커 차이도 모르는데 괜찮을까.. 아니면 미리 공부하고 가야하나 선배님들 조언좀', 14, 112, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '여자끼리 클럽가면 남자들이 너무 들이댐', '친구 4명이서 홍대 클럽갔는데 좀 조용히 놀고싶은데 계속 남자들이 와서 말걸어서 좀 피곤했음.. 여자끼리 편하게 놀수있는데 없나요 ㅠ 라운지가 나은건가', 31, 234, false, NOW() - INTERVAL '13 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '30대 중반인데 클럽가면 아재소리 듣나', '요즘 클럽 평균연령이 20대초중반이라며.. 35인데 가면 좀 그런가ㅋㅋ 학생때 자주갔는데 요즘은 도저히 용기가 안남. 30대 가는사람 있어?', 19, 156, false, NOW() - INTERVAL '11 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '퇴근후 스트레스 해소법이 술밖에 없는건가', '매일 야근하다가 금요일되면 무조건 술먹으러 나가는데 이게 맞는건지 모르겠다ㅋㅋ 근데 한주동안 쌓인거 한번에 풀려서 월요일 버틸수있음.. 다들 스트레스 어케 풀어요', 26, 198, false, NOW() - INTERVAL '10 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '일산 vs 강남 밤문화 비교해봄', '일산 5년 강남 3년 경험으로 솔직하게 비교함. 일산은 접근성 좋고 가격 착하고 사람들 편함. 강남은 비싸고 빡세지만 퀄리티가 확실히 다름. 결론은 둘다 좋음ㅋㅋ 일산은 편하게 자주가기좋고 강남은 특별한날 가기좋음', 38, 267, false, NOW() - INTERVAL '9 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '술자리 2차로 노래방 vs 클럽 뭐가 나음', '회식 1차 끝나고 2차 갈때 항상 고민임. 노래방은 안전하고 편한데 좀 뻔하고.. 클럽은 호불호 갈리는데 분위기 타면 진짜 재밌거든. 다들 2차 뭘로 가요?', 17, 134, false, NOW() - INTERVAL '7 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '대전에서 서울 올라와서 놀만한데 추천좀', '대전 사는데 이번주 서울 올라가거든요. 강남이나 홍대쪽에서 놀려는데 혼자 처음가도 괜찮은 클럽이나 라운지 추천해주세요! 20대후반 남자임', 8, 67, false, NOW() - INTERVAL '5 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '요즘 라운지 가격이 너무 올랐는데', '작년까지만해도 칵테일 한잔에 만오천원이었는데 요즘 이만원 넘는데가 많더라ㅠ 물가가 올라서 그런건 알겠는데 양심적으로 좀.. 그래도 분위기값이라 생각하면 나쁘진 않나', 13, 92, false, NOW() - INTERVAL '3 days');


-- ============================================================
-- 업소후기 (reviews) — 17개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '강남 레이스 토요일 다녀옴 후기', '토요일 11시쯤 갔는데 줄이 좀 있었음. 30분 정도 기다렸나 안에 들어가니까 사운드가 ㄹㅇ 미쳤음.. DJ가 그날 잘 탔는지 분위기 끝장이었다. 사람 많아서 좀 답답한건 있었는데 에너지가 장난아니라 상쇄됨ㅋㅋ 여자 비율도 괜찮았고 다음주에 또 갈예정', 'gangnamclub-race', 5, 23, 187, false, NOW() - INTERVAL '16 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '사운드 클럽 음향 진짜 좋음', '이름값 하는듯. 사운드 시스템이 다른 클럽이랑 확 차이남. 베이스가 가슴까지 울리는데 귀는 안아픔 이게 가능한건가ㅋㅋ EDM 좋아하면 여기 강추. 근데 입장료가 좀 비싼편이긴 함', 'gangnamclub-sound', 5, 18, 145, false, NOW() - INTERVAL '15 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '잭 클럽 금요일 후기인데 별로였음 솔직히', '기대하고 갔는데 그날따라 사람이 별로 없었나.. 분위기가 좀 죽어있었음. 음악은 괜찮은데 텐션이 안올라가더라. 근데 시설은 깨끗하고 화장실도 넓어서 좋았음. 다음에 다시 가봐야 할듯 그날 운이 없었나봄', 'gangnamclub-jack', 3, 7, 89, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '홍대 버뮤다 분위기 찐이었음', '홍대 클럽 여러군데 가봤는데 버뮤다가 제일 나한테 맞는듯. 음악 장르가 다양해서 안질리고 사람들도 자유롭게 놀더라. 강남처럼 빡세지 않아서 편하게 즐길수있었음. 가격도 강남보다 착해서 자주 갈듯ㅎㅎ', 'hongdaeclub-bermuda', 5, 21, 167, false, NOW() - INTERVAL '13 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '퍼시픽 클럽 리뷰 — 힙합파티 갔다옴', '금요일 힙합파티 있어서 갔는데 MC가 진짜 잘하더라ㅋㅋ 분위기 띄우는게 프로임. 사람도 적당하고 춤출 공간도 충분했음. 근데 음료가 좀 비쌈.. 맥주 한잔에 만원인건 좀 그랬다. 분위기는 확실히 좋았음', 'hongdaeclub-pacific', 4, 14, 123, false, NOW() - INTERVAL '12 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '압구정 하이프 처음갔는데 셀럽 봄', '우와 진짜 연예인 봤음 누군진 못말하지만ㅋㅋ 역시 압구정.. 분위기가 다른 클럽이랑 급이 다름. 인테리어도 고급스럽고 사람들 옷차림도 수준이 다르더라. 근데 입장할때 면접보는 느낌이라 좀 긴장됐음ㅋㅋㅋ', 'apgujeongclub-hype', 5, 34, 278, false, NOW() - INTERVAL '11 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '이태원 메이드 외국인이랑 놀았음', '영어 좀 할줄알면 여기 진짜 재밌음. 외국인 비율이 높아서 색다른 경험 할수있고 음악도 글로벌한 느낌? 한국 클럽에서는 못느끼는 바이브가 있음. 근데 한국말 안통하는 경우도 있어서 당황할수있긴함ㅋㅋ', 'itaewonclub-maid', 4, 16, 134, false, NOW() - INTERVAL '10 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '청담 아르주 라운지 데이트로 감', '여친이랑 기념일이라 분위기 좋은데 찾다가 여기 감. 와.. 인테리어가 진짜 예쁘고 조명이 은은해서 분위기 미쳤음. 칵테일도 맛있고 여친이 너무 좋아해서 다행이었다. 가격은 좀 나가지만 특별한 날에는 여기 강추', 'cheongdamclub-arju', 5, 27, 213, false, NOW() - INTERVAL '9 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '강남 호빠 로얄 후기 — 친구들이랑 갔는데', '여자 4명이서 갔어요! 초이스할때 선수들이 진짜 잘생겨서 고르기 힘들었음ㅋㅋ 담당해준 분이 유머감각도 좋고 불편한거 하나도 없이 편하게 놀았어요. 다들 다음달에 또 가자고 난리임. 여자분들 강추합니다 진짜', 'gangnamhoppa-royal', 5, 29, 198, false, NOW() - INTERVAL '8 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '부산 스타호빠 출장때 갔는데 괜찮았음', '부산 출장가서 현지 여직원들이랑 회식때 갔는데 시설이 생각보다 깔끔하고 선수들도 매너 좋더라. 서울이랑 비교해도 크게 차이 안나는듯. 부산쪽 호빠 찾으시는분 여기 가봐도 좋을거같아요', 'busanhoppa-star', 4, 11, 87, false, NOW() - INTERVAL '7 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '깐따삐야 수빈실장 진짜 잘해줌', '해운대 깐따삐야 처음 갔는데 수빈실장님이 예약부터 끝까지 케어를 잘해주심. 선수 퀄리티도 좋고 룸도 넓어서 편했어요. 해운대 놀러가시면 한번 가보세요 후회안함', 'haeundaehoppa-kkantappiya', 5, 19, 156, false, NOW() - INTERVAL '6 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '미슐랭 호빠 리뷰 — 해운대에서 제일 나은듯', '해운대 호빠 3군데 가봤는데 미슐랭이 제일 만족도 높았음. 선수들 비주얼도 상위권이고 서비스가 체계적임. 초이스 시스템도 깔끔하고 실장님 응대도 프로페셔널함. 가격은 평균인데 만족도는 위', 'haeundaehoppa-michelin', 5, 15, 128, false, NOW() - INTERVAL '5 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '압구정 코드라운지 혼자갔는데 편했음', '혼자 조용히 술한잔 하고싶어서 갔는데 바 좌석이 있어서 편하게 앉아서 마셨음. 바텐더가 말도 잘 걸어주고 칵테일 추천도 해주고. 혼술하기 좋은 분위기임. 소개팅 장소로도 괜찮을듯', 'apgujeongcodelounge', 4, 12, 95, false, NOW() - INTERVAL '4 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', 'DM라운지 분위기 좋긴한데 비쌈', '압구정 DM라운지 갔는데 인테리어는 확실히 고급짐. 근데 칵테일이 좀 비싸서.. 뭐 압구정이니까 이해는 하는데 가성비는 아님. 분위기 내고싶은 날 가기 좋음. 음악 선곡은 괜찮았어', 'apgujeonglounge-dm', 4, 9, 76, false, NOW() - INTERVAL '3 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '청담 H2O나이트 부킹 잘됨', '금요일에 부스 잡고 갔는데 웨이터가 적극적으로 부킹 시켜줘서 좋았음. 여자분들도 괜찮은 분들 많이 오더라. 시설도 깨끗하고 음향도 괜찮고. 강남 나이트 중에서 가성비 괜찮은편인듯', 'cheongdamh2onight', 4, 17, 143, false, NOW() - INTERVAL '2 days');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '줄리아나 나이트 전설은 아니고 레전드', '강남 줄리아나 진짜 오래된 나이트인데 아직도 잘됨. 30대 이상 많아서 나이 좀 있으신분들 편하게 놀수있음. 부킹 시스템도 잘 갖춰져있고 웨이터도 경험 많아서 매끄러움. 2부가 핵심임 1부는 좀 한산함', 'gangnamjuliananight', 4, 20, 168, false, NOW() - INTERVAL '1 day');

INSERT INTO posts (id, user_id, category, title, content, venue_slug, rating, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '일산 샴푸나이트 동네 나이트로는 최고', '일산 사는데 멀리 안가고 동네에서 놀수있어서 좋음. 시설이 크진 않은데 아담해서 오히려 분위기 좋고 사람들도 로컬이라 편함. 부킹도 잘되고 웨이터 친절하고. 일산 사시는분들 여기 한번 가보세요', 'ilsanshampoonight', 4, 13, 102, false, NOW() - INTERVAL '12 hours');


-- ============================================================
-- 꿀팁 (tips) — 9개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '클럽 입장 안걸리는 복장 정리해봄', '남자 기준으로
O 되는거: 슬랙스+셔츠, 청바지+자켓, 단화/로퍼/부츠
X 안되는거: 트레이닝, 슬리퍼, 운동화(뉴발제외), 반바지, 후드티
여자는 거의 다 됨ㅋㅋ 근데 운동화는 여자도 안되는데 있음
압구정은 특히 까다로움 차림새 신경쓰세요', 37, 278, true, NOW() - INTERVAL '16 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '접대 자리 양주 선택 가이드', '접대 상대가 40대이상이면 로얄살루트 무조건 무난함. 30대면 발렌타인21년이나 글렌피딕18년. 와인 좋아하시는분이면 양주 말고 와인으로 가는것도 좋고. 싱글몰트 좋아하시는 분 만나면 맥캘란 18년 가면 감동받으심. 중요한건 상대 취향 미리 파악하는거임', 25, 189, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '숙취해소 꿀팁 공유 (찐임)', '저 매주 나가는 사람인데 숙취해소 방법 알려줄게요
1. 놀기전에 우유 한잔 마시기 (위벽 보호)
2. 양주 마실때 물 같이 마시기 (1:1 비율)
3. 끝나고 편의점에서 컨디션 사먹기
4. 자기전에 물 500ml는 마시기
5. 다음날 해장국보다 죽이 나음
이거 지키면 숙취 반으로 줄어듬 진짜', 42, 312, false, NOW() - INTERVAL '12 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '호빠에서 선수 고르는 꿀팁', '외모만 보고 고르면 후회할 확률 높음. 초이스할때 잠깐이라도 대화해보고 유머감각 있는지 체크하세요. 잘생겼는데 텐션 없으면 진짜 재미없거든요ㅋㅋ 그리고 실장한테 활발한 스타일로 부탁하면 맞춰줌. 처음이면 솔직하게 처음이라고 하는게 좋아요', 28, 201, false, NOW() - INTERVAL '10 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '부산 해운대 놀거리 루트 공유', '해운대 가시는분들 참고하세요
저녁: 해운대 횟집에서 회 먹고
1차: 바닷가 산책하면서 맥주 한캔
2차: 해운대 호빠나 룸에서 본격 시작
3차: 새벽에 씨앗핫도그 먹기
이 루트가 찐임. 해운대는 바다가 있어서 분위기가 ㄹㅇ 다름', 33, 245, false, NOW() - INTERVAL '8 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '라운지에서 자연스럽게 말거는법', '라운지나 바에서 옆사람한테 말걸고싶은데 어색한 분들 팁 드림
1. 바텐더한테 뭔가 물어보면서 대화 시작하기
2. "여기 자주 오세요?" 이런건 진부함 ㅋㅋ "그 칵테일 뭐에요?" 이게 나음
3. 눈 마주치면 가볍게 목례하고 타이밍 봐서 한마디
억지로 하면 티남 자연스러운게 최고', 21, 167, false, NOW() - INTERVAL '6 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '나이트 웨이터한테 잘보이는법', '웨이터가 부킹의 핵심인데 처음에 인사 잘하고 팁 좀 주면 확실히 신경 더 써줌. 그리고 웨이터 이름 외워서 불러주면 대우가 달라짐ㅋㅋ 단골되면 좋은 자리도 잡아주고 괜찮은 분들 먼저 붙여줌. 웨이터 관리가 나이트의 반임', 30, 223, false, NOW() - INTERVAL '4 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '요정 처음 가시는분 에티켓 정리', '요정은 일반 술집이랑 격이 다름. 에티켓 지키면 대접을 잘 받아요
1. 복장은 정장 or 깔끔한 캐주얼
2. 시끄럽게 떠들지 않기 (품격있게)
3. 도우미분들한테 예의갖추기
4. 공연할때는 감상하면서 박수
5. 음식 나오면 같이 드시기
이정도만 지키면 처음이라도 어색하지 않아요', 18, 134, false, NOW() - INTERVAL '2 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '택시비 아끼는 꿀팁들', '새벽에 놀고나면 택시비가 진짜 무서움ㅋㅋ
1. 카풀 어플 미리 깔아두기
2. 같은 방향 사람이랑 합승하기
3. 지하철 첫차 시간 체크 (5시반부터 있음)
4. 대리운전이 택시보다 싼 경우도 있음 (자차 있으면)
5. 강남역에서 택시 잡지말고 좀 걸어가서 잡기 (바가지 방지)', 24, 178, false, NOW() - INTERVAL '1 day');


-- ============================================================
-- Q&A / 토론 (discussion) — 9개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '나이트 1부 2부 차이가 뭐에요?', '나이트 가려는데 1부 2부가 있다길래.. 시간대가 다른건가요? 1부때 가면 사람 적어서 안좋다는데 2부는 몇시부터에요? 그리고 돈은 따로 내나요 아님 한번 내면 끝인지 궁금해요', 11, 98, false, NOW() - INTERVAL '15 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '룸에서 초이스 안하면 어떻게 되나요', '룸 처음 가보려는데 초이스를 꼭 해야하는건가요? 아니면 그냥 친구들끼리 양주 마시면서 놀수도 있는건지.. 초이스 안하면 눈치주나요? 편하게 술만 마시고싶은건데 가능한건지 궁금합니다', 9, 83, false, NOW() - INTERVAL '13 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '클럽에서 소지품 관리 어케해요?', '클럽 갈때 핸드폰이랑 지갑 어디다 넣어요? 주머니에 넣으면 춤추다가 떨어질것같고 가방 들고가면 불편할것같은데.. 물품보관함 있는데도 있나요? 소매치기 당할까봐 걱정됨', 13, 105, false, NOW() - INTERVAL '11 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '라운지랑 바 차이가 뭔가요', '라운지도 술마시는데고 바도 술마시는데인데 뭐가 다른건지 모르겠어요ㅋㅋ 라운지가 좀 더 넓고 소파있고 그런건가? 분위기 차이? 가격차이? 아시는분 설명좀 해주세요', 7, 62, false, NOW() - INTERVAL '9 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '여자 혼자 라운지 가도 안위험한가요', '혼자 조용히 술마시고싶은데 여자 혼자 라운지 가면 좀 불안하지 않나요.. 안전한 곳 추천해주실수있나요? 강남이나 압구정쪽이면 좋겠어요. 분위기 좋고 여자 혼자가도 편한곳', 16, 128, false, NOW() - INTERVAL '7 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '호빠 갈때 예산 얼마정도 잡아야해요', '호빠 처음 가보려는데 돈을 얼마나 들고가야할지 감이 안옵니다ㅠ 4명이서 가려는데 1인당 얼마정도면 되나요? 너무 비싸면 좀 부담스러운데.. 경험 있으신분 알려주세요', 12, 94, false, NOW() - INTERVAL '5 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '나이트에서 거절 당하면 분위기 어색해지나', '부킹할때 상대가 안맞으면 거절할수있다는데 거절하면 분위기가 이상해지나요? 그리고 내가 거절당하면 좀 창피하지않나ㅋㅋ 거절하는 방법이랑 당했을때 대처법 알려주세요', 10, 79, false, NOW() - INTERVAL '3 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '광주에도 괜찮은 클럽이나 나이트 있나요', '광주 사는데 밤에 놀만한데가 별로 없는거같아서.. 상무지구쪽에 있다고 들었는데 가보신분 계시면 어떤지 알려주세요! 서울까지 갈수는 없고 광주 근처에서 놀고싶어요', 6, 54, false, NOW() - INTERVAL '2 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '대전 세븐나이트 아직 있어요?', '옛날에 대전 세븐나이트 갔었는데 아직 영업하나요? 대전에서 나이트 가려면 여기밖에 없었던것같은데 다른데도 생겼나? 대전 사시는분 정보 좀 주세요', 5, 47, false, NOW() - INTERVAL '1 day');


-- ============================================================
-- 파티/벙개 (party) — 6개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[강남] 이번주 토요일 클럽 같이가실분 모집', '토요일 밤 11시쯤 강남 클럽 가려는데 같이 갈 사람 구해요! 남자 2명인데 여자분들도 환영 ㅎㅎ 20대후반~30대초반이면 좋겠어요. 레이스나 사운드 생각하고있어요', 8, 67, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[홍대] 금요일 퇴근후 버뮤다 갈사람', '금요일 9시쯤 홍대 버뮤다 갈건데 같이 갈 사람! 혼자 가기 좀 그래서ㅋㅋ 남녀 상관없고 20대면 좋겠어요. 클럽 처음이어도 괜찮아요 같이 놀면 됨', 6, 52, false, NOW() - INTERVAL '12 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[압구정] 라운지 소규모 모임', '압구정 라운지에서 조용히 술마시면서 대화 나눌 분 3-4명 모집합니다. 30대 직장인이고 평소에 혼자 가는데 가끔 사람들이랑 얘기하고싶을때가 있어서요. 직종 상관없고 편한 분위기로!', 5, 43, false, NOW() - INTERVAL '8 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[부산] 주말 해운대 호빠 벙개', '부산 해운대에서 주말에 호빠 같이 가실 여자분 모집해요! 저랑 친구 2명인데 2-3명 더 있으면 더 재밌을것같아서ㅎㅎ 20대후반~30대 되시는분 연락주세요~', 9, 71, false, NOW() - INTERVAL '6 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[일산] 다음주 금요일 샴푸나이트 같이가요', '일산 샴푸나이트 가려는데 혼자는 좀 그래서.. 같이 가실분 1-2명만 구합니다! 일산 거주자면 좋겠고 30대 남자에요. 부스 잡을거라 편하게 오시면 됩니다', 4, 35, false, NOW() - INTERVAL '4 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '[대전] 세븐나이트 금요일 모임', '대전 사시는분들 금요일에 세븐나이트 같이 가실분! 여기 글 보니까 대전 분들도 계신것같아서 올려봅니다. 3-4명 정도면 좋겠어요 남녀 상관없어요', 3, 28, false, NOW() - INTERVAL '2 days');


-- ============================================================
-- 패션 (fashion) — 10개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '클럽갈때 검정 슬랙스가 답인 이유', '여러가지 입어봤는데 결국 검정 슬랙스가 제일 무난하고 어디서든 안걸림. 위에는 흰셔츠나 검정셔츠 입으면 깔끔하고 클럽 분위기에도 맞고. 청바지도 되긴하는데 스키니진은 춤추기 불편해서 비추. 슬랙스+로퍼 조합이 진리임', 24, 189, false, NOW() - INTERVAL '16 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '라운지 갈때 여자 복장 추천', '라운지는 클럽보다 차분한 분위기라 너무 화려한것보다 세련된게 나음. 원피스나 블라우스+슬랙스 조합이 좋고 구두는 낮은 힐이 편함. 액세서리 살짝 하면 분위기 업되고 가방은 작은 클러치가 좋아요. 향수 은은하게 뿌리면 완벽', 31, 234, false, NOW() - INTERVAL '15 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '나이트 갈때 신발 뭐 신어야함', '운동화 안되는데 많으니까 조심. 로퍼가 제일 무난하고 첼시부츠도 괜찮음. 구두는 너무 딱딱한거 말고 편한거로. 뉴발란스 990 같은거는 되는데도 있고 안되는데도 있어서 걸리기싫으면 그냥 로퍼 신어라ㅋㅋ 여자는 힐이 제일 좋은데 발아프면 플랫슈즈도 됨', 19, 156, false, NOW() - INTERVAL '13 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '향수 추천좀 (클럽/라운지용)', '밤에 나갈때 뿌리는 향수 추천받고싶어요
남자: 블루드샤넬, 디올소바쥬 (무난), 톰포드 누아 (고급)
여자: 미스디올, 조말론 피오니 (은은), 이브생로랑 몽파리 (섹시)
근데 너무 많이 뿌리면 역효과ㅋㅋ 손목이랑 목뒤에 살짝만', 28, 212, false, NOW() - INTERVAL '11 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '겨울 클럽 복장 고민 (코트 맡기기)', '겨울에 클럽가면 코트를 어디다 놓는게 문제임. 물품보관소 있는데도 있는데 없으면 부스에 놔둬야함. 그래서 겨울에는 가죽자켓이 제일 나음. 얇고 멋있고 춤출때도 안거추장스럽고. 롱코트는 솔직히 불편해서 비추', 15, 123, false, NOW() - INTERVAL '9 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '호빠갈때 어떤 옷 입어야 예쁘게 보여요', '호빠는 좀 꾸미고 가는게 나음ㅎㅎ 선수들도 잘 꾸미고 있으니까 나도 좀 신경써야 자신감 올라감. 원피스가 제일 편하고 예쁘고, 니트+치마 조합도 좋아요. 근데 너무 노출 심한건 오히려 마이너스인듯.. 세련되게 깔끔한게 최고', 22, 178, false, NOW() - INTERVAL '7 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '시계 차고가면 분위기 달라짐', '솔직히 시계 하나로 분위기 확 바뀜. 비싼거 아니어도 됨. 다니엘웰링턴이나 폴리서블 정도면 충분하고 빈티지 느낌 시계도 포인트 됨. 반지나 팔찌는 호불호 갈리는데 시계는 남녀 다 좋아하는듯', 17, 134, false, NOW() - INTERVAL '5 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '접대 자리 복장 가이드', '접대할때 복장 잘못입으면 첫인상 망함.
정장: 네이비or차콜 무조건 무난. 검정은 너무 장례식같고
셔츠: 흰색or연한블루. 무늬는 잔체크까지만
넥타이: 안해도 되는 분위기면 빼는게 나음
구두: 브라운 옥스포드가 제일 좋음
시계: 있으면 포인트 됨', 20, 165, false, NOW() - INTERVAL '3 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '여름 클럽 복장 꿀팁', '여름에 클럽가면 땀 미쳤거든요ㅋㅋ 그래서 소재가 중요함. 린넨셔츠 추천. 시원하고 구겨져도 멋있음. 반팔 셔츠도 괜찮고 근데 민소매는 비추 (안되는데 많음). 밝은색 입으면 조명받았을때 예쁘게 보임. 검정은 땀 안보이는 장점이 있긴함', 14, 112, false, NOW() - INTERVAL '1 day');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '헤어스타일도 중요한데 다들 무시함', '옷만 신경쓰고 머리 안하고 가는사람 많은데 헤어가 진짜 중요함. 남자는 왁스로 올려서 이마 보이게 하면 인상이 확 달라지고 여자는 웨이브 넣으면 분위기 남. 미용실까지 안가도 고데기 하나면 충분. 놀러가기 전에 머리 10분만 투자하세요', 16, 129, false, NOW() - INTERVAL '12 hours');


-- ============================================================
-- 조각모임 (jogak) — 5개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'jogak', '강남 조각모임 멤버 구해요 (4/6)', '강남에서 격주 금요일에 만나서 라운지나 바에서 술마시는 모임이에요. 현재 4명인데 6명까지 채우려구요. 남녀 상관없고 20대후반~30대초반이면 좋겠어요. 부담없이 술한잔 하면서 친목 쌓는 모임입니다!', 12, 98, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'jogak', '홍대 클럽 조각모임 모집중', '매주 토요일 홍대 클럽 같이 가는 모임 만들려구요! 혼자 가기 그런분들 같이 가면 훨씬 재밌잖아요ㅋㅋ 인원 6-8명 정도 생각하고 있고 20대면 좋겠어요. 남녀 반반으로 맞출예정', 15, 112, false, NOW() - INTERVAL '10 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'jogak', '일산 직장인 술모임 같이해요', '일산 사시는 직장인분들 퇴근후에 가볍게 한잔 하실분 모집합니다. 월 2회 정도 만나서 맛집이나 바 돌아다니면서 놀아요. 현재 3명이고 5-6명까지 모집. 30대 위주지만 20대후반도 환영!', 8, 67, false, NOW() - INTERVAL '6 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'jogak', '부산 해운대 놀이 조각 멤버 모집', '부산 해운대에서 같이 놀 멤버 구해요! 호빠도 가고 클럽도 가고 바도 가고 다양하게 놀아요. 부산 사시는 분들 연락주세요~ 남녀 상관없고 20대~30대면 좋겠어요. 현재 2명이라 5명까지 모집합니다', 7, 54, false, NOW() - INTERVAL '3 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'jogak', '압구정 와인모임 멤버 구함', '압구정에서 월 1회 와인바에서 와인 마시면서 대화하는 모임이에요. 와인 잘 몰라도 괜찮아요 같이 배워가면서 마시는거라ㅎㅎ 현재 4명이고 6명까지 모집. 30대 직장인 위주인데 20대후반도 환영합니다', 10, 82, false, NOW() - INTERVAL '1 day');


-- ============================================================
-- 커뮤니티가이드 (guide) — 8개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '놀쿨 처음 오신분들 읽어주세요', '놀쿨에 오신걸 환영합니다! 여기는 밤문화 정보 공유하는 커뮤니티에요.
- 업소 후기 게시판에서 실제 방문 후기를 볼 수 있어요
- 꿀팁 게시판에서 초보자 가이드를 확인하세요
- 파티/벙개에서 같이 놀 사람을 찾을 수 있어요
- 조각모임에서 정기 모임을 만들수있어요
편하게 글 쓰시고 궁금한거 물어보세요!', 45, 456, true, NOW() - INTERVAL '20 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '커뮤니티 규칙 안내 (필독)', '놀쿨 커뮤니티 규칙입니다. 꼭 지켜주세요!
1. 욕설/비하/혐오 발언 금지
2. 허위 후기 작성 금지 (광고글도 안됨)
3. 개인정보 노출 금지 (전화번호, 주소 등)
4. 불법 행위 관련 글 금지
5. 도배/어그로 금지
위반시 경고 없이 삭제될 수 있습니다.
건전하게 즐겨주세요!', 52, 523, true, NOW() - INTERVAL '19 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '후기 작성법 가이드', '좋은 후기 작성하는 법 알려드릴게요!
1. 어디 갔는지 (업소명, 지역)
2. 언제 갔는지 (평일/주말, 시간대)
3. 분위기가 어땠는지 (음악, 인테리어, 사람들)
4. 좋았던 점과 아쉬웠던 점
5. 별점 매기기
이 정도만 써주시면 다른 분들한테 큰 도움이 됩니다!
솔직한 후기가 제일 좋아요', 29, 312, true, NOW() - INTERVAL '18 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '파티/벙개 모집글 작성 가이드', '파티/벙개 모집할때 이것만 적어주세요!
- [지역] 어디에서 만날건지
- 날짜/시간
- 모집 인원 (남녀 비율)
- 나이대
- 어떤 모임인지 간단히 설명
- 참가비 있으면 미리 고지
주의: 상대방 사진 요구하거나 개인정보 요청은 금지입니다!', 23, 234, true, NOW() - INTERVAL '17 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '조각모임이 뭔가요? 설명해드림', '조각모임은 정기적으로 만나는 소모임이에요. 벙개처럼 1회성이 아니라 월 1-2회 꾸준히 만나는거라 친목이 더 깊어지는 장점이 있어요.
예시: "강남 격주 금요일 라운지 모임", "홍대 매주 토요일 클럽 모임"
관심있는 조각모임에 참여하거나 직접 만들어보세요!', 18, 178, false, NOW() - INTERVAL '16 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '놀쿨에서 업소 정보 찾는 법', '놀쿨에서 업소 정보 찾는 방법이에요!
1. 상단 메뉴에서 지역 선택 (강남, 홍대, 부산 등)
2. 업종별 필터 (클럽, 라운지, 룸, 호빠, 나이트, 요정)
3. 업소 상세 페이지에서 양주/부스/룸 정보 확인
4. 후기 게시판에서 실제 방문 후기 체크
5. 궁금한건 Q&A 게시판에서 질문하세요
업소 전화번호는 상세 페이지에 있어요!', 15, 145, false, NOW() - INTERVAL '14 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '패션 게시판 활용법', '패션 게시판에서는 클럽/라운지/호빠 갈때 뭐 입을지 정보 공유해요!
- 복장 추천 (클럽, 라운지, 접대 등 상황별)
- 드레스코드 정보 (어디서 뭐가 안되는지)
- 향수/액세서리 추천
- 헤어스타일 팁
첫인상이 중요한 밤문화에서 패션은 필수! 좋은 정보 많이 공유해주세요', 11, 98, false, NOW() - INTERVAL '10 days');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '신고하기 — 불편한 글이나 댓글 발견하면', '커뮤니티에서 불편한 글이나 댓글을 발견하시면 신고해주세요!
- 글/댓글 옆에 신고 버튼 클릭
- 사유 선택 (욕설, 광고, 허위정보 등)
- 관리자가 확인 후 조치합니다
허위 신고는 오히려 제재 대상이 될 수 있으니 주의해주세요.
깨끗한 커뮤니티 만들기에 함께 해주세요!', 8, 76, false, NOW() - INTERVAL '6 days');


-- ============================================================
-- ============================================================
-- 댓글 200개 시작
-- ============================================================
-- ============================================================

-- ============================================================
-- 기존 v1 게시글에 대한 댓글 (50개)
-- ============================================================

-- 룸 vs 호빠 어디가 더 재밌음?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸 vs 호빠 어디가 더 재밌음?' LIMIT 1), NULL, 'ㅋㅋㅋ 호빠 가본 남자 처음봄 용감하네', NOW() - INTERVAL '8 days 20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸 vs 호빠 어디가 더 재밌음?' LIMIT 1), NULL, '룸이 편하긴한데 호빠 분위기도 나름 재밌음 인정', NOW() - INTERVAL '8 days 15 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸 vs 호빠 어디가 더 재밌음?' LIMIT 1), NULL, '여자인데 호빠 압승이요ㅋㅋ 비교불가', NOW() - INTERVAL '8 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸 vs 호빠 어디가 더 재밌음?' LIMIT 1), NULL, '둘다 가봤는데 같이가는 멤버가 더 중요한듯', NOW() - INTERVAL '8 days 5 hours');

-- 첫 호빠 갔다왔는데 생각보다 괜찮음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '첫 호빠 갔다왔는데 생각보다 괜찮음' LIMIT 1), NULL, '어디로 갔어요?? 저도 가보고싶은데', NOW() - INTERVAL '7 days 20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '첫 호빠 갔다왔는데 생각보다 괜찮음' LIMIT 1), NULL, '호빠 생각보다 부담없이 놀수있음 ㅎㅎ 인정', NOW() - INTERVAL '7 days 12 hours');

-- 요즘 강남 클럽 남녀비율 실화냐
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '요즘 강남 클럽 남녀비율 실화냐' LIMIT 1), NULL, '금요일이 확실히 나음 토요일은 남자만 바글바글', NOW() - INTERVAL '6 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '요즘 강남 클럽 남녀비율 실화냐' LIMIT 1), NULL, 'ㄹㅇ 토요일 강남 남초 심각함ㅋㅋㅋㅋ', NOW() - INTERVAL '6 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '요즘 강남 클럽 남녀비율 실화냐' LIMIT 1), NULL, '홍대가 비율은 더 나은듯', NOW() - INTERVAL '6 days 6 hours');

-- 드레스코드 진짜 중요한거였네
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '드레스코드 진짜 중요한거였네' LIMIT 1), NULL, '트레이닝으로 갔다니 ㅋㅋㅋㅋ 용감하다', NOW() - INTERVAL '5 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '드레스코드 진짜 중요한거였네' LIMIT 1), NULL, '나도 운동화로 걸린적있음ㅠ 로퍼가 답', NOW() - INTERVAL '5 days 8 hours');

-- 혼자 나이트 가본 사람 있음?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 나이트 가본 사람 있음?' LIMIT 1), NULL, '혼자 가봤는데 의외로 괜찮았어요! 오히려 자유로움', NOW() - INTERVAL '4 days 20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 나이트 가본 사람 있음?' LIMIT 1), NULL, '부스 잡으면 혼자가도 웨이터가 알아서 붙여줌', NOW() - INTERVAL '4 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 나이트 가본 사람 있음?' LIMIT 1), NULL, '처음이면 홀보다 부스 추천합니다!', NOW() - INTERVAL '4 days 6 hours');

-- 나이트 부킹 성공률 높이는 법 공유함
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부킹 성공률 높이는 법 공유함' LIMIT 1), NULL, '웨이터한테 인사 잘하는거 진짜 중요함 ㄹㅇ', NOW() - INTERVAL '1 day 20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부킹 성공률 높이는 법 공유함' LIMIT 1), NULL, '3년차 선배님 감사합니다ㅋㅋ 메모해갑니다', NOW() - INTERVAL '1 day 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부킹 성공률 높이는 법 공유함' LIMIT 1), NULL, '홀에서 춤 잘추면 진짜 눈길옴 이건 팩트', NOW() - INTERVAL '1 day 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부킹 성공률 높이는 법 공유함' LIMIT 1), NULL, '근데 춤을 잘추는게 어렵잖아요ㅋㅋ 몸치는 어케함', NOW() - INTERVAL '1 day 5 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부킹 성공률 높이는 법 공유함' LIMIT 1), NULL, '그냥 리듬만 타도 됨 잘추는것보다 즐기는게 중요', NOW() - INTERVAL '1 day 2 hours');

-- 일산룸 신실장님 진짜 센스있음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 신실장님 진짜 센스있음' LIMIT 1), NULL, '동의!! 나도 여기 단골인데 신실장님 진짜 좋아요', NOW() - INTERVAL '9 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 신실장님 진짜 센스있음' LIMIT 1), NULL, '예약 전화하면 친절하게 잘 설명해주시더라', NOW() - INTERVAL '9 days 6 hours');

-- 명월관요정 코스요리 수준이 호텔급
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '명월관요정 코스요리 수준이 호텔급' LIMIT 1), NULL, '요정 한번 가보고싶은데 혼자는 좀 그렇고 접대할일이 있어야하나ㅋㅋ', NOW() - INTERVAL '6 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '명월관요정 코스요리 수준이 호텔급' LIMIT 1), NULL, '국악 공연 진짜 있어요? 대박 신기하다', NOW() - INTERVAL '6 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '명월관요정 코스요리 수준이 호텔급' LIMIT 1), NULL, '외국 바이어 모시고 가기 최고인듯 한국적이면서 고급스럽고', NOW() - INTERVAL '6 days 5 hours');

-- 처음가는 사람 꼭 읽어보세요 (입문 팁)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '처음가는 사람 꼭 읽어보세요 (입문 팁)' LIMIT 1), NULL, '초보인데 감사합니다ㅠㅠ 저장해둘게요', NOW() - INTERVAL '10 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '처음가는 사람 꼭 읽어보세요 (입문 팁)' LIMIT 1), NULL, '현금 챙기라는거 진짜 중요.. 카드 안되서 당황한 적 있음', NOW() - INTERVAL '10 days 8 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '처음가는 사람 꼭 읽어보세요 (입문 팁)' LIMIT 1), NULL, '담당자 이름 알아가면 대우 달라진다는거 ㄹㅇ 팩트임', NOW() - INTERVAL '10 days 3 hours');

-- 양주 고를때 팁 (가성비 vs 분위기)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 고를때 팁 (가성비 vs 분위기)' LIMIT 1), NULL, '발렌타인17년 가성비 인정합니다 ㅋㅋ', NOW() - INTERVAL '8 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 고를때 팁 (가성비 vs 분위기)' LIMIT 1), NULL, '로얄살루트 병이 예쁘긴함 접대할때 있어보여요', NOW() - INTERVAL '8 days 8 hours');

-- 룸에서 초이스 잘하는 법
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸에서 초이스 잘하는 법' LIMIT 1), NULL, '급하게 고르면 후회하는거 ㄹㅇ.. 경험담임ㅋㅋ', NOW() - INTERVAL '2 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸에서 초이스 잘하는 법' LIMIT 1), NULL, '실장한테 취향 말하면 맞춰주는거 맞아요 이거 꿀팁', NOW() - INTERVAL '2 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸에서 초이스 잘하는 법' LIMIT 1), NULL, '안맞으면 바꿀수있는것도 모르는사람 많더라', NOW() - INTERVAL '2 days 6 hours');

-- 호빠 처음가는 여자분들 필독
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음가는 여자분들 필독' LIMIT 1), NULL, '혼자가도 괜찮다는거 진짜에요?? 용기가 안남ㅠ', NOW() - INTERVAL '20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음가는 여자분들 필독' LIMIT 1), NULL, '저 혼자 갔는데 진짜 편했어요! 오히려 친구랑 가면 신경쓰이고', NOW() - INTERVAL '16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음가는 여자분들 필독' LIMIT 1), NULL, '과일주 되는곳 알려주세요~ 양주 잘 못먹어서ㅠ', NOW() - INTERVAL '10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음가는 여자분들 필독' LIMIT 1), NULL, '이 글 저장함 다음주에 가볼예정ㅎㅎ', NOW() - INTERVAL '6 hours');

-- 룸이랑 라운지 차이가 뭔가요?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸이랑 라운지 차이가 뭔가요?' LIMIT 1), NULL, '룸은 프라이빗하게 양주마시면서 놀고 라운지는 오픈된 공간에서 칵테일 마시는거 맞아요! 분위기가 확실히 달라요', NOW() - INTERVAL '9 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸이랑 라운지 차이가 뭔가요?' LIMIT 1), NULL, '쉽게말하면 룸은 독방 라운지는 카페 느낌ㅋㅋ', NOW() - INTERVAL '9 days 8 hours');

-- 호빠 혼자가도 되나요?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 혼자가도 되나요?' LIMIT 1), NULL, '혼자 가시는분 꽤 많아요! 전혀 이상하지 않아요', NOW() - INTERVAL '7 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 혼자가도 되나요?' LIMIT 1), NULL, '오히려 혼자가면 선수가 더 집중해줘서 좋을수도', NOW() - INTERVAL '7 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 혼자가도 되나요?' LIMIT 1), NULL, '저도 처음에 혼자갔는데 지금 단골됨ㅋㅋ 용기내세요!', NOW() - INTERVAL '7 days 4 hours');

-- 클럽 처음갈때 복장 어떻게 입어야해요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽 처음갈때 복장 어떻게 입어야해요' LIMIT 1), NULL, '슬랙스+셔츠+로퍼면 어디서든 안걸려요 이거 외우세요', NOW() - INTERVAL '3 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽 처음갈때 복장 어떻게 입어야해요' LIMIT 1), NULL, '가면 알아서 분위기 타게 되니까 걱정마세요ㅋㅋ', NOW() - INTERVAL '3 days 12 hours');

-- 라운지에서 칵테일 추천좀
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지에서 칵테일 추천좀' LIMIT 1), NULL, '모히또 무난하고 도수 낮아서 추천! 아니면 피나콜라다', NOW() - INTERVAL '22 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지에서 칵테일 추천좀' LIMIT 1), NULL, '여자친구랑이면 에스프레소 마티니 추천 예쁘고 맛있음', NOW() - INTERVAL '18 hours');

-- 솔직히 요정 한번 가보면 인생 달라짐
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '솔직히 요정 한번 가보면 인생 달라짐' LIMIT 1), NULL, '요정 진짜 궁금한데 기회가 없네ㅠ', NOW() - INTERVAL '10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '솔직히 요정 한번 가보면 인생 달라짐' LIMIT 1), NULL, '거래처 사장님이 데려가주는거 부럽다 ㅋㅋ', NOW() - INTERVAL '6 hours');


-- ============================================================
-- v2 자유게시판 댓글 (25개)
-- ============================================================

-- 금요일밤 혼술하다가 결국 나감ㅋㅋ
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '금요일밤 혼술하다가 결국 나감ㅋㅋ' LIMIT 1), NULL, 'ㅋㅋㅋㅋ 공감 나도 집에서 혼술하다가 밖으로 나간적 있음', NOW() - INTERVAL '14 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '금요일밤 혼술하다가 결국 나감ㅋㅋ' LIMIT 1), NULL, '새벽 2시에 혼자 라운지 가는 용기 대단하다ㅋㅋ', NOW() - INTERVAL '14 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '금요일밤 혼술하다가 결국 나감ㅋㅋ' LIMIT 1), NULL, '바텐더가 말 잘 걸어주는 라운지 어디에요?? 저도 가고싶음', NOW() - INTERVAL '14 days 6 hours');

-- 접대 자리에서 양주 모르면 창피함?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리에서 양주 모르면 창피함?' LIMIT 1), NULL, '발렌타인17년이랑 조니워커블랙만 알면 기본은 됨', NOW() - INTERVAL '13 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리에서 양주 모르면 창피함?' LIMIT 1), NULL, '몰라도 괜찮아요 실장한테 추천해달라하면 됩니다', NOW() - INTERVAL '13 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리에서 양주 모르면 창피함?' LIMIT 1), NULL, '요즘은 와인으로 하는경우도 많으니 부담갖지마세요', NOW() - INTERVAL '13 days 5 hours');

-- 여자끼리 클럽가면 남자들이 너무 들이댐
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자끼리 클럽가면 남자들이 너무 들이댐' LIMIT 1), NULL, 'ㅠㅠ 공감.. 그냥 춤추고싶은건데 계속 와서 말걸면 피곤', NOW() - INTERVAL '12 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자끼리 클럽가면 남자들이 너무 들이댐' LIMIT 1), NULL, '라운지가 확실히 편해요 클럽보다 덜 들이대더라', NOW() - INTERVAL '12 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자끼리 클럽가면 남자들이 너무 들이댐' LIMIT 1), NULL, '부스 잡으면 좀 나아요 홀에서 놀면 어쩔수없긴함', NOW() - INTERVAL '12 days 6 hours');

-- 30대 중반인데 클럽가면 아재소리 듣나
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 중반인데 클럽가면 아재소리 듣나' LIMIT 1), NULL, '나이트가면 30대 많으니까 나이트 추천! 클럽은 좀 어린애들 많긴함', NOW() - INTERVAL '10 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 중반인데 클럽가면 아재소리 듣나' LIMIT 1), NULL, '압구정은 30대도 많으니까 거기 가보세요', NOW() - INTERVAL '10 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 중반인데 클럽가면 아재소리 듣나' LIMIT 1), NULL, '잘 놀면 나이는 숫자에 불과ㅋㅋ 걱정마세요', NOW() - INTERVAL '10 days 4 hours');

-- 퇴근후 스트레스 해소법이 술밖에 없는건가
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '퇴근후 스트레스 해소법이 술밖에 없는건가' LIMIT 1), NULL, '진짜 공감ㅋㅋㅋ 금요일 술이 월요일 출근의 원동력', NOW() - INTERVAL '9 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '퇴근후 스트레스 해소법이 술밖에 없는건가' LIMIT 1), NULL, '운동도 좋긴한데 술만큼 즉각적인 해소가 안됨ㅋㅋ', NOW() - INTERVAL '9 days 12 hours');

-- 일산 vs 강남 밤문화 비교해봄
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 vs 강남 밤문화 비교해봄' LIMIT 1), NULL, '일산 토박이인데 인정합니다 편하게 자주가기엔 일산이 최고', NOW() - INTERVAL '8 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 vs 강남 밤문화 비교해봄' LIMIT 1), NULL, '강남은 특별한날 일산은 평소에 이게 정답인듯', NOW() - INTERVAL '8 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 vs 강남 밤문화 비교해봄' LIMIT 1), NULL, '일산이 택시비도 아끼고 좋죠ㅋㅋ', NOW() - INTERVAL '8 days 4 hours');

-- 술자리 2차로 노래방 vs 클럽 뭐가 나음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '술자리 2차로 노래방 vs 클럽 뭐가 나음' LIMIT 1), NULL, '멤버 보고 결정해야함 보수적인 사람 있으면 노래방이 안전', NOW() - INTERVAL '6 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '술자리 2차로 노래방 vs 클럽 뭐가 나음' LIMIT 1), NULL, '라운지가 절충안임 시끄럽지도 않고 분위기도 좋고', NOW() - INTERVAL '6 days 8 hours');

-- 대전에서 서울 올라와서 놀만한데 추천좀
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '대전에서 서울 올라와서 놀만한데 추천좀' LIMIT 1), NULL, '홍대 버뮤다 가보세요 혼자가도 재밌어요!', NOW() - INTERVAL '4 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '대전에서 서울 올라와서 놀만한데 추천좀' LIMIT 1), NULL, '강남은 좀 비싸니까 첫방문이면 홍대추천', NOW() - INTERVAL '4 days 10 hours');

-- 요즘 라운지 가격이 너무 올랐는데
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '요즘 라운지 가격이 너무 올랐는데' LIMIT 1), NULL, 'ㅇㅈ 물가상승 체감됨ㅠㅠ 그래도 분위기값이라 생각해야지', NOW() - INTERVAL '2 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '요즘 라운지 가격이 너무 올랐는데' LIMIT 1), NULL, '집에서 마시면 싸긴한데 분위기가 없잖아ㅋㅋ', NOW() - INTERVAL '2 days 10 hours');


-- ============================================================
-- v2 업소후기 댓글 (40개)
-- ============================================================

-- 강남 레이스 토요일 다녀옴 후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 레이스 토요일 다녀옴 후기' LIMIT 1), NULL, '레이스 진짜 좋죠 사운드가 미침 ㅋㅋ', NOW() - INTERVAL '15 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 레이스 토요일 다녀옴 후기' LIMIT 1), NULL, '토요일은 사람 많은거 감안해야함 그래도 분위기는 최고', NOW() - INTERVAL '15 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 레이스 토요일 다녀옴 후기' LIMIT 1), NULL, '금요일이 좀 덜 붐비는데 분위기는 비슷하니까 금요일 추천', NOW() - INTERVAL '15 days 4 hours');

-- 사운드 클럽 음향 진짜 좋음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '사운드 클럽 음향 진짜 좋음' LIMIT 1), NULL, '음향 좋은거 인정 근데 입장료가 좀..', NOW() - INTERVAL '14 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '사운드 클럽 음향 진짜 좋음' LIMIT 1), NULL, 'EDM파티 있는날 가면 ㄹㅇ 미침 스피커 진동이 온몸에 옴', NOW() - INTERVAL '14 days 12 hours');

-- 잭 클럽 금요일 후기인데 별로였음 솔직히
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '잭 클럽 금요일 후기인데 별로였음 솔직히' LIMIT 1), NULL, '그날 운 없었나봐요ㅋㅋ 저 갔을때는 괜찮았는데', NOW() - INTERVAL '13 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '잭 클럽 금요일 후기인데 별로였음 솔직히' LIMIT 1), NULL, '토요일에 다시 가보세요 사람 많으면 분위기 확 다름', NOW() - INTERVAL '13 days 10 hours');

-- 홍대 버뮤다 분위기 찐이었음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '홍대 버뮤다 분위기 찐이었음' LIMIT 1), NULL, '버뮤다 나도 좋아함 강남보다 편해서 자주감', NOW() - INTERVAL '12 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '홍대 버뮤다 분위기 찐이었음' LIMIT 1), NULL, '가격도 착하고 음악도 좋고 홍대 원탑이라고 봄', NOW() - INTERVAL '12 days 8 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '홍대 버뮤다 분위기 찐이었음' LIMIT 1), NULL, '혼자 가도 괜찮나요? 이번주 가볼까 고민중', NOW() - INTERVAL '12 days 2 hours');

-- 압구정 하이프 처음갔는데 셀럽 봄
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 하이프 처음갔는데 셀럽 봄' LIMIT 1), NULL, '누구봤어요??? 궁금해죽겠ㅋㅋㅋㅋ', NOW() - INTERVAL '10 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 하이프 처음갔는데 셀럽 봄' LIMIT 1), NULL, '입장 면접ㅋㅋㅋㅋ 진짜 좀 긴장되긴하더라 압구정은', NOW() - INTERVAL '10 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 하이프 처음갔는데 셀럽 봄' LIMIT 1), NULL, '하이프 가격 어느정도에요? 비싸다고만 들었는데', NOW() - INTERVAL '10 days 4 hours');

-- 이태원 메이드 외국인이랑 놀았음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '이태원 메이드 외국인이랑 놀았음' LIMIT 1), NULL, '이태원은 진짜 외국 느낌임 서울인데 서울같지 않은ㅋㅋ', NOW() - INTERVAL '9 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '이태원 메이드 외국인이랑 놀았음' LIMIT 1), NULL, '영어 못하면 좀 아쉬움 그래도 분위기는 좋아요', NOW() - INTERVAL '9 days 8 hours');

-- 청담 아르주 라운지 데이트로 감
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 아르주 라운지 데이트로 감' LIMIT 1), NULL, '여기 분위기 진짜 좋죠 데이트 코스로 최고', NOW() - INTERVAL '8 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 아르주 라운지 데이트로 감' LIMIT 1), NULL, '기념일에 가기 좋겠다 저장해둘게요ㅎㅎ', NOW() - INTERVAL '8 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 아르주 라운지 데이트로 감' LIMIT 1), NULL, '칵테일 뭐 드셨어요?? 추천좀요', NOW() - INTERVAL '8 days 4 hours');

-- 강남 호빠 로얄 후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 호빠 로얄 후기 — 친구들이랑 갔는데' LIMIT 1), NULL, '로얄 선수들 비주얼 ㄹㅇ 좋음 인정합니다', NOW() - INTERVAL '7 days 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 호빠 로얄 후기 — 친구들이랑 갔는데' LIMIT 1), NULL, '여기 예약 어떻게 해요? 전화해야하나요?', NOW() - INTERVAL '7 days 12 hours');

-- 깐따삐야 수빈실장 진짜 잘해줌
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '깐따삐야 수빈실장 진짜 잘해줌' LIMIT 1), NULL, '수빈실장님 저도 인정 예약할때 친절하게 설명해주셨어요', NOW() - INTERVAL '5 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '깐따삐야 수빈실장 진짜 잘해줌' LIMIT 1), NULL, '해운대 호빠 여기가 제일 낫긴함', NOW() - INTERVAL '5 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '깐따삐야 수빈실장 진짜 잘해줌' LIMIT 1), NULL, '부산 여행때 가봐야겠다 ㅎㅎ 후기 감사', NOW() - INTERVAL '5 days 4 hours');

-- 미슐랭 호빠 리뷰
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '미슐랭 호빠 리뷰 — 해운대에서 제일 나은듯' LIMIT 1), NULL, '깐따삐야랑 비교하면 어디가 더 나아요?', NOW() - INTERVAL '4 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '미슐랭 호빠 리뷰 — 해운대에서 제일 나은듯' LIMIT 1), NULL, '선수 비주얼 상위권 인정ㅋㅋ 고르기 힘들었음', NOW() - INTERVAL '4 days 10 hours');

-- 압구정 코드라운지 혼자갔는데 편했음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 코드라운지 혼자갔는데 편했음' LIMIT 1), NULL, '혼술하기 좋은곳 찾고있었는데 감사합니다!', NOW() - INTERVAL '3 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 코드라운지 혼자갔는데 편했음' LIMIT 1), NULL, '소개팅 장소로도 좋다니 메모해둘게요ㅎㅎ', NOW() - INTERVAL '3 days 8 hours');

-- 청담 H2O나이트 부킹 잘됨
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 H2O나이트 부킹 잘됨' LIMIT 1), NULL, '여기 부스 가격 얼마정도에요?', NOW() - INTERVAL '1 day 18 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 H2O나이트 부킹 잘됨' LIMIT 1), NULL, '웨이터가 적극적인거 좋네 나이트는 웨이터가 반이라', NOW() - INTERVAL '1 day 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '청담 H2O나이트 부킹 잘됨' LIMIT 1), NULL, '금요일 토요일 중에 언제가 더 나아요?', NOW() - INTERVAL '1 day 6 hours');

-- 줄리아나 나이트 전설은 아니고 레전드
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '줄리아나 나이트 전설은 아니고 레전드' LIMIT 1), NULL, '줄리아나 진짜 오래됐는데 아직도 잘되는게 신기함', NOW() - INTERVAL '20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '줄리아나 나이트 전설은 아니고 레전드' LIMIT 1), NULL, '30대 많으면 저한테 딱인데ㅋㅋ 가봐야겠다', NOW() - INTERVAL '14 hours');

-- 일산 샴푸나이트 동네 나이트로는 최고
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 샴푸나이트 동네 나이트로는 최고' LIMIT 1), NULL, '일산에서 나이트 갈수있는게 좋긴해 강남까지 안가도 되니까', NOW() - INTERVAL '10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 샴푸나이트 동네 나이트로는 최고' LIMIT 1), NULL, '주말에 사람 많아요? 평일이 나을까요', NOW() - INTERVAL '6 hours');


-- ============================================================
-- v2 꿀팁 댓글 (25개)
-- ============================================================

-- 클럽 입장 안걸리는 복장 정리해봄
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽 입장 안걸리는 복장 정리해봄' LIMIT 1), NULL, '이거 저장함 클럽 처음인데 참고할게요!', NOW() - INTERVAL '15 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽 입장 안걸리는 복장 정리해봄' LIMIT 1), NULL, '뉴발 990 되는데도 있는건 몰랐네ㅋㅋ', NOW() - INTERVAL '15 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽 입장 안걸리는 복장 정리해봄' LIMIT 1), NULL, '압구정 까다로운거 인정 ㅋㅋ 거기는 면접보는 느낌', NOW() - INTERVAL '15 days 4 hours');

-- 접대 자리 양주 선택 가이드
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리 양주 선택 가이드' LIMIT 1), NULL, '맥캘란18년 접대용으로 좋다는거 동의합니다 감동받으심', NOW() - INTERVAL '13 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리 양주 선택 가이드' LIMIT 1), NULL, '상대 취향 미리 파악하라는게 핵심이네 메모', NOW() - INTERVAL '13 days 8 hours');

-- 숙취해소 꿀팁 공유 (찐임)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취해소 꿀팁 공유 (찐임)' LIMIT 1), NULL, '물 1:1 비율 이거 진짜임 이것만 지켜도 다음날 살만해짐', NOW() - INTERVAL '11 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취해소 꿀팁 공유 (찐임)' LIMIT 1), NULL, '우유 마시는건 처음 들어봄 해봐야겠다', NOW() - INTERVAL '11 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취해소 꿀팁 공유 (찐임)' LIMIT 1), NULL, '해장국보다 죽이 낫다는거 ㅇㅈ 속이 편해짐', NOW() - INTERVAL '11 days 4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취해소 꿀팁 공유 (찐임)' LIMIT 1), NULL, '컨디션보다 여명808이 더 잘듣는거같은데 나만그런가', NOW() - INTERVAL '10 days 20 hours');

-- 호빠에서 선수 고르는 꿀팁
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠에서 선수 고르는 꿀팁' LIMIT 1), NULL, '유머감각 체크하라는거 ㄹㅇ 팩트 잘생겨도 재미없으면 지루', NOW() - INTERVAL '9 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠에서 선수 고르는 꿀팁' LIMIT 1), NULL, '실장한테 활발한 스타일로 부탁하는거 꿀팁이네 감사', NOW() - INTERVAL '9 days 8 hours');

-- 부산 해운대 놀거리 루트 공유
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 해운대 놀거리 루트 공유' LIMIT 1), NULL, '이 루트 완벽함ㅋㅋ 씨앗핫도그 마무리 인정', NOW() - INTERVAL '7 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 해운대 놀거리 루트 공유' LIMIT 1), NULL, '바닷가 산책하면서 맥주 이거 ㄹㅇ 감성임', NOW() - INTERVAL '7 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 해운대 놀거리 루트 공유' LIMIT 1), NULL, '다음주 부산 가는데 이 루트 따라갈게요!', NOW() - INTERVAL '7 days 4 hours');

-- 라운지에서 자연스럽게 말거는법
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지에서 자연스럽게 말거는법' LIMIT 1), NULL, '그 칵테일 뭐에요 이거 좋다 ㅋㅋ 바로 써먹어야지', NOW() - INTERVAL '5 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지에서 자연스럽게 말거는법' LIMIT 1), NULL, '억지로 하면 티남 이거 진짜ㅋㅋ 자연스러운게 최고', NOW() - INTERVAL '5 days 8 hours');

-- 나이트 웨이터한테 잘보이는법
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 웨이터한테 잘보이는법' LIMIT 1), NULL, '웨이터 이름 외워서 부르는거 진짜 효과있음 경험담', NOW() - INTERVAL '3 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 웨이터한테 잘보이는법' LIMIT 1), NULL, '단골되면 대우가 달라지는거 맞음 첫방문이랑 비교불가', NOW() - INTERVAL '3 days 8 hours');

-- 택시비 아끼는 꿀팁들
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼는 꿀팁들' LIMIT 1), NULL, '강남역에서 택시 안잡는거 진짜 중요 바가지 많음', NOW() - INTERVAL '20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼는 꿀팁들' LIMIT 1), NULL, '첫차까지 버티는게 제일 싸긴함ㅋㅋㅋ 체력이 문제지', NOW() - INTERVAL '14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼는 꿀팁들' LIMIT 1), NULL, '합승하는거 좋은방법이네 같은방향이면 나누면 되니까', NOW() - INTERVAL '8 hours');


-- ============================================================
-- v2 Q&A 댓글 (22개)
-- ============================================================

-- 나이트 1부 2부 차이가 뭐에요?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 1부 2부 차이가 뭐에요?' LIMIT 1), NULL, '1부는 보통 9시~12시, 2부는 12시~새벽이에요 한번 내면 끝!', NOW() - INTERVAL '14 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 1부 2부 차이가 뭐에요?' LIMIT 1), NULL, '2부때 가세요 진짜 1부는 워밍업이라 재미없음', NOW() - INTERVAL '14 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 1부 2부 차이가 뭐에요?' LIMIT 1), NULL, '근데 1부때 가면 자리 좋은데 앉을수있어요 그건 장점', NOW() - INTERVAL '14 days 4 hours');

-- 룸에서 초이스 안하면 어떻게 되나요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸에서 초이스 안하면 어떻게 되나요' LIMIT 1), NULL, '안해도 됩니다! 그냥 양주만 마시고 오는것도 가능해요', NOW() - INTERVAL '12 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '룸에서 초이스 안하면 어떻게 되나요' LIMIT 1), NULL, '초이스 안하면 눈치는 안주는데 그냥 친구끼리 놀면 되요', NOW() - INTERVAL '12 days 8 hours');

-- 클럽에서 소지품 관리 어케해요?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 소지품 관리 어케해요?' LIMIT 1), NULL, '지퍼있는 주머니가 있는 바지를 입으세요 이게 답', NOW() - INTERVAL '10 days 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 소지품 관리 어케해요?' LIMIT 1), NULL, '물품보관함 있는데 많아요 500원~1000원이면 됨', NOW() - INTERVAL '10 days 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 소지품 관리 어케해요?' LIMIT 1), NULL, '최소한만 들고가세요 핸드폰+카드+현금만', NOW() - INTERVAL '10 days 4 hours');

-- 여자 혼자 라운지 가도 안위험한가요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자 혼자 라운지 가도 안위험한가요' LIMIT 1), NULL, '호텔 라운지가 제일 안전해요 거기 추천합니다', NOW() - INTERVAL '6 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자 혼자 라운지 가도 안위험한가요' LIMIT 1), NULL, '압구정 코드라운지 괜찮아요 바 좌석에 앉으면 편해요', NOW() - INTERVAL '6 days 8 hours');

-- 호빠 갈때 예산 얼마정도 잡아야해요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 갈때 예산 얼마정도 잡아야해요' LIMIT 1), NULL, '지역마다 다른데 강남은 1인 10~15 정도 생각하면 될듯', NOW() - INTERVAL '4 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 갈때 예산 얼마정도 잡아야해요' LIMIT 1), NULL, '양주 종류에 따라 달라져요 실장한테 미리 물어보세요', NOW() - INTERVAL '4 days 8 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 갈때 예산 얼마정도 잡아야해요' LIMIT 1), NULL, '부산이 서울보다 좀 더 착한편이에요 참고하세요', NOW() - INTERVAL '4 days 2 hours');

-- 나이트에서 거절 당하면 분위기 어색해지나
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 거절 당하면 분위기 어색해지나' LIMIT 1), NULL, '거절은 자연스러운거에요 웨이터가 알아서 다른분 붙여줌', NOW() - INTERVAL '2 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 거절 당하면 분위기 어색해지나' LIMIT 1), NULL, '거절당해도 전혀 창피한거 아님 상대가 기억도 못함ㅋㅋ', NOW() - INTERVAL '2 days 8 hours');

-- 광주에도 괜찮은 클럽이나 나이트 있나요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '광주에도 괜찮은 클럽이나 나이트 있나요' LIMIT 1), NULL, '상무지구에 몇개 있어요 규모는 서울보다 작지만 괜찮아요', NOW() - INTERVAL '1 day 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '광주에도 괜찮은 클럽이나 나이트 있나요' LIMIT 1), NULL, '광주 상무 나이트 가봤는데 로컬 분위기라 편했어요', NOW() - INTERVAL '1 day 10 hours');


-- ============================================================
-- v2 파티/벙개 댓글 (12개)
-- ============================================================

-- [강남] 이번주 토요일 클럽 같이가실분 모집
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[강남] 이번주 토요일 클럽 같이가실분 모집' LIMIT 1), NULL, '레이스 가면 저도 갈게요! 20대후반 남자입니다', NOW() - INTERVAL '13 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[강남] 이번주 토요일 클럽 같이가실분 모집' LIMIT 1), NULL, '여자 2명인데 같이 가도 될까요?? ㅎㅎ', NOW() - INTERVAL '13 days 8 hours');

-- [홍대] 금요일 퇴근후 버뮤다 갈사람
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[홍대] 금요일 퇴근후 버뮤다 갈사람' LIMIT 1), NULL, '저도 혼자라 같이가고싶어요! 20대중반 여자에요', NOW() - INTERVAL '11 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[홍대] 금요일 퇴근후 버뮤다 갈사람' LIMIT 1), NULL, '클럽 처음이어도 된다니 용기내서 가볼까ㅋㅋ', NOW() - INTERVAL '11 days 8 hours');

-- [압구정] 라운지 소규모 모임
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[압구정] 라운지 소규모 모임' LIMIT 1), NULL, '이런 모임 좋네요 편하게 대화할수있는 모임 찾고있었어요', NOW() - INTERVAL '7 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[압구정] 라운지 소규모 모임' LIMIT 1), NULL, '30대 여자인데 참여해도 될까요?', NOW() - INTERVAL '7 days 8 hours');

-- [부산] 주말 해운대 호빠 벙개
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[부산] 주말 해운대 호빠 벙개' LIMIT 1), NULL, '부산인데 가고싶어요!! 어디로 연락하면 되나요', NOW() - INTERVAL '5 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[부산] 주말 해운대 호빠 벙개' LIMIT 1), NULL, '깐따삐야 추천 거기 진짜 좋아요!', NOW() - INTERVAL '5 days 8 hours');

-- [일산] 다음주 금요일 샴푸나이트 같이가요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[일산] 다음주 금요일 샴푸나이트 같이가요' LIMIT 1), NULL, '일산 사는데 같이 가고싶어요! 30대초반 남자입니다', NOW() - INTERVAL '3 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[일산] 다음주 금요일 샴푸나이트 같이가요' LIMIT 1), NULL, '샴푸나이트 괜찮죠 동네에서 편하게 놀수있어서 좋아요', NOW() - INTERVAL '3 days 8 hours');

-- [대전] 세븐나이트 금요일 모임
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[대전] 세븐나이트 금요일 모임' LIMIT 1), NULL, '대전에도 같이 놀사람 있으면 좋겠다ㅋㅋ 연락할게요', NOW() - INTERVAL '1 day 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '[대전] 세븐나이트 금요일 모임' LIMIT 1), NULL, '세븐나이트 아직 영업해요? 가본지 오래돼서 궁금', NOW() - INTERVAL '1 day 8 hours');


-- ============================================================
-- v2 패션 댓글 (14개)
-- ============================================================

-- 클럽갈때 검정 슬랙스가 답인 이유
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽갈때 검정 슬랙스가 답인 이유' LIMIT 1), NULL, 'ㄹㅇ 슬랙스+로퍼 조합 무적임 어디서든 됨', NOW() - INTERVAL '15 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽갈때 검정 슬랙스가 답인 이유' LIMIT 1), NULL, '스키니진 춤추기 불편한거 인정ㅋㅋ 바지가 찢어질뻔', NOW() - INTERVAL '15 days 8 hours');

-- 향수 추천좀 (클럽/라운지용)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 (클럽/라운지용)' LIMIT 1), NULL, '디올소바쥬 남자 무난하고 좋아요 실패없음', NOW() - INTERVAL '10 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 (클럽/라운지용)' LIMIT 1), NULL, '너무 많이 뿌리면 역효과 ㅋㅋ 이거 진짜 중요', NOW() - INTERVAL '10 days 8 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 (클럽/라운지용)' LIMIT 1), NULL, '톰포드 누아 뿌리고 갔더니 반응 좋았음 추천', NOW() - INTERVAL '10 days 2 hours');

-- 호빠갈때 어떤 옷 입어야 예쁘게 보여요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠갈때 어떤 옷 입어야 예쁘게 보여요' LIMIT 1), NULL, '원피스가 편하고 예쁜거 맞아요 저도 항상 원피스 입고감', NOW() - INTERVAL '6 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠갈때 어떤 옷 입어야 예쁘게 보여요' LIMIT 1), NULL, '세련되게 깔끔한게 최고라는거 공감 과하면 오히려 마이너스', NOW() - INTERVAL '6 days 8 hours');

-- 시계 차고가면 분위기 달라짐
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '시계 차고가면 분위기 달라짐' LIMIT 1), NULL, '다니엘웰링턴 가성비 좋음 비싸지않은데 있어보여요', NOW() - INTERVAL '4 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '시계 차고가면 분위기 달라짐' LIMIT 1), NULL, '시계 하나로 분위기 바뀌는거 맞음 소품이 중요해', NOW() - INTERVAL '4 days 8 hours');

-- 접대 자리 복장 가이드
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리 복장 가이드' LIMIT 1), NULL, '네이비 정장 무난한거 동의 검정은 장례식같다는거ㅋㅋ', NOW() - INTERVAL '2 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '접대 자리 복장 가이드' LIMIT 1), NULL, '넥타이 안하는게 요즘 트렌드긴함 편하기도 하고', NOW() - INTERVAL '2 days 8 hours');

-- 헤어스타일도 중요한데 다들 무시함
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '헤어스타일도 중요한데 다들 무시함' LIMIT 1), NULL, '이마 보이게 올리는거 확실히 인상 달라짐 이건 팩트', NOW() - INTERVAL '10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '헤어스타일도 중요한데 다들 무시함' LIMIT 1), NULL, '고데기 하나면 된다는거 맞아요 10분 투자로 확 달라져요', NOW() - INTERVAL '6 hours');


-- ============================================================
-- v2 조각모임 댓글 (7개)
-- ============================================================

-- 강남 조각모임 멤버 구해요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 조각모임 멤버 구해요 (4/6)' LIMIT 1), NULL, '관심있어요! 격주 금요일이면 부담없고 좋네요', NOW() - INTERVAL '13 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 조각모임 멤버 구해요 (4/6)' LIMIT 1), NULL, '29살 남자인데 참여할수있나요??', NOW() - INTERVAL '13 days 8 hours');

-- 홍대 클럽 조각모임 모집중
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '홍대 클럽 조각모임 모집중' LIMIT 1), NULL, '이거 너무 좋은 아이디어ㅋㅋ 혼자가기 그런사람들한테 딱', NOW() - INTERVAL '9 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '홍대 클럽 조각모임 모집중' LIMIT 1), NULL, '남녀 반반이면 좋겠네요 참여하고싶어요!', NOW() - INTERVAL '9 days 8 hours');

-- 일산 직장인 술모임 같이해요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산 직장인 술모임 같이해요' LIMIT 1), NULL, '일산 직장인입니다 참여하고싶어요! 32살 남자에요', NOW() - INTERVAL '5 days 14 hours');

-- 압구정 와인모임 멤버 구함
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 와인모임 멤버 구함' LIMIT 1), NULL, '와인 잘 몰라도 된다니 부담없어서 좋네요 관심있어요!', NOW() - INTERVAL '20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '압구정 와인모임 멤버 구함' LIMIT 1), NULL, '와인모임 분위기 좋을듯 ㅎㅎ 30대초반 여자인데 가능한가요', NOW() - INTERVAL '14 hours');


-- ============================================================
-- v2 커뮤니티가이드 댓글 (5개)
-- ============================================================

-- 놀쿨 처음 오신분들 읽어주세요
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '놀쿨 처음 오신분들 읽어주세요' LIMIT 1), NULL, '가입했는데 이 글 보고 구조 이해했어요 감사합니다!', NOW() - INTERVAL '19 days 12 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '놀쿨 처음 오신분들 읽어주세요' LIMIT 1), NULL, '유용한 정보 많네요 자주 올게요~', NOW() - INTERVAL '18 days 12 hours');

-- 커뮤니티 규칙 안내 (필독)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '커뮤니티 규칙 안내 (필독)' LIMIT 1), NULL, '규칙 읽었습니다 건전하게 활동할게요!', NOW() - INTERVAL '18 days 16 hours');

-- 후기 작성법 가이드
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '후기 작성법 가이드' LIMIT 1), NULL, '이 가이드 보고 후기 쓸때 참고할게요 감사합니다', NOW() - INTERVAL '17 days 12 hours');

-- 조각모임이 뭔가요? 설명해드림
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '조각모임이 뭔가요? 설명해드림' LIMIT 1), NULL, '오 이런기능 있는줄 몰랐네 정기모임 좋은 아이디어다', NOW() - INTERVAL '15 days 12 hours');


-- ============================================================
-- 추가 댓글 21개 (총 200개 달성)
-- ============================================================

-- 부산 해운대쪽 룸 다녀왔는데 (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 해운대쪽 룸 다녀왔는데' LIMIT 1), NULL, '해운대 야경 보이는 룸 어디에요?? 나도 가고싶다', NOW() - INTERVAL '2 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 해운대쪽 룸 다녀왔는데' LIMIT 1), NULL, '부산 출장갈때 꼭 가봐야겠다 마린시티 뷰라니 ㄷㄷ', NOW() - INTERVAL '2 days 8 hours');

-- 해운대고구려 정찰제라 편함 (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 정찰제라 편함' LIMIT 1), NULL, '정찰제면 바가지 걱정없어서 좋겠다 접대용으로 딱이네', NOW() - INTERVAL '7 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 정찰제라 편함' LIMIT 1), NULL, '마린시티 야경 보이는 룸 진짜 있어요?? 대박', NOW() - INTERVAL '7 days 8 hours');

-- 일산쪽 괜찮은데 아시는분? (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산쪽 괜찮은데 아시는분?' LIMIT 1), NULL, '일산룸 괜찮아요 놀쿨에서 검색해보세요!', NOW() - INTERVAL '3 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산쪽 괜찮은데 아시는분?' LIMIT 1), NULL, '일산 샴푸나이트도 있어요 동네 나이트로 괜찮음', NOW() - INTERVAL '3 days 8 hours');

-- 이태원 클럽 외국인 많아서 색다름 (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '이태원 클럽 외국인 많아서 색다름' LIMIT 1), NULL, '영어 못하는데 가면 좀 답답하겠다ㅋㅋ 그래도 분위기는 좋을듯', NOW() - INTERVAL '1 day 14 hours');

-- 대리운전 미리 저장해두세요 (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '대리운전 미리 저장해두세요' LIMIT 1), NULL, '티맵대리 팁 감사합니다 카카오만 쓰고있었는데', NOW() - INTERVAL '6 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '대리운전 미리 저장해두세요' LIMIT 1), NULL, '주말 새벽에 대리 안잡히는거 ㄹㅇ.. 미리 예약해놓는게 답', NOW() - INTERVAL '6 days 8 hours');

-- 나이트 부스 vs 홀 차이점 정리 (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부스 vs 홀 차이점 정리' LIMIT 1), NULL, '처음이면 부스 추천하는거 동의 홀은 좀 적극적이어야함', NOW() - INTERVAL '4 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 부스 vs 홀 차이점 정리' LIMIT 1), NULL, '홀이 재밌긴한데 용기가 필요ㅋㅋ', NOW() - INTERVAL '4 days 8 hours');

-- 강남이랑 홍대 클럽 분위기 차이? (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남이랑 홍대 클럽 분위기 차이?' LIMIT 1), NULL, '20대중반이면 홍대가 나을듯 강남은 좀 나이대가 높아요', NOW() - INTERVAL '1 day 16 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남이랑 홍대 클럽 분위기 차이?' LIMIT 1), NULL, '강남 빡세다는건 드레스코드 얘기인듯 홍대는 편함', NOW() - INTERVAL '1 day 10 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남이랑 홍대 클럽 분위기 차이?' LIMIT 1), NULL, '둘다 가봤는데 취향차이임 강남은 화려하고 홍대는 자유로움', NOW() - INTERVAL '1 day 4 hours');

-- 나이트에서 부킹이 뭔가요? (v1)
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 부킹이 뭔가요?' LIMIT 1), NULL, '웨이터가 여자분들 데리고 와서 소개해주는거에요! 편하게 앉아계시면 됨', NOW() - INTERVAL '20 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 부킹이 뭔가요?' LIMIT 1), NULL, '거절당해도 전혀 민망한거 아니에요 자연스러운 과정임ㅋㅋ', NOW() - INTERVAL '14 hours');

-- 라운지 갈때 여자 복장 추천
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지 갈때 여자 복장 추천' LIMIT 1), NULL, '블라우스+슬랙스 조합 좋네요 이번주에 입고 가봐야지', NOW() - INTERVAL '14 days 14 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '라운지 갈때 여자 복장 추천' LIMIT 1), NULL, '향수 은은하게 뿌리라는거 중요 너무 강하면 역효과', NOW() - INTERVAL '14 days 8 hours');

-- DM라운지 분위기 좋긴한데 비쌈
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = 'DM라운지 분위기 좋긴한데 비쌈' LIMIT 1), NULL, '압구정이면 어느정도 각오하고 가야죠ㅋㅋ 분위기값', NOW() - INTERVAL '2 days 14 hours');

-- 대전 세븐나이트 아직 있어요?
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '대전 세븐나이트 아직 있어요?' LIMIT 1), NULL, '아직 있어요! 저 얼마전에 갔는데 영업중이었어요', NOW() - INTERVAL '18 hours');

-- 부산 스타호빠 출장때 갔는데 괜찮았음
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '부산 스타호빠 출장때 갔는데 괜찮았음' LIMIT 1), NULL, '서울이랑 비교해도 차이 안나는거 동의 부산도 수준 높아짐', NOW() - INTERVAL '6 days 14 hours');


-- ============================================================
-- 끝 — 총 73개 게시글 + 200개 댓글
-- ============================================================
