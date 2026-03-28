import { useState, useEffect, useMemo } from 'react';
import { useEngagementStore } from '@/lib/engagement-store';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, Gift, ChevronDown, Flame, Star, Zap } from 'lucide-react';

/* ── Mission definitions ───────────────────────────────────────── */

interface MissionDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  reward: number;
  goal: number;
  href: string | null; // null = auto-tracked, no nav needed
}

const ALL_MISSIONS: MissionDef[] = [
  { id: 'view_3',    icon: <Star className="w-4 h-4" />,   title: '3개 업소 둘러보기',     description: '아무 업소 3곳의 상세 페이지를 방문하세요',   reward: 30, goal: 3, href: '/rooms' },
  { id: 'vote_1',    icon: <Zap className="w-4 h-4" />,    title: 'VS 투표 참여하기',      description: 'VS 대결에서 한 표를 던져보세요',            reward: 20, goal: 1, href: '/vs' },
  { id: 'roulette',  icon: <Target className="w-4 h-4" />, title: '룰렛 돌리기',           description: '오늘의 행운 룰렛을 돌려보세요',             reward: 20, goal: 1, href: '/roulette' },
  { id: 'search_2',  icon: <Star className="w-4 h-4" />,   title: '검색 2회 하기',         description: '검색으로 원하는 업소를 찾아보세요',          reward: 15, goal: 2, href: null },
  { id: 'quiz',      icon: <Flame className="w-4 h-4" />,  title: 'MBTI 퀴즈 완료',       description: '내 밤문화 MBTI가 뭔지 한번 해봐',             reward: 30, goal: 1, href: '/quiz' },
  { id: 'like_1',    icon: <Gift className="w-4 h-4" />,   title: '업소 좋아요 누르기',     description: '마음에 드는 업소에 하트를 눌러주세요',        reward: 10, goal: 1, href: '/clubs' },
  { id: 'stay_10',   icon: <Flame className="w-4 h-4" />,  title: '10분 체류하기',         description: '사이트에서 10분 이상 머물러 보세요',         reward: 40, goal: 10, href: null },
  { id: 'view_5',    icon: <Star className="w-4 h-4" />,   title: '5개 업소 탐색하기',     description: '업소 5곳의 상세 페이지를 탐색하세요',        reward: 50, goal: 5, href: '/lounges' },
  { id: 'share_1',   icon: <Gift className="w-4 h-4" />,   title: '친구에게 공유하기',      description: '업소 정보를 친구에게 공유해보세요',           reward: 25, goal: 1, href: null },
  { id: 'dresscheck', icon: <Check className="w-4 h-4" />, title: '드레스코드 체크하기',    description: '가이드에서 드레스코드 한번 봐봐',          reward: 15, goal: 1, href: '/guide' },
];

const DAILY_MISSION_COUNT = 6;
const ALL_CLEAR_BONUS = 100;
const MISSIONS_STORAGE_KEY = 'daily_missions';

/* ── Helpers ────────────────────────────────────────────────────── */

interface DailyMissionState {
  date: string;
  selectedIds: string[];
  progress: Record<string, number>;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dateSeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) % 2147483647;
  }
  return h || 1;
}

function loadMissionState(): DailyMissionState {
  const today = getTodayStr();
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed: DailyMissionState = JSON.parse(raw);
      if (parsed.date === today) return parsed;
    }
  } catch { /* noop */ }

  // Generate today's 6 missions
  const shuffled = seededShuffle(ALL_MISSIONS, dateSeed(today));
  const selectedIds = shuffled.slice(0, DAILY_MISSION_COUNT).map(m => m.id);
  const state: DailyMissionState = { date: today, selectedIds, progress: {} };
  try { localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
  return state;
}

