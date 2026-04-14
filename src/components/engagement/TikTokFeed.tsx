import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import { useEngagementStore } from '@/lib/engagement-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  X,
  Star,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Venue } from '@/types';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TikTokFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const TIPS = [
  '첫 방문이라면 금요일보다 목요일이 좋습니다',
  '입장 전 드레스코드 꼭 챙겨!',
  '테이블 예약은 최소 3시간 전에',
  '새벽 1시 이후가 분위기 절정',
  '혼자 가도 괜찮은 곳이 많습니다',
  '실장님 연락처는 꼭 저장해두세요',
  '생일 파티는 최소 일주일 전 예약',
  '주차 되는지 미리 알아둬',
  '대중교통 막차 시간 꼭 체크!',
  '첫 방문 할인 있는지 물어보세요',
];

const POLLS = [
  { question: '금요일 밤, 어디?', a: '강남 클럽', b: '홍대 라운지' },
  { question: '분위기 vs 가성비?', a: '분위기 최고', b: '가성비 갑' },
  { question: '혼자 vs 친구?', a: '혼자 조용히', b: '친구랑 왁자지껄' },
  { question: 'EDM vs 힙합?', a: 'EDM 풀파워', b: '힙합 바이브' },
  { question: '맥주 vs 칵테일?', a: '시원한 맥주', b: '화려한 칵테일' },
];

const DID_YOU_KNOW = [
  '금요일 밤 10시가 전국 업소 방문자 피크 타임!',
  '서울 강남에만 클럽이 20곳 넘게 있다.',
  '나이트클럽과 클럽의 차이? 나이트는 소셜 댄스, 클럽은 EDM/힙합 중심.',
  '부산 해운대고구려는 룸이 60개가 넘는다.',
  '일산명월관요정의 한정식 코스는 15가지.',
  '호빠(호스트바)는 강남, 수원 인계동에 가장 많다.',
  '토요일 새벽 1시에 택시 잡기 가장 힘들다. 미리 대리 예약!',
];

const CAT_LABEL: Record<string, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

const CAT_GRADIENT: Record<string, string> = {
  club: 'from-violet-900 via-purple-900 to-indigo-950',
  night: 'from-blue-900 via-slate-900 to-cyan-950',
  lounge: 'from-amber-900 via-yellow-950 to-orange-950',
  room: 'from-rose-900 via-red-950 to-pink-950',
  yojeong: 'from-emerald-900 via-teal-950 to-green-950',
  hoppa: 'from-fuchsia-900 via-pink-950 to-rose-950',
};

/* ------------------------------------------------------------------ */
/*  Feed item types                                                    */
/* ------------------------------------------------------------------ */

