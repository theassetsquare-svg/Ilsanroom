import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

export default function LuckyRoulette({ openVenues }: { openVenues: Venue[] }) {
  const [result, setResult] = useState<Venue | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const spin = useCallback(() => {
    if (spinning || openVenues.length === 0) return;
    setSpinning(true);
    setResult(null);
    timerRef.current = setTimeout(() => {
      setResult(openVenues[Math.floor(Math.random() * openVenues.length)]);
      setSpinning(false);
    }, 1500);
  }, [spinning, openVenues]);

  return (
    <section className="px-4 py-4 max-w-3xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5 text-center">
        <p className="text-2xl mb-1">🎰</p>
        <h2 className="text-lg font-bold text-[#111] mb-1">오늘 밤 여기 어때?</h2>
        <p className="text-sm text-[#555] mb-3">탭 한 번으로 행운의 업소를 뽑아봐</p>
        <button
          onClick={spin}
          disabled={spinning}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-bold transition-all ${
            spinning
              ? 'bg-violet-100 text-[#555] animate-pulse'
              : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] active:scale-95 shadow-lg'
          }`}
          style={{ minHeight: 48 }}
        >
          {spinning ? '돌리는 중...' : '🎲 돌려보기'}
        </button>

        {result && (
          <Link
            to={getCategoryHref(result.category, result.slug, result.region)}
            className="mt-4 block rounded-xl bg-white border border-violet-200 p-4 text-left transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-[#8B5CF6]">
                {result.nameKo.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[#111] truncate">{result.nameKo}</p>
                <p className="text-xs text-[#555]">{result.regionKo} · {catLabel[result.category]}</p>
              </div>
              <span className="text-[#8B5CF6] text-lg">→</span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
