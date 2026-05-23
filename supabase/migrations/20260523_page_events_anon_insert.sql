-- ============================================================
-- 2026-05-23 page_events anon INSERT RLS 재보장
-- ============================================================
-- 진단(라이브 curl): page_events INSERT → HTTP 401, code 42501
--   "new row violates row-level security policy for table page_events"
-- 원인: anon INSERT 정책이 어느 시점에 drop됨 (RLS는 enabled, policy 없음)
-- 해결: idempotent하게 정책 재생성 + 트리거(block_admin) 보존 확인
-- ============================================================

-- RLS 보장
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- 1) anon + authenticated 모두 INSERT 허용 (방문자 분석 = 익명 기록)
--    서버측 page_events_block_admin 트리거가 관리자/봇 row를 BEFORE INSERT에서 null 리턴으로 제거함
DROP POLICY IF EXISTS "anyone can insert events" ON public.page_events;
DROP POLICY IF EXISTS "page_events_anon_insert" ON public.page_events;
CREATE POLICY "page_events_anon_insert"
  ON public.page_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2) SELECT는 admin만 (이미 보안 베이스라인에 있을 수 있음 — idempotent)
DROP POLICY IF EXISTS "authenticated can read events" ON public.page_events;
DROP POLICY IF EXISTS "page_events_admin_read" ON public.page_events;
CREATE POLICY "page_events_admin_read"
  ON public.page_events
  FOR SELECT
  USING (public.is_admin());

-- 3) DELETE는 admin만 (기존 page_events_admin_delete.sql과 일치)
DROP POLICY IF EXISTS "admin can delete events" ON public.page_events;
DROP POLICY IF EXISTS "page_events_admin_delete" ON public.page_events;
CREATE POLICY "page_events_admin_delete"
  ON public.page_events
  FOR DELETE
  USING (public.is_admin());

-- 4) 트리거 존재 확인 (없으면 재생성) — 관리자/봇 차단 서버측 방어막
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_page_events_block_admin'
      AND tgrelid = 'public.page_events'::regclass
  ) THEN
    -- 트리거 함수는 page_events_block_admin.sql에서 이미 생성됨
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'page_events_block_admin') THEN
      CREATE TRIGGER trg_page_events_block_admin
        BEFORE INSERT ON public.page_events
        FOR EACH ROW
        EXECUTE FUNCTION public.page_events_block_admin();
    END IF;
  END IF;
END $$;
