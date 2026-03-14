'use client';

import { useState } from 'react';
import ShareButtons from './ShareButtons';
import { venues } from '@/data/venues';

export default function Roulette() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');

  const spin = () => {
    setSpinning(true);
    setResult(null);
    let count = 0;
    const interval = setInterval(() => {
      const random = openVenues[Math.floor(Math.random() * openVenues.length)];
      setResult(random.nameKo);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="rounded-2xl border border-neon-accent/30 bg-neon-surface p-8 text-center">
      <h3 className="text-lg font-bold text-neon-text mb-2">오늘의 행운 업소 룰렛</h3>
      <p className="text-sm text-neon-text-muted mb-6">어디 갈지 못 정하겠다면? 운에 맡겨보세요!</p>

      <div className="mb-6 flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-neon-accent/30 bg-neon-bg">
        {result ? (
          <span className={`text-2xl font-extrabold ${spinning ? 'text-neon-text-muted animate-pulse' : 'text-neon-accent'}`}>
            {result}
          </span>
        ) : (
          <span className="text-neon-text-muted">버튼을 눌러 시작!</span>
        )}
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="mb-6 rounded-xl bg-neon-accent px-8 py-3 font-bold text-white transition hover:bg-neon-accent-light disabled:opacity-50"
      >
        {spinning ? '돌리는 중...' : '룰렛 돌리기'}
      </button>

      {result && !spinning && <ShareButtons title={`오늘의 행운 업소: ${result}`} />}
    </div>
  );
}
