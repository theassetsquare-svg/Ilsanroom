import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { venues } from '@/data/venues';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lock, Eye } from 'lucide-react';

/**
 * Curiosity Gap Teaser
 *
 * Periodically shows partially-revealed teasers that create curiosity.
 * "이 업소의 숨겨진 비밀..." with blurred text.
 * Drives exploration by making users want to "uncover" content.
 */

const TEASERS = [
  {
    hook: '강남에서 가장 핫한 업소는?',
    preview: '지금 실시간 인기 1위...',
    href: '/ranking',
    cta: '랭킹 확인하기',
  },
  {
    hook: '오늘 밤 운명의 장소를 찾아보세요',
    preview: '당신의 MBTI에 딱 맞는 곳이...',
    href: '/quiz',
    cta: 'MBTI 테스트',
  },
  {
    hook: '이 업소 vs 저 업소, 승자는?',
    preview: '지금까지 투표 결과가...',
    href: '/vs',
    cta: 'VS 대결 참여',
  },
  {
    hook: '오늘의 럭키 업소를 돌려보세요',
    preview: '운명의 룰렛이 당신을 기다...',
    href: '/roulette',
    cta: '룰렛 돌리기',
  },
  {
    hook: '숨겨진 맛집급 업소 발견',
    preview: '아는 사람만 아는 곳...',
    href: '/hidden',
    cta: '숨겨진 업소 보기',
  },
];

function getRandomTeaser(exclude: number): { teaser: typeof TEASERS[0]; venue: typeof venues[0]; index: number } {
  let idx = Math.floor(Math.random() * TEASERS.length);
  if (idx === exclude) idx = (idx + 1) % TEASERS.length;
  const openVenues = venues.filter(v => v.status !== 'closed_or_unclear');
  const venue = openVenues[Math.floor(Math.random() * openVenues.length)];
  return { teaser: TEASERS[idx], venue, index: idx };
}

export default function CuriosityGapTeaser() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ReturnType<typeof getRandomTeaser> | null>(null);
  const lastIndexRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dismissRef = useRef<ReturnType<typeof setTimeout>>();
  const showCountRef = useRef(0);

  const scheduleNext = () => {
    if (showCountRef.current >= 8) return; // Max per session
    const delay = (Math.floor(Math.random() * 3) + 3) * 60 * 1000; // 3-6 minutes
    timerRef.current = setTimeout(() => {
      const d = getRandomTeaser(lastIndexRef.current);
      lastIndexRef.current = d.index;
      setData(d);
      setVisible(true);
      showCountRef.current++;

      // Auto-dismiss after 15 seconds
      if (dismissRef.current) clearTimeout(dismissRef.current);
      dismissRef.current = setTimeout(() => setVisible(false), 15000);
    }, delay);
  };

  useEffect(() => {
    // First teaser after 90s
    timerRef.current = setTimeout(() => {
      const d = getRandomTeaser(-1);
      lastIndexRef.current = d.index;
      setData(d);
      setVisible(true);
      showCountRef.current++;

      if (dismissRef.current) clearTimeout(dismissRef.current);
      dismissRef.current = setTimeout(() => setVisible(false), 15000);
      scheduleNext();
    }, 90000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, []);

  // Hide on navigation
  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  const handleClose = () => {
    setVisible(false);
    scheduleNext();
  };

  if (!data) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-[210px] right-4 z-[73] w-72 md:hidden"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <Link
            target="_blank" rel="noopener noreferrer" to={data.teaser.href}
            onClick={handleClose}
            className="block rounded-2xl border shadow-xl overflow-hidden"
            style={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(139,92,246,0.3)', color: '#FFFFFF', minHeight: '44px' }}
          >
            <div className="relative px-4 pt-4 pb-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition z-10"
                style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={24} style={{ color: '#FFFFFF' }} />
              </button>

              {/* Hook */}
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} style={{ color: '#A78BFA' }} />
                <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>발견</p>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: '#FFFFFF' }}>{data.teaser.hook}</p>

              {/* Blurred preview (curiosity gap) */}
              <div className="relative mb-3">
                <p className="text-xs blur-[3px] select-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {data.teaser.preview} {data.venue.nameKo}는 평점 {data.venue.rating}점으로...
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                    <Lock size={10} />
                    탭해서 확인
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="flex items-center justify-between px-4 py-3 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA', minHeight: '44px' }}
            >
              <span>{data.teaser.cta}</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
