-- =============================================
-- v28: 매거진 예약 발행 큐
-- - scheduled_for 컬럼 추가 (사람이 쓴 글의 예약 발행 시각)
-- - scripts/magazine/promote-scheduled.mjs 가 KST 12/22/02시 cron으로
--   scheduled_for <= now() AND is_published = false 항목을 is_published = true 로 promote
-- - AI 자동 본문 생성은 하지 않음 (CLAUDE.md "No AI text" + feedback_no_ai_human_only)
-- =============================================

ALTER TABLE magazine_articles
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_magazine_scheduled_for
  ON magazine_articles(scheduled_for)
  WHERE is_published = false AND scheduled_for IS NOT NULL;

-- 기존 정책 유지. is_published = false 인 글은 admin만 볼 수 있음.
-- promote-scheduled.mjs 는 service_role 키로 RLS 우회.
