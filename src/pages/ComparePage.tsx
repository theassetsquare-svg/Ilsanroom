

import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import Badge from '@/components/ui/Badge';
import type { Venue } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, MidContentQuiz, ReadingMilestone } from '@/components/engagement/ReadingEngagement';

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

/* 비교 추천 조합 — 편집부 큐레이션 (실 사용자 통계 아님) */
const popularComparisons = [
  { pair: ['일산룸', '일산명월관요정'], label: '일산 룸 vs 요정' },
  { pair: ['강남청담클럽 레이스', '홍대클럽'], label: '강남 클럽 vs 홍대 클럽' },
  { pair: ['수원찬스돔나이트', '성남샴푸나이트'], label: '수원 vs 성남 나이트' },
];

export default function ComparePage() {
  useDocumentMeta('두 곳 놓고 따져보면 후회가 없다', '가격·분위기·후기·평점·접근성 항목별 두 업소 비교표. 강남 vs 홍대, 클럽 vs 라운지 인기 매치 모음. 고민 끝, 선택만 남았어요.');
  const [selected, setSelected] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #3B82F6 0%, transparent 40%), radial-gradient(circle at 70% 50%, #EF4444 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="비교 중" baseCount={28} className="text-white/80 [&_strong]:text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            ⚖️ 두 곳 놓고 따져보면<br />
            <span style={{ color: '#60A5FA' }}>후회가 없다</span>
          </h1>
          <p className="text-base mb-6" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            2~3곳 선택하면 양주·룸·분위기 항목별 비교표가 나온다.
          </p>

          {/* 인기 비교 조합 */}
          <div className="mt-6">
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>🔥 편집부 추천 비교 조합</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularComparisons.map((pc) => (
                <button
                  key={pc.label}
                  onClick={() => {
                    const ids = openVenues
                      .filter(v => pc.pair.some(name => v.nameKo.includes(name)))
                      .slice(0, 2)
                      .map(v => v.id);
                    if (ids.length >= 2) setSelected(ids);
                  }}
                  className="rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs border border-white/10 hover:bg-white/20 transition"
                  style={{ minHeight: 36, color: 'rgba(255,255,255,0.8)' }}
                >
                  {pc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        {/* Venue Selector */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-[#111]">비교할 업소 선택 (최대 3곳)</h2>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {openVenues.slice(0, 30).map((v) => (
              <button
                key={v.id}
                onClick={() => toggleSelect(v.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selected.includes(v.id)
                    ? 'bg-[#8B5CF6] text-white shadow-md'
                    : 'border border-gray-200 bg-white text-[#555] hover:border-[#8B5CF6]/30'
                }`}
                style={{ minHeight: 32 }}
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
                <div key={v.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <Link target="_blank" rel="noopener noreferrer" to={getCategoryHref(v)}>
                    <h3 className="text-lg font-bold text-[#8B5CF6] hover:text-[#7C3AED] mb-2 transition-colors">{v.nameKo}</h3>
                  </Link>
                  {v.isPremium && <Badge variant="premium" className="mb-3">PREMIUM</Badge>}

                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-[#999] text-xs">카테고리</dt><dd className="text-[#111] font-medium">{categoryLabels[v.category]}</dd></div>
                    <div><dt className="text-[#999] text-xs">지역</dt><dd className="text-[#111]">{v.regionKo}</dd></div>
                    {v.reviewCount > 0 && v.rating > 0 && (
                      <div><dt className="text-[#999] text-xs">평점</dt><dd className="font-bold" style={{ color: '#F59E0B' }}>★ {v.rating.toFixed(1)} ({v.reviewCount})</dd></div>
                    )}
                    {v.staffNickname && <div><dt className="text-[#999] text-xs">담당</dt><dd style={{ color: '#D97706' }}>{v.staffNickname}</dd></div>}
                    <div><dt className="text-[#999] text-xs">양주</dt><dd className="text-[#111]">{v.liquorInfo || '매장 문의'}</dd></div>
                    <div><dt className="text-[#999] text-xs">부스</dt><dd className="text-[#111]">{v.boothInfo || '매장 문의'}</dd></div>
                    <div><dt className="text-[#999] text-xs">룸</dt><dd className="text-[#111]">{v.roomInfo || '매장 문의'}</dd></div>
                    {v.openHours && <div><dt className="text-[#999] text-xs">영업시간</dt><dd className="text-[#111]">{v.openHours}</dd></div>}
                    {v.dressCode && <div><dt className="text-[#999] text-xs">드레스코드</dt><dd className="text-[#111]">{v.dressCode}</dd></div>}
                  </dl>

                  {v.features.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-[#999] mb-1">특징</p>
                      <div className="flex flex-wrap gap-1">
                        {v.features.slice(0, 4).map((f) => (
                          <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-[#555]">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => vote(v.id)}
                    className="mt-6 w-full rounded-xl border-2 border-[#8B5CF6]/30 py-2.5 text-sm font-bold text-[#8B5CF6] transition-all hover:bg-[#8B5CF6] hover:text-white active:scale-95"
                    style={{ minHeight: 44 }}
                  >
                    여기가 더 낫다 {votes[v.id] ? `(${votes[v.id]}표)` : ''}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
            <span className="text-4xl block mb-3">⚖️</span>
            <p className="text-[#111] font-bold mb-1">위에서 2~3곳을 선택해보세요</p>
            <p className="text-sm text-[#555]">항목별 비교표가 자동으로 나타납니다</p>
          </div>
        )}

        <MidContentHook seed="compare-mid" variant={2} />

        {/* 중간 퀴즈 */}
        <MidContentQuiz
          question="업소 고를 때 뭐가 제일 중요해?"
          options={['분위기가 전부다', '양주 라인업', '위치가 가까운 곳', '후기 좋은 곳이 답이다']}
          seed="compare-quiz"
        />

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="비교로 안 보이는 진짜 차이">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              표로 비교되지 않는 것: <strong>실장의 센스, 웨이터 서비스, 그날의 분위기.</strong>
              직접 다녀온 사람들의 커뮤니티 후기를 같이 보면 실패가 없다.
            </p>
            <Link to="/community" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
              실제 후기 보러 가기 →
            </Link>
          </div>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="업소 비교" baseCount={160} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
