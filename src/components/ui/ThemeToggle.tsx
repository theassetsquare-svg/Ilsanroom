'use client';

/**
 * ThemeToggle placeholder.
 * Currently dark mode only. This component is reserved for future
 * light/dark toggle functionality.
 */
export default function ThemeToggle() {
  return (
    <button
      className="rounded-lg p-2 text-neon-text-muted transition-colors hover:bg-neon-surface-2 hover:text-neon-text"
      aria-label="테마 변경 (준비 중)"
      title="다크 모드 전용"
      disabled
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
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
