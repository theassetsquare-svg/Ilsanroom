-- 2026-05-20 v28.0 — CrUX + Real User Monitoring
-- Lab 점수 무시, Google 검색 순위 기준인 CrUX/RUM 실사용자 데이터로 전환

-- ─────────────────────────────────────────────
-- 1. CrUX 일일 수집 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crux_data (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  form_factor TEXT NOT NULL,  -- 'PHONE' | 'DESKTOP' | 'TABLET'
  lcp_p75 INTEGER,
  cls_p75 NUMERIC(6,4),
  inp_p75 INTEGER,
  fcp_p75 INTEGER,
  ttfb_p75 INTEGER,
  lcp_good_pct NUMERIC(5,2),
  cls_good_pct NUMERIC(5,2),
  inp_good_pct NUMERIC(5,2),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crux_url ON crux_data(url);
CREATE INDEX IF NOT EXISTS idx_crux_collected ON crux_data(collected_at DESC);

ALTER TABLE crux_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crux_read_all ON crux_data;
CREATE POLICY crux_read_all ON crux_data FOR SELECT USING (true);
-- INSERT는 service_role만 (anon/authenticated는 정책 없음 → 차단)

-- ─────────────────────────────────────────────
-- 2. RUM (web-vitals) 실시간 수집 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS web_vitals_rum (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,        -- 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'
  value NUMERIC NOT NULL,
  rating TEXT,                       -- 'good' | 'needs-improvement' | 'poor'
  navigation_type TEXT,
  page TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  device_memory INTEGER,
  connection TEXT,                   -- '4g' | '3g' | '2g' | 'slow-2g'
  device TEXT,                       -- 'mobile' | 'desktop'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rum_metric_created ON web_vitals_rum(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rum_page ON web_vitals_rum(page);

ALTER TABLE web_vitals_rum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rum_read_all ON web_vitals_rum;
CREATE POLICY rum_read_all ON web_vitals_rum FOR SELECT USING (true);
-- INSERT는 service_role만 (Pages Function 경유)
