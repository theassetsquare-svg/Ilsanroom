/**
 * CompareBar — 비교 모드 sticky bar (시즌157C)
 * compareList > 0일 때 모바일 바닥 nav 위에 고정, 클릭하면 /compare로 이동.
 * Redfin·Zillow의 "compare selected" sticky pattern.
 */
import { useCompareList } from '@/hooks/useCompareList';
import { Link } from '@/components/ui/SafeLink';

const catEmoji: Record<string, string> = { club: '🎵', night: '🌙', lounge: '🍸', room: '🚪', yojeong: '🏮', hoppa: '🥂' };

export default function CompareBar() {
  const { items, remove, clear, max } = useCompareList();
  if (items.length === 0) return null;

  return (
    <div
      data-testid="venue-compare-bar"
      role="region"
      aria-label="비교 목록"
      className="fixed left-0 right-0 z-[60] bottom-[72px] md:bottom-0 border-t border-violet-200 bg-white/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-2.5 sm:px-6 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold text-[#111]">비교 선택</span>
            <span className="text-[11px] text-[#8B5CF6] font-bold">{items.length}/{max}</span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto text-[10px] text-[#888] hover:text-[#DC2626]"
              aria-label="비교 목록 전체 해제"
            >
              해제
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {items.map((v) => (
              <button
                key={v.path}
                type="button"
                onClick={() => remove(v.path)}
                aria-label={`${v.nameKo} 비교 해제`}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-[11px] font-bold text-violet-800 hover:bg-violet-100"
                style={{ minHeight: 28 }}
              >
                <span aria-hidden="true">{catEmoji[v.category] || '·'}</span>
                <span className="truncate max-w-[100px]">{v.nameKo}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
        <Link
          to="/compare"
          className="shrink-0 inline-flex items-center justify-center rounded-xl bg-violet-600 text-white px-4 font-bold text-sm hover:bg-violet-700 active:scale-95 transition"
          style={{ minHeight: 44 }}
        >
          비교하기 →
        </Link>
      </div>
    </div>
  );
}
