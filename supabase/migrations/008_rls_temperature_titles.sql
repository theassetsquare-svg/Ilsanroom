-- ═══════════════════════════════════════════════════════
-- 008 — 온도/칭호/시즌 RLS 정책 (anon SELECT 허용)
-- ═══════════════════════════════════════════════════════
-- 문제: 000_ALL_IN_ONE.sql에 RLS 정책 없음 → anon 키가 차단됨
-- 결과: /profile 페이지에서 칭호/미션 못 읽음 (publishable 키 사용)
-- 해결: 마스터 테이블 = anon SELECT 허용, 유저 테이블 = 본인 행만
-- ═══════════════════════════════════════════════════════

-- ── 1. 마스터 테이블 (모든 사용자가 읽기 가능) ──
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "titles_anon_read" ON titles;
CREATE POLICY "titles_anon_read" ON titles FOR SELECT USING (true);

DROP POLICY IF EXISTS "season_missions_anon_read" ON season_missions;
CREATE POLICY "season_missions_anon_read" ON season_missions FOR SELECT USING (true);

-- ── 2. 사용자 보유 테이블 (본인 행만 + 모든 사용자 SELECT 허용 — 랭킹용) ──
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_season_progress ENABLE ROW LEVEL SECURITY;

-- user_titles: 누구나 읽을 수 있게 (다른 유저 칭호도 보여줘야 함 — 프로필 공개)
DROP POLICY IF EXISTS "user_titles_anon_read" ON user_titles;
CREATE POLICY "user_titles_anon_read" ON user_titles FOR SELECT USING (true);

-- user_season_progress: 본인만 읽기 (개인 진행도)
DROP POLICY IF EXISTS "user_season_progress_self_read" ON user_season_progress;
CREATE POLICY "user_season_progress_self_read" ON user_season_progress
  FOR SELECT USING (auth.uid() = user_id);

-- ── 3. 온도 히스토리 / 출석 / 활동 통계 ──
ALTER TABLE temperature_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "temperature_history_self_read" ON temperature_history;
CREATE POLICY "temperature_history_self_read" ON temperature_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_attendance_self_read" ON user_attendance;
CREATE POLICY "user_attendance_self_read" ON user_attendance
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_activity_stats_self_read" ON daily_activity_stats;
CREATE POLICY "daily_activity_stats_self_read" ON daily_activity_stats
  FOR SELECT USING (auth.uid() = user_id);

-- ── 4. user_profiles temperature 노출 (랭킹용 — 이미 정책 있을 가능성, 충돌 방지) ──
-- user_profiles는 기존에 RLS 있으므로 추가 정책만
DROP POLICY IF EXISTS "user_profiles_temp_anon_read" ON user_profiles;
CREATE POLICY "user_profiles_temp_anon_read" ON user_profiles FOR SELECT USING (true);

-- ── 5. RPC 함수는 SECURITY DEFINER이므로 별도 권한 부여 불필요
--     (이미 000 마이그레이션에서 SECURITY DEFINER로 선언됨)

-- ═══════════════════════════════════════════════════════
-- 검증 쿼리 (실행 후 확인용)
-- ═══════════════════════════════════════════════════════
-- 아래는 주석. Supabase SQL Editor에서 직접 실행하면 결과 보임:
--   SELECT count(*) FROM titles;            -- 15
--   SELECT count(*) FROM season_missions;   -- 10
