-- 005 패치: comments 테이블에 likes 컬럼 없어서 수정
-- Supabase SQL Editor에서 이것만 실행하면 됨

CREATE OR REPLACE FUNCTION auto_generate_content()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_author_id UUID;
  v_post_id UUID;
  v_post_pool_id INT;
  v_post_category TEXT;
  v_post_title TEXT;
  v_post_content TEXT;
  v_comment_count INT;
  v_comment_content TEXT;
  v_comment_author_id UUID;
  v_i INT;
BEGIN
  -- 사용 안 된 글 하나 선택
  SELECT id, category, title, content
  INTO v_post_pool_id, v_post_category, v_post_title, v_post_content
  FROM seed_post_pool WHERE used = FALSE
  ORDER BY random() LIMIT 1;

  -- 풀이 비었으면 리셋
  IF v_post_pool_id IS NULL THEN
    UPDATE seed_post_pool SET used = FALSE;
    SELECT id, category, title, content
    INTO v_post_pool_id, v_post_category, v_post_title, v_post_content
    FROM seed_post_pool ORDER BY random() LIMIT 1;
  END IF;

  UPDATE seed_post_pool SET used = TRUE WHERE id = v_post_pool_id;

  -- 아무 유저나 선택
  SELECT id INTO v_author_id FROM users ORDER BY random() LIMIT 1;

  IF v_author_id IS NULL THEN
    RETURN json_build_object('error', 'no users found');
  END IF;

  -- 글 삽입
  INSERT INTO posts (user_id, title, content, category, likes, comment_count)
  VALUES (v_author_id, v_post_title, v_post_content, v_post_category,
          floor(random() * 30 + 5)::int, 0)
  RETURNING id INTO v_post_id;

  -- 랜덤 댓글 3~5개 생성
  v_comment_count := floor(random() * 3 + 3)::int;

  FOR v_i IN 1..v_comment_count LOOP
    SELECT id INTO v_comment_author_id
    FROM users WHERE id != v_author_id
    ORDER BY random() LIMIT 1;

    IF v_comment_author_id IS NULL THEN
      v_comment_author_id := v_author_id;
    END IF;

    SELECT content INTO v_comment_content
    FROM seed_comment_pool WHERE used = FALSE
    ORDER BY random() LIMIT 1;

    IF v_comment_content IS NULL THEN
      UPDATE seed_comment_pool SET used = FALSE;
      SELECT content INTO v_comment_content
      FROM seed_comment_pool ORDER BY random() LIMIT 1;
    END IF;

    UPDATE seed_comment_pool SET used = TRUE
    WHERE id = (SELECT id FROM seed_comment_pool WHERE content = v_comment_content LIMIT 1);

    INSERT INTO comments (post_id, user_id, content)
    VALUES (v_post_id, v_comment_author_id, v_comment_content);
  END LOOP;

  UPDATE posts SET comment_count = v_comment_count WHERE id = v_post_id;

  RETURN json_build_object(
    'success', true,
    'post_id', v_post_id,
    'title', v_post_title,
    'category', v_post_category,
    'comments_added', v_comment_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION auto_reply_to_recent()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_post RECORD;
  v_comment_content TEXT;
  v_reply_author_id UUID;
  v_added INT := 0;
BEGIN
  FOR v_post IN
    SELECT id, user_id FROM posts
    WHERE created_at > NOW() - INTERVAL '24 hours'
    AND comment_count < 3
    ORDER BY created_at DESC
    LIMIT 5
  LOOP
    SELECT id INTO v_reply_author_id
    FROM users WHERE id != v_post.user_id
    ORDER BY random() LIMIT 1;

    IF v_reply_author_id IS NULL THEN CONTINUE; END IF;

    SELECT content INTO v_comment_content
    FROM seed_comment_pool ORDER BY random() LIMIT 1;

    INSERT INTO comments (post_id, user_id, content)
    VALUES (v_post.id, v_reply_author_id, v_comment_content);

    UPDATE posts SET comment_count = comment_count + 1 WHERE id = v_post.id;
    v_added := v_added + 1;
  END LOOP;

  RETURN json_build_object('replies_added', v_added);
END;
$$;
