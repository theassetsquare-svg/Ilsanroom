-- ═══════════════════════════════════════════════════════════════
-- 놀쿨 통합 마이그레이션 (1회 실행) — 2026-05-03
-- 1) 온도 스키마 → 2) 칭호 → 3) 시즌미션 → 4) RPC 함수 → 5) 시드풀
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 1/9 — 온도 스키마
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 4D 등급 시스템 1/4: 밤의 온도 스키마
-- user_profiles 확장 + 인덱스
-- ═══════════════════════════════════════════════════════

-- 1. user_profiles에 온도 시스템 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1) DEFAULT 36.5;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_title_id INT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS best_post_count INT DEFAULT 0;

-- 2. 온도 변동 이력 (디버깅 + 통계용)
CREATE TABLE IF NOT EXISTS temperature_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  delta DECIMAL(4,1) NOT NULL,
  reason TEXT NOT NULL,
  result_temperature DECIMAL(4,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temp_history_user ON temperature_history(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_history_created ON temperature_history(created_at DESC);

-- 3. 온도 인덱스 (랭킹 빠른 조회용)
CREATE INDEX IF NOT EXISTS idx_user_profiles_temperature ON user_profiles(temperature DESC);

-- 4. 출석 기록
CREATE TABLE IF NOT EXISTS user_attendance (
  user_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON user_attendance(attendance_date DESC);

-- 5. 일일 활동 통계 (랭킹용)
CREATE TABLE IF NOT EXISTS daily_activity_stats (
  user_id UUID NOT NULL,
  stat_date DATE NOT NULL,
  posts_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  likes_received INT DEFAULT 0,
  activity_score INT DEFAULT 0,
  PRIMARY KEY (user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date_score ON daily_activity_stats(stat_date DESC, activity_score DESC);

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 2/9 — 칭호 시스템 + 시드 15개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 4D 등급 시스템 2/4: 칭호 시스템
-- titles 마스터 + user_titles 보유 + 시드 15개
-- ═══════════════════════════════════════════════════════

-- 1. 칭호 마스터 테이블
CREATE TABLE IF NOT EXISTS titles (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity INT NOT NULL DEFAULT 1,           -- 1~5 (별 개수)
  unlock_type TEXT NOT NULL,               -- 'post_count', 'comment_count', 'best_count', 'streak', 'category_master', 'temperature', 'season_limited', 'early_member'
  unlock_value INT,                        -- 조건 값 (예: 50)
  unlock_meta JSONB,                       -- 추가 조건 (예: {category: 'reviews'})
  is_limited BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 사용자 보유 칭호
CREATE TABLE IF NOT EXISTS user_titles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title_id INT NOT NULL REFERENCES titles(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, title_id)
);

CREATE INDEX IF NOT EXISTS idx_user_titles_user ON user_titles(user_id);

-- 3. 칭호 시드 15개 INSERT
INSERT INTO titles (code, name, emoji, description, rarity, unlock_type, unlock_value, is_limited) VALUES
('first_step',     '첫 발걸음',     '🌙', '놀쿨에 첫 글을 작성한 회원',           1, 'post_count',       1,    FALSE),
('chatter',        '수다쟁이',      '💬', '댓글 50개 달성',                       2, 'comment_count',    50,   FALSE),
('reporter',       '현장특파원',    '📸', '사진이 포함된 후기 10개 작성',          2, 'best_count',       10,   FALSE),
('vote_voice',     '민심의 목소리', '🗳️', '랭킹 투표에 6회 참여 (전 카테고리)',    2, 'category_master',  6,    FALSE),
('streak_30',      '30일 연속출석', '🔥', '30일 연속으로 사이트 방문',             3, 'streak',           30,   FALSE),
('best_3',         '베스트 작가',   '🏆', '베스트 글 3회 선정',                   3, 'best_count',       3,    FALSE),
('gangnam_local',  '강남 단골',     '🍺', '강남 후기 20개 작성',                  3, 'category_master',  20,   FALSE),
('all_category',   '올카테 정복자', '🎯', '6개 카테고리 전부 글 작성',            4, 'category_master',  6,    FALSE),
('seoul_master',   '서울 마스터',   '🌃', '서울 6개구 후기 작성',                 4, 'category_master',  6,    FALSE),
('best_5',         '레전드 작가',   '⭐', '베스트 글 5회 선정',                   4, 'best_count',       5,    FALSE),
('hot_50',         '핫플러',        '🔥', '온도 50도 달성',                       3, 'temperature',      50,   FALSE),
('hot_75',         '밤의 제왕',     '⭐', '온도 75도 달성',                       4, 'temperature',      75,   FALSE),
('legend_90',      '전설의 밤',     '👑', '온도 90도 달성 — 사이트 최고 영예',    5, 'temperature',      90,   FALSE),
('founder',        '놀쿨 1기',      '💎', '초기 1만명 회원 (영구 한정)',          5, 'early_member',     10000,TRUE),
('may_2026',       '5월의 놀쿨러',  '🏅', '2026년 5월 시즌 미션 클리어',          3, 'season_limited',   1,    TRUE)
ON CONFLICT (code) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 3/9 — 시즌 미션 (5월/6월)
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 4D 등급 시스템 3/4: 시즌 미션 (FOMO 장치)
-- 매월 1일 자동 리셋, 그 달에만 얻을 수 있는 한정 칭호
-- ═══════════════════════════════════════════════════════

-- 1. 시즌 미션 마스터
CREATE TABLE IF NOT EXISTS season_missions (
  id SERIAL PRIMARY KEY,
  season_year INT NOT NULL,
  season_month INT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL,        -- 'post', 'comment', 'like_received', 'vote', 'streak'
  goal_count INT NOT NULL,
  reward_temperature DECIMAL(4,1) NOT NULL,
  is_clear_required BOOLEAN DEFAULT TRUE,  -- ALL CLEAR 조건 포함 여부
  reward_title_code TEXT,                  -- 미션 클리어 시 받는 칭호
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_year, season_month, code)
);

-- 2. 사용자 진행도
CREATE TABLE IF NOT EXISTS user_season_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id INT NOT NULL REFERENCES season_missions(id),
  current_count INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_season_user ON user_season_progress(user_id);

-- 3. 2026년 5월 시즌 미션 5개
INSERT INTO season_missions (season_year, season_month, code, name, description, goal_type, goal_count, reward_temperature, is_clear_required, reward_title_code) VALUES
(2026, 5, 'may_post_3',     '글 3개 작성',     '5월에 어떤 카테고리든 글 3개 작성',  'post',          3,  1.0, TRUE, NULL),
(2026, 5, 'may_comment_10', '댓글 10개',       '5월 한달 동안 댓글 10개 달기',       'comment',       10, 0.5, TRUE, NULL),
(2026, 5, 'may_like_5',     '좋아요 5개 받기', '내 글이 좋아요 누적 5개 받기',       'like_received', 5,  0.3, TRUE, NULL),
(2026, 5, 'may_vote_6',     '투표 참여 6회',   '랭킹 투표에 6번 참여',               'vote',          6,  0.2, TRUE, NULL),
(2026, 5, 'may_streak_7',   '연속 출석 7일',   '7일 연속으로 사이트 방문',            'streak',        7,  0.5, TRUE, 'may_2026')
ON CONFLICT (season_year, season_month, code) DO NOTHING;

-- 4. 다음 달(6월) 미리 등록 — cron 없이도 자연스럽게 넘어가게
INSERT INTO season_missions (season_year, season_month, code, name, description, goal_type, goal_count, reward_temperature, is_clear_required, reward_title_code) VALUES
(2026, 6, 'jun_post_5',     '글 5개 작성',     '6월에 글 5개 작성',                  'post',          5,  1.5, TRUE, NULL),
(2026, 6, 'jun_comment_15', '댓글 15개',       '6월 댓글 15개 달기',                  'comment',       15, 0.7, TRUE, NULL),
(2026, 6, 'jun_like_10',    '좋아요 10개',     '내 글 좋아요 누적 10개',              'like_received', 10, 0.5, TRUE, NULL),
(2026, 6, 'jun_vote_6',     '투표 참여 6회',   '랭킹 투표 6번',                       'vote',          6,  0.2, TRUE, NULL),
(2026, 6, 'jun_streak_14',  '연속 출석 14일',  '14일 연속 방문',                      'streak',        14, 1.0, TRUE, NULL)
ON CONFLICT (season_year, season_month, code) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 4/9 — RPC 함수 6개 (온도 자동 갱신)
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 4D 등급 시스템 4/4: RPC 함수 (자동 갱신 로직)
-- 글/댓글/좋아요 발생 시 호출되는 함수들
-- ═══════════════════════════════════════════════════════

-- 1. 온도 변화 보상표 (참고용 상수)
-- 출석 +0.1 / 글 +0.3 / 댓글 +0.1 / 좋아요받음 +0.05 / 베스트 +1.0
-- 7일연속 +0.5 / 30일연속 +2.0 / 신고확인 -1.0 / 7일미접속 -0.3

-- 2. 온도 추가/차감 메인 함수
CREATE OR REPLACE FUNCTION add_temperature(
  p_user_id UUID,
  p_delta DECIMAL(4,1),
  p_reason TEXT
) RETURNS DECIMAL(4,1)
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_temp DECIMAL(4,1);
BEGIN
  -- 프로필 없으면 생성
  INSERT INTO user_profiles (user_id, temperature, points, level)
  VALUES (p_user_id, 36.5, 0, 'newbie')
  ON CONFLICT (user_id) DO NOTHING;

  -- 온도 갱신 (36.5 ~ 99.9 범위 클램프)
  UPDATE user_profiles
  SET temperature = GREATEST(36.5, LEAST(99.9, temperature + p_delta))
  WHERE user_id = p_user_id
  RETURNING temperature INTO v_new_temp;

  -- 이력 기록
  INSERT INTO temperature_history (user_id, delta, reason, result_temperature)
  VALUES (p_user_id, p_delta, p_reason, v_new_temp);

  RETURN v_new_temp;
END;
$$;

-- 3. 출석 체크 (스트릭 자동 계산)
CREATE OR REPLACE FUNCTION mark_attendance(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_already_today BOOLEAN;
  v_was_yesterday BOOLEAN;
  v_streak INT;
  v_bonus DECIMAL(4,1) := 0;
  v_new_temp DECIMAL(4,1);
BEGIN
  -- 오늘 이미 체크됐으면 스킵
  SELECT EXISTS(SELECT 1 FROM user_attendance WHERE user_id = p_user_id AND attendance_date = v_today)
  INTO v_already_today;

  IF v_already_today THEN
    SELECT temperature, streak_days INTO v_new_temp, v_streak
    FROM user_profiles WHERE user_id = p_user_id;
    RETURN json_build_object('already_today', true, 'streak', v_streak, 'temperature', v_new_temp);
  END IF;

  -- 어제 출석했는지 확인 (스트릭 유지 여부)
  SELECT EXISTS(SELECT 1 FROM user_attendance WHERE user_id = p_user_id AND attendance_date = v_yesterday)
  INTO v_was_yesterday;

  -- 오늘 출석 기록
  INSERT INTO user_attendance (user_id, attendance_date) VALUES (p_user_id, v_today)
  ON CONFLICT DO NOTHING;

  -- 스트릭 갱신
  IF v_was_yesterday THEN
    UPDATE user_profiles
    SET streak_days = streak_days + 1, last_active_date = v_today
    WHERE user_id = p_user_id
    RETURNING streak_days INTO v_streak;
  ELSE
    UPDATE user_profiles
    SET streak_days = 1, last_active_date = v_today
    WHERE user_id = p_user_id
    RETURNING streak_days INTO v_streak;
  END IF;

  -- 출석 보너스 +0.1
  v_bonus := 0.1;

  -- 7일 연속 보너스 +0.5
  IF v_streak = 7 THEN v_bonus := v_bonus + 0.5; END IF;

  -- 30일 연속 보너스 +2.0
  IF v_streak = 30 THEN v_bonus := v_bonus + 2.0; END IF;

  v_new_temp := add_temperature(p_user_id, v_bonus, '출석체크 streak=' || v_streak);

  RETURN json_build_object(
    'streak', v_streak,
    'bonus', v_bonus,
    'temperature', v_new_temp
  );
END;
$$;

-- 4. 활동 보상 통합 함수 (글/댓글/좋아요 등)
CREATE OR REPLACE FUNCTION reward_activity(
  p_user_id UUID,
  p_action TEXT  -- 'post', 'comment', 'like_received', 'best_post', 'photo_attach'
) RETURNS DECIMAL(4,1)
LANGUAGE plpgsql
AS $$
DECLARE
  v_delta DECIMAL(4,1);
  v_temp DECIMAL(4,1);
BEGIN
  v_delta := CASE p_action
    WHEN 'post'           THEN 0.3
    WHEN 'comment'        THEN 0.1
    WHEN 'like_received'  THEN 0.05
    WHEN 'best_post'      THEN 1.0
    WHEN 'photo_attach'   THEN 0.1
    WHEN 'review'         THEN 0.5
    WHEN 'vote'           THEN 0.2
    ELSE 0
  END;

  IF v_delta = 0 THEN
    RETURN (SELECT temperature FROM user_profiles WHERE user_id = p_user_id);
  END IF;

  v_temp := add_temperature(p_user_id, v_delta, p_action);

  -- 시즌 미션 진행도 갱신
  PERFORM update_season_progress(p_user_id, p_action);

  -- 칭호 자동 해제 체크
  PERFORM check_and_unlock_titles(p_user_id);

  RETURN v_temp;
END;
$$;

-- 5. 시즌 미션 진행도 갱신
CREATE OR REPLACE FUNCTION update_season_progress(
  p_user_id UUID,
  p_action TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_y INT := EXTRACT(YEAR FROM CURRENT_DATE);
  v_m INT := EXTRACT(MONTH FROM CURRENT_DATE);
  v_goal_type TEXT;
  v_mission RECORD;
BEGIN
  -- action을 goal_type으로 매핑
  v_goal_type := CASE p_action
    WHEN 'post'          THEN 'post'
    WHEN 'comment'       THEN 'comment'
    WHEN 'like_received' THEN 'like_received'
    WHEN 'vote'          THEN 'vote'
    ELSE NULL
  END;

  IF v_goal_type IS NULL THEN RETURN; END IF;

  -- 이번 달 해당 미션 진행도 +1
  FOR v_mission IN
    SELECT id, goal_count, reward_temperature, reward_title_code
    FROM season_missions
    WHERE season_year = v_y AND season_month = v_m AND goal_type = v_goal_type
  LOOP
    INSERT INTO user_season_progress (user_id, mission_id, current_count)
    VALUES (p_user_id, v_mission.id, 1)
    ON CONFLICT (user_id, mission_id) DO UPDATE
    SET current_count = user_season_progress.current_count + 1;

    -- 클리어 시 보상
    UPDATE user_season_progress
    SET is_completed = TRUE, completed_at = NOW()
    WHERE user_id = p_user_id
      AND mission_id = v_mission.id
      AND current_count >= v_mission.goal_count
      AND is_completed = FALSE;
  END LOOP;
END;
$$;

-- 6. 칭호 자동 해제 체크
CREATE OR REPLACE FUNCTION check_and_unlock_titles(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_temp DECIMAL(4,1);
  v_streak INT;
  v_post_count INT;
  v_comment_count INT;
  v_best_count INT;
  v_title RECORD;
BEGIN
  SELECT temperature, streak_days, best_post_count
  INTO v_temp, v_streak, v_best_count
  FROM user_profiles WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_post_count FROM posts WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_comment_count FROM comments WHERE user_id = p_user_id;

  -- 각 칭호 조건 체크
  FOR v_title IN
    SELECT id, code, unlock_type, unlock_value FROM titles WHERE is_active = TRUE
  LOOP
    DECLARE
      v_qualified BOOLEAN := FALSE;
    BEGIN
      v_qualified := CASE v_title.unlock_type
        WHEN 'post_count'    THEN v_post_count >= v_title.unlock_value
        WHEN 'comment_count' THEN v_comment_count >= v_title.unlock_value
        WHEN 'best_count'    THEN v_best_count >= v_title.unlock_value
        WHEN 'streak'        THEN v_streak >= v_title.unlock_value
        WHEN 'temperature'   THEN v_temp >= v_title.unlock_value
        ELSE FALSE
      END;

      IF v_qualified THEN
        INSERT INTO user_titles (user_id, title_id)
        VALUES (p_user_id, v_title.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END LOOP;
END;
$$;

-- 7. 7일 미접속 페널티 함수 (cron으로 매일 호출)
CREATE OR REPLACE FUNCTION decay_inactive_users()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH inactive AS (
    SELECT user_id FROM user_profiles
    WHERE last_active_date IS NOT NULL
      AND last_active_date < CURRENT_DATE - INTERVAL '7 days'
      AND temperature > 36.5
  )
  UPDATE user_profiles
  SET temperature = GREATEST(36.5, temperature - 0.3)
  WHERE user_id IN (SELECT user_id FROM inactive);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 5/9 — 시드 풀: 자유게시판 80개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 시드 글 풀 확장 1/6: 자유게시판 80개
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_post_pool (category, title, content) VALUES
('free', '오늘 따라 강남이 미친듯이 끌리네', '회사에서 받은 스트레스 풀러 가야겠음 같이 갈 사람 댓글로 모집중'),
('free', '나이트에서 만난 사람이랑 6개월째 사귀는중', '진짜 운명이 있는듯 부킹으로 만났는데 이렇게 오래 갈줄 몰랐음 진심'),
('free', '월요일 아침에 어제 일이 떠올라서 식은땀남', '뭐 한건지 기억이 안나는데 카드값은 50만원 나왔음 이게 뭐임'),
('free', '솔직히 클럽보다 라운지가 더 끌릴때 있지않음?', '시끄러운것보다 조용하게 칵테일 마시면서 얘기하는게 좋을때가 있음'),
('free', '나이트 가기 전 친구한테 위치공유 켜는 사람 손', '안전때문에 켜는데 아침에 보면 위치 이상한데 찍혀있을때 진짜 무서움 ㅋㅋㅋ'),
('free', '단골 되니까 진짜 다른 세상이다', '실장님이 좋은 자리 빼두고 계심 매주 가는게 답이긴 함 결국'),
('free', '오늘 양주 안 시키는 날 만들었음', '맥주만 마시고 가벼운 텐션으로 놀았는데 의외로 더 재밌었음 머리도 안 아프고'),
('free', '나이트 다녀와서 다음날 회사가는 사람 어떻게 버텨', '진짜 나는 토요일 아침이면 시체상태인데 평일에 가는 사람들 멘탈 어케됨'),
('free', '강남에서 5명 부킹 한번에 들어옴ㅋㅋ', '인생에서 처음봤음 5명이 한꺼번에 우리쪽으로 옴 친구들이 다들 멘붕 ㅋㅋ'),
('free', '술 약하면서 양주 시키는 친구 어떻게 말려야됨', '한잔만 마셔도 뻗는 애가 매번 양주 시키자고함 나는 케어하느라 못 노는데'),
('free', '오늘은 기필코 12시 전에 들어가기로 함', '약속한지 1시간만에 깨질것 같은 예감 ㅋㅋ 결국 새벽 4시 보장임'),
('free', '나이트 갔는데 옛날 직장 상사 만남', '눈마주치고 못본척 하고 헤어졌음 월요일에 어떻게 해야하지 진심 고민'),
('free', '주말마다 노는데 통장은 그대로임 어떻게', '월급의 60%가 술값인데 적자는 안남 신기함 ㅋㅋ 절약하는 부분이 있나봄'),
('free', '나이트에서 처음 본 사람한테 라이터 빌렸을 뿐인데', '계속 말 걸어와서 결국 같은 테이블 가서 놀았음 사람 인연 모르는거임'),
('free', '강남 vs 홍대 vs 이태원 어디가 진리?', '오늘 결정해야해서 도와줘 30대 직장인 기준'),
('free', '클럽에서 친구 잃어버리면 보통 어디서 만남', '핸드폰 안되는 곳도 있고 너무 시끄러워서 통화도 안되고 진짜 답없음'),
('free', '이번주 금요일 비온대 나이트 갈까 말까', '비오면 사람 적을거같은데 그래도 가야하나 고민중'),
('free', '룸 갔다가 나오면 항상 라면 먹고 싶어짐', '술 먹고 라면이 진리인거 인정함 새벽 라면이 제일 맛있음'),
('free', '나이트 처음 가본 친구가 너무 신나해서 귀여움', '40살 친구가 처음 가봤다고 어린애처럼 신나하는데 보는 내가 더 즐거움'),
('free', '강남에서 옷 갈아입을 곳 어디 있음??', '회사에서 바로 가야해서 정장인데 캐주얼로 갈아입을 곳 필요함'),
('free', '주말 새벽 5시에 해장국 먹는 그 맛', '나이트 끝나고 동료들이랑 해장국 먹는게 클라이맥스임 술보다 맛있을때 있음'),
('free', '나이트 다녀온 다음날 인스타 스토리 못보겠음', '뭘 올렸는지 무서워서 친구한테 먼저 확인해달라고 함 ㅋㅋ'),
('free', '클럽에서 음료 흘렸는데 새 거 갖다줌', '서비스 진짜 좋더라 다음에 또 갈때 그 직원분 찾아야겠다'),
('free', '40대 되니까 클럽보다 라운지가 더 좋음', '시끄러운거 못참겠고 조용히 칵테일 마시면서 얘기하는게 진리'),
('free', '오늘 같은 날엔 진짜 막 놀고싶다', '왠지 모르게 그런 날 있잖아 다 놓고 미친듯이 놀아야 풀릴것같은'),
('free', '술 안먹고 가도 충분히 재밌음', '운전때문에 음료수만 마셨는데 음악 듣고 분위기만 즐겨도 좋음'),
('free', '나이트에서 노래 안틀어줄때 진짜 빡침', '계속 비슷한곡만 틀어주면 흥이 식음 DJ도 사람 좀 봐가면서 틀어줘야지'),
('free', '강남 택시 5분만에 잡았는데 운빨이지', '평소엔 30분 걸리는데 오늘은 운이 좋았음 새벽 3시 강남역 기준'),
('free', '월급날 나이트가는게 인생낙', '그날 하루는 부자 코스프레 하면서 양주 척척 시킴'),
('free', '여친이랑 같이 클럽 가는 사람 있음', '괜찮은건지 분위기 어색하지않은지 가본 사람 알려줘'),
('free', '오늘 진짜 많이 마셨다 진짜 ㅋㅋㅋ', '내일 출근인데 양주 한병 까고 맥주 5잔 더 마심 미친듯'),
('free', '클럽에서 사진 잘찍는 친구 진짜 부러움', '나는 어둡게만 나오는데 그 친구는 인생샷 뽑음 카메라 셋팅이 다른가'),
('free', '강남 vs 부산 클럽 분위기 차이 알려줘', '이번 출장에 부산 가는데 강남이랑 비교해서 어떤지 궁금함'),
('free', '비싼 양주 시키면 정말 다른가??', '발렌타인 17이랑 30 차이가 가격은 두배인데 맛도 두배차이남?'),
('free', '여친이 클럽 가지말라고 해서 갈등중', '서로 신뢰가 없는것도 아닌데 왜 그러는지 모르겠음 어떻게 풀어야해'),
('free', '나이트에서 만난 친구가 진짜 친한 친구가 됨', '15년째 베프임 술친구로 만났는데 인생친구가 됨 인연이 있음'),
('free', '40대 부장님이랑 같이 룸 가는데 무슨 말 해야됨', '부장님이 처음 데려가신다는데 회사 얘기하면 안되고 뭘 얘기해야하지'),
('free', '인천에서 강남까지 택시비 너무 아까움', '6만원 나와서 진짜 손이 떨림 다음엔 새벽버스 알아봐야지'),
('free', '나이트 다녀와서 머리 안감고 잠', '아침에 일어나서 거울보면 진짜 거지같음 ㅋㅋ 한번씩 다 그러지'),
('free', '오늘 나이트가서 부킹 한번도 안들어옴', '대놓고 슬프지 친구들은 다들 부킹 들어오는데 나만 ㅠㅠ'),
('free', '주말마다 클럽 다니다가 갑자기 후회감 옴', '뭐하고 사는건지 싶다가 또 금요일 되면 가있음 인생 ㅋㅋ'),
('free', '강남보다 인천 라운지가 가성비 좋네', '강남에서 30만원 쓰는것보다 인천에서 15만원에 더 잘 놀았음'),
('free', '룸에서 도우미 안 시키고 친구들끼리만 노는것도 재밌음', '편하게 떠들면서 술 마시는 분위기가 더 좋을때 있음 케이스 바이 케이스'),
('free', '나이트에서 갑자기 슬로우곡 나오면 어색함', '빠른곡 신나게 추다가 슬로우 나오면 다들 어쩔줄 모르는 분위기 ㅋㅋ'),
('free', '오늘 부킹 매니저가 나한테만 이상한 사람 붙임', '왜 나한테는 항상 그런사람만 붙는건지 다음번엔 다른 자리 잡아야지'),
('free', '대전에서 서울까지 클럽 원정 가본 사람', '서울 클럽이 그렇게 좋다는데 KTX 타고 가기엔 너무 멀고 고민중'),
('free', '결혼하고 클럽 끊은 사람 있음', '결혼 한 친구들은 다 끊었던데 정말 끊을 수 있는건가 진심 궁금'),
('free', '클럽에서 한복 입고 온 외국인 봤음 ㅋㅋ', '진짜 한복임 외국인이 한국 처음 와서 전통의상 입고온듯 너무 귀여웠음'),
('free', '주말 호빠 다녀온 후기 적어도 됨?', '여자인데 친구랑 주말에 가본후기 쓰고 싶은데 환영함?'),
('free', '나이트 안가본지 1년 됐는데 다시 가도 될까', '갑자기 가고싶어졌는데 1년만에 가니까 분위기 따라갈 수 있을까'),
('free', '강남 라운지에서 외국인 친구 사귐', '영어 못해서 손짓발짓으로 대화했는데 너무 재밌었음 인스타 친구추가함'),
('free', '룸에서 아는 사람 만나면 못본척 vs 인사', '회사 부장님이랑 마주쳤는데 어쩌지 그자리에서 어색하게 인사했음'),
('free', '클럽 끝나고 새벽 5시 한강 산책 해봤음?', '취해서 한강 가서 일출 봤는데 인생 명장면이었음 추천함'),
('free', '주말마다 노는데 살이 안찌는 이유', '춤추느라 칼로리 다 빠짐 다이어트 효과 만점 ㅋㅋ'),
('free', '나이트에서 진짜 재밌는 사람 만났음', '한참 떠들다가 헤어졌는데 연락처 못받은게 후회됨 다시 만날수 있을까'),
('free', '광주에서 서울 클럽 원정온 친구', '서울이 그렇게 좋냐고 물어봤더니 분위기가 다르대 광주랑 비교가 안된대'),
('free', '40대인데 클럽가도 어색하지 않아?', '나이대가 너무 어린것 같아서 망설여짐 가본 40대 후기 부탁'),
('free', '룸 갈때 친구가 자꾸 이상한 사람 데려옴', '거절하는것도 한두번이지 이번엔 진짜 안가야겠음'),
('free', '강남에서 사복으로 클럽 가도 됨?', '청바지 후드티인데 입장 가능한지 궁금함 너무 캐주얼인가'),
('free', '나이트가는 사람들은 평일엔 뭐함?', '주말만 사는것 같은 사람들 평일엔 무슨 낙으로 사는건지 궁금'),
('free', '클럽에서 인생 친구 만들었음', '같이 술마시다 친해져서 결혼식 부케 받음 인생 모르는거임'),
('free', '술 먹고 노래방 가는게 더 재밌을때 있음', '나이트보다 노래방에서 친구들이랑 떠드는게 재미질때 있더라'),
('free', '나이트에서 옛 애인 만났을때', '서로 어색하게 못본척 했음 술 한잔 더 시키고 자리 옮김 ㅋㅋ'),
('free', '강남 새벽 4시 풍경 진짜 신기함', '술취한 사람들 길에 가득하고 택시 잡으려는 사람들 풍경이 영화같음'),
('free', '룸 시간이 너무 빨리 지나감', '2시간 잡았는데 1시간같음 시간이 어떻게 가는지 모름'),
('free', '나이트 끝나고 친구네 집 가서 라면 먹는 그 맛', '집에서 먹는 새벽 라면이 진짜 별미임 같이 가는 친구가 있어야지'),
('free', '강남 vs 청담 어디가 더 어른스러움', '40대 끼리 가는데 어디가 분위기 잡기 좋을지 추천 부탁'),
('free', '주말마다 양주 1병씩 까는데 간 괜찮을까', '검진은 잘 받고있는데 좀 걱정되긴함 다들 어떻게 관리해'),
('free', '나이트에서 명함 받는 사람 진짜 비즈니스맨', '클럽에서 명함 교환하는 사람들 보면 인생 잘사는것같음'),
('free', '클럽 입장 거절당한적 있음??', '그날 옷차림때문에 못들어간적 있음 진짜 쪽팔렸음 ㅋㅋ'),
('free', '룸에서 나오는 안주가 진짜 별미임', '치즈플레이트 + 과일플레이트 조합이 진리 술이랑 너무 잘맞음'),
('free', '나이트 갔다가 헌팅포차 가본적', '이게 더 재밌을때 있음 음악 시끄럽지 않고 대화하기 좋음'),
('free', '40대 솔로인데 클럽가면 만남 있음?', '진심으로 궁금함 또래도 있는 곳이 있는지'),
('free', '클럽에서 한국말 못하는 외국인이랑 노는것도 재밌음', '말 안통해도 분위기로 통함 인스타로 연락도 함'),
('free', '강남 vs 홍대 부킹 매너 차이', '강남이 좀 더 정중한편이고 홍대가 자유로운 편 둘 다 매력있음'),
('free', '룸 안가본지 너무 오래됨 트렌드 바뀜?', '5년만에 가려는데 분위기나 가격 많이 달라졌나'),
('free', '나이트가는 직장 동료가 의외로 많음', '평소 조용한 부장님이 단골이래서 충격받음 사람 모름'),
('free', '클럽에서 본 가장 미친 광경', '50대 아저씨가 20대처럼 춤추는데 진짜 잘추심 인정 박고감')
ON CONFLICT DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 6/9 — 시드 풀: 후기 80개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 시드 글 풀 확장 2/6: 후기(reviews) 80개
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_post_pool (category, title, content) VALUES
-- 강남
('reviews', '강남 옥타곤 진짜 강추 분위기 미침', '주말 11시쯤 갔는데 사람 진짜 많고 사운드 미쳤음 EDM 좋아하면 무조건 가야함 가격대는 좀 있는편'),
('reviews', '아르쥬 첫방문 후기 가격값 함', '서비스 진짜 다른 클럽이랑 차이남 매니저가 처음부터 끝까지 케어해줌 연인이랑 가기 좋음'),
('reviews', '강남 클럽 메이드 분위기 진짜 좋더라', '인테리어 호텔급이고 음악도 트렌디함 20대 후반 30대 초반 많아서 물도 좋음'),
('reviews', '클럽 피스타 솔직히 입장료 아까움', '들어가니까 사람도 적고 음악도 별로였음 평일이라 그런가 다음에 주말에 다시 가봐야지'),
('reviews', '강남 더라이브 프리미엄 가격값 한다', '고급스러운 분위기에 음향도 좋고 매너있는 손님들 많음 비즈니스 미팅에도 적합'),
('reviews', '아도니스 처음 가봤는데 분위기 압도적', '입장하자마자 분위기에 압도됨 음악 큐레이션 좋고 라운지 영역도 잘되어있음'),
('reviews', '강남 클럽 NB2 갔다왔음 후기', '사운드 시스템 진짜 좋고 DJ 라인업도 강함 다만 주말은 너무 붐비는게 단점'),
-- 홍대
('reviews', '홍대 사운드홀릭 후기 음악 진심', '홍대 갈때마다 가는 곳인데 음악 큐레이션이 진짜 미침 EDM부터 힙합까지 골고루'),
('reviews', '홍대 NB 갔는데 분위기 자유로움', '강남이랑은 완전 다른 분위기 자유롭고 편안함 20대 많고 가격도 합리적'),
('reviews', '홍대 노이즈베이직 추천함 분위기굿', '음악도 좋고 사람들도 친절하고 가격대도 강남보단 착함 홍대 클럽 입문용으로 좋음'),
('reviews', '홍대 사운드 첫방문 인정', '소문대로 사운드 진짜 좋음 EDM 좋아하면 강추 평일에도 사람 꽤 있음'),
('reviews', '홍대 오우라 분위기 트렌디함', '20대 초반이 많고 분위기 활기참 처음 클럽 가는 친구한테 추천하기 좋음'),
('reviews', '홍대 모디 다녀옴 가성비 굿', '입장료 적당하고 술값도 합리적임 친구들이랑 부담없이 놀기 좋은 곳'),
-- 이태원
('reviews', '이태원 케이크샵 외국인 많고 분위기 다름', '서울 다른 클럽이랑 분위기가 완전 다름 외국인 비율 50% 영어로 대화 많음'),
('reviews', '이태원 스카이라운지 야경 미쳤다', '한강 야경 보면서 칵테일 마시는 분위기 진심 미침 데이트로 강추'),
('reviews', '이태원 라운지 갔는데 외국인 친구 많이 사김', '여러 나라 사람들 한자리에 모여서 대화하는 분위기 너무 좋았음'),
-- 부산
('reviews', '부산 고구려 토요일 미쳤음 진짜', '해운대 가서 안가면 손해임 사운드 시스템 진짜 좋고 부킹도 활발 다만 주말은 전쟁'),
('reviews', '부산 챔피언 다녀온 후기', '광안리 야경 보면서 노는 분위기가 진짜 좋음 주말 늦게가면 자리없으니 일찍'),
('reviews', '부산 크리스탈 분위기 인정', '해운대 끝쪽에 있는데 분위기 좋고 사람도 친절함 부산 가면 꼭 가는 곳'),
('reviews', '부산 클럽 더라스트 후기 강추', '서면쪽인데 분위기 미침 부산 사람들 진짜 잘놀더라 강남이랑 비교불가'),
('reviews', '부산 라운지 더쉬 분위기 정말 좋음', '광안리 야경 보면서 칵테일 마시는데 인생 명장면 데이트로 추천'),
-- 수원
('reviews', '수원 찬스돔 부킹 진짜 잘됨', '강남 안가도 됨 수원에서 충분함 실장님 친절하고 사람도 많음'),
('reviews', '수원 라온 분위기 인정', '인계동 라온 갔는데 생각보다 사람 많고 분위기 좋음 가성비 굿'),
('reviews', '수원 더쇼 후기 분위기 미침', '인계동 자주 가는데 더쇼가 제일 좋음 사람도 많고 음악도 좋음'),
-- 대전
('reviews', '대전 세븐나이트 처음 가봄 만족', '대전 첫방문이었는데 생각보다 분위기 좋고 사람들 친절함 대전 사람들 잘놀음'),
('reviews', '대전 클럽 더라운지 분위기 굿', '둔산동에 있는데 분위기 차분하고 어른스러움 4-50대 많은편'),
('reviews', '대전 나이트 챔피언 후기', '둔산동 챔피언인데 분위기 미쳤음 대전 출장 갈때마다 가는 단골'),
-- 일산
('reviews', '일산 라붐 리뉴얼 후 진짜 달라짐', '인테리어 호텔급이고 음향도 업그레이드됨 일산 사람이면 무조건 가봐야'),
('reviews', '일산 명월관 접대용으로 갔는데 거래처 감동', '음식이 진짜 맛있고 분위기도 좋음 거래처 사장님이 또 가자고 하심'),
('reviews', '일산 라운지바 더쉘 분위기 좋음', '백석동 더쉘 갔는데 칵테일 맛있고 분위기 차분함 데이트하기 좋음'),
-- 대구
('reviews', '대구 챔피언 분위기 미쳤음', '대구 왔으면 무조건 가야함 사운드 좋고 사람도 많고 분위기 미침'),
('reviews', '대구 더그레이 후기 인정', '동성로 더그레이 갔는데 트렌디한 분위기 20대 많음 음악도 좋음'),
('reviews', '대구 클럽 비트 분위기 좋더라', '대구 사람들 잘노는거 인정함 비트 음악 좋고 사운드도 좋음'),
-- 광주/울산/인천
('reviews', '광주 챔피언 분위기 정말 좋음', '광주 첫방문이었는데 사람들 친절하고 분위기 활기참 또 갈거임'),
('reviews', '광주 더라운지 가본 후기', '상무지구 라운지 갔는데 분위기 차분하고 칵테일 맛있음 데이트 추천'),
('reviews', '울산 챔피언 가성비 최고', '울산은 챔피언이 진리임 가격도 착하고 분위기도 좋음'),
('reviews', '울산 라운지 더쉘 분위기 좋더라', '삼산동에 있는데 칵테일 맛있고 분위기도 차분함 어른들이 많음'),
('reviews', '인천 구월동 클럽 후기 가성비', '강남이랑 비교하면 가격 반값에 분위기 비슷함 인천 사람들 잘놀음'),
('reviews', '인천 라운지 더쉽 다녀옴', '송도에 있는데 야경 보면서 술마시는 분위기 진짜 좋음'),
-- 룸/요정
('reviews', '강남 룸 더로얄 후기 가격값 함', '서비스 진짜 좋고 도우미 매너있고 양주 종류도 다양함 거래처 모시고 가기 좋음'),
('reviews', '강남 요정 명월관 분위기 미침', '한정식 풀코스에 분위기 진짜 좋음 거래처 접대용으로 강추'),
('reviews', '강남 룸 첫방문 후기 솔직히', '처음이라 어색했는데 매니저가 잘 알려줘서 편하게 놀았음 가격은 부담스럽지만'),
('reviews', '청담동 룸 더가든 후기', '인테리어 호텔급이고 서비스 진짜 좋음 비싼만큼 값어치는 함'),
('reviews', '강남 룸 더원 가성비 굿', '강남치고 가격이 합리적임 분위기도 좋고 매니저도 친절함'),
('reviews', '강남 요정 더화 분위기 정말 좋음', '한국 전통 분위기에 음식도 맛있음 외국 거래처 모시고 가기 딱 좋음'),
('reviews', '강남 룸 더팰리스 추천', '럭셔리한 분위기에 양주 종류 많고 도우미 매너있음 비싸지만 값함'),
('reviews', '청담 룸 더그랜드 가본 후기', '청담동 답게 럭셔리한 분위기 매니저 케어 진짜 잘해줌 비싼편'),
-- 호빠
('reviews', '강남 호빠 첫방문 후기 솔직하게', '여자친구들이랑 가봤는데 생각보다 분위기 편하고 선수들 매너있음'),
('reviews', '강남 호빠 더보이 다녀옴', '여자친구 생일에 갔는데 친구가 진짜 좋아함 선수들 친절하고 노래도 잘부름'),
('reviews', '강남 호빠 분위기 솔직 후기', '여자분들끼리 가서 신나게 놀았음 매니저 친절하고 선수들 매너있고 추천'),
('reviews', '홍대 호빠 가본 후기 분위기굿', '홍대답게 자유로운 분위기 강남보단 가격 착하고 분위기 편함'),
('reviews', '부산 호빠 후기 분위기 좋음', '해운대 호빠 갔는데 부산답게 사람들 친절하고 분위기 활기참'),
-- 라운지
('reviews', '강남 라운지 무드 분위기 미침', '청담동 라운지인데 분위기 진짜 차분하고 칵테일도 맛있음 어른들 데이트로 강추'),
('reviews', '청담 라운지 더루프 야경 미침', '한강 야경 보면서 칵테일 마시는 분위기 진심 인생샷 명소'),
('reviews', '강남 라운지 더가든 분위기 좋더라', '식물 인테리어로 차분한 분위기 데이트하기 좋고 사진 잘나옴'),
('reviews', '이태원 라운지 더쉘 외국인 친구 사김', '외국인 비율 높아서 영어 연습도 됐고 분위기 좋음'),
('reviews', '한남동 라운지 더그라운드 추천', '한남동 분위기 그대로 차분하고 어른스러움 직장인끼리 한잔하기 좋음'),
-- 추가
('reviews', '강남 클럽 4시간 풀코스 후기', '저녁 9시부터 새벽 1시까지 풀코스 즐겼음 가격 비쌌지만 인생 명장면'),
('reviews', '나이트 처음가본 사람 후기', '40대 처음 가봤는데 생각보다 어색하지 않고 즐거웠음 친구들 덕분'),
('reviews', '강남 룸 도우미 케어 진짜 잘해줌', '처음이라 어색했는데 도우미 분이 분위기 잡아줘서 편하게 놀았음'),
('reviews', '청담동 룸 가격 솔직히 비싸지만', '인당 30만원 들었는데 그만큼 서비스 좋음 거래처용으로 추천'),
('reviews', '부산 룸 후기 강남보다 가성비', '부산 룸 가봤는데 강남보다 가격 착하고 서비스도 좋음 출장갈때 추천'),
('reviews', '강남 라운지 평일 후기', '평일이라 사람 적어서 조용히 칵테일 마실 수 있어서 좋았음'),
('reviews', '홍대 클럽 평일 분위기 후기', '평일 늦게 갔는데 사람 적당히 있고 분위기 좋음 주말보다 편함'),
('reviews', '강남 옥타곤 평일 후기', '주말은 너무 붐벼서 평일에 갔는데 의외로 사람 많고 분위기 좋음'),
('reviews', '이태원 클럽 케이크샵 평일 분위기', '평일 외국인 더 많은편 영어 연습하기 딱 좋음'),
('reviews', '대전 룸 후기 가성비 좋더라', '대전 출장중에 갔는데 가격 착하고 서비스 괜찮음 거래처 만족'),
('reviews', '광주 룸 분위기 정말 좋더라', '광주 출장 갔다가 거래처랑 갔는데 분위기 좋고 음식 맛있음'),
('reviews', '대구 룸 후기 분위기 인정', '동성로 룸 갔는데 분위기 어른스럽고 서비스 좋음 거래처 만족'),
('reviews', '울산 룸 후기 가성비 진짜 좋음', '울산 출장 갈때마다 가는 곳 가격 착하고 분위기 좋음'),
('reviews', '부산 라운지 광안리 야경 미침', '광안리 라운지 진짜 야경 미쳤음 데이트로 강추 칵테일도 맛있음'),
('reviews', '대구 라운지 분위기 좋더라', '동성로 라운지 갔는데 어른들 많고 분위기 차분함 데이트로 좋음'),
('reviews', '강남 룸 양주 추천 메뉴 후기', '발렌타인 17 시켰는데 가성비 진짜 좋음 30년산까진 안가도 됨'),
('reviews', '강남 룸 음식 메뉴 진짜 맛있음', '안주 메뉴 다양하고 음식 퀄리티 진짜 좋음 만족함'),
('reviews', '룸 노래방 시스템 진짜 좋더라', '최신곡 다 있고 사운드도 좋음 친구들이랑 노래 부르기 너무 좋았음'),
('reviews', '강남 클럽 입장 후 분위기 후기', '입장하자마자 분위기에 압도당함 음악 좋고 사람 많고 만족'),
('reviews', '청담 라운지 새벽 분위기 미침', '새벽 2시에 가니까 분위기 차분하고 진짜 어른들 분위기 좋았음'),
('reviews', '강남 룸 새벽까지 풀코스', '저녁부터 새벽까지 풀코스로 놀았는데 만족도 100%')
ON CONFLICT DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 7/9 — 시드 풀: 꿀팁 60개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 시드 글 풀 확장 3/6: 꿀팁(tips) 60개
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_post_pool (category, title, content) VALUES
('tips', '클럽 입장 거절당하지 않는 법', '복장 단정하게 운동화는 깔끔한걸로 모자나 후드는 벗고 입장 신분증 필수임'),
('tips', '나이트 부킹 매너 5가지', '1.거절당해도 기분좋게 2.대화시 존댓말 3.무리한 요구 금지 4.한잔 같이 5.연락처 강요 노노'),
('tips', '룸 처음 가는 사람 양주 주문 가이드', '발렌타인 17이 가성비 베스트 윈저 17도 좋음 처음이면 시바스리갈 12도 무난'),
('tips', '강남 클럽 입장료 할인받는 법', '인스타 팔로우하면 할인 많고 일찍 가면 프리입장 단체할인도 잘 챙겨봐야'),
('tips', '클럽에서 사진 잘 찍는 꿀팁', '플래시 끄고 무드등 활용 친구한테 옆에서 잡으라고 하면 인생샷 나옴'),
('tips', '나이트 첫방문자 옷차림 추천', '남자: 셔츠+청바지+운동화 / 여자: 원피스+굽 너무높지않은 신발이 베스트'),
('tips', '강남 택시 빨리 잡는 방법 공유', '강남역 말고 한블록 떨어진 곳에서 잡으면 됨 카카오T 호출도 콜비 더 줘서 부르기'),
('tips', '클럽 안전하게 노는 법', '음료 자리비울때 다 마시고 가기 친구랑 같이 화장실 가기 위치공유 켜기'),
('tips', '룸에서 거래처 접대 잘하는 꿀팁', '미리 예약하고 인원수 정확히 매니저한테 이름 말씀드리면 케어 잘해줌'),
('tips', '나이트 단골 되는 법 알려줌', '같은 실장님 찾아가기 자주 가기 매너있게 행동 팁 적당히 주기 이거면 됨'),
('tips', '클럽 음악 좋은 시간대는?', '11시-2시가 피크타임 DJ 라인업 좋고 사람 많아서 분위기 미침'),
('tips', '호빠 가는 여자분들 알아둘 매너', '예약 미리 선수 지명할거면 미리 말씀 결제는 카드 가능 매너있게'),
('tips', '클럽 부킹 받기 좋은 자리', '무대 정면이나 우측 2번째 줄이 부킹 잘됨 입구 가까운 자리는 부킹 적음'),
('tips', '룸 가격 미리 확인하는 법', '예약할때 인당 가격 정확히 물어보고 양주 종류별 가격도 미리 확인'),
('tips', '클럽 처음 가는 친구 데려갈때', '미리 분위기 알려주고 옷차림 가이드 해주고 부담스럽지 않게 케어'),
('tips', '강남 클럽 평일이 더 좋은 이유', '평일은 사람 적당하고 부킹 잘됨 단골들 많아서 분위기도 좋음'),
('tips', '나이트 가기 전 식사 추천', '기름진 음식 피하고 가벼운거 추천 라면 김밥 정도가 좋음'),
('tips', '클럽 음악 못따라가도 괜찮음', '리듬감 없어도 분위기만 즐기면 됨 어색하면 술 한잔 더 하면서 친구랑 대화'),
('tips', '룸 도우미 매너있게 부르는 법', '존댓말 사용 무리한 요구 안하기 팁 적당히 주기 매너있게 대화'),
('tips', '클럽 경험치 쌓는 법', '여러 클럽 가보고 자기 스타일 찾기 강남 홍대 이태원 다 가보면 됨'),
('tips', '나이트 후 안전하게 귀가하는 법', '대리 부르거나 택시 미리 호출 위치공유 켜기 친구랑 동행'),
('tips', '클럽 분위기 좋은 요일 추천', '금요일 토요일이 베스트 일요일은 분위기 좀 다름'),
('tips', '룸 가성비 좋게 노는 꿀팁', '평일에 가기 매니저 친한 사람한테 부탁 단체할인 활용'),
('tips', '나이트 시간 효율적으로 노는 법', '11시쯤 가서 새벽 3시까지가 골든타임 너무 일찍이나 늦게 가면 분위기 다름'),
('tips', '클럽 옷 보관 팁', '소지품은 락커 사용 귀중품은 바카운터 보관 부탁 가능'),
('tips', '강남 vs 홍대 클럽 차이점 정리', '강남: 비싸고 럭셔리 / 홍대: 자유롭고 가성비 / 본인 스타일 찾기'),
('tips', '룸 처음 가는 사람 옷차림', '셔츠+슬랙스 정도가 베스트 너무 캐주얼은 분위기 안맞음'),
('tips', '나이트 부킹 잘되는 시간대', '11시-1시가 피크 너무 늦게 가면 사람들 정신없음 일찍이 좋음'),
('tips', '클럽 처음가는 사람 마음가짐', '부담갖지 말고 분위기 즐기기 부킹 안와도 친구들이랑 즐기면 됨'),
('tips', '룸 초이스 잘하는 꿀팁', '도우미 분위기랑 본인 취향 맞춰서 매니저한테 미리 분위기 말씀'),
('tips', '클럽 화장실 사용 팁', '여자화장실 줄 길때 1층보다 위층 사용 남자화장실은 시간차 활용'),
('tips', '강남 클럽 가성비 좋은 시간', '입장료 무료시간 노리기 인스타 이벤트 활용 평일에 가기'),
('tips', '룸 양주 종류별 특징', '발렌타인: 부드러움 / 윈저: 진함 / 잭다니엘: 향 좋음 / 본인 취향대로'),
('tips', '클럽 술 적당히 마시는 법', '물 자주 마시고 칵테일이랑 양주 섞지 말기 안주 꼭 챙겨먹기'),
('tips', '나이트 안전한 부킹 매너', '연락처 받고 다음날 연락 안받아도 매너있게 처음부터 무리한 요구 금지'),
('tips', '룸 매니저랑 친해지는 법', '자주 가기 팁 적당히 주기 매너있게 행동 단골되면 케어 진짜 잘해줌'),
('tips', '클럽 친구랑 시너지 잘 내는 법', '한명은 텐션 한명은 분위기 잡고 역할 분담하면 부킹 잘됨'),
('tips', '강남 클럽 주차 꿀팁', '강남역 공영주차장 활용 주말은 일찍 가야 자리 있음 발렛도 가능'),
('tips', '룸 음식 메뉴 추천 베스트', '치즈플레이트 + 과일 조합이 진리 안주 든든하게 먹어야 안 취함'),
('tips', '나이트 dj 신청곡 받는 법', '돈 주는것보다 매너있게 부탁하는게 효과적 테이블에서 매니저 통해'),
('tips', '클럽 텐션 올리는 꿀팁', '술 적당히 마시고 음악에 몸 맡기기 친구들이랑 주거니받거니 분위기 만들기'),
('tips', '룸 도우미 분위기 좋게 만드는 법', '매너있게 대화 술 같이 마시기 노래 같이 부르기 강요 노노'),
('tips', '강남 클럽 vip 테이블 가격대', '4명 기준 100만원부터 시작 양주 1병 포함 매니저한테 미리 물어봐야'),
('tips', '나이트 처음 가는 30대 가이드', '20대 클럽이랑 분위기 다름 30대 많은 곳 골라서 가야 편함'),
('tips', '클럽 4-50대 추천 장소', '강남 라운지 청담동 어른들 많은 클럽 분위기 차분하고 매너있음'),
('tips', '룸 4시간 풀코스 가격대', '4명기준 200-300만원선 양주 + 도우미 + 안주 풀세트'),
('tips', '나이트 단체로 가는 꿀팁', '미리 예약 인원수 정확히 테이블 미리 잡기 단체할인 활용'),
('tips', '클럽 초보 부킹 매너 5가지', '1.거절당해도 웃기 2.연락처 강요 노노 3.존댓말 4.무리한 신체접촉 노노 5.매너있게'),
('tips', '룸 양주 1병 4명이 적당량', '4명이서 양주 1병이 딱 적당함 더 많이 시키면 다음날 죽음'),
('tips', '나이트 가기 전 컨디션 만드는 법', '낮잠 자두고 가벼운 식사 물 많이 마시기 컨디션 좋게 가야'),
('tips', '클럽 음악 좋아하는 사람 추천', 'EDM은 옥타곤 힙합은 사운드홀릭 트렌디는 메이드 스타일대로'),
('tips', '강남 룸 예약 잘하는 법', '주말은 1주일 전부터 예약 평일은 당일도 가능 인원수 정확히'),
('tips', '나이트 솔로로 가도 괜찮은 곳', '라운지 추천 친구 사귀기 좋고 부담없이 갈수있음 청담동 라운지가 베스트'),
('tips', '클럽 음료 안전하게 마시는 법', '잔 자리비울때 마시고 새거 시키기 음료 받을때 직접 받기'),
('tips', '룸 분위기 잡는 매니저 찾는 법', '자주 가서 친해지기 인스타로 미리 연락 친구 소개로 가는것도 방법'),
('tips', '나이트 부킹 후 데이트 매너', '강압적이지 않게 자연스럽게 다음 만남 미리 약속 잡지말기'),
('tips', '클럽 미리 알아보고 가는 꿀팁', '인스타 검색해서 분위기 확인 친구한테 후기 듣기 가성비 비교'),
('tips', '룸 단골이면 받는 혜택 정리', '좋은자리 도우미 케어 가격 할인 매니저 추천 받기 진짜 다름'),
('tips', '나이트 가서 만난 사람이랑 다음 약속', '클럽에서 잡지말고 카톡으로 다음에 약속 잡기 강압적이지 않게'),
('tips', '강남 클럽 신분증 검사 팁', '주민증 면허증 여권 다 가능 외국인은 여권 필수 미리 챙기기'),
('tips', '룸 처음가서 안 망하는 꿀팁', '메뉴판 미리 보고 가격 확인 매니저한테 솔직하게 처음이라 말씀'),
('tips', '클럽 부킹 잘 받는 자리 위치', '무대 정면 2-3번째줄이 베스트 입구쪽은 부킹 적음 끝쪽은 안보임')
ON CONFLICT DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 8/9 — 시드 풀: Q&A + 모집 120개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 시드 글 풀 확장 4/6: Q&A(discussion) 60개
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_post_pool (category, title, content) VALUES
('discussion', '40대 처음 클럽 가는데 어디가 좋음?', '오랜만에 놀고싶은데 어디가 또래 많은지 추천 부탁'),
('discussion', '강남 vs 청담 어디가 어른 많음?', '40대인데 어디가 더 분위기 차분하고 어른들 많은지'),
('discussion', '커플로 클럽 가도 안 어색해?', '여친이랑 같이 가려는데 분위기가 어떤지 가본 사람 알려줘'),
('discussion', '룸 처음인데 인당 얼마 잡으면 됨?', '거래처 4명 모시고 가는데 예산 잡기 어려움'),
('discussion', '여자 혼자 라운지 가도 괜찮을까?', '진심 궁금함 분위기가 어떤지 어색하지 않은지'),
('discussion', '클럽 부킹은 진짜 자주 일어남?', '한번도 안가봤는데 영화에서만 보던 일이 진짜 일어나는지 궁금'),
('discussion', '나이트 처음인데 양주 시키는게 부담스러움', '맥주만 시켜도 되는지 분위기상 양주 필수인지'),
('discussion', '강남 클럽 입장료 보통 얼마?', '평일 주말 차이 있는지 평균 가격 알려줘'),
('discussion', '여자친구가 클럽 가지말래 어떻게 설득?', '나는 분위기만 즐기는데 못믿겠대 어떻게 설득해야'),
('discussion', '룸 도우미 강제로 시키는거 아님?', '안시키고 친구들끼리만 놀고 싶은데 가능한지 궁금'),
('discussion', '직장 상사가 룸 가자는데 거절 가능?', '회식 자리 끝나고 룸가자는데 어떻게 자연스럽게 거절할까'),
('discussion', '50대 들어가도 분위기 안 어색?', '50대인데 클럽이나 라운지 가도 괜찮은건지'),
('discussion', '호빠 처음 가는 여자 어디 가는게 안전?', '강남 호빠 추천 부탁 처음이라 안전한 곳 가고 싶음'),
('discussion', '클럽 옷차림 너무 캐주얼하면 못들어감?', '청바지에 깔끔한 셔츠인데 입장 가능할까 강남 기준'),
('discussion', '나이트 다녀오면 다음날 진짜 못 일어남', '주말마다 가는데 일요일이 회복일임 다들 어떻게 회복함'),
('discussion', '여자분들 클럽 갈때 가방 어떻게 함?', '소지품 무겁게 들고가기도 그렇고 어떻게 처리하는지 궁금'),
('discussion', '룸 단골 되면 진짜 다른가?', '몇번가야 단골 인정되는지 단골 혜택이 뭔지'),
('discussion', '강남 클럽 줄 얼마나 서야됨?', '평일 주말 차이 있을것같은데 평균 대기시간 궁금'),
('discussion', '나이트 처음인데 친구 데려가는게 좋음?', '혼자 가도 괜찮은지 친구 필수인지 분위기 궁금'),
('discussion', '룸 시간 연장하면 가격 어떻게?', '2시간 잡았는데 더 놀고싶으면 연장 가능한가 비용은'),
('discussion', '클럽 부킹 거절하는 매너있는 방법', '나는 그냥 친구들이랑 놀고 싶은데 거절하는 좋은 방법 있을까'),
('discussion', '강남 vs 부산 클럽 분위기 차이', '부산 출장 가는데 강남이랑 어떻게 다른지 미리 알고 싶음'),
('discussion', '룸 양주 안마시고 와인만 시켜도 됨?', '술 약해서 양주는 부담스러운데 와인 가능한지'),
('discussion', '나이트 헌팅포차 차이가 뭐임?', '둘다 가본적 있는데 분위기 차이가 뭐고 어디가 더 재밌음'),
('discussion', '40대 솔로인데 클럽가면 만남 있음?', '나잇대 맞는 사람 만날 수 있는지 진심 궁금'),
('discussion', '룸 도우미 팁 얼마 줘야 매너있음?', '처음이라 잘 모르는데 적당한 금액 알려줘'),
('discussion', '클럽 음악 따라가야 부킹 잘됨?', '춤 못추는데 그냥 분위기만 즐겨도 부킹 들어오는지'),
('discussion', '강남 라운지 데이트 가도 괜찮?', '여친이랑 갈만한 분위기인지 너무 시끄럽진 않은지'),
('discussion', '나이트 사람 적당한 시간대?', '너무 일찍이나 늦으면 분위기 별로일거같은데 황금시간 언제'),
('discussion', '룸 첫방문인데 매니저 어떻게 부르나', '예약하고 갔는데 매니저랑 어떻게 인사하고 분위기 만드는지'),
('discussion', '여자친구랑 라운지 데이트 추천?', '청담동쪽으로 분위기 좋은 라운지 추천 받고 싶음'),
('discussion', '클럽 신분증 검사 진짜 빡셈?', '주민증 안가지고 가면 못들어가는지 면허증으로 가능한지'),
('discussion', '나이트 dj 신청곡 받아주나?', '돈 줘야하는지 매너있게 부탁하면 받아주는지'),
('discussion', '강남 클럽 vip 테이블 얼마부터?', '4명 기준 vip 테이블 가격대 알고 싶음 양주 포함'),
('discussion', '룸 가서 노래 안부르면 어색?', '노래 못부르는데 분위기상 부르지 않으면 이상한지'),
('discussion', '클럽 처음인데 친구가 자꾸 부킹하라고함', '나는 그냥 분위기 즐기고 싶은데 친구가 자꾸 부킹 강요해서 부담'),
('discussion', '룸 도우미 안불러도 매너인가?', '친구들끼리만 놀고 싶은데 매니저가 이상하게 보지 않을까'),
('discussion', '강남 클럽 새벽 4시 분위기 어떰?', '늦게까지 노는 사람들이 있는지 분위기가 어떤지'),
('discussion', '나이트 첫방문 후기 글 쓰기 좋음?', '처음 가본 솔직한 후기 올려도 다른분들 도움될까'),
('discussion', '클럽 술값 카드 vs 현금 어디가 좋음?', '카드결제 다 받는지 현금 가져가야 안전한지'),
('discussion', '룸 4시간 풀코스 가격대 궁금', '4명 기준 풀코스로 놀면 인당 얼마 잡아야'),
('discussion', '강남 클럽 일찍 가면 입장 무료?', '오픈시간 맞춰가면 무료라고 하던데 진짜인지'),
('discussion', '나이트 부킹 후 카톡 답장 매너', '연락처 주고받았는데 다음날 카톡 안오면 그냥 끝?'),
('discussion', '룸 양주 종류 너무 많아서 고민', '발렌타인 윈저 잭다니엘 차이가 뭔지 추천 부탁'),
('discussion', '클럽에서 핸드폰 충전 가능?', '배터리 다되면 답없는데 충전소 있는 클럽 있나'),
('discussion', '강남 룸 추천 부탁 거래처 모시는중', '거래처 사장님 모시고 갈건데 분위기 좋고 서비스 좋은곳'),
('discussion', '여자분들 라운지 가도 분위기 어색하지않음?', '여친이랑 라운지 처음인데 분위기 어떤지'),
('discussion', '클럽 시끄러운데 어떻게 대화함?', '음악 너무 커서 옆사람이랑 대화 어려운데 어떻게 함'),
('discussion', '룸 가격 미리 알수있는 방법?', '예약할때 가격 정확히 물어보면 알려주는지'),
('discussion', '나이트 친구들이랑 가는데 인원 많을때 추천', '7명 가는데 단체로 받아주는 곳 어디가 좋음'),
('discussion', '강남 라운지 평일에도 사람 많음?', '평일 가려는데 너무 한가하지 않을지 분위기 궁금'),
('discussion', '룸 매니저 추천 받는 방법?', '단골 친구가 추천해주는것보다 좋은 방법 있는지'),
('discussion', '클럽 처음인데 술 못마시면 어색?', '술 약한데 그냥 분위기만 즐기고 싶은데 가능한지'),
('discussion', '나이트 부킹 매너 어떻게 알수있음?', '매너있는 부킹이 뭔지 처음이라 잘 모르겠음'),
('discussion', '강남 vs 홍대 어디가 30대 많음?', '30대 또래 많은곳 추천 부탁'),
('discussion', '룸 처음 가는 4-50대 추천 장소', '거래처 모시고 갈건데 4-50대 분위기 좋은곳'),
('discussion', '클럽 친구 잃어버리면 어떻게 찾음?', '핸드폰도 안되고 너무 시끄러운데 만나는 장소 정해놔야'),
('discussion', '나이트 사람 많은 시간 피하는 법', '주말 너무 붐비는데 피하는 시간대 있는지'),
('discussion', '룸 도우미랑 친해지면 다음에 또 가능?', '괜찮은 도우미 만나면 다음번에 같은 사람 부를수있는지'),
('discussion', '강남 클럽 새벽 끝나는 시간?', '몇시까지 영업하는지 아침까지 노는것도 가능한지')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 시드 글 풀 확장 5/6: 조각모집(party) 60개
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_post_pool (category, title, content) VALUES
('party', '이번주 토요일 강남 옥타곤 조각구함', '20대 후반-30대 초반 4명 모집중 현재 2명 토요일 11시 입장'),
('party', '금요일 홍대 사운드홀릭 같이 갈 사람', '20대 후반 남자 2명 더 구함 같이 입장료 분담'),
('party', '오늘밤 부산 고구려 즉흥 조각', '갑자기 가고싶어졌는데 같이 갈 사람 1-2명 부산사람 환영'),
('party', '일산 라붐 토요일 조각 구해요', '4명 테이블 잡는데 2명 더 구합니다 30대 환영'),
('party', '대전 세븐나이트 주말 조각', '대전사람 우대 토요일 10시 입장 3명 더 구함'),
('party', '강남 라운지 평일 조각 구함', '직장인 평일 한잔하실 분 청담동 라운지 4명 자리'),
('party', '수원 찬스돔 금요일 조각구함', '수원 사람 환영 30대 위주 5명 테이블 잡을거임'),
('party', '대구 챔피언 주말 조각', '대구 사는 30대 후반 1-2명 더 구합니다 토요일 입장'),
('party', '광주 클럽 주말 조각구해요', '광주 거주자 환영 30대 4명 모집중 분위기 활기차게'),
('party', '인천 구월동 클럽 조각', '인천 사람 환영 토요일 새벽 출발 3명 더 구함'),
('party', '울산 챔피언 주말 같이 갈사람', '울산 거주자 30대 2명 더 구함 토요일 11시'),
('party', '강남 룸 4명 조각 구함', '거래처 접대용 4명 모집 분위기 잘 잡아주실분'),
('party', '청담 라운지 데이트 조각', '커플끼리 4커플 모임 청담 라운지 분위기잡고'),
('party', '이태원 케이크샵 외국인친구랑', '외국인 친구 데려갈 한국인 1명 영어 가능자 환영'),
('party', '부산 해운대 클럽 조각', '해운대 클럽 토요일 4명 모집 부산 사는분 우대'),
('party', '강남 옥타곤 vip 테이블 조각', '4명 vip 테이블 잡을건데 비용 분담할 사람 구함'),
('party', '홍대 NB 평일 조각 구해요', '평일 분위기 좋을때 가실분 3명 더 구함'),
('party', '강남 메이드 토요일 같이 가실 분', '20대 후반 30대 초반 4명 모집중 매너 좋은분'),
('party', '대전 둔산동 클럽 조각', '대전 둔산동 토요일 4명 더 구함 30대 위주'),
('party', '강남 청담 룸 조각 구함', '청담 분위기 좋은 룸에서 같이 한잔 4명 모집'),
('party', '수원 인계동 클럽 같이 갈사람', '수원 인계동 더쇼 4명 모집 토요일 10시'),
('party', '부산 광안리 라운지 조각', '광안리 야경 보면서 한잔 4명 더 구함 매너있는분'),
('party', '강남 호빠 여자분들 조각', '여자친구들끼리 호빠 첫방문 4명 모집 분위기 잘잡으실분'),
('party', '대구 동성로 클럽 조각', '대구 동성로 챔피언 토요일 4명 더 구함'),
('party', '강남 라운지 어른들 조각', '40대 분위기 차분한 라운지 4명 더 구합니다 매너있는분'),
('party', '홍대 사운드 평일 조각', '평일 사운드 4명 더 구함 EDM 좋아하시는분 우대'),
('party', '부산 서면 클럽 조각', '서면 더라스트 토요일 4명 더 구함 부산사람'),
('party', '강남 더가든 라운지 데이트 조각', '커플 4커플 라운지 데이트 분위기 좋은 분들'),
('party', '청담 룸 풀코스 조각', '청담 풀코스 4명 모집 비용 분담 매너있는분'),
('party', '이태원 라운지 외국인 모임', '외국인 친구들이랑 이태원 라운지 가실분 영어가능'),
('party', '일산 명월관 접대 조각', '거래처 모시고 명월관 4명 매너있는 분만'),
('party', '강남 옥타곤 평일 조각 4명', '평일이라 부담없이 4명 더 구함 30대 위주'),
('party', '홍대 모디 주말 조각 구해요', '홍대 모디 가성비 좋다해서 4명 모집 토요일'),
('party', '강남 클럽 4명 vip 조각', '4명 비용 분담 vip 테이블 30대 후반 환영'),
('party', '부산 크리스탈 해운대 조각', '해운대 크리스탈 4명 더 구함 부산 거주자 우대'),
('party', '대전 세븐나이트 평일 조각', '평일 분위기 좋을때 4명 더 구함 대전 사람'),
('party', '강남 룸 친구들이랑 조각', '친구들이랑 8명 단체로 갈건데 4명 더 구함'),
('party', '청담 라운지 어른들 조각', '40대 분위기 좋은 청담 라운지 4명 더'),
('party', '강남 클럽 토요일 단체 조각', '8명 단체 토요일 조각구함 4명 모집중'),
('party', '인천 송도 라운지 조각', '송도 야경 라운지 4명 더 구함 인천 거주자'),
('party', '부산 광안리 클럽 토요일 조각', '광안리 클럽 4명 모집중 부산 거주자 우대'),
('party', '대구 챔피언 주말 단체조각', '대구 챔피언 단체 토요일 4명 더 구합니다'),
('party', '강남 청담 풀코스 조각', '클럽-룸-라운지 풀코스 4명 비용분담'),
('party', '홍대 사운드홀릭 EDM 조각', 'EDM 좋아하는 사람 4명 모집 토요일 사운드홀릭'),
('party', '강남 라운지 30대 모임', '30대 직장인 모임 라운지 4명 더 구함'),
('party', '부산 해운대 클럽 조각', '해운대 클럽 4명 모집 부산 거주자 환영'),
('party', '대전 세븐나이트 30대 조각', '30대 위주 4명 모집 대전 사람 우대'),
('party', '강남 호빠 여자들 단체 조각', '여자친구들 6명 단체 호빠 첫방문 4명 더'),
('party', '청담 룸 거래처 접대조각', '거래처 모시고 청담 룸 4명 분위기 좋은분'),
('party', '일산 라붐 주말 조각', '일산 라붐 토요일 4명 모집 일산 거주자'),
('party', '강남 클럽 단체 조각 8명', '강남 클럽 8명 단체 4명 더 구함 토요일'),
('party', '홍대 사운드 4명 조각구함', '홍대 사운드홀릭 4명 모집 EDM 좋아하시는분'),
('party', '강남 옥타곤 단골 조각', '옥타곤 자주가는 단골 4명 토요일 같이 가실분'),
('party', '부산 더라스트 주말 조각', '서면 더라스트 4명 모집 부산 거주자 우대'),
('party', '대구 비트 클럽 조각', '대구 동성로 비트 4명 더 구합니다 30대'),
('party', '강남 라운지 평일 어른 조각', '40대 평일 분위기 좋은 라운지 4명 모집'),
('party', '청담 룸 풀코스 4명 조각', '청담 룸 4시간 풀코스 4명 비용분담'),
('party', '인천 구월동 클럽 주말 조각', '구월동 클럽 토요일 4명 모집 인천 거주자'),
('party', '울산 챔피언 단체 조각', '울산 챔피언 8명 단체 4명 더 구함'),
('party', '광주 챔피언 주말 조각', '광주 챔피언 토요일 4명 모집 광주 거주자'),
('party', '강남 호빠 단체 조각 여자분', '여자친구들 단체 호빠 4명 더 분위기 좋은분')
ON CONFLICT DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────
-- │ STEP 9/9 — 시드 풀: 댓글 200개
-- └─────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- 시드 댓글 풀 확장 6/6: 사람 어투 댓글 200개
-- AI 냄새 0% — 디시/뽐뿌/실제 유흥 커뮤니티 어투
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════════

INSERT INTO seed_comment_pool (content) VALUES
-- 짧은 반응
('ㅋㅋㅋㅋ'),
('ㅇㅈ'),
('ㄹㅇ'),
('ㅋㅋㅋ 인정'),
('ㅋㅋㅋ 공감'),
('ㄹㅇ 맞말'),
('이게 맞지'),
('ㅇㅇ 인정함'),
('ㅋㅋㅋ 이거지'),
('ㅋ 진심'),
('ㄹㅇ ㅇㅈ'),
('ㄹㅇㅋㅋ'),
('ㅋㅋㅋㅋㅋ 미친'),
('완전 공감'),
('찐 ㅋㅋㅋ'),
-- 의문/질문
('어디임??'),
('어딘데 정보좀'),
('지점 어디?'),
('가격 얼마정도?'),
('주말도 가능?'),
('예약 필수임?'),
('실장님 누구로 부르면 됨'),
('뭐 입고 가야돼?'),
('주차되나'),
('단체로 가도 됨?'),
('인당 얼마정도 잡아야'),
('몇시쯤 가는게 좋아?'),
('나이대 어떻게 됨'),
('20대도 괜찮음??'),
('40대도 가도 됨?'),
-- 공감/감정
('아 진짜 공감 ㅠㅠ'),
('나도 똑같은 경험함 ㅋㅋ'),
('완전 내 얘긴줄'),
('읽으면서 ㅋㅋ터짐'),
('아 너무 웃겨ㅋㅋㅋ'),
('진짜 빵터졌다 ㅋㅋㅋㅋ'),
('나만 그런게 아니구나 ㅋㅋ'),
('이런 글 너무 좋다 자주써줘'),
('진심 공감되는 글'),
('이게 진짜 인생이지'),
('ㅠㅠ 슬프다 진짜'),
('나도 이래 항상'),
('완전 내 얘기네 ㅋㅋ'),
('울컥했음 진짜'),
('힐링되는 글이네'),
-- 정보 공유
('나도 거기 가봤는데 진짜 좋음'),
('단골인데 맞말만 했네'),
('실장님 진짜 친절하심 인정'),
('가성비 진짜 좋은데임'),
('주말은 일찍가야 자리있음'),
('평일이 분위기 더 좋음'),
('vip 잡으면 케어 진짜 잘해줌'),
('나도 거기서 단골됨'),
('인스타 팔로우하면 할인됨'),
('단체할인도 있더라'),
('일찍가면 입장료 할인'),
('주차 가능함 발렛도 됨'),
('카드결제 다 됨'),
('영업시간 새벽 5시까지'),
('남자 4명도 받아줌'),
-- 추천/평가
('강추 박고감 ㄹㅇ'),
('비추 ㅠㅠ 가지마셈'),
('가성비 굿'),
('퀄리티 보장'),
('서비스 진짜 좋음'),
('인테리어 미쳤음'),
('사운드 진짜 좋더라'),
('음악 큐레이션 좋음'),
('도우미 매너 좋음'),
('매니저 케어 진짜 잘해줌'),
('분위기 트렌디함'),
('어른들 분위기 잡기 좋음'),
('데이트로 강추'),
('접대용으로 베스트'),
('친구들이랑 가기 좋음'),
-- 경험담
('나도 거기서 여친 만남'),
('단골된지 3년됨'),
('첫방문때 진짜 좋았음'),
('매주 가는 단골임'),
('거래처 모시고 갔는데 만족하심'),
('생일파티 했는데 분위기 잘잡아줌'),
('20대때부터 다닌 단골'),
('출장갈때마다 가는 곳'),
('첫방문때 어색했는데 잘 적응함'),
('친구들이랑 4명이 갔는데 만족'),
('회사 회식 끝나고 갔음'),
('처음 갔을때 매니저 추천받음'),
('단골 되니까 진짜 다름'),
('vip 잡으니까 케어 잘해줌'),
('일찍가서 자리 잡았음'),
-- 톤 다양화
('와 정보 감사 ㅠㅠ'),
('이거 꿀팁이네 저장'),
('나도 가봐야겠다 진심'),
('주말에 가볼게 후기 쓸게'),
('정보 고마워 도움됨'),
('이런 글이 진짜 도움됨'),
('스크랩 박음'),
('덕분에 결정함'),
('망설였는데 후기보고 결정'),
('처음인데 용기 생김'),
('이거 보고 가기로 결정함'),
('정보 정리 진짜 잘됨'),
('초보한테 도움되는 글'),
('이런 후기 더 올려주세요'),
('자세하게 써줘서 고마움'),
-- 감탄/놀람
('와 미쳤다 ㄷㄷ'),
('헐 진짜??'),
('이게 가능함??'),
('와 부럽다 진심'),
('나도 가고싶다 ㅠㅠ'),
('대박이네 ㄷㄷ'),
('와 이런 곳이 있구나'),
('와 이거 진짜야'),
('헐 처음 들어봄'),
('와 신기하다'),
('대단하다 진심'),
('와 부러워'),
('아 가고싶어진다'),
('이런 곳도 있었네'),
('와 신세계네'),
-- 짧은 한마디
('굿'),
('나이스'),
('베스트'),
('레전드'),
('찐'),
('인정'),
('맞말'),
('ㅇㅇ'),
('ㄴㄴ 비추'),
('ㄱㄱ 가즈아'),
-- 토론/의견
('나는 좀 다르게 생각함'),
('의견 갈리는 부분이긴 한데'),
('이건 좀 케이스바이케이스'),
('상황 따라 다르긴 한듯'),
('취향 차이 같음'),
('내 경험으론 그렇진 않던데'),
('나는 반대 의견'),
('일리 있는 말'),
('맞는것 같기도 하고'),
('나도 그생각 했었는데'),
('관점 차이 같음'),
('일반화는 좀 그런듯'),
('상황마다 다른듯'),
('나는 좀 다른 경험'),
('호불호 갈릴듯'),
-- 후속 질문
('자세히 좀 알려줄수있음?'),
('인스타 dm으로 정보좀'),
('카톡으로 자세히 부탁함'),
('연락처 알려줄수있음??'),
('정보 어디서 얻음'),
('어떻게 알게됨'),
('사진 더 있음?'),
('주소 정확히 어디?'),
('지하철 어디서 내려'),
('네비 검색하면 나옴?'),
('가는길 자세히 알려줘'),
('처음인데 어떻게 가야돼'),
('전화번호 있음?'),
('예약방법 알려줘'),
('영업시간 정확히'),
-- 격려/응원
('힘내요 화이팅'),
('잘되길 응원함'),
('좋은 하루 되세요'),
('재밌게 놀고와요'),
('즐거운 시간 보내요'),
('좋은 추억 만들고와'),
('안전하게 다녀와'),
('잘다녀오시길'),
('재밌으시길'),
('대박나길'),
-- 농담/유머
('또또 그러시네 ㅋㅋ'),
('이거 진짜 어디서 봤는데 ㅋㅋ'),
('각본있는거 아님?? ㅋㅋ'),
('이거 영화임 ㅋㅋ'),
('드라마 같은 일이네 ㅋㅋ'),
('소설써도 되겠다 ㅋㅋ'),
('인생 영화찍고있네 ㅋㅋ'),
('찐 인생사 ㅋㅋ'),
('오늘 명장면 ㅋㅋ'),
('레전드 박제'),
-- 기타 다양화
('단골 인증합니다'),
('매주 가는 사람'),
('매니저랑 친해서 케어받음'),
('친구가 추천해서 가봤음'),
('인스타에서 보고 갔음'),
('블로그 후기 보고 결정'),
('지인 소개로 갔음'),
('회사 동료가 데려가줌'),
('남친이 추천해서'),
('생일선물로 받음'),
('이번주에 또 갈 예정'),
('다음주 예약했음'),
('지난주에 갔다왔음'),
('어제 다녀옴 후기 곧 올림'),
('금요일 가기로 약속함'),
('단골 카드 만들었음'),
('vip 단골임'),
('실장님이 알아봐주심'),
('매니저랑 친함'),
('도우미 분이 친절하셨음')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- ✅ 완료! 9단계 모두 실행됨.
-- ═══════════════════════════════════════════════════════════════
