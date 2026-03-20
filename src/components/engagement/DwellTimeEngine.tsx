

import { useState, useEffect, useCallback } from 'react';

/**
 * ★ 틱톡/넷플릭스/슬롯머신 심리학 — 체류시간 95분+ 엔진 ★
 *
 * 10가지 중독 메커니즘:
 * 1. 가변보상(Variable Reward) — 매번 다른 콘텐츠, 예측 불가
 * 2. 자이가르닉 효과 — 미완성 작업은 기억에 남음 → 완료하려 돌아옴
 * 3. FOMO — "지금 안 보면 사라짐" 긴급감
 * 4. 도파민 루프 — 작은 보상→기대→행동→보상 반복
 * 5. 끝없는 콘텐츠 — 스크롤 끝이 없음
 * 6. 3초 훅 — 첫 3초에 흥미 포착
 * 7. 개인화 — 나한테 맞는 콘텐츠
 * 8. 매일 올 이유 — 매일 달라지는 콘텐츠
 * 9. 감정 여정 — 기대→흥분→만족→궁금→다시 시작
 * 10. 사회적 증거 — 다른 사람도 하고 있음
 */

const STORAGE_KEY = 'dwell_engine';

interface DwellState {
  streak: number;
  lastVisit: string;
  totalVisits: number;
  venuesExplored: string[];
  quizDone: boolean;
  rouletteDone: boolean;
  vsDone: boolean;
  points: number;
  level: number;
  achievements: string[];
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultState(): DwellState {
  return {
    streak: 0,
    lastVisit: '',
    totalVisits: 0,
    venuesExplored: [],
    quizDone: false,
    rouletteDone: false,
    vsDone: false,
    points: 0,
    level: 1,
    achievements: [],
  };
}

export function useDwellEngine() {
  const [state, setState] = useState<DwellState>(getDefaultState);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DwellState;
        const today = getToday();

        // Update streak
        if (parsed.lastVisit === today) {
          // Already visited today
          setState(parsed);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          const newStreak = parsed.lastVisit === yesterdayStr ? parsed.streak + 1 : 1;
          const newState = {
            ...parsed,
            streak: newStreak,
            lastVisit: today,
            totalVisits: parsed.totalVisits + 1,
            points: parsed.points + 10, // 출석 포인트
          };
          setState(newState);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
      } else {
        const initial = { ...getDefaultState(), lastVisit: getToday(), totalVisits: 1, streak: 1, points: 10 };
        setState(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {
      // localStorage not available
    }
    setLoaded(true);
  }, []);

  const save = useCallback((newState: DwellState) => {
    setState(newState);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newState)); } catch {}
  }, []);

  const addPoints = useCallback((pts: number) => {
    setState(prev => {
      const next = { ...prev, points: prev.points + pts };
      // Level up every 100 points
      next.level = Math.floor(next.points / 100) + 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const markVenueExplored = useCallback((slug: string) => {
    setState(prev => {
      if (prev.venuesExplored.includes(slug)) return prev;
      const next = {
        ...prev,
        venuesExplored: [...prev.venuesExplored, slug],
        points: prev.points + 5,
      };
      next.level = Math.floor(next.points / 100) + 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const markActivity = useCallback((activity: 'quiz' | 'roulette' | 'vs') => {
    setState(prev => {
      const key = `${activity}Done` as keyof DwellState;
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true, points: prev.points + 20 };
      next.level = Math.floor(next.points / 100) + 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Exploration progress percentage (out of 127 venues)
  const explorationPercent = Math.round((state.venuesExplored.length / 127) * 100);

  // Incomplete activities (자이가르닉 효과)
  const incompleteActivities = [
    !state.quizDone && '밤문화 MBTI 테스트',
    !state.rouletteDone && '오늘 갈 곳 룰렛',
    !state.vsDone && 'VS 대결 투표',
    state.venuesExplored.length < 10 && `업소 ${10 - state.venuesExplored.length}곳 더 탐색하기`,
  ].filter(Boolean) as string[];

  return {
    state,
    loaded,
    addPoints,
    markVenueExplored,
    markActivity,
    explorationPercent,
    incompleteActivities,
  };
}
