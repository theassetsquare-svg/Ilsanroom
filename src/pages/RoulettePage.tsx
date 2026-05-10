import { lazy, Suspense, useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from '../components/ui/SafeLink';

const Roulette = lazy(() => import('@/components/interactive/Roulette'));

export default function RoulettePage() {
  useDocumentMeta('고민 끝, 룰렛이 대신 골라준다', '오늘 밤 갈 곳 못 정했을 때 탭 한 번이면 결정. 지역·업종·예산·인원 필터 적용해 평점 가중치 랜덤 추천. 다시 돌리기 무제한.');
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, #F59E0B 0%, transparent 40%), radial-gradient(circle at 50% 80%, #8B5CF6 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 text-center">
          <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>🎰</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            고민 끝.<br />
            <span style={{ color: '#F59E0B' }}>룰렛이 골라준다</span>
          </h1>
          <p className="text-base mb-6" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            어디 갈지 못 정하겠다면?<br />
            탭 한 번이면 오늘 밤이 정해진다.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 border border-white/10">
            <PageLiveCounter pageName="룰렛 돌리는 중" baseCount={32} className="text-white/80 [&_strong]:text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-10">
        <Suspense fallback={
          <div className="flex min-h-[20vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B5CF6] border-t-transparent" />
          </div>
        }>
          <Roulette />
        </Suspense>

        <MidContentHook seed="roulette-mid" variant={6} />

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="룰렛 당첨 업소를 더 알고 싶다면">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              룰렛으로 나온 업소가 진짜 괜찮은 곳인지, 다녀온 사람들 후기를 확인해봐.
              랭킹에서 순위도 체크하고 가면 실패 없다.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <Link to="/ranking" className="text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]">랭킹 확인 →</Link>
              <Link to="/community" className="text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]">후기 보기 →</Link>
            </div>
          </div>
        </ReadCompletionReward>

        <div className="text-center">
          <ReadFinishCount pageName="룰렛 페이지" baseCount={140} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
