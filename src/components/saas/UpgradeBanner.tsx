'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'neon-upgrade-banner-dismissed';

interface UpgradeBannerProps {
  onUpgrade?: () => void;
  onLearnMore?: () => void;
}

export default function UpgradeBanner({ onUpgrade, onLearnMore }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === 'true');
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neon-primary/20 bg-gradient-to-r from-neon-primary/10 to-neon-accent/10 p-4 sm:p-5">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon-primary/5 blur-3xl" />

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Icon + Message */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-primary/20 text-neon-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-neon-text sm:text-base">
            프로 플랜으로 업그레이드하고{' '}
            <span className="text-neon-primary-light">3배 더 많은 노출</span>을 받으세요
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onUpgrade}
            className="rounded-lg bg-gradient-to-r from-neon-primary to-neon-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-neon-primary/20 transition-all duration-200 hover:from-neon-primary-light hover:to-neon-primary"
          >
            업그레이드
          </button>
          <button
            onClick={onLearnMore}
            className="text-sm font-medium text-neon-primary-light transition-colors hover:text-neon-primary"
          >
            자세히
          </button>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
        aria-label="배너 닫기"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