function saveMissionState(state: DailyMissionState) {
  try { localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
}

function getResetCountdown(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

/* ── Component ──────────────────────────────────────────────────── */

export default function DailyMissions() {
  const [open, setOpen] = useState(false);
  const [missionState, setMissionState] = useState<DailyMissionState | null>(null);
  const [countdown, setCountdown] = useState(getResetCountdown);
  const store = useEngagementStore();

  // Load missions on mount
  useEffect(() => {
    setMissionState(loadMissionState());
  }, []);

  // Derive progress from store on each render
  useEffect(() => {
    if (!missionState) return;
    const progress: Record<string, number> = { ...missionState.progress };
    const views = store.venuesViewed.length;
    const likeCount = store.likedVenues.length;

    // Auto-detect progress for relevant missions
    if (missionState.selectedIds.includes('view_3')) {
      progress['view_3'] = Math.min(3, views);
    }
    if (missionState.selectedIds.includes('view_5')) {
      progress['view_5'] = Math.min(5, views);
    }
    if (missionState.selectedIds.includes('like_1')) {
      progress['like_1'] = Math.min(1, likeCount);
    }

    const updated = { ...missionState, progress };
    setMissionState(updated);
    saveMissionState(updated);
    // Only re-run when store values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.venuesViewed.length, store.likedVenues.length]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCountdown(getResetCountdown()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const todayMissions = useMemo(() => {
    if (!missionState) return [];
    return missionState.selectedIds
      .map(id => ALL_MISSIONS.find(m => m.id === id))
      .filter(Boolean) as MissionDef[];
  }, [missionState?.selectedIds]);

  const getProgress = (id: string) => missionState?.progress[id] ?? 0;
  const isComplete = (m: MissionDef) => getProgress(m.id) >= m.goal;
  const completedCount = todayMissions.filter(m => isComplete(m)).length;
  const allClear = completedCount === DAILY_MISSION_COUNT;
  const incompleteCount = DAILY_MISSION_COUNT - completedCount;

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="오늘의 미션 열기"
      >
        <Target className="w-6 h-6 text-white" />
        {incompleteCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-xs font-bold text-white">
            {incompleteCount}
          </span>
        )}
        {allClear && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-xs">
            <Check className="w-3 h-3 text-white" />
          </span>
        )}
      </motion.button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[70] max-h-[60vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="sticky top-0 z-10 flex justify-center bg-white pt-3 pb-1 rounded-t-3xl">
                <div className="h-1 w-10 rounded-full bg-[#D1D5DB]" />
              </div>

              <div className="px-5 pb-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#8B5CF6]" />
                      오늘의 미션
                    </h2>
                    <p className="text-xs text-[#333] mt-0.5">
                      {dateLabel} &middot; 완료: {completedCount}/{DAILY_MISSION_COUNT}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition"
                    aria-label="닫기"
                  >
                    <ChevronDown className="w-4 h-4 text-[#555]" />
                  </button>
                </div>

                {/* Overall progress bar */}
                <div className="mb-5">
                  <div className="h-2 rounded-full bg-[#F3F0FF] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedCount / DAILY_MISSION_COUNT) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Mission list */}
                <div className="space-y-3">
                  {todayMissions.map((mission, idx) => {
                    const done = isComplete(mission);
                    const prog = getProgress(mission.id);
                    const progressPct = Math.min(100, Math.round((prog / mission.goal) * 100));

                    const card = (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative rounded-xl border p-4 transition ${
                          done
                            ? 'border-[#D1FAE5] bg-[#F0FDF4]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#C4B5FD] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            done
                              ? 'bg-[#D1FAE5] text-[#059669]'
                              : 'bg-[#F3F0FF] text-[#8B5CF6]'
                          }`}>
                            {done ? <Check className="w-4 h-4" /> : mission.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${done ? 'text-[#059669] line-through' : 'text-[#111]'}`}>
                              {mission.title}
                            </p>
                            <p className="text-xs text-[#333] mt-0.5">{mission.description}</p>

                            {/* Progress bar */}
                            {!done && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-[#333] mb-0.5">
                                  <span>{prog}/{mission.goal}</span>
                                  <span>{progressPct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[#F3F0FF] overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reward / Status */}
                          <div className="shrink-0 text-right">
                            {done ? (
                              <span className="inline-block rounded-full bg-[#059669] px-2 py-0.5 text-xs font-bold text-white">
                                완료!
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-[#8B5CF6]">+{mission.reward}P</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );

                    // Wrap in Link if navigable and not complete
                    if (!done && mission.href) {
                      return (
                        <Link target="_blank" rel="noopener noreferrer" key={mission.id} to={mission.href} onClick={() => setOpen(false)} className="block">
                          {card}
                        </Link>
                      );
                    }
                    return card;
                  })}
                </div>

                {/* All Clear Bonus */}
                <AnimatePresence>
                  {allClear && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="mt-5 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] p-5 text-center shadow-lg shadow-amber-500/20"
                    >
                      <p className="text-2xl mb-1">🎉</p>
                      <p className="text-base font-bold text-white">올클리어!</p>
                      <p className="text-sm text-white/90 mt-1">보너스 <span className="font-extrabold">+{ALL_CLEAR_BONUS}P</span> 획득!</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reset countdown */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[#333]">
                  <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>리셋까지 {countdown.hours}시간 {countdown.minutes}분</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
