-- ============================================================
-- 놀쿨 커뮤니티 — 살아있는 사이트 시드 v3
-- 진짜 사람이 쓴 것처럼 재밌고 유머러스한 글 + 댓글
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 자유게시판 (free)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '어제 나이트에서 생긴 일 ㅋㅋㅋㅋ', '어제 친구 생일이라고 수원 나이트 갔는데 춤추다가 넘어짐ㅋㅋㅋㅋㅋ 근데 그거 보고 웃은 여자분이랑 번호 교환함 ㅋㅋㅋ 넘어진게 인생 최고의 수였다.. 인생 뭐 있냐 진짜ㅋㅋ 친구는 아직도 그 얘기하면서 웃음', 47, 312, false, NOW() - INTERVAL '47 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '술 안 마시는데 클럽 가도 되나요', '저 술을 진짜 한 방울도 못 마시는데 클럽 가면 이상한 사람 취급 당할까요ㅠ 춤추는건 좋아하는데 매번 물만 시키면 눈치 보여서.. 혹시 술 안 마시고 클럽 다니시는 분 계세요?', 33, 267, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '30대 커플인데 갈만한데 추천좀', '와이프랑 결혼 5주년인데 둘이 클럽가던 시절이 그리워서 한번 가보려고요 ㅋㅋ 근데 요즘 애기들 사이에서 부부가 가면 좀 그런가.. 30대 커플이 편하게 갈만한 곳 어디 있을까요 서울 쪽으로', 28, 234, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '택시비 아끼려다가 더 쓴 썰', '새벽 3시에 강남에서 택시비 아까워서 걸어가다가 배고파서 편의점 들림 → 편의점에서 라면 먹다가 옆에 앉은 사람들이랑 친해짐 → 같이 2차 감 → 결국 택시비의 10배를 씀ㅋㅋㅋㅋㅋㅋ 아 진짜 ㅋㅋㅋ', 62, 445, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '입장료 내고 5분만에 나온 사람 나만인가', '분위기가 내 스타일이 아니어서 바로 나왔는데ㅋㅋ 입장료 3만원 날림.. 들어가기 전에 분위기 확인하는 방법 없나 진짜ㅠ 다음부터는 놀쿨에서 후기 먼저 보고 갈게', 41, 298, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '엄마한테 클럽간다고 솔직하게 말한 썰', '27살인데 아직 엄마한테 클럽간다고 하면 잔소리 들을까봐 항상 "친구 만나러 간다"고 했는데 어제 실수로 "엄마 나 홍대 클럽 갔다올게~" 이러고 끊어버림ㅋㅋㅋㅋ 전화 30번 옴 안받음 집에 오니까 엄마가 현관에서 기다리고 있었음 결론: 살아있습니다', 89, 567, false, NOW() - INTERVAL '35 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '클럽에서 전 여친 만남 ㄷㄷ', '헤어진지 3개월 됐는데 강남 클럽에서 딱 마주침ㅋㅋ 둘 다 얼어붙었다가 눈 마주치고 동시에 고개 돌림.. 근데 나중에 보니까 같은 테이블 옆에 앉아있었음 세상 좁다 진짜로ㅋㅋㅋ 분위기 어색해서 바로 다른데로 감', 55, 389, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '회사 회식 2차로 노래방 vs 클럽 논쟁', '부장님이 2차 클럽가자고 하셔서 다들 멘붕옴ㅋㅋㅋ 과장님은 노래방 가자고 하고 대리들은 클럽 찬성 막내인 나는 그냥 집에 가고 싶었는데 결국 클럽감 부장님 춤 실력이 의외로 쩔었음.. 존경심 +100', 71, 423, false, NOW() - INTERVAL '6 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '혼자 라운지 가봤는데 의외로 괜찮았음', '금요일에 친구들 다 약속있다고 해서 혼자 압구정 라운지 감. 처음엔 쪽팔렸는데 바텐더가 말 잘 걸어주고 옆자리 형이랑 위스키 얘기하면서 친해짐. 지금은 정기적으로 만나는 사이됨ㅋㅋ 혼술도 나쁘지 않다', 36, 278, false, NOW() - INTERVAL '25 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '드레스코드 몰라서 창피당한 후기', '클럽 드레스코드가 스마트캐주얼이라길래 그냥 깔끔하게 입고 갔는데 나만 운동화에 청바지였음ㅋㅋㅋㅋ 입구에서 5분 동안 설득해서 겨우 들어갔는데 안에서도 시선 느껴짐.. 여러분 드레스코드 무시하지 마세요 진짜루', 44, 356, false, NOW() - INTERVAL '7 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '강남 vs 홍대 영원한 떡밥', '결국 이 논쟁은 끝이 안남ㅋㅋ 강남은 분위기 좋고 돈 많이 들고 홍대는 자유롭고 저렴하고.. 근데 나는 강남갔다가 2차 홍대가는게 국룰인데 이러면 택시비가 ㄷㄷ 다들 어디파임?', 38, 289, false, NOW() - INTERVAL '8 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '새벽 5시 귀가길에 먹는 국밥이 왜이리 맛있냐', '어젯밤 이태원에서 놀다가 새벽에 나와서 해장국집 갔는데 인생 최고의 국밥이었음.. 술 먹고 먹는 국밥은 왜 그렇게 맛있는건지 과학적으로 설명 가능한 사람? ㅋㅋ 국밥집 사장님이 천사로 보임', 53, 341, false, NOW() - INTERVAL '12 minutes');

