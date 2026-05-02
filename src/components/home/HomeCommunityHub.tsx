import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchPosts, type Post } from '@/lib/community-api';
import WritePostModal from '@/components/community/WritePostModal';

const boards = [
  { key: 'reviews' as const, label: '업소 후기', icon: '⭐', href: '/community/reviews', desc: '별점 + 한줄평' },
  { key: 'discussion' as const, label: '오늘 어디 갈까', icon: '🗣️', href: '/community/qna', desc: '실시간 추천 토론' },
  { key: 'party' as const, label: '파티/모임', icon: '🎉', href: '/community/party', desc: '같이 갈 사람 모집' },
  { key: 'tips' as const, label: '꿀팁', icon: '💡', href: '/community/tips', desc: '드레스코드/예산/시간대' },
  { key: 'free' as const, label: '자유 게시판', icon: '💬', href: '/community/free', desc: '자유' },
];

export default function HomeCommunityHub() {
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [showWrite, setShowWrite] = useState(false);

  useEffect(() => {
    // Fetch recent posts across all categories
    const load = async () => {
      const results = await Promise.all(
        boards.map(b => fetchPosts(b.key, 2, 0))
      );
      const all = results.flatMap(r => r.data);
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentPosts(all.slice(0, 5));
    };
    load();
  }, []);

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = { reviews: '후기', discussion: '토론', party: '모임', tips: '꿀팁', free: '자유' };
    return map[cat] || cat;
  };

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neon-text">커뮤니티</h2>
          <p className="text-sm text-neon-text-muted mt-1">같은 밤을 보내는 사람들끼리 수다 떠는 곳</p>
        </div>
        <div className="flex gap-2">
          {user ? (
            <button
              onClick={() => setShowWrite(true)}
              className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light"
            >
              글쓰기
            </button>
          ) : (
            <Link to="/login?redirect=/community/free?write=true"
              className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-primary-light">
              글쓰기
            </Link>
          )}
          <Link to="/community" className="rounded-xl border border-neon-border px-4 py-2.5 text-sm font-medium text-neon-text-muted transition hover:bg-neon-surface-2">
            전체보기
          </Link>
        </div>
      </div>

      {/* 5 Board cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-8">
        {boards.map((b) => (
          <Link
            key={b.key}
            to={b.href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-neon-border bg-white p-4 text-center transition hover:border-neon-primary/40 hover:shadow-md card-hover"
          >
            <span className="text-2xl">{b.icon}</span>
            <span className="text-sm font-bold text-neon-text group-hover:text-neon-primary">{b.label}</span>
            <span className="text-xs text-neon-text-muted">{b.desc}</span>
          </Link>
        ))}
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="rounded-2xl border border-neon-border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-neon-border bg-neon-surface-2">
            <h3 className="text-sm font-bold text-neon-text">최근 게시글</h3>
          </div>
          {recentPosts.map((post, i) => (
            <div
              key={post.id}
              className={`flex items-center justify-between px-5 py-3 transition hover:bg-neon-surface ${
                i !== recentPosts.length - 1 ? 'border-b border-neon-border/50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="shrink-0 rounded-full bg-neon-primary/10 px-2.5 py-0.5 text-xs text-neon-primary">
                  {categoryLabel(post.category)}
                </span>
                <span className="truncate text-sm text-neon-text">{post.title}</span>
              </div>
              <div className="flex shrink-0 gap-3 ml-4 text-xs text-neon-text-muted">
                <span>{post.users?.nickname || '익명'}</span>
                <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 비회원: 가입 유도 문구 표시하지 않음 — 콘텐츠가 재미있으면 자발적으로 가입 */}

      <WritePostModal open={showWrite} onClose={() => setShowWrite(false)} />
    </section>
  );
}
