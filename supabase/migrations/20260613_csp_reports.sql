-- ============================================================
-- 2026-06-13 CSP Report-Only 위반 수집 테이블
-- ============================================================
-- CSP script-src 정식 강제 전환 전, 며칠간 실방문자 위반을 누적해
-- "위반 0" 객관 판정을 가능하게 한다.
--   · INSERT = service_role(Pages Function /api/csp-report)만 (RLS 우회)
--   · SELECT = 관리자(is_admin)만
--   · anon/authenticated = INSERT/SELECT 정책 없음 → 전면 차단
--   · UNIQUE(directive, host, path) + 함수측 merge-duplicates → 유니크 위반 1행만 (무한증식 방지)
--   · blocked_host/document_path만 저장(쿼리스트링·PII 미저장)
-- 자동 마이그레이션(scripts/migrate.mjs)으로 push 시 적용. 멱등.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.csp_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_directive text        NOT NULL DEFAULT '',
  blocked_host        text        NOT NULL DEFAULT '',
  document_path       text        NOT NULL DEFAULT '',
  last_seen           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT csp_reports_uniq UNIQUE (effective_directive, blocked_host, document_path)
);

ALTER TABLE public.csp_reports ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회. INSERT 정책은 의도적으로 없음 → service_role만 기록.
DROP POLICY IF EXISTS "csp_reports_admin_read" ON public.csp_reports;
CREATE POLICY "csp_reports_admin_read" ON public.csp_reports
  FOR SELECT USING (public.is_admin());
