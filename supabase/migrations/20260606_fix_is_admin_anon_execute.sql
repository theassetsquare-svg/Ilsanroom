-- 2026-06-06: magazine_articles 공개 SELECT 401 근본수정.
-- 증상: 라이브 anon이 /magazine/* 진입 시 magazine_articles?is_published=eq.true 호출 →
--       401 {"code":"42501","message":"permission denied for function is_admin"}.
-- 근본원인: magazine_select_published 정책 = USING (is_published = true OR public.is_admin()).
--           anon이 SELECT 시 RLS qual 안의 is_admin()을 평가해야 하는데 현재 라이브에서
--           anon이 is_admin()에 EXECUTE 권한이 없어 함수 호출 자체가 42501로 중단 → 전체 쿼리 실패.
--           (admin_rls_phase1_venues.sql:19에서 grant 의도했으나 라이브 상태에서 유실됨.
--            curl 검증: venues/posts/comments/user_profiles는 SELECT 정책이 is_admin 미참조 → 200,
--            magazine_articles만 401.)
-- 해결: is_admin()에 anon·authenticated EXECUTE 재부여(설계 의도 복원, 멱등).
--       is_admin()은 auth.jwt()->>'email'만 읽는 STABLE SECURITY DEFINER 함수로 테이블 접근 0,
--       anon에게는 항상 false 반환 → 권한 부여가 데이터 노출을 일으키지 않음.
--       이로써 silencer/폴백 의존 없이 anon이 published 매거진을 정상 조회.

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 검증 로그
DO $$
DECLARE has_anon BOOLEAN;
BEGIN
  SELECT has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') INTO has_anon;
  RAISE NOTICE '[fix_is_admin_anon] anon EXECUTE is_admin = %', has_anon;
END $$;
