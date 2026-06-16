-- 2026-06-16: auto-content-v2 댓글풀 단일행(limit=1) 버그로 과다삽입된
--   "도우미 분이 친절하셨음" 동일 댓글 일괄 정리 + comment_count 진실값 재동기화.
--
-- 원인: scripts/auto-content-v2.mjs 가 seed_comment_pool?limit=1&order=id.desc 로
--   id 최대 1행(="도우미 분이 친절하셨음")만 가져와 pick() → 15분마다 동일 댓글.
--   코드는 풀 전체 랜덤선택으로 수정했고, auto-content-variety-gate.mjs 로 재발 차단.
-- 효과: 라이브 커뮤니티 동일 댓글 반복(봇 냄새) 제거 — AI 냄새 0% 규칙 준수.
-- 멱등: 같은 content 행이 없으면 0건 삭제(재실행 안전). 풀(seed_comment_pool)의
--   해당 문구는 유효한 댓글이므로 유지 — 앞으로는 다른 댓글과 섞여 가끔만 달린다.

DELETE FROM comments WHERE content = '도우미 분이 친절하셨음';

-- 모든 글 comment_count 를 실제 댓글 수로 재동기화(이번 정리 + 과거 드리프트 교정)
UPDATE posts p SET comment_count = (
  SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id
);

DO $$
DECLARE remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM comments WHERE content = '도우미 분이 친절하셨음';
  RAISE NOTICE '[helper_kind_dup_cleanup] remaining identical comments: %', remaining;
END $$;
