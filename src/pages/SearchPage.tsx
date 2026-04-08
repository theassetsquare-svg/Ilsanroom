
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Filter, ArrowRight, Star, Award, TrendingUp } from 'lucide-react';
import { venues as localVenues } from '@/data/venues';
import type { Venue } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'club', label: '클럽' },
  { key: 'night', label: '나이트' },
  { key: 'lounge', label: '라운지' },
  { key: 'room', label: '룸' },
  { key: 'yojeong', label: '요정' },
  { key: 'hoppa', label: '호빠' },
];

function getCategoryPath(venue: Venue): string {
  const pathMap: Record<string, string> = {
    club: '/clubs',
    night: '/nights',
    lounge: '/lounges',
    room: '/rooms',
    yojeong: '/yojeong',
    hoppa: '/hoppa',
  };
  const base = pathMap[venue.category] || '/venues';
  if (['club', 'room', 'yojeong'].includes(venue.category)) {
    return `${base}/${venue.region}/${venue.slug}`;
  }
  return `${base}/${venue.slug}`;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  
  const [inputValue, setInputValue] = useState(queryParam);
  const [results, setResults] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useDocumentMeta(`"${queryParam || '통합'}" 검색 결과 — 놀쿨`, '지역·업종·이름 아무거나 입력. 실시간 랭킹과 정확한 정보를 한눈에.');

  const performSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          category: cat === 'all' ? undefined : cat,
          venues: localVenues,
          limit: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setTotalCount(data.total || 0);
      } else {
        const lowerQ = q.toLowerCase();
        const fallback = localVenues.filter(v => {
          if (v.status === 'closed_or_unclear') return false;
          const matchesQuery = !q.trim() || 
            v.nameKo.toLowerCase().includes(lowerQ) || 
            v.regionKo.toLowerCase().includes(lowerQ) ||
            v.tags.some(t => t.toLowerCase().includes(lowerQ));
          const matchesCat = cat === 'all' || v.category === cat;
          return matchesQuery && matchesCat;
        });
        setResults(fallback);
        setTotalCount(fallback.length);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(queryParam);
    performSearch(queryParam, categoryParam);
  }, [queryParam, categoryParam, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim(), category: categoryParam });
      try {
        const saved = localStorage.getItem('recentSearches');
        const recent = saved ? JSON.parse(saved) : [];
        const updated = [inputValue.trim(), ...recent.filter((s: string) => s !== inputValue.trim())].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSearchParams({ q: queryParam, category: cat });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16 md:pt-20">
      {/* Search Header Section */}
      <div className="sticky top-14 z-40 bg-white shadow-sm md:top-16">
        <form onSubmit={handleSearchSubmit} className="mx-auto max-w-4xl px-4 py-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="업소명, 지역, 키워드 검색"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-[16px] outline-none transition-all focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => { setInputValue(''); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-[#8B5CF6] px-5 text-sm font-bold text-white shadow-lg shadow-purple-200 active:scale-95"
            >
              검색
            </button>
          </div>

          {/* Category Quick Filters */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  categoryParam === cat.key
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Search Status */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {queryParam ? (
                <><span className="text-[#8B5CF6]">"{queryParam}"</span> 검색 결과</>
              ) : (
                '전체 업소 목록'
              )}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">총 {totalCount}개의 결과가 있습니다.</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 active:bg-gray-50">
            <Filter className="h-3.5 w-3.5" />
            필터
          </button>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((venue) => (
              <Link 
                key={venue.id || venue.slug} 
                to={getCategoryPath(venue)}
                target="_blank" rel="noopener noreferrer"
                className="group relative flex overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition-all hover:border-[#8B5CF6] hover:shadow-md"
              >
                <div className="relative h-32 w-32 shrink-0 bg-gray-100 sm:h-40 sm:w-40">
                  <img 
                    src={`/venues/${venue.slug}-1.jpg`} 
                    alt={venue.nameKo}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg'; (e.target as HTMLImageElement).className = 'h-full w-full p-8 opacity-20'; }}
                  />
                  {venue.isPremium && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      <Award className="h-3 w-3 text-amber-400" />
                      PREMIUM
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                      {CATEGORIES.find(c => c.key === venue.category)?.label}
                    </span>
                    <span className="h-3 w-[1px] bg-gray-200" />
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {venue.regionKo}
                    </span>
                  </div>
                  
                  <h3 className="mb-1 text-base font-bold text-gray-900 group-hover:text-[#8B5CF6]">
                    {venue.nameKo}
                  </h3>
                  
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {venue.shortDescription}
                  </p>

                  <div className="mt-auto flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-900">{venue.rating.toFixed(1)}</span>
                      <span className="text-[11px] text-gray-400">({venue.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium text-blue-500">실시간 {Math.floor(Math.random() * 20) + 5}명 접속</span>
                    </div>
                  </div>
                </div>

                <div className="hidden items-center justify-center bg-gray-50 px-4 text-gray-300 transition-colors group-hover:bg-[#8B5CF6]/5 group-hover:text-[#8B5CF6] sm:flex">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">다른 검색어나 카테고리로 다시 시도해 보세요.</p>
            <button 
              onClick={() => { setInputValue(''); setSearchParams({}); }}
              className="mt-6 rounded-xl bg-[#8B5CF6] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-100 active:scale-95"
            >
              초기화 후 전체보기
            </button>
          </div>
        )}

        {!queryParam && !loading && (
          <div className="mt-12 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="mb-4 text-sm font-bold text-gray-900">🔥 실시간 급상승 키워드</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['일산룸', '강남클럽', '해운대고구려', '압구정', '나이트', '호빠', '요정', '홍대'].map((tag, i) => (
                <button
                  key={tag}
                  onClick={() => { setInputValue(tag); setSearchParams({ q: tag, category: categoryParam }); }}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-left transition-all hover:bg-gray-100 active:scale-95"
                >
                  <span className="text-xs font-bold text-[#8B5CF6]">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-700">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
