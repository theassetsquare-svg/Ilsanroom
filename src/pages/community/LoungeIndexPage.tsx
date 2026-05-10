import { useState, useEffect } from 'react';
import { Link } from '../../components/ui/SafeLink';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LOUNGE_DEFS } from '@/lib/lounge-api';
import { createClient } from '@/lib/supabase';
import UserLevelCard from '@/components/community/UserLevelCard';

export default function LoungeIndexPage() {
  useDocumentMeta(
    '업종별 라운지 — 같은 취향끼리 모이는 곳',
    '나이트·클럽·룸·요정·호빠·라운지바 6개 업종별 전용 게시판. 같은 곳 다녀온 사람끼리 후기 공유, 추천 받기, 단골 매장 비교까지. 익명으로 솔직하게 대화하는 곳.'
  );

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [todayPosts, setTodayPosts] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;

    LOUNGE_DEFS.forEach(async (def) => {
      const { count } = await supabase
        .from('lounge_posts')
        .select('*', { count: 'exact', head: true })
        .eq('lounge_type', def.type);
      if (alive) setCounts(prev => ({ ...prev, [def.type]: count || 0 }));
    });

    // 오늘 새 글 수 (KST 자정 기준)
    const kstNow = new Date(Date.now() + 9 * 3600000);
    const kstMidnight = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - 9 * 3600000).toISOString();
    supabase
      .from('lounge_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', kstMidnight)
      .then(({ count }) => { if (alive) setTodayPosts(count ?? 0); });

    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#111' }}>
            업종별 라운지
          </h1>
          <p className="text-neon-text-muted">같은 취향, 같은 관심사끼리 모이는 전용 게시판</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <span className="text-neon-text-muted">
              오늘 새 글 {todayPosts === null ? '—' : todayPosts}개
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 라운지 카드 그리드 */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LOUNGE_DEFS.map(def => (
              <Link
                key={def.type}
                to={def.href}
                className="group rounded-xl border border-neon-border bg-neon-surface/50 p-5 hover:border-violet-500/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{def.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-neon-text group-hover:text-violet-400 transition">{def.name}</h2>
                    <p className="text-xs text-neon-text-muted">{def.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-neon-text-muted">
                  <span>{counts[def.type] ?? 0}개 글</span>
                  <span className="text-violet-400 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>

          {/* 사이드바 */}
          <div className="w-full lg:w-72 space-y-4">
            <UserLevelCard />

            <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-4">
              <h3 className="text-sm font-bold text-neon-text mb-2">라운지 이용 안내</h3>
              <ul className="space-y-1 text-xs text-neon-text-muted">
                <li>· 같은 업종에 관심 있는 사람들의 자유 게시판</li>
                <li>· 후기, 질문, 정보 공유 뭐든 OK</li>
                <li>· 글 작성 시 포인트 적립 (8P)</li>
                <li>· 댓글 작성 시 포인트 적립 (5P)</li>
              </ul>
            </div>

            <Link
              to="/community"
              className="block rounded-xl border border-neon-border bg-neon-surface/50 p-4 text-center hover:border-violet-500/30 transition"
            >
              <span className="text-sm text-neon-text-muted">← 커뮤니티 메인으로</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
