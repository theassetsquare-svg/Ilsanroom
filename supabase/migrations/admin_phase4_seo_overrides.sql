-- 단계 4: 페이지별 SEO 메타 오버라이드
-- 관리자가 코드 수정 없이 특정 URL의 title/description/og:image/canonical/robots를 덮어쓸 수 있다.

CREATE TABLE IF NOT EXISTS public.seo_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,           -- 예: '/', '/clubs', '/lounges/garosu', '/magazine/seoul-night'
  title TEXT,                          -- null이면 페이지 기본값 사용
  description TEXT,
  og_image TEXT,
  canonical TEXT,                      -- 절대 URL
  robots TEXT,                         -- 'index,follow' 'noindex,nofollow' 등
  enabled BOOLEAN DEFAULT true,
  note TEXT,                           -- 관리 메모 (왜 덮어쓰는지)
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_path ON public.seo_overrides (path);
CREATE INDEX IF NOT EXISTS idx_seo_enabled ON public.seo_overrides (enabled) WHERE enabled = true;

ALTER TABLE public.seo_overrides ENABLE ROW LEVEL SECURITY;

-- public SELECT: enabled만 (사이트 모든 방문자가 읽어야 적용됨)
DROP POLICY IF EXISTS seo_public_select ON public.seo_overrides;
CREATE POLICY seo_public_select ON public.seo_overrides
  FOR SELECT TO anon, authenticated
  USING (enabled = true);

-- admin: 전체 권한
DROP POLICY IF EXISTS seo_admin_all_select ON public.seo_overrides;
CREATE POLICY seo_admin_all_select ON public.seo_overrides
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS seo_admin_insert ON public.seo_overrides;
CREATE POLICY seo_admin_insert ON public.seo_overrides
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS seo_admin_update ON public.seo_overrides;
CREATE POLICY seo_admin_update ON public.seo_overrides
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS seo_admin_delete ON public.seo_overrides;
CREATE POLICY seo_admin_delete ON public.seo_overrides
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.touch_seo_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seo_overrides_updated ON public.seo_overrides;
CREATE TRIGGER trg_seo_overrides_updated
  BEFORE UPDATE ON public.seo_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_seo_overrides_updated_at();
