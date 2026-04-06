import { useState, useEffect, useRef } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Flame, Trophy } from 'lucide-react';

export default function ExitGuard() {
  // 비활성화 — "사이트 나가시겠습니까?" 팝업 제거
  return null;
  const store = useEngagementStore();
  const [showModal, setShowModal] = useState(false);
  const triggeredRef = useRef(false);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Date.now() - sessionStartRef.current < 30000) return;
      e.preventDefault();
      e.returnValue = '';
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (triggeredRef.current) return;
      if (Date.now() - sessionStartRef.current < 30000) return;
      if (e.clientY < 5) {
        triggeredRef.current = true;
        setShowModal(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  if (!showModal) return null;

  const missions = store.getDailyMissions();
  const incompleteMissions = missions.filter(m => !m.completed);

  return (
    <AnimatePresence>
      {showModal && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          />
          <motion.div
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: '#1a1a2e', color: '#FFFFFF' }}
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
              >
                <X size={24} style={{ color: '#FFFFFF' }} />
              </button>
              <div className="h-2 bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#06B6D4]" />
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: '#FFFFFF' }}>잠깐! 지금 떠나면...</h2>
                <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>이렇게 아까운 것들을 놓쳐요</p>
                <div className="space-y-3 mb-5">
                  {store.streak > 0 && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(249,115,22,0.15)' }}>
                      <Flame size={20} className="text-orange-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{store.streak}일 연속 방문 기록</p>
                        {store.streak > 3 && (
                          <p className="text-xs mt-0.5" style={{ color: '#FB923C' }}>내일도 오면 보너스 2배!</p>
                        )}
                      </div>
                    </div>
                  )}
                  {incompleteMissions.length > 0 && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                      <Trophy size={20} className="text-purple-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>미완료 미션 {incompleteMissions.length}개</p>
                        <p className="text-xs mt-0.5" style={{ color: '#A78BFA' }}>{incompleteMissions[0]?.label}</p>
                      </div>
                    </div>
                  )}
                  {store.points > 0 && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(6,182,212,0.15)' }}>
                      <Gift size={20} className="text-cyan-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{store.points}P 보유 중</p>
                        <p className="text-xs mt-0.5" style={{ color: '#22D3EE' }}>3분만 더 머물면 보너스 포인트!</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] p-4 mb-5 text-center">
                  <p className="text-white text-sm font-bold">🎁 3분만 더 머물면 보너스 포인트!</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl active:scale-[0.98]"
                  >
                    계속 둘러보기
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full rounded-xl border px-6 py-3 text-sm font-medium transition active:scale-[0.98]"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    나중에 올게요
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
