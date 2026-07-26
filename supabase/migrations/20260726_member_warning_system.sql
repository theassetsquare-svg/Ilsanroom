-- 2026-07-26: 회원 시스템 강화 — 유해글 자동 경고(오판 방지 2단) + 3회 정지 + 이메일 재가입 차단 + admin 회원관리
--
-- 설계 원칙("사이트 피해 0"):
--   • 자동 경고는 "명백한 위반"(불법·호객어)만. 애매(스팸 의심)는 경고 0, admin 검토 큐로만.
--   • 모든 트리거 부수효과는 EXCEPTION 가드 — 실패해도 원래 동작(글 저장/회원 가입)을 절대 깨지 않는다.
--   • 가입 차단이 아니라 "재가입 즉시 자동 재정지 + 감지 로그" — 가입 흐름 자체는 건드리지 않음(회귀 0).
--   • PII(이메일)는 SECURITY DEFINER 서버측에서만 조회, admin 전용 테이블에만 기록.
--   • 경고·정지·해제 전부 Supabase 기록(감사 가능). 수동 되돌리기 RPC 제공(자동 오판 복구).
--
-- ⚠️ stack depth 우회: 커스텀 이벤트 트리거 auto_secure_function_trigger 때문에
--    CREATE FUNCTION 구간만 끄고 끝나면 다시 켠다 (모범: 20260609_notify_on_comment.sql).
--    단일 트랜잭션 → 중간 실패 시 통째 롤백.

-- ═══════════════ 1. 테이블 ═══════════════

-- 경고 이력 (자동/수동, 취소 가능 = 감사 추적)
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'admin')),
  reason TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON public.user_warnings (user_id) WHERE revoked_at IS NULL;

-- 이메일 차단 목록 (정지 시 등재 → 동일 이메일 재가입 감지·자동 재정지)
CREATE TABLE IF NOT EXISTS public.banned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT now(),
  unbanned_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_banned_emails_active ON public.banned_emails (lower(email)) WHERE unbanned_at IS NULL;

-- 애매한 콘텐츠 admin 검토 큐 (자동 경고 0 — 억울한 경고 방지)
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  excerpt TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_open ON public.moderation_queue (created_at DESC) WHERE status = 'open';

-- 정지 회원 재가입 시도 감지 로그
CREATE TABLE IF NOT EXISTS public.rejoin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- reviews에도 숨김 컬럼 (posts/comments는 004에서 이미 존재)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='is_hidden') THEN
    ALTER TABLE public.reviews ADD COLUMN is_hidden BOOLEAN DEFAULT false;
  END IF;
END$$;

-- ═══════════════ 2. RLS ═══════════════

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejoin_attempts ENABLE ROW LEVEL SECURITY;

-- 경고: 본인 열람(내 경고 사유 확인 권리) + admin 열람. 쓰기는 SECURITY DEFINER 경유만.
DROP POLICY IF EXISTS warnings_select ON public.user_warnings;
CREATE POLICY warnings_select ON public.user_warnings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 이메일 차단 목록: admin 전용 (PII)
DROP POLICY IF EXISTS banned_emails_admin ON public.banned_emails;
CREATE POLICY banned_emails_admin ON public.banned_emails
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 검토 큐: admin 열람/처리. INSERT는 트리거(SECURITY DEFINER)만.
DROP POLICY IF EXISTS moderation_queue_admin_select ON public.moderation_queue;
CREATE POLICY moderation_queue_admin_select ON public.moderation_queue
  FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS moderation_queue_admin_update ON public.moderation_queue;
CREATE POLICY moderation_queue_admin_update ON public.moderation_queue
  FOR UPDATE TO authenticated USING (public.is_admin());

-- 재가입 감지 로그: admin 전용
DROP POLICY IF EXISTS rejoin_attempts_admin ON public.rejoin_attempts;
CREATE POLICY rejoin_attempts_admin ON public.rejoin_attempts
  FOR SELECT TO authenticated USING (public.is_admin());

-- ═══════════════ 3. 정지 회원 작성 차단 (서버사이드 — 프론트 우회 불가) ═══════════════
-- 기존 owner-only INSERT 잠금(20260521b)에 "정지 아님" 조건 추가. 그 외 정책 변경 0.

DROP POLICY IF EXISTS "insert_posts" ON public.posts;
CREATE POLICY "insert_posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.user_is_banned(auth.uid()));

DROP POLICY IF EXISTS "insert_comments" ON public.comments;
CREATE POLICY "insert_comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.user_is_banned(auth.uid()));

DROP POLICY IF EXISTS "insert_reviews" ON public.reviews;
CREATE POLICY "insert_reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.user_is_banned(auth.uid()));

