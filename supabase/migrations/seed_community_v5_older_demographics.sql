-- ═══════════════════════════════════════════════════════════
-- 40~60대 타겟 커뮤니티 시드 콘텐츠
-- 기존 시드(20~30대 위주)에 중장년층 시선 추가
-- ═══════════════════════════════════════════════════════════

-- ── 자유게시판 ──

INSERT INTO posts (title, content, category, likes, comment_count, created_at) VALUES
('나이트 20년 다녀본 사람이 하나 알려줌', '40대 중반인데 나이트라는게 20대때부터 쭉 다녔다. 요즘 젊은 애들 보면 처음에 부킹 어떻게 하는지도 모르고 오는데 그게 또 귀엽긴 하다. 근데 진짜 조언 하나만 하자면 웨이터한테 잘 하셈. 웨이터가 다 해줌. 양주 뭐 시킬지 고민될때 "적당한거 추천해주세요" 하면 됨. 20년 경험의 결론은 이거다. 잘 모르겠으면 물어봐. 아는척 하다가 민폐 끼치는것보단 100배 나음.', 'free', 89, 0, NOW() - INTERVAL '2 days 3 hours'),

('50대인데 호빠 처음 가봤습니다', '올해 52세 여자입니다. 이혼하고 혼자 살다가 친구가 기분전환 하라고 끌고 갔는데 솔직히 처음엔 좀 민망했습니다. 근데 생각보다 분위기가 편하더라고요. 젊은 남직원분들이 재밌게 해주고 대화도 잘 맞춰주고. 이런 말 하기 좀 그렇지만 오랜만에 신나게 웃었습니다. 나이 때문에 망설이는 언니들 있으면 한번 가보세요. 나이는 숫자일 뿐이더라고요.', 'free', 124, 0, NOW() - INTERVAL '3 days 6 hours'),

('회사 접대 20년차가 추천하는 요정 예절', '접대 자리를 수백번 잡아본 입장에서 말하자면 요정은 다른 데랑 격이 다릅니다. 반드시 정장 입고 가시고 구두 신으세요. 첫 잔은 상대방한테 먼저 권하고 본인은 나중에 드세요. 국악 나올때 박수 치지 마시고 끝나면 치세요. 이런 사소한 게 인상을 결정합니다. 사업하시는 분들은 이런 자리가 진짜 중요하니까 미리 알고 가세요.', 'free', 67, 0, NOW() - INTERVAL '5 days 2 hours'),

('딸한테 들키면 어쩌지 ㅋㅋ', '47세 평범한 직장인인데 가끔 동기들이랑 나이트 갑니다. 근데 대학생 딸이 있거든요. 혹시 딸이 같은 데 오면 어쩌나 하는 걱정이 ㅋㅋ 물론 그런 일은 없겠지만 상상만으로도 식은땀이 남. 비슷한 걱정 하시는 40대 아버지들 계시면 손 들어보세요 ㅎ', 'free', 93, 0, NOW() - INTERVAL '1 day 8 hours');

-- ── 업소후기 ──

INSERT INTO posts (title, content, category, likes, comment_count, created_at) VALUES
('요정 처음 가본 40대 후기 (일산 명월관)', '사업하는 친구가 접대 자리 잡자고 해서 처음 가봤는데 분위기가 진짜 다르더라고요. 한실이라 바닥에 앉는 건데 의외로 편하고 한정식이 진짜 맛있었습니다. 양주도 좋은 거 나오고 국악 한마당도 하고. 거래처 사장님이 이런 데 처음이라며 좋아하셔서 계약도 잘 됐습니다. 가격은 좀 하지만 비즈니스 자리로는 최고입니다.', 'reviews', 56, 0, NOW() - INTERVAL '4 days 5 hours'),

('강남 나이트 40대도 괜찮을까? 직접 가봤음', '43살인데 20년만에 나이트 가봤습니다. 솔직히 나만 아저씨면 어쩌나 걱정했는데 가보니까 40대 많더라고요. 부스에 앉으니까 웨이터가 알아서 해주고 편하게 놀았습니다. 다만 체력이 문제... 12시에 갔는데 2시 되니까 이미 졸렸음 ㅋㅋ 젊을때는 새벽 5시까지 놀았는데 나이는 못 속이네요.', 'reviews', 78, 0, NOW() - INTERVAL '2 days 14 hours'),