-- ============================================================
-- 업소후기 (reviews)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '일산명월관요정 접대로 갔는데 대만족', '거래처 사장님 모시고 일산명월관 갔는데 진짜 분위기 끝내줌. 한옥 느낌에 전통주 라인업도 좋고 마담이 분위기를 너무 잘 잡아줌. 사장님이 다음에도 여기 오자고 하심ㅋㅋ 접대 성공. 양주는 로얄살루트 21년산으로 했는데 가격대비 분위기랑 서비스 생각하면 전혀 아깝지 않았음', 31, 245, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '수원찬스돔나이트 토요일 후기', '토요일 밤 11시쯤 갔는데 사람 진짜 많음 ㄷㄷ 무대 앞이 완전 꽉 참. DJ가 분위기 잘 잡아서 중간중간 떼창도 하고 리믹스 메들리 나올때 다같이 뛰니까 진짜 스트레스 날아감. 부스는 6인 테이블로 잡았는데 위치도 괜찮고 서비스도 빠름. 양주는 발렌타인 17년으로 갔음. 다음주도 갈 예정', 42, 334, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '해운대고구려 처음 가봤는데 스케일 ㄷㄷ', '부산 출장 갔다가 현지 친구가 데려가줌. 일단 규모가 서울이랑 차원이 다름 진짜. 무대도 크고 음향도 좋고 뭔가 부산 특유의 텐션이 있음ㅋㅋ 서울에서는 못 느끼는 분위기. 초이스도 다양하고 실장님이 세심하게 챙겨줌. 부산 가면 무조건 또 갈 곳', 38, 287, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '성남샴푸나이트 금요일 솔직후기', '친구 4명이서 금요일에 감. 11시 넘어서 가니까 이미 부스 거의 다 찼음 예약 필수!! 분위기는 확실히 주말이라 열기가 다름. 가수 공연 있었는데 라이브로 트로트 불러주니까 아저씨들 완전 신남ㅋㅋ 나도 모르게 따라부름. 양주는 조니워커 블랙으로 했는데 무난하게 좋았음', 29, 223, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '일산룸 단골 3개월차 솔직 리뷰', '처음엔 그냥 궁금해서 갔는데 이제 거의 매주 감ㅋㅋ 일단 실장님이 취향 파악을 너무 잘해줌. 3번째 갈때부터는 내가 뭘 좋아하는지 알아서 세팅해줌. 룸 시설도 깔끔하고 노래방 기기도 최신. 양주 구성도 다양해서 매번 다른거 시도하는 재미가 있음. 가성비로 따지면 이 동네 최고', 35, 278, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '청담H2O나이트 수요일 후기 (평일도 괜찮음)', '평일이라 한산할줄 알았는데 의외로 사람 꽤 있음. 오히려 주말보다 여유롭게 놀 수 있어서 좋았음. DJ 셋도 주말이랑 다르게 좀 더 칠한 느낌? 부스 가격도 평일 할인 있어서 가성비 좋음. 평일에 시간 되는 분들은 오히려 평일 추천', 24, 198, false, NOW() - INTERVAL '40 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '파주야당스카이돔나이트 넓어서 놀람', '경기 북부 쪽에 이런 곳이 있는줄 몰랐음 ㄷㄷ 일단 천장이 높고 넓어서 답답한 느낌 전혀 없음. 주말에 갔는데 파주/일산 쪽 사람들 많이 오더라. 무대 공연도 있고 분위기 활기참. 서울까지 안 가고 여기서 놀아도 충분', 27, 212, false, NOW() - INTERVAL '6 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '울산챔피언나이트 처음간 후기', '울산 출장 마치고 금요일에 혼자 가봄. 혼자 갔는데 실장님이 잘 챙겨줘서 어색하지 않았음. 울산 로컬 분위기가 있는데 서울이랑 또 다른 매력. 음향 시스템 꽤 좋고 무대 가수가 분위기를 확 올려줌. 다음 출장때도 갈 예정', 22, 187, false, NOW() - INTERVAL '8 hours');

