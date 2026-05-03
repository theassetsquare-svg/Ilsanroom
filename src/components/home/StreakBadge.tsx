import { useVisitStreak } from '@/hooks/useVisitStreak';

/* 단골 뱃지 — 방문 연속일 표시
   - 사이트 #4 우선순위 (SNS 중독 매일 방문) 핵심
   - 다음 등급까지 N일 남았는지 시각화 */

export default function StreakBadge() {
  const { streak, tierLabel, tierEmoji, nextTierAt } = useVisitStreak();
  if (streak === 0) return null;

  const remaining = nextTierAt ? nextTierAt - streak : 0;
  const progress = nextTierAt
    ? Math.min(100, Math.round((streak / nextTierAt) * 100))
    : 100;

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">{tierEmoji}</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-[#111]">{tierLabel}</span>
              <span className="text-[11px] text-[#777]">·</span>
              <span className="text-sm font-bold text-rose-600">{streak}일 연속</span>
            </div>
            <div className="text-[10px] text-[#777] mt-0.5 truncate">
              {nextTierAt
                ? `다음 등급까지 ${remaining}일 남음 — 매일 들어오면 끝까지 간다`
                : '최고 등급 달성 — 진짜 단골'}
            </div>
          </div>
        </div>
      </div>
      {nextTierAt && (
        <div className="mt-2 h-1 rounded-full bg-white/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
