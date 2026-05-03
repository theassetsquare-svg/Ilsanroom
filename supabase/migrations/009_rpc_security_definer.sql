-- ═══════════════════════════════════════════════════════
-- 009 — RPC 함수 SECURITY DEFINER 전환
-- ═══════════════════════════════════════════════════════
-- 문제: 000의 RPC 6개가 SECURITY INVOKER(기본값) → 호출자 권한으로 RLS 검사
--       → user_attendance INSERT/user_profiles UPDATE 시 정책 위반으로 실패
-- 해결: SECURITY DEFINER로 전환 (함수 소유자=postgres 권한으로 RLS 우회)
--       + search_path 고정 (보안)
-- ═══════════════════════════════════════════════════════

ALTER FUNCTION add_temperature(UUID, NUMERIC, TEXT) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION mark_attendance(UUID) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION reward_activity(UUID, TEXT) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION update_season_progress(UUID, TEXT) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION check_and_unlock_titles(UUID) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION decay_inactive_users() SECURITY DEFINER SET search_path = public;

-- 권한: authenticated 롤이 호출 가능하도록 (anon은 호출 X — 본인 데이터 변경)
GRANT EXECUTE ON FUNCTION add_temperature(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_attendance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reward_activity(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_season_progress(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_unlock_titles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decay_inactive_users() TO service_role;
