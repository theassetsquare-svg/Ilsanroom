/**
 * 오늘 가장 본 곳 (Trending Today)
 * - 데이터 출처: scripts/data/aggregate-trending.mjs 가 page_events 24h 집계 → public/data/trending-today.json
 * - 가짜 수치 0. 빈 배열이면 위젯 자체를 숨김 (graceful empty state).
 * - 트러스트 룰: 시드 카운터·랜덤 X. 실 view 데이터만.
 */
import { useEffect, useState } from 'react';
import { Link } from '../ui/SafeLink';

interface TrendingItem {
  path: string;
  title: string;
  category: string;
  region: string;
  views_24h: number;
}

interface TrendingData {
  generated_at: string | null;
  window_hours: number;
  items: TrendingItem[];
}

export default function TrendingTodayWidget() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/trending-today.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((json: TrendingData) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  // 데이터 없거나 비어있으면 위젯 숨김 (가짜 데이터 X)
  if (error || !data || !data.items || data.items.length === 0) return null;

  const top = data.items.slice(0, 7);

  return (
    <section className="px-4 py-2 max-w-3xl mx-auto" aria-label="오늘 가장 본 곳">
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/50 to-white p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🚀</span>
            <h2 className="text-sm font-bold text-[#111]">오늘 가장 본 곳</h2>
          </div>
          <span className="text-[10px] text-gray-400">최근 24시간</span>
        </div>
        <ol className="space-y-1">
          {top.map((v, i) => (
            <li key={v.path}>
              <Link
                to={v.path}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 active:bg-orange-50 transition"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${i < 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 text-[13px] text-[#111] truncate font-medium">{v.title}</span>
                <span className="shrink-0 text-[10px] text-gray-400">{v.region}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[10px] text-gray-400 text-center">실제 조회 기준 · AI 에디터 큐레이션</p>
      </div>
    </section>
  );
}
