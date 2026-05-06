-- 단계 5: 정적 페이지 블록 에디터
-- 페이지별 텍스트/HTML 블록을 (page_key, block_key) 키로 저장.
-- 코드에서 usePageBlock('home','hero_h1','기본값')으로 사용.

CREATE TABLE IF NOT EXISTS public.page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,           -- 'home', 'clubs', 'lounges' 등
  block_key TEXT NOT NULL,          -- 'hero_h1', 'hero_subtitle', 'cta_text' 등
  value TEXT NOT NULL DEFAULT '',   -- 텍스트 또는 HTML
  is_html BOOLEAN DEFAULT false,    -- true면 dangerouslySetInnerHTML로 렌더 (관리자 전용 책임)
  enabled BOOLEAN DEFAULT true,
  note TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (page_key, block_key)
);

CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON public.page_blocks (page_key);
CREATE INDEX IF NOT EXISTS idx_page_blocks_enabled ON public.page_blocks (enabled) WHERE enabled = true;

ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS page_blocks_public_select ON public.page_blocks;
CREATE POLICY page_blocks_public_select ON public.page_blocks
  FOR SELECT TO anon, authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS page_blocks_admin_select ON public.page_blocks;
CREATE POLICY page_blocks_admin_select ON public.page_blocks
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS page_blocks_admin_insert ON public.page_blocks;
CREATE POLICY page_blocks_admin_insert ON public.page_blocks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS page_blocks_admin_update ON public.page_blocks;
CREATE POLICY page_blocks_admin_update ON public.page_blocks
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS page_blocks_admin_delete ON public.page_blocks;
CREATE POLICY page_blocks_admin_delete ON public.page_blocks
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_page_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_blocks_updated ON public.page_blocks;
CREATE TRIGGER trg_page_blocks_updated
  BEFORE UPDATE ON public.page_blocks
  FOR EACH ROW EXECUTE FUNCTION public.touch_page_blocks_updated_at();
