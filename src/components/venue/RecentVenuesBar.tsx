/**
 * RecentVenuesBar — 최근 본 venue 영구 바 (시즌157A)
 * Outlet 직후 마운트, 페이지 하단 풋터 직전에 고정 표시.
 * 사이트 어디서나 최근 본 venue 10개 가로 스크롤로 즉시 재방문 (Zillow·Coupang 패턴).
 */
import { useRecentVenues } from '@/hooks/useRecentVenues';
import { Link } from '@/components/ui/SafeLink';
import { hasVenueImage } from '@/data/venue-image-manifest';

const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };
const catLabel: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

export default function RecentVenuesBar() {
  const { items, remove, clear } = useRecentVenues();
  if (items.length === 0) return null;
  const visible = items.slice(0, 10);

  return (
    <section
      data-testid="recent-venues-bar"
      className="border-t border-gray-100 bg-white"
      aria-label="최근 본 업소"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-[#111]">
            최근 본 업소 <span className="text-[#8B5CF6]">{items.length}</span>
          </h2>
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-[#888] hover:text-[#DC2626]"
            aria-label="최근 본 목록 전체 삭제"
          >
            전체 삭제
          </button>
        </div>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-3 pb-1">
            {visible.map((v) => (
              <div
                key={v.path}
                className="relative shrink-0 w-[140px]"
                data-testid="recent-venue-item"
              >
                <Link
                  to={v.path}
                  className="block rounded-xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-violet-200 to-violet-400">
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
                  onClick={() => remove(v.path)}
                  aria-label={`${v.nameKo} 최근 본 목록에서 삭제`}
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
