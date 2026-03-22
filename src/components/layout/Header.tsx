

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchOverlay from './SearchOverlay';
import ScrollProgress from './ScrollProgress';
import { createClient } from '@/lib/supabase';

const navLinks = [
  { href: '/clubs', label: '클럽' },
  { href: '/nights', label: '나이트' },
  { href: '/lounges', label: '라운지' },
  { href: '/rooms', label: '룸' },
  { href: '/yojeong', label: '요정' },
  { href: '/hoppa', label: '호빠' },
  { href: '/community', label: '커뮤니티' },
  { href: '/ranking', label: '랭킹' },
  { href: '/map', label: '지도' },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      <ScrollProgress />
      <header className="glass-strong fixed top-0 right-0 left-0 z-50">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black tracking-wider text-neon-primary">
              밤키
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href}
                to={link.href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              aria-label="검색"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-primary text-xs text-white">
                      {(user.user_metadata?.name || user.email || '?').charAt(0)}
                    </span>
                  )}
                  <span className="max-w-[80px] truncate">{user.user_metadata?.name || '마이'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-2 py-2 text-xs text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text sm:block"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
