'use client';

import dynamic from 'next/dynamic';

const MBTIQuiz = dynamic(() => import('@/components/interactive/MBTIQuiz'), { ssr: false });
const Roulette = dynamic(() => import('@/components/interactive/Roulette'), { ssr: false });
const VSBattle = dynamic(() => import('@/components/interactive/VSBattle'), { ssr: false });
const DressCodeChecker = dynamic(() => import('@/components/interactive/DressCodeChecker'), { ssr: false });
const AIChatbot = dynamic(() => import('@/components/interactive/AIChatbot'), { ssr: false });

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">인터랙티브 존</h1>
        <p className="text-neon-text-muted">퀴즈, MBTI, 룰렛, VS배틀, 드레스코드 체크, AI 챗봇</p>
      </div>

      {/* AI Chatbot — 오늘밤뭐하지? */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">오늘밤뭐하지? AI 챗봇</h2>
        <AIChatbot />
      </section>

      {/* MBTI 나이트라이프 유형 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">나이트라이프 MBTI (8유형)</h2>
        <p className="mb-4 text-sm text-neon-text-muted">8문항, 3~5분 소요</p>
        <MBTIQuiz />
      </section>

      {/* 룰렛 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">행운의 업소 룰렛</h2>
        <p className="mb-4 text-sm text-neon-text-muted">1~2분, 운에 맡겨보세요!</p>
        <Roulette />
      </section>

      {/* VS 배틀 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">VS 배틀 투표</h2>
        <p className="mb-4 text-sm text-neon-text-muted">2~3분, 당신의 선택은?</p>
        <VSBattle />
      </section>

      {/* 드레스코드 체커 */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">드레스코드 체커</h2>
        <p className="mb-4 text-sm text-neon-text-muted">지금 입은 옷으로 어디까지?</p>
        <DressCodeChecker />
      </section>
    </div>
  );
}
