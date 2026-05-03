import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { notify } from '@/lib/notify';
import { trackEvent, setTrackerUser } from '@/lib/visitor-tracker';
import type { User } from '@supabase/supabase-js';

const WELCOMED_KEY = 'nolcool:welcomed';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // 1) 로컬 저장소에서 세션 로드 (빠름, 서버 요청 없음)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setTrackerUser(session?.user?.id ?? null);
      setLoading(false);
    });

    // 2) 세션 변경 감지 — TOKEN_REFRESHED 포함하여 영구 로그인 유지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setTrackerUser(session?.user?.id ?? null);

      // 신규 가입자 첫 SIGNED_IN 시 환영 이메일 1회만 발송 (관리자 알림 + 사용자 환영)
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const welcomedSet = JSON.parse(localStorage.getItem(WELCOMED_KEY) || '[]') as string[];
          if (!welcomedSet.includes(session.user.id)) {
            notify({
              action: 'welcome',
              email: session.user.email || '',
              name: (session.user.user_metadata?.name as string) || (session.user.email?.split('@')[0]) || '회원',
            });
            welcomedSet.push(session.user.id);
            localStorage.setItem(WELCOMED_KEY, JSON.stringify(welcomedSet.slice(-50)));
            // 첫 SIGNED_IN = 가입 전환 이벤트로 추적
            trackEvent('signup', { user_id: session.user.id, provider: session.user.app_metadata?.provider || 'email' });
          } else {
            trackEvent('login', { user_id: session.user.id });
          }
        } catch { /* localStorage 실패 무시 */ }
      }

      // 토큰 갱신 실패 시 자동 재시도 (네트워크 일시 오류 등)
      if (event === 'TOKEN_REFRESHED' && !session) {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            setUser(retrySession?.user ?? null);
          });
        }, 2000);
      }
    });

    // 3) 앱 포그라운드 복귀 시 세션 자동 갱신 (모바일 백그라운드 복귀 대응)
    // 카카오톡 공유 등으로 앱이 잠시 백그라운드로 갔다 오면 세션이 사라지는 문제 방지
    // — getSession()이 null을 반환해도 기존 유저 상태를 즉시 덮어쓰지 않음
    // — 대신 refreshSession()으로 토큰 갱신 시도하고, 그래도 실패하면 null 처리
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser(session.user);
          } else {
            // getSession이 null이면 토큰 갱신 시도 — 네트워크 지연/타이밍 이슈 대응
            supabase.auth.refreshSession().then(({ data: { session: refreshed } }) => {
              if (refreshed?.user) {
                setUser(refreshed.user);
              }
              // refreshSession도 실패하면 기존 상태 유지 (localStorage에 토큰이 있을 수 있음)
            });
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (retryTimer) clearTimeout(retryTimer);
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
