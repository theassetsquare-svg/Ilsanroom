'use client';

import { useEffect, useRef } from 'react';

const popularTerms = [
  '일산 룸',
  '일산 요정',
  '강남 클럽',
  '강남 라운지',
  '강남 호빠',
  '부산 나이트',
  '수원 나이트',
  '부산 룸',
];

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-24">
      <div className="w-full max-w-2xl px-4">
        {/* Close button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neon-text-muted transition-colors hover:text-neon-text"
            aria-label="검색 닫기"
          >
            <svg
              className="h-6 w-6"
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

        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neon-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="업소명, 지역, 카테고리 검색..."
            className="w-full rounded-xl border border-neon-border bg-neon-surface py-4 pr-4 pl-12 text-lg text-neon-text placeholder-neon-text-muted/60 outline-none transition-colors focus:border-neon-primary"
          />
        </div>

        {/* Popular terms */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-neon-text-muted">
            인기 검색어
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTerms.map((term) => (
              <button
                key={term}
                className="rounded-full border border-neon-border bg-neon-surface-2 px-3 py-1.5 text-sm text-neon-text-muted transition-colors hover:border-neon-primary/40 hover:text-neon-text"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
