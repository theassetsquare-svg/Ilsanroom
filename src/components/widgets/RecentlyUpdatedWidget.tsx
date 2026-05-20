/**
 * 최근 업데이트된 곳 (Recently Updated)
 * - 데이터 출처: scripts/data/aggregate-recently-updated.mjs 가 venues.updated_at desc 집계 → public/data/recently-updated.json
 * - 광고주/관리자가 실제로 정보를 변경한 venue만 (updated_at 가짜 터치 X — 트러스트 룰 준수)
 * - 빈 배열이면 위젯 자체 숨김
 */
import { useEffect, useState } from 'react';
import { Link } from '../ui/SafeLink';

interface RecentItem {
  path: string;
  title: string;
  category: string;
  region: string;
  updated_at: string; // ISO
}

interface RecentData {
  generated_at: string | null;
  items: RecentItem[];
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / 86400 / 7)}주 전`;
}

export default function RecentlyUpdatedWidget() {
  const [data, setData] = useState<RecentData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/recently-updated.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((json: RecentData) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error || !data || !data.items || data.items.length === 0) return null;

  const top = data.items.slice(0, 6);

  return (
    <section className="px-4 py-2 max-w-3xl mx-auto" aria-label="최근 업데이트된 곳">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-white p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🆕</span>
            <h2 className="text-sm font-bold text-[#111]">최근 업데이트</h2>
          </div>
          <span className="text-[10px] text-gray-400">광고주 직접 갱신</span>
        </div>
        <ul className="space-y-1">
          {top.map(v => (
            <li key={v.path}>
              <Link
                to={v.path}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 active:bg-blue-50 transition"
              >
                <span className="flex-1 min-w-0 text-[13px] text-[#111] truncate font-medium">{v.title}</span>
                <span className="shrink-0 text-[10px] text-gray-400">{v.region}</span>
                <span className="shrink-0 text-[10px] text-blue-600 font-medium">{timeAgo(v.updated_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
