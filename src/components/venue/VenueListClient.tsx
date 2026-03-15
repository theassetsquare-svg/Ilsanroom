'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Venue } from '@/types';

interface VenueListClientProps {
  venues: Venue[];
  /** e.g. "/clubs/{region}/{slug}" or "/nights/{slug}" */
  hrefPattern: string;
  regions: { key: string; label: string }[];
}

function buildHref(pattern: string, v: Venue): string {
  return pattern.replace('{region}', v.region).replace('{slug}', v.slug);
}

type SortKey = 'rating' | 'name' | 'premium';

function VenueCard({ venue, href }: { venue: Venue; href: string }) {
  return (
    <Card href={href}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      {venue.staffNickname && (
        <p className="mb-1 text-sm font-medium text-neon-gold">{venue.staffNickname}</p>
      )}
      {venue.staffPhone && (
        <p className="mb-2 text-sm text-neon-green">{venue.staffPhone}</p>
      )}
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-neon-gold">★</span> {venue.rating.toFixed(1)}
        </span>
      </div>
    </Card>
  );
}

export default function VenueListClient({ venues, hrefPattern, regions }: VenueListClientProps) {
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('premium');
  const [ratingFilter, setRatingFilter] = useState(0);

  const filtered = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (regionFilter !== 'all') {
      list = list.filter((v) => v.region === regionFilter || v.regionKo === regionFilter);
    }
    if (ratingFilter > 0) {
      list = list.filter((v) => v.rating >= ratingFilter);
    }
    list.sort((a, b) => {
      if (sortKey === 'rating') return b.rating - a.rating;
      if (sortKey === 'name') return a.nameKo.localeCompare(b.nameKo);
      // premium first
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return b.rating - a.rating;
    });
    return list;
  }, [venues, regionFilter, sortKey, ratingFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* Region */}
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        >
          <option value="all">전체 지역</option>
          {regions.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>

        {/* Rating */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        >
          <option value={0}>전체 평점</option>
          <option value={4}>★ 4.0 이상</option>
          <option value={4.5}>★ 4.5 이상</option>
        </select>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary"
        >
          <option value="premium">추천순</option>
          <option value="rating">평점순</option>
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
          <button onClick={() => { setRegionFilter('all'); setRatingFilter(0); }} className="mt-3 text-sm text-neon-primary hover:underline">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
