import { lazy, Suspense } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const MBTIQuiz = lazy(() => import('@/components/interactive/MBTIQuiz'));
const Roulette = lazy(() => import('@/components/interactive/Roulette'));
const VSBattle = lazy(() => import('@/components/interactive/VSBattle'));
const DressCodeChecker = lazy(() => import('@/components/interactive/DressCodeChecker'));
const AIChatbot = lazy(() => import('@/components/interactive/AIChatbot'));
const HotRightNow = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.HotRightNow })));
const AttendanceCheck = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.AttendanceCheck })));
const DrinkBudgetCalc = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.DrinkBudgetCalc })));
const InviteFriend = lazy(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.InviteFriend })));

export default function QuizPage() {
  useDocumentMeta('나한테 맞는 밤문화 MBTI는? 2분이면 나온다 | 플밤', '10개 질문으로 딱 맞는 업소 유형 추천.');
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">인터랙티브 존</h1>
        <p className="text-neon-text-muted">AI챗봇, 퀴즈, 룰렛, VS배틀, 출석체크, 술값계산기 — 놀 거리 가득!</p>
      </div>

      {/* [F] 지금 핫한 곳 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">지금 이 시간 핫한 곳</h2>
        <Suspense fallback={null}><HotRightNow /></Suspense>
      </section>

      {/* AI Chatbot */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">오늘밤뭐하지? AI 챗봇</h2>
        <Suspense fallback={null}><AIChatbot /></Suspense>
      </section>

      {/* [O] 출석 도장 */}
      <section>
        <Suspense fallback={null}><AttendanceCheck /></Suspense>
      </section>

      {/* MBTI */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">밤문화 MBTI (8유형)</h2>
        <Suspense fallback={null}><MBTIQuiz /></Suspense>
      </section>

      {/* 룰렛 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">행운의 업소 룰렛</h2>
        <Suspense fallback={null}><Roulette /></Suspense>
      </section>

      {/* VS 배틀 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">VS 배틀 투표</h2>
        <Suspense fallback={null}><VSBattle /></Suspense>
      </section>

      {/* 드레스코드 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">드레스코드 체커</h2>
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
    </div>
  );
}
