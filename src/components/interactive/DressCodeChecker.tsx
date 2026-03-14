'use client';

import { useState } from 'react';
import ShareButtons from './ShareButtons';

const ITEMS = [
  { name: '정장 셋업', score: { club: 80, night: 100, lounge: 100, hoppa: 90 } },
  { name: '셔츠 + 슬랙스', score: { club: 90, night: 90, lounge: 90, hoppa: 85 } },
  { name: '깔끔한 청바지 + 셔츠', score: { club: 70, night: 60, lounge: 70, hoppa: 70 } },
  { name: '캐주얼 티셔츠 + 청바지', score: { club: 50, night: 30, lounge: 40, hoppa: 50 } },
  { name: '운동복 / 트레이닝', score: { club: 10, night: 5, lounge: 5, hoppa: 10 } },
  { name: '반바지 + 슬리퍼', score: { club: 5, night: 0, lounge: 5, hoppa: 10 } },
  { name: '원피스 / 드레스', score: { club: 95, night: 95, lounge: 100, hoppa: 90 } },
  { name: '미니스커트 + 블라우스', score: { club: 90, night: 80, lounge: 85, hoppa: 85 } },
];

const VENUES = ['club', 'night', 'lounge', 'hoppa'] as const;
const VENUE_LABELS: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', hoppa: '호빠' };

export default function DressCodeChecker() {
  const [selected, setSelected] = useState<string | null>(null);

  const item = ITEMS.find((i) => i.name === selected);

  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-8">
      <h3 className="text-lg font-bold text-neon-text mb-2 text-center">드레스코드 체커</h3>
      <p className="text-sm text-neon-text-muted mb-6 text-center">지금 입고 있는 옷으로 어디까지 갈 수 있을까?</p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {ITEMS.map((i) => (
          <button
            key={i.name}
            onClick={() => setSelected(i.name)}
            className={`rounded-xl border px-4 py-3 text-sm text-left transition-all ${
              selected === i.name ? 'border-neon-gold bg-neon-gold/10 text-neon-gold' : 'border-neon-border text-neon-text-muted hover:border-neon-gold/40'
            }`}
          >
            {i.name}
          </button>
        ))}
      </div>

      {item && (
        <div className="space-y-3 mb-6">
          {VENUES.map((v) => {
            const score = item.score[v];
            const color = score >= 80 ? 'bg-neon-green' : score >= 50 ? 'bg-neon-gold' : 'bg-neon-red';
            const label = score >= 80 ? '입장 가능' : score >= 50 ? '상황에 따라' : '입장 어려움';
            return (
              <div key={v} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-neon-text">{VENUE_LABELS[v]}</span>
                <div className="h-3 flex-1 rounded-full bg-neon-surface-2">
                  <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
                </div>
                <span className="w-20 text-right text-xs text-neon-text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {item && <ShareButtons title={`드레스코드 체크: "${item.name}" — 클럽 ${item.score.club}점, 나이트 ${item.score.night}점`} />}
    </div>
  );
}
