

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';
import { VenueCardStats } from '@/components/ui/LiveStats';
import { ListMidHook, TopPicksMini } from '@/components/venue/CategoryListingEngagement';
import { hasVenueImage } from '@/data/venue-image-manifest';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCompareList } from '@/hooks/useCompareList';

interface VenueListClientProps {
  venues: Venue[];
  hrefPattern: string;
  regions: { key: string; label: string }[];
  showEngagementHooks?: boolean;
  accentColor?: string;
}

function buildHref(pattern: string, v: Venue): string {
  return pattern.replace('{region}', v.region).replace('{slug}', v.slug);
}

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

const fallbackGradient: Record<string, string> = {
  club: 'from-violet-500 to-indigo-700',
  night: 'from-blue-500 to-purple-700',
  lounge: 'from-amber-500 to-orange-700',
  room: 'from-rose-500 to-pink-700',
  yojeong: 'from-emerald-500 to-teal-700',
  hoppa: 'from-pink-500 to-rose-700',
};

type SortKey = 'premium' | 'name' | 'reviews' | 'bookmarked';

const SORT_LABEL: Record<SortKey, string> = {
  premium: '추천순',
  name: '이름순',
  reviews: '후기많은순',
  bookmarked: '즐겨찾기순',
};

const PAGE_SIZE = 36; // 부동산 정점 패턴 — Zillow·Redfin grid pagination 36

