-- =============================================
-- venue_reports / reporter_trust admin RLS 근본수정
-- 원인: 20260523 정책이 auth.users 테이블을 직접 참조
--   → authenticated 롤은 auth.users SELECT 권한이 없어
--     "permission denied for table users" (42501) → admin 업소신고 탭 항상 403.
-- 수정: 기존 SECURITY DEFINER public.is_admin() (이메일 화이트리스트,
--   다른 admin 테이블 전부 이 함수 사용)으로 정책 교체. 코드 변경 0.
-- =============================================

DROP POLICY IF EXISTS venue_reports_admin_read ON venue_reports;
CREATE POLICY venue_reports_admin_read ON venue_reports FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS venue_reports_admin_update ON venue_reports;
CREATE POLICY venue_reports_admin_update ON venue_reports FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS reporter_trust_admin_read ON reporter_trust;
CREATE POLICY reporter_trust_admin_read ON reporter_trust FOR SELECT TO authenticated
  USING (public.is_admin());
