'use client';

import { useState } from 'react';
import Link from 'next/link';
import MobileNav from './MobileNav';
import SearchOverlay from './SearchOverlay';
import ScrollProgress from './ScrollProgress';

const navLinks = [
  { href: '/clubs', label: '클럽' },
  { href: '/nights', label: '나이트' },
  { href: '/lounges', label: '라운지' },
  { href: '/rooms', label: '룸' },
  { href: '/yojeong', label: '요정' },
  { href: '/hoppa', label: '호빠' },
  { href: '/collatek', label: '콜라텍' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <ScrollProgress />
      <header className="glass-strong fixed top-0 right-0 left-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="neon-glow text-2xl font-black tracking-wider text-neon-primary">
              NEON
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              aria-label="검색"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text md:hidden"
              aria-label="메뉴"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
