import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase';

// 운영자 1인용 게이트 — 비밀번호 1회 입력으로 모든 /admin/* 진입.
// Supabase 로그인 화면을 띄우지 않음. 백그라운드에서 자동 사인인하여 RLS(`is_admin()`) 통과.
const ADMIN_PIN = 'nolcool2026';
const ADMIN_EMAIL = 'theassetsquare@gmail.com';
const ADMIN_PW = 'asd9048asd!!';
const SS_KEY = 'nolcool_admin_auth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  group: 'CMS' | '운영' | '분석';
}

const NAV: NavItem[] = [
  { to: '/admin', label: '대시보드', icon: '🏠', group: 'CMS' },
  { to: '/admin/venues', label: '업소 관리', icon: '🏢', group: 'CMS' },
  { to: '/admin/magazine', label: '매거진', icon: '📰', group: 'CMS' },
  { to: '/admin/media', label: '미디어 라이브러리', icon: '🖼', group: 'CMS' },
  { to: '/admin/blocks', label: '페이지 블록', icon: '🧩', group: 'CMS' },
  { to: '/admin/seo', label: 'SEO 메타', icon: '🔎', group: 'CMS' },
  { to: '/admin/moderation', label: '모더레이션', icon: '🛡', group: '운영' },
  { to: '/admin/stats', label: '통계', icon: '📊', group: '분석' },
  { to: '/admin/visitors', label: '방문자 분석', icon: '👥', group: '분석' },
];

async function ensureAdminSignedIn(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.email === ADMIN_EMAIL) return;
  await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PW });
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SS_KEY) === 'true'; } catch { return false; }
  });
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // 게이트 통과 시 백그라운드 자동 사인인 (DB 쓰기용)
  useEffect(() => {
    if (authed) {
      ensureAdminSignedIn().catch(() => { /* 실패해도 UI는 보임 */ });
    }
  }, [authed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      try { sessionStorage.setItem(SS_KEY, 'true'); } catch { /* noop */ }
      setAuthed(true);
      setErr('');
    } else {
      setErr('비밀번호가 틀립니다');
      setPin('');
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-neon-border bg-neon-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-bg">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="mb-1 text-lg font-bold text-neon-text">관리자 인증</h1>
          <p className="mb-6 text-sm text-neon-text-muted">관리자 비밀번호를 입력하세요</p>
          <form onSubmit={submit}>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setErr(''); }}
              placeholder="비밀번호"
              autoFocus
              className={`mb-3 w-full rounded-xl border px-4 py-3 text-center text-sm outline-none ${err ? 'border-red-500' : 'border-neon-border'} bg-neon-bg-base text-neon-text`}
              style={{ minHeight: 48 }}
            />
            {err && <p className="mb-3 text-xs text-red-400">{err}</p>}
            <button
              type="submit"
              disabled={!pin.trim()}
              className="w-full rounded-xl bg-neon-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ minHeight: 48 }}
            >
              확인
            </button>
          </form>
          <Link to="/" className="mt-4 inline-block text-xs text-neon-text-muted">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

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
        <button
          type="button"
          onClick={() => {
            try { sessionStorage.removeItem(SS_KEY); } catch { /* noop */ }
            setAuthed(false);
          }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neon-text-muted hover:bg-neon-bg hover:text-neon-text"
        >
          <span>🚪</span> 잠금
        </button>
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
