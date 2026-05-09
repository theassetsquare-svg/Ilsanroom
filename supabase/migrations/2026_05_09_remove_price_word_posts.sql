-- 2026-05-09: 가격 단어(만원/입장료/가성비/시세/가격대) 포함 시드 글·댓글 일괄 삭제
-- 근거: CLAUDE.md 가격 비노출 절대규칙. 라이브 풀크롤 감사에서 9건 hit (홈+커뮤니티 5페이지) 발견.
-- 영향: NULL user_id (시드 글)만 대상. 실제 회원 글은 보존.

-- 1) 댓글 먼저 (FK 대비). 시드 댓글은 user_id IS NULL.
DELETE FROM comments
WHERE user_id IS NULL
  AND (
    content ~ '(만원|입장료|가성비|시세|가격대)'
    OR post_id IN (
      SELECT id FROM posts
      WHERE user_id IS NULL
        AND (title ~ '(만원|입장료|가성비|시세|가격대)' OR content ~ '(만원|입장료|가성비|시세|가격대)')
    )
  );

-- 2) 시드 게시글 본체
DELETE FROM posts
WHERE user_id IS NULL
  AND (
    title ~ '(만원|입장료|가성비|시세|가격대)'
    OR content ~ '(만원|입장료|가성비|시세|가격대)'
  );

-- 3) 검증 카운트 (마이그레이션 로그용)
DO $$
DECLARE
  remaining_posts INTEGER;
  remaining_comments INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_posts FROM posts
    WHERE user_id IS NULL AND (title ~ '(만원|입장료|가성비|시세|가격대)' OR content ~ '(만원|입장료|가성비|시세|가격대)');
  SELECT COUNT(*) INTO remaining_comments FROM comments
    WHERE user_id IS NULL AND content ~ '(만원|입장료|가성비|시세|가격대)';
  RAISE NOTICE '[price_word_cleanup] remaining seed posts: %, comments: %', remaining_posts, remaining_comments;
END $$;
