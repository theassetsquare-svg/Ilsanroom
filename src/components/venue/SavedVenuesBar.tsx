/**
 * SavedVenuesBar — 찜한 업소 재노출 바
 * 사용자가 하트로 찜한 업소를 사이트 어디서나 다시 꺼내 보여 재방문 동선을 만든다.
 * useFavorites(localStorage, venue.id 키) → venue 지연 로드로 해석. 0 PII · 0 로그인 · 0 가짜.
 * RecentVenuesBar(수동적 최근 본) 위에 노출 = 의도적으로 저장한 곳을 우선.
 */
import { useEffect, useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { Link } from '@/components/ui/SafeLink';
import { hasVenueImage } from '@/data/venue-image-manifest';
import type { Venue } from '@/types';

const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

function hrefFor(category: string, slug: string, region: string) {
  const map: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
  };
  return map[category] || `/${category}/${slug}`;
}

export default function SavedVenuesBar() {
  const { favorites, toggleFavorite, count } = useFavorites();
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  // venues(341KB)는 찜이 1개 이상일 때만 지연 로드 → 첫 방문(찜 0)엔 비용 0.
  useEffect(() => {
    if (count === 0) return;
    if (allVenues.length > 0) return;
    let cancelled = false;
    import('@/data/venues').then((m) => {
      if (!cancelled) setAllVenues(m.venues as unknown as Venue[]);
    });
    return () => { cancelled = true; };
  }, [count, allVenues.length]);

  if (count === 0) return null;

  const saved = allVenues.filter((v) => favorites.has(v.id)).slice(0, 12);
  if (saved.length === 0) return null;

  return (
    <section
      data-testid="saved-venues-bar"
      className="border-t border-gray-100 bg-white"
      aria-label="찜한 업소"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-[#111]">
            찜한 업소 다시 보기 <span className="text-[#DC2626]">{saved.length}</span>
          </h2>
        </div>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-3 pb-1">
            {saved.map((v) => (
              <div
                key={v.id}
                className="relative shrink-0 w-[140px]"
                data-testid="saved-venue-item"
              >
                <Link
                  to={hrefFor(v.category, v.slug, v.region)}
                  className="block rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-rose-200 to-rose-400">
                    {hasVenueImage(v.slug) && (
                      <img
                        src={`/venues/${v.slug}-1.webp?v3`}
                        alt={v.nameKo}
                        width={140}
                        height={140}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none opacity-30">
                      {catEmoji[v.category] || '🎵'}
                    </div>
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-bold text-[#111] truncate">{v.nameKo}</p>
                    <p className="text-[10px] text-[#666] truncate">{catLabel[v.category] || v.category} · {v.regionKo}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavorite(v.id)}
                  aria-label={`${v.nameKo} 찜 해제`}
                  className="absolute top-1 right-1 z-10 inline-flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  style={{ width: 22, height: 22 }}
                >
                  <span aria-hidden="true" className="text-[12px] leading-none">×</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
