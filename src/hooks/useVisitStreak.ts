import { useEffect, useState } from 'react';

/* 방문 연속일 추적 — localStorage 기반
   - 매일 첫 방문 시 streak 카운트
   - 하루 빠지면 1일로 리셋
   - 등급: 신규(0~2일) → 단골(3~6일) → 골수단골(7~29일) → 진성(30~89일) → 마스터(90+) */

const KEY = 'nolcool.visit_streak';

export type StreakTier = 'newbie' | 'regular' | 'loyal' | 'hardcore' | 'master';

export interface StreakData {
  streak: number;
  totalDays: number;
  tier: StreakTier;
  tierLabel: string;
  tierEmoji: string;
  nextTierAt: number | null;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function tierFor(streak: number): { tier: StreakTier; label: string; emoji: string; nextAt: number | null } {
  if (streak >= 90) return { tier: 'master', label: '마스터', emoji: '👑', nextAt: null };
  if (streak >= 30) return { tier: 'hardcore', label: '진성', emoji: '💎', nextAt: 90 };
  if (streak >= 7) return { tier: 'loyal', label: '골수단골', emoji: '🔥', nextAt: 30 };
  if (streak >= 3) return { tier: 'regular', label: '단골', emoji: '⭐', nextAt: 7 };
  return { tier: 'newbie', label: '신규', emoji: '🌱', nextAt: 3 };
}

export function useVisitStreak(): StreakData {
  const [data, setData] = useState<StreakData>(() => {
    const t = tierFor(0);
    return { streak: 0, totalDays: 0, tier: t.tier, tierLabel: t.label, tierEmoji: t.emoji, nextTierAt: t.nextAt };
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const today = todayKey();
      let streak = 1;
      let totalDays = 1;
      if (raw) {
        const parsed = JSON.parse(raw) as { lastDay: string; streak: number; total: number };
        const last = new Date(parsed.lastDay);
        const now = new Date(today);
        const diffMs = now.getTime() - last.getTime();
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays === 0) {
          streak = parsed.streak;
          totalDays = parsed.total;
        } else if (diffDays === 1) {
          streak = parsed.streak + 1;
          totalDays = parsed.total + 1;
        } else {
          streak = 1;
          totalDays = parsed.total + 1;
        }
      }
      localStorage.setItem(KEY, JSON.stringify({ lastDay: today, streak, total: totalDays }));
      const t = tierFor(streak);
      setData({ streak, totalDays, tier: t.tier, tierLabel: t.label, tierEmoji: t.emoji, nextTierAt: t.nextAt });
    } catch {
      /* ignore */
    }
  }, []);

  return data;
}
