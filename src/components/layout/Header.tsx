import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createClient } from '@/lib/supabase';
import { useNewPosts, type NewPost } from '@/hooks/useNewPosts';

/* ── 6종류 업소 카테고리 — 인기순 (헤더 상단 노출) ── */
const categoryTabs = [
  { href: '/clubs', label: '클럽' },
  { href: '/nights', label: '나이트' },
  { href: '/hoppa', label: '호빠' },
  { href: '/lounges', label: '라운지' },
  { href: '/rooms', label: '룸' },
  { href: '/yojeong', label: '요정' },
  { href: '/community', label: '커뮤니티' },
  { href: '/ranking', label: '랭킹' },
];

/* ── 햄버거 메뉴: 카테고리 + 기능 + 기타 ── */
const menuCategories = [
  { icon: '🎵', label: '클럽', href: '/clubs' },
  { icon: '🌙', label: '나이트', href: '/nights' },
  { icon: '🥂', label: '호빠', href: '/hoppa' },
  { icon: '🍸', label: '라운지', href: '/lounges' },
  { icon: '🚪', label: '룸', href: '/rooms' },
  { icon: '🏮', label: '요정', href: '/yojeong' },
];

const menuFeatures = [
  { icon: '💬', label: '커뮤니티', href: '/community' },
  { icon: '🏠', label: '라운지', href: '/lounge' },
  { icon: '✉️', label: '쪽지함', href: '/messages' },
  { icon: '📸', label: '클립', href: '/gallery' },
  { icon: '🔥', label: '랭킹', href: '/ranking' },
  { icon: '🆚', label: 'VS 투표', href: '/vs' },
];

const menuExtra = [
  { icon: '🔍', label: '검색', href: '/search' },
  { icon: '💰', label: '요금제', href: '/pricing' },
  { icon: '⚙️', label: '설정', href: '/help' },
];

const CATEGORY_LABELS: Record<string, string> = {
  reviews: '리뷰', discussion: '수다', party: '파티', tips: '꿀팁',
  free: '자유', fashion: '패션', jogak: '조각', qna: 'Q&A',
};

