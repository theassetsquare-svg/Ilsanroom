import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { submitReviewComment, type ReviewComment } from '@/lib/review-api';
import { createClient } from '@/lib/supabase';

interface Props {
  reviewId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function CommentItem({
  comment,
  onReply,
  depth = 0,
}: {
  comment: ReviewComment & { children?: ReviewComment[] };
  onReply: (id: string, nickname: string) => void;
  depth?: number;
}) {
  const nickname = comment.user_profiles?.nickname || '익명';
  const level = comment.user_profiles?.level || 'newbie';
  const levelEmoji: Record<string, string> = { newbie: '', regular: '', loyal: '', vip: '', expert: '' };

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-neon-border/30 pl-4' : ''}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-neon-text">{levelEmoji[level] || ''} {nickname}</span>
          <span className="text-xs text-neon-text-muted">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-neon-text-muted leading-relaxed">{comment.content}</p>
        <button
          onClick={() => onReply(comment.id, nickname)}
          className="mt-1 text-xs text-violet-400 hover:text-violet-300"
        >
          답글
        </button>
      </div>
      {comment.children?.map(child => (
        <CommentItem key={child.id} comment={child} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ReviewComments({ reviewId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<(ReviewComment & { children?: ReviewComment[] })[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadComments = async () => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      const { data } = await supabase
        .from('review_comments')
        .select('*, user_profiles!left(nickname, avatar_url, level)')
        .eq('review_id', reviewId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (!data) return;

      // 트리 구조
      const map = new Map<string, ReviewComment & { children: ReviewComment[] }>();
      const roots: (ReviewComment & { children: ReviewComment[] })[] = [];

      for (const c of data as unknown as ReviewComment[]) {
        map.set(c.id, { ...c, children: [] });
      }
      for (const c of map.values()) {
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.children.push(c);
        } else {
          roots.push(c);
        }
      }
      setComments(roots);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const handleReply = (id: string, nickname: string) => {
    setReplyTo({ id, nickname });
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);

    const result = await submitReviewComment(reviewId, text.trim(), replyTo?.id);
    setSubmitting(false);

    if (!result.error) {
      setText('');
      setReplyTo(null);
      loadComments();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-3">
      {comments.length > 0 && (
        <div className="divide-y divide-neon-border/20">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} onReply={handleReply} />
          ))}
        </div>
      )}

      {user ? (
        <div className="mt-3">
          {replyTo && (
            <div className="mb-1 flex items-center gap-2 text-xs text-violet-400">
              <span>@{replyTo.nickname}에게 답글</span>
              <button onClick={() => setReplyTo(null)} className="text-neon-text-muted hover:text-red-400">x</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글을 작성하세요..."
              maxLength={500}
              className="flex-1 rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm text-neon-text placeholder:text-neon-text-muted/50 focus:border-violet-500 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {submitting ? '...' : '등록'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-neon-text-muted">
          <a href="/login" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">로그인</a> 후 댓글 작성 가능
        </p>
      )}
    </div>
  );
}
