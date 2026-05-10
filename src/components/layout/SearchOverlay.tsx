

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '../ui/SafeLink';
import { venues as localVenues } from '@/data/venues';
import type { Venue } from '@/types';

const popularTerms = [
  '일산룸',
  '일산명월관요정',
  '강남청담클럽',
  '압구정클럽',
  '강남호빠',
  '부산나이트',
  '수원나이트',
  '해운대고구려',
];

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
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

  const CAT_KW: Record<string, string> = {
    '클럽': 'club', '나이트': 'night', '나이트클럽': 'night', '라운지': 'lounge',
    '룸': 'room', '룸싸롱': 'room', '요정': 'yojeong', '호빠': 'hoppa', '호스트바': 'hoppa', '고구려': 'night',
  };
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const qn = norm(q);
    let detectedCat = '';
    let residual = qn;
    for (const [kw, code] of Object.entries(CAT_KW).sort((a, b) => b[0].length - a[0].length)) {
      if (residual.includes(norm(kw))) { if (!detectedCat) detectedCat = code; residual = residual.replace(norm(kw), ''); }
    }
    const scored = localVenues.filter(v => v.status !== 'closed_or_unclear').map(v => {
      let score = 0;
      const nk = norm(v.nameKo); const rk = norm(v.regionKo);
      if (nk === qn) score += 1000;
      else if (nk.startsWith(qn)) score += 600;
      else if (nk.includes(qn)) score += 300;
      if (v.tags?.some(t => norm(t) === qn)) score += 500;
      if (v.tags?.some(t => norm(t).includes(qn))) score += 150;
      if (detectedCat && v.category === detectedCat) score += 200;
      if (residual && (rk.includes(residual) || residual.includes(rk))) score += 200;
      if (residual && nk.includes(residual)) score += 150;
      if (v.description?.toLowerCase().includes(q.toLowerCase())) score += 30;
      if (qn.length >= 2 && score === 0) {
        for (let len = Math.min(qn.length, nk.length); len >= 2; len--) {
          let found = false;
          for (let i = 0; i <= qn.length - len; i++) { if (nk.includes(qn.substring(i, i + len))) { score += len * 15; found = true; break; } }
          if (found) break;
        }
      }
      if (v.isPremium) score += 20;
      return { venue: v, score };
    });
    const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    setResults(filtered.slice(0, 10).map(s => s.venue));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    let focusTimer: ReturnType<typeof setTimeout>;
    if (open) {
      document.body.style.overflow = 'hidden';
      setQuery('');
      setResults([]);
      focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; clearTimeout(focusTimer); };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-24" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl px-4">
        <div className="mb-4 flex justify-end">
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-neon-text-muted transition-colors hover:text-neon-text" aria-label="검색 닫기">
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
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="업소명, 지역, 카테고리 검색..."
            className="w-full rounded-xl border border-neon-border bg-neon-surface py-4 pr-4 pl-12 text-lg text-neon-text placeholder-[#666] outline-none transition-colors focus:border-neon-primary"
            style={{ WebkitAppearance: 'none' }}
          />
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-neon-border bg-neon-surface">
            {results.map((v) => (
              <Link target="_blank" rel="noopener noreferrer"
                key={v.id || v.slug}
                to={getCategoryHref(v.category, v.slug, v.region)}
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
                  <span className="shrink-0 rounded-full bg-neon-gold/10 px-2 py-0.5 text-xs font-bold text-neon-gold">PREMIUM</span>
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