function NotificationDropdown({ posts, onClose, onMarkRead }: { posts: NewPost[]; onClose: () => void; onMarkRead: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 모바일에서 mousedown은 touch 이벤트와 타이밍이 꼬여 패널 내부 탭도 outside로 잡힘.
    // pointerdown + setTimeout 0으로 이벤트 사이클 한 단계 늦춰 안전하게 닫는다.
    const handler = (e: PointerEvent | MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [onClose]);

  // 패널 내부 탭은 document까지 버블링 시키지 않는다 (iOS Safari z-index 안전장치)
  const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={ref}
      onPointerDownCapture={stop}
      onMouseDownCapture={stop}
      className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-16px)] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[200]"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-bold text-[#111]">새 글 알림</span>
        <button onClick={() => { onMarkRead(); onClose(); }} className="text-xs text-[#8B5CF6] font-medium" style={{ minHeight: 32 }}>모두 읽음</button>
      </div>
      {posts.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">새로운 글이 없습니다</div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/community/post/${p.id}`}
              onClick={() => { onMarkRead(); onClose(); }}
              className="w-full text-left flex items-start gap-3 px-4 py-3 active:bg-gray-100 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
              style={{ minHeight: 56, touchAction: 'manipulation' }}
            >
              <span className="shrink-0 mt-0.5 inline-flex items-center rounded-md bg-[#F3F0FF] px-1.5 py-0.5 text-[10px] font-bold text-[#8B5CF6]">
                {CATEGORY_LABELS[p.category] || p.category}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111] truncate">{p.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link to="/community" onClick={() => { onMarkRead(); onClose(); }} className="block text-center text-sm font-medium text-[#8B5CF6] py-3 border-t border-gray-100 active:bg-gray-100 hover:bg-gray-50 transition">
        커뮤니티 전체보기
      </Link>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { pathname } = useLocation();
  const { count: newPostCount, posts: newPosts, refresh: refreshPosts } = useNewPosts(user, pathname);

  const markAllRead = useCallback(() => {
    try { localStorage.setItem('community_seen_at', String(Date.now())); } catch {}
    refreshPosts();
  }, [refreshPosts]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setMenuOpen(false); setNotifOpen(false); }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isTabActive = (tab: typeof categoryTabs[number]) => {
    return pathname.startsWith(tab.href);
  };

  return (
    <>
      {/* ═══ HEADER — PC: 1줄(로고+6카테고리+아이콘) / 모바일: 2줄 ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto">

          {/* ── PC 헤더: 1줄 ── */}
          <div className="hidden md:flex h-14 items-center justify-between px-4">
            {/* 햄버거 + 로고 */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition"
                aria-label="메뉴 열기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center">
                <span className="text-xl tracking-wide text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span>
              </Link>
            </div>

            {/* 6카테고리 — 중앙 */}
            <nav className="flex items-center gap-1">
              {categoryTabs.map((tab) => {
                const active = isTabActive(tab);
                return (
                  <Link
                    key={tab.href}
                    to={tab.href}
                    className={`relative px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-lg ${
                      active ? 'text-[#8B5CF6] font-bold bg-[#F3F0FF]' : 'text-[#555] hover:text-[#111] hover:bg-gray-50'
                    }`}
                    style={{ minHeight: 40 }}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>

            {/* 검색 + 알림 + 프로필 */}
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/search"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition"
                aria-label="검색"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              {user && (
                <Link
                  to="/messages"
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition"
                  aria-label="쪽지함"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
              )}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition"
                    aria-label="알림"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {newPostCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {newPostCount > 9 ? '9+' : newPostCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <NotificationDropdown posts={newPosts} onClose={() => setNotifOpen(false)} onMarkRead={markAllRead} />
                  )}
                </div>
              )}
              <Link
                to={user ? '/profile' : '/login'}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-50 transition"
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

          {/* ── 모바일 헤더: 2줄 ── */}
          {/* 모바일 1줄: 메뉴 + 로고 + 검색 + 프로필 */}
          <div className="flex md:hidden h-12 items-center justify-between px-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
                aria-label="메뉴 열기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center">
                <span className="text-xl tracking-wide text-[#8B5CF6]" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>놀쿨</span>
              </Link>
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                to="/search"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 active:bg-gray-100"
                aria-label="검색"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              {user && (
                <Link
                  to="/messages"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 active:bg-gray-100"
                  aria-label="쪽지함"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
              )}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 active:bg-gray-100"
                    aria-label="알림"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {newPostCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {newPostCount > 9 ? '9+' : newPostCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <NotificationDropdown posts={newPosts} onClose={() => setNotifOpen(false)} onMarkRead={markAllRead} />
                  )}
                </div>
              )}
              <Link
                to={user ? '/profile' : '/login'}
                className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-gray-100"
                aria-label="프로필"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" loading="lazy" className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                    <svg className="h-3.5 w-3.5 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* 모바일 2줄: 6카테고리 가로 스크롤 */}
          <nav className="flex md:hidden items-center overflow-x-auto scrollbar-hide border-t border-gray-50" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categoryTabs.map((tab) => {
              const active = isTabActive(tab);
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={`relative shrink-0 px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                    active ? 'text-[#8B5CF6] font-bold' : 'text-[#777]'
                  }`}
                  style={{ minHeight: 40 }}
                >
                  {tab.label}
                  {tab.label === '커뮤니티' && newPostCount > 0 && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-[#8B5CF6]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ═══ HAMBURGER SLIDE-IN MENU (PC + 모바일 공용) ═══ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-slide-in-left overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="flex h-12 items-center justify-between px-4 border-b border-gray-100">
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
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3" style={{ minHeight: 44 }}>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" loading="lazy" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5CF6] text-white font-bold">
                      {(user.user_metadata?.name || user.email || '?').charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#111]">{user.user_metadata?.name || '회원'}</p>
                    <p className="text-xs text-[#555]">마이페이지 →</p>
                  </div>
                </Link>
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
              {menuCategories.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#111] active:bg-gray-50 transition-colors"
                  style={{ minHeight: 44 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

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
                  style={{ minHeight: 44 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mx-4 border-t border-gray-100" />

            {/* Extra */}
            <div className="px-2 py-3 pb-8">
              {menuExtra.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#555] active:bg-gray-50 transition-colors"
                  style={{ minHeight: 44 }}
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
