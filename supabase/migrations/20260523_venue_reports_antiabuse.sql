-- 시즌64 — 폐업/오정보 신고 시스템 (anti-abuse 8중 방어)
-- 2026-05-23
--
-- 경쟁업소 거짓 신고 차단을 위한 다층 방어:
--   1. Rate limit (IP/fingerprint × 1일 3건)
--   2. Cooldown (같은 venue × 같은 reporter 7일 1회)
--   3. Evidence 필수 (URL 빈 신고 reject)
--   4. Threshold (서로 다른 reporter 3+ 일치할 때만 admin 알림)
--   5. Admin 승인 필수 (자동 status 변경 X)
--   6. Rebuttal 48h (venue 항변 기간)
--   7. Reporter trust score (정확 +1 / 거짓 -3 / <-5 shadowban)
--   8. Honeypot + Turnstile (Pages Function 레이어)

-- ── 신고 테이블 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venue_reports (
  id           BIGSERIAL PRIMARY KEY,
  venue_slug   TEXT NOT NULL,
  reason       TEXT NOT NULL CHECK (reason IN ('closed', 'wrong_info', 'duplicate', 'scam', 'other')),
  evidence_url TEXT NOT NULL CHECK (length(evidence_url) >= 10),
  memo         TEXT,
  reporter_ip          TEXT NOT NULL,
  reporter_fingerprint TEXT NOT NULL,
  reporter_user_id     UUID,
  status       TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'verified', 'rejected', 'rebutted', 'shadowbanned')),
  admin_note   TEXT,
  rebuttal_text     TEXT,
  rebuttal_deadline TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_venue_reports_slug    ON venue_reports(venue_slug);
CREATE INDEX IF NOT EXISTS idx_venue_reports_status  ON venue_reports(status);
CREATE INDEX IF NOT EXISTS idx_venue_reports_created ON venue_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_reports_ip      ON venue_reports(reporter_ip);
CREATE INDEX IF NOT EXISTS idx_venue_reports_fp      ON venue_reports(reporter_fingerprint);

-- ── Reporter trust score ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reporter_trust (
  fingerprint  TEXT PRIMARY KEY,
  score        INT NOT NULL DEFAULT 0,
  total_reports INT NOT NULL DEFAULT 0,
  verified_reports INT NOT NULL DEFAULT 0,
  rejected_reports INT NOT NULL DEFAULT 0,
  shadowbanned BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reporter_trust_score   ON reporter_trust(score);
CREATE INDEX IF NOT EXISTS idx_reporter_trust_shadow  ON reporter_trust(shadowbanned);

-- ── Threshold-도달 venue 집계 view ─────────────────────────────
-- threshold 3 도달 = pending 상태 + 서로 다른 fingerprint 3+ 신고
CREATE OR REPLACE VIEW venue_report_threshold AS
SELECT
  venue_slug,
  reason,
  COUNT(DISTINCT reporter_fingerprint) AS unique_reporters,
  COUNT(*)                              AS total_reports,
  MIN(created_at)                       AS first_reported,
  MAX(created_at)                       AS last_reported
FROM venue_reports
WHERE status = 'pending'
GROUP BY venue_slug, reason
HAVING COUNT(DISTINCT reporter_fingerprint) >= 3;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE venue_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporter_trust  ENABLE ROW LEVEL SECURITY;

-- 익명 insert 금지 (Pages Function service_role 경유만)
DROP POLICY IF EXISTS venue_reports_no_anon_insert ON venue_reports;
CREATE POLICY venue_reports_no_anon_insert ON venue_reports FOR INSERT TO anon WITH CHECK (false);

-- admin (is_admin claim) read-all
DROP POLICY IF EXISTS venue_reports_admin_read ON venue_reports;
CREATE POLICY venue_reports_admin_read ON venue_reports FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin')::boolean = true
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_app_meta_data ->> 'role' = 'admin')
  );

-- admin update (승인/반려)
DROP POLICY IF EXISTS venue_reports_admin_update ON venue_reports;
CREATE POLICY venue_reports_admin_update ON venue_reports FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin')::boolean = true
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_app_meta_data ->> 'role' = 'admin')
  );

-- reporter_trust: anon read X, admin read O
DROP POLICY IF EXISTS reporter_trust_no_anon ON reporter_trust;
CREATE POLICY reporter_trust_no_anon ON reporter_trust FOR SELECT TO anon USING (false);

DROP POLICY IF EXISTS reporter_trust_admin_read ON reporter_trust;
CREATE POLICY reporter_trust_admin_read ON reporter_trust FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin')::boolean = true
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_app_meta_data ->> 'role' = 'admin')
  );

-- ── Trust score 자동 갱신 트리거 ───────────────────────────────
-- venue_reports.status가 'verified'/'rejected'로 바뀌면 reporter_trust 점수 갱신
CREATE OR REPLACE FUNCTION fn_update_reporter_trust()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
    INSERT INTO reporter_trust(fingerprint, score, total_reports, verified_reports)
      VALUES (NEW.reporter_fingerprint, 1, 1, 1)
      ON CONFLICT (fingerprint) DO UPDATE
        SET score = reporter_trust.score + 1,
            verified_reports = reporter_trust.verified_reports + 1,
            last_seen = now();
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO reporter_trust(fingerprint, score, total_reports, rejected_reports)
      VALUES (NEW.reporter_fingerprint, -3, 1, 1)
      ON CONFLICT (fingerprint) DO UPDATE
        SET score = reporter_trust.score - 3,
            rejected_reports = reporter_trust.rejected_reports + 1,
            shadowbanned = (reporter_trust.score - 3) <= -5,
            last_seen = now();
  END IF;
  NEW.resolved_at = COALESCE(NEW.resolved_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_reporter_trust ON venue_reports;
CREATE TRIGGER trg_update_reporter_trust
  AFTER UPDATE OF status ON venue_reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_reporter_trust();
