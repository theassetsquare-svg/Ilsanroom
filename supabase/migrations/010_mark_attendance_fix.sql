-- ═══════════════════════════════════════════════════════
-- 010 — mark_attendance 신규회원 첫 호출 버그 수정
-- ═══════════════════════════════════════════════════════
-- 문제: 신규회원 마이페이지 첫 진입 시 mark_attendance 호출
--       → user_profiles row 없음 → UPDATE 실패 → v_streak NULL
--       → add_temperature reason='출석체크 streak=' || NULL = NULL
--       → temperature_history.reason NOT NULL 위반
-- 해결: 함수 시작에 user_profiles row 보장 (UPSERT) + COALESCE 가드
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_attendance(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  -- 신규회원: user_profiles row 보장
  INSERT INTO user_profiles (user_id, temperature, points, level, streak_days)
  VALUES (p_user_id, 36.5, 0, 'newbie', 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 오늘 이미 체크됐으면 스킵
  SELECT EXISTS(SELECT 1 FROM user_attendance WHERE user_id = p_user_id AND attendance_date = v_today)
  INTO v_already_today;

  IF v_already_today THEN
    SELECT temperature, streak_days INTO v_new_temp, v_streak
    FROM user_profiles WHERE user_id = p_user_id;
    RETURN json_build_object('already_today', true, 'streak', COALESCE(v_streak, 1), 'temperature', v_new_temp);
  END IF;

  -- 어제 출석했는지 확인 (스트릭 유지 여부)
  SELECT EXISTS(SELECT 1 FROM user_attendance WHERE user_id = p_user_id AND attendance_date = v_yesterday)
  INTO v_was_yesterday;

  -- 오늘 출석 기록
  INSERT INTO user_attendance (user_id, attendance_date) VALUES (p_user_id, v_today)
  ON CONFLICT DO NOTHING;

  -- 스트릭 갱신 (row 보장됨, NULL 가드)
  IF v_was_yesterday THEN
    UPDATE user_profiles
    SET streak_days = COALESCE(streak_days, 0) + 1, last_active_date = v_today
    WHERE user_id = p_user_id
    RETURNING streak_days INTO v_streak;
  ELSE
    UPDATE user_profiles
    SET streak_days = 1, last_active_date = v_today
    WHERE user_id = p_user_id
    RETURNING streak_days INTO v_streak;
  END IF;

  v_streak := COALESCE(v_streak, 1);

  -- 출석 보너스 +0.1
  v_bonus := 0.1;
  IF v_streak = 7 THEN v_bonus := v_bonus + 0.5; END IF;
  IF v_streak = 30 THEN v_bonus := v_bonus + 2.0; END IF;

  v_new_temp := add_temperature(p_user_id, v_bonus, '출석체크 streak=' || v_streak);

  RETURN json_build_object(
    'streak', v_streak,
    'bonus', v_bonus,
    'temperature', v_new_temp
  );
END;
$$;

GRANT EXECUTE ON FUNCTION mark_attendance(UUID) TO authenticated;
