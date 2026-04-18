import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { createClient } from '@/lib/supabase';
import { CommunityPulse } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';

const sectionDefs = [
  { title: "업소후기", description: "직접 가본 솔직한 방문 후기", href: "/community/reviews", icon: "⭐", category: "reviews" },
  { title: "오늘어디갈까", description: "오늘 밤 어디 갈지 같이 고민하는 곳", href: "/community/qna", icon: "🗺️", category: "discussion" },
  { title: "조각모집", description: "같이 놀러갈 사람 구하는 곳", href: "/community/jogak", icon: "🧩", category: "party" },
  { title: "꿀팁", description: "밤놀이 고수들의 실전 노하우", href: "/community/tips", icon: "💡", category: "tips" },
  { title: "자유게시판", description: "자유롭게 이야기 나누는 공간", href: "/community/free", icon: "💬", category: "free" },
];

export default function CommunityPage() {
  useDocumentMeta('밤 사람들이 모이는 커뮤니티', '후기, 꿀팁, 파티 모집, 오늘 밤 추천까지. 같이 노는 사람들의 광장.');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentPosts, setRecentPosts] = useState<{ id: string; title: string; category: string; likes: number; comment_count: number }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 각 카테고리별 글 수 가져오기
    sectionDefs.forEach(async (sec) => {
      const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', sec.category);
      setCounts(prev => ({ ...prev, [sec.category]: count || 0 }));
    });

    // 최근 인기글 5개
    supabase.from('posts')
      .select('id, title, category, likes, comment_count')
      .order('likes', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) setRecentPosts(data as any);
      });
  }, []);

  const catLabel: Record<string, string> = { reviews: '후기', discussion: 'Q&A', party: '모집', tips: '꿀팁', free: '자유' };

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            밤 사람들이 모이는 커뮤니티
          </h1>
          <p className="text-lg text-neon-text-muted mb-4">
            같은 밤을 보내는 사람들끼리 떠드는 곳
          </p>
          <CommunityPulse className="justify-center" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sectionDefs.map((section) => (
            <Link target="_blank" rel="noopener noreferrer" key={section.href}
              to={section.href}
              className="group rounded-2xl border border-neon-border bg-neon-surface p-6 transition-all hover:border-neon-primary/50 hover:bg-neon-surface/80"
            >
              <div className="mb-4 text-4xl">{section.icon}</div>
              <h2 className="mb-2 text-xl font-semibold group-hover:text-neon-primary-light">
                {section.title}
              </h2>
              <p className="mb-4 text-sm text-neon-text-muted">
                {section.description}
              </p>
              <div className="text-xs text-neon-text-muted">
                게시글 <span className="text-neon-primary-light font-medium">{(counts[section.category] || 0).toLocaleString()}</span>개
              </div>
            </Link>
          ))}
        </div>

        {/* 최근 인기글 — DB에서 가져온 실제 데이터 */}
        {recentPosts.length > 0 && (
          <div className="mt-16 rounded-2xl border border-neon-border bg-neon-surface p-8">
            <h2 className="mb-6 text-2xl font-bold">최근 인기글</h2>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/community/post/${post.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-neon-border bg-neon-bg px-5 py-4 transition hover:border-neon-primary/40 hover:bg-neon-surface"
                  style={{ minHeight: 56 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                      {catLabel[post.category] || post.category}
                    </span>
                    <span className="text-sm font-medium truncate" style={{ color: '#111' }}>{post.title}</span>
                  </div>
                  <div className="flex shrink-0 gap-3 ml-3 text-xs" style={{ color: '#999' }}>
                    <span>♥ {post.likes}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {recentPosts.length === 0 && (
          <div className="mt-16 rounded-2xl border border-neon-border bg-neon-surface p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">최근 인기글</h2>
            <p className="text-neon-text-muted">아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>
          </div>
        )}

        {/* 실시간 활동 피드 */}
        <div className="mt-10 rounded-2xl border border-neon-border bg-neon-surface p-6">
          <p className="text-sm font-bold text-neon-text mb-3">지금 일어나고 있는 일</p>
          <LiveActivityFeed maxItems={6} interval={5000} />
        </div>
      </div>
    </div>
  );
}
