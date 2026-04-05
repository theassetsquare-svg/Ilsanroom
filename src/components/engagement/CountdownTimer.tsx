
import { useState, useEffect, useRef } from 'react';

/**
 * [3] COUNTDOWN TIMER — "이번 주말 예약 가능: 3자리 남음" with live countdown
 * Red pulsing dot. Creates urgency. Must book NOW.
 */
export default function CountdownTimer({ venueName }: { venueName: string }) {
  const [spots, setSpots] = useState(() => Math.floor(Math.random() * 4) + 1);
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const getNextWeekend = () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSat = day <= 6 ? (6 - day) : 0;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      sat.setHours(21, 0, 0, 0);
      if (sat.getTime() <= now.getTime()) {
        sat.setDate(sat.getDate() + 7);
      }
      return sat;
    };

    const update = () => {
      const target = getNextWeekend();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('마감!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}시간 ${m}분 ${s}초`);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Occasionally decrease spots for urgency
  useEffect(() => {
    const t = setTimeout(() => {
      if (spots > 1 && Math.random() > 0.6) setSpots(prev => Math.max(1, prev - 1));
    }, 15000 + Math.random() * 20000);
    return () => clearTimeout(t);
  }, [spots]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-red-600 truncate">
          주말 {spots}자리 남음
        </p>
        <p className="text-[11px] text-red-500">{timeLeft}</p>
      </div>
    </div>
  );
}
