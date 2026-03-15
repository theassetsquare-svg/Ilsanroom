'use client';

import dynamic from 'next/dynamic';

const MBTIQuiz = dynamic(() => import('@/components/interactive/MBTIQuiz'), { ssr: false });
const Roulette = dynamic(() => import('@/components/interactive/Roulette'), { ssr: false });
const VSBattle = dynamic(() => import('@/components/interactive/VSBattle'), { ssr: false });
const DressCodeChecker = dynamic(() => import('@/components/interactive/DressCodeChecker'), { ssr: false });
const AIChatbot = dynamic(() => import('@/components/interactive/AIChatbot'), { ssr: false });
const HotRightNow = dynamic(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.HotRightNow })), { ssr: false });
const AttendanceCheck = dynamic(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.AttendanceCheck })), { ssr: false });
const DrinkBudgetCalc = dynamic(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.DrinkBudgetCalc })), { ssr: false });
const InviteFriend = dynamic(() => import('@/components/interactive/KillerFeatures').then(m => ({ default: m.InviteFriend })), { ssr: false });

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">인터랙티브 존</h1>
        <p className="text-neon-text-muted">AI챗봇, 퀴즈, 룰렛, VS배틀, 출석체크, 술값계산기 — 놀 거리 가득!</p>
      </div>

      {/* [F] 지금 핫한 곳 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">지금 이 시간 핫한 곳</h2>
        <HotRightNow />
      </section>

      {/* AI Chatbot */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">오늘밤뭐하지? AI 챗봇</h2>
        <AIChatbot />
      </section>

      {/* [O] 출석 도장 */}
      <section>
        <AttendanceCheck />
      </section>

      {/* MBTI */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">밤문화 MBTI (8유형)</h2>
        <MBTIQuiz />
      </section>

      {/* 룰렛 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">행운의 업소 룰렛</h2>
        <Roulette />
      </section>

      {/* VS 배틀 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">VS 배틀 투표</h2>
        <VSBattle />
      </section>

      {/* 드레스코드 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">드레스코드 체커</h2>
        <DressCodeChecker />
      </section>

      {/* [S] 술값 계산기 */}
      <section>
        <DrinkBudgetCalc />
      </section>

      {/* [AK] 친구 초대 */}
      <section>
        <InviteFriend />
      </section>
    </div>
  );
}
