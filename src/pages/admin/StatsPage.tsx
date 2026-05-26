import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@/components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase';
import { getVenueBySlug, categories as VENUE_CATEGORIES } from '@/data/venues';

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
  activity: ActivityItem[];
  categoryStats: Array<{ category: string; count: number }>;
}

type ActivityKind = 'post' | 'comment' | 'review' | 'signup';

interface ActivityItem {
  kind: ActivityKind;
  id: string;
  title: string;            // 표시용 제목 (글 제목 / 댓글 내용 / 후기 제목 / 닉네임 가입)
  meta: string;             // 카테고리 라벨 또는 venue 이름
  href: string | null;      // 클릭 이동 URL
  created_at: string;
  nickname: string;         // 작성자 닉네임 (없으면 짧은 user_id)
}

const CATEGORY_LABELS: Record<string, string> = {
  club: '클럽', night: '나이트', lounge: '라운지',
  room: '룸', yojeong: '요정', hoppa: '호빠',
};

// 커뮤니티 게시판 카테고리 라벨 (posts.category)
const CATEGORY_LABELS_COMMUNITY: Record<string, string> = {
  free: '자유',
  qna: '질문',
  reviews: '후기',
  tips: '팁',
  party: '벙개',
  jogak: '조각모임',
  fashion: '패션',
  clip: '클립',
};

const LEVEL_LABELS: Record<string, string> = {
  vip: 'VIP', regular: '단골', member: '멤버', newbie: '새내기',
};

