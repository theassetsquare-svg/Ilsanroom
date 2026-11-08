-- ============================================================
-- [고침71-2 2026-11-08] 이메일 가입 닉네임이 public.users 에 안 들어가던 것
--
-- 배경: /login 의 이메일 회원가입은 supabase.auth.signUp(… data: { nickname }) 로 닉네임을
--   raw_user_meta_data->>'nickname' 에 담아 보낸다. 그런데 새 회원 트리거 handle_new_user() 는
--   'name' / 'full_name'(카카오·구글 OAuth 가 주는 열쇠)만 읽어서, 이메일로 가입한 회원의
--   public.users.nickname 이 NULL 로 남았다(2026-10-25 · 10-26 가입 행에 nickname NULL 2건).
--   OAuth 회원은 /auth/callback 이 users 표에 닉네임을 upsert 하지만, 이메일 확인이 꺼진
--   이 프로젝트(mailer_autoconfirm=true)의 이메일 가입은 /auth/callback 을 거치지 않는다.
--
-- 고침: ① 트리거가 nickname → name → full_name 차례로 읽는다
--       ② 이미 가입한 회원 중 nickname 이 비어 있는 행만 auth.users 의 가입 때 메타에서 채운다
--          (WHERE 있음 — pg_safeupdate · scripts/migration-safeupdate-gate.mjs)
--       ③ 트리거 전용 함수의 EXECUTE 권한은 PUBLIC/anon/authenticated 에서 회수(2026-08-17 기준선 유지)
--
-- SECURITY DEFINER 유지 사유: auth.users INSERT 트리거는 supabase_auth_admin 으로 발화하며
--   RLS 가 걸린 public.users 에 시스템 행을 넣어야 한다. search_path 는 고정한다.
-- exec_sql 단일 트랜잭션 — 중간 실패 시 전부 롤백 = 무해.
-- ============================================================

ALTER EVENT TRIGGER auto_rls_trigger DISABLE;
ALTER EVENT TRIGGER auto_secure_function_trigger DISABLE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name'
    )), ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = COALESCE(EXCLUDED.nickname, public.users.nickname),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 이미 가입한 회원 — 닉네임이 비어 있는 행만, 가입 때 적은 닉네임(또는 OAuth 이름)으로 채운다
UPDATE public.users AS u
SET nickname = NULLIF(TRIM(COALESCE(
      a.raw_user_meta_data->>'nickname',
      a.raw_user_meta_data->>'name',
      a.raw_user_meta_data->>'full_name'
    )), '')
FROM auth.users AS a
WHERE a.id = u.id
  AND (u.nickname IS NULL OR TRIM(u.nickname) = '')
  AND NULLIF(TRIM(COALESCE(
      a.raw_user_meta_data->>'nickname',
      a.raw_user_meta_data->>'name',
      a.raw_user_meta_data->>'full_name'
    )), '') IS NOT NULL;

ALTER EVENT TRIGGER auto_rls_trigger ENABLE;
ALTER EVENT TRIGGER auto_secure_function_trigger ENABLE;