-- ============================================================
-- 꿀팁 (tips)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '나이트 처음 가는 사람을 위한 실전 가이드', '1. 예약 필수. 금토는 안하면 부스 없음 2. 복장 신경쓰기. 슬리퍼 절대 안됨 3. 양주 뭐 시킬지 미리 정하기. 가서 메뉴판 보면서 고르면 바가지 느낌남 4. 팁 문화 있음. 웨이터 잘해주면 만원이라도 주면 서비스 달라짐 5. 새벽 1시 이후가 진짜 본게임. 너무 일찍 가면 재미없음. 6. 대리운전 미리 앱 깔아놓기 새벽에 택시 잡기 힘듦', 67, 512, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '양주 입문자를 위한 초간단 정리', '처음이면 이것만 알면 됨 ✓ 발렌타인 17년 — 가장 무난. 부드럽고 달달함. 모임용으로 국룰 ✓ 조니워커 블랙 — 스모키한 맛. 호불호 있음 ✓ 로얄살루트 21년 — 접대용. 가격 높지만 분위기 살림 ✓ 헤네시 VSOP — 꼬냑 계열. 여성분들이 좋아하는 편 ✓ 글렌피딕 12년 — 싱글몰트 입문. 과일향 나서 먹기 편함 처음이면 발렌타인 17년 가면 절대 안 망함', 58, 434, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '클럽에서 자연스럽게 말 거는 법', '10년차 클러버의 팁 공유함 1. 절대 뒤에서 어깨 터치하면 안됨 — 무조건 앞에서 눈 마주치고 2. 첫 마디는 그냥 "안녕하세요 같이 놀아요!" 이게 최고임 복잡한 멘트 필요없음 3. 거절당하면 웃으면서 바로 물러나기 — 이게 매너 4. 같이 춤추다가 자연스럽게 대화 넘어가기 5. 음료 하나 사주는건 기본 중의 기본 핵심은 자신감이 아니라 배려임. 상대가 불편해하면 바로 빠지는게 진짜 매너', 45, 378, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '숙취 안 하는 진짜 방법 (의대생임)', '의대 다니는데 술자리 많아서 터득한 꿀팁 1. 술 마시기 30분 전에 우유 한잔 (위벽 보호) 2. 양주 마실때 물 같이 마시기 (1:1 비율) 3. 안주는 기름진거 위주로 (치즈, 견과류) 4. 폭탄주 절대 하지마 섞으면 숙취 2배 5. 자기 전에 이온음료 500ml 원샷 6. 다음날 아침 꿀물 + 바나나 이거 진짜임. 나 이거 하고나서 숙취 거의 없어짐', 73, 589, false, NOW() - INTERVAL '20 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '요정 처음 가는 사람 필독', '요정은 나이트/클럽이랑 완전 다른 문화임. 1. 복장은 깔끔한 캐주얼 이상. 정장까지는 안해도 됨 2. 마담이 자리 세팅해주니까 그냥 편하게 있으면 됨 3. 전통주 한번은 꼭 마셔보기. 백세주, 복분자 등 의외로 맛있음 4. 대화가 메인임. 시끄러운 음악 없고 조용한 분위기 5. 접대 자리에 최고. 거래처 사장님들 다 좋아하심 6. 팁은 상황 봐서. 마담한테 주면 서비스 달라짐', 34, 267, false, NOW() - INTERVAL '7 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '호빠 처음 가는 여자분들 꿀팁', '여자끼리 호빠 처음 가면 긴장되는데 걱정 마세요 ㅎㅎ 1. 보통 실장님한테 미리 전화해서 예약하면 좋은자리 줌 2. 초이스는 부담없이 마음에 드는 사람 고르면 됨 3. 대화 메인이라 편하게 얘기하면 됨. 호스트분들 대화를 잘 이끌어줌 4. 양주 패키지가 보통 세트로 나오니까 가격 미리 확인 5. 2차 강요 같은거 전혀 없음. 편하게 놀다 가면 됨 6. 친구들이랑 3-4명이서 가면 더 재밌음!', 41, 312, false, NOW() - INTERVAL '2 hours');

