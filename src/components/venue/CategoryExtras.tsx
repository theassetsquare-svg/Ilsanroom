

import { useState } from 'react';
import { Link } from '../ui/SafeLink';
import ShareButtons from '@/components/interactive/ShareButtons';
import { articles } from '@/data/magazine-articles';

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
      <Link to="/guide" className="mt-4 inline-flex items-center gap-1 text-sm text-neon-gold hover:underline">
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
  const [va, setVa] = useState(0);
  const [vb, setVb] = useState(0);
  const total = Math.max(1, va + vb);

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
      {!voted && <p className="text-center text-xs text-neon-text-subtle">투표하면 결과 확인 가능</p>}
    </div>
  );
}

/* ── 관련 매거진 — 카테고리별 실제 매거진 글로 cross-link (가짜 제목 금지) ── */
const RELATED_MAG_KEYWORDS: Record<string, string[]> = {
  club: ['클럽', 'EDM', '하우스', '테크노'],
  night: ['나이트', '소셜댄스', '부킹'],
  lounge: ['라운지', '바', '와인', '위스키'],
  room: ['룸', '가라오케', '노래'],
  yojeong: ['요정', '한정식', '한실', '국악'],
  hoppa: ['호빠', '호스트', '호스트바'],
};

export function RelatedMagazine({ category, region }: { category: keyof typeof RELATED_MAG_KEYWORDS; region?: string }) {
  const words = RELATED_MAG_KEYWORDS[category] || [];
  const matched = articles
    .map((a) => {
      const text = `${a.title} ${a.excerpt} ${a.tag}`;
      let score = 0;
      for (const w of words) if (text.includes(w)) score += 10;
      if (region && text.includes(region)) score += 30; // 권역 페이지: 지역명 일치 글 우선
      return { a, score };
    })
    // 권역 페이지는 지역+카테고리 모두 맞는 글만(없으면 렌더 안 함 — 가짜 매칭 금지)
    .filter((s) => (region ? s.score >= 40 : s.score > 0))
    .sort((x, y) => y.score - x.score)
    .slice(0, 4)
    .map((s) => s.a);

  if (matched.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-neon-text mb-4">관련 매거진</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {matched.map((a) => (
          <Link key={a.id} to={`/magazine/${a.id}`} className="rounded-xl border border-neon-border bg-neon-surface p-4 card-hover block">
            <span className="rounded-full bg-neon-primary/10 px-2 py-0.5 text-xs text-neon-primary-light">{a.tag}</span>
            <p className="mt-2 text-sm font-semibold text-neon-text leading-snug">{a.title}</p>
            <p className="mt-1 text-xs text-neon-text-muted line-clamp-2">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
