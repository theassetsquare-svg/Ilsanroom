-- ══════════════════════════════════════════════════════════════
-- 3주차: 활성 커뮤니티 — reviews, comments 확장, user_profiles, notifications
-- ══════════════════════════════════════════════════════════════

-- ── 1. Reviews 테이블 (업소 전용 후기) ──
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  venue_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  visit_date DATE,
  is_anonymous BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  upvote_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- ── 2. Review Comments (후기 댓글) ──
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review ON review_comments(review_id);

-- ── 3. User Profiles (등급/포인트) ──
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE,
  avatar_url TEXT,
  level TEXT DEFAULT 'newbie',
  points INT DEFAULT 0,
  review_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Lounge Posts (카테고리별 라운지 게시판) ──
CREATE TABLE IF NOT EXISTS lounge_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lounge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  view_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lounge_type ON lounge_posts(lounge_type);
CREATE INDEX IF NOT EXISTS idx_lounge_created ON lounge_posts(created_at DESC);

-- ── 5. Lounge Comments ──
CREATE TABLE IF NOT EXISTS lounge_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES lounge_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES lounge_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lounge_comments_post ON lounge_comments(post_id);

-- ── 6. Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ── 7. Review Upvotes (중복 방지) ──
CREATE TABLE IF NOT EXISTS review_upvotes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- ── 8. Post Images 테이블 (리뷰/라운지 공용) ──
-- images 컬럼에 TEXT[]로 저장하므로 별도 테이블 불필요

-- ══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_upvotes ENABLE ROW LEVEL SECURITY;

-- Reviews: 누구나 읽기, 본인만 쓰기/수정
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Review Comments
CREATE POLICY "review_comments_read" ON review_comments FOR SELECT USING (true);
CREATE POLICY "review_comments_insert" ON review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_comments_delete" ON review_comments FOR DELETE USING (auth.uid() = user_id);

-- User Profiles
CREATE POLICY "profiles_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Lounge Posts
CREATE POLICY "lounge_posts_read" ON lounge_posts FOR SELECT USING (true);
CREATE POLICY "lounge_posts_insert" ON lounge_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lounge_posts_update" ON lounge_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lounge_posts_delete" ON lounge_posts FOR DELETE USING (auth.uid() = user_id);

-- Lounge Comments
CREATE POLICY "lounge_comments_read" ON lounge_comments FOR SELECT USING (true);
CREATE POLICY "lounge_comments_insert" ON lounge_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lounge_comments_delete" ON lounge_comments FOR DELETE USING (auth.uid() = user_id);

-- Notifications: 본인만 조회/업데이트
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Review Upvotes
CREATE POLICY "upvotes_read" ON review_upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_insert" ON review_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upvotes_delete" ON review_upvotes FOR DELETE USING (auth.uid() = user_id);
