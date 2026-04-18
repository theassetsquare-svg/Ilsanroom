-- ============================================================
-- 놀쿨 커뮤니티 v4 — 전면 재작성
-- 모든 글: 끝까지 읽히는 글만. 읽다 마는 글 = 삭제
-- 모든 댓글: 진짜 사람 반응. "공감ㅋㅋ" 금지
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 기존 시드 데이터 정리 (user_id가 NULL인 것만 = 시드 데이터)
DELETE FROM comments WHERE user_id IS NULL;
DELETE FROM posts WHERE user_id IS NULL;

-- ============================================================
-- 자유게시판 (free) — 12개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '어제 나이트에서 넘어졌는데 그게 인생을 바꿨다', '결론부터 말하면 지금 그 여자랑 3번째 만나는 중이다.

수원 나이트 갔는데 친구 생일이라 좀 과하게 마신 상태였음. 무대 앞에서 춤추다가 옆사람 발에 걸려서 진짜 영화처럼 앞으로 쓰러짐. 손에 들고있던 잔이 바닥에 깨지고 나는 그 위에 엎어지고.

근데 내가 쓰러지면서 옆에 있던 여자분 신발에 술을 확 쏟은거임ㅋㅋㅋ 진짜 죽고싶었다. 바로 일어나서 "진짜 죄송합니다 세탁비 드릴게요" 했는데 이 분이 웃으면서 "괜찮아요 어차피 이 구두 다음주에 버리려고 했어요"라고 함.

근데 옆에있던 그 분 친구가 "야 저 남자 완전 찐이다 번호 따" 이러는거임. 분위기가 갑자기 웃기게 되면서 자연스럽게 얘기하게 됨.

그날 새벽까지 같이 놀고 번호 교환했는데 다음날 연락 올까봐 폰만 쳐다봄ㅋㅋ 그리고 진짜 왔음. "어제 넘어진 남자분이죠? 발목은 괜찮으세요?"

지금 3번 만났고 다음주에 또 만남. 친구들한테 이 얘기하면 다들 "야 너 넘어져서 여친 만들었냐"고 함.

인생 진짜 어디서 어떻게 될지 모르는거 같다. 그 날 넘어지지 않았으면 영원히 모르는 사람이었을텐데.

솔직히 다들 이런 경험 있지 않나? 우연히 만난 사람이 인생을 바꾼 경험.', 127, 1834, false, NOW() - INTERVAL '47 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '32살에 처음 클럽 가봤다 솔직 후기', '이거 쓸까 말까 3일 고민했는데 그냥 쓴다.

나 32살인데 클럽을 한번도 안 가봤다. 친구들이 20대때 클럽 다닐때 나는 군대→취준→회사 이 루트만 탔음. 회사 다니면서도 "나이 들어서 클럽 가면 웃기지 않나" 이 생각에 안 갔는데.

지난주 금요일에 후배가 강남쪽 가자고 해서 술김에 OK 했다. 가기 전에 유튜브로 "클럽 처음 가는 법" 검색한건 비밀임.

결론: 생각이랑 완전 달랐다.

일단 나보다 나이 많아 보이는 사람 엄청 많음. 30대 40대 비율이 생각보다 높아서 전혀 안 떴다. 그리고 춤을 못 춰도 아무도 안 봄. 다들 자기가 노는데 바쁘지 옆에 관심 없다.

근데 진짜 놀란건 스트레스 해소 효과. 일주일 내내 쌓인게 음악 소리에 다 녹는 느낌? 월요일에 회사 갔는데 컨디션이 개좋았다.

한가지 후회하는건 구두를 신고 간거. 3시간 서있으니까 발이 죽었다. 다음엔 깔끔한 운동화 가능한데로 갈 예정.

"나이 들어서" 이런 핑계대는 사람 있으면 한마디 해주고 싶다. 안 가본게 더 손해다.', 89, 1245, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '택시비 아끼려다가 150만원 쓴 밤', '새벽 3시. 강남역. 카카오택시 예상요금 28,000원. "아 걸어가자 운동도 될겸."

이게 시작이었다.

15분 걷다가 편의점 발견. "라면이나 하나 먹고 가자." 라면 먹는데 옆에서 같이 라면 먹던 남자 둘이 말 걸어옴. 알고보니 같은 나이트에서 나온 사람들.

"형 우리 2차 갈건데 같이 갈래요?"

음.. 내가 왜 OK를 했을까. 아마 라면 먹으면서 웃긴 얘기를 너무 잘해서 그랬나봄.

2차 간 곳은 이태원 쪽 라운지. 거기서 양주 시키고 안주 시키고. 그 사람들 지인이 또 오고. 결국 6명이서 새벽 6시까지 마심.

최종 정산: 양주 2병 + 안주 + 택시비 = 대략 25만원 내 몫.

근데 여기서 끝이 아님.

그 중 한명이 운동 좋아하는 사람이라 같이 헬스장 등록하자고 해서 등록함(3개월 45만원). 다른 한명이 운영하는 와인바에 놀러가서 또 마심(15만원). 그리고 다같이 제주도 여행 계획 세워서 예약함(항공+숙박 65만원).

택시비 28,000원 아끼려다가 한달만에 150만원 씀.

근데 솔직히 말하면? 인생에서 가장 잘 쓴 150만원이다. 지금 그 사람들이랑 매주 만나는 사이가 됐다. 30대 되면 새로운 친구 사귀기 힘든데 편의점 라면 하나로 이렇게 됐다.

여러분 새벽에 편의점 가면 옆사람한테 말 걸어보세요.', 203, 2867, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '엄마가 나이트 같이 가자고 한다', '제목 그대로임. 미친거 아님. 실화임.

우리 엄마 올해 52살인데 작년에 아빠랑 이혼하시고 갑자기 활동적으로 변하심. 요가 다니고 필라테스 다니고 친구들이랑 여행 다니고.

근데 어제 저녁에 갑자기 "너 나이트 가봤어?" 물어보심. 나 27살인데 당연히 가봤지 근데 엄마한테 "네" 하기 좀 그래서 "몇번..." 이러니까

"엄마 친구들이 나이트 가자고 하는데 엄마가 한번도 안 가봐서 무섭다. 너 먼저 가서 어떤 곳인지 알려줘."

???

처음엔 당황했는데 생각해보니까 이혼하시고 자기 인생 찾으시려는건데 나쁠게 뭐가 있나 싶어서 "그러면 엄마 내가 데리고 갈게"라고 했다.

이번주 토요일에 엄마랑 나이트 간다. 인생에 이런 날이 올 줄이야.

가서 어떻게 해야할지 진짜 모르겠다. 엄마가 너무 신나하시면 어쩌지. 엄마 친구분들이랑 오시면 내가 에스코트를 해야하나.

비슷한 경험 있는 사람? 부모님이랑 유흥 간 경험?', 156, 2234, false, NOW() - INTERVAL '35 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '강남 vs 홍대 10년 결론 내림', '이 논쟁을 10년째 하고 있는 사람으로서 최종 결론을 내리겠다.

먼저 내 이력: 22살부터 32살까지 강남 클럽 약 200번, 홍대 클럽 약 150번 감. 매주 1-2번은 갔으니까 대충 맞을거다.

【강남이 낫다고 느끼는 순간】
- 소개팅 후 2차로 갈 때 (분위기가 도와줌)
- 거래처 사람이랑 갈 때 (격이 있어보임)
- 깔끔하게 술 마시고 싶을 때
- 30대 이상끼리 갈 때

【홍대가 낫다고 느끼는 순간】
- 친구들이랑 미친듯이 놀고 싶을 때
- 돈 없을 때 (진심으로)
- 새로운 사람 만나고 싶을 때
- 분위기 상관없이 그냥 춤추고 싶을 때

【10년의 결론】
정답 없다. 그날 기분에 따라 다르다.

근데 하나 확실한건 "강남갔다가 2차 홍대" 이 루트는 택시비만 4만원 나가니까 처음부터 하나 정하고 가라. 이것만 지키면 된다.

아 그리고 이태원은? 이태원은 별개의 차원이라 비교 자체가 안됨. 거기는 한국이 아니다.', 94, 1567, false, NOW() - INTERVAL '8 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '회사 부장님 클럽에서 만났는데', '이 글은 퇴사 후에 쓴다. 지금 쓰면 잘린다.

토요일 밤 홍대 클럽 갔는데 VIP쪽에 익숙한 뒷모습이 보임. 설마 했는데 고개를 돌리니까 우리 부장님이었다.

서로 눈 마주침. 3초간 정적. 그리고 동시에 고개 숙임.

근데 반전은 부장님이 먼저 다가오심. "야 이XX 너 여기 왜 있어" (반말 아님 진짜 그렇게 부르심ㅋㅋ 부장님 스타일). 그리고 "이리 와 같이 마셔" 해서 부장님 테이블로 감.

부장님 옆에 부장님 대학 동기분들이 계셨는데 "우리 회사 에이스야" 이러면서 소개해주심. 평소에 칭찬 한번 안 하시는 분이. 술의 힘인가.

더 놀란건 부장님 춤. 진심으로 잘 추심. 나중에 들어보니 대학때 댄스동아리였다고.

그 뒤로 회사에서 부장님이 나한테 확실히 잘해주심. 은근히 좋은 프로젝트 넣어주시고 야근할때 커피 사다주시고.

교훈: 클럽에서 상사 만나면 도망가지 마라. 인사 잘 하면 인생이 바뀐다.

(근데 월요일 출근해서 눈 마주쳤을때 둘 다 아무 말 안 한건 국룰이다)', 178, 2456, false, NOW() - INTERVAL '6 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '술 한방울도 못 마시는데 클럽 3년째 다니는 사람', '글 제목 보고 "거짓말"이라고 생각할 사람들 많을텐데 100% 사실이다.