const KIND_META: Record<ActivityKind, { label: string; emoji: string; color: string }> = {
  post:    { label: '글',    emoji: '\uD83D\uDCDD', color: 'bg-purple-100 text-purple-700' },
  comment: { label: '댓글',  emoji: '\uD83D\uDCAC', color: 'bg-blue-100 text-blue-700' },
  review:  { label: '후기',  emoji: '\u2B50',       color: 'bg-amber-100 text-amber-700' },
  signup:  { label: '가입',  emoji: '\uD83C\uDF89', color: 'bg-emerald-100 text-emerald-700' },
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.floor((now - t) / 1000);
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export default function StatsPage() {
  useDocumentMeta('운영 통계 대시보드 — 회원·트래픽·콘텐츠 추이', '회원 수, 일일 방문자, 콘텐츠 작성량, 검색 유입 추이를 한 화면에서 확인하는 운영진 전용 통합 통계 대시보드.');
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
        recentCommentsRes,
        recentReviewsRes,
        recentSignupsRes,
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
        // 활동 피드 4축 — 각 50건 가져와서 시간순 머지 후 상위 50건만 표시
        supabase.from('posts').select('id,title,category,created_at,user_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('comments').select('id,content,post_id,created_at,user_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('reviews').select('id,title,content,venue_id,created_at,user_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('user_profiles').select('user_id,nickname,joined_at').order('joined_at', { ascending: false }).limit(50),
      ]);

      // 카테고리별 통계
      const catRes = await supabase.from('venues').select('category');
      const catCounts: Record<string, number> = {};
      (catRes.data || []).forEach((v: any) => {
        catCounts[v.category] = (catCounts[v.category] || 0) + 1;
      });

      // 닉네임 맵 — 활동 피드 user_id → nickname 표시용 (1회 조회로 N+1 회피)
      const allUserIds = new Set<string>();
      (recentPostsRes.data || []).forEach((p: any) => p.user_id && allUserIds.add(p.user_id));
      (recentCommentsRes.data || []).forEach((c: any) => c.user_id && allUserIds.add(c.user_id));
      (recentReviewsRes.data || []).forEach((r: any) => r.user_id && allUserIds.add(r.user_id));
      const nickMap = new Map<string, string>();
      if (allUserIds.size > 0) {
        const { data: profs } = await supabase
          .from('user_profiles')
          .select('user_id,nickname')
          .in('user_id', [...allUserIds]);
        (profs || []).forEach((p: any) => nickMap.set(p.user_id, p.nickname));
      }
      (recentSignupsRes.data || []).forEach((u: any) => u.user_id && u.nickname && nickMap.set(u.user_id, u.nickname));

      const nickOf = (uid: string | null | undefined): string => {
        if (!uid) return '익명';
        return nickMap.get(uid) || uid.slice(0, 8);
      };

      // venue 라벨/링크 빌더 (review용)
      const venueLabel = (venueId: string | null): { name: string; href: string | null } => {
        if (!venueId) return { name: '업소 미지정', href: null };
        const v = getVenueBySlug(venueId);
        if (!v) return { name: venueId, href: null };
        const cat = VENUE_CATEGORIES.find(c => c.key === v.category);
        return { name: v.nameKo, href: cat ? `${cat.path}/${v.slug}` : null };
      };

      const activity: ActivityItem[] = [
        ...(recentPostsRes.data || []).map((p: any) => ({
          kind: 'post' as const,
          id: p.id,
          title: p.title || '(제목 없음)',
          meta: CATEGORY_LABELS_COMMUNITY[p.category] || p.category,
          href: `/community/post/${p.id}`,
          created_at: p.created_at,
          nickname: nickOf(p.user_id),
        })),
        ...(recentCommentsRes.data || []).map((c: any) => ({
          kind: 'comment' as const,
          id: c.id,
          title: (c.content || '').replace(/\s+/g, ' ').slice(0, 60) || '(빈 댓글)',
          meta: '댓글',
          href: c.post_id ? `/community/post/${c.post_id}` : null,
          created_at: c.created_at,
          nickname: nickOf(c.user_id),
        })),
        ...(recentReviewsRes.data || []).map((r: any) => {
          const v = venueLabel(r.venue_id);
          return {
            kind: 'review' as const,
            id: r.id,
            title: r.title || (r.content || '').replace(/\s+/g, ' ').slice(0, 60) || '(후기)',
            meta: v.name,
            href: v.href,
            created_at: r.created_at,
            nickname: nickOf(r.user_id),
          };
        }),
        ...(recentSignupsRes.data || []).map((u: any) => ({
          kind: 'signup' as const,
          id: u.user_id,
          title: `${u.nickname || '익명'} 님이 가입`,
          meta: '신규 회원',
          href: null,
          created_at: u.joined_at,
          nickname: u.nickname || u.user_id?.slice(0, 8) || '익명',
        })),
      ]
        .filter((a) => !!a.created_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

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
        activity,
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
    return <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
      관리자만 접근 가능합니다.
    </div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">실시간 통계</h1>
          <p className="mt-1 text-xs text-gray-500">5분마다 자동 갱신</p>
        </div>
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
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
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
            <h2 className="mb-3 text-lg font-semibold text-gray-900">카테고리별 업소</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {stats.categoryStats.map((c) => (
                <div key={c.category} className="rounded-lg bg-white border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-600">{CATEGORY_LABELS[c.category] || c.category}</div>
                  <div className="mt-1 text-xl font-bold text-gray-900">{c.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 인기 업소 TOP 10 */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">인기 업소 TOP 10</h2>
              <div className="rounded-lg bg-white border border-gray-200 divide-y divide-gray-200">
                {stats.topVenues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">데이터 없음</div>
                ) : stats.topVenues.map((v, i) => (
                  <div key={v.slug} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">{v.name}</div>
                      <div className="text-xs text-gray-500">
                        {CATEGORY_LABELS[v.category] || v.category} · 후기 {v.review_count || 0}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{(v.view_count || 0).toLocaleString()}회</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 활동왕 TOP 10 */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">활동왕 TOP 10</h2>
              <div className="rounded-lg bg-white border border-gray-200 divide-y divide-gray-200">
                {stats.topUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">데이터 없음</div>
                ) : stats.topUsers.map((u, i) => (
                  <div key={u.nickname || i} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">{u.nickname || '(닉네임 없음)'}</div>
                      <div className="text-xs text-gray-500">
                        {LEVEL_LABELS[u.level] || u.level} · {u.points || 0}P
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 활동 피드 — 글/댓글/후기/가입 4축 통합 */}
          <ActivityFeed items={stats.activity} />
        </>
      ) : null}
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, post: 0, comment: 0, review: 0, signup: 0 };
    items.forEach((i) => { c[i.kind] = (c[i.kind] || 0) + 1; });
    return c;
  }, [items]);
  const filtered = filter === 'all' ? items : items.filter((i) => i.kind === filter);

  const TABS: Array<{ key: 'all' | ActivityKind; label: string }> = [
    { key: 'all',     label: '전체' },
    { key: 'post',    label: '글' },
    { key: 'comment', label: '댓글' },
    { key: 'review',  label: '후기' },
    { key: 'signup',  label: '가입' },
  ];

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-gray-900">최근 활동 피드</h2>
        <span className="text-xs text-gray-500">클릭하면 원본 글로 이동</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-3 text-sm font-medium transition ${
              filter === t.key
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            style={{ minHeight: 44, padding: '0 14px' }}
          >
            {t.label} <span className="ml-1 text-xs opacity-80">{counts[t.key] || 0}</span>
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-white border border-gray-200 divide-y divide-gray-200">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">최근 활동이 없습니다.</div>
        ) : filtered.map((a) => {
          const km = KIND_META[a.kind];
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3" style={{ minHeight: 56 }}>
              <span className={`shrink-0 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${km.color}`}>
                <span aria-hidden="true">{km.emoji}</span>
                {km.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm text-gray-900">{a.title}</div>
                <div className="mt-0.5 truncate text-xs text-gray-500">
                  {a.meta} · {a.nickname}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-gray-500">
                {relativeTime(a.created_at)}
              </div>
            </div>
          );
          return a.href ? (
            <Link key={`${a.kind}-${a.id}`} to={a.href} className="block hover:bg-gray-50 transition">
              {inner}
            </Link>
          ) : (
            <div key={`${a.kind}-${a.id}`}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${accent ? 'bg-purple-50 border border-purple-200' : 'bg-white border border-gray-200'}`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? 'text-purple-700' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
