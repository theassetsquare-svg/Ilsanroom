import { useState, useEffect } from 'react';
import { fetchReviews, toggleReviewUpvote, type Review } from '@/lib/review-api';
import { useAuth } from '@/hooks/useAuth';
import ReviewComments from './ReviewComments';
import ReviewForm from './ReviewForm';

interface Props {
  venueId: string;
  venueName: string;
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

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`h-4 w-4 ${s <= rating ? 'text-amber-400' : 'text-neutral-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, onUpvote }: { review: Review; onUpvote: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const nickname = review.is_anonymous ? '익명' : (review.user_profiles?.nickname || '회원');

  return (
    <div className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-400">
            {nickname.charAt(0)}
          </div>
          <div>
            <span className="text-sm font-medium text-neon-text">{nickname}</span>
            {review.visit_date && (
              <span className="ml-2 text-xs text-neon-text-muted">방문: {review.visit_date}</span>
            )}
            <div className="text-xs text-neon-text-muted">{timeAgo(review.created_at)}</div>
          </div>
        </div>
        <StarDisplay rating={review.rating} />
      </div>

      {review.title && (
        <h4 className="mb-2 text-sm font-bold text-neon-text">{review.title}</h4>
      )}
      <p className="text-sm leading-relaxed text-neon-text-muted whitespace-pre-wrap">{review.content}</p>

      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.images.map((url, i) => (
            <img key={i} src={url} alt="" className="h-24 w-24 rounded-lg object-cover border border-neon-border flex-shrink-0" />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onUpvote(review.id)}
          className="inline-flex items-center gap-1 rounded-lg bg-neon-surface-2 px-2.5 py-1 text-xs text-neon-text-muted hover:text-violet-400 transition"
        >
          👍 도움됨 {review.upvote_count}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1 text-xs text-neon-text-muted hover:text-violet-400 transition"
        >
          💬 댓글 {review.reply_count}
        </button>
      </div>

      {showComments && <ReviewComments reviewId={review.id} />}
    </div>
  );
}

export default function ReviewList({ venueId, venueName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const loadReviews = async () => {
    const { data, count } = await fetchReviews(venueId);
    setReviews(data);
    setTotal(count);
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const handleUpvote = async (id: string) => {
    await toggleReviewUpvote(id);
    loadReviews();
  };

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === 'popular') return b.upvote_count - a.upvote_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-neon-text">방문 후기</h2>
          <span className="text-sm text-neon-text-muted">({total}개)</span>
          {reviews.length > 0 && (
            <span className="text-sm font-bold text-amber-400">★ {avgRating}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'latest' | 'popular')}
            className="rounded-lg border border-neon-border bg-neon-bg px-2 py-1 text-xs text-neon-text focus:outline-none"
          >
            <option value="latest">최신순</option>
            <option value="popular">추천순</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition"
          >
            {showForm ? '닫기' : '후기 작성'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-5">
          <ReviewForm
            venueId={venueId}
            venueName={venueName}
            onSuccess={() => { setShowForm(false); loadReviews(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {sorted.map(r => (
          <ReviewCard key={r.id} review={r} onUpvote={handleUpvote} />
        ))}
      </div>

      {reviews.length === 0 && !showForm && (
        <div className="rounded-xl border border-neon-border bg-neon-surface/30 p-8 text-center">
          <p className="mb-2 text-2xl">📝</p>
          <p className="text-sm text-neon-text-muted">아직 후기가 없어요</p>
          <p className="text-xs text-neon-text-muted mt-1">첫 번째 후기를 남겨보세요!</p>
        </div>
      )}
    </div>
  );
}
