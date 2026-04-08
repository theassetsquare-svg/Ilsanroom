

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';
import { venues as localVenues } from '@/data/venues';
import { useEngagementStore } from '@/lib/engagement-store';

const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
] as const;

const POPULAR_TAGS = [
  '일산룸', '일산명월관요정', '강남청담클럽', '압구정클럽',
  '강남호빠', '부산나이트', '수원나이트', '해운대고구려',
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

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState<Venue[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const engSearch = useEngagementStore((s) => s.search);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const removeRecentSearch = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = recentSearches.filter(s => s !== q);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Search logic using API
  const performSearch = useCallback(async (q: string, cat: string) => {
    if (!q.trim() && cat === 'all') {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use the POST API for hybrid search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          category: cat === 'all' ? undefined : cat,
          venues: localVenues, // Pass local venues for hybrid search
          limit: 8
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        // Fallback to local search if API fails
        const lowerQ = q.toLowerCase();
        const fallback = localVenues.filter(v => {
          if (v.status === 'closed_or_unclear') return false;
          const matchesQuery = !q.trim() || 
            v.nameKo.toLowerCase().includes(lowerQ) || 
            v.regionKo.toLowerCase().includes(lowerQ);
          const matchesCat = cat === 'all' || v.category === cat;
          return matchesQuery && matchesCat;
        });
        setResults(fallback.slice(0, 8));
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [engSearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() || activeFilter !== 'all') {
        performSearch(query, activeFilter);
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, activeFilter, performSearch]);

  // Handle outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      // Navigate to search page or perform action
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsFocused(false);
      setShowResults(false);
    }
  };

  return (
    <>
      {/* Naver-style Background Overlay — z-[60] > MobileNav z-50 */}
      {isFocused && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity animate-fade-in" />
      )}

      <div ref={wrapperRef} className={`relative mx-auto w-full max-w-2xl z-[70] transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        {/* Search Bar Container */}
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className={`relative flex items-center overflow-hidden rounded-2xl border transition-all duration-300 ${
            isFocused 
              ? 'border-neon-primary bg-neon-surface shadow-[0_0_25px_rgba(0,243,255,0.15)]' 
              : 'border-neon-border bg-neon-surface/80 backdrop-blur-md'
          }`}>
            {/* Search Icon */}
            <div className="flex h-14 items-center justify-center pl-5">
              <svg className={`h-5 w-5 transition-colors ${isFocused ? 'text-neon-primary' : 'text-neon-text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              inputMode="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                setShowResults(true);
              }}
              placeholder="업소, 지역, 키워드 검색"
              className="h-14 w-full bg-transparent px-4 text-base text-neon-text placeholder-[#666] outline-none"
              autoComplete="off"
            />

            {/* Clear Button / Loading */}
            <div className="flex h-14 items-center gap-3 pr-4">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-primary border-t-transparent" />
              ) : query && (
                <button 
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="rounded-full p-1 text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  isFocused ? 'bg-neon-primary text-black shadow-lg shadow-neon-primary/20' : 'bg-neon-surface-2 text-neon-text-muted'
                }`}
              >
                검색
              </button>
            </div>
          </div>

          {/* Naver-style Dropdown Layer — z-[70] > MobileNav z-50 */}
          {showResults && (isFocused || query) && (
            <div className="absolute left-0 right-0 top-full z-[70] mt-3 overflow-hidden rounded-2xl border border-neon-border bg-neon-surface shadow-2xl animate-in slide-in-from-top-2 duration-200" style={{ maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto' }}>
              
              {/* Case 1: Search results available */}
              {query.trim() && results.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-[11px] font-bold tracking-wider text-neon-text-muted uppercase">업소 검색 결과</div>
                  {results.map((v) => (
                    <Link
                      key={v.id || v.slug}
                      to={getCategoryHref(v.category, v.slug, v.region)}
                      onClick={() => {
                        saveRecentSearch(v.nameKo);
                        setIsFocused(false);
                        setShowResults(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neon-surface-2"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-primary/10 text-sm font-bold text-neon-primary">
                        {v.nameKo.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-medium text-neon-text">{v.nameKo}</p>
                          {v.isPremium && <span className="rounded bg-neon-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-neon-gold">PREMIUM</span>}
                        </div>
                        <p className="truncate text-[13px] text-neon-text-muted">
                          {v.regionKo} · {CATEGORY_FILTERS.find(f => f.key === v.category)?.label}
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-neon-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                  <button 
                    onClick={handleSearchSubmit}
                    className="w-full border-t border-neon-border/50 py-3 text-center text-sm font-medium text-neon-primary hover:bg-neon-primary/5 transition-colors"
                  >
                    "{query}" 통합검색 결과 보기
                  </button>
                </div>
              ) : query.trim() && !loading ? (
                <div className="p-8 text-center">
                  <p className="text-neon-text-muted">"{query}"에 대한 검색 결과가 없습니다.</p>
                  <p className="mt-1 text-sm text-neon-text-muted/60">다른 키워드나 지역으로 검색해 보세요.</p>
                </div>
              ) : !query.trim() && (
                /* Case 2: No query, show Recent & Popular (Naver Style) */
                <div className="divide-y divide-neon-border/50">
                  {/* Recent Searches */}
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-neon-text-muted uppercase tracking-wider">최근 검색어</h3>
                      {recentSearches.length > 0 && (
                        <button 
                          onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                          className="text-[11px] text-neon-text-muted hover:text-neon-text"
                        >
                          전체삭제
                        </button>
                      )}
                    </div>
                    {recentSearches.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s, i) => (
                          <div key={i} className="group flex items-center gap-1 rounded-full border border-neon-border bg-neon-surface-2 px-3 py-1.5 text-xs text-neon-text transition-all hover:border-neon-primary/40">
                            <button onClick={() => { setQuery(s); inputRef.current?.focus(); }}>{s}</button>
                            <button 
                              onClick={(e) => removeRecentSearch(e, s)}
                              className="ml-1 text-neon-text-muted hover:text-red-400"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-2 text-sm text-neon-text-muted/60">최근 검색 내역이 없습니다.</p>
                    )}
                  </div>

                  {/* Popular Keywords */}
                  <div className="p-4">
                    <h3 className="mb-3 text-xs font-bold text-neon-text-muted uppercase tracking-wider">인기 추천 키워드</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {POPULAR_TAGS.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => { setQuery(tag); inputRef.current?.focus(); }}
                          className="flex items-center gap-2 rounded-xl border border-neon-border bg-neon-surface/50 p-2 text-left text-xs text-neon-text-muted transition-all hover:border-neon-primary/40 hover:text-neon-text"
                        >
                          <span className={`font-bold ${i < 3 ? 'text-neon-primary' : 'text-neon-text-muted/40'}`}>{i + 1}</span>
                          <span className="truncate">{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Quick Filters (Shown below search when not focused) */}
        {!isFocused && !query && (
          <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setActiveFilter(f.key); setIsFocused(true); inputRef.current?.focus(); }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeFilter === f.key
                    ? 'bg-neon-primary text-black shadow-lg shadow-neon-primary/30'
                    : 'border border-neon-border bg-neon-surface/50 text-neon-text-muted hover:border-neon-primary/50 hover:text-neon-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
