
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  {
    href: '/',
    label: '홈',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active ? 'M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v7a2 2 0 002 2h4v-5h4v5h4a2 2 0 002-2v-7h1a1 1 0 00.707-1.707l-7-7z' : 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'} />
      </svg>
    ),
  },
  {
    href: '/gallery',
    label: '클립',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={active ? 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' : 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'} />
      </svg>
    ),
  },
  {
    href: '/vs',
    label: 'VS',
    icon: (active: boolean) => (
      <div className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${active ? 'bg-[#8B5CF6] text-white' : 'bg-gray-200 text-gray-600'}`}>
        VS
      </div>
    ),
  },
  {
    href: '/community',
    label: '커뮤니티',
    matchPrefixes: ['/community'],
    icon: (active: boolean) => (
      <div className="relative">
        <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="absolute -top-1 -right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
      </div>
    ),
  },
  {
    href: '/profile',
    label: '마이',
    fallbackHref: '/login',
    icon: (active: boolean) => (
      <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.href === '/' && pathname === '/') return true;
    if (tab.href === '/' && pathname !== '/') return false;
    if ('matchPrefixes' in tab && tab.matchPrefixes) {
      return tab.matchPrefixes.some((p: string) => pathname.startsWith(p));
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 bg-white border-t border-gray-200 pb-safe md:hidden" style={{ boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-around px-1" style={{ height: 56 }}>
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[56px] ${
                active ? 'text-[#8B5CF6]' : 'text-[#555]'
              }`}
              style={{ minHeight: 44 }}
            >
              <span className={active ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]' : ''}>
                {tab.icon(active)}
              </span>
              <span className={`text-xs ${active ? 'font-bold text-[#8B5CF6]' : 'font-medium text-[#555]'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
