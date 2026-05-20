import { useEffect, useState } from 'react';
import { Link } from '../ui/SafeLink';
import { fetchPosts, type Post, type PostCategory } from '@/lib/community-api';

const CATS: PostCategory[] = ['reviews', 'discussion', 'party', 'tips', 'free'];
const CAT_LABEL: Record<PostCategory, string> = {
  reviews: '후기', discussion: '토론', party: '모임', tips: '꿀팁', free: '자유',
};
// AA color-contrast (4.5:1) for small bold white text — darker shades
const CAT_COLOR: Record<PostCategory, string> = {
  reviews: '#92400E', discussion: '#5B21B6', party: '#BE185D', tips: '#15803D', free: '#1D4ED8',
};

const FRESH_WINDOW_MS = 30 * 60 * 1000; // 30분
const REFRESH_MS = 60 * 1000; // 1분 자동 갱신

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function FreshPostsZone() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // 순차 호출 — Supabase HTTP/2 동시 stream 한도 회피 (errors-in-console 0)
        const results = [];
        for (const c of CATS) {
          if (!alive) return;
          try { results.push(await fetchPosts(c, 6, 0)); }
          catch { results.push({ data: [] }); }
        }
        if (!alive) return;
        const all = results.flatMap((r) => r.data || []);
        all.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const now = Date.now();
        const fresh = all.filter(
          (p) => now - new Date(p.created_at).getTime() < FRESH_WINDOW_MS
        );
        // 30분 내 글이 없으면 가장 최근 5개로 fallback (홈은 절대 비우지 않는다)
        setPosts(fresh.length >= 3 ? fresh.slice(0, 5) : all.slice(0, 5));
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    const tickId = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(tickId);
    };
  }, []);

  if (posts.length === 0) return null;

  const now = Date.now();
  const hasFresh = posts.some(
    (p) => now - new Date(p.created_at).getTime() < FRESH_WINDOW_MS
  );

  return (
    <section className="px-4 pt-3 pb-1 max-w-3xl mx-auto" data-tick={tick}>
      <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-amber-50 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-rose-100/70 bg-white/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <h2 className="text-sm font-black text-[#111]">
              {hasFresh ? '🔥 지금 막 올라온 글' : '📌 최근 올라온 글'}
            </h2>
          </div>
          <Link
            to="/community"
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 active:scale-95 transition inline-flex items-center px-2 -mx-2"
            style={{ minHeight: 44 }}
          >
            전체 →
          </Link>
        </div>
        <ul className="divide-y divide-rose-100/60">
          {posts.map((p) => {
            const ageMs = Date.now() - new Date(p.created_at).getTime();
            const isHot = ageMs < FRESH_WINDOW_MS;
            return (
              <li key={p.id}>
                <Link
                  to={`/community/post/${p.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/80 active:bg-rose-50 transition"
                  style={{ minHeight: 48, touchAction: 'manipulation' }}
                >
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: CAT_COLOR[p.category] }}
                  >
                    {CAT_LABEL[p.category]}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium text-[#222]">
                    {p.title}
                  </span>
                  {isHot && (
                    <span className="shrink-0 text-[10px] font-bold text-rose-600">
                      {timeAgo(p.created_at)}
                    </span>
                  )}
                  {!isHot && (
                    <span className="shrink-0 text-[10px] text-[#999]">
                      {timeAgo(p.created_at)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
