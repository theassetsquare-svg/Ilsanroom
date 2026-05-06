-- 단계 6: 모더레이션 (신고 큐 + 컨텐츠 숨김 + 유저 ban)
-- 4주차에 만든 reports/posts.is_hidden/comments.is_hidden은 이미 존재.
-- 여기서는 admin RLS와 is_banned 컬럼만 추가.

-- 1) user_profiles에 ban 관련 컬럼
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_banned') THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_banned BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='banned_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN banned_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='ban_reason') THEN
    ALTER TABLE public.user_profiles ADD COLUMN ban_reason TEXT;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_banned ON public.user_profiles (is_banned) WHERE is_banned = true;

-- 2) admin RLS (public.is_admin()는 단계 1에서 생성됨)
DROP POLICY IF EXISTS reports_admin_select ON public.reports;
CREATE POLICY reports_admin_select ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS reports_admin_update ON public.reports;
CREATE POLICY reports_admin_update ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS reports_admin_delete ON public.reports;
CREATE POLICY reports_admin_delete ON public.reports
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS posts_admin_update ON public.posts;
CREATE POLICY posts_admin_update ON public.posts
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS posts_admin_delete ON public.posts;
CREATE POLICY posts_admin_delete ON public.posts
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS comments_admin_update ON public.comments;
CREATE POLICY comments_admin_update ON public.comments
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS comments_admin_delete ON public.comments;
CREATE POLICY comments_admin_delete ON public.comments
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS user_profiles_admin_select ON public.user_profiles;
CREATE POLICY user_profiles_admin_select ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS user_profiles_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_admin_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- 3) ban된 유저는 새 글/댓글 작성 불가
CREATE OR REPLACE FUNCTION public.user_is_banned(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM user_profiles WHERE user_id = uid), false);
$$;
