'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  club: { bg: 'bg-neon-primary', text: 'text-neon-primary', label: '클럽' },
  night: { bg: 'bg-neon-pink', text: 'text-neon-pink', label: '나이트' },
  lounge: { bg: 'bg-neon-accent', text: 'text-neon-accent', label: '라운지' },
  room: { bg: 'bg-neon-gold', text: 'text-neon-gold', label: '룸' },
  yojeong: { bg: 'bg-neon-red', text: 'text-neon-red', label: '요정' },
  hoppa: { bg: 'bg-pink-400', text: 'text-pink-400', label: '호빠' },
};

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

export default function MapPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const openVenues = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (categoryFilter !== 'all') list = list.filter((v) => v.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.nameKo.toLowerCase().includes(q) || v.regionKo.includes(q));
    }
    return list;
  }, [categoryFilter, search]);

  // Group by region for clustering
  const grouped = useMemo(() => {
    const map = new Map<string, typeof openVenues>();
    openVenues.forEach((v) => {
      const key = v.regionKo;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [openVenues]);

  return (
    <div className="min-h-screen bg-neon-bg">
      {/* Header */}
      <div className="border-b border-neon-border bg-neon-surface/80 backdrop-blur-lg sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-neon-text mr-4">지도</h1>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업소명, 지역 검색"
              className="rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text outline-none focus:border-neon-primary w-48"
            />
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${categoryFilter === 'all' ? 'bg-neon-text text-neon-bg' : 'bg-neon-surface-2 text-neon-text-muted'}`}>전체</button>
              {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
                <button key={key} onClick={() => setCategoryFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${categoryFilter === key ? `${c.bg} text-white` : `bg-neon-surface-2 ${c.text}`}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-neon-text-muted ml-auto">{openVenues.length}개 업소</span>
          </div>
        </div>
      </div>

      {/* Map placeholder + venue list */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Kakao Map embed placeholder */}
        <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface-2 overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="flex h-full min-h-[400px] items-center justify-center flex-col gap-4">
            <p className="text-neon-text-muted">카카오맵 전체화면</p>
            <a href={`https://map.kakao.com/?q=${encodeURIComponent('일산 룸')}`} target="_blank" rel="noopener noreferrer"
              className="rounded-lg bg-[#FEE500] px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-[#FDD700]">
              카카오맵에서 보기
            </a>
            <p className="text-xs text-neon-text-muted/60">카카오맵 API 키 설정 후 자동 연동됩니다</p>
          </div>
        </div>

        {/* Marker legend */}
        <div className="mb-6 flex flex-wrap gap-4">
          {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${c.bg}`} />
              <span className="text-xs text-neon-text-muted">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Clustered venue list */}
        <div className="space-y-8">
          {grouped.map(([region, vList]) => (
            <div key={region}>
              <h2 className="mb-3 text-lg font-bold text-neon-text flex items-center gap-2">
                {region}
                <span className="rounded-full bg-neon-surface-2 px-2 py-0.5 text-xs text-neon-text-muted">{vList.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vList.map((v) => {
                  const c = CATEGORY_COLORS[v.category] || CATEGORY_COLORS.club;
                  return (
                    <Link key={v.id} href={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-neon-border bg-neon-surface px-4 py-3 transition hover:border-neon-primary/40 card-hover">
                      <span className={`h-3 w-3 shrink-0 rounded-full ${c.bg}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neon-text">{v.nameKo}</p>
                        <p className="truncate text-xs text-neon-text-muted">{c.label} · ★{v.rating.toFixed(1)}{v.staffNickname ? ` · ${v.staffNickname}` : ''}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
