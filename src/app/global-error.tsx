'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center px-4 text-center" style={{ backgroundColor: '#07070D', color: '#E8E8F0' }}>
        <div>
          <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <svg className="h-10 w-10" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold">심각한 오류가 발생했습니다</h2>
          <p className="mb-6" style={{ color: '#9898B0' }}>서비스에 일시적인 문제가 있습니다.</p>
          <button
            onClick={reset}
            className="rounded-xl px-6 py-3 font-medium text-white transition"
            style={{ backgroundColor: '#8B5CF6' }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
