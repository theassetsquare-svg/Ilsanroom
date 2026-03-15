'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';
import Badge from '@/components/ui/Badge';
import type { Venue } from '@/types';

const categoryLabels: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지', room: '룸',
  yojeong: '요정', hoppa: '호빠',
};

function getCategoryHref(v: Venue) {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`, night: `/nights/${v.slug}`, lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`, yojeong: `/yojeong/${v.region}/${v.slug}`, hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});

  const openVenues = useMemo(() =>
    venues.filter((v) => v.status !== 'closed_or_unclear').sort((a, b) => b.rating - a.rating),
    []
  );

  const selectedVenues = useMemo(() =>
    selected.map((id) => openVenues.find((v) => v.id === id)).filter(Boolean) as Venue[],
    [selected, openVenues]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const vote = (id: string) => {
    setVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">업소 비교</h1>
      <p className="text-neon-text-muted mb-8">2~3곳을 선택하여 나란히 비교하고 투표하세요.</p>

      {/* Venue Selector */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-neon-text">비교할 업소 선택 (최대 3곳)</h2>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {openVenues.slice(0, 30).map((v) => (
            <button
              key={v.id}
              onClick={() => toggleSelect(v.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selected.includes(v.id)
                  ? 'bg-neon-primary text-white'
                  : 'border border-neon-border bg-neon-surface text-neon-text-muted hover:text-neon-text'
              }`}
            >
              {v.nameKo}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedVenues.length >= 2 ? (
        <div className="overflow-x-auto">
          <div className={`grid gap-4 ${selectedVenues.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {selectedVenues.map((v) => (
              <div key={v.id} className="rounded-2xl border border-neon-border bg-neon-surface p-6">
                <Link href={getCategoryHref(v)} target="_blank" rel="noopener noreferrer">
                  <h3 className="text-lg font-bold text-neon-primary-light hover:text-neon-primary mb-2">{v.nameKo}</h3>
                </Link>
                {v.isPremium && <Badge variant="premium" className="mb-3">PREMIUM</Badge>}

                <dl className="space-y-2 text-sm">
                  <div><dt className="text-neon-text-muted/60">카테고리</dt><dd className="text-neon-text">{categoryLabels[v.category]}</dd></div>
                  <div><dt className="text-neon-text-muted/60">지역</dt><dd className="text-neon-text">{v.regionKo}</dd></div>
                  <div><dt className="text-neon-text-muted/60">평점</dt><dd className="text-neon-gold">★ {v.rating.toFixed(1)}</dd></div>
                  {v.staffNickname && <div><dt className="text-neon-text-muted/60">담당</dt><dd className="text-neon-gold">{v.staffNickname}</dd></div>}
                  <div><dt className="text-neon-text-muted/60">입장료</dt><dd className="text-neon-text">{v.priceEntry || '-'}</dd></div>
                  <div><dt className="text-neon-text-muted/60">주대/룸</dt><dd className="text-neon-text">{v.priceTable || '-'}</dd></div>
                  <div><dt className="text-neon-text-muted/60">음료</dt><dd className="text-neon-text">{v.priceDrink || '-'}</dd></div>
                  {v.openHours && <div><dt className="text-neon-text-muted/60">영업시간</dt><dd className="text-neon-text">{v.openHours}</dd></div>}
                  {v.dressCode && <div><dt className="text-neon-text-muted/60">드레스코드</dt><dd className="text-neon-text">{v.dressCode}</dd></div>}
                </dl>

                {v.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-neon-text-muted/60 mb-1">특징</p>
                    <div className="flex flex-wrap gap-1">
                      {v.features.slice(0, 4).map((f) => (
                        <span key={f} className="rounded-full bg-neon-surface-2 px-2 py-0.5 text-[10px] text-neon-text-muted">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote Button */}
                <button
                  onClick={() => vote(v.id)}
                  className="mt-6 w-full rounded-xl border border-neon-primary/40 py-2.5 text-sm font-semibold text-neon-primary transition-all hover:bg-neon-primary/10"
                >
                  투표하기 {votes[v.id] ? `(${votes[v.id]})` : ''}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-12 text-center">
          <p className="text-neon-text-muted">위에서 2~3곳을 선택하면 비교표가 나타납니다.</p>
        </div>
      )}
    </div>
  );
}
