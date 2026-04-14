
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { venues as localVenues } from '@/data/venues';
import type { Venue } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const fallbackGradient: Record<string, string> = {
  club: 'from-violet-500 to-indigo-700',
  night: 'from-blue-500 to-purple-700',
  lounge: 'from-amber-500 to-orange-700',
  room: 'from-rose-500 to-pink-700',
  yojeong: 'from-emerald-500 to-teal-700',
  hoppa: 'from-pink-500 to-rose-700',
};

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
    <div className="min-h-screen bg-gray-50">
      {/* Search Header Section */}
      <div className="sticky top-[88px] z-40 bg-white shadow-sm">
        <form onSubmit={handleSearchSubmit} action="/search" method="get" role="search" className="mx-auto max-w-4xl px-4 py-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="search"
                name="q"
                enterKeyHint="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="업소명, 지역, 키워드 검색"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-[16px] outline-none transition-all focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-[#8B5CF6]/10 [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
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

        {/* Results Grid — 1:1 카드, 모든 페이지 동일 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full animate-pulse rounded-xl bg-white shadow-sm" style={{ aspectRatio: '1/1' }} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((venue) => (
              <Link
                key={venue.id || venue.slug}
                to={getCategoryPath(venue)}
                target="_blank" rel="noopener noreferrer"
                className="block"
              >
                <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    <img
                      src={`/venues/${venue.slug}-1.jpg`}
                      alt={venue.nameKo}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover z-[1]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Fallback */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${fallbackGradient[venue.category] || 'from-gray-500 to-gray-700'}`}>
                      <span className="text-3xl">{catEmoji[venue.category] || '🎵'}</span>
                      <span className="mt-1 text-xs font-bold text-white/80">{venue.nameKo.slice(0, 4)}</span>
                    </div>
                    {/* PREMIUM 뱃지 */}
                    {venue.isPremium && (
                      <span className="absolute top-2 left-2 z-[2] rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                        PREMIUM
                      </span>
                    )}
                    {/* 하단 업소명 — 솔리드 검정 배경 */}
                    <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-2">
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
                      <p className="text-[11px] text-white/90 truncate">{catLabel[venue.category] || venue.category} · {venue.regionKo}</p>
                    </div>
                  </div>
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
