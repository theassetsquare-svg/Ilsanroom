'use client';

import { getLevelInfo, type LevelName, LEVELS } from '@/lib/community-types';

export function LevelBadge({ level, xp, showXp = false }: { level: LevelName; xp: number; showXp?: boolean }) {
  const info = LEVELS.find((l) => l.name === level) || LEVELS[0];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${info.bg} px-2 py-0.5 text-xs font-medium ${info.color}`}>
      <span>{info.icon}</span>
      {info.name}
      {showXp && <span className="text-neutral-500">({xp}xp)</span>}
    </span>
  );
}

export function LevelProgress({ xp }: { xp: number }) {
  const info = getLevelInfo(xp);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <LevelBadge level={info.name as LevelName} xp={xp} showXp />
        {info.nextLevel && (
          <span className="text-xs text-neutral-500">
            다음: {info.nextLevel.icon} {info.nextLevel.name} ({info.nextLevel.minXp}xp)
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${info.progress}%` }}
        />
      </div>
    </div>
  );
}
