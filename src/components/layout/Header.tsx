'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchOverlay from './SearchOverlay';
import ScrollProgress from './ScrollProgress';
import ThemeToggle from '../ui/ThemeToggle';

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

  return (
    <>
      <ScrollProgress />
      <header className="glass-strong fixed top-0 right-0 left-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="neon-glow text-xl font-black tracking-wider text-neon-primary">
              오늘밤어디
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
              aria-label="검색"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <ThemeToggle />

            {/* Login */}
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text sm:block"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
