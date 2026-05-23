

import { useState, useMemo } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';
import { VenueCardStats } from '@/components/ui/LiveStats';
import { ListMidHook, TopPicksMini } from '@/components/venue/CategoryListingEngagement';
import { hasVenueImage } from '@/data/venue-image-manifest';

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

type SortKey = 'name' | 'premium';

export default function VenueListClient({ venues, hrefPattern, regions, showEngagementHooks = false, accentColor = 'violet' }: VenueListClientProps) {
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('premium');

  /* 폐업·미확인 venue 자동 제외 — 'closed_or_unclear' / 'closed' / 'permanently_closed' / 'temporarily_closed' 모두 차단 */
  const CLOSED = new Set(['closed_or_unclear', 'closed', 'permanently_closed', 'temporarily_closed']);
  const openVenues = useMemo(() => venues.filter((v) => !CLOSED.has(String(v.status || ''))), [venues]);

  function inRegion(v: Venue, key: string) {
    if (v.region === key || v.regionKo === key) return true;
    if (v.region.startsWith(key + '-')) return true;
    return false;
  }

  /* 지역별 카운트 — 칩에 표시 (체류 ↑ 정보 밀도) */
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
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return a.nameKo.localeCompare(b.nameKo);
    });
    return list;
  }, [openVenues, regionFilter, sortKey]);

  /* 칩 색상 — accentColor에 따라 활성 배경/테두리 변화 */
  const accentBg: Record<string, string> = {
    violet: 'bg-violet-600 border-violet-600',
    blue: 'bg-blue-600 border-blue-600',
    amber: 'bg-amber-600 border-amber-600',
    rose: 'bg-rose-600 border-rose-600',
    emerald: 'bg-emerald-600 border-emerald-600',
    pink: 'bg-pink-600 border-pink-600',
  };
  const activeChip = accentBg[accentColor] || accentBg.violet;

  return (
    <div>
      {/* 시즌63 — 지역 칩(pill) 가로 스크롤. 탭당 즉시 필터 → 다중 탭 유도 → 체류 ↑.
          기존 <select> 대비 발견성·터치 친화성·인터랙션 카운트 모두 우위. */}
      <div className="mb-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
        <div className="flex items-center gap-2 pb-1 whitespace-nowrap" role="tablist" aria-label="지역 필터">
          <button
            type="button"
            role="tab"
            aria-selected={regionFilter === 'all'}
            onClick={() => setRegionFilter('all')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${
              regionFilter === 'all'
                ? `${activeChip} text-white`
                : 'bg-white border-gray-200 text-[#333] hover:border-gray-400'
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="정렬 기준"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#8B5CF6]"
        >
          <option value="premium">추천순</option>
          <option value="name">이름순</option>
        </select>

        <span className="text-xs text-[#555]">{filtered.length}개 업소</span>
      </div>

      {/* Grid — 1:1 이미지 카드, 모든 페이지 동일 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((venue, idx) => {
            const elements = [];
            /* engagement hook 빈도 축소 (시즌62) — 같은 박스/메시지 4회+→1·2회로.
               TopPicksMini: idx=14 단 1회 (사용자가 14개 카드 본 후 한 번만)
               ListMidHook: idx=24 / idx=44 단 2회 */
            if (showEngagementHooks && idx === 14) {
              elements.push(<TopPicksMini key={`top-${idx}`} venues={venues} hrefPattern={hrefPattern} accentColor={accentColor} />);
            } else if (showEngagementHooks && (idx === 24 || idx === 44)) {
              elements.push(<ListMidHook key={`hook-${idx}`} index={idx === 24 ? 0 : 1} />);
            }
            elements.push(
              <Link
                key={venue.id}
                to={buildHref(hrefPattern, venue)}
                className="block"
              >
                <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.02]">
                  {/* 이미지 — 1:1 정사각형 */}
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    {hasVenueImage(venue.slug) && (
                      <img
                        src={`/venues/${venue.slug}-1.webp?v3`}
                        alt={venue.nameKo}
                        width={300}
                        height={300}
                        loading="lazy"
                        onError={(e) => {
                          // 만에 하나 manifest 누락 시 graceful fallback
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-[1]"
                      />
                    )}
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
                    <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/75 px-2.5 py-1.5">
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{venue.nameKo}</h3>
                      <p className="text-[11px] text-white/90 truncate">{getCategoryLabel(venue.category)} · {venue.regionKo}</p>
                      <VenueCardStats slug={venue.slug} className="mt-0.5 text-white/60 [&_strong]:text-white/80 [&_.rounded-full]:bg-red-400" />
                    </div>
                  </div>
                </div>
              </Link>
            );
            return elements;
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[#555]">조건에 맞는 업소가 없습니다.</p>
          <button onClick={() => setRegionFilter('all')} className="mt-3 text-sm text-[#8B5CF6] hover:underline">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
