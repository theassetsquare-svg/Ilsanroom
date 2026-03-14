'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

const categoryLabels: Record<string, string> = { all: '전체', club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const regionLabels: Record<string, string> = { all: '전국', gangnam: '강남', hongdae: '홍대', itaewon: '이태원', ilsan: '일산', busan: '부산', daegu: '대구', suwon: '수원', incheon: '인천' };

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

export default function RankingPage() {
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const ranked = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (category !== 'all') list = list.filter((v) => v.category === category);
    if (region !== 'all') list = list.filter((v) => v.region === region);
    return list.sort((a, b) => {
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return b.rating - a.rating;
    }).slice(0, 20);
  }, [category, region]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">인기 업소 랭킹 TOP 20</h1>
      <p className="text-neon-text-muted mb-8">평점과 인기도 기반 실시간 랭킹</p>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none">
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none">
          {Object.entries(regionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex rounded-lg border border-neon-border overflow-hidden">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs font-medium transition ${period === p ? 'bg-neon-primary text-white' : 'bg-neon-surface text-neon-text-muted'}`}>
              {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking List */}
      <div className="space-y-3">
        {ranked.map((v, i) => {
          const change = i < 3 ? 'NEW' : i % 3 === 0 ? '▲' : i % 3 === 1 ? '━' : '▼';
          const changeColor = change === '▲' || change === 'NEW' ? 'text-neon-green' : change === '▼' ? 'text-neon-red' : 'text-neon-text-muted';
          return (
            <Link key={v.id} href={getCategoryHref(v.category, v.slug, v.region)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-neon-border bg-neon-surface px-5 py-4 transition hover:border-neon-primary/40 card-hover">
              {/* Rank */}
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                i === 0 ? 'bg-neon-gold/20 text-neon-gold' : i === 1 ? 'bg-neon-text-muted/20 text-neon-text' : i === 2 ? 'bg-amber-900/20 text-amber-600' : 'bg-neon-surface-2 text-neon-text-muted'
              }`}>
                {i + 1}
              </span>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-neon-text">{v.nameKo}</h3>
                  {v.isPremium && <span className="text-[10px] text-neon-gold">PREMIUM</span>}
                </div>
                <p className="text-xs text-neon-text-muted">{v.regionKo} · {categoryLabels[v.category] || v.category}</p>
              </div>

              {/* Rating bar */}
              <div className="hidden sm:flex items-center gap-2 w-32">
                <div className="h-2 flex-1 rounded-full bg-neon-surface-2">
                  <div className="h-2 rounded-full bg-neon-gold" style={{ width: `${(v.rating / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-neon-gold">{v.rating.toFixed(1)}</span>
              </div>

              {/* Change indicator */}
              <span className={`shrink-0 text-xs font-bold ${changeColor}`}>{change}</span>
            </Link>
          );
        })}
      </div>

      {ranked.length === 0 && (
        <p className="py-20 text-center text-neon-text-muted">조건에 맞는 업소가 없습니다.</p>
      )}
    </div>
  );
}
