import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { venues } from '@/data/venues';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import type { Venue } from '@/types';

/**
 * Netflix Auto-play Next Content
 *
 * When user reaches bottom of a page, show a countdown to auto-navigate
 * to the next recommended venue/content. Creates "just one more" psychology.
 */

const COUNTDOWN_SECONDS = 12;
const VENUE_PATHS = ['/clubs/', '/nights/', '/lounges/', '/rooms/', '/yojeong/', '/hoppa/'];

const catLabel: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

function getCategoryHref(v: Venue): string {
  const map: Record<string, string> = {
    club: `/clubs/${v.region}/${v.slug}`,
    night: `/nights/${v.slug}`,
    lounge: `/lounges/${v.slug}`,
    room: `/rooms/${v.region}/${v.slug}`,
    yojeong: `/yojeong/${v.region}/${v.slug}`,
    hoppa: `/hoppa/${v.slug}`,
  };
  return map[v.category] || `/${v.category}/${v.slug}`;
}

function getNextVenue(pathname: string): Venue | null {
  const openVenues = venues.filter(v => v.status !== 'closed_or_unclear');
  if (openVenues.length === 0) return null;

  // Find current venue from URL
  const currentSlug = pathname.split('/').pop();
  const currentIdx = openVenues.findIndex(v => v.slug === currentSlug);

  if (currentIdx >= 0) {
    // Same category first
    const current = openVenues[currentIdx];
    const sameCategory = openVenues.filter(v => v.category === current.category && v.slug !== current.slug);
    if (sameCategory.length > 0) {
      return sameCategory[Math.floor(Math.random() * sameCategory.length)];
    }
  }

  // Random venue
  return openVenues[Math.floor(Math.random() * openVenues.length)];
}

export default function AutoNextSuggestion() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [nextVenue, setNextVenue] = useState<Venue | null>(null);
  const triggeredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastPathRef = useRef(pathname);

  // Check if current page is a venue detail page
  const isVenuePage = VENUE_PATHS.some(p => pathname.startsWith(p) && pathname.split('/').length >= 3);

  // Reset on page change
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      triggeredRef.current = false;
      setShow(false);
      setCountdown(COUNTDOWN_SECONDS);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [pathname]);

  const handleReachBottom = useCallback(() => {
    if (triggeredRef.current || !isVenuePage) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight < 300) return;

    if (scrollTop / docHeight > 0.85) {
      triggeredRef.current = true;
      const venue = getNextVenue(pathname);
      if (venue) {
        setNextVenue(venue);
        setShow(true);
        setCountdown(COUNTDOWN_SECONDS);
      }
    }
  }, [pathname, isVenuePage]);

  useEffect(() => {
    if (!isVenuePage) return;
    window.addEventListener('scroll', handleReachBottom, { passive: true });
    return () => window.removeEventListener('scroll', handleReachBottom);
  }, [handleReachBottom, isVenuePage]);

  // Countdown timer
  useEffect(() => {
    if (!show || !nextVenue) return;

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          navigate(getCategoryHref(nextVenue));
          setShow(false);
          return COUNTDOWN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [show, nextVenue, navigate]);

  const handleDismiss = () => {
    setShow(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleGo = () => {
    if (nextVenue) {
      navigate(getCategoryHref(nextVenue));
      setShow(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  return (
    <AnimatePresence>
      {show && nextVenue && (
        <motion.div
          className="fixed bottom-16 left-0 right-0 z-[74] px-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#333]">다음 추천</p>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-100 transition">
                <X size={14} className="text-gray-400" />
              </button>
            </div>

            <button onClick={handleGo} className="w-full flex items-center gap-3 text-left group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F0FF] text-lg font-bold text-[#8B5CF6]">
                {nextVenue.nameKo.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111] group-hover:text-[#8B5CF6] transition truncate">
                  {nextVenue.nameKo}
                </p>
                <p className="text-xs text-[#555]">{catLabel[nextVenue.category]} · {nextVenue.regionKo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Countdown ring */}
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke="#8B5CF6" strokeWidth="3"
                      strokeDasharray={`${(countdown / COUNTDOWN_SECONDS) * 94.2} 94.2`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#8B5CF6]">
                    {countdown}
                  </span>
                </div>
                <ChevronRight size={18} className="text-[#8B5CF6]" />
              </div>
            </button>

            {/* Progress bar */}
            <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: COUNTDOWN_SECONDS, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
