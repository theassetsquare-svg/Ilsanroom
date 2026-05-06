

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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

  const filtered = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (regionFilter !== 'all') {
      list = list.filter((v) => {
        // 정확 매칭
        if (v.region === regionFilter || v.regionKo === regionFilter) return true;
        // 상위 지역 prefix 매칭: 'busan' 선택 시 'busan-haeundae' 등 모두 포함
        if (v.region.startsWith(regionFilter + '-')) return true;
        return false;
      });
    }
    list.sort((a, b) => {
      if (sortKey === 'name') return a.nameKo.localeCompare(b.nameKo);
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return a.nameKo.localeCompare(b.nameKo);
    });
    return list;
  }, [venues, regionFilter, sortKey]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#8B5CF6]"
        >
          <option value="all">전체 지역</option>
          {regions.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
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
            // Insert engagement hooks between cards
            if (showEngagementHooks && idx > 0 && idx % 12 === 0) {
              elements.push(<TopPicksMini key={`top-${idx}`} venues={venues} hrefPattern={hrefPattern} accentColor={accentColor} />);
            } else if (showEngagementHooks && idx > 0 && idx % 6 === 0) {
              elements.push(<ListMidHook key={`hook-${idx}`} index={Math.floor(idx / 6) - 1} />);
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
                        src={`/venues/${venue.slug}-1.webp`}
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
