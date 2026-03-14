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
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-center">
        <div>
          <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">심각한 오류가 발생했습니다</h2>
          <p className="mb-6 text-neutral-400">서비스에 일시적인 문제가 있습니다.</p>
          <button
            onClick={reset}
            className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
