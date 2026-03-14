'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { venues } from '@/data/venues';

type CategoryFilter = 'all' | 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa';

const categoryLabels: Record<string, string> = {
  all: '전체', club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

export default function PricePage() {
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    return venues
      .filter((v) => v.status !== 'closed_or_unclear')
      .filter((v) => (v.priceEntry || v.priceTable || v.priceDrink))
      .filter((v) => category === 'all' || v.category === category)
      .sort((a, b) => {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
        return b.rating - a.rating;
      });
  }, [category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold text-neon-text mb-2">가격 비교표</h1>
      <p className="text-neon-text-muted mb-8">확인된 가격 정보만 표시됩니다. 정확한 금액은 업소에 직접 확인하세요.</p>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              category === cat
                ? 'bg-neon-primary text-white'
                : 'border border-neon-border bg-neon-surface text-neon-text-muted hover:text-neon-text'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Price Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-neon-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-border bg-neon-surface-2">
                <th className="px-4 py-3 text-left font-semibold text-neon-text">업소명</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">카테고리</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">지역</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">입장료</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">주대/룸</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">음료/주류</th>
                <th className="px-4 py-3 text-left font-semibold text-neon-text">평점</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-neon-border/50 hover:bg-neon-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={getCategoryHref(v.category, v.slug, v.region)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-neon-primary-light hover:text-neon-primary hover:underline"
                    >
                      {v.nameKo}
                    </Link>
                    {v.isPremium && <span className="ml-2 text-[10px] text-neon-gold">PREMIUM</span>}
                  </td>
                  <td className="px-4 py-3 text-neon-text-muted">{categoryLabels[v.category] || v.category}</td>
                  <td className="px-4 py-3 text-neon-text-muted">{v.regionKo}</td>
                  <td className="px-4 py-3 text-neon-text">{v.priceEntry || '-'}</td>
                  <td className="px-4 py-3 text-neon-text">{v.priceTable || '-'}</td>
                  <td className="px-4 py-3 text-neon-text">{v.priceDrink || '-'}</td>
                  <td className="px-4 py-3 text-neon-gold">★ {v.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-20 text-center text-neon-text-muted">가격 정보가 등록된 업소가 없습니다.</p>
      )}

      <p className="mt-6 text-xs text-neon-text-muted/60">
        ※ 가격은 업소 사정에 따라 변동될 수 있습니다. 방문 전 반드시 해당 업소에 직접 확인하시기 바랍니다.
      </p>
    </div>
  );
}
