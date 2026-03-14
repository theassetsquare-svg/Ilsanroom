'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Venue } from '@/types';
import { venues as localVenues } from '@/data/venues';

const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
] as const;

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

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState<Venue[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search: try Supabase first, fallback to local data
  const search = useCallback(async (q: string, cat: string) => {
    if (!q.trim() && cat === 'all') {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    let searchResults: Venue[] = [];

    try {
      const supabase = createClient();
      if (supabase && q.trim()) {
        const { data } = await supabase
          .from('venues')
          .select('*')
          .or(`name_ko.ilike.%${q}%,region_ko.ilike.%${q}%`)
          .limit(10);

        if (data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          searchResults = (data as any[]).map((d) => ({
            id: d.id,
            slug: d.slug,
            name: d.name,
            nameKo: d.name_ko,
            category: d.category as Venue['category'],
            region: d.region,
            regionKo: d.region_ko,
            address: d.address || '',
            description: d.description || '',
            shortDescription: d.short_description || '',
            features: d.features || [],
            atmosphere: d.atmosphere || [],
            ageGroup: d.age_group || '',
            dressCode: d.dress_code || '',
            bestTime: d.best_time || '',
            parking: d.parking || '',
            nearbyStation: d.nearby_station || '',
            imageUrl: d.image_url || '',
            rating: d.rating || 0,
            reviewCount: d.review_count || 0,
            isPremium: d.is_premium || false,
            isVerified: d.is_verified || false,
            status: (d.status || 'unknown') as Venue['status'],
            openHours: d.open_hours || '',
            tags: d.tags || [],
            staffNickname: d.staff_nickname || undefined,
            staffPhone: d.staff_phone || undefined,
            district: d.district || undefined,
          }));
        }
      }
    } catch {
      // Supabase unavailable, use local fallback
    }

    // Fallback to local data
    if (searchResults.length === 0) {
      const lowerQ = q.toLowerCase();
      searchResults = localVenues.filter((v) => {
        if (v.status === 'closed_or_unclear') return false;
        const matchesQuery = !q.trim() ||
          v.nameKo.toLowerCase().includes(lowerQ) ||
          v.regionKo.toLowerCase().includes(lowerQ) ||
          v.tags.some((t) => t.toLowerCase().includes(lowerQ)) ||
          v.description.toLowerCase().includes(lowerQ);
        const matchesCat = cat === 'all' || v.category === cat;
        return matchesQuery && matchesCat;
      });
    } else if (cat !== 'all') {
      searchResults = searchResults.filter((v) => v.category === cat);
    }

    setResults(searchResults.slice(0, 8));
    setShowResults(true);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() || activeFilter !== 'all') {
        search(query, activeFilter);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeFilter, search]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleResultClick = (venue: Venue) => {
    setShowResults(false);
    setQuery('');
    router.push(getCategoryHref(venue.category, venue.slug, venue.region));
  };

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neon-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() || activeFilter !== 'all') setShowResults(true); }}
          placeholder="업소명, 지역으로 검색 (예: 일산룸, 강남클럽)"
          className="w-full rounded-2xl border border-neon-border bg-neon-surface/80 py-4 pl-12 pr-4 text-neon-text placeholder-neon-text-muted/60 outline-none backdrop-blur-sm transition-all focus:border-neon-primary/50 focus:shadow-lg focus:shadow-neon-primary/10"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === f.key
                ? 'bg-neon-primary text-white shadow-md shadow-neon-primary/20'
                : 'border border-neon-border bg-neon-surface/50 text-neon-text-muted hover:border-neon-primary/40 hover:text-neon-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neon-border bg-neon-surface/95 shadow-2xl backdrop-blur-lg animate-fade-in">
          {results.map((v) => (
            <button
              key={v.id || v.slug}
              onClick={() => handleResultClick(v)}
              className="flex w-full items-center gap-3 border-b border-neon-border/50 px-4 py-3 text-left transition-colors hover:bg-neon-surface-2 last:border-b-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-primary/10 text-sm font-bold text-neon-primary">
                {v.nameKo.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
                <p className="truncate text-xs text-neon-text-muted">
                  {v.regionKo} · {v.category === 'club' ? '클럽' : v.category === 'night' ? '나이트' : v.category === 'lounge' ? '라운지' : v.category === 'room' ? '룸' : v.category === 'yojeong' ? '요정' : v.category === 'hoppa' ? '호빠' : v.category}
                  {v.staffNickname ? ` · ${v.staffNickname}` : ''}
                </p>
              </div>
              {v.isPremium && (
                <span className="shrink-0 rounded-full bg-neon-gold/10 px-2 py-0.5 text-[10px] font-bold text-neon-gold">PREMIUM</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showResults && query.trim() && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-neon-border bg-neon-surface/95 p-6 text-center shadow-2xl backdrop-blur-lg animate-fade-in">
          <p className="text-sm text-neon-text-muted">검색 결과가 없습니다</p>
          <p className="mt-1 text-xs text-neon-text-muted/60">다른 키워드로 검색해 보세요</p>
        </div>
      )}
    </div>
  );
}
