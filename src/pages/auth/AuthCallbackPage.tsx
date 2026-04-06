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
      navigate('/');
      return;
    }

    const handleSession = (session: any) => {
      if (!session) return;
      const userId = session.user?.id;
      const savedUserId = localStorage.getItem('nolcool_user_id');

      // 처음 로그인하는 유저 → 포인트 0으로 초기화
      if (!savedUserId || savedUserId !== userId) {
        localStorage.setItem('nolcool_user_id', userId);
        if (resetStore) resetStore();
      }
      navigate('/');
    };

    let timer: ReturnType<typeof setTimeout>;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session);
      } else {
        timer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) handleSession(s);
            else navigate('/login');
          });
        }, 1000);
      }
    });
    return () => clearTimeout(timer);
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
