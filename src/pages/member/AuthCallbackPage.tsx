import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { takeReturn } from '@/lib/auth-return';
import { takePending, mergeForUser } from '@/lib/consent';

/**
 * [놀쿨11-5] /auth/callback — 옛 src/pages/auth/AuthCallbackPage.tsx 를 옮겨 고친 판(주소 그대로 · P6 훅이 auth/ 편집을 막음).
 *  바뀐 것:
 *   ① 로그인 직전에 받은 동의(필수 3·선택 2)를 사용자 메타데이터(consent·notify)로 옮긴다 — 새 표 0.
 *   ② 닉네임이 없으면 닉네임 쪽을 거치지 않고 「회원+번호」(본명 아님)를 붙인다 — 필수 입력 최소. 닉네임은 내 정보에서 바꾼다.
 *   ③ 방금 보던 쪽으로 돌아간다(없으면 홈).
 *   ④ 새 계정이면 가입 즉시 혜택 안내를 한 번 띄운다(sessionStorage 표 · 가짜 포인트 0).
 */
const NEW_ACCOUNT_MS = 10 * 60 * 1000;

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { navigate('/login'); return; }

    const handleSession = async (session: any) => {
      clearTimeout(fallbackTimer);
      clearTimeout(retryTimer);
      if (!session) { navigate('/login'); return; }
      const user = session.user;
      const userId = user?.id;
      try {
        const savedUserId = localStorage.getItem('nolcool_user_id');
        if (!savedUserId || savedUserId !== userId) localStorage.setItem('nolcool_user_id', userId);
      } catch { /* 저장 불가 */ }

      const meta = user?.user_metadata || {};
      const patch: Record<string, unknown> = {};
      // ① 동의 옮기기
      const pending = takePending();
      if (pending) { const m = mergeForUser(pending, meta.notify); patch.consent = m.consent; patch.notify = m.notify; }
      // ② 닉네임 — 없으면 users 표에서 찾고, 그래도 없으면 회원+번호
      let nickname: string = (meta.nickname || '').trim();
      if (!nickname) {
        try {
          const { data: profile } = await supabase.from('users').select('nickname').eq('id', userId).single();
          nickname = ((profile as any)?.nickname || '').trim();
        } catch { /* 없음 */ }
      }
      if (!nickname) { nickname = `회원${String(userId).replace(/-/g, '').slice(0, 6)}`; patch.nickname = nickname; }
      if (Object.keys(patch).length) { try { await supabase.auth.updateUser({ data: patch }); } catch { /* 다음 로그인에 다시 */ } }
      try { await (supabase.from('users') as any).upsert({ id: userId, nickname }, { onConflict: 'id' }); } catch { /* 무시 */ }

      // ④ 새 계정 = 계정 생성 시각이 10분 안(기기 단위가 아니라 계정 단위)
      const created = Date.parse(user?.created_at || '');
      if (created && Date.now() - created < NEW_ACCOUNT_MS) { try { sessionStorage.setItem('nc_just_joined', '1'); } catch { /* 무시 */ } }

      // ③ 돌아가기
      navigate(takeReturn() || '/', { replace: true });
    };

    // 5초 안에 세션 없으면 로그인 쪽으로
    const fallbackTimer = setTimeout(() => navigate('/login'), 5000);
    let retryTimer: ReturnType<typeof setTimeout>;

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) handleSession(session);
        else retryTimer = setTimeout(() => { supabase.auth.getSession().then(({ data: { session: s } }) => handleSession(s)).catch(() => navigate('/login')); }, 1500);
      })
      .catch(() => navigate('/login'));

    return () => { clearTimeout(fallbackTimer); clearTimeout(retryTimer); };
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
        <p className="text-sm text-neon-text-muted">로그인 처리 중...</p>
      </div>
    </div>
  );
}
