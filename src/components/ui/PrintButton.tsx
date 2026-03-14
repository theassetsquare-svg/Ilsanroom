'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-neutral-900 px-6 py-2 text-sm text-white transition hover:bg-neutral-800"
    >
      프린트하기
    </button>
  );
}
