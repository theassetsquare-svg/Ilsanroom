'use client';

import { useState } from 'react';
import Link from 'next/link';
import ShareButtons from '@/components/interactive/ShareButtons';

/* ── [D] 첫 방문 가이드 ── */
interface GuideProps {
  category: string;
  dress: string;
  budget: string;
  alone: string;
  reservation: string;
}

export function FirstVisitGuide({ category, dress, budget, alone, reservation }: GuideProps) {
  return (
    <div className="rounded-2xl border border-neon-gold/30 bg-neon-surface p-6">
      <h2 className="text-xl font-bold text-neon-text mb-4 flex items-center gap-2">
        <span className="text-2xl">📖</span> 처음 방문이세요?
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-neon-bg p-4">
          <h3 className="text-sm font-bold text-neon-gold mb-2">뭐 입고 가야 해?</h3>
          <p className="text-sm text-neon-text-muted leading-relaxed">{dress}</p>
        </div>
        <div className="rounded-xl bg-neon-bg p-4">
          <h3 className="text-sm font-bold text-neon-accent mb-2">얼마 들어?</h3>
          <p className="text-sm text-neon-text-muted leading-relaxed">{budget}</p>
        </div>
        <div className="rounded-xl bg-neon-bg p-4">
          <h3 className="text-sm font-bold text-neon-green mb-2">혼자 가도 돼?</h3>
          <p className="text-sm text-neon-text-muted leading-relaxed">{alone}</p>
        </div>
        <div className="rounded-xl bg-neon-bg p-4">
          <h3 className="text-sm font-bold text-neon-pink mb-2">예약 필요해?</h3>
          <p className="text-sm text-neon-text-muted leading-relaxed">{reservation}</p>
        </div>
      </div>
      <Link href="/guide" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-neon-gold hover:underline">
        전체 가이드 보기 →
      </Link>
    </div>
  );
}

/* ── [E] 인기 시간대 ── */
interface TimeSlot { day: string; time: string; level: number }

export function PopularTimes({ slots }: { slots: TimeSlot[] }) {
  return (
    <div className="rounded-2xl border border-neon-border bg-neon-surface p-6">
      <h2 className="text-xl font-bold text-neon-text mb-4">인기 요일·시간대</h2>
      <div className="space-y-3">
        {slots.map((s) => (
          <div key={s.day} className="flex items-center gap-3">
            <span className="w-14 text-sm font-medium text-neon-text">{s.day}</span>
            <span className="w-24 text-xs text-neon-text-muted">{s.time}</span>
            <div className="h-3 flex-1 rounded-full bg-neon-surface-2">
              <div className={`h-3 rounded-full ${s.level >= 80 ? 'bg-neon-pink' : s.level >= 50 ? 'bg-neon-gold' : 'bg-neon-green'}`} style={{ width: `${s.level}%` }} />
            </div>
            <span className="w-16 text-right text-xs text-neon-text-muted">{s.level >= 80 ? '최고 인기' : s.level >= 50 ? '보통' : '여유'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── [B] VS 대결 ── */
export function CategoryVSBattle({ venueA, venueB, topic }: { venueA: string; venueB: string; topic: string }) {
  const [voted, setVoted] = useState<'a' | 'b' | null>(null);
  const [va, setVa] = useState(Math.floor(Math.random() * 30) + 30);
  const [vb, setVb] = useState(Math.floor(Math.random() * 30) + 30);
  const total = va + vb;

  const vote = (side: 'a' | 'b') => {
    if (voted) return;
    if (side === 'a') setVa((p) => p + 1); else setVb((p) => p + 1);
    setVoted(side);
  };

  return (
    <div className="rounded-2xl border border-neon-pink/30 bg-neon-surface p-6">
      <h2 className="text-xl font-bold text-neon-text mb-1">VS 대결 투표</h2>
      <p className="text-sm text-neon-pink mb-4">{topic}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[{ side: 'a' as const, name: venueA, v: va, color: 'neon-primary' }, { side: 'b' as const, name: venueB, v: vb, color: 'neon-accent' }].map(({ side, name, v, color }) => (
          <button key={side} onClick={() => vote(side)}
            className={`rounded-xl border-2 p-5 text-center transition ${voted === side ? `border-${color} bg-${color}/10` : 'border-neon-border hover:border-neon-primary/50'}`}>
            <span className="text-base font-bold text-neon-text">{name}</span>
            {voted && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-neon-surface-2"><div className={`h-2 rounded-full bg-${color}`} style={{ width: `${(v / total) * 100}%` }} /></div>
                <span className="text-xs text-neon-text-muted mt-1">{Math.round((v / total) * 100)}%</span>
              </div>
            )}
          </button>
        ))}
      </div>
      {voted && <ShareButtons title={`VS: ${venueA} vs ${venueB}`} />}
      {!voted && <p className="text-center text-xs text-neon-text-muted/60">투표하면 결과 확인 가능</p>}
    </div>
  );
}

/* ── 관련 매거진 ── */
export function RelatedMagazine({ articles }: { articles: { title: string; tag: string }[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-neon-text mb-4">관련 매거진</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {articles.map((a, i) => (
          <Link key={i} href="/magazine" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-neon-border bg-neon-surface p-4 card-hover block">
            <span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs text-neon-primary-light">{a.tag}</span>
            <p className="mt-2 text-sm font-semibold text-neon-text leading-snug">{a.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
