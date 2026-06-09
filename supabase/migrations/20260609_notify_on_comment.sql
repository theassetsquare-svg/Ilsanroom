-- 2026-06-09: 소셜보상 알림 배선 — 댓글/대댓글이 달리면 받는 사람에게 알림.
--
-- 배경: notifications 인프라(테이블/벨/폴링/아이콘)는 이미 완비됐으나 *발화 지점*이
--       없어 한 번도 안 울렸다. 클라이언트에서 createNotification 을 호출해도
--       RLS(notifications_insert: auth.uid()=user_id OR service_role) 때문에 "남에게"
--       알림을 넣을 수 없다(자기 자신에게만 허용). → 서버측 트리거가 정답.
--
-- 설계(Nir Eyal Hook Model의 외부 트리거 = 소셜 보상):
--   • 글 작성자에게  💬 'comment'  — 내 글에 새 댓글
--   • 부모 댓글 작성자에게 ↩️ 'reply' — 내 댓글에 답글 (대댓글일 때)
--
-- 안전 규칙("사이트 피해 0"):
--   • SECURITY DEFINER + 고정 search_path — 보안 베이스라인 권고형.
--   • 시드/익명 댓글(NEW.user_id IS NULL)은 알림 0 — 합성 활동으로 알림을 쏘지 않는다.
--   • 본인이 자기 글/댓글에 단 댓글은 알림 0(self 제외).
--   • 글 작성자 = 부모 댓글 작성자면 1통만(중복 방지).
--   • EXCEPTION 가드 — 알림 INSERT 가 실패해도 댓글 작성 자체는 절대 막지 않는다.
--   • AFTER INSERT — 실제 댓글이 커밋되는 경우에만 발화.
-- 멱등: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS 로 재실행 안전.

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  post_title TEXT;
  parent_author UUID;
  snippet TEXT;
BEGIN
  -- 시드/익명 댓글은 알림 안 만든다 (합성 활동 차단)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  snippet := left(regexp_replace(COALESCE(NEW.content, ''), '\s+', ' ', 'g'), 50);

  SELECT user_id, title INTO post_author, post_title
    FROM public.posts WHERE id = NEW.post_id;

  -- 대댓글 → 부모 댓글 작성자에게 답글 알림 (본인/시드 제외)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_author
      FROM public.comments WHERE id = NEW.parent_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (parent_author, 'reply', '내 댓글에 답글이 달렸어요',
              snippet, '/community/post/' || NEW.post_id);
    END IF;
  END IF;

  -- 글 작성자에게 댓글 알림 (본인/시드 제외, 부모 작성자와 중복 제외)
  IF post_author IS NOT NULL
     AND post_author <> NEW.user_id
     AND (NEW.parent_id IS NULL OR post_author IS DISTINCT FROM parent_author) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (post_author, 'comment',
            '내 글에 댓글이 달렸어요' || COALESCE(' — ' || left(post_title, 20), ''),
            snippet, '/community/post/' || NEW.post_id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 알림 실패가 댓글 작성을 막지 않게 — 댓글은 항상 성공해야 한다
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
