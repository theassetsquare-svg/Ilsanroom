import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from '../ui/SafeLink';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useNewPosts, type NewPost } from '@/hooks/useNewPosts';

const CATEGORY_LABELS: Record<string, string> = {
  reviews: '리뷰', discussion: '수다', party: '파티', tips: '꿀팁',
  free: '자유', fashion: '패션', jogak: '조각', qna: 'Q&A',
};

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
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { count: newPostCount, posts: newPosts, refresh: refreshPosts } = useNewPosts(user, pathname);

  const markAllRead = useCallback(() => {
    try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
    refreshPosts();
  }, [refreshPosts]);

  // 라우트 변경 시 드롭다운 닫기
  useEffect(() => { setNotifOpen(false); }, [pathname]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handlePostClick = (post: NewPost) => {
    markAllRead();
    setNotifOpen(false);
    navigate(`/community/post/${post.id}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
      {/* 알림 드롭다운 (위로 팝업) */}
      {notifOpen && (
        <div ref={notifRef} className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-[#111]">새 글 알림</span>
            <button onClick={() => { markAllRead(); setNotifOpen(false); }} className="text-xs text-[#8B5CF6] font-medium inline-flex items-center px-2 -mx-2" style={{ minHeight: 32 }}>모두 읽음</button>
          </div>
          {newPosts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">새로운 글이 없습니다</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {newPosts.map((p) => (
                <button key={p.id} onClick={() => handlePostClick(p)} className="w-full text-left flex items-start gap-3 px-4 py-3 active:bg-gray-50 transition border-b border-gray-50 last:border-0">
                  <span className="shrink-0 mt-0.5 inline-flex items-center rounded-md bg-[#F3F0FF] px-1.5 py-0.5 text-[10px] font-bold text-[#8B5CF6]">
                    {CATEGORY_LABELS[p.category] || p.category}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111] truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Link to="/community" onClick={() => { markAllRead(); setNotifOpen(false); }} className="block text-center text-sm font-medium text-[#8B5CF6] py-3 border-t border-gray-100 active:bg-gray-50 transition">
            커뮤니티 전체보기
          </Link>
        </div>
      )}

      <div className="flex items-center justify-around px-1" style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const href = tab.loginFallback && !user ? tab.loginFallback : tab.href;

          // 커뮤니티 탭: 뱃지 클릭 시 드롭다운 토글
          if (tab.hasBadge && newPostCount > 0) {
            return (
              <button
                key={tab.href}
                onClick={() => setNotifOpen((v) => !v)}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                  isActive ? 'text-[#8B5CF6]' : 'text-gray-500'
                }`}
                style={{ minWidth: 48, minHeight: 44 }}
              >
                {tab.icon(isActive)}
                <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {newPostCount > 9 ? '9+' : newPostCount}
                </span>
              </button>
            );
          }

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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
