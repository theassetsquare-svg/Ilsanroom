import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RewardAnimationType =
  | 'points'
  | 'levelup'
  | 'streak'
  | 'mission'
  | 'jackpot'
  | null;

interface Notification {
  id: string;
  text: string;
  time: number;
  read: boolean;
}

interface DailyMission {
  id: string;
  label: string;
  reward: number;
  completed: boolean;
  progress: number;
  goal: number;
}

interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  xpToNext: number;
  progress: number; // 0-1
}

// ---------------------------------------------------------------------------
// Mission definitions
// ---------------------------------------------------------------------------

interface MissionDef {
  id: string;
  label: string;
  reward: number;
  goal: number;
  /** Return current progress count from state. */
  progress: (s: EngagementState) => number;
}

const ALL_MISSIONS: MissionDef[] = [
  {
    id: 'view3',
    label: '3개 업소 둘러보기',
    reward: 30,
    goal: 3,
    progress: (s) => s.venuesViewed.length,
  },
  {
    id: 'vote1',
    label: 'VS 투표 참여',
    reward: 20,
    goal: 1,
    progress: (s) => s.votedBattles.length,
  },
  {
    id: 'roulette1',
    label: '룰렛 돌리기',
    reward: 20,
    goal: 1,
    progress: (s) => (s.rouletteUsed ? 1 : 0),
  },
  {
    id: 'search2',
    label: '검색 2회',
    reward: 15,
    goal: 2,
    progress: (s) => s.searchCount,
  },
  {
    id: 'quiz1',
    label: 'MBTI 퀴즈 완료',
    reward: 30,
    goal: 1,
    progress: (s) => (s.quizCompleted ? 1 : 0),
  },
  {
    id: 'like1',
    label: '업소 1개 좋아요',
    reward: 10,
    goal: 1,
    progress: (s) => s.likedVenues.length,
  },
  {
    id: 'dwell10',
    label: '10분 체류',
    reward: 40,
    goal: 10,
    progress: (s) => Math.floor(s.totalSessionSeconds / 60),
  },
  {
    id: 'view5',
    label: '5개 업소 탐색',
    reward: 50,
    goal: 5,
    progress: (s) => s.venuesViewed.length,
  },
  {
    id: 'share1',
    label: '친구에게 공유',
    reward: 25,
    goal: 1,
    progress: (s) => s.shareCount,
  },
  {
    id: 'dresscode1',
    label: '드레스코드 체크',
    reward: 15,
    goal: 1,
    progress: (s) => (s.dressCodeUsed ? 1 : 0),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Simple seeded PRNG (mulberry32). */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a YYYY-MM-DD string to a numeric seed. */
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Pick `count` unique items from `arr` using a seeded PRNG. */
function pickSeeded<T>(arr: T[], count: number, seed: number): T[] {
  const rng = seededRandom(seed);
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

/** Get today's 6 mission definitions. */
function todaysMissionDefs(): MissionDef[] {
  return pickSeeded(ALL_MISSIONS, 6, dateSeed(todayStr()));
}

/** Slot machine reward using weighted distribution. */
function spinReward(): number {
  const roll = Math.random();
  if (roll < 0.5) {
    // 50%: 5-10 points
    return 5 + Math.floor(Math.random() * 6);
  } else if (roll < 0.75) {
    // 25%: 15-30 points
    return 15 + Math.floor(Math.random() * 16);
  } else if (roll < 0.9) {
    // 15%: 35-60 points
    return 35 + Math.floor(Math.random() * 26);
  } else if (roll < 0.98) {
    // 8%: 70-90 points
    return 70 + Math.floor(Math.random() * 21);
  } else {
    // 2%: JACKPOT
    return 100;
  }
}

function levelName(level: number): string {
  if (level >= 50) return '🏆 신화';
  if (level >= 35) return '👑 레전드';
  if (level >= 20) return '💎 마스터';
  if (level >= 10) return '🔥 매니아';
  if (level >= 5) return '⭐ 탐험가';
  return '🌱 입문자';
}

function isConsecutiveDay(prev: string, today: string): boolean {
  const prevDate = new Date(prev + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const diff = todayDate.getTime() - prevDate.getTime();
  return diff === 86400000; // exactly 1 day
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface EngagementState {
  // Session
  sessionStartTime: number;
  totalSessionSeconds: number;

  // Streak
  streak: number;
  lastVisitDate: string;

  // Gamification
  points: number;
  level: number;
  xp: number;

  // Venues
  venuesViewed: string[];
  totalVenuesViewed: string[];

  // Missions
  completedMissions: string[];
  lastMissionReset: string;

  // Spin
  spinCount: number;
  lastSpinDate: string;

  // Feed & interactions
  feedIndex: number;
  votedBattles: string[];
  quizCompleted: boolean;
  rouletteUsed: boolean;
  chatbotUsed: boolean;
  dressCodeUsed: boolean;
  searchCount: number;
  shareCount: number;

  // Collections
  likedVenues: string[];
  bookmarkedVenues: string[];

  // Rewards
  unlockedRewards: string[];
  lastRewardTime: number;

  // Combo
  comboCount: number;
  maxCombo: number;

  // Daily / weekly
  dailyLoginRewardClaimed: boolean;
  weeklyBonusClaimed: boolean;

  // Notifications
  notifications: Notification[];

  // UI flags
  showExitModal: boolean;
  showRewardAnimation: boolean;
  rewardAnimationType: RewardAnimationType;
  rewardAnimationValue: number;

  // Actions
  initSession: () => void;
  trackView: (slug: string) => void;
  addPoints: (amount: number, reason: string) => void;
  completeMission: (missionId: string) => void;
  useSpin: () => void;
  vote: (battleId: string) => void;
  search: () => void;
  share: () => void;
  like: (slug: string) => void;
  bookmark: (slug: string) => void;
  completeQuiz: () => void;
  useRoulette: () => void;
  useChatbot: () => void;
  useDressCode: () => void;
  claimDailyReward: () => void;
  claimWeeklyBonus: () => void;
  triggerReward: (type: RewardAnimationType, value: number) => void;
  getSessionMinutes: () => number;
  getDailyMissions: () => DailyMission[];
  getLevel: () => LevelInfo;
  setExitModal: (show: boolean) => void;
  tick: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      // Default state
      sessionStartTime: 0,
      totalSessionSeconds: 0,
      streak: 0,
      lastVisitDate: '',
      points: 0,
      level: 1,
      xp: 0,
      venuesViewed: [],
      totalVenuesViewed: [],
      completedMissions: [],
      lastMissionReset: '',
      spinCount: 0,
      lastSpinDate: '',
      feedIndex: 0,
      votedBattles: [],
      quizCompleted: false,
      rouletteUsed: false,
      chatbotUsed: false,
      dressCodeUsed: false,
      searchCount: 0,
      shareCount: 0,
      likedVenues: [],
      bookmarkedVenues: [],
      unlockedRewards: [],
      lastRewardTime: 0,
      comboCount: 0,
      maxCombo: 0,
      dailyLoginRewardClaimed: false,
      weeklyBonusClaimed: false,
      notifications: [],
      showExitModal: false,
      showRewardAnimation: false,
      rewardAnimationType: null,
      rewardAnimationValue: 0,

      // -------------------------------------------------------------------
      // initSession
      // -------------------------------------------------------------------
      initSession: () => {
        const today = todayStr();
        const state = get();

        const updates: Partial<EngagementState> = {
          sessionStartTime: Date.now(),
        };

        // New day -- reset daily counters
        if (state.lastVisitDate !== today) {
          if (isConsecutiveDay(state.lastVisitDate, today)) {
            updates.streak = state.streak + 1;
          } else if (state.lastVisitDate !== '') {
            updates.streak = 1;
          } else {
            updates.streak = 1;
          }

          updates.lastVisitDate = today;
          updates.venuesViewed = [];
          updates.votedBattles = [];
          updates.quizCompleted = false;
          updates.rouletteUsed = false;
          updates.chatbotUsed = false;
          updates.dressCodeUsed = false;
          updates.searchCount = 0;
          updates.shareCount = 0;
          updates.totalSessionSeconds = 0;
          updates.comboCount = 0;
          updates.dailyLoginRewardClaimed = false;
          updates.weeklyBonusClaimed = false;

          if (state.lastSpinDate !== today) {
            updates.spinCount = 0;
            updates.lastSpinDate = today;
          }

          if (state.lastMissionReset !== today) {
            updates.completedMissions = [];
            updates.lastMissionReset = today;
          }
        }

        set(updates);
      },

      // -------------------------------------------------------------------
      // trackView
      // -------------------------------------------------------------------
      trackView: (slug: string) => {
        const state = get();

        const venuesViewed = state.venuesViewed.includes(slug)
          ? state.venuesViewed
          : [...state.venuesViewed, slug];

        const totalVenuesViewed = state.totalVenuesViewed.includes(slug)
          ? state.totalVenuesViewed
          : [...state.totalVenuesViewed, slug];

        const comboCount = state.comboCount + 1;
        const maxCombo = Math.max(comboCount, state.maxCombo);

        set({ venuesViewed, totalVenuesViewed, comboCount, maxCombo });

        // Award points only for new views this session
        if (!state.venuesViewed.includes(slug)) {
          get().addPoints(5, `업소 조회: ${slug}`);
        }
      },

      // -------------------------------------------------------------------
      // addPoints
      // -------------------------------------------------------------------
      addPoints: (amount: number, reason: string) => {
        const state = get();
        const newPoints = state.points + amount;
        let newXp = state.xp + amount;
        let newLevel = state.level;

        // Level up: 100 XP per level
        while (newXp >= 100 && newLevel < 99) {
          newXp -= 100;
          newLevel++;

          const levelUpNotification: Notification = {
            id: `levelup_${newLevel}_${Date.now()}`,
            text: `레벨 ${newLevel} 달성! ${levelName(newLevel)}`,
            time: Date.now(),
            read: false,
          };

          set((s) => ({
            notifications: [...s.notifications, levelUpNotification],
          }));

          get().triggerReward('levelup', newLevel);
        }

        // Cap XP at 99 if at max level
        if (newLevel >= 99) {
          newXp = Math.min(newXp, 99);
        }

        const notification: Notification = {
          id: `pts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: `+${amount}P ${reason}`,
          time: Date.now(),
          read: false,
        };

        set((s) => ({
          points: newPoints,
          xp: newXp,
          level: newLevel,
          notifications: [...s.notifications, notification],
        }));
      },

      // -------------------------------------------------------------------
      // completeMission
      // -------------------------------------------------------------------
      completeMission: (missionId: string) => {
        const state = get();
        if (state.completedMissions.includes(missionId)) return;

        const missionDef = ALL_MISSIONS.find((m) => m.id === missionId);
        if (!missionDef) return;

        set({ completedMissions: [...state.completedMissions, missionId] });
        get().addPoints(missionDef.reward, `미션 완료: ${missionDef.label}`);
        get().triggerReward('mission', missionDef.reward);
      },

      // -------------------------------------------------------------------
      // useSpin
      // -------------------------------------------------------------------
      useSpin: () => {
        const state = get();
        const today = todayStr();

        // Reset if new day
        if (state.lastSpinDate !== today) {
          set({ spinCount: 0, lastSpinDate: today });
        }

        const currentSpins =
          state.lastSpinDate !== today ? 0 : state.spinCount;
        if (currentSpins >= 5) return;

        const reward = spinReward();
        const isJackpot = reward === 100;

        set({
          spinCount: currentSpins + 1,
          lastSpinDate: today,
        });

        get().addPoints(reward, isJackpot ? '잭팟!' : '슬롯머신 보상');
        get().triggerReward(isJackpot ? 'jackpot' : 'points', reward);
      },

      // -------------------------------------------------------------------
      // vote
      // -------------------------------------------------------------------
      vote: (battleId: string) => {
        const state = get();
        if (state.votedBattles.includes(battleId)) return;
        set({ votedBattles: [...state.votedBattles, battleId] });
      },

      // -------------------------------------------------------------------
      // search
      // -------------------------------------------------------------------
      search: () => {
        set((s) => ({ searchCount: s.searchCount + 1 }));
      },

      // -------------------------------------------------------------------
      // share
      // -------------------------------------------------------------------
      share: () => {
        set((s) => ({ shareCount: s.shareCount + 1 }));
        get().addPoints(15, '공유하기');
      },

      // -------------------------------------------------------------------
      // like (toggle)
      // -------------------------------------------------------------------
      like: (slug: string) => {
        set((s) => {
          const liked = s.likedVenues.includes(slug);
          return {
            likedVenues: liked
              ? s.likedVenues.filter((v) => v !== slug)
              : [...s.likedVenues, slug],
          };
        });
      },

      // -------------------------------------------------------------------
      // bookmark (toggle)
      // -------------------------------------------------------------------
      bookmark: (slug: string) => {
        set((s) => {
          const bookmarked = s.bookmarkedVenues.includes(slug);
          return {
            bookmarkedVenues: bookmarked
              ? s.bookmarkedVenues.filter((v) => v !== slug)
              : [...s.bookmarkedVenues, slug],
          };
        });
      },

      // -------------------------------------------------------------------
      // completeQuiz
      // -------------------------------------------------------------------
      completeQuiz: () => {
        const state = get();
        if (state.quizCompleted) return;
        set({ quizCompleted: true });
        get().addPoints(30, 'MBTI 퀴즈 완료');
      },

      // -------------------------------------------------------------------
      // useRoulette
      // -------------------------------------------------------------------
      useRoulette: () => {
        const state = get();
        if (state.rouletteUsed) return;
        set({ rouletteUsed: true });
        get().addPoints(20, '룰렛 사용');
      },

      // -------------------------------------------------------------------
      // useChatbot
      // -------------------------------------------------------------------
      useChatbot: () => {
        const state = get();
        if (state.chatbotUsed) return;
        set({ chatbotUsed: true });
        get().addPoints(10, '챗봇 사용');
      },

      // -------------------------------------------------------------------
      // useDressCode
      // -------------------------------------------------------------------
      useDressCode: () => {
        const state = get();
        if (state.dressCodeUsed) return;
        set({ dressCodeUsed: true });
        get().addPoints(10, '드레스코드 체크');
      },

      // -------------------------------------------------------------------
      // claimDailyReward
      // -------------------------------------------------------------------
      claimDailyReward: () => {
        const state = get();
        if (state.dailyLoginRewardClaimed) return;
        set({ dailyLoginRewardClaimed: true });
        get().addPoints(50, '일일 로그인 보상');
        get().triggerReward('points', 50);
      },

      // -------------------------------------------------------------------
      // claimWeeklyBonus
      // -------------------------------------------------------------------
      claimWeeklyBonus: () => {
        const state = get();
        if (state.weeklyBonusClaimed) return;
        if (state.streak < 7) return;
        set({ weeklyBonusClaimed: true });
        get().addPoints(200, '7일 연속 방문 보너스');
        get().triggerReward('streak', 200);
      },

      // -------------------------------------------------------------------
      // triggerReward
      // -------------------------------------------------------------------
      triggerReward: (type: RewardAnimationType, value: number) => {
        set({
          showRewardAnimation: true,
          rewardAnimationType: type,
          rewardAnimationValue: value,
          lastRewardTime: Date.now(),
        });

        // Auto-hide after 2.5 seconds
        setTimeout(() => {
          set({
            showRewardAnimation: false,
            rewardAnimationType: null,
            rewardAnimationValue: 0,
          });
        }, 2500);
      },

      // -------------------------------------------------------------------
      // getSessionMinutes
      // -------------------------------------------------------------------
      getSessionMinutes: (): number => {
        const state = get();
        if (state.sessionStartTime === 0) return 0;
        return Math.floor((Date.now() - state.sessionStartTime) / 60000);
      },

      // -------------------------------------------------------------------
      // getDailyMissions
      // -------------------------------------------------------------------
      getDailyMissions: (): DailyMission[] => {
        const state = get();
        const missions = todaysMissionDefs();

        return missions.map((def) => {
          const progress = Math.min(def.progress(state), def.goal);
          return {
            id: def.id,
            label: def.label,
            reward: def.reward,
            completed: state.completedMissions.includes(def.id),
            progress,
            goal: def.goal,
          };
        });
      },

      // -------------------------------------------------------------------
      // getLevel
      // -------------------------------------------------------------------
      getLevel: (): LevelInfo => {
        const state = get();
        return {
          level: state.level,
          name: levelName(state.level),
          xp: state.xp,
          xpToNext: 100,
          progress: state.xp / 100,
        };
      },

      // -------------------------------------------------------------------
      // setExitModal
      // -------------------------------------------------------------------
      setExitModal: (show: boolean) => {
        set({ showExitModal: show });
      },

      // -------------------------------------------------------------------
      // tick -- called every second
      // -------------------------------------------------------------------
      tick: () => {
        const state = get();
        if (state.sessionStartTime === 0) return;
        set({ totalSessionSeconds: state.totalSessionSeconds + 1 });
      },
    }),
    {
      name: 'ilsanroom_engagement',
      partialize: (state) => {
        // Persist everything except transient UI flags and functions
        const {
          // Exclude actions (functions are not serializable)
          initSession: _a1,
          trackView: _a2,
          addPoints: _a3,
          completeMission: _a4,
          useSpin: _a5,
          vote: _a6,
          search: _a7,
          share: _a8,
          like: _a9,
          bookmark: _a10,
          completeQuiz: _a11,
          useRoulette: _a12,
          useChatbot: _a13,
          useDressCode: _a14,
          claimDailyReward: _a15,
          claimWeeklyBonus: _a16,
          triggerReward: _a17,
          getSessionMinutes: _a18,
          getDailyMissions: _a19,
          getLevel: _a20,
          setExitModal: _a21,
          tick: _a22,
          // Exclude transient UI state (reset on page load)
          showRewardAnimation: _u1,
          rewardAnimationType: _u2,
          rewardAnimationValue: _u3,
          showExitModal: _u4,
          sessionStartTime: _u5,
          ...persisted
        } = state;
        return persisted;
      },
    },
  ),
);

export type {
  EngagementState,
  DailyMission,
  LevelInfo,
  Notification,
  RewardAnimationType,
};