나는 알코올 알레르기가 있다. 소주 한모금만 마셔도 온몸이 빨개지고 심장이 뛰고 토 나옴. 유전이라 치료도 안됨.

근데 클럽을 좋아한다. 정확히는 춤추는걸 좋아한다. 어릴때부터 음악 나오면 몸이 움직이는 체질임.

처음 갔을때 바에서 "콜라 주세요" 했더니 바텐더가 "진짜요?" 하길래 "네 진짜요" 했음. 좀 쪽팔렸는데 두번째부터는 전혀 신경 안 쓰게 됨.

오히려 장점이 더 많다:
1. 다음날 숙취 없음. 토요일 클럽 갔다가 일요일 아침에 운동 감.
2. 택시비 안 나옴. 맨정신이니까 새벽에 지하철 첫차 타고 감.
3. 기억이 다 남음. 어젯밤 뭐 했는지 하나도 기억 못하는 친구들 보면 불쌍.
4. 의외로 여자들이 좋아함. "술 안 마시는데 클럽 오는거 신기하다" 이러면서 말 걸어옴.

단점은 딱 하나. 테이블 끼면 분위기상 양주를 시켜야 하는데 나는 못 마시니까 친구들이 다 마심. 내 돈으로 산 양주를 친구들만 마시는 이 현실.

클럽 = 술 이라는 공식은 틀렸다. 음악이랑 춤이 본질이다.', 112, 1678, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '3만원짜리 입장료의 가치를 수학적으로 계산해봤다', '쓸데없는 계산인거 알지만 궁금해서 해봤다.

클럽 입장료 3만원. 평균 체류시간 4시간. 시간당 7,500원.

비교해보자:
- 영화관: 15,000원 / 2시간 = 시간당 7,500원 (동일)
- PC방: 1,500원 / 1시간 = 시간당 1,500원 (PC방 압승)
- 노래방: 20,000원 / 2시간 = 시간당 10,000원 (클럽이 저렴)
- 볼링: 25,000원 / 1시간 = 시간당 25,000원 (클럽 압승)
- 스카이다이빙: 250,000원 / 0.1시간 = 시간당 2,500,000원 (비교불가)

결론: 클럽은 시간당 가성비로 따지면 영화관과 동일하고 노래방보다 저렴하다.

근데 여기에 무형 가치를 더해야 한다:
- 스트레스 해소 (정신과 상담 시간당 15만원)
- 새로운 인연 가능성 (소개팅 앱 월 3만원)
- 운동 효과 (헬스장 월 10만원, 4시간 춤추면 칼로리 800 소모)

이걸 다 합산하면 클럽 입장료 3만원은 사실 69,500원의 가치가 있다. 결론: 우리는 매번 36,500원을 벌고 있는거다.

...라고 친구한테 설명했더니 "야 그냥 가자"라고 함.', 167, 2134, false, NOW() - INTERVAL '12 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '드레스코드 때문에 차에서 갈아입은 썰', '이건 아무한테도 안 말한 비밀인데 여기는 익명이니까 쓴다.

금요일 저녁. 퇴근하고 바로 클럽 가려고 회사에서 입던 옷 그대로 감. 근데 도착해보니 스마트캐주얼 드레스코드.

나: 카키 면바지 + 줄무늬 폴로셔츠 + 뉴발란스 993.
드레스코드: 슬랙스 + 셔츠 + 가죽구두.

입구에서 "죄송한데 오늘 드레스코드가..." 하길래 "5분만요"하고 차로 뛰어감.

차 트렁크에 만약을 위해 넣어둔 검정 셔츠가 있었음 (전 여친이 차에 놓고간거). 그걸 주차장에서 갈아입고. 바지는 카키 면바지 그대로인데 어두우면 안 보이겠지 하고. 신발은... 차에 있던 검정 슬리퍼...는 더 안되겠지. 그래서 뉴발란스 그대로.

다시 입구 감. 같은 스탭. "아 셔츠 갈아입으셨네요 ㅎㅎ" 하면서 통과시켜줌. 근데 안에 들어가니까 나보다 더 캐주얼한 사람 많았음. 뭔데.

교훈: 차 트렁크에 검정 셔츠 하나 넣어두면 인생이 편해진다. 진심으로.', 83, 1123, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '아내한테 들켰다', '오해하지 마라. 바람 아니다.

결혼 7년차. 40대. 요즘 회사 스트레스가 너무 심해서 혼자 조용히 술 마시고 싶었다. 근데 아내한테 "나 라운지 가서 혼자 술 마시고 올게"라고 하면 100% "거기 왜 가? 누구 만나?" 이 질문이 돌아올거 알아서 "회사 회식이야"라고 했다.

압구정 라운지 가서 바 자리에 앉아서 위스키 한잔 마시면서 멍때리고 있었는데 진짜 좋았다. 일주일간 쌓인게 녹는 느낌.

근데 나갈때 카드 결제 문자가 아내 폰으로도 갔음. "압구정 XX라운지 85,000원."

집에 오니까 아내가 거실에 앉아있음. "회식인데 왜 라운지에서 결제가 돼?"

솔직하게 말했다. "회사 스트레스 받아서 혼자 술 마시고 싶었다. 바람 아니다."

3초 정적 후에 아내가 "다음에는 나도 데려가. 나도 스트레스 받아."

결론: 솔직함이 답이다. 그리고 다음주에 아내랑 같이 라운지 간다.

근데 한가지 걱정은 아내가 라운지 분위기를 좋아하면 지출이 2배가 된다는거...', 198, 2789, false, NOW() - INTERVAL '25 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '새벽 5시 국밥집에서 인생 상담 받은 이야기', '이태원에서 놀다가 새벽 5시에 혼자 해장국집에 앉았다. 친구들은 다 택시 타고 갔는데 나는 돈 아까워서 첫차 기다리는 중.

국밥 시키고 앉아있는데 옆자리에 50대 아저씨가 앉으심. 양복 입고 계셨는데 넥타이는 풀려있고 눈이 충혈돼 있었음.

아저씨가 먼저 말 걸으심. "젊은 사람이 이 시간에 혼자 국밥이야?"

"네 친구들은 먼저 갔어요."

"나도 혼자야. 접대 끝나고 왔는데 집에 가기 싫어서."

그렇게 말을 트고 한 시간을 얘기했다. 아저씨는 중소기업 대표였는데 코로나때 회사 거의 망할뻔 했고, 아내랑 이혼 위기 넘기고, 직원 절반 잘랐던 얘기를 하셨다.

"근데 다 지나가더라. 지금은 회사도 안정됐고 마누라랑도 잘 지내. 그때 포기 안 한게 다행이야."

나도 모르게 내 얘기를 했다. 취준 3년째인데 자신감 바닥이라고. 면접 떨어질때마다 사람이 아닌것 같다고.

아저씨가 국밥 한그릇 더 시켜주시면서 "3년이면 충분히 노력한거야. 안 되는게 아니라 아직 안 된거야. 포기만 안 하면 돼."

이름도 모르는 아저씨한테 새벽 국밥집에서 울었다. 인생 상담비 0원. 국밥값은 아저씨가 내셨다.

지금 이 글 쓰는 이유는 3주 뒤에 그 아저씨 회사에 입사했기 때문이다. 명함에 적혀있던 회사를 검색해서 지원했다. 면접때 "대표님 저 새벽에 국밥집에서 만났던 사람입니다" 했더니 웃으시면서 합격시켜주셨다.

새벽 국밥집에 가면 인생이 바뀐다. 농담 아니다.', 312, 4567, false, NOW() - INTERVAL '15 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'free', '전 여친이랑 같은 클럽에서 만났는데 전개가 예상 밖', '헤어진지 4개월. 카톡 차단. 인스타 언팔. 완벽한 이별이라고 생각했다.

토요일 강남 클럽. 친구 3명이랑 부스 잡고 놀고있었는데 반대편 부스에 익숙한 뒷모습. 머리 잘랐네. 아.

마주침. 1초만에 서로 인식. 나는 얼어붙었고 얘는 한번 쳐다보고 고개 돌림.

여기까지는 예상 가능한 전개지?

근데 한 30분 뒤에 얘 친구가 우리 부스로 옴. "쟤가 네 연락처 좀 달래." 뭔데 갑자기. 차단해놓고.

결국 밖에서 만남. "할 말 있어." "뭔데." "그때 내가 잘못한거 알아. 근데 미안하다고 말할 기회가 없었어. 차단해놔서."

클럽 밖 편의점 앞에서 30분 동안 서서 얘기함. 근데 재밌는게 다시 사귀자는 얘기는 서로 안 했음. 그냥 서로 미안했던 것만 말하고 "잘 지내"하고 헤어짐.

근데 이상하게 그 뒤로 마음이 편해졌다. 4개월간 가슴에 있던 뭔가가 빠진 느낌.

사람 관계가 이렇게 마무리되는것도 나쁘지 않다고 생각한다. 꼭 다시 만나거나 완전히 남이 되거나 둘 중 하나가 아니라 이런 중간 지점도 있더라.

다들 전 여친/전 남친 어떻게 정리했어? 나만 이런 경험 있나?', 145, 2098, false, NOW() - INTERVAL '5 hours');

-- ============================================================
-- 업소후기 (reviews) — 8개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '일산명월관 다녀왔는데 접대의 정석을 봤다', '솔직히 쓴다. 요정이라는 곳을 처음 가봤다.

거래처 사장님이 60대인데 "조용한 데서 마시자"고 하셔서 거래처 과장님이 잡아준 곳이 일산명월관. 나는 30대 초반이라 요정이 뭔지도 잘 몰랐음.

도착하자마자 느낀건 "아 이게 어른들의 세계구나."

