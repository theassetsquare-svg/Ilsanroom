

import { useState, useRef, useEffect } from 'react';
import ShareButtons from './ShareButtons';
import { venues } from '@/data/venues';

export default function Roulette() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);

  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const spin = () => {
    setSpinning(true);
    setResult(null);
    let count = 0;
    intervalRef.current = setInterval(() => {
      const random = openVenues[Math.floor(Math.random() * openVenues.length)];
      setResult(random.nameKo);
      count++;
      if (count > 15) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setSpinning(false);

        // 매일 1회 보상
        const today = new Date().toDateString();
        const lastSpin = localStorage.getItem('roulette_last');
        if (lastSpin !== today) {
          localStorage.setItem('roulette_last', today);
          const spins = parseInt(localStorage.getItem('roulette_total') || '0') + 1;
          localStorage.setItem('roulette_total', String(spins));
          if (spins === 1) setReward('첫 룰렛 도전! 운명의 시작');
          else if (spins === 5) setReward('5회 달성! 행운의 주사위 칭호 획득');
          else if (spins === 10) setReward('10회 달성! 운명의 손 칭호 획득');
          else if (spins % 10 === 0) setReward(`${spins}회 달성! 룰렛 마스터`);
          else setReward('오늘의 행운 확인 완료!');
          setTimeout(() => setReward(null), 3000);
        }
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

      {reward && (
        <div className="mb-4 animate-bounce text-sm font-bold text-neon-gold">
          🎁 {reward}
        </div>
      )}

      {result && !spinning && <ShareButtons title={`오늘의 행운 업소: ${result}`} />}
    </div>
  );
}
