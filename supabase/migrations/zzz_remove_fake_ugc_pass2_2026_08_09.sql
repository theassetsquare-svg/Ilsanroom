-- ═══════════════════════════════════════════════════════════════
-- 2026-08-09 파트2.5 정직화 — 가짜 UGC 제거 2차 (생성기 글)
--
-- 1차(zzz_remove_fake_ugc)는 user_id IS NULL 시드(757개) + seed_authors 닉네임 유저를 제거했다.
-- 그러나 활성 생성기(auto-content-v2.mjs)는 seed_authors가 아니라 public.users 임의 계정(19인,
-- 테스트/광고주/실유저 혼재) 명의로 글을 써서, 실계정에 가짜 글이 귀속돼 787개가 남았다.
-- → 작성자로는 가짜/진짜를 못 가른다. 대신 생성기의 불변 서명을 쓴다:
--
--   생성기는 삽입 시 likes = rand(max(2,..), ..) 로 항상 likes >= 2 를 박는다.
--   실제 글은 createPost()가 likes 기본값 0 으로 저장(좋아요는 실사용자 클릭으로만 증가).
--   실측: likes>=2 = 771개(전부 시드풀 문구·가짜 좋아요) · likes<2 = 16개(광고주 아톰 홍보글·
--   "강남 룸 가실 분" 등 진짜 글, 전부 likes 0). → likes >= 2 = 가짜 생성기 서명(안전·완전).
--
-- 안전장치: 삭제 전 원본을 1차와 동일 백업 테이블에 추가 보존. 최상위 WHERE 보유(safe-update 준수).
-- ═══════════════════════════════════════════════════════════════

-- 백업(원본 보존) — 1차 백업 테이블 재사용(없으면 생성)
CREATE TABLE IF NOT EXISTS public._fake_ugc_backup_20260809_posts    AS SELECT * FROM public.posts    WHERE false;
CREATE TABLE IF NOT EXISTS public._fake_ugc_backup_20260809_comments AS SELECT * FROM public.comments WHERE false;
REVOKE ALL ON TABLE public._fake_ugc_backup_20260809_posts, public._fake_ugc_backup_20260809_comments FROM PUBLIC, anon, authenticated;

INSERT INTO public._fake_ugc_backup_20260809_comments
  SELECT * FROM public.comments c
  WHERE c.post_id IN (SELECT p.id FROM public.posts p WHERE p.likes >= 2);

INSERT INTO public._fake_ugc_backup_20260809_posts
  SELECT * FROM public.posts p WHERE p.likes >= 2;

-- 1) 가짜 글의 댓글 먼저 삭제(고아 방지)
DELETE FROM public.comments c
WHERE c.post_id IN (SELECT p.id FROM public.posts p WHERE p.likes >= 2);

-- 2) 가짜 생성기 글 삭제 (likes>=2 = 항상 생성기, 실글은 0~1)
DELETE FROM public.posts p
WHERE p.likes >= 2;

NOTIFY pgrst, 'reload schema';