한옥 느낌의 인테리어인데 싸구려 한옥이 아니라 진짜 고급진 한옥. 마담이 나오셔서 인사하는데 분위기 잡는게 프로 중의 프로. 사장님 직급, 취향, 오늘 모임 목적을 3분만에 파악하시더니 그에 맞는 세팅을 해주심.

양주는 로얄살루트 21년으로 했는데 마담이 사장님 잔에는 물을 좀 더 넣어주고 내 잔에는 스트레이트에 가깝게 따라주심. 나중에 물어보니 "사장님은 부드럽게 드시는 스타일이시고 이 쪽은 처음이시니까 맛을 알아야죠" 라고.

거래처 사장님이 기분이 너무 좋으셨는지 다음날 바로 계약서 보내주심ㅋㅋ 접대비 100만원인데 계약 2억짜리니까 ROI 200배.

한가지 충격이었던건 전통주 라인업. 복분자, 막걸리, 매실주를 다 시음할 수 있었는데 양주만 마셔본 나한테는 신세계였음.

결론: 20대는 클럽, 30대는 나이트, 40대 이상 접대는 요정. 이게 정답 같다.', 67, 934, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '수원찬스돔나이트 토요일에 갔는데 내가 늙었나봐', '결론부터: 분위기 자체는 최고였다. 근데 나한테 안 맞았다.

토요일 밤 11시 도착. 일단 줄이 길다. 한 15분 기다림. 들어가니까 사람이 꽉 참. 스피커 앞은 땀냄새와 향수 냄새의 조합.

무대 앞 에너지는 인정한다. DJ가 리믹스 메들리 틀었는데 20대 애들이 떼창하면서 뛰는거 보고 "아 나도 저랬었지" 싶더라. 35살이 느끼는 세대차이.

부스 잡고 앉았는데 양주는 발렌타인 17년으로 감. 무난하고 좋았음. 웨이터가 세팅 잘해줘서 편했고.

근데 나한테 안 맞았던 이유가 있다. 소리가 너무 커서 옆사람이랑 대화가 안됨. 나이 먹으니까 춤보다 대화가 좋아지더라. 친구들이랑 앉아서 술 마시면서 얘기하고 싶은데 음악이 너무 커서 소리를 질러야 함.

결론: 20대는 무조건 가봐야 하는 곳. 에너지가 장난 아님. 근데 35살 이상이면 라운지가 더 맞을수도 있다.

참고로 같이 간 친구(38살)는 "나는 여기가 좋은데?" 하면서 무대에서 미친듯이 춤췄다. 사람마다 다른거다.', 54, 823, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '해운대고구려 출장 갔다가 단골 됐다', '부산 출장이 한달에 한번 있는데 이제 출장이 기다려진다. 이유는 해운대고구려.

처음 간건 부산 지사 팀장님이 데려가줌. "형 부산 나이트 한번도 안 가봤어요?" "ㅋㅋ 그러면 오늘 보여줄게"

도착하자마자 스케일에 놀랐다. 서울 나이트도 꽤 가봤는데 여기는 차원이 다름. 무대가 크고 천장이 높아서 답답한 느낌이 전혀 없음.

근데 더 놀란건 부산 특유의 분위기. 서울은 좀 절제된 느낌이라면 부산은 "오늘 다 불태우자"는 텐션. 모르는 사람이랑도 쉽게 어울리고 분위기가 개방적임.

실장님이 세심한데 내가 서울에서 왔다고 하니까 부산 스타일 놀이법을 알려주심. "서울 분들은 부스에서 안 나오시는데 여기는 무대 앞으로 나가야 제맛입니다" 라고. 진짜 무대 앞으로 가니까 에너지가 다르더라.

그 뒤로 부산 출장 갈때마다 감. 이제 실장님이 내 취향을 알아서 세팅해줌. 이번달에는 부스 위치까지 미리 잡아주심.

출장을 핑계로 매달 부산 가는 직장인이 나만은 아닐거다.', 73, 1067, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '일산룸 3개월 다니면서 느낀 점을 솔직하게', '처음 쓰는 리뷰인데 3개월치를 몰아서 쓴다.

일산 사는 30대 직장인. 퇴근하고 혼자 술 마실 곳을 찾다가 일산룸을 알게 됨.

【1개월차 — 탐색기】
긴장 많이 하고 감. 실장님한테 "처음인데 어떻게 하면 되나요"라고 솔직하게 말했더니 오히려 편하게 해주심. 첫 방문이라 부담없는 구성으로 세팅해주셨는데 양주 발렌타인 17년에 간단한 안주. 룸이 깔끔하고 노래방 기기가 최신이라 혼자서도 편하게 놀았음.

【2개월차 — 적응기】
매주 수요일마다 감. 스트레스 받는 날이 수요일이라. 실장님이 내 취향을 파악하기 시작. "오늘은 좀 지쳐보이시네요 조용한 방으로 해드릴게요" 이런 말 해주시면 진짜 감동.

【3개월차 — 현재】
이제 전화하면 "오늘도 수요일이세요? ㅎㅎ 단골방 비워놨어요" 이럼. 양주도 매번 다른거 시도하는 재미가 있음. 지난주는 글렌피딕 12년 마셔봤는데 과일향 나면서 부드러워서 좋았다.

【솔직한 단점】
돈이 좀 든다. 매주 가니까 한달 지출이 꽤 됨. 근데 헬스장 3개월 60만원 끊고 한번도 안 간것보다는 낫지 않나? 적어도 여기는 매주 가니까.

평일 저녁에 혼자 조용히 놀 곳 찾는 사람한테는 추천. 근데 주말에 단체로 시끄럽게 놀고 싶으면 나이트 가는게 맞음.', 58, 867, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '성남샴푸나이트 갔다가 아빠 세대를 이해했다', '이거 읽는 사람 중에 부모님이 나이트 다니셨다는 사람 있을거다. 나도 아빠가 젊을때 나이트 다녔다는 얘기 듣고 "에이 그게 뭐가 재밌어" 했었는데.

친구가 성남샴푸나이트 가보자고 해서 감. 나는 클럽만 가봤지 나이트는 처음.

들어가자마자 분위기가 클럽이랑 완전 다름. 클럽은 "나 여기서 미쳐보겠다"면 나이트는 "오늘 제대로 놀아보자"인 느낌. 비슷한 것 같지만 뉘앙스가 다르다.

무대에서 가수분이 라이브로 노래 부르시는데 트로트를 이렇게 신나게 부를 수 있나 싶었음. 주변 아저씨들이 따라부르면서 분위기 올리는데 나도 모르게 따라부름.

제일 좋았던건 부스 문화. 클럽은 서서 노는데 여기는 앉아서 편하게 술 마시면서 대화하다가 신나는 노래 나오면 나가서 춤추고 또 들어와서 마시고. 이 리듬이 좋더라.

집에 와서 아빠한테 전화했다. "아빠 나 오늘 나이트 갔다왔어." 아빠가 웃으시면서 "어떠냐 재밌지?" 하심. 그리고 30분 동안 아빠 나이트 무용담을 들었다. 아빠가 이렇게 신나서 얘기하는거 처음 봤다.

세대가 다를 뿐이지 노는건 똑같더라. 아빠 세대를 이해하게 된 밤이었다.', 91, 1234, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '호빠 처음 간 여자의 솔직한 후기 (긴 글 주의)', '여자 4명이서 갔다. 결론부터: 왜 진작 안 갔나 후회했다.

먼저 배경 설명. 우리 넷 다 28-30살. 전부 직장인. 평소에 술 마시면 이자카야 아니면 와인바만 갔는데 하루는 "우리 호빠 가볼까?" 이 한마디에서 시작됨.

다들 호빠가 뭔지 대충은 아는데 진짜 가본 사람은 없었음. 인터넷 후기 보면서 반은 기대 반은 걱정.

실장님한테 미리 전화해서 "저희 처음이에요"라고 했더니 웃으시면서 "걱정마세요 편하게 오시면 됩니다" 하심.

도착하니까 일단 생각보다 깔끔함. TV에서 보는 그런 느낌 아니고 그냥 좀 고급진 노래방 같은 느낌? 초이스를 하라고 하는데 이게 제일 어색했음. 4명 앞에 여러 명이 서고 우리가 고르는 시스템. 친구 하나가 "이거 완전 프로듀스101이다" 해서 다같이 웃음 터짐ㅋㅋ

호스트분들이 대화를 잘 이끌어줘서 1시간 지나니까 완전 편해짐. 우리끼리 마시면 항상 하는 회사 불만 얘기만 하는데 여기서는 다른 주제로 재밌게 얘기함.

양주 패키지로 나왔는데 적당했고, 2차 강요 같은거 전혀 없었음.

집에 가면서 4명 전부 "또 오자"라고 함. 다음달에 예약 잡아놨다.

여자들끼리 갈 곳 고민하면 호빠 진심 추천. 맨날 이자카야만 가지 말고.', 84, 1345, false, NOW() - INTERVAL '40 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '청담H2O나이트 평일 후기 — 오히려 평일이 답이다', '주말에 항상 갔는데 이번에 처음으로 수요일에 가봤다.

결론: 평일이 100배 낫다.

이유 1. 사람이 적절하다. 주말은 너무 꽉 차서 화장실 가려면 사람 헤치고 가야 하는데 평일은 여유있게 돌아다닐 수 있음.

이유 2. 부스가 남아있다. 주말에는 예약 안 하면 부스 못 잡는데 수요일에는 워크인으로 바로 앉을 수 있었음. 위치도 좋은 자리.

이유 3. 가격이 다르다. 평일 할인이 있어서 같은 양주를 주말보다 저렴하게 마실 수 있음.

이유 4. 분위기가 좀 더 성숙하다. 주말에는 20대 초반 텐션이 강한데 평일에는 30대 직장인 위주라 분위기가 좀 더 차분하면서도 즐거움.

