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
