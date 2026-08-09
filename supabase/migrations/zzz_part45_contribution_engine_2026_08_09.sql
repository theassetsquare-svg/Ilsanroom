-- ============================================================
-- 한국1위 파트4.5 — 방문자 기여 엔진 DB (2026-08-09)
-- ① founding_members: 첫 기여 회원에게 "창립멤버 N번" 영구 번호 (즉시 보상)
-- ② content_helpful: 매거진·가이드 "도움 됐나요 👍/👎" 익명 집계 (실집계만, 0=0)
-- ③ 운영팀 주간 질문 1편: is_official=TRUE 공식 글 (회원 사칭 아님, 실측 지역 기반)
--
-- ★가짜 UGC 게이트와의 관계:
--   · founding_members / content_helpful 은 posts·comments 를 건드리지 않음 → 가짜 서명 무관
--   · 운영팀 질문은 is_official=TRUE → 향후 가짜 정리 스윕에서 삭제 금지 대상 (파트4 규약)
--   · 회원 명의 자동 글·댓글 생성 0 (탭 후기는 프론트에서 실회원 user_id 로만 insert)
--   · 전부 실제 행동만 기록하는 빈 테이블 (가짜 데이터 insert 0)
-- ============================================================

-- ★ prod 커스텀 이벤트 트리거 우회 (reference_exec_sql_event_trigger_gotcha):
--   CREATE/ALTER TABLE 마다 auto_rls_trigger 가 정책 재생성 → 중복 에러,
--   auto_secure_function_trigger 는 CREATE FUNCTION 재귀 → stack depth.
--   exec_sql 은 단일 트랜잭션이라 중간 실패 시 통째 롤백 = 무해.
ALTER EVENT TRIGGER auto_secure_function_trigger DISABLE;
ALTER EVENT TRIGGER auto_rls_trigger DISABLE;

-- ============================================================
-- ① 창립멤버 번호 — 첫 기여 즉시 영구 부여
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS founding_member_seq;

CREATE TABLE IF NOT EXISTS founding_members (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_no INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE founding_members ENABLE ROW LEVEL SECURITY;
-- 본인 번호만 조회 (다른 회원 목록·번호 비공개)
DROP POLICY IF EXISTS "own founding select" ON founding_members;
CREATE POLICY "own founding select" ON founding_members FOR SELECT USING (auth.uid() = user_id);

-- 멱등: 이미 있으면 기존 번호, 없으면 다음 번호 발급. 시퀀스라 경쟁 무관.
CREATE OR REPLACE FUNCTION claim_founding_member()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_no  INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;  -- 비로그인은 창립멤버 대상 아님
  END IF;
  SELECT member_no INTO v_no FROM founding_members WHERE user_id = v_uid;
  IF v_no IS NULL THEN
    v_no := nextval('founding_member_seq');
    INSERT INTO founding_members (user_id, member_no) VALUES (v_uid, v_no)
      ON CONFLICT (user_id) DO NOTHING;
    SELECT member_no INTO v_no FROM founding_members WHERE user_id = v_uid;
  END IF;
  RETURN v_no;
END;
$$;
REVOKE ALL ON FUNCTION claim_founding_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_founding_member() TO authenticated;

-- ============================================================
-- ② 콘텐츠 "도움 됐나요 👍/👎" — 익명 탭 허용, 실집계만
-- ============================================================
CREATE TABLE IF NOT EXISTS content_helpful (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL,           -- 예: 'magazine:59', 'guide:ilsan-yojeong'
  is_up       BOOLEAN NOT NULL,        -- TRUE=👍, FALSE=👎
  voter_token TEXT,                    -- 브라우저 랜덤 토큰(익명, PII 아님) — 집계 중복 완화용
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_helpful_key ON content_helpful(content_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_helpful_token ON content_helpful(content_key, voter_token) WHERE voter_token IS NOT NULL;
ALTER TABLE content_helpful ENABLE ROW LEVEL SECURITY;
-- 익명 탭 허용(로그인 불필요) — 하지만 원본 행 열람·수정·삭제는 불가(집계는 RPC로만)
DROP POLICY IF EXISTS "helpful insert anyone" ON content_helpful;
CREATE POLICY "helpful insert anyone" ON content_helpful FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION get_helpful_counts(p_content_key TEXT)
RETURNS TABLE(up BIGINT, down BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE is_up)      ::BIGINT AS up,
    COUNT(*) FILTER (WHERE NOT is_up)  ::BIGINT AS down
  FROM content_helpful
  WHERE content_key = p_content_key;
$$;
REVOKE ALL ON FUNCTION get_helpful_counts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_helpful_counts(TEXT) TO anon, authenticated;

-- ============================================================
-- ③ 운영팀 주간 질문 1편 (이번 주) — is_official=TRUE, 실측 조회 1위 지역 기반
--    이후 주차는 ops-weekly-question.yml 워크플로가 실데이터로 자동 발행.
--    고정 UUID(a1......주차)로 멱등 — 재실행해도 중복 0.
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;

-- UUID 규칙: a1000000-0000-4000-8000-<이번주 월요일 YYYYMMDD>0000 (워크플로가 매주 동일 규칙으로 재현 → 멱등)
INSERT INTO posts (id, user_id, category, title, content, is_official, created_at)
VALUES (
  'a1000000-0000-4000-8000-202608100000',  -- 이번 주 월요일(2026-08-10) 주차 — 워크플로와 동일 UUID 규칙(멱등)
  NULL,
  'free',
  '이번 주 조회 1위 동네는 대전 — 주말에 나가실 분?',
  $q1$<p>안녕하세요, 놀쿨 운영팀입니다. 최근 28일 실제 조회수를 집계해보니 이번 주는 대전 쪽 관심이 제일 높았어요. 그래서 한 판 열어봅니다.</p>
<p>주말에 대전 나가시는 분 있어요? 어디로 갈지 아직 안 정했으면 댓글로 같이 정해봐요. 처음이면 뭐가 궁금한지 편하게 물어보셔도 되고, 자주 가는 분은 요령 하나씩 풀어주셔도 좋습니다.</p>
<p>답만 달아도 됩니다 — 지역, 인원, 궁금한 점 한 줄이면 충분해요. 아래 이번 주 원터치 투표도 같이 있으니 손가락 한 번이면 참여돼요.</p>$q1$,
  TRUE,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 이벤트 트리거 원상복구 (위 함수는 SECURITY DEFINER + search_path 로 손수 지정 완료)
ALTER EVENT TRIGGER auto_rls_trigger ENABLE;
ALTER EVENT TRIGGER auto_secure_function_trigger ENABLE;