이유 5. DJ 셋이 다르다. 주말은 EDM 위주로 빵빵 터지는데 평일은 좀 더 칠한 곡 위주. 개인적으로 이게 더 취향.

단점: 늦게까지 안 함. 주말은 새벽 4-5시까지인데 평일은 2시쯤 끝나는 분위기. 근데 다음날 출근해야 하니까 오히려 이게 장점.

결론: 주말에 사람 많아서 스트레스 받는 분들은 수요일이나 목요일 시도해보세요. 인생이 바뀜.', 46, 723, false, NOW() - INTERVAL '7 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'reviews', '파주야당스카이돔 — 서울 안 가도 된다', '경기 북부에 이런 곳이 있는줄 몰랐다. 진심으로.

파주 사는 사람인데 놀려면 항상 서울까지 나갔음. 강남까지 1시간, 홍대까지 40분. 택시비가 편도 4만원. 놀고나서 새벽에 돌아오면 택시비만 8만원.

친구가 "야당에 스카이돔 가봤냐" 해서 뭔데 하고 갔는데.

일단 천장이 높다. 이름이 스카이돔인 이유가 있었음. 지하에 있는 좁은 클럽 느낌이 아니라 넓고 시원한 느낌. 무대도 있고 공연도 하고.

그리고 파주/일산 사람들이 많이 오니까 아는 사람 만날 확률이 높음. 이게 장점이자 단점인데 나는 장점이라고 봄. 동네에서 놀면 커뮤니티가 생기니까.

제일 좋은건 집에서 택시로 10분이면 도착한다는거. 서울까지 갈 필요가 없다. 놀고 나서도 만원이면 집에 간다.

서울 안 부러울 줄은 몰랐다.', 39, 612, false, NOW() - INTERVAL '6 hours');

-- ============================================================
-- 꿀팁 (tips) — 6개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '나이트 처음 가는 사람이 100% 하는 실수 6가지', '나이트 50번 넘게 간 사람이다. 처음 오는 사람들이 매번 같은 실수를 한다.

실수 1: 너무 일찍 간다
밤 9시에 오는 사람 있음. 그때 가면 텅 비어있어서 민망하고 나중에 사람 올때쯤 이미 지쳐있음. 골든타임은 11시~12시. 그때 가야 분위기가 딱 맞음.

실수 2: 양주를 모르고 간다
웨이터가 "뭐 드릴까요" 하면 메뉴판 보면서 고르는 사람 있는데 이러면 바가지 느낌남. 미리 정하고 가라. 모르겠으면 "발렌타인 17년"이면 절대 실패 없다.

실수 3: 혼자 부스에만 앉아있다
부스 잡고 앉아서 폰만 보는 사람 의외로 많음. 그러려고 나이트 온거 아니잖아. 음악 좋으면 나가서 춤추고 안 좋으면 옆 테이블 사람한테 말 걸고.

실수 4: 구두 신고 간다
새 구두는 절대 신고 가지 마라. 3시간 서있으면 발이 죽는다. 편한 구두나 깔끔한 로퍼로.

실수 5: 대리운전 앱을 안 깔고 간다
새벽에 택시 못 잡아서 30분 서있는 사람 매번 봄. 카카오대리든 뭐든 미리 깔아놓기.

실수 6: 친구를 너무 많이 데려간다
6명 이상 가면 부스 비용도 올라가고 취향이 다 달라서 의견 충돌남. 딱 3-4명이 최적.

이것만 알아도 첫 나이트에서 실패하지 않는다. 저장 필수.', 134, 1923, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '양주 완전 초보를 위한 현실적인 가이드', '양주 관련 글 보면 전부 "이건 스모키하고 이건 피티하고" 이런 전문용어 쓰는데 솔직히 처음 마시는 사람한테 이런 말 해봤자 모른다.

현실적으로 정리해줌.

■ 처음이면 이거: 발렌타인 17년
왜? 부드럽다. 단맛이 약간 있다. 콜라 안 넣어도 마실만하다. 한국에서 가장 많이 팔리는 양주다. 이걸 시키면 누구도 뭐라 안 한다.

■ 좀 강한맛 좋아하면: 조니워커 블랙
단맛보다는 쌉싸름한 느낌. 호불호가 있는데 좋아하는 사람은 이것만 마심. 나는 개인적으로 이거.

■ 접대 자리에서: 로얄살루트 21년
비싸다. 근데 병이 이쁘고 따는 순간 "오" 소리가 나온다. 맛도 좋은데 솔직히 이 가격대는 분위기값이다.

■ 여자친구랑 가면: 헤네시 VSOP
브랜디(꼬냑) 계열인데 부드럽고 달콤한 편이라 여성분들이 잘 드심. 코냑잔에 따라주면 분위기 200% 상승.

■ 좀 안다고 티내고 싶으면: 글렌피딕 12년
싱글몰트 위스키. "나 이거 좋아해"라고 하면 술 좀 아는 사람 느낌남. 과일향 나면서 깔끔함.

■ 절대 시키지 마라: 이름 모르는 양주
메뉴판에 처음 보는 이름 있으면 호기심에 시키지 마라. 99% 후회한다. 모르면 발렌타인 17년이 진리다.', 108, 1567, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '숙취를 과학적으로 막는 법 — 약대생이 알려줌', '약학대학 다니는 사람이다. 주변에서 숙취 물어보는 사람이 너무 많아서 정리함. 민간요법 말고 진짜 되는 것만.

★ 술 마시기 전
- 우유 한잔 (200ml): 위벽에 지방층을 만들어서 알코올 흡수 속도를 늦춤. 이게 진짜 효과 있다.
- 식사를 꼭 하고 마셔라: 공복에 마시면 알코올이 바로 혈류로 들어감. 기름진 안주가 좋다.

★ 마시는 도중
- 양주 한잔당 물 한잔: 1:1 비율. 이게 숙취 예방의 핵심. 탈수가 숙취의 주원인이다.
- 폭탄주 하지 마: 종류를 섞으면 간이 처리하는 속도가 느려진다. 하나만 마셔라.
- 안주는 단백질+지방 위주: 치즈, 견과류, 고기. 과일도 좋다 (과당이 알코올 분해를 도움).

★ 자기 전
- 이온음료 500ml를 마셔라: 포카리가 국룰. 전해질 보충이 핵심이다.
- 비타민 B 복합제: 알코올 대사에 비타민 B가 소모되는데 이걸 보충.

★ 다음날 아침
- 물을 많이 마셔라: 2리터 이상.
- 꿀물: 과당이 알코올 대사를 도와줌.
- 해장국은 왜 효과가 있나: 국물의 나트륨이 전해질 보충 + 따뜻한 온도가 위 혈류를 증가시킴.

★ 효과 없는 것들
- 컨디션, 여명808: 플라시보가 대부분. 진짜 효과는 거의 없음. (제조사 죄송합니다)
- 해장술: 최악이다. 숙취를 미루는거지 없애는게 아님.
- 사우나: 탈수를 더 심하게 만듦. 절대 하지 마라.

이거 저장해놓고 술 마시기 전에 한번만 읽어봐라. 인생이 달라진다.', 187, 2678, false, NOW() - INTERVAL '20 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '요정 처음 가는 사람을 위한 현실 가이드', '요정을 4번 가봤다. 전부 접대 자리였는데 갈때마다 새로운걸 배운다.

일단 요정은 클럽/나이트랑 완전 다른 세계다. 비교 자체가 안 됨.

【분위기】
시끄러운 음악이 없다. 조용하다. 대화가 메인이다. 그래서 접대에 최적인거다. 거래처 사장님 말씀을 제대로 들을 수 있으니까.

【마담의 역할】
마담이 모든걸 컨트롤한다. 손님 분위기 파악하고, 대화 주제 던져주고, 타이밍에 맞춰 술 리필하고. 서비스업의 끝판왕을 보고 싶으면 요정 마담을 봐라.

【술】
양주도 있지만 전통주를 꼭 마셔봐라. 막걸리, 복분자, 매실주를 사기그릇에 따라 마시는 맛이 있다. 양주만 마셔본 사람은 신세계를 경험할거다.

【가격】
비싸다. 솔직히 비싸다. 근데 분위기+서비스+음식+술 합치면 이해가 된다. 접대비로 쓰는거면 가격대비 효과가 압도적.

【누가 가야하나】
- 40대 이상 접대: 강력 추천
- 30대 비즈니스: 거래처가 40대 이상이면 추천
- 20대: 아직 이르다. 경험용으로 한번 가보는건 좋지만 단골로 갈 나이는 아님

한마디로: 어른들의 놀이터다. 근데 그 "어른"이 되면 왜 좋은지 이해가 된다.', 63, 912, false, NOW() - INTERVAL '7 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '호빠 초보 여자들이 가장 궁금해하는 7가지', '호빠를 10번 넘게 다녀본 사람으로서 처음 가는 분들이 항상 물어보는것들 정리.

Q1. 혼자 가도 돼요?
A. 가능한데 추천은 안 함. 2-4명이 제일 좋음. 혼자 가면 좀 어색함.

Q2. 초이스가 뭔데요?
A. 호스트분들이 쭉 서고 마음에 드는 사람을 고르는거. 쪽팔리면 "아무나 좋아요" 하면 실장님이 알아서 매칭해줌.

Q3. 대화만 해요? 진짜?
A. 진짜다. 대화 + 술 + 간단한 게임이 전부. 2차 강요 같은거 없다. 불편하면 안 가면 됨. 근데 대화가 재밌어서 시간 금방 감.

Q4. 비용이 얼마나 들어요?
A. 양주 패키지 기준으로 업소마다 다른데 전화해서 물어보면 친절하게 알려줌. 미리 확인하고 가는게 좋다.

