import { useEffect, useState, useRef, useCallback } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

/* ── Constants ──────────────────────────────────────────────────── */

const COMBO_TIMEOUT = 30_000; // 30 seconds
const COUNTDOWN_WARN = 10_000; // show ring in last 10 seconds
const COMBO_BONUS_EVERY = 5;
const COMBO_STORAGE_KEY = 'combo_state';

/* ── Tier styling ───────────────────────────────────────────────── */

function getTier(combo: number) {
  if (combo >= 20) return { color: 'text-red-500', glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]', shake: true, label: 'INSANE' };
  if (combo >= 10) return { color: 'text-orange-400', glow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]', shake: false, label: 'ON FIRE' };
  if (combo >= 5)  return { color: 'text-yellow-300', glow: 'drop-shadow-[0_0_6px_rgba(253,224,71,0.5)]', shake: false, label: 'NICE' };
  return { color: 'text-white', glow: '', shake: false, label: '' };
}

/* ── Component ──────────────────────────────────────────────────── */

export default function ComboMeter() {
  const store = useEngagementStore();
  const [combo, setCombo] = useState(0);
  const [bonusText, setBonusText] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(COMBO_TIMEOUT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActionRef = useRef<number>(0);
  const prevViewCount = useRef(0);
  const prevLikeCount = useRef(0);
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load persisted combo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMBO_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const elapsed = Date.now() - (saved.lastAction || 0);
        if (elapsed < COMBO_TIMEOUT) {
          setCombo(saved.combo || 0);
          lastActionRef.current = saved.lastAction;
          setTimeLeft(COMBO_TIMEOUT - elapsed);
        }
      }
    } catch { /* noop */ }

    // Initialize refs
    prevViewCount.current = store.venuesViewed.length;
    prevLikeCount.current = store.likedVenues.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save combo state
  const saveCombo = useCallback((c: number) => {
    const now = Date.now();
    lastActionRef.current = now;
    try {
      localStorage.setItem(COMBO_STORAGE_KEY, JSON.stringify({ combo: c, lastAction: now }));
    } catch { /* noop */ }
  }, []);

  // Detect actions from store changes
  useEffect(() => {
    const currentViews = store.venuesViewed.length;
    const currentLikes = store.likedVenues.length;

    let actionCount = 0;
    if (currentViews > prevViewCount.current) actionCount += currentViews - prevViewCount.current;
    if (currentLikes > prevLikeCount.current) actionCount += currentLikes - prevLikeCount.current;

    prevViewCount.current = currentViews;
    prevLikeCount.current = currentLikes;

    if (actionCount > 0) {
      setCombo(prev => {
        const next = prev + actionCount;
        saveCombo(next);
        setTimeLeft(COMBO_TIMEOUT);

        // Check combo bonus
        const prevBonusTier = Math.floor(prev / COMBO_BONUS_EVERY);
        const nextBonusTier = Math.floor(next / COMBO_BONUS_EVERY);
        if (nextBonusTier > prevBonusTier) {
          const bonus = next * 2;
          setBonusText(`+${bonus}P 콤보 보너스!`);
          if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
          bonusTimerRef.current = setTimeout(() => setBonusText(null), 2000);
        }

        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.venuesViewed.length, store.likedVenues.length]);

  // Countdown timer
  useEffect(() => {
    if (combo < 2) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          // Reset combo
          setCombo(0);
          try { localStorage.removeItem(COMBO_STORAGE_KEY); } catch { /* noop */ }
          if (timerRef.current) clearInterval(timerRef.current);
          return COMBO_TIMEOUT;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [combo]);

  // Cleanup all ref timers on unmount
  useEffect(() => {
    return () => {
      if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const tier = getTier(combo);
  const showCountdownRing = combo >= 2 && timeLeft <= COUNTDOWN_WARN;
  const ringProgress = showCountdownRing ? timeLeft / COUNTDOWN_WARN : 1;
  const circumference = 2 * Math.PI * 18; // radius 18

  if (combo < 2 && !bonusText) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Combo counter */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            key="combo"
            initial={{ opacity: 0, scale: 0.3, x: 40 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              ...(tier.shake ? { rotate: [0, -2, 2, -2, 0] } : {}),
            }}
            exit={{ opacity: 0, scale: 0.3, x: 40 }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 300,
              ...(tier.shake ? { rotate: { repeat: Infinity, duration: 0.3 } } : {}),
            }}
            className="relative"
          >
            <motion.div
              key={combo}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 400 }}
              className={`flex items-center gap-1.5 rounded-2xl bg-black/80 backdrop-blur-sm px-3 py-2 ${tier.glow}`}
            >
              {/* Countdown ring */}
              {showCountdownRing && (
                <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]" viewBox="0 0 100 40">
                  <rect
                    x="2" y="2" rx="16" ry="16"
                    width="96" height="36"
                    fill="none"
                    stroke="rgba(239,68,68,0.4)"
                    strokeWidth="2"
                    strokeDasharray={`${(2 * 96 + 2 * 36) * ringProgress} ${2 * 96 + 2 * 36}`}
                    className="transition-all duration-100"
                  />
                </svg>
              )}

              <Zap className={`w-4 h-4 ${tier.color} fill-current`} />
              <span className={`text-lg font-black tabular-nums ${tier.color}`}>
                x{combo}
              </span>
            </motion.div>

            {/* Tier label */}
            {tier.label && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`block text-center text-xs font-black tracking-widest mt-0.5 ${tier.color} ${tier.glow}`}
              >
                {tier.label}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus popup */}
      <AnimatePresence>
        {bonusText && (
          <motion.div
            key="bonus"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15 }}
            className="rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30"
          >
            {bonusText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
