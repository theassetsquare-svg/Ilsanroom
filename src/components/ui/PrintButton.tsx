'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-white px-6 py-2 text-sm text-neon-text transition hover:bg-neon-surface-2 border border-neon-border"
    >
      프린트하기
    </button>
  );
}
