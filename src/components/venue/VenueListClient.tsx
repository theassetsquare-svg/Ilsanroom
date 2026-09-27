import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';
import { ListMidHook, TopPicksMini } from '@/components/venue/CategoryListingEngagement';
import { ogVer } from '@/lib/venue-file-ver';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCompareList } from '@/hooks/useCompareList';
import { popularity, isRanked } from '@/lib/popularity';
import { isAdVenue, isListed, regionOf, regionTree, inRegionKey, sortVenues, SORT_KEYS, SORT_LABELS, UNKNOWN_REGION, type SortKey } from '@/lib/venue-order';

interface VenueListClientProps {
  venues: Venue[];
  hrefPattern: string;
  showEngagementHooks?: boolean;
  accentColor?: string;
}

function buildHref(pattern: string, v: Venue): string {
  return pattern.replace('{region}', v.region).replace('{slug}', v.slug);
}

const PAGE_SIZE = 36; // 부동산 정점 패턴 — Zillow·Redfin grid pagination 36

/** 인기 엔진 순위(실측 28일 · ranked 만) — 카드의 「인기 N위」 표시 */
const POP_RANK: Map<string, number> = (() => {
  const m = new Map<string, number>();
  Object.entries(popularity.venues)
    .filter(([, e]) => e.ranked)
    .sort((a, b) => b[1].score - a[1].score)
    .forEach(([slug], i) => m.set(slug, i + 1));
  return m;
})();

/**
 * [놀쿨12-2 · 대표님 13:18-1·2·7·11] 목록 — 네이버처럼
 *  - 지역 2단: 시·도 → 시·군·구(가게 주소에서 · 주소 없는 곳은 「지역 확인 중」) · 칩 숫자 = 목록 수
 *  - 정렬 칩: 추천(광고 → 인기 → 가나다) · 인기 · 가나다 · 새로 입점
 *  - 선택은 같은 주소의 ?region= · ?sort= 로만(새 주소 0 · canonical 은 원래 주소)
 *  - 카드: 가게 이름이 크게 그려진 표준 카드 그림 + 이름 글자 + 지역 + 한 줄 + 인기 표시 + 「광고」 표시
 *  - 뒤로 가기로 돌아오면 보던 자리(몇 장까지 펼쳤는지 · 내린 높이)를 되살린다
 */