('룸에서 동창회 했는데 최고였음', '고등학교 동창 8명이서 룸 빌렸는데 완벽했습니다. 노래방처럼 노래도 부르고 양주도 마시고 옛날 얘기에 밤새 웃었네요. 55세 아저씨 8명이 10대처럼 놀았음 ㅋㅋ 직원분이 우리 아버지뻘인데도 잘 챙겨줘서 고마웠습니다. 연말 동창회는 여기서 하기로 확정.', 'reviews', 45, 0, NOW() - INTERVAL '6 days 3 hours');

-- ── 꿀팁 ──

INSERT INTO posts (title, content, category, likes, comment_count, created_at) VALUES
('40대 나이트 첫방문 필수 체크리스트', '40대에 처음이거나 오랜만에 간다면 이것만 기억하세요. 1) 정장이나 깔끔한 셋업 입기 (운동복 절대 안됨) 2) 웨이터한테 "오랜만에 왔는데 추천 좀" 하면 다 알아서 해줌 3) 양주는 처음이면 스탠다드 시키면 됨. 비싼 거 안 시켜도 됨 4) 부킹은 편하게 받으면 됨. 거절해도 전혀 무례한 거 아님 5) 체력 안 되면 일찍 가서 일찍 나와도 됨. 꼭 새벽까지 있을 필요 없음.', 'tips', 112, 0, NOW() - INTERVAL '3 days 9 hours'),

('접대할때 양주 선택 가이드 (경험에서 나온)', '사업 20년차가 알려주는 접대용 양주 선택법. 상대가 40대 이상 사장님이면 발렌타인 17년이나 로얄살루트가 무난합니다. 너무 비싼 거 시키면 오히려 부담스러워하고 너무 싼 거 시키면 성의 없어 보임. 딱 중간이 좋아요. 상대가 젊은 대표면 헤네시 XO나 돔페리뇽 같은 게 있으면 그거 추천. 핵심은 "이 정도는 챙겼구나" 느낌을 주되 과시하지 않는 선.', 'tips', 87, 0, NOW() - INTERVAL '7 days 4 hours');

-- ── Q&A ──

INSERT INTO posts (title, content, category, likes, comment_count, created_at) VALUES
('50대도 클럽 가도 되나요?', '솔직하게 물어봅니다. 51세인데 클럽 한번도 안 가봤거든요. 요즘 회사 젊은 직원들이 가자고 하는데 갈 수 있는 건가요? 나이 제한 같은 게 있나요? 혹시 어색하지 않을까요?', 'discussion', 34, 0, NOW() - INTERVAL '1 day 12 hours'),

('회식 장소로 나이트 vs 룸 뭐가 나을까요', '부서 회식을 좀 특별하게 하고 싶은데 평균 나이 45세 부서입니다. 나이트가 나을까요 룸이 나을까요? 여직원도 2명 있어서 신경이 쓰이네요. 경험 있으신 분 조언 부탁드립니다.', 'discussion', 41, 0, NOW() - INTERVAL '4 days 1 hour');

-- ── 댓글 추가 ──

-- "나이트 20년 다녀본 사람이 하나 알려줌" 댓글
INSERT INTO comments (post_id, content, created_at)
SELECT id, '완전 공감합니다 ㅋㅋ 저도 40대인데 처음 갔을때 아는척 하다가 양주 잘못 시켜서 혼났어요. 웨이터한테 물어보는게 최고', NOW() - INTERVAL '2 days 1 hour'
FROM posts WHERE title = '나이트 20년 다녀본 사람이 하나 알려줌' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '20년 경력이면 레전드시네요 ㅋㅋ 저는 3년밖에 안됐는데 이 글 보고 많이 배웁니다', NOW() - INTERVAL '1 day 22 hours'
FROM posts WHERE title = '나이트 20년 다녀본 사람이 하나 알려줌' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '맞아요 모르면 물어보면 되는거지 아는척이 제일 민폐임 ㅋㅋ 어제도 옆 테이블에서 양주 섞어마시는 사람 봤는데...', NOW() - INTERVAL '1 day 15 hours'
FROM posts WHERE title = '나이트 20년 다녀본 사람이 하나 알려줌' LIMIT 1;

