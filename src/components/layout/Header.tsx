
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

const menuItems = [
  { icon: '🎵', label: '나이트', href: '/nights' },
  { icon: '🎤', label: '클럽', href: '/clubs' },
  { icon: '🍸', label: '라운지', href: '/lounges' },
  { icon: '💃', label: '룸', href: '/rooms' },
  { icon: '🎶', label: '요정', href: '/yojeong' },
  { icon: '🥂', label: '호빠', href: '/hoppa' },
];

const menuFeatures = [
  { icon: '🔥', label: '실시간 인기', href: '/ranking' },
  { icon: '🆚', label: 'VS 투표', href: '/vs' },
  { icon: '🏆', label: '랭킹', href: '/ranking' },
];

const menuExtra = [
  { icon: '💬', label: '커뮤니티', href: '/community' },
  { icon: '💰', label: '요금제', href: '/pricing' },
  { icon: '⚙️', label: '설정', href: '/help' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* ═══ TOP BAR ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="flex h-14 items-center justify-between px-4 max-w-[1200px] mx-auto">
          {/* Left: Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
            aria-label="메뉴 열기"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-xl tracking-wide text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span>
          </Link>

          {/* Right: Notification + Profile */}
          <div className="flex items-center gap-1">
            <Link
              to="/community"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
              aria-label="알림"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
            </Link>
            <Link
              to={user ? '/profile' : '/login'}
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-gray-100"
              aria-label="프로필"
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" loading="lazy" className="h-7 w-7 rounded-full" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                  <svg className="h-4 w-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HAMBURGER SLIDE-IN MENU ═══ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />

          {/* Menu panel */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-slide-in-left overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-gray-100">
              <span className="text-lg text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#555] active:bg-gray-100"
                aria-label="메뉴 닫기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-gray-100">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" loading="lazy" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6] text-white font-bold">
                      {(user.user_metadata?.name || user.email || '?').charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#111]">{user.user_metadata?.name || '회원'}</p>
                    <p className="text-xs text-[#555]">마이페이지 &rarr;</p>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <svg className="h-5 w-5 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111]">로그인하세요</p>
                    <p className="text-xs text-[#555]">더 많은 기능을 이용해보세요</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Category links */}
            <div className="px-2 py-3">
              <p className="px-3 pb-2 text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">카테고리</p>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#111] active:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100" />

            {/* Features */}
            <div className="px-2 py-3">
              <p className="px-3 pb-2 text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">즐길거리</p>
              {menuFeatures.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#111] active:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100" />

            {/* Extra */}
            <div className="px-2 py-3 pb-8">
              {menuExtra.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#555] active:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
