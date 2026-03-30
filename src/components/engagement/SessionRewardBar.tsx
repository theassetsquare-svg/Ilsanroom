import { useState, useEffect, useRef } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ChevronUp } from 'lucide-react';

interface Milestone {
  minutes: number;
  emoji: string;
  label: string;
  points: number;
  extra?: string;
}

const MILESTONES: Milestone[] = [
  { minutes: 1, emoji: '🎁', label: '첫 방문 보너스', points: 10 },
  { minutes: 5, emoji: '⭐', label: '탐색 보너스', points: 25 },
  { minutes: 10, emoji: '🔥', label: '열정 보너스', points: 50 },
  { minutes: 20, emoji: '💎', label: '마니아 보너스', points: 100 },
  { minutes: 30, emoji: '👑', label: 'VIP 보너스', points: 150, extra: '숨겨진 업소 언락' },
  { minutes: 45, emoji: '🏆', label: '전설 보너스', points: 200 },
  { minutes: 60, emoji: '✨', label: '신화 보너스', points: 300, extra: '한정 뱃지' },
  { minutes: 90, emoji: '💫', label: 'ULTIMATE', points: 500 },
];

export default function SessionRewardBar() {
  const store = useEngagementStore();
  const levelInfo = store.getLevel();
  const [expanded, setExpanded] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [claimedMilestones, setClaimedMilestones] = useState<Set<number>>(new Set());
  const [pointDelta, setPointDelta] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);
  const sessionStartRef = useRef(Date.now());
  const ptTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const celTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 60000);
      setSessionMinutes(elapsed);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('session_milestones');
      if (saved) setClaimedMilestones(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    MILESTONES.forEach((m) => {
      if (sessionMinutes >= m.minutes && !claimedMilestones.has(m.minutes)) {
        setClaimedMilestones(prev => {
          const next = new Set(prev);
          next.add(m.minutes);
          try { sessionStorage.setItem('session_milestones', JSON.stringify([...next])); } catch { /* ignore */ }
          return next;
        });
        store.addPoints(m.points, m.label);
        setPointDelta(m.points);
        setCelebration(`${m.emoji} ${m.label}!`);
        if (ptTimerRef.current) clearTimeout(ptTimerRef.current);
        if (celTimerRef.current) clearTimeout(celTimerRef.current);
        ptTimerRef.current = setTimeout(() => setPointDelta(null), 2000);
        celTimerRef.current = setTimeout(() => setCelebration(null), 3000);
      }
    });
  }, [sessionMinutes, claimedMilestones, store]);

  return (
    <>
      <AnimatePresence>
        {celebration && (
          <motion.div
            className="absolute -top-8 left-1/2 z-10 -translate-x-1/2"
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <div className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-2.5 text-sm font-bold text-white shadow-xl">
              {celebration}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="relative bg-white border-t border-gray-100 shadow-2xl rounded-2xl max-h-[60vh] overflow-y-auto mx-4 mt-2"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#111]">세션 보상 타임라인</h3>
                <span className="text-xs text-[#333]">접속 {sessionMinutes}분</span>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                {MILESTONES.map((m, i) => {
                  const reached = claimedMilestones.has(m.minutes);
                  const isNext = !reached && (i === 0 || claimedMilestones.has(MILESTONES[i - 1].minutes));
                  return (
                    <div key={m.minutes} className="relative mb-5 last:mb-0">
                      <div
                        className={`absolute -left-5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs
                          ${reached
                            ? 'bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] text-white shadow-md shadow-purple-200'
                            : isNext
                              ? 'bg-white border-2 border-[#8B5CF6] text-[#8B5CF6] animate-pulse'
                              : 'bg-gray-100 border border-gray-200 text-gray-400'
                          }`}
                      >
                        {reached ? '✓' : m.emoji}
                      </div>
                      <div className={`${reached ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#111]">{m.emoji} {m.label}</span>
                          <span className={`text-xs font-bold ${reached ? 'text-green-500' : 'text-[#8B5CF6]'}`}>
                            {reached ? '획득!' : `+${m.points}P`}
                          </span>
                        </div>
                        <p className="text-xs text-[#333] mt-0.5">
                          {m.minutes}분 체류
                          {m.extra && <span className="text-[#EC4899] ml-1">+ {m.extra}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-12 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-md rounded-xl mt-4 mx-4">
        <div className="flex h-full items-center justify-between px-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-base">{levelInfo.name.split(' ')[0]}</span>
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-[#111]">{store.streak}</span>
            </div>
            <span className="text-xs font-medium text-[#8B5CF6] bg-purple-50 px-1.5 py-0.5 rounded-full">
              Lv.{levelInfo.level} {levelInfo.name.split(' ')[1] || ''}
            </span>
          </div>
          <div className="flex-1 mx-4 max-w-[200px]">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-[#333] text-center mt-0.5">{Math.round(levelInfo.progress * 100)}%</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-xs font-bold text-[#111]">{store.points}P</span>
              <AnimatePresence>
                {pointDelta && (
                  <motion.span
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-green-500 whitespace-nowrap"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -16, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                  >
                    +{pointDelta}P
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-full hover:bg-gray-100 transition"
              aria-label={expanded ? '닫기' : '보상 보기'}
            >
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronUp size={16} className="text-[#333]" />
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
