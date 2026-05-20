-- 2026-05-20: 가격 단어(만원/입장료/가성비/시세/가격대) 포함 글·댓글 일괄 삭제
-- 근거: CLAUDE.md "가격 비노출 절대규칙" + feedback_no_price_anywhere 메모리.
-- 2026-05-09 migration은 user_id IS NULL만 정리했으나, 006* seed_pool_expansion
-- 시드가 fake user_id로 들어가 잔여 글 발견 (라이브 /admin 후기 탭 노출).
-- 본 마이그레이션은 user_id 제한 없이 본문/제목 매칭으로 일괄 삭제.

-- 1) 댓글 (FK 대비 먼저)
DELETE FROM comments
WHERE content ~ '(만원|입장료|가성비|시세|가격대)'
  OR post_id IN (
    SELECT id FROM posts
    WHERE title ~ '(만원|입장료|가성비|시세|가격대)'
      OR content ~ '(만원|입장료|가성비|시세|가격대)'
  );

-- 2) 게시글
DELETE FROM posts
WHERE title ~ '(만원|입장료|가성비|시세|가격대)'
  OR content ~ '(만원|입장료|가성비|시세|가격대)';

-- 3) 검증 카운트
DO $$
DECLARE
  remaining_posts INTEGER;
  remaining_comments INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_posts FROM posts
    WHERE title ~ '(만원|입장료|가성비|시세|가격대)' OR content ~ '(만원|입장료|가성비|시세|가격대)';
  SELECT COUNT(*) INTO remaining_comments FROM comments
    WHERE content ~ '(만원|입장료|가성비|시세|가격대)';
  RAISE NOTICE '[price_word_all_users_cleanup] remaining posts: %, comments: %', remaining_posts, remaining_comments;
END $$;
