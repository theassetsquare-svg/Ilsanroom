'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neon-red/10">
        <svg className="h-10 w-10 text-neon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-neon-text">문제가 발생했습니다</h2>
      <p className="mb-6 text-neon-text-muted">
        일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-neon-primary px-6 py-3 font-medium text-white transition hover:bg-neon-primary-light"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="rounded-xl border border-neon-border px-6 py-3 font-medium text-neon-text-muted transition hover:bg-neon-surface-2"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
