-- 2026-06-09: 가격 단어(만원/입장료/가성비/시세/가격대 + 2차) 시드 풀(seed_post_pool/
--             seed_comment_pool) 일괄 삭제 — auto-content-v2 재주입 차단.
-- 근거: CLAUDE.md "가격 비노출 절대규칙" + feedback_no_price_anywhere 메모리.
--
-- 배경: 2026-05-20 마이그레이션이 라이브 posts/comments 의 가격 단어 글을 지웠으나
--       *시드 풀*(seed_post_pool/seed_comment_pool)은 손대지 않았다. auto-content-v2 가
--       매 15분 seed_post_pool(used=false)에서 글을 꺼내 라이브로 발행 → 가격 단어 글이
--       계속 재주입되어 살아 돌아왔다(064건). 본 마이그레이션은 *발행 원천*인 풀을 정화.
--       이 글들은 단어 1~2개가 아니라 글 전체가 가격 비교(가격/반값/30만원 등) 주제라
--       단어 치환으로는 살릴 수 없어 행 단위 삭제(2026-05-20 라이브 정리와 동일 판단).
-- 멱등: 재실행 시 매칭 0건 no-op. NULL-safe.

-- 1) 시드 풀 — 발행 원천 (가장 중요: 여기를 비워야 재주입이 멈춘다)
DELETE FROM seed_post_pool
WHERE COALESCE(title, '')   ~ '(만원|입장료|가성비|시세|가격대|2 *차)'
   OR COALESCE(content, '') ~ '(만원|입장료|가성비|시세|가격대|2 *차)';

DELETE FROM seed_comment_pool
WHERE COALESCE(content, '') ~ '(만원|입장료|가성비|시세|가격대|2 *차)';

-- 2) 혹시 2026-05-20 이후 재주입된 라이브 글/댓글이 있으면 같이 정리 (멱등)
DELETE FROM comments
WHERE COALESCE(content, '') ~ '(만원|입장료|가성비|시세|가격대|2 *차)'
   OR post_id IN (
     SELECT id FROM posts
     WHERE COALESCE(title, '')   ~ '(만원|입장료|가성비|시세|가격대|2 *차)'
        OR COALESCE(content, '') ~ '(만원|입장료|가성비|시세|가격대|2 *차)'
   );

DELETE FROM posts
WHERE COALESCE(title, '')   ~ '(만원|입장료|가성비|시세|가격대|2 *차)'
   OR COALESCE(content, '') ~ '(만원|입장료|가성비|시세|가격대|2 *차)';

-- 3) 검증 카운트 (마이그레이션 로그용)
DO $$
DECLARE
  pool_posts INTEGER := 0;
  pool_comments INTEGER := 0;
  live_posts INTEGER := 0;
  live_comments INTEGER := 0;
BEGIN
  IF to_regclass('public.seed_post_pool') IS NOT NULL THEN
    SELECT COUNT(*) INTO pool_posts FROM seed_post_pool
      WHERE (COALESCE(title,'') || COALESCE(content,'')) ~ '(만원|입장료|가성비|시세|가격대|2 *차)';
  END IF;
  IF to_regclass('public.seed_comment_pool') IS NOT NULL THEN
    SELECT COUNT(*) INTO pool_comments FROM seed_comment_pool
      WHERE COALESCE(content,'') ~ '(만원|입장료|가성비|시세|가격대|2 *차)';
  END IF;
  IF to_regclass('public.posts') IS NOT NULL THEN
    SELECT COUNT(*) INTO live_posts FROM posts
      WHERE (COALESCE(title,'') || COALESCE(content,'')) ~ '(만원|입장료|가성비|시세|가격대|2 *차)';
  END IF;
  IF to_regclass('public.comments') IS NOT NULL THEN
    SELECT COUNT(*) INTO live_comments FROM comments
      WHERE COALESCE(content,'') ~ '(만원|입장료|가성비|시세|가격대|2 *차)';
  END IF;
  RAISE NOTICE '[price_word_seed_pool_cleanup] remaining pool_posts: %, pool_comments: %, live_posts: %, live_comments: %',
    pool_posts, pool_comments, live_posts, live_comments;
END $$;
