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

// NO auto page transition! User must tap to navigate
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
  const [nextVenue, setNextVenue] = useState<Venue | null>(null);
  const triggeredRef = useRef(false);
  const lastPathRef = useRef(pathname);

  // Check if current page is a venue detail page
  const isVenuePage = VENUE_PATHS.some(p => pathname.startsWith(p) && pathname.split('/').length >= 3);

  // Reset on page change
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      triggeredRef.current = false;
      setShow(false);
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
      }
    }
  }, [pathname, isVenuePage]);

  useEffect(() => {
    if (!isVenuePage) return;
    window.addEventListener('scroll', handleReachBottom, { passive: true });
    return () => window.removeEventListener('scroll', handleReachBottom);
  }, [handleReachBottom, isVenuePage]);

  // NO countdown timer — user decides when to navigate

  const handleDismiss = () => {
    setShow(false);
  };

  const handleGo = () => {
    if (nextVenue) {
      navigate(getCategoryHref(nextVenue));
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && nextVenue && (
        <motion.div
          className="relative px-4 mt-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#333]">다음 추천</p>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-100 transition">
                <X size={20} style={{ color: '#555555' }} />
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
                <span className="inline-flex items-center justify-center rounded-full bg-[#8B5CF6] px-3 py-1.5 text-xs font-bold text-white" style={{ minHeight: 44 }}>
                  보러가기
                </span>
                <ChevronRight size={18} className="text-[#8B5CF6]" />
              </div>
            </button>

            {/* No auto-progress — user taps to navigate */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
