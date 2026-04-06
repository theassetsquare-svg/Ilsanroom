
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';

/**
 * [2] MYSTERY CARD — Black card with "?" → tap to reveal hidden gem venue
 * Dopamine hit like opening a gift. Users keep scrolling for next one.
 */

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

export default function MysteryCard() {
  const [revealed, setRevealed] = useState(false);

  const mystery = useMemo(() => {
    const open = venues.filter(v => v.status !== 'closed_or_unclear');
    return open[Math.floor(Math.random() * open.length)];
  }, []);

  if (!mystery) return null;

  return (
    <div className="col-span-2 sm:col-span-3 lg:col-span-4">
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-center transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ minHeight: 44 }}
        >
          <div className="text-5xl mb-3 animate-bounce" style={{ color: '#FFFFFF' }}>?</div>
          <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>에디터만 아는 비밀 장소</p>
          <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>탭해서 확인하기</p>
        </button>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-purple-800 p-6 text-center">
          <p className="text-xs mb-2"><span className="rounded px-2 py-0.5" style={{ backgroundColor: '#FFFFFF', color: '#7C3AED' }}>비밀 장소 공개!</span></p>
          <p className="text-2xl mb-2">✨</p>
          <Link
            to={getCategoryHref(mystery.category, mystery.slug, mystery.region)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-white/10 backdrop-blur-sm p-4 transition-all hover:bg-white/20"
          >
            <p className="text-lg font-black text-white">{mystery.nameKo}</p>
            <p className="mt-1 text-sm text-white/80">{mystery.regionKo} · {mystery.shortDescription}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#8B5CF6]" style={{ minHeight: 44 }}>
              자세히 보기 →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
