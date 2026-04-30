-- 4주차: 자동 차단 + 신고 시스템
-- filter_words: 욕설/스팸 키워드 DB
CREATE TABLE IF NOT EXISTS filter_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('profanity', 'spam', 'ad')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  action TEXT DEFAULT 'mask' CHECK (action IN ('mask', 'block', 'review')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- reports: 신고 시스템
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('profanity', 'spam', 'false_info', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 신고 중복 방지 (같은 유저가 같은 대상 중복 신고 X)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique ON reports(reporter_id, target_type, target_id);

-- 신고 수 빠른 조회
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- posts에 moderation 컬럼 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_hidden') THEN
    ALTER TABLE posts ADD COLUMN is_hidden BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='report_count') THEN
    ALTER TABLE posts ADD COLUMN report_count INT DEFAULT 0;
  END IF;
END$$;

-- comments에도 동일
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='is_hidden') THEN
    ALTER TABLE comments ADD COLUMN is_hidden BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='report_count') THEN
    ALTER TABLE comments ADD COLUMN report_count INT DEFAULT 0;
  END IF;
END$$;

-- 신고 3개 이상이면 자동 숨김하는 함수
CREATE OR REPLACE FUNCTION auto_hide_on_report()
RETURNS TRIGGER AS $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM reports
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

  IF NEW.target_type = 'post' THEN
    UPDATE posts SET report_count = cnt WHERE id = NEW.target_id;
    IF cnt >= 3 THEN
      UPDATE posts SET is_hidden = true WHERE id = NEW.target_id;
    END IF;
  ELSIF NEW.target_type = 'comment' THEN
    UPDATE comments SET report_count = cnt WHERE id = NEW.target_id;
    IF cnt >= 3 THEN
      UPDATE comments SET is_hidden = true WHERE id = NEW.target_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 (이미 있으면 교체)
DROP TRIGGER IF EXISTS trg_auto_hide ON reports;
CREATE TRIGGER trg_auto_hide
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION auto_hide_on_report();

-- RLS
ALTER TABLE filter_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- filter_words: 누구나 읽기 가능
CREATE POLICY IF NOT EXISTS "filter_words_read" ON filter_words FOR SELECT USING (true);

-- reports: 로그인 유저가 자기 신고 생성, 관리자만 전체 조회
CREATE POLICY IF NOT EXISTS "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY IF NOT EXISTS "reports_read_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- 기본 욕설 키워드 시드
INSERT INTO filter_words (word, type, severity, action) VALUES
  ('시발', 'profanity', 'high', 'mask'),
  ('씨발', 'profanity', 'high', 'mask'),
  ('개새끼', 'profanity', 'high', 'mask'),
  ('병신', 'profanity', 'high', 'mask'),
  ('지랄', 'profanity', 'medium', 'mask'),
  ('느금마', 'profanity', 'high', 'mask'),
  ('니애미', 'profanity', 'high', 'mask')
ON CONFLICT (word) DO NOTHING;
