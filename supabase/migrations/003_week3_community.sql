-- ══════════════════════════════════════════════════════════════
-- 3주차: 활성 커뮤니티
-- 기존 reviews/users 테이블 유지 + 새 테이블 추가
-- ══════════════════════════════════════════════════════════════

-- ── 1. 기존 reviews 테이블에 컬럼 추가 ──
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 2. Review Comments (후기 댓글) ──
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review ON review_comments(review_id);

-- ── 3. User Profiles (등급/포인트) ──
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- ── 8. 기존 posts 테이블에 comment_count 컬럼 추가 (없으면) ──
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS venue_slug TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS rating INT;

-- ══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_upvotes ENABLE ROW LEVEL SECURITY;

-- Review Comments
CREATE POLICY "review_comments_read" ON review_comments FOR SELECT USING (true);
CREATE POLICY "review_comments_insert" ON review_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "review_comments_delete" ON review_comments FOR DELETE USING (true);

-- User Profiles
CREATE POLICY "profiles_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (true);

-- Lounge Posts
CREATE POLICY "lounge_posts_read" ON lounge_posts FOR SELECT USING (true);
CREATE POLICY "lounge_posts_insert" ON lounge_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "lounge_posts_update" ON lounge_posts FOR UPDATE USING (true);
CREATE POLICY "lounge_posts_delete" ON lounge_posts FOR DELETE USING (true);

-- Lounge Comments
CREATE POLICY "lounge_comments_read" ON lounge_comments FOR SELECT USING (true);
CREATE POLICY "lounge_comments_insert" ON lounge_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "lounge_comments_delete" ON lounge_comments FOR DELETE USING (true);

-- Notifications
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Review Upvotes
CREATE POLICY "upvotes_read" ON review_upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_insert" ON review_upvotes FOR INSERT WITH CHECK (true);
CREATE POLICY "upvotes_delete" ON review_upvotes FOR DELETE USING (true);
