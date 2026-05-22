import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../ui/SafeLink';
import type { Venue } from '@/types';

const RECOMMEND_BATCH = 6;

const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

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

const nextHooks = [
  '이것도 볼래?', '다른 데도 궁금하지?', '여기는 가봤어?',
  '아직 안 봤지?', '이건 진짜 숨은 맛집', '사람들이 찜한 곳',
];

export default function InfiniteRecommendLoop({ venues, popularVenues }: { venues: Venue[]; popularVenues: Venue[] }) {
  const [batches, setBatches] = useState(1);
  const [seenIds] = useState<Set<string>>(() => new Set(popularVenues.slice(0, 20).map(v => v.id)));
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setBatches(prev => Math.min(prev + 1, 20));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const allRecs = useMemo(() => {
    const result: Venue[][] = [];
    const used = new Set(seenIds);
    for (let i = 0; i < batches; i++) {
      const seed = new Date().getDate() * 100 + i * 37;
      const pool = venues.filter(v => !used.has(v.id));
      const shuffled = [...pool].sort((a, b) => {
        const ha = ((a.id.charCodeAt(0) || 0) * 31 + seed) % 1000;
        const hb = ((b.id.charCodeAt(0) || 0) * 31 + seed) % 1000;
        return ha - hb;
      });
      const batch = shuffled.slice(0, RECOMMEND_BATCH);
      batch.forEach(v => used.add(v.id));
      if (batch.length > 0) result.push(batch);
    }
    return result;
  }, [batches, venues, seenIds]);

  const crossCatHooks: Record<string, { text: string; cat: string; href: string }[]> = {
    club: [{ text: '클럽 가기 전에 라운지 한잔?', cat: 'lounge', href: '/lounges' }, { text: '클럽 말고 나이트는?', cat: 'night', href: '/nights' }],
    night: [{ text: '나이트 끝나고 마무리는 어디?', cat: 'room', href: '/rooms' }, { text: '클럽도 한번 가봐', cat: 'club', href: '/clubs' }],
    lounge: [{ text: '분위기 있는 요정도 있어', cat: 'yojeong', href: '/yojeong' }, { text: '라운지 취향이면 호빠도', cat: 'hoppa', href: '/hoppa' }],
    room: [{ text: '룸 말고 요정은 어때?', cat: 'yojeong', href: '/yojeong' }, { text: '클럽에서 마무리?', cat: 'club', href: '/clubs' }],
    yojeong: [{ text: '격식 풀고 나이트 가자', cat: 'night', href: '/nights' }, { text: '조용한 라운지도 좋아', cat: 'lounge', href: '/lounges' }],
    hoppa: [{ text: '호빠 끝나고 클럽 갈래?', cat: 'club', href: '/clubs' }, { text: '마무리는 라운지에서', cat: 'lounge', href: '/lounges' }],
  };

  return (
    <section className="px-4 py-3 max-w-3xl mx-auto">
      {allRecs.map((batch, bIdx) => {
        const hookText = nextHooks[bIdx % nextHooks.length];
        const firstCat = batch[0]?.category || 'club';
        const crossHook = crossCatHooks[firstCat]?.[bIdx % 2];
        return (
          <div key={bIdx}>
            <div className="flex items-center gap-2 mb-2 mt-4">
              <span className="text-sm font-bold text-[#111]">{hookText}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {batch.map(v => (
                <Link key={v.id} to={getCategoryHref(v.category, v.slug, v.region)}
                  className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                  <div className={`relative w-full overflow-hidden bg-gradient-to-br ${
                    v.category === 'club' ? 'from-violet-500 to-indigo-700' :
                    v.category === 'night' ? 'from-blue-500 to-purple-700' :
                    v.category === 'lounge' ? 'from-amber-500 to-orange-700' :
                    v.category === 'room' ? 'from-rose-500 to-pink-700' :
                    v.category === 'yojeong' ? 'from-emerald-500 to-teal-700' :
                    'from-pink-500 to-rose-700'
                  }`} style={{ aspectRatio: '4/3' }}>
                    <img src={`/venues/${v.slug}-1.webp`} alt={v.nameKo} loading="lazy" width={300} height={225}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="absolute inset-0 w-full h-full object-cover z-[1]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl">{catEmoji[v.category] || '🎵'}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 z-[2] bg-black/70 px-2 py-1.5">
                      <p className="text-[12px] font-bold text-white truncate">{v.nameKo}</p>
                      <p className="text-[10px] text-white/80">{catLabel[v.category]} · {v.regionKo}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {crossHook && bIdx % 2 === 0 && (
              <Link to={crossHook.href} className="mt-2 block rounded-xl bg-gradient-to-r from-[#F5F3FF] to-white border border-purple-100 p-3 active:bg-purple-50 transition text-center">
                <p className="text-sm font-bold text-[#8B5CF6]">{catEmoji[crossHook.cat]} {crossHook.text} →</p>
              </Link>
            )}

            {bIdx % 3 === 1 && (
              <Link to="/community/free?write=true" className="mt-2 block rounded-xl border border-orange-100 bg-orange-50/50 p-3 active:bg-orange-50 transition text-center">
                <p className="text-[13px] font-bold text-[#111]">💬 이 중에 가본 데 있어? 후기 보러가기</p>
                <p className="text-[10px] text-[#666] mt-0.5">솔직 후기 모음</p>
              </Link>
            )}
          </div>
        );
      })}

      <div ref={loaderRef} className="py-6 text-center">
        {batches < 20 ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-[#666]">더 많은 곳을 찾고 있어요...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111]">전국 {venues.length}곳 다 봤어!</p>
            <Link to="/community" className="inline-block rounded-full bg-[#8B5CF6] px-5 py-2 text-sm font-bold text-white active:scale-95 transition">커뮤니티 가기 →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
