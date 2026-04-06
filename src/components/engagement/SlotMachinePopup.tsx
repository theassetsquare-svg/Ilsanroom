import { useState, useEffect, useRef, useCallback } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Slot Machine Psychology - Variable Ratio Reinforcement
 *
 * Every 2-8 minutes, a popup appears offering a "spin" for random points.
 * The unpredictable timing + unpredictable reward = maximum dopamine.
 * Same psychology that makes slot machines addictive.
 */

const SYMBOLS = ['7️⃣', '💎', '🍒', '⭐', '🔔', '🍀', '👑', '🎯'];

function getRandomInterval(): number {
  return (Math.floor(Math.random() * 10) + 15) * 60 * 1000; // 15-25 minutes
}

function spinResult(): { symbols: string[]; points: number; label: string } {
  const s1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const s2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const s3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  if (s1 === s2 && s2 === s3) {
    return { symbols: [s1, s2, s3], points: 100, label: 'JACKPOT!' };
  }
  if (s1 === s2 || s2 === s3 || s1 === s3) {
    return { symbols: [s1, s2, s3], points: 30 + Math.floor(Math.random() * 20), label: '2매치!' };
  }
  return { symbols: [s1, s2, s3], points: 5 + Math.floor(Math.random() * 10), label: '참여 보상' };
}

export default function SlotMachinePopup() {
  const store = useEngagementStore();
  const [show, setShow] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ symbols: string[]; points: number; label: string } | null>(null);
  const [displaySymbols, setDisplaySymbols] = useState(['❓', '❓', '❓']);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const spinCountRef = useRef(0);

  const scheduleNext = useCallback(() => {
    if (spinCountRef.current >= 2) return; // Max 2 per session
    timeoutRef.current = setTimeout(() => {
      setShow(true);
      setResult(null);
      setDisplaySymbols(['❓', '❓', '❓']);
      setSpinning(false);
    }, getRandomInterval());
  }, []);

  useEffect(() => {
    // First popup after 10-15 minutes
    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, (Math.floor(Math.random() * 5) + 10) * 60 * 1000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); if (spinIntervalRef.current) clearInterval(spinIntervalRef.current); };
  }, []);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    spinCountRef.current++;

    // Animate symbols cycling
    let count = 0;
    spinIntervalRef.current = setInterval(() => {
      setDisplaySymbols([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      count++;
      if (count >= 15) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        const res = spinResult();
        setResult(res);
        setDisplaySymbols(res.symbols);
        setSpinning(false);
        store.addPoints(res.points, `슬롯머신: ${res.label}`);
        if (res.points >= 100) {
          store.triggerReward('jackpot', res.points);
        }
      }
    }, 100);
  };

  const handleClose = () => {
    setShow(false);
    scheduleNext();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[85] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 z-[86] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: '#1a1a2e', color: '#FFFFFF' }}
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
              >
                <X size={24} style={{ color: '#FFFFFF' }} />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F59E0B] px-6 py-5 text-center">
                <p className="text-2xl mb-1">🎰</p>
                <h3 className="text-lg font-bold text-white">럭키 슬롯머신!</h3>
                <p className="text-xs text-white/80 mt-1">스핀해서 보너스 포인트 획득</p>
              </div>

              {/* Slot display */}
              <div className="px-6 py-6">
                <div className="flex justify-center gap-3 mb-5">
                  {displaySymbols.map((s, i) => (
                    <motion.div
                      key={i}
                      className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-3xl"
                      style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)' }}
                      animate={spinning ? { y: [0, -8, 0] } : {}}
                      transition={spinning ? { duration: 0.15, repeat: Infinity, delay: i * 0.05 } : {}}
                    >
                      {s}
                    </motion.div>
                  ))}
                </div>

                {/* Result */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-4"
                    >
                      <p className="text-lg font-bold" style={{ color: result.points >= 100 ? '#FCD34D' : result.points >= 30 ? '#A78BFA' : '#34D399' }}>
                        {result.label}
                      </p>
                      <p className="text-2xl font-black" style={{ color: '#FFFFFF' }}>+{result.points}P</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                {!result ? (
                  <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] py-4 text-base font-bold text-white shadow-lg shadow-purple-300/40 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
                  >
                    {spinning ? '돌리는 중...' : '🎰 스핀!'}
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] py-4 text-base font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]"
                  >
                    좋아요! 계속 둘러볼게요
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
