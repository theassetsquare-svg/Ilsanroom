import { useState, useEffect, useRef } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scroll Depth Rewards - Micro-dopamine hits
 *
 * Rewards at 25%, 50%, 75%, 100% scroll depth per page.
 * Creates small dopamine hits throughout the page visit.
 * Encourages reading full content.
 */

const MILESTONES = [
  { pct: 25, points: 3, emoji: '📖', label: '탐색 시작' },
  { pct: 50, points: 5, emoji: '🔥', label: '절반 돌파' },
  { pct: 75, points: 8, emoji: '⚡', label: '거의 다 왔어요' },
  { pct: 100, points: 12, emoji: '🏆', label: '완독!' },
];

export default function ScrollDepthReward() {
  const store = useEngagementStore();
  const { pathname } = useLocation();
  const [toast, setToast] = useState<{ emoji: string; label: string; points: number } | null>(null);
  const claimedRef = useRef<Set<string>>(new Set());
  const pageKeyRef = useRef(pathname);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset on page change
  useEffect(() => {
    if (pathname !== pageKeyRef.current) {
      pageKeyRef.current = pathname;
      claimedRef.current = new Set();
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 100) return; // Skip short pages

      const scrollPct = Math.round((scrollTop / docHeight) * 100);

      for (const m of MILESTONES) {
        const key = `${pathname}_${m.pct}`;
        if (scrollPct >= m.pct && !claimedRef.current.has(key)) {
          claimedRef.current.add(key);
          store.addPoints(m.points, `스크롤 ${m.pct}%`);
          setToast({ emoji: m.emoji, label: m.label, points: m.points });
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => setToast(null), 2000);
          break; // One at a time
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [pathname, store]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="fixed top-20 left-1/2 z-[75] -translate-x-1/2"
          initial={{ y: -30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="flex items-center gap-2 rounded-full bg-black/90 backdrop-blur-sm px-5 py-2.5 shadow-2xl border border-white/20">
            <span className="text-base">{toast.emoji}</span>
            <span className="text-sm font-bold text-white drop-shadow">{toast.label}</span>
            <span className="text-sm font-extrabold text-[#34D399] drop-shadow">+{toast.points}P</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
