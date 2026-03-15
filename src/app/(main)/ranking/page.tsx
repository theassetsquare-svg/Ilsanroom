'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

const catLabels: Record<string, string> = { all: '모두', club: '파티', night: '소셜댄스', lounge: '프리미엄바', room: '프라이빗', yojeong: '한정식', hoppa: '호스트' };
const regionLabels: Record<string, string> = { all: '전지역', gangnam: '강남권', hongdae: '홍대권', itaewon: '이태원권', ilsan: '일산권', busan: '부산권', daegu: '대구권', suwon: '수원권', incheon: '인천권' };
const catColors: Record<string, string> = { club: '#7c3aed', night: '#ec4899', lounge: '#06b6d4', room: '#f59e0b', yojeong: '#ef4444', hoppa: '#f472b6' };

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

// 순위 변동 시뮬레이션 (seed로 고정)
function getRankChange(id: string, idx: number): { icon: string; color: string } {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  if (idx < 3) return { icon: 'NEW', color: 'text-neon-green' };
  const mod = (hash + idx) % 5;
  if (mod < 2) return { icon: '▲', color: 'text-neon-green' };
  if (mod === 2) return { icon: '━', color: 'text-neon-text-muted' };
  return { icon: '▼', color: 'text-neon-red' };
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
      const aScore = a.rating + (a.reviewCount || 0) * 0.01;
      const bScore = b.rating + (b.reviewCount || 0) * 0.01;
      return bScore - aScore;
    }).slice(0, 20);
  }, [category, region, period]);

  const maxScore = ranked.length > 0 ? Math.max(...ranked.map((v) => v.rating || 4.5)) : 5;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-neon-text mb-1">인기 랭킹 TOP 20</h1>
      <p className="text-sm text-neon-text-muted mb-8">평점·인기도 기반 실시간 순위표</p>

      {/* 필터 영역 */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none" style={{ minHeight: 40 }}>
          {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-neon-border bg-neon-surface px-3 py-2 text-sm text-neon-text outline-none" style={{ minHeight: 40 }}>
          {Object.entries(regionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex rounded-lg border border-neon-border overflow-hidden">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs font-medium transition ${period === p ? 'bg-neon-primary text-white' : 'bg-neon-surface text-neon-text-muted'}`}
              style={{ minHeight: 40 }}>
              {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 미리보기 */}
      {ranked.length > 0 && (
        <div className="mb-8 rounded-2xl border border-neon-border bg-neon-surface p-5">
          <h2 className="text-sm font-bold text-neon-text mb-4">상위 10곳 점수 분포</h2>
          <div className="space-y-2">
            {ranked.slice(0, 10).map((v, i) => {
              const pct = ((v.rating || 4) / maxScore) * 100;
              const cc = catColors[v.category] || '#8B5CF6';
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-bold text-neon-text-muted">{i + 1}</span>
                  <span className="w-24 sm:w-32 truncate text-xs text-neon-text">{v.nameKo}</span>
                  <div className="flex-1 h-5 rounded bg-neon-surface-2 overflow-hidden">
                    <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cc }} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold" style={{ color: cc }}>{(v.rating || 4).toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 순위 리스트 */}
      <div className="space-y-2">
        {ranked.map((v, i) => {
          const ch = getRankChange(v.id, i);
          const cc = catColors[v.category] || '#8B5CF6';
          const score = v.rating || 4;
          return (
            <Link key={v.id} href={getCategoryHref(v.category, v.slug, v.region)}
              className="flex items-center gap-3 sm:gap-4 rounded-xl border border-neon-border bg-neon-surface px-4 py-3 transition hover:border-neon-primary/40 card-hover"
              style={{ minHeight: 60 }}>
              {/* 순위 */}
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                i === 0 ? 'bg-neon-gold/20 text-neon-gold' : i === 1 ? 'bg-neutral-400/20 text-neutral-300' : i === 2 ? 'bg-amber-800/20 text-amber-500' : 'bg-neon-surface-2 text-neon-text-muted'
              }`}>{i + 1}</span>

              {/* 카테고리 도트 */}
              <span className="h-2.5 w-2.5 shrink-0 rounded-full hidden sm:block" style={{ backgroundColor: cc }} />

              {/* 정보 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-neon-text">{v.nameKo}</h3>
                  {v.isPremium && <span className="text-[10px] font-semibold text-neon-gold bg-neon-gold/10 px-1.5 py-0.5 rounded">P</span>}
                </div>
                <p className="text-xs text-neon-text-muted">{v.regionKo} · {catLabels[v.category] || v.category}</p>
              </div>

              {/* 바 */}
              <div className="hidden sm:flex items-center gap-2 w-28">
                <div className="h-1.5 flex-1 rounded-full bg-neon-surface-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cc }} />
                </div>
                <span className="text-xs font-bold" style={{ color: cc }}>{score.toFixed(1)}</span>
              </div>

              {/* 변동 */}
              <span className={`shrink-0 text-xs font-bold ${ch.color}`}>{ch.icon}</span>
            </Link>
          );
        })}
      </div>

      {ranked.length === 0 && (
        <p className="py-16 text-center text-neon-text-muted">해당 조건의 결과가 없습니다</p>
      )}
    </div>
  );
}
