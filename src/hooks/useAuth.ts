import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1) 로컬 저장소에서 세션 로드 (빠름, 서버 요청 없음)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2) 세션 변경 감지 — TOKEN_REFRESHED 포함하여 영구 로그인 유지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // 토큰 갱신 실패 시 자동 재시도 (네트워크 일시 오류 등)
      if (event === 'TOKEN_REFRESHED' && !session) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            setUser(retrySession?.user ?? null);
          });
        }, 2000);
      }
    });

    // 3) 앱 포그라운드 복귀 시 세션 자동 갱신 (모바일 백그라운드 복귀 대응)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return { user, loading, signOut };
}
