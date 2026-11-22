import NcH1 from '@/components/seo/NcH1';
import { lazy, Suspense, useRef } from 'react';
import { WEEKEND_N } from '@/data/venues-counts';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from '../components/ui/SafeLink';

const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));

export default function VSPage() {
  useDocumentMeta('어디가 더 낫냐고? 둘 중 하나만 골라 봐', '강남 클럽과 홍대 클럽, 나이트와 클럽, 테이블석과 스탠딩. 일곱 가지 주제에서 하나씩 골라 보세요. 고른 것은 이 기기에만 저장됩니다.');
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
          <NcH1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            <span style={{ color: '#F87171' }}>A</span> vs <span style={{ color: '#60A5FA' }}>B</span>
            <br />어디가 더 낫냐고?
          </NcH1>
          <p className="text-base mb-4" style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.6)' }}>
            둘 중 하나를 골라 보기
          </p>
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

        <div className="my-8 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
            가게를 항목별로 견주려면 비교 페이지를 이용하세요.
          </p>
          <Link to="/compare" className="inline-flex items-center gap-1 text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] mt-2">
            업소 비교하기 →
          </Link>
        </div>

        <nav className="mt-8 rounded-2xl border border-gray-200 bg-white p-5" aria-label="시점별 큐레이션">
          <h2 className="text-base font-bold text-[#111] mb-3">다 골랐다면, 갈 곳도 찾아보세요</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/ranking" className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-sm font-bold text-[#111] active:bg-gray-100">
              🏆 인기 랭킹 →
            </Link>
            <Link to="/weekend" className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-sm font-bold text-[#111] active:bg-gray-100">
              📅 이번 주말 {WEEKEND_N}곳 →
            </Link>
            <Link to="/occasion" className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-sm font-bold text-[#111] active:bg-gray-100">
              🎯 상황별 6가지 →
            </Link>
            <Link to="/budget" className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-sm font-bold text-[#111] active:bg-gray-100">
              💼 예산별 코스 4개 →
            </Link>
          </div>
        </nav>

      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
