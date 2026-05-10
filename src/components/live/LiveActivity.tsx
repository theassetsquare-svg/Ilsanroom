import { useState, useEffect, memo } from 'react';
import { Link } from '../ui/SafeLink';
import { createClient } from '@/lib/supabase';

type HotPost = { id: string; title: string; category: string; likes: number; comments: number };

const LiveActivity = memo(function LiveActivity() {
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;
    supabase.from('posts')
      .select('id, title, category, likes, comment_count')
      .order('likes', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!alive || !data) return;
        setHotPosts(data.map(d => ({
          id: d.id,
          title: d.title,
          category: d.category,
          likes: d.likes ?? 0,
          comments: d.comment_count ?? 0,
        })));
      });
    return () => { alive = false; };
  }, []);

  if (hotPosts.length === 0) return null;

  const catColor: Record<string, string> = {
    '후기': 'bg-amber-500/20 text-amber-500',
    '자유': 'bg-blue-500/20 text-blue-500',
    '팁': 'bg-emerald-500/20 text-emerald-500',
    '모집': 'bg-violet-500/20 text-violet-500',
    'Q&A': 'bg-rose-500/20 text-rose-500',
    reviews: 'bg-amber-500/20 text-amber-500',
    free: 'bg-blue-500/20 text-blue-500',
    tips: 'bg-emerald-500/20 text-emerald-500',
    party: 'bg-violet-500/20 text-violet-500',
    discussion: 'bg-rose-500/20 text-rose-500',
  };

  return (
    <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
      <h3 className="text-sm font-bold text-neon-text mb-3 flex items-center gap-2">
        오늘의 인기 글 TOP 10
      </h3>
      <div className="space-y-2">
        {hotPosts.slice(0, 10).map((post, i) => (
          <Link
            key={post.id}
            to={`/community/post/${post.id}`}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neon-surface-2 transition group"
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
              i < 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-neon-surface-2 text-neon-text-muted'
            }`}>{i + 1}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${catColor[post.category] || 'bg-neutral-100 text-neutral-500'}`}>
              {post.category}
            </span>
            <span className="flex-1 text-sm text-neon-text-muted group-hover:text-neon-text transition line-clamp-1">{post.title}</span>
            <span className="text-[10px] text-neon-text-muted">👍{post.likes}</span>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default LiveActivity;
