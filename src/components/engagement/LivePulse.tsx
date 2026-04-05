
import { useState, useEffect, useRef } from 'react';

/**
 * [1] LIVE PULSE — "지금 이 순간 342명이 놀쿨에서 밤을 준비하고 있다"
 * Red dot animation. Number increases randomly every 3sec. Creates FOMO.
 */
export default function LivePulse() {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 100) + 280);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 2; // -2 to +4
        return Math.max(200, prev + delta);
      });
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4">
      <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-4 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className="text-sm font-bold text-red-600">LIVE</span>
        <span className="text-sm text-[#333]">
          지금 <span className="font-black text-red-600">{count.toLocaleString()}</span>명이 밤을 준비하고 있다
        </span>
      </div>
    </div>
  );
}