-- ============================================================
-- Q&A (discussion)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '나이트에서 만나서 사귄 커플 있나요?', '궁금한게 나이트나 클럽에서 만나서 진지하게 사귀는 경우가 실제로 있나요? 주변에서 클럽은 그냥 놀러가는거지 거기서 만남을 기대하면 안된다고 하는데.. 실제로 만나서 잘 되고 있는 분 계시면 경험 공유해주세요!', 25, 289, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '양주 가격이 매장마다 다른 이유가 뭔가요', '같은 발렌타인 17년인데 어떤데는 15만원 어떤데는 25만원이고 편차가 너무 큰데 이유가 뭔가요? 위치? 분위기? 서비스? 아시는 분 설명좀 해주세요', 19, 198, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '혼자 가도 재밌는 곳 추천좀요', '친구들이 다 결혼하거나 지방 가서 같이 놀 사람이 없는데ㅠㅠ 혼자 가도 어색하지 않고 새로운 사람 만날 수 있는 곳 추천해주세요. 서울 쪽이요. 30대 초반 남자입니다', 32, 256, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '클럽 vs 라운지 어디가 더 만남 확률 높음?', '솔직히 만남 목적이면 어디가 더 나은가요? 클럽은 시끄러워서 대화가 안되고 라운지는 조용한데 말 걸기가 어렵고.. 각각 장단점 있는것 같은데 경험 많으신 분들 의견 듣고 싶어요', 27, 234, false, NOW() - INTERVAL '6 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '웨이터한테 팁 얼마나 주세요?', '나이트 가면 웨이터한테 팁을 주는 문화가 있다고 들었는데 보통 얼마나 주시나요? 만원? 2만원? 그리고 언제 주는건가요 처음에? 나갈때? 진짜 몰라서 물어보는겁니다ㅠ', 21, 189, false, NOW() - INTERVAL '5 hours');

-- ============================================================
-- 파티/벙개 (party)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '이번주 토요일 강남 같이 가실분!', '이번주 토요일(4/19) 강남쪽 나이트 가실분 구합니다! 현재 남2 확정이고 2-3명 더 모집합니다. 20대 후반~30대 초반이면 좋겠어요. 비용은 엔빵이고 양주 한병 정도 생각하고 있습니다. 관심있으시면 댓글 달아주세요!', 18, 167, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '부산 해운대 금요일 벙개 모집', '부산 해운대쪽 금요일 저녁 7시부터 놀 사람~ 현재 여2남1 확정이고 남녀 상관없이 2명 더 모집합니다. 1차 고기집 → 2차 해운대고구려 코스 생각중! 부산 로컬이면 더 좋고 여행온 분들도 환영합니다 ㅎㅎ', 23, 198, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '수원 벙개 성사!! 후기 올립니다', '지난주에 여기서 모집했던 수원 벙개 성사됐습니다! 총 6명이서 찬스돔나이트 갔는데 다들 처음 만났는데도 텐션 미쳤음ㅋㅋㅋ 엔빵으로 부담없이 놀았고 분위기 너무 좋아서 다음주에 또 하기로 했습니다. 놀쿨에서 모집하니까 진짜 잘 되네요!', 34, 256, false, NOW() - INTERVAL '30 minutes');

-- ============================================================
-- 패션 (fashion)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '클럽갈때 운동화 신어도 되나요?', '드레스코드 있는 클럽 말고 일반 클럽이요. 에어포스1 하얀거 신고 가면 이상한가요? 구두 신으면 발 아파서 못 놀겠는데ㅠ', 22, 198, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '여자 나이트 복장 질문이요', '나이트 처음 가는데 뭐 입고 가야할지 모르겠어요ㅠ 원피스? 아니면 그냥 블라우스에 스커트? 구두는 필수인가요? 친구는 편한거 입으라는데 너무 캐주얼하면 분위기 안 맞을까봐 걱정이에요', 28, 234, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '남자 라운지 코디 정답 알려드림', '라운지 자주가는 사람인데 이거만 따라하면 됨. 상의: 검정 셔츠 or 니트 (절대 로고 큰거 노노) 하의: 슬랙스 or 검정 스키니진 신발: 첼시부츠 or 로퍼 (운동화 비추) 악세서리: 시계 하나면 충분 컬러는 올블랙 or 블랙+화이트가 국룰. 너무 화려하면 오히려 촌스러움', 39, 312, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '향수 추천좀 클럽용으로', '클럽 갈때 뿌리는 향수 추천 받고 싶어요. 너무 진하지 않으면서 은은하게 좋은 냄새 나는거요. 예산은 10만원 이하로.. 남자입니다', 25, 198, false, NOW() - INTERVAL '2 hours');

