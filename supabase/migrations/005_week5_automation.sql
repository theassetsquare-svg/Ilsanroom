-- =============================================
-- 5주차: 24시간 자동화 테이블 + pg_cron
-- =============================================

-- 1. 일일 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  new_reviews INT DEFAULT 0,
  new_posts INT DEFAULT 0,
  new_users INT DEFAULT 0,
  top_venues JSONB DEFAULT '[]'::jsonb,
  top_users JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인기 캐시 테이블
CREATE TABLE IF NOT EXISTS popular_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE, -- 'realtime', 'lunch', 'evening'
  venues JSONB DEFAULT '[]'::jsonb,
  posts JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 모니터링 로그 테이블
CREATE TABLE IF NOT EXISTS monitoring_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL, -- 'health', 'cron', 'error'
  status TEXT NOT NULL, -- 'ok', 'degraded', 'down'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. venues 테이블에 daily_view_count 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'venues' AND column_name = 'daily_view_count'
  ) THEN
    ALTER TABLE venues ADD COLUMN daily_view_count INT DEFAULT 0;
  END IF;
END $$;

-- 5. user_profiles 테이블에 level/points 컬럼 보장
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'points'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN points INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN level TEXT DEFAULT 'newbie';
  END IF;
END $$;

-- RLS 정책
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_log ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 (통계는 공개)
CREATE POLICY IF NOT EXISTS "daily_stats_read" ON daily_stats
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "popular_cache_read" ON popular_cache
  FOR SELECT USING (true);

-- 쓰기: service_role만 (Cron Worker가 사용)
CREATE POLICY IF NOT EXISTS "daily_stats_insert_service" ON daily_stats
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "popular_cache_all_service" ON popular_cache
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "monitoring_log_all_service" ON monitoring_log
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- pg_cron 설정 (Supabase Dashboard > SQL Editor에서 실행)
-- =============================================

-- pg_cron 확장 활성화 (Supabase Pro 플랜에서 사용 가능)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매일 KST 00:00 (UTC 15:00) - 인기 점수 재계산
-- SELECT cron.schedule(
--   'daily-popularity-score',
--   '0 15 * * *',
--   $$
--   UPDATE venues SET
--     rating = COALESCE(
--       (SELECT AVG(rating) FROM reviews WHERE venue_id = venues.id AND rating > 0),
--       venues.rating
--     ),
--     review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = venues.id);
--   $$
-- );

-- 매주 일요일 KST 00:00 - 등급 자동 갱신
-- SELECT cron.schedule(
--   'weekly-level-update',
--   '0 15 * * 0',
--   $$
--   UPDATE user_profiles SET
--     level = CASE
--       WHEN points >= 1000 THEN 'vip'
--       WHEN points >= 300 THEN 'regular'
--       WHEN points >= 50 THEN 'member'
--       ELSE 'newbie'
--     END
--   WHERE level IS DISTINCT FROM (
--     CASE
--       WHEN points >= 1000 THEN 'vip'
--       WHEN points >= 300 THEN 'regular'
--       WHEN points >= 50 THEN 'member'
--       ELSE 'newbie'
--     END
--   );
--   $$
-- );

-- 매일 KST 01:00 (UTC 16:00) - 오래된 데이터 정리
-- SELECT cron.schedule(
--   'daily-cleanup',
--   '0 16 * * *',
--   $$
--   DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
--   DELETE FROM reports WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '90 days';
--   DELETE FROM monitoring_log WHERE created_at < NOW() - INTERVAL '7 days';
--   $$
-- );

-- 매일 KST 06:00 (UTC 21:00) - 일일 조회수 리셋
-- SELECT cron.schedule(
--   'daily-view-reset',
--   '0 21 * * *',
--   $$
--   UPDATE venues SET daily_view_count = 0 WHERE daily_view_count > 0;
--   $$
-- );
