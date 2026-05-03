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