type FeedItem =
  | { type: 'venue'; venue: Venue }
  | { type: 'tip'; text: string }
  | { type: 'poll'; question: string; a: string; b: string }
  | { type: 'fact'; text: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function buildFeed(openVenues: Venue[]): FeedItem[] {
  const items: FeedItem[] = [];
  let tipIdx = 0;
  let pollIdx = 0;
  let factIdx = 0;

  for (let i = 0; i < openVenues.length; i++) {
    items.push({ type: 'venue', venue: openVenues[i] });

    // Every 3rd venue → tip
    if ((i + 1) % 3 === 0) {
      items.push({ type: 'tip', text: TIPS[tipIdx % TIPS.length] });
      tipIdx++;
    }
    // Every 5th venue → poll
    if ((i + 1) % 5 === 0) {
      items.push({ type: 'poll', ...POLLS[pollIdx % POLLS.length] });
      pollIdx++;
    }
    // Every 7th venue → fact
    if ((i + 1) % 7 === 0) {
      items.push({ type: 'fact', text: DID_YOU_KNOW[factIdx % DID_YOU_KNOW.length] });
      factIdx++;
    }
  }
  return items;
}

/* ------------------------------------------------------------------ */
/*  Auto-advance countdown ring                                        */
/* ------------------------------------------------------------------ */

function CountdownRing({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  const pct = (left / seconds) * 100;
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white text-xs">
      <svg width="32" height="32" className="-rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="white" strokeOpacity={0.15} strokeWidth={2} />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-[var(--neon-primary,#7c3aed)] transition-all duration-1000 ease-linear"
        />
      </svg>
      <span>다음 자동 전환 {left}초</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function TikTokFeed({ isOpen, onClose }: TikTokFeedProps) {
  const store = useEngagementStore();
  const openVenues = useMemo(() => venues.filter((v) => v.status !== 'closed_or_unclear'), []);
  const feed = useMemo(() => buildFeed(openVenues), [openVenues]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [pollVotes, setPollVotes] = useState<Record<number, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [sessionViewed, setSessionViewed] = useState(0);
  const [autoKey, setAutoKey] = useState(0); // reset countdown
  const lastInteraction = useRef(Date.now());
  const touchStartY = useRef<number | null>(null);

  // Track view when current changes
  useEffect(() => {
    const item = feed[current];
    if (item?.type === 'venue') {
      store.trackView(item.venue.id);
      setSessionViewed((n) => n + 1);
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrent(0);
      setDirection(1);
      setShowSummary(false);
      setSessionViewed(0);
      setAutoKey((k) => k + 1);
      lastInteraction.current = Date.now();
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (current < feed.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
      setAutoKey((k) => k + 1);
      lastInteraction.current = Date.now();
    }
  }, [current, feed.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
      setAutoKey((k) => k + 1);
      lastInteraction.current = Date.now();
    }
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') goNext();
      else if (e.key === 'ArrowUp' || e.key === 'k') goPrev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartY.current = null;
  };

  // Mouse wheel
  const wheelTimeout = useRef<ReturnType<typeof setTimeout>>();
  const onWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return; // throttle
    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = undefined;
    }, 600);
    if (e.deltaY > 30) goNext();
    else if (e.deltaY < -30) goPrev();
  };

  // NO auto-advance — CLAUDE.md: NEVER auto page transition

  const handleClose = () => {
    setShowSummary(true);
  };

  const dismissSummary = () => {
    setShowSummary(false);
    onClose();
  };

  if (!isOpen) return null;

  // Session summary overlay
  if (showSummary) {
    const pts = sessionViewed * 5;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={dismissSummary}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-center max-w-xs mx-4 border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-[var(--neon-primary,#7c3aed)]" />
          <h3 className="text-xl font-bold text-white mb-2">탐색 완료!</h3>
          <p className="text-white/70 text-lg mb-1">
            <span className="text-[var(--neon-primary,#7c3aed)] font-bold text-2xl">{sessionViewed}개</span> 업소를 둘러봤어요!
          </p>
          <p className="text-[var(--neon-accent,#f59e0b)] font-semibold text-lg mb-6">
            +{pts}P 획득
          </p>
          <button
            onClick={dismissSummary}
            className="w-full py-3 rounded-xl bg-[var(--neon-primary,#7c3aed)] hover:bg-[var(--neon-primary,#7c3aed)]/80 text-white font-semibold transition-colors"
          >
            확인
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const item = feed[current];

  const slideVariants = {
    enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black overflow-hidden select-none"
      onWheel={onWheel}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white text-sm font-medium">
          {current + 1} / {feed.length}
        </span>
        <button
          onClick={handleClose}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm active:bg-white/30 transition-colors"
          style={{ minWidth: 48, minHeight: 48 }}
        >
          <X className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Navigation hints */}
      {current > 0 && (
        <button
          onClick={goPrev}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 text-white/70 hover:text-white transition-colors"
        >
          <ChevronUp className="w-6 h-6 animate-bounce" />
        </button>
      )}
      {current < feed.length - 1 && (
        <button
          onClick={goNext}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-white/70 hover:text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      )}

      {/* Auto-advance countdown */}
      {/* Manual next button — no auto-advance */}
      <button onClick={goNext} className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-white text-xs font-medium active:bg-white/30" style={{ minHeight: 44 }}>
        다음 보기 →
      </button>

      {/* Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {item.type === 'venue' && (
            <VenueSlide
              venue={item.venue}
              liked={!!likes[item.venue.id]}
              bookmarked={!!bookmarks[item.venue.id]}
              onLike={() => {
                setLikes((l) => ({ ...l, [item.venue.id]: !l[item.venue.id] }));
                store.like(item.venue.id);
                lastInteraction.current = Date.now();
              }}
              onBookmark={() => {
                setBookmarks((b) => ({ ...b, [item.venue.id]: !b[item.venue.id] }));
                store.bookmark(item.venue.id);
                lastInteraction.current = Date.now();
              }}
              onShare={() => {
                lastInteraction.current = Date.now();
                if (navigator.share) {
                  navigator.share({ title: item.venue.nameKo, url: getCategoryHref(item.venue) });
                }
              }}
            />
          )}

          {item.type === 'tip' && <TipSlide text={item.text} />}
          {item.type === 'poll' && (
            <PollSlide
              idx={current}
              question={item.question}
              a={item.a}
              b={item.b}
              voted={pollVotes[current]}
              onVote={(choice) => {
                setPollVotes((v) => ({ ...v, [current]: choice }));
                lastInteraction.current = Date.now();
              }}
            />
          )}
          {item.type === 'fact' && <FactSlide text={item.text} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Venue slide                                                        */
/* ------------------------------------------------------------------ */

function VenueSlide({
  venue,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  onShare,
}: {
  venue: Venue;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ text: string; time: string }[]>([]);
  const gradient = CAT_GRADIENT[venue.category] || 'from-gray-900 to-gray-950';
  const fakeLikes = venue.reviewCount || 0;
  const fakeReviews = venue.reviewCount || 0;

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    setComments((prev) => [...prev, { text: comment.trim(), time: '방금' }]);
    setComment('');
  };

  return (
    <div className={`w-full h-full bg-gradient-to-b ${gradient} flex flex-col justify-end relative`}>
      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[var(--neon-primary,#7c3aed)]/10 blur-[100px]" />

      {/* Right-side action buttons (TikTok style) */}
      <div className="absolute right-4 bottom-48 flex flex-col items-center gap-5 z-30">
        <button onClick={onLike} className="flex flex-col items-center gap-1" style={{ minWidth: 48, minHeight: 48 }}>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              liked
                ? 'bg-red-500 scale-110'
                : 'bg-white/15 backdrop-blur-sm active:bg-white/30'
            }`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-xs" style={{ color: '#FFFFFF' }}>{liked ? fakeLikes + 1 : fakeLikes}</span>
        </button>

        <button onClick={() => setShowComment(true)} className="flex flex-col items-center gap-1" style={{ minWidth: 48, minHeight: 48 }}>
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/30 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs" style={{ color: '#FFFFFF' }}>{fakeReviews + comments.length}</span>
        </button>

        <button onClick={onShare} className="flex flex-col items-center gap-1" style={{ minWidth: 48, minHeight: 48 }}>
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/30 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs" style={{ color: '#FFFFFF' }}>공유</span>
        </button>

        <button onClick={onBookmark} className="flex flex-col items-center gap-1" style={{ minWidth: 48, minHeight: 48 }}>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              bookmarked
                ? 'bg-[var(--neon-accent,#f59e0b)] scale-110'
                : 'bg-white/15 backdrop-blur-sm active:bg-white/30'
            }`}
          >
            <Star className={`w-6 h-6 ${bookmarked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-xs" style={{ color: '#FFFFFF' }}>저장</span>
        </button>
      </div>

      {/* Venue info — bottom area */}
      <div className="relative z-10 px-5 pb-20 pr-20">
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium border border-white/10">
            {CAT_LABEL[venue.category] || venue.category}
          </span>
          <span className="flex items-center gap-1 text-white text-xs">
            <MapPin className="w-3 h-3" />
            {venue.regionKo}
          </span>
        </div>

        {/* Venue name */}
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg leading-tight">
          {venue.nameKo}
        </h2>

        {/* Rating */}
        {venue.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(venue.rating)
                    ? 'text-[var(--neon-accent,#f59e0b)] fill-[var(--neon-accent,#f59e0b)]'
                    : 'text-white/80'
                }`}
              />
            ))}
            <span className="text-white text-sm ml-1">{venue.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Short description */}
        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
          {venue.shortDescription}
        </p>

        {/* Feature tags */}
        {venue.features && venue.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {venue.features.slice(0, 4).map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Detail link */}
        <Link target="_blank" rel="noopener noreferrer"
          to={getCategoryHref(venue)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--neon-primary,#7c3aed)] active:bg-[var(--neon-primary,#7c3aed)]/80 text-white text-sm font-semibold transition-colors z-30 relative"
          style={{ minHeight: 48 }}
          onClick={(e) => e.stopPropagation()}
        >
          자세히 보기
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* 댓글 패널 */}
      {showComment && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setShowComment(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <div
            className="relative rounded-t-3xl p-5 max-h-[60vh] flex flex-col"
            style={{ backgroundColor: '#1a1a2e', color: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: '#FFFFFF' }}>댓글 {fakeReviews + comments.length}개</h3>
              <button
                onClick={() => setShowComment(false)}
                style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: '30vh' }}>
              {/* 기존 댓글(더미) */}
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: '#A78BFA' }}>김** </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>2시간 전</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>여기 분위기 진짜 좋아요 추천!</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: '#A78BFA' }}>이** </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>5시간 전</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>주말에 가봤는데 대기가 좀 있어요</p>
              </div>
              {/* 사용자 작성 댓글 */}
              {comments.map((c, i) => (
                <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: '#A78BFA' }}>나</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.time}</span>
                  </div>
                  <p className="text-sm" style={{ color: '#FFFFFF' }}>{c.text}</p>
                </div>
              ))}
            </div>

            {/* 댓글 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                placeholder="댓글을 입력하세요..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', minHeight: 48 }}
              />
              <button
                onClick={handleCommentSubmit}
                className="rounded-xl px-4 py-3 text-sm font-bold"
                style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 48 }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tip slide                                                          */
/* ------------------------------------------------------------------ */

function TipSlide({ text }: { text: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-amber-950 via-orange-950 to-yellow-950 flex flex-col items-center justify-center px-8">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-amber-500/10 blur-[80px]" />
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <span className="text-sm font-bold tracking-wider uppercase mb-3 inline-block rounded-full px-4 py-1" style={{ backgroundColor: '#FFFFFF', color: '#92400E' }}>
          꿀팁
        </span>
        <p className="text-white text-xl font-bold leading-relaxed max-w-sm">{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Poll slide                                                         */
/* ------------------------------------------------------------------ */

function PollSlide({
  idx,
  question,
  a,
  b,
  voted,
  onVote,
}: {
  idx: number;
  question: string;
  a: string;
  b: string;
  voted?: string;
  onVote: (choice: string) => void;
}) {
  const fakeA = 50;
  const fakeB = 50;

  return (
    <div className="w-full h-full bg-gradient-to-b from-cyan-950 via-blue-950 to-indigo-950 flex flex-col items-center justify-center px-8">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px]" />
      <div className="relative z-10 text-center w-full max-w-sm">
        <Clock className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
        <span className="text-sm font-bold tracking-wider uppercase mb-2 inline-block rounded-full px-4 py-1" style={{ backgroundColor: '#FFFFFF', color: '#155E75' }}>
          투표
        </span>
        <h3 className="text-white text-xl font-bold mb-8">{question}</h3>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onVote('a')}
            className={`relative w-full py-4 px-5 rounded-xl border text-left transition-all overflow-hidden ${
              voted === 'a'
                ? 'border-cyan-400 bg-cyan-500/20'
                : voted
                ? 'border-white/10 bg-white/5'
                : 'border-white/20 bg-white/10 hover:bg-white/15 active:scale-[0.98]'
            }`}
          >
            {voted && (
              <div
                className="absolute inset-y-0 left-0 bg-cyan-500/10 transition-all duration-700"
                style={{ width: `${fakeA}%` }}
              />
            )}
            <span className="relative z-10 text-white font-medium">{a}</span>
            {voted && (
              <span className="relative z-10 float-right text-white text-sm">{fakeA}%</span>
            )}
          </button>
          <button
            onClick={() => onVote('b')}
            className={`relative w-full py-4 px-5 rounded-xl border text-left transition-all overflow-hidden ${
              voted === 'b'
                ? 'border-cyan-400 bg-cyan-500/20'
                : voted
                ? 'border-white/10 bg-white/5'
                : 'border-white/20 bg-white/10 hover:bg-white/15 active:scale-[0.98]'
            }`}
          >
            {voted && (
              <div
                className="absolute inset-y-0 left-0 bg-cyan-500/10 transition-all duration-700"
                style={{ width: `${fakeB}%` }}
              />
            )}
            <span className="relative z-10 text-white font-medium">{b}</span>
            {voted && (
              <span className="relative z-10 float-right text-white text-sm">{fakeB}%</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fact slide                                                         */
/* ------------------------------------------------------------------ */

function FactSlide({ text }: { text: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-emerald-950 via-teal-950 to-green-950 flex flex-col items-center justify-center px-8">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px]" />
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <MapPin className="w-8 h-8 text-emerald-400" />
        </div>
        <span className="text-sm font-bold tracking-wider uppercase mb-3 inline-block rounded-full px-4 py-1" style={{ backgroundColor: '#FFFFFF', color: '#065F46' }}>
          알고 계셨나요?
        </span>
        <p className="text-white text-xl font-bold leading-relaxed max-w-sm">{text}</p>
      </div>
    </div>
  );
}
