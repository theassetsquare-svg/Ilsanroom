import { lazy, Suspense, useRef } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { MidContentHook, ReadFinishCount, ReadCompletionReward, NextSectionTeaser, ReadingMilestone } from '@/components/engagement/ReadingEngagement';
import { Link } from 'react-router-dom';

const MBTIQuiz = lazy(() => import('@/components/interactive/MBTIQuiz'));
const Roulette = lazy(() => import('@/components/interactive/Roulette'));
const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));
const DressCodeChecker = lazy(() => import('@/components/interactive/DressCodeChecker'));
const AIChatbot = lazy(() => import('@/components/interactive/AIChatbot'));
const HotRightNow = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.HotRightNow })));
const AttendanceCheck = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.AttendanceCheck })));
const DrinkBudgetCalc = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.DrinkBudgetCalc })));
const InviteFriend = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.InviteFriend })));

const sectionList = [
  { emoji: '🔥', label: '지금 핫한 곳' },
  { emoji: '🤖', label: 'AI 챗봇' },
  { emoji: '📅', label: '출석 도장' },
  { emoji: '🎭', label: 'MBTI 테스트' },
  { emoji: '🎰', label: '룰렛' },
  { emoji: '⚔️', label: 'VS 배틀' },
  { emoji: '👔', label: '드레스코드' },
  { emoji: '🍺', label: '술값 계산기' },
];

export default function QuizPage() {
  useDocumentMeta('클럽형인지 라운지형인지, 테스트 해봐', '10문항 답하면 나한테 맞는 유흥 스타일이 나온다. 소요시간 2분.');
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0118] via-[#1a0a2e] to-[#0f0720]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #EC4899 0%, transparent 40%), radial-gradient(circle at 70% 70%, #8B5CF6 0%, transparent 40%), radial-gradient(circle at 50% 50%, #F59E0B 0%, transparent 30%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/10">
            <PageLiveCounter pageName="놀고 있는 중" baseCount={55} className="text-white/80 [&_strong]:text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            🎮 인터랙티브 존
          </h1>
          <p className="text-base text-white/60 mb-6" style={{ lineHeight: '1.7' }}>
            MBTI 테스트, 룰렛, VS배틀, 출석체크, 술값계산기<br />
            심심할 틈 없다. 하나씩 다 해봐.
          </p>

          {/* 빠른 이동 */}
          <div className="flex flex-wrap justify-center gap-2">
            {sectionList.map((s) => (
              <span key={s.label} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 border border-white/5">
                {s.emoji} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
        {/* [F] 지금 핫한 곳 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-base">🔥</span>
            지금 이 시간 핫한 곳
          </h2>
          <Suspense fallback={null}><HotRightNow /></Suspense>
        </section>

        <NextSectionTeaser text="AI한테 취향 말하면 맞춤 추천해준다" emoji="🤖" />

        {/* AI Chatbot */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-base">🤖</span>
            AI 챗봇
          </h2>
          <Suspense fallback={null}><AIChatbot /></Suspense>
        </section>

        <MidContentHook seed="quiz-mid1" variant={7} />

        {/* [O] 출석 도장 */}
        <section>
          <Suspense fallback={null}><AttendanceCheck /></Suspense>
        </section>

        <NextSectionTeaser text="너는 클럽형? 라운지형? 아래에서 알아봐" emoji="🎭" />

        {/* MBTI */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-base">🎭</span>
            밤문화 MBTI (8유형)
          </h2>
          <Suspense fallback={null}><MBTIQuiz /></Suspense>
        </section>

        <MidContentHook seed="quiz-mid2" variant={3} />

        {/* 룰렛 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-base">🎰</span>
            행운의 업소 룰렛
          </h2>
          <Suspense fallback={null}><Roulette /></Suspense>
        </section>

        <NextSectionTeaser text="두 곳 중 어디가 나은지 투표해봐" emoji="⚔️" />

        {/* VS 배틀 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-base">⚔️</span>
            VS 배틀 투표
          </h2>
          <Suspense fallback={null}><VSBattle /></Suspense>
        </section>

        <MidContentHook seed="quiz-mid3" variant={1} />

        {/* 드레스코드 */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#111] flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-base">👔</span>
            드레스코드 체커
          </h2>
          <Suspense fallback={null}><DressCodeChecker /></Suspense>
        </section>

        {/* [S] 술값 계산기 */}
        <section>
          <Suspense fallback={null}><DrinkBudgetCalc /></Suspense>
        </section>

        {/* [AK] 친구 초대 */}
        <section>
          <Suspense fallback={null}><InviteFriend /></Suspense>
        </section>

        {/* ═══ BOTTOM ═══ */}
        <ReadCompletionReward teaser="전부 다 해본 사람만 보는 히든 정보">
          <div className="space-y-2">
            <p className="text-sm text-[#555]" style={{ lineHeight: '1.7' }}>
              MBTI 결과에 따라 추천되는 업소가 다르다.
              <strong>클럽형</strong>이면 강남·홍대, <strong>라운지형</strong>이면 압구정·청담.
              랭킹에서 내 스타일에 맞는 곳을 찾아봐.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <Link to="/ranking" className="text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]">랭킹 보기 →</Link>
              <Link to="/guide" className="text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED]">첫 방문 가이드 →</Link>
            </div>
          </div>
        </ReadCompletionReward>

        <div className="text-center">
          <ReadFinishCount pageName="인터랙티브 존" baseCount={220} />
        </div>
      </div>

      <ReadingMilestone containerRef={containerRef} />
    </div>
  );
}
