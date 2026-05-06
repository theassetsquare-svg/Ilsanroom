-- =============================================
-- Admin RLS Phase 2: 매거진 articles 테이블 + 권한
-- /admin/magazine 풀에디터용
-- =============================================

CREATE TABLE IF NOT EXISTS magazine_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  is_published BOOLEAN DEFAULT true,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magazine_published ON magazine_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_magazine_date ON magazine_articles(date DESC);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_magazine_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_magazine_updated_at ON magazine_articles;
CREATE TRIGGER trg_magazine_updated_at
  BEFORE UPDATE ON magazine_articles
  FOR EACH ROW EXECUTE FUNCTION update_magazine_updated_at();

-- RLS
ALTER TABLE magazine_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "magazine_select_published" ON magazine_articles;
CREATE POLICY "magazine_select_published" ON magazine_articles
  FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "magazine_admin_insert" ON magazine_articles;
CREATE POLICY "magazine_admin_insert" ON magazine_articles
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "magazine_admin_update" ON magazine_articles;
CREATE POLICY "magazine_admin_update" ON magazine_articles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "magazine_admin_delete" ON magazine_articles;
CREATE POLICY "magazine_admin_delete" ON magazine_articles
  FOR DELETE USING (public.is_admin());
