/**
 * 인증 처리 — Supabase OAuth 프록시
 * POST /api/auth
 *
 * 환경변수 (Cloudflare 대시보드):
 *   SUPABASE_URL       — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_KEY — Supabase service_role 키 (서버 전용, anon 키 아님!)
 *
 * Actions:
 *   { action: "verify", token: string }         — 세션 토큰 검증
 *   { action: "profile", token: string }        — 유저 프로필 조회
 *   { action: "delete-account", token: string } — 계정 삭제
 *   { action: "logout", token: string }         — 세션 무효화
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface AuthRequest {
  action: 'verify' | 'profile' | 'delete-account' | 'logout';
  token: string;
}

async function supabaseAdmin(env: Env, path: string, options: RequestInit = {}) {
  const url = `${env.SUPABASE_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      ...((options.headers as Record<string, string>) || {}),
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return Response.json(
      { error: '인증 서비스가 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  let body: AuthRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { action, token } = body;
  if (!action || !token) {
    return Response.json({ error: 'action과 token이 필요합니다.' }, { status: 400 });
  }

  try {
    // Verify token → get user
    const userRes = await supabaseAdmin(context.env, '/auth/v1/user', {
      headers: { 'Authorization': `Bearer ${token}` } as Record<string, string>,
    });

    if (!userRes.ok) {
      return Response.json({ error: '유효하지 않은 세션입니다. 다시 로그인해주세요.' }, { status: 401 });
    }

    const user = await userRes.json() as { id: string; email?: string; user_metadata?: Record<string, unknown> };

    switch (action) {
      case 'verify':
        return Response.json({
          valid: true,
          userId: user.id,
          email: user.email,
        });

      case 'profile':
        return Response.json({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar: user.user_metadata?.avatar_url || null,
          provider: user.user_metadata?.provider || null,
        });

      case 'delete-account': {
        const deleteRes = await supabaseAdmin(context.env, `/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
        });
        if (!deleteRes.ok) {
          console.error('Delete account error:', await deleteRes.text());
          return Response.json({ error: '계정 삭제에 실패했습니다.' }, { status: 500 });
        }
        return Response.json({ success: true, message: '계정이 삭제되었습니다.' });
      }

      case 'logout': {
        const logoutRes = await supabaseAdmin(context.env, '/auth/v1/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` } as Record<string, string>,
        });
        if (!logoutRes.ok) {
          console.error('Logout error:', await logoutRes.text());
        }
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
    }
  } catch (err) {
    console.error('Auth error:', err);
    return Response.json({ error: '인증 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
