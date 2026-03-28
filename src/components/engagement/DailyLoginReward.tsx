import { useState, useEffect } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Flame, Star } from 'lucide-react';

/**
 * Daily Login Reward - Netflix "Welcome Back" Psychology
 *
 * On first visit of the day, show a celebratory popup with:
 * - Streak count (loss aversion - don't break it!)
 * - Daily reward claim button
 * - Teaser of today's content
 */

const STREAK_REWARDS = [
  { days: 1, points: 50, emoji: '🎁' },
  { days: 3, points: 80, emoji: '🔥' },
  { days: 7, points: 150, emoji: '💎' },
  { days: 14, points: 250, emoji: '👑' },
  { days: 30, points: 500, emoji: '🏆' },
];

const DAILY_TEASERS = [
  '오늘 새로 등록된 업소가 있어요',
  '인기 급상승 업소가 있어, 한번 봐봐',
  '오늘의 추천 업소가 바뀌었어요',
  '새로운 VS 대결이 열렸어요',
  '오늘의 미션 보상이 기다리고 있어요',
  '숨겨진 업소가 해금되었을 수도...',
];

const STORAGE_KEY = 'daily_login_shown';

export default function DailyLoginReward() {
  const store = useEngagementStore();
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [teaser] = useState(() => DAILY_TEASERS[Math.floor(Math.random() * DAILY_TEASERS.length)]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    // Show after 1.5s delay for dramatic effect
    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(STORAGE_KEY, today);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const streakReward = STREAK_REWARDS.reduce(
    (best, r) => (store.streak >= r.days ? r : best),
    STREAK_REWARDS[0]
  );

  const handleClaim = () => {
    if (!claimed) {
      store.claimDailyReward();
      setClaimed(true);
      setTimeout(() => setShow(false), 2000);
    }
  };

  const handleClose = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[88] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 z-[89] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
              initial={{ scale: 0.6, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>

              {/* Confetti header */}
              <div className="relative bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] px-6 py-8 text-center overflow-hidden">
                {/* Floating particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: ['#FBBF24', '#EC4899', '#06B6D4', '#10B981'][i % 4],
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      y: [-5, 5, -5],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 2 + i * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl mb-3"
                >
                  {streakReward.emoji}
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold text-white"
                >
                  돌아오셨군요!
                </motion.h2>

                {store.streak > 0 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5"
                  >
                    <Flame size={14} className="text-orange-300" />
                    <span className="text-sm font-bold text-white">{store.streak}일 연속 방문</span>
                  </motion.div>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Daily reward */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-4"
                >
                  {!claimed ? (
                    <button
                      onClick={handleClaim}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] py-4 text-white shadow-lg shadow-orange-300/30 transition hover:shadow-xl active:scale-[0.98]"
                    >
                      <Gift size={20} />
                      <span className="text-base font-bold">오늘의 보상 받기 +{streakReward.points}P</span>
                    </button>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#D1FAE5] py-4"
                    >
                      <Star size={18} className="text-[#059669]" />
                      <span className="text-base font-bold text-[#059669]">+{streakReward.points}P 획득!</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Teaser */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-xl bg-[#F3F0FF] px-4 py-3 text-center"
                >
                  <p className="text-xs text-[#8B5CF6] font-medium">{teaser}</p>
                </motion.div>

                {/* Streak calendar preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-4 flex justify-center gap-1.5"
                >
                  {Array.from({ length: 7 }).map((_, i) => {
                    const filled = i < Math.min(store.streak, 7);
                    const isToday = i === Math.min(store.streak, 7) - 1;
                    return (
                      <div
                        key={i}
                        className={`h-2 w-8 rounded-full transition-all ${
                          filled
                            ? isToday
                              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]'
                              : 'bg-[#8B5CF6]'
                            : 'bg-gray-200'
                        }`}
                      />
                    );
                  })}
                </motion.div>
                <p className="mt-1.5 text-center text-xs text-[#333]">
                  7일 연속 방문하면 특별 보너스!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