Q5. 위험하지 않아요?
A. 정상적으로 운영하는 곳은 전혀 위험하지 않음. 걱정하는것과 현실이 많이 다르다. 그냥 좀 고급진 노래방이라고 생각하면 됨.

Q6. 옷은 뭐 입고 가요?
A. 너무 캐주얼하지만 않으면 됨. 예쁘게 입고 가면 기분도 업되고 좋음. 굽 높은 힐은 추천 안 함 (앉아있으니까 상관없긴 한데 들어갈때 불편).

Q7. 다음에 또 가고 싶으면?
A. 실장님 연락처 저장해두고 다음에 예약하면 됨. 단골이 되면 서비스가 확 달라짐.

결론: 걱정의 90%는 가보면 사라진다. 한번만 가봐라.', 76, 1098, false, NOW() - INTERVAL '2 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'tips', '웨이터한테 팁 주는 타이밍과 방법 — 나이트 5년차의 노하우', '이거 아는 사람이 별로 없더라. 나이트에서 팁 문화가 있는데 대부분 "줘야해? 얼마?" 이 수준에서 끝남.

5년 다니면서 터득한 팁(?) 문화를 정리한다.

【언제 주나】
첫 세팅때 줘라. 앉자마자 웨이터가 양주 세팅하고 안주 놓고 물 가져다줄때 그때 만원 하나 슬쩍 주면 그날 밤 서비스가 달라진다. 진심으로.

【얼마를 주나】
만원이면 충분하다. 2만원 주면 VIP 대우. 5만원 이상은 안 줘도 된다. 팁은 마음이지 금액이 아니다.

【어떻게 주나】
악수하면서 지폐를 손에 넣어줘라. 이게 가장 자연스럽다. 테이블에 놓고 "이거 드세요"하면 좀 어색함.

【팁 준 후 달라지는 것들】
- 물/안주 리필이 빨라진다
- 좋은 위치로 자리를 바꿔주기도 한다
- 주변에 빈 테이블 생기면 넓은데로 옮겨줌
- 화장실 갈때 "여기 물건 봐드릴게요" 해줌
- 나갈때 택시까지 잡아줌

【하면 안 되는 것】
- "팁 줬으니까 서비스 해줘"식으로 요구하기 → 분위기 최악
- 여러번 나눠서 주기 → 한번에 주는게 임팩트 있음
- 카드로 주기 → 현금이 국룰

팁은 의무가 아니다. 근데 주면 확실히 달라진다. 이게 현실이다.', 72, 1045, false, NOW() - INTERVAL '5 hours');

-- ============================================================
-- Q&A (discussion) — 5개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '나이트에서 만나서 결혼까지 한 사람 있나요?', '이 글은 진지하게 쓴다.

나 34살 남자인데 2년 전에 나이트에서 만난 여자랑 지금 결혼 준비중이다.

주변에서 "나이트에서 만난 사람이랑 결혼한다고?" 이 반응이 제일 많다. 심지어 부모님도 처음엔 "거기서 뭘 만나" 이러셨다.

근데 생각해봐라. 소개팅 앱에서 만나는거랑 뭐가 다르냐? 결국 사람 만나는 장소일 뿐인데.

우리 둘의 스토리: 부스에서 옆 테이블이었는데 내 친구가 저쪽 테이블 여자분한테 말 걸면서 자연스럽게 합석. 처음엔 그냥 같이 놀다가 새벽에 국밥 먹으러 갔는데 거기서 2시간 동안 둘이 얘기함. 취향이 너무 맞았음.

다음날 연락하고, 일주일 뒤에 만나고, 한달 뒤에 사귀고, 2년 뒤 프로포즈.

결혼식 축사에서 "나이트에서 만났습니다"라고 말할지 말지 지금 고민중ㅋㅋ

비슷한 경험 있는 사람? 진지하게 궁금하다. 나만 이런건 아니겠지?', 89, 1345, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '혼자 가는게 부끄러운 사람은 읽어봐', '댓글에 "혼자 가면 이상하지 않나요?"라는 질문이 계속 올라오길래 글로 쓴다.

나는 2년째 혼자 라운지 다니는 사람이다. 처음에는 쪽팔렸다. 진심으로. "저 사람 친구 없나?" 이런 시선이 느껴지는것 같았음.

근데 몇 번 가보니까 깨달은게 있다. 아무도 나한테 관심이 없다. 다들 자기가 노는데 바쁘지 혼자 온 사람을 쳐다볼 시간이 없다.

그리고 혼자 가면 좋은 점이 의외로 많다:

1. 내 페이스로 놀 수 있다. 친구들이랑 가면 "이제 가자" "아니 더 있자" 이런 충돌이 있는데 혼자면 내가 가고 싶을때 감.

2. 새로운 사람을 더 쉽게 만난다. 무리 지어 있으면 다가가기 어렵지만 혼자 바에 앉아있으면 옆사람이 말 걸어오기도 한다.

3. 바텐더랑 친해진다. 혼자 자주 가면 바텐더가 기억해주고 이것저것 추천해줌. 이 관계가 의외로 소중하다.

4. 술을 제대로 즐길 수 있다. 친구들이랑 가면 분위기에 맞춰 마시지만 혼자면 내가 마시고 싶은걸 마시고 싶은 속도로 마실 수 있다.

혼자 가는게 부끄러운 사람에게 한마디: 처음 한번만 용기내면 된다. 두번째부터는 "왜 진작 안 왔지" 할거다.

근데 한가지 팁. 혼자 갈때는 바 자리에 앉아라. 부스에 혼자 앉으면 진짜 외로워 보인다.', 67, 987, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '클럽 vs 라운지 — 만남 확률은 어디가 높을까?', '이 주제로 친구들이랑 2시간 논쟁했는데 결론이 안 나서 여기에 물어본다.

■ 클럽 쪽 의견 (내 친구 A)
"클럽이 만남 확률 높다. 일단 사람이 많잖아. 그리고 분위기가 개방적이니까 모르는 사람한테 말 걸기 쉽다. 옆에서 같이 춤추면 자연스럽게 대화가 시작된다."

■ 라운지 쪽 의견 (내 친구 B)
"라운지가 낫다. 클럽은 시끄러워서 대화가 안 되잖아. 라운지에서 바 자리에 앉으면 옆사람이랑 자연스럽게 대화할 수 있고 그게 더 깊은 만남으로 이어진다."

■ 내 의견
솔직히 둘 다 틀렸다고 생각한다. 만남은 장소가 아니라 태도에 달렸다.

클럽에서도 구석에서 폰만 보면 아무 만남 없고, 라운지에서도 혼자 위스키만 마시면 마찬가지.

결국 "먼저 말 거는 용기"가 있으면 어디서든 만남이 생기고 없으면 어디서든 혼자 마시다 간다.

근데 굳이 확률을 따지자면 클럽 쪽이 근소하게 높지 않나? 사람 수가 압도적으로 많으니까.

여러분은 어디파? 실제 경험 기반으로 댓글 좀.', 53, 834, false, NOW() - INTERVAL '6 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '양주 가격이 매장마다 다른 진짜 이유', '양주 가격 질문이 계속 올라오길래 업계 아는 사람으로서 정리한다. (전직 웨이터 출신)

같은 발렌타인 17년인데 왜 A 나이트는 15만원이고 B 나이트는 25만원일까?

이유 1: 위치
강남 한복판 = 임대료가 비쌈 = 양주 가격에 반영. 외곽으로 갈수록 저렴해지는건 당연.

이유 2: 서비스
양주만 탁 놓고 끝인 곳 vs 세팅부터 퇴실까지 풀서비스하는 곳. 웨이터 수, 서비스 퀄리티, 안주 구성까지 다 다름.

이유 3: 분위기
인테리어, 음향, 조명, 무대 규모. 이런게 다 돈이다. 좋은 분위기 = 높은 투자 = 높은 가격.

이유 4: 타겟층
20대 대학생 위주면 가격을 낮춰야 하고, 30~40대 직장인 위주면 가격이 올라가도 사람이 옴.

이유 5: (솔직한 이유) 마진
업소마다 마진율이 다르다. 어떤데는 박리다매, 어떤데는 고마진. 이건 사장 성향.

결론: 비싸다고 무조건 좋은건 아니고 싸다고 무조건 나쁜건 아니다. 자기 예산에 맞는 곳을 찾으면 된다.

근데 너무 싸면 의심해봐라. 이유가 있다.', 48, 723, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'discussion', '30대 넘으면 클럽 가면 안 되나?', '이 질문 진심으로 하는거다.

나 33살인데 요즘 클럽 가면 주변이 다 20대 초반이다. 거울 볼때마다 "나 여기 와도 되나" 싶다.

이번주에 친구가 "형 우리 이제 클럽 갈 나이 아니지 않냐"고 해서 기분이 좀 묘했다.

근데 나는 아직 음악 듣고 춤추는게 좋다. EDM 새 트랙 나오면 들어보고 DJ 셋리스트 체크하고. 취미가 이건데 나이 때문에 포기해야 하나?

외국은 40대 50대도 클럽 가는데 한국은 왜 이런 시선이 있는건지 모르겠다.

솔직하게 물어본다:
- 30대 넘어서도 클럽 다니는 사람?
- 나이 때문에 그만둔 사람?
- 대안으로 뭐 하고 있는 사람?

진짜 경험 기반으로 답변 부탁한다.', 72, 1123, false, NOW() - INTERVAL '5 hours');

-- ============================================================
-- 파티/벙개 (party) — 3개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '수원 벙개 3번째 모임 후기 — 이제 찐친 됐다', '놀쿨에서 처음 벙개 모집한게 3주 전이다. 그때 6명 모여서 찬스돔나이트 갔는데 그게 지금 3번째 모임까지 왔다.

