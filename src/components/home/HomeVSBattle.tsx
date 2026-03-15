'use client';

import { useState } from 'react';
import ShareButtons from '@/components/interactive/ShareButtons';

const BATTLES = [
  { a: '강남클럽레이스', b: '클럽NB2', topic: '이번 주 인기 대결' },
  { a: '수원찬스돔나이트', b: '인천아라비안나이트', topic: '경기 나이트 최강자는?' },
  { a: '일산룸', b: '해운대고구려', topic: '프리미엄 룸 대결' },
  { a: '일산명월관요정', b: '강남라운지아르쥬', topic: '접대 장소 대결' },
  { a: '강남호빠로얄', b: '부산호빠스타', topic: '호빠 양대 산맥' },
];

export default function HomeVSBattle() {
  const [battleIdx, setBattleIdx] = useState(0);
  const [votes, setVotes] = useState<Record<number, { a: number; b: number }>>({});
  const [voted, setVoted] = useState<Record<number, 'a' | 'b'>>({});

  const battle = BATTLES[battleIdx];
  const v = votes[battleIdx] || { a: Math.floor(Math.random() * 30) + 20, b: Math.floor(Math.random() * 30) + 20 };
  const total = v.a + v.b;
  const hasVoted = voted[battleIdx];

  const vote = (side: 'a' | 'b') => {
    if (hasVoted) return;
    setVotes((prev) => ({
      ...prev,
      [battleIdx]: { a: (prev[battleIdx]?.a || v.a) + (side === 'a' ? 1 : 0), b: (prev[battleIdx]?.b || v.b) + (side === 'b' ? 1 : 0) },
    }));
    setVoted((prev) => ({ ...prev, [battleIdx]: side }));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-neon-pink/30 bg-neon-surface p-8">
        <h2 className="text-center text-xl font-bold text-neon-text mb-1">VS 대결 투표</h2>
        <p className="text-center text-sm text-neon-pink mb-6">{battle.topic}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {(['a', 'b'] as const).map((side) => {
            const name = battle[side];
            const isVoted = hasVoted === side;
            const color = side === 'a' ? 'neon-primary' : 'neon-accent';
            return (
              <button key={side} onClick={() => vote(side)}
                className={`rounded-xl border-2 p-6 text-center transition-all ${isVoted ? `border-${color} bg-${color}/10` : 'border-neon-border hover:border-neon-primary/50'}`}>
                <span className="text-lg font-bold text-neon-text">{name}</span>
                {hasVoted && total > 0 && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-neon-surface-2">
                      <div className={`h-2 rounded-full bg-${color} transition-all`} style={{ width: `${((side === 'a' ? v.a : v.b) / total) * 100}%` }} />
                    </div>
                    <span className="mt-1 text-xs text-neon-text-muted">{Math.round(((side === 'a' ? v.a : v.b) / total) * 100)}% ({side === 'a' ? v.a : v.b}표)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setBattleIdx((p) => (p + 1) % BATTLES.length)} className="text-sm text-neon-text-muted hover:text-neon-text">다음 대결 →</button>
          {hasVoted && <ShareButtons title={`VS 대결: ${battle.a} vs ${battle.b}`} />}
        </div>
        {!hasVoted && <p className="mt-3 text-center text-xs text-neon-text-muted/60">투표하면 결과를 볼 수 있습니다</p>}
      </div>
    </section>
  );
}