-- ============================================================
-- 가이드 (guide)
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '서울 클럽 지역별 특징 총정리', '클럽 10년 다닌 사람이 정리해줌 ★강남: 20대후반~30대. 깔끔한 분위기. 가격 높음. 외국인 많음 ★홍대: 20대초중반. 자유로운 분위기. 가격 저렴. 다양한 장르 ★이태원: 외국인 비율 높음. 다양한 문화. 특색있는 곳 많음 ★압구정: 셀럽 많음. 프라이빗한 분위기. VIP 문화 ★신촌: 대학생 위주. 가성비. 활기참 결론: 처음이면 홍대부터 시작하는게 부담없음', 56, 445, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'guide', '나이트 vs 클럽 차이점 완벽 정리', '자주 질문 들어와서 정리함 【나이트】 음악: 트로트/가요/리믹스 연령: 30~50대 메인 문화: 부스(테이블), 웨이터 서비스 춤: 사교댄스/프리스타일 양주: 테이블에서 마심 【클럽】 음악: EDM/힙합/하우스 연령: 20~30대 메인 문화: 스탠딩, 바 오더 춤: 자유롭게 양주: 바에서 칵테일/샷 한마디로: 나이트는 앉아서 놀고, 클럽은 서서 논다고 보면 됨', 48, 378, false, NOW() - INTERVAL '6 hours');

-- ============================================================
-- 댓글 — 진짜 사람 느낌으로
-- ============================================================

-- 넘어져서 번호 교환한 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 생긴 일 ㅋㅋㅋㅋ' LIMIT 1), NULL, 'ㅋㅋㅋㅋㅋ 이게 실화냐 영화 찍어라', NOW() - INTERVAL '40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 생긴 일 ㅋㅋㅋㅋ' LIMIT 1), NULL, '넘어져서 인연 만드는건 처음 들어봄ㅋㅋ 축하한다', NOW() - INTERVAL '35 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 생긴 일 ㅋㅋㅋㅋ' LIMIT 1), NULL, '나도 넘어져봐야하나..', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 생긴 일 ㅋㅋㅋㅋ' LIMIT 1), NULL, '그래서 연락은 하고 있어??', NOW() - INTERVAL '20 minutes');

-- 술 안 마시는데 클럽 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '술 안 마시는데 클럽 가도 되나요' LIMIT 1), NULL, '저 술 안마시고 클럽 다닌지 2년째임 전혀 문제없어요! 탄산수 시키면 됨', NOW() - INTERVAL '1 hour 50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '술 안 마시는데 클럽 가도 되나요' LIMIT 1), NULL, '오히려 술 안마시면 다음날 컨디션 좋아서 이득이에요 ㅎㅎ', NOW() - INTERVAL '1 hour 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '술 안 마시는데 클럽 가도 되나요' LIMIT 1), NULL, '진짜 아무도 신경안써요 편하게 가세요~', NOW() - INTERVAL '1 hour');

-- 택시비 아끼려다가 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 더 쓴 썰' LIMIT 1), NULL, 'ㅋㅋㅋㅋㅋㅋ 공감 100% 나도 이런적 있음', NOW() - INTERVAL '55 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 더 쓴 썰' LIMIT 1), NULL, '편의점 라면 먹다가 2차간건 레전드ㅋㅋㅋ', NOW() - INTERVAL '45 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 더 쓴 썰' LIMIT 1), NULL, '아 이거 진짜 술먹으면 다 이러는거 아니냐ㅋㅋ', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 더 쓴 썰' LIMIT 1), NULL, '편의점에서 만난 사람들 지금도 연락해?ㅋㅋ', NOW() - INTERVAL '15 minutes');

-- 엄마한테 클럽간다고 한 썰 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마한테 클럽간다고 솔직하게 말한 썰' LIMIT 1), NULL, 'ㅋㅋㅋㅋㅋㅋ전화 30번이면 엄마 얼마나 놀랬을까ㅋㅋ', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마한테 클럽간다고 솔직하게 말한 썰' LIMIT 1), NULL, '현관에서 기다리고 있었다는게 킬링포인트ㅋㅋㅋㅋ', NOW() - INTERVAL '25 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마한테 클럽간다고 솔직하게 말한 썰' LIMIT 1), NULL, '27인데 아직 눈치보는거 너무 공감ㅠㅠ 우리집도 똑같음', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마한테 클럽간다고 솔직하게 말한 썰' LIMIT 1), NULL, '나는 엄마가 같이 가자고 하던데..ㅋㅋ 엄마가 더 잘놈', NOW() - INTERVAL '10 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마한테 클럽간다고 솔직하게 말한 썰' LIMIT 1), NULL, '살아있습니다 가 제일 웃기다ㅋㅋㅋㅋㅋ', NOW() - INTERVAL '5 minutes');