1차 모임: 전원 초면. 어색어색. 근데 양주 한잔 돌리니까 30분만에 벽 다 허물어짐ㅋㅋ "형 연락처 줘요" "야 우리 다음주에 또 하자" 이런 분위기.

2차 모임: 6명에서 8명으로 늘어남. 첫 멤버 중 2명이 각각 친구 1명씩 데려옴. 이번에는 부스 2개 잡아서 좀 넓게 놀았음.

3차 모임(어제): 10명. 이제 단톡방도 있고 매주 뭐 할지 계획 세우는 수준까지 옴. 어제는 찬스돔 갔다가 2차로 고기집 가서 새벽까지 수다 떨었는데 첫날 만난 사람들인거 맞나 싶을 정도로 편했다.

솔직히 30대 되면 새 친구 사귀기 진짜 힘든데 놀쿨 벙개로 이렇게 될 줄 몰랐다.

다음주에도 합니다. 수원/성남 근처 사시는 분 댓글 주세요. 20대 후반~30대 초반이면 좋겠고 남녀 상관없습니다. 비용은 엔빵!', 48, 678, false, NOW() - INTERVAL '30 minutes');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '부산 해운대 금요일 벙개 — 현재 3/6', '부산 살거나 부산 놀러온 분들!

이번주 금요일(4/18) 저녁 7시부터 해운대에서 놀 사람 모집합니다.

현재 확정: 남2 여1 (모두 28-32살)
모집: 3명 더 (남녀 무관)

계획:
- 7시: 해운대 횟집에서 1차 (회+소주)
- 10시: 해운대고구려 2차
- 새벽: 해운대 해변 산책 or 편의점 라면

비용: 1차 엔빵 / 2차 양주는 같이 결정

조건:
- 20대 후반~30대
- 노쇼 하면 다음 모임 영구 밴
- 오픈카톡 안 씀. 놀쿨 쪽지로 연락

부산 로컬이면 더 좋고 여행 온 분들도 환영. 걱정되면 댓글로 질문하세요!', 34, 456, false, NOW() - INTERVAL '4 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'party', '이번주 토요일 강남 나이트 같이 가실분 (3/6)', '매주 토요일 정기 모임하고 있는데 이번주 인원이 부족해서 추가 모집합니다.

우리 모임 특징:
- 매주 다른 나이트/클럽 탐방 (이번주는 강남 쪽)
- 30대 위주 (28-38살)
- 남녀 비율 맞추는 편
- 비용은 양주+부스 엔빵
- 1차만 같이 하고 2차는 자유

현재: 남2 여1 / 추가 남1 여2 모집

이 모임이 좋은 이유: 매주 다른 곳을 가니까 혼자서는 못 가보는 곳들을 경험할 수 있음. 지난주는 청담 쪽 갔었는데 다들 만족. 후기는 나중에 올릴게요.

관심있으면 댓글! 쪽지로 상세 안내 드립니다.', 29, 389, false, NOW() - INTERVAL '2 hours');

-- ============================================================
-- 패션 (fashion) — 4개
-- ============================================================

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '남자 클럽/나이트 코디 — 돈 안 들이고 간지나는 법', '옷에 관심 없는 남자들 많잖아. 나도 그랬다. 근데 클럽 가면서 좀 달라짐.

비싼 옷 살 필요 없다. 이것만 지키면 됨.

■ 상의: 검정 셔츠
유니클로에서 2만원짜리 검정 셔츠 하나 사라. 린넨이든 옥스포드든 상관없다. 검정이면 된다. 매번 이거 입어도 아무도 모른다. 어두운데서 뭘 봐.

■ 하의: 검정 슬랙스
유니클로 이지팬츠 검정. 29,900원. 편하면서 깔끔해 보임. 청바지는 비추. 스키니진도 비추. 슬랙스가 답.

■ 신발: 검정 첼시부츠 or 로퍼
운동화 가능한 곳도 있지만 가죽 신발이 확실히 다르다. 무신사에서 5만원대 첼시부츠 하나 사라. 3년은 신는다.

■ 향수: 블루 드 샤넬 or 자라
블루 드 샤넬 10만원인데 아까우면 자라 향수 3만원대도 충분하다. 안 뿌리는것보다 100배 낫다.

■ 악세서리: 시계 하나
팔찌, 목걸이, 반지 다 필요없다. 시계 하나면 됨. 없으면 안 해도 된다.

총 예산: 셔츠 2만 + 바지 3만 + 신발 5만 + 향수 3만 = 13만원.

이 13만원으로 매번 갈때마다 입으면 된다. 더 이상 뭘 사야하나 고민하지 마라.', 95, 1345, false, NOW() - INTERVAL '3 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '여자 나이트 복장 — 편하면서 예쁜 조합', '나이트 매주 다니는 여자다. 처음 갈때 뭐 입을지 검색하면 죄다 "원피스에 힐"이라고 나오는데 현실적인 답을 알려줌.

■ 절대 하지마: 높은 힐
3시간 서있고 춤추고 하는데 12cm 힐 신으면 발이 죽는다. 나중에 택시에서 신발 벗고 맨발로 걸어갈 자신 있으면 신어라.

■ 현실 정답 상의: 검정 크롭탑 or 오프숄더
클럽이든 나이트든 어두운데서 밝은색 옷은 의미 없다. 검정이 제일 무난하고 예뻐 보임.

■ 현실 정답 하의: 레더 레깅스 or A라인 스커트
레더 레깅스는 편하면서 간지남. 스커트는 무릎 위 기장이 적당. 너무 짧으면 춤출때 신경쓰여서 못 놀음.

■ 신발: 5cm 이하 부티 or 플랫슈즈
편하면서 깔끔해 보이는 신발이 정답. 운동화도 솔직히 상관없는데 기분이 안 남.

■ 가방: 작은 크로스바디
핸드백은 놓을데가 없다. 폰+카드+립 들어가는 작은 가방이 최고.

여자들이 제일 많이 하는 실수: "오늘 예쁘게 꾸며야지" 하고 불편한 옷 입고 가서 못 놀고 옴. 편해야 즐긴다. 이게 진리.', 68, 978, false, NOW() - INTERVAL '1 hour');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '향수 추천 — 클럽에서 확실히 반응 오는 3가지', '향수 덕후로서 5년간 클럽에서 테스트한 결과물이다.

"무슨 향수 뿌렸어요?"를 가장 많이 들은 순서:

★ 1위: 블루 드 샤넬 EDP (남자용)
왜 1위인가: 깔끔하면서 남성적. 너무 진하지 않고 너무 가볍지 않음. "좋은 냄새 나요"를 가장 많이 들은 향수. 단점은 뿌리는 사람이 많다는거. 옆에 같은 향수 뿌린 사람 만날수 있음ㅋㅋ 가격: 13만원대.

★ 2위: 딥티크 탐다오 (남녀 공용)
유니섹스인데 남자가 뿌리면 "우와 이거 뭐에요"를 가장 많이 들음. 나무향+약간 달콤. 근데 비쌈. 19만원. 소량만 뿌려도 오래감.

★ 3위: 자라 9.0 (남자용)
3만원대. 가성비의 끝판왕. "이거 비싼 향수 아니에요?" 이 말을 제일 많이 들었다. 약간 달콤+스파이시. 부담없이 쓸 수 있음.

■ 여자용으로는:
미스 디올 블루밍 부케 — 화사하면서 달달. 클럽에서 확실히 눈에(코에?) 띄는 향.

■ 뿌리는 팁
손목이 아니라 목 뒤랑 귀 뒤에 뿌려라. 사람이 가까이 왔을때 은은하게 나야 한다. 손목에 뿌리고 비비면 향이 깨진다.

향수 하나 잘 고르면 옷보다 효과가 크다. 진심.', 81, 1167, false, NOW() - INTERVAL '5 hours');

INSERT INTO posts (id, user_id, category, title, content, likes, views, is_pinned, created_at) VALUES
(gen_random_uuid(), NULL, 'fashion', '클럽에서 운동화 신어도 되나? — 현실 답변', '이 질문 1주일에 3번은 올라오는것 같아서 경험상 정리한다.

■ 무조건 되는 곳
- 홍대 클럽 대부분 (프리한 분위기)
- 일반 나이트 (엄격하지 않은 곳)

■ 안 되는 곳
- 강남 일부 클럽 (드레스코드 있는 곳)
- 라운지 바 (운동화가 분위기에 안 맞음)

■ 되지만 안 신는게 나은 곳
- 압구정 라운지 (입장은 되는데 시선이 느껴짐)

■ 운동화 중 되는것들
- 에어포스1 화이트: 거의 어디서든 통과
- 나이키 덩크: 깔끔하면 OK
- 컨버스 올블랙: 문제없음
- 뉴발란스 993: 색상 무관 거의 OK

■ 운동화 중 안 되는것들
- 등산화 느낌 아웃도어 신발
- 너무 때탄 운동화
- 형광색 러닝화

결론: "운동화 신어도 돼?"보다 "깔끔한 운동화인가?"가 더 중요하다. 더러운 가죽구두보다 깨끗한 에어포스가 낫다.', 52, 789, false, NOW() - INTERVAL '2 hours');

-- ============================================================
-- 댓글 — 진짜 사람 반응 (논쟁/반박/추가정보/질문)
-- ============================================================

-- 넘어져서 여자 만난 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 넘어졌는데 그게 인생을 바꿨다' LIMIT 1), NULL, '야 이거 실화면 영화 찍어야 됨. 근데 세번째 만남이면 아직 모르는거다. 한 5번은 더 만나봐야 진짜인지 알 수 있음.', NOW() - INTERVAL '40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 넘어졌는데 그게 인생을 바꿨다' LIMIT 1), NULL, '나도 비슷한 경험 있는데 결말이 다르다. 번호 교환하고 연락 한번 오더니 그 뒤로 씹힘ㅋㅋ 글쓴이는 복 받은거다.', NOW() - INTERVAL '35 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 넘어졌는데 그게 인생을 바꿨다' LIMIT 1), NULL, '"발목은 괜찮으세요?"가 킬링포인트네. 이 분 센스가 좋다.', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '어제 나이트에서 넘어졌는데 그게 인생을 바꿨다' LIMIT 1), NULL, '근데 진심으로 궁금한게 넘어졌을때 다친건 없어? 유리 깨졌다며. 손 안 베임?', NOW() - INTERVAL '20 minutes');

-- 32살 처음 클럽 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '32살에 처음 클럽 가봤다 솔직 후기' LIMIT 1), NULL, '38살에 처음 가봤는데 나보다 일찍 간거 축하한다. 진짜 후회하지 않을거임.', NOW() - INTERVAL '2 hours 40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '32살에 처음 클럽 가봤다 솔직 후기' LIMIT 1), NULL, '구두 신고 간거 공감ㅋㅋ 나도 처음에 구두 신고 갔다가 다음날 발바닥에 물집 3개 잡힘. 깔끔한 스니커즈가 진리', NOW() - INTERVAL '2 hours 20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '32살에 처음 클럽 가봤다 솔직 후기' LIMIT 1), NULL, '근데 어디 갔는지 궁금함. 강남쪽이면 30대 많은건 맞는데 홍대 가면 체감이 좀 다를수 있어', NOW() - INTERVAL '2 hours');

