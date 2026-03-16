'use client';

import { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Venue } from '@/types';

interface VenueListClientProps {
  venues: Venue[];
  hrefPattern: string;
  regions: { key: string; label: string }[];
}

function buildHref(pattern: string, v: Venue): string {
  return pattern.replace('{region}', v.region).replace('{slug}', v.slug);
}

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

type SortKey = 'name' | 'premium';

function VenueCard({ venue, href }: { venue: Venue; href: string }) {
  const nameIncludesRegion = venue.nameKo.includes(venue.regionKo);
  const nameIncludesCategory = venue.nameKo.includes(getCategoryLabel(venue.category));

  return (
    <Card href={href}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      {venue.staffNickname && (
        <p className="mb-1 text-sm font-medium text-neon-gold">{venue.staffNickname}</p>
      )}
      <div className="mb-2 flex items-center gap-2 text-sm text-neon-text-muted">
        {!nameIncludesRegion && <span>{venue.regionKo}</span>}
        {!nameIncludesRegion && !nameIncludesCategory && <span>·</span>}
        {!nameIncludesCategory && <span>{getCategoryLabel(venue.category)}</span>}
      </div>
      {venue.shortDescription && (
        <p className="text-xs text-neon-text-muted line-clamp-2">{venue.shortDescription}</p>
      )}
    </Card>
  );
}

export default function VenueListClient({ venues, hrefPattern, regions }: VenueListClientProps) {
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('premium');

  const filtered = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (regionFilter !== 'all') {
      list = list.filter((v) => v.region === regionFilter || v.regionKo === regionFilter);
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
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-neon-border bg-white px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        >
          <option value="all">전체 지역</option>
          {regions.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-neon-border bg-white px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        >
          <option value="premium">추천순</option>
          <option value="name">이름순</option>
        </select>

        <span className="text-xs text-neon-text-muted">{filtered.length}개 업소</span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((venue) => (
            <VenueCard key={venue.id} venue={venue} href={buildHref(hrefPattern, venue)} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-neon-text-muted">조건에 맞는 업소가 없습니다.</p>
          <button onClick={() => setRegionFilter('all')} className="mt-3 text-sm text-neon-primary hover:underline">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
