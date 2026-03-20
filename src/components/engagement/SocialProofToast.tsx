import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { venues } from '@/data/venues';
import { Eye, Heart, Star, MessageCircle, Users } from 'lucide-react';

/**
 * Continuous social proof notifications.
 * - Random toast every 8-15 seconds
 * - Types: view, like, viewers, review, trending
 * - Uses random Korean surnames and real venue data
 * - Subtle, semi-transparent, bottom-left position
 */

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];

interface ToastData {
  id: number;
  icon: React.ReactNode;
  message: string;
  accent: string;
}

function getRandomVenue() {
  const open = venues.filter(v => v.status !== 'closed_or_unclear');
  return open[Math.floor(Math.random() * open.length)];
}

function getRandomSurname() {
  return SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
}

function generateToast(id: number): ToastData {
  const type = Math.floor(Math.random() * 5);
  const venue = getRandomVenue();

  switch (type) {
    case 0: {
      const surname = getRandomSurname();
      return {
        id,
        icon: <Eye size={16} className="text-blue-400" />,
        message: `서울 ${surname}** 님이 ${venue.nameKo}을 방금 봤어요`,
        accent: 'border-blue-400/30',
      };
    }
    case 1:
      return {
        id,
        icon: <Heart size={16} className="text-pink-400" />,
        message: `${venue.nameKo}에 좋아요 +1`,
        accent: 'border-pink-400/30',
      };
    case 2: {
      const num = Math.floor(Math.random() * 151) + 30;
      return {
        id,
        icon: <Users size={16} className="text-purple-400" />,
        message: `지금 ${num}명이 보고 있어요`,
        accent: 'border-purple-400/30',
      };
    }
    case 3:
      return {
        id,
        icon: <MessageCircle size={16} className="text-green-400" />,
        message: `${venue.nameKo}에 새 후기가 등록됐어요`,
        accent: 'border-green-400/30',
      };
    case 4:
    default:
      return {
        id,
        icon: <Star size={16} className="text-amber-400" />,
        message: `${venue.regionKo}에서 인기 급상승`,
        accent: 'border-amber-400/30',
      };
  }
}

export default function SocialProofToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const idRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  const showNextToast = useCallback(() => {
    // Don't show if page loaded less than 10 seconds ago
    if (Date.now() - mountTimeRef.current < 10000) return;

    idRef.current += 1;
    const newToast = generateToast(idRef.current);
    setToast(newToast);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToast(prev => (prev?.id === newToast.id ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 7000) + 8000; // 8-15 seconds
      timeout = setTimeout(() => {
        showNextToast();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => clearTimeout(timeout);
  }, [showNextToast]);

  return (
    <div className="fixed bottom-20 left-4 z-[70] pointer-events-none">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border ${toast.accent} bg-white/90 backdrop-blur-md px-4 py-3 shadow-lg max-w-[320px]`}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <span className="shrink-0">{toast.icon}</span>
            <p className="text-xs font-medium text-[#333] leading-relaxed">
              {toast.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
