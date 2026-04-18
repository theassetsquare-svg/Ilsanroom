-- ============================================================
-- 찜(Favorites) 테이블 — 로그인 유저용
-- Supabase SQL Editor에서 실행
-- 비로그인 유저는 기존 localStorage 유지 (하이브리드)
-- ============================================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, venue_slug)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_venue_slug ON user_favorites(venue_slug);

-- RLS 활성화
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 본인 찜만 조회/추가/삭제 가능
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 사용법 (프론트엔드)
-- ============================================================
-- 찜 추가: INSERT INTO user_favorites (user_id, venue_slug) VALUES (auth.uid(), 'gangnamclub-race')
-- 찜 삭제: DELETE FROM user_favorites WHERE user_id = auth.uid() AND venue_slug = 'gangnamclub-race'
-- 내 찜 목록: SELECT venue_slug FROM user_favorites WHERE user_id = auth.uid() ORDER BY created_at DESC
-- 업소별 찜 수: SELECT venue_slug, COUNT(*) as cnt FROM user_favorites GROUP BY venue_slug ORDER BY cnt DESC