-- ═══════════════ 4. 함수 (이벤트 트리거 우회 구간) ═══════════════

ALTER EVENT TRIGGER auto_secure_function_trigger DISABLE;

-- 4-1. 명백한 불법·호객어 감지 (content-filter.ts ILLEGAL_WORDS 서버 미러)
--      글자 사이 공백·구두점 삽입 우회 차단. 매칭 단어는 반환하지 않음(금지어 재노출 0).
CREATE OR REPLACE FUNCTION public.content_has_illegal(txt TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  words TEXT[] := ARRAY[
    E'\uC131\uB9E4\uB9E4', E'\uC131\uB9E4\uC218', E'\uC131\uC811\uB300',
    E'\uB9E4\uCD98', E'\uB9E4\uC74C',
    E'\uC870\uAC74\uB9CC\uB0A8', E'\uC870\uAC74\uD305', E'\uC6D0\uC870\uAD50\uC81C',
    E'\uCD9C\uC7A5\uB9CC\uB0A8', E'\uCD9C\uC7A5\uC0F5', E'\uCD9C\uC7A5\uC548\uB9C8',
    E'\uD480\uC2F8\uB871', E'\uD480\uC0AC\uB871', E'\uD0A4\uC2A4\uBC29',
    E'\uB300\uB538', E'\uD734\uAC8C\uD154', E'\uB9BD\uCE74\uD398', E'\uC624\uD53C\uC2A4\uAC78',
    E'\uB8F8\uC0B4\uB871',
    E'\uCD08\uC774\uC2A4',
    E'2\uCC28\uCF5C', E'2\uCC28\uAC00\uB2A5', E'2\uCC28\uB098\uAC00'
  ];
  w TEXT;
  pat TEXT;
BEGIN
  IF txt IS NULL OR txt = '' THEN RETURN false; END IF;
  FOREACH w IN ARRAY words LOOP
    SELECT string_agg(c, E'[-[:space:].\u00B7_]*' ORDER BY ord)
      INTO pat
      FROM unnest(regexp_split_to_array(w, '')) WITH ORDINALITY AS t(c, ord);
    IF txt ~* pat THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 4-2. 스팸 의심 (애매 — 자동 경고 금지, 큐만): 링크/메신저ID/전화/광고문구
CREATE OR REPLACE FUNCTION public.content_spam_suspect(txt TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF txt IS NULL OR txt = '' THEN RETURN false; END IF;
  RETURN txt ~* 'https?://'
      OR txt ~* E'(\uCE74\uD1A1|\uCE74\uCE74\uC624\uD1A1|\uD154\uB808|\uD154\uB808\uADF8\uB7A8)[[:space:]]*[:-]?[[:space:]]*[^[:space:]]+'
      OR txt ~ '01[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}'
      OR txt ~* E'(\uD560\uC778|\uBB34\uB8CC|\uC774\uBCA4\uD2B8|\uC120\uCC29\uC21C|\uD55C\uC815).{0,10}(\uD074\uB9AD|\uC811\uC18D|\uAC00\uC785|\uBB38\uC758)';
END;
$$ LANGUAGE plpgsql;

-- 4-3. 경고 누적 → 3회면 정지 + 이메일 차단 등재 (공용 헬퍼)
CREATE OR REPLACE FUNCTION public.apply_warning_ban(uid UUID)
RETURNS INT AS $$
DECLARE
  cnt INT;
  u_email TEXT;
BEGIN
  SELECT count(*) INTO cnt FROM public.user_warnings
    WHERE user_id = uid AND revoked_at IS NULL;

  IF cnt >= 3 AND NOT public.user_is_banned(uid) THEN
    UPDATE public.user_profiles
      SET is_banned = true,
          ban_reason = E'\uACBD\uACE0 3\uD68C \uB204\uC801 \uC790\uB3D9 \uC815\uC9C0',
          banned_at = now()
      WHERE user_id = uid;
    IF NOT FOUND THEN
      INSERT INTO public.user_profiles (user_id, is_banned, ban_reason, banned_at)
      VALUES (uid, true, E'\uACBD\uACE0 3\uD68C \uB204\uC801 \uC790\uB3D9 \uC815\uC9C0', now())
      ON CONFLICT (user_id) DO UPDATE SET is_banned = true, banned_at = now();
    END IF;

    SELECT email INTO u_email FROM auth.users WHERE id = uid;
    IF u_email IS NOT NULL THEN
      INSERT INTO public.banned_emails (email, user_id, reason)
      VALUES (lower(u_email), uid, E'\uACBD\uACE0 3\uD68C \uB204\uC801')
      ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (uid, 'warning',
            E'\uACC4\uC815\uC774 \uC815\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4',
            E'\uACBD\uACE0 3\uD68C \uB204\uC801\uC73C\uB85C \uACC4\uC815\uC774 \uC815\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBB38\uC758\uB294 \uACE0\uAC1D\uC13C\uD130\uB85C \uC5F0\uB77D\uC8FC\uC138\uC694.',
            '/help');
  END IF;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- 4-4. 콘텐츠 자동 모더레이션 트리거 (posts/comments/reviews BEFORE INSERT)
--      명백한 위반만: 숨김 + 경고 1회 + 사유 알림. 애매: 큐만. 부수효과 실패 = 글 저장은 그대로.
CREATE OR REPLACE FUNCTION public.auto_moderate_content()
RETURNS TRIGGER AS $$
DECLARE
  body TEXT;
  ttl TEXT;
  full_text TEXT;
  cnt INT;
BEGIN
  -- 시드/익명(user_id NULL)은 대상 아님
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  body := COALESCE(to_jsonb(NEW)->>'content', '');
  ttl := COALESCE(to_jsonb(NEW)->>'title', '');
  full_text := ttl || ' ' || body;

  IF public.content_has_illegal(full_text) THEN
    -- 명백한 위반: 즉시 숨김(발행 0) + 경고 기록 + 회원 알림(사유 명시)
    NEW.is_hidden := true;
    BEGIN
      INSERT INTO public.user_warnings (user_id, source, reason, target_type, target_id, excerpt)
      VALUES (NEW.user_id, 'auto',
              E'\uBD88\uBC95\u00B7\uD638\uAC1D\uC131 \uD45C\uD604 \uD3EC\uD568',
              TG_TABLE_NAME, NEW.id::text, left(body, 80));

      cnt := public.apply_warning_ban(NEW.user_id);

      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (NEW.user_id, 'warning',
              E'\uCEE4\uBBA4\uB2C8\uD2F0 \uC774\uC6A9 \uACBD\uACE0 \uC548\uB0B4',
              E'\uC0AC\uC720: \uBD88\uBC95\u00B7\uD638\uAC1D\uC131 \uD45C\uD604 \uD3EC\uD568. \uC791\uC131 \uAE00\uC740 \uC228\uAE40 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uACBD\uACE0 ' || cnt || E'\uD68C \uB204\uC801 (3\uD68C \uB204\uC801 \uC2DC \uACC4\uC815 \uC815\uC9C0)',
              '/profile');
    EXCEPTION WHEN OTHERS THEN
      NULL; -- 경고 기록 실패해도 숨김 저장 자체는 진행
    END;
  ELSIF public.content_spam_suspect(full_text) THEN
    -- 애매한 것: 자동 경고 0. admin 검토 큐로만 (글은 정상 발행 = 억울한 회원 피해 0)
    BEGIN
      INSERT INTO public.moderation_queue (user_id, target_type, target_id, excerpt, reason)
      VALUES (NEW.user_id, TG_TABLE_NAME, NEW.id::text, left(full_text, 120),
              E'\uC2A4\uD338 \uC758\uC2EC \uD328\uD134(\uB9C1\uD06C\u00B7\uC5F0\uB77D\uCC98\u00B7\uAD11\uACE0\uBB38\uAD6C)');
    EXCEPTION WHEN OTHERS THEN
      NULL; -- 큐 실패해도 글 저장은 그대로
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4-5. 정지 회원 동일 이메일 재가입 감지 → 자동 재정지 + 로그
--      가입 흐름 자체는 절대 깨지 않음(EXCEPTION 가드). handle_new_user(o...) 이후 실행(z 접두).
CREATE OR REPLACE FUNCTION public.detect_banned_rejoin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.banned_emails
    WHERE lower(email) = lower(NEW.email) AND unbanned_at IS NULL
  ) THEN
    INSERT INTO public.rejoin_attempts (email, user_id) VALUES (lower(NEW.email), NEW.id);
    INSERT INTO public.user_profiles (user_id, is_banned, ban_reason, banned_at)
    VALUES (NEW.id, true, E'\uC815\uC9C0 \uD68C\uC6D0 \uC7AC\uAC00\uC785 \uC790\uB3D9 \uC7AC\uC815\uC9C0', now())
    ON CONFLICT (user_id) DO UPDATE
      SET is_banned = true,
          ban_reason = E'\uC815\uC9C0 \uD68C\uC6D0 \uC7AC\uAC00\uC785 \uC790\uB3D9 \uC7AC\uC815\uC9C0',
          banned_at = now();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- 어떤 실패도 가입을 막지 않는다
END;
$$ LANGUAGE plpgsql;

-- 4-6. admin 수동 RPC (경고/취소/즉시정지/해제) — 서버사이드 권한 검증(is_admin)
CREATE OR REPLACE FUNCTION public.admin_warn_user(target UUID, warn_reason TEXT)
RETURNS INT AS $$
DECLARE cnt INT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  INSERT INTO public.user_warnings (user_id, source, reason)
  VALUES (target, 'admin', warn_reason);
  cnt := public.apply_warning_ban(target);
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (target, 'warning',
          E'\uCEE4\uBBA4\uB2C8\uD2F0 \uC774\uC6A9 \uACBD\uACE0 \uC548\uB0B4',
          E'\uC0AC\uC720: ' || warn_reason || E' \u2014 \uACBD\uACE0 ' || cnt || E'\uD68C \uB204\uC801 (3\uD68C \uB204\uC801 \uC2DC \uACC4\uC815 \uC815\uC9C0)',
          '/profile');
  RETURN cnt;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_revoke_warning(wid UUID, why TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.user_warnings
    SET revoked_at = now(), revoked_reason = COALESCE(why, 'admin revoke')
    WHERE id = wid AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_ban_user(target UUID, why TEXT)
RETURNS VOID AS $$
DECLARE u_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.user_profiles
    SET is_banned = true, ban_reason = COALESCE(why, 'admin ban'), banned_at = now()
    WHERE user_id = target;
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, is_banned, ban_reason, banned_at)
    VALUES (target, true, COALESCE(why, 'admin ban'), now())
    ON CONFLICT (user_id) DO UPDATE SET is_banned = true, banned_at = now();
  END IF;
  SELECT email INTO u_email FROM auth.users WHERE id = target;
  IF u_email IS NOT NULL THEN
    INSERT INTO public.banned_emails (email, user_id, reason)
    VALUES (lower(u_email), target, COALESCE(why, 'admin ban'))
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_unban_user(target UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.user_profiles
    SET is_banned = false, ban_reason = NULL, banned_at = NULL
    WHERE user_id = target;
  UPDATE public.banned_emails
    SET unbanned_at = now()
    WHERE user_id = target AND unbanned_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ── 함수 속성 일괄 적용 (SECURITY DEFINER + 고정 search_path) ──
ALTER FUNCTION public.content_has_illegal(TEXT) SET search_path = public;
ALTER FUNCTION public.content_spam_suspect(TEXT) SET search_path = public;
ALTER FUNCTION public.apply_warning_ban(UUID) SECURITY DEFINER;
ALTER FUNCTION public.apply_warning_ban(UUID) SET search_path = public;
ALTER FUNCTION public.auto_moderate_content() SECURITY DEFINER;
ALTER FUNCTION public.auto_moderate_content() SET search_path = public;
ALTER FUNCTION public.detect_banned_rejoin() SECURITY DEFINER;
ALTER FUNCTION public.detect_banned_rejoin() SET search_path = public;
ALTER FUNCTION public.admin_warn_user(UUID, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.admin_warn_user(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_revoke_warning(UUID, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.admin_revoke_warning(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_ban_user(UUID, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.admin_ban_user(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_unban_user(UUID) SECURITY DEFINER;
ALTER FUNCTION public.admin_unban_user(UUID) SET search_path = public;

-- ── 실행 권한: admin RPC/내부 헬퍼는 클라이언트 anon 실행 금지 ──
REVOKE EXECUTE ON FUNCTION public.apply_warning_ban(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_moderate_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_banned_rejoin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_warn_user(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_warning(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_ban_user(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_unban_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_warn_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_warning(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(UUID) TO authenticated;

-- ── 트리거 배선 ──
DROP TRIGGER IF EXISTS trg_auto_moderate_posts ON public.posts;
CREATE TRIGGER trg_auto_moderate_posts
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_content();

DROP TRIGGER IF EXISTS trg_auto_moderate_comments ON public.comments;
CREATE TRIGGER trg_auto_moderate_comments
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_content();

DROP TRIGGER IF EXISTS trg_auto_moderate_reviews ON public.reviews;
CREATE TRIGGER trg_auto_moderate_reviews
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_content();

DROP TRIGGER IF EXISTS zz_trg_detect_banned_rejoin ON auth.users;
CREATE TRIGGER zz_trg_detect_banned_rejoin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.detect_banned_rejoin();

-- 우회 구간 종료 — 이벤트 트리거 원상복구
ALTER EVENT TRIGGER auto_secure_function_trigger ENABLE;
