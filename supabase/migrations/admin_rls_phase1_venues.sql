-- =============================================
-- Admin RLS Phase 1: venues 풀에디터 권한
-- is_admin() 함수 + venues INSERT/UPDATE/DELETE 정책
-- 어드민 이메일: qotjsdnr123@naver.com
-- =============================================

-- 어드민 판별 함수: auth.email()이 화이트리스트에 있으면 true
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') IN (
    'qotjsdnr123@naver.com',
    'theassetsquare@gmail.com'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- venues 어드민 정책: INSERT / UPDATE / DELETE 모두 admin 통과
DROP POLICY IF EXISTS "venues_admin_insert" ON venues;
CREATE POLICY "venues_admin_insert" ON venues
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "venues_admin_update" ON venues;
CREATE POLICY "venues_admin_update" ON venues
  FOR UPDATE USING (public.is_admin() OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "venues_admin_delete" ON venues;
CREATE POLICY "venues_admin_delete" ON venues
  FOR DELETE USING (public.is_admin());