-- 전 여친 만남 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 전 여친 만남 ㄷㄷ' LIMIT 1), NULL, '세상 진짜 좁다ㅋㅋ 나도 비슷한 경험 있어', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 전 여친 만남 ㄷㄷ' LIMIT 1), NULL, '동시에 고개 돌린거 ㅋㅋㅋ 영화같네', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 전 여친 만남 ㄷㄷ' LIMIT 1), NULL, '이럴때 먼저 인사하는게 맞는거 아닌가', NOW() - INTERVAL '3 hours 30 minutes');

-- 부장님 클럽 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 회식 2차로 노래방 vs 클럽 논쟁' LIMIT 1), NULL, '부장님 춤 쩐다는게 반전이네ㅋㅋㅋ', NOW() - INTERVAL '5 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 회식 2차로 노래방 vs 클럽 논쟁' LIMIT 1), NULL, '회식 2차 클럽은 좀..ㅋㅋ 부장님 센스가 대단하시네', NOW() - INTERVAL '5 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 회식 2차로 노래방 vs 클럽 논쟁' LIMIT 1), NULL, '존경심 +100 ㅋㅋㅋㅋ 부장님 클럽 세대셨나봐', NOW() - INTERVAL '4 hours 30 minutes');

-- 국밥 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 귀가길에 먹는 국밥이 왜이리 맛있냐' LIMIT 1), NULL, '국밥은 과학이다 진짜로ㅋㅋ', NOW() - INTERVAL '10 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 귀가길에 먹는 국밥이 왜이리 맛있냐' LIMIT 1), NULL, '알코올이 미각을 둔화시켜서 자극적인 맛이 더 맛있게 느껴진다고 함 (진지)', NOW() - INTERVAL '8 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 귀가길에 먹는 국밥이 왜이리 맛있냐' LIMIT 1), NULL, '새벽 국밥 > 미슐랭 3스타 이건 진리', NOW() - INTERVAL '5 minutes');

-- 숙취 꿀팁 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취 안 하는 진짜 방법 (의대생임)' LIMIT 1), NULL, '우유 미리 마시는거 진짜 효과있음 나도 항상 이렇게 함', NOW() - INTERVAL '15 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취 안 하는 진짜 방법 (의대생임)' LIMIT 1), NULL, '폭탄주 하지마 이게 핵심이다ㅋㅋ 근데 분위기상 거절이 안됨', NOW() - INTERVAL '12 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취 안 하는 진짜 방법 (의대생임)' LIMIT 1), NULL, '이온음료 원샷은 진짜 꿀팁 저장합니다', NOW() - INTERVAL '8 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취 안 하는 진짜 방법 (의대생임)' LIMIT 1), NULL, '의대생이면 술을 왜 마셔요ㅋㅋ 아 의대가 그렇긴 하지', NOW() - INTERVAL '3 minutes');

-- 양주 입문 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 입문자를 위한 초간단 정리' LIMIT 1), NULL, '발렌타인 17년 국룰 인정. 처음이면 이거 가면 절대 실패없음', NOW() - INTERVAL '2 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 입문자를 위한 초간단 정리' LIMIT 1), NULL, '글렌피딕 12년 추가 추천! 과일향 나서 양주 싫어하는 사람도 잘 먹음', NOW() - INTERVAL '2 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 입문자를 위한 초간단 정리' LIMIT 1), NULL, '헤네시 VSOP 여자친구한테 사줬더니 엄청 좋아함 참고하세요', NOW() - INTERVAL '1 hour 30 minutes');

-- 클럽에서 말 거는 법 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 자연스럽게 말 거는 법' LIMIT 1), NULL, '4번이 핵심이다 진짜. 춤추다가 자연스럽게 대화 넘어가는게 최고', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 자연스럽게 말 거는 법' LIMIT 1), NULL, '거절당하면 바로 물러나기 이거 진짜 중요 집착하면 찐따됨', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '클럽에서 자연스럽게 말 거는 법' LIMIT 1), NULL, '10년차 클러버 형 리스펙합니다', NOW() - INTERVAL '3 hours');

