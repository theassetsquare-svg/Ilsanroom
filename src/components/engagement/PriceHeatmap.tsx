
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { venues } from '@/data/venues';
import type { Venue } from '@/types';

/**
 * [8] PRICE HEATMAP — Color-coded cards: green=저렴 yellow=보통 red=고급
 * At a glance users see price range. Useful = stay longer.
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

function getPriceLevel(v: Venue): 'low' | 'mid' | 'high' {
  const entry = v.priceEntry || '';
  const drink = v.priceDrink || '';
  const combined = entry + drink;

  // Parse numbers from price strings
  const nums = combined.match(/\d+/g)?.map(Number) || [];
  const max = Math.max(...nums, 0);

  if (max === 0) return 'mid';
  if (max <= 20000) return 'low';
  if (max <= 50000) return 'mid';
  return 'high';
}

const levelConfig = {
  low: { label: '저렴', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  mid: { label: '보통', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high: { label: '고급', color: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function PriceHeatmap() {
  const grouped = useMemo(() => {
    const open = venues.filter(v => v.status !== 'closed_or_unclear');
    const groups: Record<string, Venue[]> = { low: [], mid: [], high: [] };
    open.forEach(v => {
      const level = getPriceLevel(v);
      groups[level].push(v);
    });
    return groups;
  }, []);

  return (
    <section className="px-4 py-4 max-w-[1200px] mx-auto">
      <h2 className="text-base font-black text-[#111] mb-3">💰 가격대별 한눈에 보기</h2>
      <div className="grid grid-cols-3 gap-2">
        {(['low', 'mid', 'high'] as const).map(level => {
          const config = levelConfig[level];
          const list = grouped[level].slice(0, 4);
          return (
            <div key={level} className={`rounded-xl border ${config.color} p-3`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
                <span className="text-[10px] text-gray-400">{grouped[level].length}곳</span>
              </div>
              <div className="space-y-1.5">
                {list.map(v => (
                  <Link
                    key={v.id}
                    to={getCategoryHref(v.category, v.slug, v.region)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-[#333] truncate hover:text-[#8B5CF6] transition-colors"
                  >
                    {v.nameKo}
                  </Link>
                ))}
                {grouped[level].length > 4 && (
                  <p className="text-[10px] text-gray-400">+{grouped[level].length - 4}곳 더</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
