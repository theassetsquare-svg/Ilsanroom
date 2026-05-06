-- 단계 3: 미디어 라이브러리
-- /admin/media 그리드 페이지에서 사용. service_role 경유로 storage 업로드 후 메타 기록.

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL DEFAULT 'post-media',
  path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  alt_text TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_created ON public.media_library (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON public.media_library (uploaded_by);

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- public.is_admin() 함수는 단계 1에서 이미 생성됨 (admin_rls_phase1_venues.sql)
DROP POLICY IF EXISTS media_admin_select ON public.media_library;
CREATE POLICY media_admin_select ON public.media_library
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS media_admin_insert ON public.media_library;
CREATE POLICY media_admin_insert ON public.media_library
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS media_admin_update ON public.media_library;
CREATE POLICY media_admin_update ON public.media_library
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS media_admin_delete ON public.media_library;
CREATE POLICY media_admin_delete ON public.media_library
  FOR DELETE TO authenticated
  USING (public.is_admin());
