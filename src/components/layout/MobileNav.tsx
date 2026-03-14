'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/clubs', label: '클럽', icon: '🎵' },
  { href: '/nights', label: '나이트', icon: '🌙' },
  { href: '/lounges', label: '라운지', icon: '🍸' },
  { href: '/rooms', label: '룸', icon: '🚪' },
  { href: '/yojeong', label: '요정', icon: '🏮' },
  { href: '/hoppa', label: '호빠', icon: '🥂' },
  { href: '/collatek', label: '콜라텍', icon: '💃' },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="animate-slide-in-right absolute top-0 right-0 bottom-0 w-72 bg-neon-surface">
        {/* Close button */}
        <div className="flex h-16 items-center justify-between px-4">
          <span className="neon-glow text-lg font-black tracking-wider text-neon-primary">
            NEON
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
            aria-label="닫기"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="px-2 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-neon-border p-4">
          <p className="text-xs text-neon-text-muted/60">
            &copy; 2026 NEON. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