-- "50대인데 호빠 처음 가봤습니다" 댓글
INSERT INTO comments (post_id, content, created_at)
SELECT id, '언니뻘이시네요 ㅎㅎ 근데 진짜 나이는 숫자일 뿐임. 호빠에 50대 이상 언니들 꽤 많아요. 편하게 다니세요!', NOW() - INTERVAL '3 days 4 hours'
FROM posts WHERE title = '50대인데 호빠 처음 가봤습니다' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '저도 비슷한 상황인데 용기 주셔서 감사합니다. 한번 가봐야겠네요', NOW() - INTERVAL '3 days 2 hours'
FROM posts WHERE title = '50대인데 호빠 처음 가봤습니다' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '오랜만에 웃으셨다니 다행이에요. 건강하시고 자주 놀러 오세요!', NOW() - INTERVAL '2 days 20 hours'
FROM posts WHERE title = '50대인데 호빠 처음 가봤습니다' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '저희 업소에도 50대 단골 언니들 많으십니다. 나이 상관없이 편하게 즐기시는 분들이 제일 매력적이에요 ㅎㅎ', NOW() - INTERVAL '2 days 10 hours'
FROM posts WHERE title = '50대인데 호빠 처음 가봤습니다' LIMIT 1;

-- "딸한테 들키면 어쩌지" 댓글
INSERT INTO comments (post_id, content, created_at)
SELECT id, 'ㅋㅋㅋㅋ 아 이거 너무 공감 저도 44인데 대학생 아들이 있거든요... 혹시 마주치면 서로 못 본 척 하는 걸로 ㅋㅋ', NOW() - INTERVAL '1 day 6 hours'
FROM posts WHERE title = '딸한테 들키면 어쩌지 ㅋㅋ' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '저는 진짜 아들이랑 마주친 적 있습니다... 서로 눈 마주치고 3초간 정적 ㅋㅋ 다음날 서로 아무 말 안 함', NOW() - INTERVAL '1 day 3 hours'
FROM posts WHERE title = '딸한테 들키면 어쩌지 ㅋㅋ' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '실화냐 ㅋㅋㅋㅋㅋ', NOW() - INTERVAL '1 day 2 hours'
FROM posts WHERE title = '딸한테 들키면 어쩌지 ㅋㅋ' LIMIT 1;

-- "50대도 클럽 가도 되나요?" 댓글
INSERT INTO comments (post_id, content, created_at)
SELECT id, '나이 제한 없습니다! 50대 손님도 간혹 계세요. 다만 체력 문제가... 11시 전에 가셔서 새벽 1시 전에 나오시면 딱 좋을 듯', NOW() - INTERVAL '1 day 10 hours'
FROM posts WHERE title = '50대도 클럽 가도 되나요?' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '저 48인데 클럽 가끔 갑니다 ㅋㅋ 테이블 잡고 가시면 편해요. 서서 놀면 다음날 허리가 나갑니다 경험담임', NOW() - INTERVAL '1 day 8 hours'
FROM posts WHERE title = '50대도 클럽 가도 되나요?' LIMIT 1;

-- "회식 장소로 나이트 vs 룸" 댓글
INSERT INTO comments (post_id, content, created_at)
SELECT id, '여직원 있으면 룸이 낫습니다. 나이트는 아무래도 부킹 시스템이 있어서 불편할 수 있어요. 룸이면 노래도 부르고 편하게 놀 수 있음', NOW() - INTERVAL '3 days 20 hours'
FROM posts WHERE title = '회식 장소로 나이트 vs 룸 뭐가 나을까요' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '45세 평균이면 나이트도 괜찮은데 여직원 계시면 사전에 동의 구하시는게 맞아요. 본인들이 괜찮다면 나이트도 재밌습니다', NOW() - INTERVAL '3 days 15 hours'
FROM posts WHERE title = '회식 장소로 나이트 vs 룸 뭐가 나을까요' LIMIT 1;

INSERT INTO comments (post_id, content, created_at)
SELECT id, '우리 회사는 1차 룸 2차 나이트로 하는데 이게 제일 좋은 조합인 듯', NOW() - INTERVAL '3 days 10 hours'
FROM posts WHERE title = '회식 장소로 나이트 vs 룸 뭐가 나을까요' LIMIT 1;

-- 댓글 수 업데이트
UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)
WHERE title IN (
  '나이트 20년 다녀본 사람이 하나 알려줌',
  '50대인데 호빠 처음 가봤습니다',
  '딸한테 들키면 어쩌지 ㅋㅋ',
  '50대도 클럽 가도 되나요?',
  '회식 장소로 나이트 vs 룸 뭐가 나을까요'
);
