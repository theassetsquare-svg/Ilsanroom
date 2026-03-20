import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen reward celebration overlay.
 * Types: points, levelup, streak, mission, jackpot
 * Triggered via custom event 'reward-animation'
 */

export type RewardType = 'points' | 'levelup' | 'streak' | 'mission' | 'jackpot';

export interface RewardEvent {
  type: RewardType;
  value: number;
}

/** Dispatch this from anywhere to trigger the animation */
export function triggerReward(type: RewardType, value: number) {
  window.dispatchEvent(
    new CustomEvent('reward-animation', { detail: { type, value } })
  );
}

function getRewardContent(type: RewardType, value: number) {
  switch (type) {
    case 'points':
      return {
        text: `+${value}P!`,
        subtext: '포인트 획득',
        gradient: 'from-[#8B5CF6] to-[#06B6D4]',
        duration: 2000,
      };
    case 'levelup':
      return {
        text: `레벨 업! Lv.${value}`,
        subtext: '축하합니다!',
        gradient: 'from-[#F59E0B] to-[#EF4444]',
        duration: 2000,
      };
    case 'streak':
      return {
        text: `${value}일 연속!`,
        subtext: '출석 스트릭',
        gradient: 'from-[#EF4444] to-[#F59E0B]',
        duration: 2000,
      };
    case 'mission':
      return {
        text: `미션 완료! +${value}P`,
        subtext: '보상을 받았어요',
        gradient: 'from-[#10B981] to-[#06B6D4]',
        duration: 2000,
      };
    case 'jackpot':
      return {
        text: `JACKPOT! +${value}P`,
        subtext: '대박!',
        gradient: 'from-[#F59E0B] via-[#EF4444] to-[#EC4899]',
        duration: 3000,
      };
  }
}

export default function RewardAnimation() {
  const [reward, setReward] = useState<RewardEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const handleReward = useCallback((e: Event) => {
    const detail = (e as CustomEvent<RewardEvent>).detail;
    setReward(detail);
    setVisible(true);

    const content = getRewardContent(detail.type, detail.value);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setReward(null), 300);
    }, content.duration);
  }, []);

  useEffect(() => {
    window.addEventListener('reward-animation', handleReward);
    return () => window.removeEventListener('reward-animation', handleReward);
  }, [handleReward]);

  if (!reward) return null;

  const content = getRewardContent(reward.type, reward.value);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Reward content */}
          <motion.div
            className="fixed inset-0 z-[101] flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Sparkle particles */}
            {reward.type === 'jackpot' && (
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-yellow-400"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0],
                      y: [0, -100 + Math.random() * 200],
                      x: [0, -80 + Math.random() * 160],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.5,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Main text */}
            <motion.div
              className="text-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.2, 1], rotate: [- 10, 5, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 200,
              }}
            >
              {/* Emoji ring */}
              {reward.type === 'levelup' && (
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, ease: 'linear' }}
                >
                  🎉
                </motion.div>
              )}
              {reward.type === 'streak' && (
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  🔥
                </motion.div>
              )}
              {reward.type === 'mission' && (
                <motion.div
                  className="text-5xl mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.2 }}
                >
                  ✅
                </motion.div>
              )}
              {reward.type === 'jackpot' && (
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: 2 }}
                >
                  🎰
                </motion.div>
              )}
              {reward.type === 'points' && (
                <motion.div
                  className="text-4xl mb-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.4, repeat: 2 }}
                >
                  ✨
                </motion.div>
              )}

              {/* Text */}
              <motion.h2
                className={`text-3xl font-black bg-gradient-to-r ${content.gradient} bg-clip-text text-transparent drop-shadow-lg`}
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {content.text}
              </motion.h2>

              <motion.p
                className="text-base font-medium text-white/90 mt-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {content.subtext}
              </motion.p>
            </motion.div>

            {/* Radial burst for jackpot */}
            {reward.type === 'jackpot' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5 }}
              >
                <div className="w-[400px] h-[400px] rounded-full bg-gradient-radial from-yellow-400/30 to-transparent" />
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
