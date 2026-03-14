'use client';

import dynamic from 'next/dynamic';

const Roulette = dynamic(() => import('@/components/interactive/Roulette'), { ssr: false });
const AIChatbot = dynamic(() => import('@/components/interactive/AIChatbot'), { ssr: false });

export default function RoulettePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-neon-text mb-2">오늘 갈 곳 룰렛</h1>
        <p className="text-neon-text-muted">어디 갈지 못 정하겠다면? 운에 맡겨보세요!</p>
      </div>
      <Roulette />
      <section>
        <h2 className="mb-4 text-xl font-bold text-neon-text">AI에게 물어보기</h2>
        <AIChatbot />
      </section>
    </div>
  );
}
