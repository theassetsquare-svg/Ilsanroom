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
