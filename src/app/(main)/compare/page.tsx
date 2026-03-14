'use client';

import { useState, useMemo } from 'react';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

const categoryLabels: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지', room: '룸',
  yojeong: '요정', hoppa: '호빠', collatek: '콜라텍',
};

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeVenues = venues.filter((v) => v.status !== 'closed_or_unclear');
  const selectedVenues = selectedIds
    .map((id) => activeVenues.find((v) => v.id === id))
    .filter(Boolean) as Venue[];

  const filteredPicker = useMemo(() => {
    return activeVenues.filter(
      (v) =>
        !selectedIds.includes(v.id) &&
        (v.nameKo.includes(searchTerm) || v.regionKo.includes(searchTerm))
    );
  }, [searchTerm, selectedIds, activeVenues]);

  const handleSelect = (venueId: string, slot: number) => {
    const newIds = [...selectedIds];
    newIds[slot] = venueId;
    setSelectedIds(newIds);
    setShowPicker(null);
    setSearchTerm('');
  };

  const handleRemove = (slot: number) => {
    const newIds = [...selectedIds];
    newIds.splice(slot, 1);
    setSelectedIds(newIds);
  };

  const handleVote = (venueId: string) => {
    setVotes((prev) => ({ ...prev, [venueId]: (prev[venueId] || 0) + 1 }));
  };

  const totalVotes = selectedVenues.reduce((sum, v) => sum + (votes[v.id] || 0), 0);

  const comparisonRows: { label: string; key: keyof Venue; format?: (v: unknown) => string }[] = [
    { label: '카테고리', key: 'category', format: (v) => categoryLabels[v as string] || String(v) },
    { label: '지역', key: 'regionKo' },
    { label: '평점', key: 'rating', format: (v) => `★ ${v}` },
    { label: '리뷰 수', key: 'reviewCount', format: (v) => `${v}개` },
    { label: '영업시간', key: 'openHours' },
    { label: '연령대', key: 'ageGroup' },
    { label: '드레스코드', key: 'dressCode' },
    { label: '주차', key: 'parking' },
    { label: '최근역', key: 'nearbyStation' },
    { label: '추천 시간', key: 'bestTime' },
    { label: '입장료', key: 'priceEntry', format: (v) => (v as string) || '문의' },
    { label: '주대', key: 'priceTable', format: (v) => (v as string) || '문의' },
    { label: '음료 가격', key: 'priceDrink', format: (v) => (v as string) || '문의' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            업소 <span className="text-violet-400">비교</span>
          </h1>
          <p className="text-lg text-neutral-400">
            최대 3개 업소를 나란히 비교하고 투표하세요
          </p>
        </div>

        {/* Selection Slots */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((slot) => (
            <div key={slot} className="relative">
              {selectedVenues[slot] ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-violet-500/30 bg-neutral-900 p-5 text-center">
                  <p className="font-semibold text-white">{selectedVenues[slot].nameKo}</p>
                  <p className="text-xs text-neutral-500">
                    {categoryLabels[selectedVenues[slot].category]} · {selectedVenues[slot].regionKo}
                  </p>
                  <button
                    onClick={() => handleRemove(slot)}
                    className="mt-1 text-xs text-red-400 hover:text-red-300"
                  >
                    제거
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowPicker(slot); setSearchTerm(''); }}
                  className="flex h-24 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 transition hover:border-violet-500/50"
                >
                  <span className="text-sm text-neutral-500">+ 업소 선택</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Venue Picker Modal */}
        {showPicker !== null && (
          <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">업소 선택</h3>
              <button
                onClick={() => setShowPicker(null)}
                className="text-sm text-neutral-500 hover:text-white"
              >
                닫기
              </button>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="업소명 또는 지역으로 검색..."
              className="mb-4 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500"
            />
            <div className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {filteredPicker.map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => handleSelect(venue.id, showPicker)}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-left transition hover:border-violet-500/50 hover:bg-neutral-900"
                >
                  <p className="text-sm font-medium text-white">{venue.nameKo}</p>
                  <p className="text-xs text-neutral-500">
                    {categoryLabels[venue.category]} · {venue.regionKo} · ★{venue.rating}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {selectedVenues.length >= 2 && (
          <>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900">
                    <th className="p-4 text-left text-sm font-medium text-neutral-400">항목</th>
                    {selectedVenues.map((venue) => (
                      <th key={venue.id} className="p-4 text-center text-sm font-semibold text-white">
                        {venue.nameKo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-b border-neutral-800/50 transition hover:bg-neutral-900/50">
                      <td className="p-4 text-sm font-medium text-neutral-400">{row.label}</td>
                      {selectedVenues.map((venue) => {
                        const value = venue[row.key];
                        const formatted = row.format ? row.format(value) : String(value ?? '');
                        return (
                          <td key={venue.id} className="p-4 text-center text-sm">
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-b border-neutral-800/50 transition hover:bg-neutral-900/50">
                    <td className="p-4 text-sm font-medium text-neutral-400">특징</td>
                    {selectedVenues.map((venue) => (
                      <td key={venue.id} className="p-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {venue.features.map((f) => (
                            <span key={f} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="transition hover:bg-neutral-900/50">
                    <td className="p-4 text-sm font-medium text-neutral-400">분위기</td>
                    {selectedVenues.map((venue) => (
                      <td key={venue.id} className="p-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {venue.atmosphere.map((a) => (
                            <span key={a} className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Voting Section */}
            <div className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8">
              <h2 className="mb-6 text-center text-xl font-bold text-white">
                어디가 더 좋을까요? 투표하세요!
              </h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedVenues.length}, 1fr)` }}>
                {selectedVenues.map((venue) => {
                  const voteCount = votes[venue.id] || 0;
                  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  return (
                    <div key={venue.id} className="text-center">
                      <button
                        onClick={() => handleVote(venue.id)}
                        className="w-full rounded-xl border border-violet-500/30 bg-neutral-900 p-6 transition hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10"
                      >
                        <p className="text-lg font-bold text-white">{venue.nameKo}</p>
                        <p className="mt-1 text-sm text-neutral-500">{venue.regionKo}</p>
                      </button>
                      <div className="mt-4">
                        <div className="mx-auto h-3 w-full overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-neutral-400">
                          <span className="font-bold text-violet-400">{pct}%</span>
                          <span className="text-neutral-600"> ({voteCount}표)</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalVotes > 0 && (
                <p className="mt-6 text-center text-sm text-neutral-500">
                  총 {totalVotes}표 참여
                </p>
              )}
            </div>
          </>
        )}

        {selectedVenues.length < 2 && (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <p className="text-lg text-neutral-400">
              2개 이상의 업소를 선택하면 비교 결과가 표시됩니다
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              위에서 &quot;+ 업소 선택&quot; 버튼을 눌러 비교할 업소를 추가하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
