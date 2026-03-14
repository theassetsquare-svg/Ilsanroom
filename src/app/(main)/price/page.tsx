'use client';

import { useState, useMemo } from 'react';
import { venues } from '@/data/venues';

type SortKey = 'name' | 'entry' | 'table' | 'rating';
type CategoryFilter = 'all' | 'club' | 'night' | 'lounge' | 'room' | 'yojeong' | 'hoppa' | 'collatek';

const categoryLabels: Record<string, string> = {
  all: '전체',
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
  collatek: '콜라텍',
};

function extractMinPrice(priceStr: string | undefined): number {
  if (!priceStr) return -1;
  if (priceStr === '무료' || priceStr === '없음') return 0;
  if (priceStr === '포함' || priceStr === '별도') return -1;
  const match = priceStr.replace(/,/g, '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

export default function PricePage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredVenues = useMemo(() => {
    let list = venues.filter((v) => v.status !== 'closed_or_unclear');
    if (categoryFilter !== 'all') {
      list = list.filter((v) => v.category === categoryFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.nameKo.localeCompare(b.nameKo, 'ko');
          break;
        case 'entry':
          cmp = extractMinPrice(a.priceEntry) - extractMinPrice(b.priceEntry);
          break;
        case 'table':
          cmp = extractMinPrice(a.priceTable) - extractMinPrice(b.priceTable);
          break;
        case 'rating':
          cmp = a.rating - b.rating;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [categoryFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => (
    <span className="ml-1 text-xs">
      {sortKey === column ? (sortAsc ? '▲' : '▼') : '↕'}
    </span>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            가격 <span className="text-violet-400">비교</span>
          </h1>
          <p className="text-lg text-neutral-400">
            업소별 입장료, 주대, 음료 가격을 한눈에 비교하세요
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            아래 가격은 일반적인 범위이며, 실제 가격은 업소에 직접 문의하시기 바랍니다.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Price Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900">
                <th
                  className="cursor-pointer p-4 text-left text-sm font-medium text-neutral-400 hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  업소명 <SortIcon column="name" />
                </th>
                <th className="p-4 text-center text-sm font-medium text-neutral-400">
                  카테고리
                </th>
                <th className="p-4 text-center text-sm font-medium text-neutral-400">
                  지역
                </th>
                <th
                  className="cursor-pointer p-4 text-center text-sm font-medium text-neutral-400 hover:text-white"
                  onClick={() => handleSort('entry')}
                >
                  입장료 <SortIcon column="entry" />
                </th>
                <th
                  className="cursor-pointer p-4 text-center text-sm font-medium text-neutral-400 hover:text-white"
                  onClick={() => handleSort('table')}
                >
                  주대(테이블) <SortIcon column="table" />
                </th>
                <th className="p-4 text-center text-sm font-medium text-neutral-400">
                  음료 가격
                </th>
                <th
                  className="cursor-pointer p-4 text-center text-sm font-medium text-neutral-400 hover:text-white"
                  onClick={() => handleSort('rating')}
                >
                  평점 <SortIcon column="rating" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVenues.map((venue) => (
                <tr
                  key={venue.id}
                  className="border-b border-neutral-800/50 transition hover:bg-neutral-900/50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{venue.nameKo}</span>
                      {venue.isPremium && (
                        <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                          P
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center text-sm text-neutral-400">
                    {categoryLabels[venue.category] || venue.category}
                  </td>
                  <td className="p-4 text-center text-sm text-neutral-400">
                    {venue.regionKo}
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-violet-400">
                    {venue.priceEntry || '문의'}
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-violet-400">
                    {venue.priceTable || '문의'}
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-violet-400">
                    {venue.priceDrink || '문의'}
                  </td>
                  <td className="p-4 text-center text-sm">
                    <span className="text-yellow-500">★</span> {venue.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right text-sm text-neutral-600">
          총 {filteredVenues.length}개 업소
        </div>

        {/* Tips */}
        <div className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8">
          <h2 className="mb-6 text-xl font-bold text-violet-400">가격 절약 팁</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: '사전 예약 할인', desc: '대부분의 클럽과 라운지는 사전 예약 시 입장료 할인이나 무료 입장 혜택을 제공합니다.' },
              { title: 'SNS 게스트 리스트', desc: '공식 SNS를 통해 게스트 등록을 하면 입장료를 크게 절약할 수 있습니다.' },
              { title: '평일 이용', desc: '평일에는 주말 대비 저렴한 가격으로 이용 가능한 곳이 많습니다.' },
              { title: '가격 변동 안내', desc: '표시된 가격은 일반 범위이며, 시기와 이벤트에 따라 달라질 수 있습니다.' },
            ].map((tip) => (
              <div key={tip.title} className="rounded-xl bg-neutral-900/50 p-4">
                <h3 className="mb-1 font-medium">{tip.title}</h3>
                <p className="text-sm text-neutral-400">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <p className="text-sm text-neutral-400">
            이 페이지는 일반적인 가격 정보를 안내하는 교육 콘텐츠입니다.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            정확한 가격은 각 업소에 직접 문의하시기 바랍니다. 마지막 업데이트: 2026년 3월
          </p>
        </div>
      </div>
    </div>
  );
}
