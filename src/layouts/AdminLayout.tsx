import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

interface NavItem {
  to: string;
  label: string;
  icon: string;
  group: 'CMS' | '운영' | '분석';
}

const NAV: NavItem[] = [
  // CMS
  { to: '/admin', label: '대시보드', icon: '🏠', group: 'CMS' },
  { to: '/admin/venues', label: '업소 관리', icon: '🏢', group: 'CMS' },
  { to: '/admin/magazine', label: '매거진', icon: '📰', group: 'CMS' },
  { to: '/admin/media', label: '미디어 라이브러리', icon: '🖼', group: 'CMS' },
  { to: '/admin/blocks', label: '페이지 블록', icon: '🧩', group: 'CMS' },
  { to: '/admin/seo', label: 'SEO 메타', icon: '🔎', group: 'CMS' },
  // 운영
  { to: '/admin/moderation', label: '모더레이션', icon: '🛡', group: '운영' },
  // 분석
  { to: '/admin/stats', label: '통계', icon: '📊', group: '분석' },
  { to: '/admin/visitors', label: '방문자 분석', icon: '👥', group: '분석' },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div className="p-8 text-center text-sm text-neon-text-muted">로딩...</div>;
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-sm text-neon-text-muted">로그인 필요</p>
        <Link to="/login" className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white">로그인</Link>
      </div>
    );
  }
  if (!isAdmin) return <div className="p-8 text-center text-sm text-red-400">관리자 권한 필요 ({user.email})</div>;

  const groups: Array<NavItem['group']> = ['CMS', '운영', '분석'];

  const navList = (
    <nav className="space-y-4">
      {groups.map(g => (
        <div key={g}>
          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-neon-text-muted/60">{g}</p>
          <ul>
            {NAV.filter(n => n.group === g).map(n => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === '/admin'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-neon-primary/15 text-neon-primary-light font-bold'
                        : 'text-neon-text/80 hover:bg-neon-bg hover:text-neon-text'
                    }`
                  }
                >
                  <span className="text-base">{n.icon}</span>
                  <span>{n.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="border-t border-neon-border pt-4">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neon-text/80 hover:bg-neon-bg hover:text-neon-text"
        >
          <span>↗</span> 사이트 보기
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-neon-bg-base">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden w-60 shrink-0 border-r border-neon-border bg-neon-surface md:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
          <div className="mb-4 px-3">
            <p className="text-base font-bold text-neon-text">놀쿨 관리자</p>
            <p className="mt-0.5 truncate text-[11px] text-neon-text-muted">{user.email}</p>
          </div>
          {navList}
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-neon-border bg-neon-surface px-4 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="메뉴 열기"
          className="rounded-lg p-2 text-neon-text hover:bg-neon-bg"
        >
          ☰
        </button>
        <p className="text-sm font-bold text-neon-text">놀쿨 관리자</p>
        <Link to="/" target="_blank" rel="noopener noreferrer" className="text-xs text-neon-primary-light">↗</Link>
      </div>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80%] overflow-y-auto bg-neon-surface p-4">
            <div className="mb-4 flex items-center justify-between px-3">
              <p className="text-base font-bold text-neon-text">관리자</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-neon-text-muted">✕</button>
            </div>
            {navList}
          </aside>
        </div>
      )}

      <main className="flex-1 pt-12 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
