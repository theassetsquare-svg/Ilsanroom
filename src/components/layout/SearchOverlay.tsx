'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { venues as localVenues } from '@/data/venues';
import type { Venue } from '@/types';

const popularTerms = [
  '일산룸',
  '일산요정',
  '강남클럽',
  '강남라운지',
  '강남호빠',
  '부산나이트',
  '수원나이트',
  '부산룸',
];

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
    collatek: `/collatek/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

const catLabelMap: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠',
};

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Venue[]>([]);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    const found = localVenues.filter((v) => {
      if (v.status === 'closed_or_unclear') return false;
      return (
        v.nameKo.toLowerCase().includes(lower) ||
        v.regionKo.toLowerCase().includes(lower) ||
        v.tags.some((t) => t.toLowerCase().includes(lower)) ||
        v.description.toLowerCase().includes(lower)
      );
    });
    setResults(found.slice(0, 10));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-24" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl px-4">
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg p-2 text-neon-text-muted transition-colors hover:text-neon-text" aria-label="검색 닫기">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <svg className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neon-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="업소명, 지역, 카테고리 검색..."
            className="w-full rounded-xl border border-neon-border bg-neon-surface py-4 pr-4 pl-12 text-lg text-neon-text placeholder-neon-text-muted/60 outline-none transition-colors focus:border-neon-primary"
          />
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-neon-border bg-neon-surface">
            {results.map((v) => (
              <Link
                key={v.id || v.slug}
                href={getCategoryHref(v.category, v.slug, v.region)}
                onClick={onClose}
                className="flex items-center gap-3 border-b border-neon-border/50 px-4 py-3 transition-colors hover:bg-neon-surface-2 last:border-b-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-primary/10 text-sm font-bold text-neon-primary">
                  {v.nameKo.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
                  <p className="truncate text-xs text-neon-text-muted">
                    {v.regionKo} · {catLabelMap[v.category] || v.category}
                  </p>
                </div>
                {v.isPremium && (
                  <span className="shrink-0 rounded-full bg-neon-gold/10 px-2 py-0.5 text-[10px] font-bold text-neon-gold">PREMIUM</span>
                )}
              </Link>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="mt-3 rounded-xl border border-neon-border bg-neon-surface p-6 text-center">
            <p className="text-sm text-neon-text-muted">검색 결과가 없습니다</p>
          </div>
        )}

        {/* Popular terms */}
        {!query.trim() && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-neon-text-muted">인기 검색어</h3>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-neon-border bg-neon-surface-2 px-3 py-1.5 text-sm text-neon-text-muted transition-colors hover:border-neon-primary/40 hover:text-neon-text"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