-- 드레스코드 창피 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '드레스코드 몰라서 창피당한 후기' LIMIT 1), NULL, 'ㅋㅋㅋㅋ 5분 동안 설득한거 리얼이냐', NOW() - INTERVAL '6 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '드레스코드 몰라서 창피당한 후기' LIMIT 1), NULL, '나도 처음에 운동화 신고 갔다가 퇴짜맞은적 있음ㅋㅋ 공감', NOW() - INTERVAL '6 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '드레스코드 몰라서 창피당한 후기' LIMIT 1), NULL, '검정 로퍼 하나 사놓으면 어디든 다 됨 팁임', NOW() - INTERVAL '5 hours 30 minutes');

-- 나이트에서 사귄 커플 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 사귄 커플 있나요?' LIMIT 1), NULL, '저 나이트에서 만나서 결혼했어요 ㅎㅎ 올해 3년째', NOW() - INTERVAL '2 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 사귄 커플 있나요?' LIMIT 1), NULL, '와 진짜요?? 어디서 만나셨어요?', NOW() - INTERVAL '2 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 사귄 커플 있나요?' LIMIT 1), NULL, '저도 클럽에서 만나서 1년째 사귀고 있습니다 ㅎㅎ 가능해요!', NOW() - INTERVAL '1 hour 30 minutes');

-- 혼자 가도 재밌는 곳 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 가도 재밌는 곳 추천좀요' LIMIT 1), NULL, '압구정 라운지 추천! 바 자리에 앉으면 바텐더가 말 걸어줘서 안 어색해요', NOW() - INTERVAL '50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 가도 재밌는 곳 추천좀요' LIMIT 1), NULL, '조각모임 이용해보세요! 여기서 모집하면 같이 갈 사람 금방 구해짐', NOW() - INTERVAL '40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 가도 재밌는 곳 추천좀요' LIMIT 1), NULL, '혼자 가는거 처음엔 어색한데 한번 가보면 의외로 괜찮아요 용기내세요!', NOW() - INTERVAL '30 minutes');

-- 수원 벙개 성사 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 성사!! 후기 올립니다' LIMIT 1), NULL, '다음주 저도 끼워주세요!! 수원 사는데 같이 놀 사람 없었는데ㅋㅋ', NOW() - INTERVAL '25 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 성사!! 후기 올립니다' LIMIT 1), NULL, '놀쿨 벙개 진짜 되는구나 대박 나도 모집해봐야지', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 성사!! 후기 올립니다' LIMIT 1), NULL, '찬스돔 좋죠 수원 가면 거기 국룰임', NOW() - INTERVAL '10 minutes');

-- 향수 추천 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 클럽용으로' LIMIT 1), NULL, '블루드샤넬 국룰임 가격대도 딱 맞고 여자들이 좋아하는 향', NOW() - INTERVAL '1 hour 50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 클럽용으로' LIMIT 1), NULL, '딥디크 오르피옹 진짜 좋은데 예산 초과일듯ㅠ', NOW() - INTERVAL '1 hour 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천좀 클럽용으로' LIMIT 1), NULL, '자라 향수 의외로 괜찮아요 가성비 갑', NOW() - INTERVAL '1 hour');

-- 호빠 꿀팁 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음 가는 여자분들 꿀팁' LIMIT 1), NULL, '맞아요 2차 강요 전혀 없어서 편해요 ㅎㅎ 저도 친구들이랑 자주 가요', NOW() - INTERVAL '1 hour 50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음 가는 여자분들 꿀팁' LIMIT 1), NULL, '호빠 초이스 할때 너무 고민하지 말고 느낌 가는대로 고르는게 좋아요~', NOW() - INTERVAL '1 hour 30 minutes');

-- 일산룸 리뷰 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 단골 3개월차 솔직 리뷰' LIMIT 1), NULL, '실장님 누구세요? 저도 일산 사는데 추천받고 싶어요', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 단골 3개월차 솔직 리뷰' LIMIT 1), NULL, '매주 간다는거 보니 진짜 좋은가보네 가봐야겠다', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 단골 3개월차 솔직 리뷰' LIMIT 1), NULL, '양주 구성 좋다는거 동의 다른데보다 확실히 선택지가 많음', NOW() - INTERVAL '3 hours 30 minutes');

-- 서울 클럽 지역별 정리 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '서울 클럽 지역별 특징 총정리' LIMIT 1), NULL, '이거 저장해둬야겠다 정리 감사합니다!', NOW() - INTERVAL '3 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '서울 클럽 지역별 특징 총정리' LIMIT 1), NULL, '홍대가 입문으로 좋다는거 동의 부담없이 가기 좋음', NOW() - INTERVAL '3 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '서울 클럽 지역별 특징 총정리' LIMIT 1), NULL, '10년차면 진짜 전문가네ㅋㅋ 신뢰감 뿜뿜', NOW() - INTERVAL '2 hours 30 minutes');

