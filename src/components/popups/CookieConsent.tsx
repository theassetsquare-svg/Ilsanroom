'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it slides in after page load
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="animate-slide-in-right fixed bottom-0 left-0 right-0 z-[90] p-4">
      <div className="glass-strong mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-2xl border border-neon-border px-6 py-4 sm:flex-row">
        <p className="flex-1 text-sm text-neon-text-muted">
          이 웹사이트는 더 나은 서비스를 위해 쿠키를 사용합니다.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="text-sm text-neon-primary-light transition-colors hover:text-neon-primary"
          >
            자세히 보기
          </Link>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-neon-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-primary-light"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
