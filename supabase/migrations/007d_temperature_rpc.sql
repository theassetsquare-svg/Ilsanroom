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
