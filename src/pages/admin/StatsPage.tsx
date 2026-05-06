import { useState, useEffect, useCallback } from 'react';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'baesunwook513@gmail.com', 'theassetsquare@gmail.com'];
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5분

interface StatsData {
  totalVenues: number;
  totalUsers: number;
  totalReviews: number;
  totalPosts: number;
  todayPosts: number;
  todayReviews: number;
  todayUsers: number;
  topVenues: Array<{ name: string; slug: string; category: string; view_count: number; review_count: number }>;
  topUsers: Array<{ nickname: string; points: number; level: string }>;
  recentPosts: Array<{ title: string; category: string; created_at: string; user_id: string }>;
  categoryStats: Array<{ category: string; count: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

const LEVEL_LABELS: Record<string, string> = {
  vip: 'VIP', regular: '단골', member: '멤버', newbie: '새내기',
};

export default function StatsPage() {
  useDocumentMeta('실시간 통계 — 놀쿨 운영 대시보드', '놀쿨 사이트 전체 회원 수, 일일 방문자, 콘텐츠 작성량, 전환율, 검색 유입 추이를 실시간으로 모니터링. 운영진 전용 통합 통계 대시보드.');
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) { setError('DB 연결 실패'); return; }

    try {
      setError(null);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        venuesRes,
        usersRes,
        reviewsRes,
        postsRes,
        todayPostsRes,
        todayReviewsRes,
        todayUsersRes,
        topVenuesRes,
        topUsersRes,
        recentPostsRes,
      ] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }).gte('joined_at', todayStart),
        supabase.from('venues').select('name,slug,category,view_count,review_count').order('view_count', { ascending: false }).limit(10),
        supabase.from('user_profiles').select('nickname,points,level').order('points', { ascending: false }).limit(10),
        supabase.from('posts').select('title,category,created_at,user_id').order('created_at', { ascending: false }).limit(10),
      ]);

      // 카테고리별 통계
      const catRes = await supabase.from('venues').select('category');
      const catCounts: Record<string, number> = {};
      (catRes.data || []).forEach((v: any) => {
        catCounts[v.category] = (catCounts[v.category] || 0) + 1;
      });

      setStats({
        totalVenues: venuesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        totalPosts: postsRes.count || 0,
        todayPosts: todayPostsRes.count || 0,
        todayReviews: todayReviewsRes.count || 0,
        todayUsers: todayUsersRes.count || 0,
        topVenues: (topVenuesRes.data || []) as any,
        topUsers: (topUsersRes.data || []) as any,
        recentPosts: (recentPostsRes.data || []) as any,
        categoryStats: Object.entries(catCounts).map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
      });

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
    const timer = setInterval(fetchStats, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [isAdmin, fetchStats]);

  if (authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
    </div>;
  }

  if (!isAdmin) {
    return <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
      관리자만 접근 가능합니다.
    </div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">실시간 통계</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString('ko-KR')} 갱신
            </span>
          )}
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
          >
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : stats ? (
        <>
          {/* 핵심 지표 카드 */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="총 업소" value={stats.totalVenues} />
            <StatCard label="총 회원" value={stats.totalUsers} />
            <StatCard label="총 후기" value={stats.totalReviews} />
            <StatCard label="총 게시글" value={stats.totalPosts} />
          </div>

          {/* 오늘 지표 */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            <StatCard label="오늘 새 글" value={stats.todayPosts} accent />
            <StatCard label="오늘 새 후기" value={stats.todayReviews} accent />
            <StatCard label="오늘 새 가입" value={stats.todayUsers} accent />
          </div>

          {/* 카테고리별 업소 수 */}
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">카테고리별 업소</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {stats.categoryStats.map((c) => (
                <div key={c.category} className="rounded-lg bg-gray-800 p-3 text-center">
                  <div className="text-xs text-gray-400">{CATEGORY_LABELS[c.category] || c.category}</div>
                  <div className="mt-1 text-xl font-bold text-white">{c.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 인기 업소 TOP 10 */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">인기 업소 TOP 10</h2>
              <div className="rounded-lg bg-gray-800 divide-y divide-gray-700">
                {stats.topVenues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">데이터 없음</div>
                ) : stats.topVenues.map((v, i) => (
                  <div key={v.slug} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-white">{v.name}</div>
                      <div className="text-xs text-gray-500">
                        {CATEGORY_LABELS[v.category] || v.category} · 후기 {v.review_count || 0}
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{(v.view_count || 0).toLocaleString()}회</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 활동왕 TOP 10 */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white">활동왕 TOP 10</h2>
              <div className="rounded-lg bg-gray-800 divide-y divide-gray-700">
                {stats.topUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">데이터 없음</div>
                ) : stats.topUsers.map((u, i) => (
                  <div key={u.nickname || i} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-white">{u.nickname || '(닉네임 없음)'}</div>
                      <div className="text-xs text-gray-500">
                        {LEVEL_LABELS[u.level] || u.level} · {u.points || 0}P
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 게시글 */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-white">최근 게시글</h2>
            <div className="rounded-lg bg-gray-800 divide-y divide-gray-700">
              {stats.recentPosts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">데이터 없음</div>
              ) : stats.recentPosts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="rounded bg-purple-900/50 px-2 py-0.5 text-xs text-purple-300">
                    {p.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-white">{p.title}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{p.user_id ? p.user_id.slice(0, 8) : '익명'}</div>
                    <div>{new Date(p.created_at).toLocaleDateString('ko-KR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${accent ? 'bg-purple-900/30 border border-purple-700' : 'bg-gray-800'}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? 'text-purple-300' : 'text-white'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
