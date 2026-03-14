'use client';

import { useEffect, useState } from 'react';

export default function AgeVerification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (!verified) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age_verified', 'true');
    setShow(false);
    document.body.style.overflow = '';
  };

  const handleExit = () => {
    window.location.href = 'https://www.naver.com';
  };

  if (!show) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop - no click dismiss */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Panel */}
      <div className="glass-strong relative w-full max-w-md rounded-2xl p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <span className="neon-glow text-3xl font-black tracking-wider text-neon-primary">
            일산룸포털
          </span>
        </div>

        {/* Message */}
        <p className="mb-8 text-lg font-medium text-neon-text">
          본 사이트는 만 19세 이상만
          <br />
          이용 가능합니다
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleVerify}
            className="neon-box-glow w-full rounded-xl bg-neon-primary px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-neon-primary-light"
          >
            만 19세 이상입니다
          </button>
          <button
            onClick={handleExit}
            className="w-full rounded-xl border border-neon-border px-6 py-3 text-sm text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
          >
            아닙니다 (나가기)
          </button>
        </div>
      </div>
    </div>
  );
}
