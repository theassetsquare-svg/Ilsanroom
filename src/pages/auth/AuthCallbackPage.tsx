import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { useEngagementStore } from '@/lib/engagement-store';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const resetStore = useEngagementStore((s) => s.reset);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      navigate('/login');
      return;
    }

    const handleSession = (session: any) => {
      clearTimeout(fallbackTimer);
      clearTimeout(retryTimer);
      if (!session) {
        navigate('/login');
        return;
      }
      const userId = session.user?.id;
      try {
        const savedUserId = localStorage.getItem('nolcool_user_id');
        if (!savedUserId || savedUserId !== userId) {
          localStorage.setItem('nolcool_user_id', userId);
          if (resetStore) resetStore();
        }
      } catch (_) {}
      navigate('/');
    };

    // 절대 타임아웃: 5초 안에 세션 없으면 무조건 로그인 페이지로
    const fallbackTimer = setTimeout(() => navigate('/login'), 5000);
    let retryTimer: ReturnType<typeof setTimeout>;

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          handleSession(session);
        } else {
          retryTimer = setTimeout(() => {
            supabase.auth.getSession()
              .then(({ data: { session: s } }) => handleSession(s))
              .catch(() => navigate('/login'));
          }, 1500);
        }
      })
      .catch(() => navigate('/login'));

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(retryTimer);
    };
  }, [navigate, resetStore]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neon-primary border-t-transparent" />
        <p className="text-sm text-neon-text-muted">로그인 처리 중...</p>
      </div>
    </div>
  );
}
