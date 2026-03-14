'use client';

import { useState } from 'react';
import { venues } from '@/data/venues';
import ShareButtons from '@/components/interactive/ShareButtons';

function getCategoryHref(category: string, slug: string, region: string) {
  const map: Record<string, string> = { club: `/clubs/${region}/${slug}`, night: `/nights/${slug}`, lounge: `/lounges/${slug}`, room: `/rooms/${region}/${slug}`, yojeong: `/yojeong/${region}/${slug}`, hoppa: `/hoppa/${slug}` };
  return map[category] || `/${category}/${slug}`;
}
const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

export default function HomeRoulette() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof venues[0] | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const openVenues = venues.filter((v) => v.status !== 'closed_or_unclear');

  const spin = () => {
    setSpinning(true); setResult(null);
    let count = 0;
    const interval = setInterval(() => {
      const random = openVenues[Math.floor(Math.random() * openVenues.length)];
      setResult(random); count++;
      if (count > 20) { clearInterval(interval); setSpinning(false); setSpinCount((p) => p + 1); }
    }, 80);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-neon-accent/30 bg-neon-surface p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neon-text">오늘 갈 곳 룰렛</h2>
            <p className="text-sm text-neon-text-muted">어디 갈지 못 정하겠다면? 운에 맡겨보세요!</p>
          </div>
          {spinCount > 0 && <span className="text-xs text-neon-accent">{spinCount}회 돌림</span>}
        </div>

        <div className="mb-6 flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-neon-accent/30 bg-neon-bg">
          {result ? (
            <div className={`text-center ${spinning ? 'animate-pulse' : ''}`}>
              <p className={`text-2xl font-extrabold ${spinning ? 'text-neon-text-muted' : 'text-neon-accent'}`}>{result.nameKo}</p>
              {!spinning && <p className="text-xs text-neon-text-muted mt-1">{result.regionKo} · {catLabel[result.category] || result.category}{result.staffNickname ? ` · ${result.staffNickname}` : ''}</p>}
            </div>
          ) : (
            <span className="text-neon-text-muted">버튼을 눌러 시작!</span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={spin} disabled={spinning}
            className="rounded-xl bg-neon-accent px-8 py-3 font-bold text-white transition hover:bg-neon-accent-light disabled:opacity-50">
            {spinning ? '돌리는 중...' : '룰렛 돌리기'}
          </button>
          {result && !spinning && (
            <a href={getCategoryHref(result.category, result.slug, result.region)} target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-neon-primary/40 px-6 py-3 text-sm font-semibold text-neon-primary-light transition hover:bg-neon-primary/10">
              상세 보기 →
            </a>
          )}
        </div>
        {result && !spinning && <div className="mt-4"><ShareButtons title={`오늘의 행운 업소: ${result.nameKo}`} /></div>}
      </div>
    </section>
  );
}