-- 입장료 5분만에 나온 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '입장료 내고 5분만에 나온 사람 나만인가' LIMIT 1), NULL, '3만원ㅋㅋㅋ 아까워서 어떻게 나오냐', NOW() - INTERVAL '3 hours 40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '입장료 내고 5분만에 나온 사람 나만인가' LIMIT 1), NULL, '맞아 후기 먼저 보고 가는게 답임 안 그러면 이런일 생김ㅋ', NOW() - INTERVAL '3 hours 20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '입장료 내고 5분만에 나온 사람 나만인가' LIMIT 1), NULL, '놀쿨 후기 보고 가면 실패없음 여기 후기가 솔직해서 좋음', NOW() - INTERVAL '3 hours');

-- 강남 vs 홍대 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 vs 홍대 영원한 떡밥' LIMIT 1), NULL, '강남파입니다. 분위기가 다르지 않나', NOW() - INTERVAL '7 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 vs 홍대 영원한 떡밥' LIMIT 1), NULL, '홍대!! 자유로운 분위기가 좋아요 가격도 착하고', NOW() - INTERVAL '7 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '강남 vs 홍대 영원한 떡밥' LIMIT 1), NULL, '강남 갔다가 2차 홍대 택시비 국룰이라는거 너무 공감ㅋㅋㅋ', NOW() - INTERVAL '6 hours 30 minutes');

-- 혼자 라운지 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 라운지 가봤는데 의외로 괜찮았음' LIMIT 1), NULL, '혼자 라운지 가는거 공감!! 바텐더랑 대화하는 재미가 있지', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '혼자 라운지 가봤는데 의외로 괜찮았음' LIMIT 1), NULL, '정기적으로 만나는 사이 됐다는거 부럽다ㅋㅋ', NOW() - INTERVAL '15 minutes');

-- 여자 나이트 복장 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자 나이트 복장 질문이요' LIMIT 1), NULL, '원피스에 굽 낮은 힐이면 무난해요! 너무 화려할 필요 없어요~', NOW() - INTERVAL '50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자 나이트 복장 질문이요' LIMIT 1), NULL, '편한 구두 추천해요 높은 힐 신으면 발 아파서 못 놀아요ㅠ', NOW() - INTERVAL '40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '여자 나이트 복장 질문이요' LIMIT 1), NULL, '블라우스+스커트 조합 깔끔하고 좋아요 저도 항상 이렇게 가요', NOW() - INTERVAL '30 minutes');

-- 해운대고구려 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 처음 가봤는데 스케일 ㄷㄷ' LIMIT 1), NULL, '부산 텐션은 서울이랑 확실히 다르지ㅋㅋ 인정', NOW() - INTERVAL '3 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 처음 가봤는데 스케일 ㄷㄷ' LIMIT 1), NULL, '부산 출장 가면 거기 국룰이죠', NOW() - INTERVAL '3 hours');

-- 웨이터 팁 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '웨이터한테 팁 얼마나 주세요?' LIMIT 1), NULL, '보통 만원~2만원 정도 줌. 처음에 주면 그날 서비스 확 달라짐', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '웨이터한테 팁 얼마나 주세요?' LIMIT 1), NULL, '첫 세팅해줄때 주는게 좋아요. 그 뒤로 알아서 잘 챙겨줌', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '웨이터한테 팁 얼마나 주세요?' LIMIT 1), NULL, '팁 주는 문화가 있긴한데 필수는 아니에요. 부담갖지 마세요', NOW() - INTERVAL '3 hours 30 minutes');

-- 30대 커플 글 댓글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 커플인데 갈만한데 추천좀' LIMIT 1), NULL, '라운지 추천! 조용하고 분위기 좋아서 커플이 가기 딱 좋아요', NOW() - INTERVAL '2 hours 40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 커플인데 갈만한데 추천좀' LIMIT 1), NULL, '결혼 5주년 축하드려요! 저도 와이프랑 가끔 가는데 좋아하더라구요 ㅎㅎ', NOW() - INTERVAL '2 hours 20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 커플인데 갈만한데 추천좀' LIMIT 1), NULL, '압구정쪽 라운지바 가보세요. 30대 커플 많이 와요', NOW() - INTERVAL '2 hours');
