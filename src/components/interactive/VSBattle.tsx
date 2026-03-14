'use client';

import { useState } from 'react';
import ShareButtons from './ShareButtons';

const BATTLES = [
  { a: '강남 클럽', b: '홍대 클럽', topic: '클럽은 어디가 더 좋을까?' },
  { a: '나이트', b: '클럽', topic: '당신의 선택은?' },
  { a: '라운지', b: '호빠', topic: '프라이빗한 밤은?' },
  { a: '일산룸', b: '강남룸', topic: '프리미엄 룸 대결' },
  { a: '소셜댄스', b: 'EDM 프리스타일', topic: '당신의 춤 스타일은?' },
];

export default function VSBattle() {
  const [battleIdx, setBattleIdx] = useState(0);
  const [votes, setVotes] = useState<Record<number, { a: number; b: number }>>({});
  const [voted, setVoted] = useState<Record<number, 'a' | 'b'>>({});

  const battle = BATTLES[battleIdx];
  const v = votes[battleIdx] || { a: 0, b: 0 };
  const total = v.a + v.b;
  const hasVoted = voted[battleIdx];

  const vote = (side: 'a' | 'b') => {
    if (hasVoted) return;
    setVotes((prev) => ({
      ...prev,
      [battleIdx]: { a: (prev[battleIdx]?.a || 0) + (side === 'a' ? 1 : 0), b: (prev[battleIdx]?.b || 0) + (side === 'b' ? 1 : 0) },
    }));
    setVoted((prev) => ({ ...prev, [battleIdx]: side }));
  };

  const next = () => setBattleIdx((prev) => (prev + 1) % BATTLES.length);

  return (
    <div className="rounded-2xl border border-neon-pink/30 bg-neon-surface p-8">
      <h3 className="text-center text-lg font-bold text-neon-text mb-2">VS 배틀 투표</h3>
      <p className="text-center text-sm text-neon-pink mb-6">{battle.topic}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => vote('a')}
          className={`rounded-xl border-2 p-6 text-center transition-all ${
            hasVoted === 'a' ? 'border-neon-primary bg-neon-primary/10' : 'border-neon-border hover:border-neon-primary/50'
          }`}
        >
          <span className="text-xl font-bold text-neon-text">{battle.a}</span>
          {hasVoted && total > 0 && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-neon-surface-2">
                <div className="h-2 rounded-full bg-neon-primary transition-all" style={{ width: `${(v.a / total) * 100}%` }} />
              </div>
              <span className="mt-1 text-xs text-neon-primary-light">{Math.round((v.a / total) * 100)}%</span>
            </div>
          )}
        </button>
        <button
          onClick={() => vote('b')}
          className={`rounded-xl border-2 p-6 text-center transition-all ${
            hasVoted === 'b' ? 'border-neon-accent bg-neon-accent/10' : 'border-neon-border hover:border-neon-accent/50'
          }`}
        >
          <span className="text-xl font-bold text-neon-text">{battle.b}</span>
          {hasVoted && total > 0 && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-neon-surface-2">
                <div className="h-2 rounded-full bg-neon-accent transition-all" style={{ width: `${(v.b / total) * 100}%` }} />
              </div>
              <span className="mt-1 text-xs text-neon-accent-light">{Math.round((v.b / total) * 100)}%</span>
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={next} className="text-sm text-neon-text-muted hover:text-neon-text">다음 배틀 →</button>
        {hasVoted && <ShareButtons title={`VS 배틀: ${battle.a} vs ${battle.b} — 내 선택: ${hasVoted === 'a' ? battle.a : battle.b}`} />}
      </div>
    </div>
  );
}