export default function VenueListClient({ venues, hrefPattern, regions, showEngagementHooks = false, accentColor = 'violet' }: VenueListClientProps) {
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('premium');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showTop, setShowTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { isInList: isInCompare, toggle: toggleCompare, isFull: compareFull } = useCompareList();

  /* 폐업·미확인 venue 자동 제외 */
  const CLOSED = new Set(['closed_or_unclear', 'closed', 'permanently_closed', 'temporarily_closed']);
  const openVenues = useMemo(() => venues.filter((v) => !CLOSED.has(String(v.status || ''))), [venues]);

  function inRegion(v: Venue, key: string) {
    if (v.region === key || v.regionKo === key) return true;
    if (v.region.startsWith(key + '-')) return true;
    return false;
  }

  const regionCounts = useMemo(() => {
    const map: Record<string, number> = { all: openVenues.length };
    for (const r of regions) {
      map[r.key] = openVenues.filter((v) => inRegion(v, r.key)).length;
    }
    return map;
  }, [openVenues, regions]);

  const filtered = useMemo(() => {
    let list = openVenues;
    if (regionFilter !== 'all') {
      list = list.filter((v) => inRegion(v, regionFilter));
    }
    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.nameKo.localeCompare(b.nameKo);
      if (sortKey === 'reviews') {
        const ra = a.reviewCount || 0;
        const rb = b.reviewCount || 0;
        if (rb !== ra) return rb - ra;
        return a.nameKo.localeCompare(b.nameKo);
      }
      if (sortKey === 'bookmarked') {
        const ba = isBookmarked(buildHref(hrefPattern, a)) ? 1 : 0;
        const bb = isBookmarked(buildHref(hrefPattern, b)) ? 1 : 0;
        if (ba !== bb) return bb - ba;
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return a.nameKo.localeCompare(b.nameKo);
      }
      // premium (default 추천순)
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return a.nameKo.localeCompare(b.nameKo);
    });
    return list;
  }, [openVenues, regionFilter, sortKey, isBookmarked, hrefPattern]);

  /* 무한 스크롤 — IntersectionObserver로 sentinel 진입 시 +PAGE_SIZE */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE); // 필터/정렬 변경 시 첫 페이지로
  }, [regionFilter, sortKey]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
      }
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  /* 맨 위로 버튼 — 400px 스크롤 후 노출 */
  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeRegionLabel = regionFilter === 'all' ? null : (regions.find((r) => r.key === regionFilter)?.label || regionFilter);

  /* 칩 색상 */
  const accentBg: Record<string, string> = {
    violet: 'bg-violet-600 border-violet-600',
    blue: 'bg-blue-600 border-blue-600',
    amber: 'bg-amber-600 border-amber-600',
    rose: 'bg-rose-600 border-rose-600',
    emerald: 'bg-emerald-600 border-emerald-600',
    pink: 'bg-pink-600 border-pink-600',
  };
  const activeChip = accentBg[accentColor] || accentBg.violet;

  const visibleList = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-venue-list-v2>
      {/* Sticky 필터바 — 부동산 정점 패턴 #1 (Zillow top filter) */}
      <div
        className="sticky top-0 z-[40] -mx-4 px-4 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-gray-100 pt-2 pb-2 mb-3"
      >
        {/* 지역 칩 (시즌63 유지 + sticky 컨테이너로 격상) */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex items-center gap-2 pb-1 whitespace-nowrap" role="tablist" aria-label="지역 필터">
            <button
              type="button"
              role="tab"
              aria-selected={regionFilter === 'all'}
              onClick={() => setRegionFilter('all')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                regionFilter === 'all' ? `${activeChip} text-white` : 'bg-white border-gray-200 text-[#333] hover:border-gray-400'
              }`}
              style={{ minHeight: 36 }}
            >
              전체
              <span className={`inline-block min-w-[18px] rounded-full text-[10px] px-1 ${regionFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#666]'}`}>{regionCounts.all}</span>
            </button>
            {regions.map((r) => {
              const cnt = regionCounts[r.key] || 0;
              if (cnt === 0) return null;
              const active = regionFilter === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRegionFilter(r.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                    active ? `${activeChip} text-white` : 'bg-white border-gray-200 text-[#333] hover:border-gray-400'
                  }`}
                  style={{ minHeight: 36 }}
                >
                  {r.label}
                  <span className={`inline-block min-w-[18px] rounded-full text-[10px] px-1 ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#666]'}`}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 정렬 + 결과 카운트 + 활성 필터 칩 (부동산 정점 #2·#5·#6) */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1 text-xs font-bold text-[#555]" htmlFor="venue-sort">
            정렬
          </label>
          <select
            id="venue-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="정렬 기준"
            data-testid="venue-sort"
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111] outline-none focus:border-[#8B5CF6]"
            style={{ minHeight: 36 }}
          >
            <option value="premium">추천순</option>
            <option value="name">이름순</option>
            <option value="reviews">후기많은순</option>
            <option value="bookmarked">즐겨찾기순</option>
          </select>

          <span className="text-xs font-bold text-[#111]" data-testid="venue-count">
            {filtered.length}곳
            <span className="ml-1 font-normal text-[#666]">· {SORT_LABEL[sortKey]}</span>
          </span>

          {/* 활성 필터 — 1-tap 해제 (부동산 정점 #6) */}
          {activeRegionLabel && (
            <button
              type="button"
              onClick={() => setRegionFilter('all')}
              aria-label={`${activeRegionLabel} 필터 해제`}
              data-testid="active-filter"
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100"
              style={{ minHeight: 32 }}
            >
              {activeRegionLabel}
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleList.map((venue, idx) => {
              const elements = [];
              if (showEngagementHooks && idx === 14) {
                elements.push(<TopPicksMini key={`top-${idx}`} venues={venues} hrefPattern={hrefPattern} accentColor={accentColor} />);
              } else if (showEngagementHooks && (idx === 24 || idx === 44)) {
                elements.push(<ListMidHook key={`hook-${idx}`} index={idx === 24 ? 0 : 1} />);
              }

              const path = buildHref(hrefPattern, venue);
              const bookmarked = isBookmarked(path);
              const inCompare = isInCompare(path);

              elements.push(
                <div key={venue.id} className="group relative">
                  {/* 비교 체크박스 — 부동산 정점 #10 (Redfin/Zillow compare check). 좌측 상단, 카드 클릭과 분리 */}
                  <button
                    type="button"
                    aria-label={inCompare ? '비교 해제' : '비교에 추가'}
                    aria-pressed={inCompare}
                    data-testid="venue-compare-check"
                    disabled={!inCompare && compareFull}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCompare({
                        path,
                        nameKo: venue.nameKo,
                        category: venue.category,
                        regionKo: venue.regionKo,
                        slug: venue.slug,
                      });
                    }}
                    className={`absolute top-2 left-2 z-[3] inline-flex items-center justify-center rounded-md backdrop-blur-sm transition-colors ${
                      inCompare ? 'bg-violet-600 text-white' : 'bg-white/85 text-[#333] hover:bg-white'
                    } ${!inCompare && compareFull ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={{ width: 28, height: 28 }}
                    title={!inCompare && compareFull ? '비교 최대 4곳' : (inCompare ? '비교 해제' : '비교에 추가 (최대 4)')}
                  >
                    {inCompare ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span aria-hidden="true" className="text-[10px] font-bold leading-none">VS</span>
                    )}
                  </button>

                  {/* 즐겨찾기 ♥ — 부동산 정점 #3 (Zillow heart, Redfin save). 카드 우측 상단 absolute */}
                  <button
                    type="button"
                    aria-label={bookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    aria-pressed={bookmarked}
                    data-testid="venue-bookmark"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleBookmark(path, venue.nameKo);
                    }}
                    className={`absolute top-2 right-2 z-[3] inline-flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                      bookmarked ? 'bg-rose-500 text-white' : 'bg-white/85 text-[#333] hover:bg-white'
                    }`}
                    style={{ width: 36, height: 36 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <Link to={path} className="block">
                    <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform group-hover:scale-[1.02] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
                        {hasVenueImage(venue.slug) && (
                          <img
                            src={`/venues/${venue.slug}-1.webp?v3`}
                            alt={venue.nameKo}
                            width={300}
                            height={300}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            className="absolute inset-0 w-full h-full object-cover z-[1]"
                          />
                        )}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${fallbackGradient[venue.category] || 'from-gray-500 to-gray-700'}`}>
                          <span className="text-3xl">{catEmoji[venue.category] || '🎵'}</span>
                          <span className="mt-1 text-xs font-bold text-white/80">{venue.nameKo.slice(0, 4)}</span>
                        </div>
                        {venue.isPremium && (
                          <span className="absolute top-2 left-2 z-[2] rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                            PREMIUM
                          </span>
                        )}

                        {/* 카드 호버 미리보기 — 부동산 정점 #7 (Zillow hover preview). desktop만, shortDescription 1줄 fade-in */}
                        <div className="hidden sm:flex absolute inset-0 z-[2] flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3">
                          <p className="text-[11px] leading-snug text-white line-clamp-3" data-testid="venue-hover-preview">
                            {venue.shortDescription || `${venue.regionKo} ${getCategoryLabel(venue.category)} ${venue.nameKo}`}
                          </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-1.5 sm:group-hover:opacity-0 transition-opacity">
                          <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
                          <p className="text-[11px] text-white/90 truncate">{getCategoryLabel(venue.category)} · {venue.regionKo}</p>
                          <VenueCardStats slug={venue.slug} className="mt-0.5 text-white/60 [&_strong]:text-white/80 [&_.rounded-full]:bg-red-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
              return elements;
            })}
          </div>

          {/* 무한 스크롤 sentinel — 부동산 정점 #9 */}
          {hasMore && (
            <div ref={sentinelRef} data-testid="venue-sentinel" className="py-8 text-center text-xs text-[#888]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent align-middle" /> 더 불러오는 중…
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <div className="py-8 text-center text-xs text-[#888]">— 마지막 업소입니다 ({filtered.length}곳 표시) —</div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[#555]">조건에 맞는 업소가 없습니다.</p>
          <button onClick={() => setRegionFilter('all')} className="mt-3 text-sm text-[#8B5CF6] hover:underline">
            필터 초기화
          </button>
        </div>
      )}

      {/* 맨 위로 버튼 — 부동산 정점 #9 보조 */}
      {showTop && (
        <button
          type="button"
          aria-label="맨 위로 이동"
          data-testid="scroll-top"
          data-back-to-top
          onClick={scrollTop}
          className="fixed bottom-24 right-4 z-[50] inline-flex items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700"
          style={{ width: 44, height: 44 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
