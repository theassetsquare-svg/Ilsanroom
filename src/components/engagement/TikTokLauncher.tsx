import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const TikTokFeed = lazy(() => import('./TikTokFeed'));

export default function TikTokLauncher() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Pulse attention grab every 30s
  const handleClick = () => {
    setOpen(true);
    setPulse(false);
  };

  return (
    <>
      {/* Floating launcher button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={handleClick}
            className="fixed right-4 bottom-[144px] z-[60] flex h-14 w-14 md:hidden items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-500/30 md:bottom-14"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: pulse ? [1, 1.15, 1] : 1,
              opacity: 1,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={pulse ? { scale: { repeat: Infinity, duration: 2, repeatDelay: 8 } } : { duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="피드 열기"
          >
            <Sparkles size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Label tooltip - shows briefly on first load */}
      <AnimatePresence>
        {!open && (
          <motion.div
            className="fixed right-20 bottom-[152px] z-[60] rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg md:bottom-[62px]"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: [0, 1, 1, 0], x: 0 }}
            transition={{ duration: 4, times: [0, 0.1, 0.8, 1], delay: 3 }}
          >
            숏폼 피드
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TikTok Feed modal */}
      {open && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        }>
          <TikTokFeed isOpen={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
