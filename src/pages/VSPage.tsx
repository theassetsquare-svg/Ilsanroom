import { lazy, Suspense, useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { ReadFinishCount, ReadCompletionReward, MidContentHook, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from 'react-router-dom';

const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));

export default function VSPage() {
  useDocumentMeta('어디가 더 낫냐고? 투표로 결판내자', '인기 업소끼리 맞짱. 한 표 던지고 실시간 결과 확인해봐.');
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #EF4444 0%, transparent 40%), radial-gradient(circle at 75% 50%, #3B82F6 0%, transparent 40%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-5xl">⚔️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            <span className="text-red-400">A</span> vs <span className="text-blue-400">B</span>
            <br />어디가 더 낫냐고?
          </h1>
          <p className="text-base text-white/60 mb-4" style={{ lineHeight: '1.7' }}>
            인기 업소끼리 실시간 대결. 한 표 던지고 결과 확인해봐.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 border border-white/10">
            <PageLiveCounter pageName="투표 참여 중" baseCount={44} className="text-white/80 [&_strong]:text-white" />
          </div>
        </div>
      </div>

      {/* ═══ VS BATTLE ═══ */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Suspense fallback={
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
          </div>
        }>
          <VSBattle />
        </Suspense>

        <MidContentHook seed="vs-battle" variant={1} />

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="투표 결과에서 보이는 재미있는 패턴">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              <strong>금요일 밤</strong>에 투표하는 사람들은 <strong>강남</strong>쪽에 표를 더 많이 주고,
              <strong>토요일 오후</strong>에는 <strong>홍대·이태원</strong>쪽이 더 인기있다.
            </p>
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              직접 비교해보고 싶다면 비교 페이지에서 항목별로 따져볼 수 있다.
            </p>
            <Link to="/compare" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
              업소 비교하기 →
            </Link>
          </div>
        </ReadCompletionReward>

        <div className="text-center mt-6">
          <ReadFinishCount pageName="VS 대결" baseCount={200} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