export default function VenueListClient({ venues, hrefPattern, showEngagementHooks = false, accentColor = 'violet' }: VenueListClientProps) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const regionFilter = params.get('region') || 'all';
  const sortKey: SortKey = (SORT_KEYS as string[]).includes(params.get('sort') || '') ? (params.get('sort') as SortKey) : 'rec';
  const storeKey = `nc-list:${location.pathname}${location.search}`;
  const restored = useRef(false);
  const [visibleCount, setVisibleCount] = useState(() => {
    try { const s = JSON.parse(sessionStorage.getItem(storeKey) || 'null'); if (s && s.count) return s.count as number; } catch { /* 저장소 막힘 — 첫 장부터 */ }
    return PAGE_SIZE;
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { isInList: isInCompare, toggle: toggleCompare, isFull: compareFull } = useCompareList();

  /* 폐업·미확인 · 같은 가게 둘째 쪽 제외 */
  const listed = useMemo(() => venues.filter((v) => isListed(v)), [venues]);
  const tree = useMemo(() => regionTree(listed), [listed]);
  const activeSido = regionFilter === 'all' || regionFilter === UNKNOWN_REGION ? null : regionFilter.split('-')[0];
  const sidoNode = activeSido ? tree.sidos.find((s) => s.key === activeSido) || null : null;

  const filtered = useMemo(
    () => sortVenues(listed.filter((v) => inRegionKey(v, regionFilter)), sortKey, popularity.venues),
    [listed, regionFilter, sortKey],
  );

  function setParam(key: 'region' | 'sort', value: string | null) {
    const next = new URLSearchParams(params);
    if (!value || (key === 'region' && value === 'all') || (key === 'sort' && value === 'rec')) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
    setVisibleCount(PAGE_SIZE);
  }

  /* 뒤로 가기 자리 기억 — 가게로 들어가기 직전의 높이·펼친 장 수를 저장했다가 되살린다 */
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    let saved: { y?: number } | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(storeKey) || 'null'); } catch { saved = null; }
    if (saved && typeof saved.y === 'number' && saved.y > 0) {
      const y = saved.y;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    }
  }, [storeKey]);
  function rememberSpot() {
    try { sessionStorage.setItem(storeKey, JSON.stringify({ y: window.scrollY, count: visibleCount })); } catch { /* 저장소 막힘 — 기억 없이 */ }
  }

  const hasMore = visibleCount < filtered.length;
  /* 무한 스크롤 — IntersectionObserver로 sentinel 진입 시 +PAGE_SIZE */
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
    // [놀쿨12-2] 칩을 바꿔 첫 장으로 돌아가면 「더 불러오기」 자리가 새로 생긴다 — 그때마다 다시 지켜본다(옛 자리를 지켜보다 36곳에서 멈추던 것)
  }, [filtered.length, hasMore]);

  const accentBg: Record<string, string> = {
    violet: 'bg-violet-600 border-violet-600',
    blue: 'bg-blue-600 border-blue-600',
    amber: 'bg-amber-700 border-amber-700', // 600은 white 텍스트 3.19:1 — WCAG 4.5:1 미달 (Lighthouse color-contrast)
    rose: 'bg-rose-600 border-rose-600',
    emerald: 'bg-emerald-700 border-emerald-700', // 600은 white 텍스트 3.77:1 미달
    pink: 'bg-pink-600 border-pink-600',
  };
  const activeChip = accentBg[accentColor] || accentBg.violet;
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors ${active ? `${activeChip} text-white` : 'bg-white border-gray-300 text-[#222] hover:border-gray-500'}`;
  const countPill = (active: boolean) => `inline-block min-w-[20px] rounded-full text-xs px-1.5 ${active ? 'bg-white text-[#222]' : 'bg-gray-100 text-[#444]'}`;

  const visibleList = filtered.slice(0, visibleCount);
  const activeLabel = regionFilter === 'all' ? null : regionFilter === UNKNOWN_REGION ? '지역 확인 중' : regionFilter.replace('-', ' ');

  return (
    <div data-venue-list-v2>
      <div className="sticky top-0 z-[40] -mx-4 px-4 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-gray-100 pt-2 pb-2 mb-3">
        {/* 1단 — 시·도 */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex items-center gap-2 pb-1 whitespace-nowrap" role="tablist" aria-label="시·도">
            <button type="button" role="tab" aria-selected={regionFilter === 'all'} onClick={() => setParam('region', 'all')} className={chip(regionFilter === 'all')} style={{ minHeight: 48 }} data-region-chip="all">
              전체 <span className={countPill(regionFilter === 'all')}>{tree.total}</span>
            </button>
            {tree.sidos.map((s) => {
              const active = activeSido === s.key;
              return (
                <button key={s.key} type="button" role="tab" aria-selected={active} onClick={() => setParam('region', s.key)} className={chip(active)} style={{ minHeight: 48 }} data-region-chip={s.key}>
                  {s.label} <span className={countPill(active)}>{s.count}</span>
                </button>
              );
            })}
            {tree.unknown > 0 && (
              <button type="button" role="tab" aria-selected={regionFilter === UNKNOWN_REGION} onClick={() => setParam('region', UNKNOWN_REGION)} className={chip(regionFilter === UNKNOWN_REGION)} style={{ minHeight: 48 }} data-region-chip={UNKNOWN_REGION}>
                지역 확인 중 <span className={countPill(regionFilter === UNKNOWN_REGION)}>{tree.unknown}</span>
              </button>
            )}
          </div>
        </div>
        {/* 2단 — 시·군·구 (시·도를 고르면 뜬다) */}
        {sidoNode && (sidoNode.sggs.length > 1 || sidoNode.noSgg > 0) && (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto mt-1">
            <div className="flex items-center gap-2 pb-1 whitespace-nowrap" role="tablist" aria-label={`${sidoNode.label} 시·군·구`}>
              <button type="button" role="tab" aria-selected={regionFilter === sidoNode.key} onClick={() => setParam('region', sidoNode.key)} className={chip(regionFilter === sidoNode.key)} style={{ minHeight: 48 }} data-region-chip={sidoNode.key}>
                {sidoNode.label} 전체 <span className={countPill(regionFilter === sidoNode.key)}>{sidoNode.count}</span>
              </button>
              {sidoNode.sggs.map((g) => (
                <button key={g.key} type="button" role="tab" aria-selected={regionFilter === g.key} onClick={() => setParam('region', g.key)} className={chip(regionFilter === g.key)} style={{ minHeight: 48 }} data-region-chip={g.key}>
                  {g.label} <span className={countPill(regionFilter === g.key)}>{g.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 정렬 칩 + 결과 수 */}
        <div className="mt-2 flex flex-wrap items-center gap-2" role="tablist" aria-label="정렬">
          {SORT_KEYS.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={sortKey === k} onClick={() => setParam('sort', k)} className={chip(sortKey === k)} style={{ minHeight: 48 }} data-sort-chip={k}>
              {SORT_LABELS[k]}
            </button>
          ))}
          <span className="text-sm font-bold text-[#111]" data-testid="venue-count">
            {filtered.length}곳
            {activeLabel && <span className="ml-1 font-normal text-[#444]">· {activeLabel}</span>}
          </span>
        </div>
        {sortKey === 'rec' && (
          <p className="mt-1 text-xs text-[#444]">추천 = 「광고」 가게 먼저 → 인기 순위(최근 28일 실측 · {popularity.generatedAt || '집계 전'} 기준) → 가나다</p>
        )}
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleList.map((venue, idx) => {
              const elements = [];
              if (showEngagementHooks && idx === 14) {
                elements.push(<TopPicksMini key={`top-${idx}`} venues={listed} hrefPattern={hrefPattern} accentColor={accentColor} />);
              } else if (showEngagementHooks && (idx === 24 || idx === 44)) {
                elements.push(<ListMidHook key={`hook-${idx}`} index={idx === 24 ? 0 : 1} />);
              }

              const path = buildHref(hrefPattern, venue);
              const bookmarked = isBookmarked(path);
              const inCompare = isInCompare(path);
              const ad = isAdVenue(venue);
              const rank = isRanked(venue.slug) ? POP_RANK.get(venue.slug) : undefined;
              const card = `/og/${venue.slug}${ogVer(venue.slug)}`;

              elements.push(
                <div key={venue.id} className="group relative" data-venue-card={venue.slug} data-ad={ad ? '1' : '0'}>
                  <button
                    type="button"
                    aria-label={inCompare ? '비교 해제' : '비교에 추가'}
                    aria-pressed={inCompare}
                    data-testid="venue-compare-check"
                    disabled={!inCompare && compareFull}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCompare({ path, nameKo: venue.nameKo, category: venue.category, regionKo: venue.regionKo, slug: venue.slug });
                    }}
                    className={`absolute top-1 left-1 z-[3] inline-flex items-center justify-center rounded-lg transition-colors ${
                      inCompare ? 'bg-violet-600 text-white' : 'bg-white/90 text-[#222] hover:bg-white'
                    } ${!inCompare && compareFull ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={{ width: 48, height: 48 }}
                    title={!inCompare && compareFull ? '비교 최대 4곳' : (inCompare ? '비교 해제' : '비교에 추가 (최대 4)')}
                  >
                    {inCompare ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span aria-hidden="true" className="text-xs font-bold leading-none">VS</span>
                    )}
                  </button>

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
                    className={`absolute top-1 right-1 z-[3] inline-flex items-center justify-center rounded-full transition-colors ${
                      bookmarked ? 'bg-rose-500 text-white' : 'bg-white/90 text-[#222] hover:bg-white'
                    }`}
                    style={{ width: 48, height: 48 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <Link to={path} className="block" onClick={rememberSpot}>
                    <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform group-hover:scale-[1.02]">
                      <div className="relative w-full overflow-hidden bg-[#111]" style={{ aspectRatio: '1/1' }}>
                        <img
                          src={`${card}-w600.webp`}
                          alt={`${venue.nameKo} 표준 카드`}
                          width={300}
                          height={300}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          decoding="async"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = `${card}.jpg`; }
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {ad && (
                          <span className="absolute bottom-1 left-1 z-[2] rounded bg-white px-1.5 py-0.5 text-xs font-bold text-[#111] border border-[#111]" data-ad-label>
                            광고
                          </span>
                        )}
                      </div>
                      <div className="px-2.5 py-2">
                        <h3 className="text-[15px] font-bold text-[#111] leading-snug truncate">{venue.nameKo}</h3>
                        <p className="text-xs text-[#444] truncate">{regionOf(venue).label}{rank ? ` · 인기 ${rank}위` : ''}</p>
                        {venue.shortDescription && <p className="mt-0.5 text-xs text-[#333] line-clamp-1">{venue.shortDescription}</p>}
                      </div>
                    </div>
                  </Link>
                </div>
              );
              return elements;
            })}
          </div>

          {hasMore && (
            <div ref={sentinelRef} data-testid="venue-sentinel" className="py-8 text-center text-xs text-[#444]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent align-middle" /> 더 불러오는 중…
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <div className="py-8 text-center text-xs text-[#444]">— 마지막 업소입니다 ({filtered.length}곳 표시) —</div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[#444]">조건에 맞는 업소가 없습니다.</p>
          <button onClick={() => setParam('region', 'all')} className="mt-3 text-sm text-[#6D28D9] hover:underline" style={{ minHeight: 48 }}>
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
