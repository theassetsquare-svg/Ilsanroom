-- ═══════════════════════════════════════════════════════════════
-- 2026-08-09 파트2.5 정직화: 커뮤니티 가짜 UGC 전면 제거
-- 근거: 사이트 #1 규칙 "가짜 0" + 표시광고법(기만적 후기·활동 조작) 리스크.
-- 원칙: 비어 있는 정직 > 가득 찬 가짜.
--
-- 가짜 식별(삭제 안전 근거 — 실회원 글은 절대 삭제되지 않음):
--   ① user_id IS NULL              → SQL 시드 글/후기(seed_community_posts_v1~v5, 전부 NULL)
--   ② 작성자 nickname ∈ seed_authors → auto-content 생성기가 명의로 쓴 가상 50인
--   ※ 실회원 글은 createPost()가 user_id=로그인사용자.id 로 저장(절대 NULL 아님) +
--     user_profiles.nickname UNIQUE 제약상 실회원은 seed 닉네임 보유 불가.
--
-- 안전장치: 삭제 전 원본을 _fake_ugc_backup_20260809_* 테이블로 복사(복구 가능).
-- 모든 최상위 DELETE는 WHERE 절 보유(pg_safeupdate / migration-safeupdate-gate 준수).
-- ═══════════════════════════════════════════════════════════════

-- ── 0) 백업 테이블(원본 보존, 복구용) — 서비스롤 외 접근 차단 ──
CREATE TABLE IF NOT EXISTS public._fake_ugc_backup_20260809_posts    AS SELECT * FROM public.posts    WHERE false;
CREATE TABLE IF NOT EXISTS public._fake_ugc_backup_20260809_comments AS SELECT * FROM public.comments WHERE false;
CREATE TABLE IF NOT EXISTS public._fake_ugc_backup_20260809_users    AS SELECT * FROM public.users    WHERE false;
REVOKE ALL ON TABLE public._fake_ugc_backup_20260809_posts, public._fake_ugc_backup_20260809_comments, public._fake_ugc_backup_20260809_users FROM PUBLIC, anon, authenticated;

-- 가짜 작성자 id 집합(seed_authors 닉네임 보유 public.users)
-- 백업 채우기 (INSERT — pg_safeupdate 대상 아님)
INSERT INTO public._fake_ugc_backup_20260809_posts
  SELECT * FROM public.posts p
  WHERE p.user_id IS NULL
     OR p.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors));

INSERT INTO public._fake_ugc_backup_20260809_comments
  SELECT * FROM public.comments c
  WHERE c.user_id IS NULL
     OR c.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors))
     OR c.post_id IN (
        SELECT p.id FROM public.posts p
        WHERE p.user_id IS NULL
           OR p.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors)));

INSERT INTO public._fake_ugc_backup_20260809_users
  SELECT * FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors);

-- ── 1) 가짜 댓글 삭제 (posts보다 먼저 = 고아 방지, FK 동작 무관하게 안전) ──
DELETE FROM public.comments c
WHERE c.user_id IS NULL
   OR c.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors))
   OR c.post_id IN (
      SELECT p.id FROM public.posts p
      WHERE p.user_id IS NULL
         OR p.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors)));

-- ── 2) 가짜 글 삭제 (가짜 좋아요·조회수·불꽃지표 동반 제거) ──
DELETE FROM public.posts p
WHERE p.user_id IS NULL
   OR p.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors));

-- ── 3) 라운지 게시판 가짜 글/댓글도 동일 기준 제거 (있을 때만) ──
DELETE FROM public.lounge_comments lc
WHERE lc.user_id IS NULL
   OR lc.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors))
   OR lc.post_id IN (
      SELECT lp.id FROM public.lounge_posts lp
      WHERE lp.user_id IS NULL
         OR lp.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors)));

DELETE FROM public.lounge_posts lp
WHERE lp.user_id IS NULL
   OR lp.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors));

-- ── 4) 가짜 user_profiles 제거 (온도·창립멤버 카운트 정직화). nickname UNIQUE = 실회원 무영향 ──
DELETE FROM public.user_profiles up
WHERE up.nickname IN (SELECT nickname FROM public.seed_authors)
   OR up.user_id IN (SELECT u.id FROM public.users u WHERE u.nickname IN (SELECT nickname FROM public.seed_authors));

-- ── 5) 가짜 public.users 제거 (user_profiles CASCADE). auth.users 고아는 무해(프로필 0) ──
DELETE FROM public.users u
WHERE u.nickname IN (SELECT nickname FROM public.seed_authors);

-- ── 6) 생성기 소스 영구 제거 (재유입 차단). 참조 끝난 뒤 DROP ──
DROP TABLE IF EXISTS public.seed_post_pool CASCADE;
DROP TABLE IF EXISTS public.seed_comment_pool CASCADE;
DROP TABLE IF EXISTS public.seed_authors CASCADE;
DROP FUNCTION IF EXISTS public.generate_seed_content() CASCADE;
DROP FUNCTION IF EXISTS public.generate_seed_post() CASCADE;

NOTIFY pgrst, 'reload schema';