-- 택시비 아끼다 150만원 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 150만원 쓴 밤' LIMIT 1), NULL, '제주도 여행까지 예약한건 좀 과한거 아니냐ㅋㅋ 처음 만난 사람인데. 근데 그게 진짜 인연이면 대박이긴 함', NOW() - INTERVAL '55 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 150만원 쓴 밤' LIMIT 1), NULL, '편의점 라면이 인생을 바꿨네. 나도 새벽에 편의점 자주 가는데 말 걸어볼까', NOW() - INTERVAL '45 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 150만원 쓴 밤' LIMIT 1), NULL, '솔직히 부럽다. 30대 되면 새 친구 만들기 진짜 힘든데. 나도 술자리에서 친해진 사람 있긴 한데 오래 안 가더라. 이 사람들은 진짜 계속 만남?', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '택시비 아끼려다가 150만원 쓴 밤' LIMIT 1), NULL, '가성비로 따지면 택시비 28000원이 정답이었다. 근데 인생은 가성비로 사는게 아니지. 잘한거다.', NOW() - INTERVAL '15 minutes');

-- 엄마가 나이트 같이 가자고 한다
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마가 나이트 같이 가자고 한다' LIMIT 1), NULL, '우리 엄마(55살)는 이미 친구분들이랑 나이트 다니심. 처음엔 충격이었는데 지금은 "엄마 오늘도 놀러가?" 이러고 있음. 엄마가 행복하면 된거 아닌가.', NOW() - INTERVAL '30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마가 나이트 같이 가자고 한다' LIMIT 1), NULL, '후기 꼭 올려줘. 엄마랑 나이트 간 후기 보고싶다ㅋㅋㅋ', NOW() - INTERVAL '25 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마가 나이트 같이 가자고 한다' LIMIT 1), NULL, '이혼하시고 자기 인생 찾으시는거 응원한다. 근데 같이 가면 좀 어색하지 않을까... 엄마 친구분들이랑 가시게 하고 너는 다른데 가는게 서로 편할수도', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '엄마가 나이트 같이 가자고 한다' LIMIT 1), NULL, '나 30살인데 아빠가 가끔 나이트 가자고 함. 아빠랑 가면 아빠 인맥이 엄청나서 부스 공짜로 앉음ㅋㅋ 세대 차이지만 노는건 노는거다', NOW() - INTERVAL '10 minutes');

-- 부장님 클럽에서 만남
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 부장님 클럽에서 만났는데' LIMIT 1), NULL, '퇴사 후에 쓴다는게 핵현실ㅋㅋ 근데 나도 비슷한 경험 있는데 우리 팀장은 도망갔음. 월요일에 서로 모른척 하는게 국룰이긴 함', NOW() - INTERVAL '5 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 부장님 클럽에서 만났는데' LIMIT 1), NULL, '대학때 댄스동아리였다는 반전ㅋㅋ 사람은 겉으로 모른다 진짜', NOW() - INTERVAL '5 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '회사 부장님 클럽에서 만났는데' LIMIT 1), NULL, '교훈이 진짜다. 도망가지 말고 인사 잘 하면 인생이 바뀐다. 나도 거래처 부장님 라운지에서 만났는데 그 뒤로 업무가 존나 수월해짐', NOW() - INTERVAL '4 hours 30 minutes');

-- 새벽 국밥집 인생상담
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 국밥집에서 인생 상담 받은 이야기' LIMIT 1), NULL, '와 소름돋았다. 그 아저씨 회사에 입사한건 진짜 영화같네. 근데 궁금한게 지금도 그 회사 다니고 있어?', NOW() - INTERVAL '10 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 국밥집에서 인생 상담 받은 이야기' LIMIT 1), NULL, '읽다가 울뻔했다 진심으로. 취준 2년차인데 "안 되는게 아니라 아직 안 된거야"가 위로가 된다. 고맙다.', NOW() - INTERVAL '8 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 국밥집에서 인생 상담 받은 이야기' LIMIT 1), NULL, '나도 새벽 국밥집에서 모르는 아저씨랑 얘기한적 있는데 그때 인생 얘기 해주신게 지금도 기억남. 새벽 국밥집에 뭔가 있는것 같다 진짜로', NOW() - INTERVAL '5 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '새벽 5시 국밥집에서 인생 상담 받은 이야기' LIMIT 1), NULL, '면접때 "저 새벽에 국밥집에서 만났던 사람입니다" 이거 레전드ㅋㅋㅋ 대표님 반응이 궁금하다', NOW() - INTERVAL '3 minutes');

-- 아내한테 들켰다
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '아내한테 들켰다' LIMIT 1), NULL, '결혼 10년차인데 공감 200%. 솔직하게 말하는게 정답이다. 나도 비슷한 상황 있었는데 숨기다가 더 커졌음. 글쓴이는 현명하게 잘 넘김', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '아내한테 들켰다' LIMIT 1), NULL, '아내분 반응이 멋있다. "나도 데려가"라니. 이해심 있는 분이네. 잘 만났다', NOW() - INTERVAL '15 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '아내한테 들켰다' LIMIT 1), NULL, '근데 진짜 핵심 포인트는 마지막 줄이다. "지출이 2배가 된다" ㅋㅋㅋ 현실 문제', NOW() - INTERVAL '10 minutes');

-- 숙취 과학적으로 막는법
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취를 과학적으로 막는 법 — 약대생이 알려줌' LIMIT 1), NULL, '컨디션 여명808 효과없다는거 진짜야? 나 맨날 먹었는데... 플라시보였단말이야?', NOW() - INTERVAL '15 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취를 과학적으로 막는 법 — 약대생이 알려줌' LIMIT 1), NULL, '우유 + 물 1:1은 진짜 효과있음. 3년째 이거 하는데 숙취 체감 50% 줄어듦. 나머진 몰라도 이 두개만 지키면 됨', NOW() - INTERVAL '12 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취를 과학적으로 막는 법 — 약대생이 알려줌' LIMIT 1), NULL, '해장술이 최악이라는거 공감. 근데 분위기상 안 할수가 없는 경우가 있잖아ㅠ', NOW() - INTERVAL '8 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '숙취를 과학적으로 막는 법 — 약대생이 알려줌' LIMIT 1), NULL, '사우나 안 하는게 좋다는건 처음 알았다. 숙취 풀려고 항상 갔는데 오히려 악화였다니 ㄷㄷ', NOW() - INTERVAL '3 minutes');

-- 양주 초보 가이드
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 완전 초보를 위한 현실적인 가이드' LIMIT 1), NULL, '글렌피딕 12년 추가 추천. 싱글몰트 입문으로 이만한게 없음. 근데 나이트에서는 잘 안 팔아서 라운지 가야 마실 수 있을수도', NOW() - INTERVAL '2 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 완전 초보를 위한 현실적인 가이드' LIMIT 1), NULL, '"이름 모르는 양주 시키지 마라" 이거 진짜 명언이다ㅋㅋ 호기심에 시켰다가 입에 안 맞아서 한잔 마시고 남김', NOW() - INTERVAL '2 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '양주 완전 초보를 위한 현실적인 가이드' LIMIT 1), NULL, '여자친구한테 헤네시 사줬다가 "나 이거 싫어하는데" 들은 사람 여기있습니다. 사람마다 다르니까 미리 물어보세요ㅋㅋ', NOW() - INTERVAL '1 hour 30 minutes');

-- 호빠 솔직후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음 간 여자의 솔직한 후기 (긴 글 주의)' LIMIT 1), NULL, '프로듀스101이라는 비유가 찰떡이네ㅋㅋ 초이스할때 진짜 그 느낌 맞음. 나도 첫 호빠에서 친구가 "국민 프로듀서가 된 기분이야" 했었음', NOW() - INTERVAL '35 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음 간 여자의 솔직한 후기 (긴 글 주의)' LIMIT 1), NULL, '맨날 이자카야만 가지 말고 마지막 한줄이 핵심. 여자들끼리 갈수있는데가 한정적인데 호빠는 진짜 좋은 대안임', NOW() - INTERVAL '25 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '호빠 처음 간 여자의 솔직한 후기 (긴 글 주의)' LIMIT 1), NULL, '근데 남자 입장에서 궁금한거 하나만. 여자들이 호빠 가는거 남자친구가 알면 어떤 반응? 질투하는 남자 많지 않나?', NOW() - INTERVAL '15 minutes');

