import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

function useNewPostCount(user: any) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const supabase = createClient();
    if (!supabase) return;
    try {
      const seenAt = localStorage.getItem('community_seen_at') || '0';
      const since = seenAt === '0'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        : new Date(Number(seenAt)).toISOString();
      const { count: c } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since);
      setCount(c ?? 0);
    } catch { /* noop */ }
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);
  // 60초마다 새글 확인
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [user, refresh]);
  return count;
}

const tabs = [
  {
    href: '/',
    label: '홈',
    exact: true,
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/community',
    label: '커뮤니티',
    hasBadge: true,
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/ranking',
    label: '랭킹',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    href: '/gallery',
    label: '클립',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'MY',
    loginFallback: '/login',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const newPostCount = useNewPostCount(user);

  // 커뮤니티 페이지 방문 시 알림 카운트 리셋
  useEffect(() => {
    if (pathname.startsWith('/community')) {
      try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
    }
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-1" style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const href = tab.loginFallback && !user ? tab.loginFallback : tab.href;

          return (
            <Link
              key={tab.href}
              to={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? 'text-[#8B5CF6]' : 'text-gray-500'
              }`}
              style={{ minWidth: 48, minHeight: 44 }}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
              {/* 커뮤니티 새글 알림 */}
              {tab.hasBadge && newPostCount > 0 && (
                <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {newPostCount > 9 ? '9+' : newPostCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