-- 나이트에서 결혼까지
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 결혼까지 한 사람 있나요?' LIMIT 1), NULL, '축하한다 진심으로. 나도 클럽에서 만나서 2년째 사귀고 있는데 결혼 얘기 나올때마다 "어디서 만났어?"가 제일 부담됨. 근데 사랑에 장소가 뭐가 중요하냐', NOW() - INTERVAL '2 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 결혼까지 한 사람 있나요?' LIMIT 1), NULL, '축사에서 "나이트에서 만났습니다" 하지마ㅋㅋ 어른들 계시잖아. "지인 소개로 만났다"가 국룰이다', NOW() - INTERVAL '2 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트에서 만나서 결혼까지 한 사람 있나요?' LIMIT 1), NULL, '글쓴이 부모님 반응이 궁금하다. 우리 부모님은 아직도 소개팅에서 만났다고 알고 계심. 15년째 거짓말...', NOW() - INTERVAL '1 hour 30 minutes');

-- 30대 클럽 나이
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 넘으면 클럽 가면 안 되나?' LIMIT 1), NULL, '37살인데 아직도 다님. 주변 시선? 아무도 신경 안 써. 진짜로. 자의식 과잉이다. 즐겁게 놀면 되는거지 나이가 뭐가 중요하냐', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 넘으면 클럽 가면 안 되나?' LIMIT 1), NULL, '나는 35살에 클럽에서 라운지로 갈아탔는데 만족함. 시끄러운게 좀 힘들어지더라. 근데 이건 나이 문제가 아니라 취향 변화라고 본다', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '30대 넘으면 클럽 가면 안 되나?' LIMIT 1), NULL, '외국에서 5년 살다왔는데 베를린 클럽에 50대 아저씨도 옴. 한국만 이상하게 나이에 민감함. 문화 차이인듯', NOW() - INTERVAL '3 hours 30 minutes');

-- 일산명월관 후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산명월관 다녀왔는데 접대의 정석을 봤다' LIMIT 1), NULL, '접대비 100만원에 계약 2억 ROI 200배는 웃기면서 현실적이다ㅋㅋ 비즈니스는 이렇게 하는건가', NOW() - INTERVAL '1 hour 40 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산명월관 다녀왔는데 접대의 정석을 봤다' LIMIT 1), NULL, '전통주 라인업이 좋다는거 동의. 다른 요정은 양주 위주인데 여기는 전통주까지 신경쓴다는게 차별화 포인트', NOW() - INTERVAL '1 hour 20 minutes');

-- 수원 벙개 후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 3번째 모임 후기 — 이제 찐친 됐다' LIMIT 1), NULL, '다음 모임 저도 끼워주세요! 수원 영통 사는 29살 남자입니다. 매주 혼자 놀다가 이런 모임 찾고있었어요', NOW() - INTERVAL '25 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 3번째 모임 후기 — 이제 찐친 됐다' LIMIT 1), NULL, '3주만에 10명까지 늘어난거 대박이네. 놀쿨 벙개가 이렇게 되는구나. 서울쪽은 없나?', NOW() - INTERVAL '20 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '수원 벙개 3번째 모임 후기 — 이제 찐친 됐다' LIMIT 1), NULL, '혹시 여자도 참여 가능한가요? 남자 모임이면 좀 부담스러워서...', NOW() - INTERVAL '10 minutes');

-- 남자 코디 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '남자 클럽/나이트 코디 — 돈 안 들이고 간지나는 법' LIMIT 1), NULL, '총 13만원이면 개이득이네. 나 매번 뭐 입을지 고민하느라 시간 다 보냈는데 이거 보고 유니클로 바로 감', NOW() - INTERVAL '2 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '남자 클럽/나이트 코디 — 돈 안 들이고 간지나는 법' LIMIT 1), NULL, '시계는 카시오 빈티지 3만원대 추천. 오히려 비싼것보다 힙함', NOW() - INTERVAL '2 hours');

-- 향수 추천 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천 — 클럽에서 확실히 반응 오는 3가지' LIMIT 1), NULL, '블루드샤넬 뿌리는 사람 많아서 겹치는거 싫으면 딥티크 필로시코스도 좋다. 좀 비싸지만 겹칠 확률 0%', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천 — 클럽에서 확실히 반응 오는 3가지' LIMIT 1), NULL, '자라 9.0이 3만원대라는거 진짜야? 그 가격에 그 퀄리티면 미쳤다. 바로 사러감', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '향수 추천 — 클럽에서 확실히 반응 오는 3가지' LIMIT 1), NULL, '손목에 뿌리고 비비면 향 깨진다는거 몰랐다 ㄷㄷ 평생 그렇게 해왔는데', NOW() - INTERVAL '3 hours 30 minutes');

-- 웨이터 팁 글
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '웨이터한테 팁 주는 타이밍과 방법 — 나이트 5년차의 노하우' LIMIT 1), NULL, '전직 웨이터입니다. 첫 세팅때 주는 손님은 진짜 VIP로 모심. 글쓴이 말이 100% 맞음. 근데 팁 안 줘도 기본 서비스는 똑같이 합니다. 부담갖지 마세요', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '웨이터한테 팁 주는 타이밍과 방법 — 나이트 5년차의 노하우' LIMIT 1), NULL, '악수하면서 주는거 처음엔 어색했는데 한두번 하니까 자연스러워짐. 이게 국룰 맞음', NOW() - INTERVAL '4 hours');

-- 전여친 클럽에서 만남
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '전 여친이랑 같은 클럽에서 만났는데 전개가 예상 밖' LIMIT 1), NULL, '이런 마무리도 있구나. 다시 사귀지 않고 미안한 것만 말하고 헤어졌다는게 오히려 성숙하다. 나는 전여친 만나면 바로 도망가는데ㅋㅋ', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '전 여친이랑 같은 클럽에서 만났는데 전개가 예상 밖' LIMIT 1), NULL, '마음이 편해졌다는게 핵심이네. 사람 관계가 꼭 흑백으로 나뉘는게 아니라는거. 좋은 글이다', NOW() - INTERVAL '4 hours');

-- 나이트 실수 6가지
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 처음 가는 사람이 100% 하는 실수 6가지' LIMIT 1), NULL, '실수4 구두 공감... 처음 갔을때 새 구두 신고 갔다가 발바닥에 물집 3개 잡혔었다. 이제는 무조건 로퍼', NOW() - INTERVAL '50 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '나이트 처음 가는 사람이 100% 하는 실수 6가지' LIMIT 1), NULL, '실수1번 진짜 공감. 9시에 간 적 있는데 1시간 동안 혼자 앉아있었음. 분위기는 11시부터가 맞다', NOW() - INTERVAL '40 minutes');

-- 성남샴푸 아빠세대 이해
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '성남샴푸나이트 갔다가 아빠 세대를 이해했다' LIMIT 1), NULL, '아빠한테 전화한거 좋다. 세대 차이지만 노는건 똑같다는 마지막 말이 진짜다. 우리 아빠도 나이트 얘기하면 눈이 반짝이심ㅋㅋ', NOW() - INTERVAL '45 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '성남샴푸나이트 갔다가 아빠 세대를 이해했다' LIMIT 1), NULL, '트로트 라이브 진짜 중독됨. 처음엔 "에이" 하다가 한번 경험하면 빠져나올수 없다', NOW() - INTERVAL '30 minutes');

-- 3만원 수학적 계산
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '3만원짜리 입장료의 가치를 수학적으로 계산해봤다' LIMIT 1), NULL, '"우리는 매번 36,500원을 벌고 있는거다" 여기서 웃음 터짐ㅋㅋㅋ 이 논리로 와이프 설득 가능한가?', NOW() - INTERVAL '10 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '3만원짜리 입장료의 가치를 수학적으로 계산해봤다' LIMIT 1), NULL, '스카이다이빙 시간당 250만원 넣은거 ㅋㅋㅋ 비교대상이 아니잖아', NOW() - INTERVAL '8 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '3만원짜리 입장료의 가치를 수학적으로 계산해봤다' LIMIT 1), NULL, '근데 여기에 양주값은 빠져있잖아. 양주 넣으면 가성비 폭락하는데?ㅋㅋ', NOW() - INTERVAL '5 minutes');

-- 해운대고구려 후기
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 출장 갔다가 단골 됐다' LIMIT 1), NULL, '부산 텐션은 서울이랑 진짜 다르다 인정. "오늘 다 불태우자"가 맞는 표현ㅋㅋ 부산 사람들 놀 줄 안다', NOW() - INTERVAL '3 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '해운대고구려 출장 갔다가 단골 됐다' LIMIT 1), NULL, '출장을 핑계로 매달 부산 가는거 나만 그런줄 알았는데ㅋㅋ 동지를 만났다', NOW() - INTERVAL '3 hours');

-- 일산룸 3개월차
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 3개월 다니면서 느낀 점을 솔직하게' LIMIT 1), NULL, '헬스장 3개월 60만원 끊고 안 간거보다 낫다는 비교 ㅋㅋㅋ 팩트 폭력인데?', NOW() - INTERVAL '4 hours 30 minutes');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 3개월 다니면서 느낀 점을 솔직하게' LIMIT 1), NULL, '실장님이 취향 파악해주는거 좋다. 단골의 장점이 이거지. 나도 단골인 곳 있는데 들어가면 알아서 세팅해줌', NOW() - INTERVAL '4 hours');
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM posts WHERE title = '일산룸 3개월 다니면서 느낀 점을 솔직하게' LIMIT 1), NULL, '글렌피딕 12년 마셔봤으면 다음에는 발베니 12년 더블우드 시도해봐. 비슷한데 좀 더 깊은 맛', NOW() - INTERVAL '3 hours 30 minutes');
