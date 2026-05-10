import { useState, useEffect } from 'react';
import { Link } from '../ui/SafeLink';
import OwnerReply from './OwnerReply';
import { fetchReviews, submitReview, type Review } from '@/lib/review-api';
import { useAuth } from '@/hooks/useAuth';

interface ReviewSectionProps {
  venueId: string;
  venueName: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-4 w-4 ${s <= rating ? 'text-amber-400' : 'text-neon-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="cursor-pointer p-1">
          <svg className={`h-7 w-7 transition ${s <= value ? 'text-amber-400' : 'text-neon-text-muted hover:text-amber-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ venueId, venueName }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  // 작성 폼 state
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchReviews(venueId, 30).then(({ data }) => {
      if (alive) { setReviews(data); setLoading(false); }
    });
    return () => { alive = false; };
  }, [venueId]);

  const toggleHelpful = (id: string) => {
    setHelpfulClicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (content.trim().length < 5) {
      setSubmitError('5자 이상 입력해주세요');
      return;
    }
    setSubmitting(true);
    const result = await submitReview({
      venue_id: venueId,
      rating,
      content: content.trim(),
      is_anonymous: isAnonymous,
    });
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    // 성공 — 새로고침
    setContent('');
    setRating(5);
    setIsAnonymous(false);
    const { data } = await fetchReviews(venueId, 30);
    setReviews(data);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-neon-text">리뷰 ({reviews.length})</h2>

      {/* 작성 폼 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-neon-border bg-neon-surface/50 p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: '#111' }}>{venueName} 후기 작성</span>
            <StarInput value={rating} onChange={setRating} />
            <span className="text-xs" style={{ color: '#999' }}>{rating}점</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="다녀온 솔직한 후기를 남겨주세요. (최소 5자)"
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-neon-border bg-neon-bg px-3 py-2 text-sm focus:border-neon-primary focus:outline-none"
            style={{ color: '#111' }}
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs" style={{ color: '#666' }}>
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
              익명으로 작성
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-neon-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#FF2E93' }}
            >
              {submitting ? '게시 중...' : '후기 게시'}
            </button>
          </div>
          {submitError && <p className="mt-2 text-xs" style={{ color: '#DC2626' }}>{submitError}</p>}
        </form>
      ) : (
        <div className="mb-6 rounded-xl border border-neon-border bg-neon-surface/50 p-5 text-center">
          <p className="mb-3 text-sm" style={{ color: '#666' }}>후기 작성은 로그인이 필요합니다.</p>
          <Link
            to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="inline-block rounded-lg px-5 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: '#FF2E93' }}
          >
            카카오 3초 로그인
          </Link>
        </div>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: '#999' }}>로딩 중...</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: '#999' }}>
          아직 후기가 없습니다. 첫 후기를 남겨보세요.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const author = review.is_anonymous
              ? '익명'
              : review.user_profiles?.nickname || '회원';
            const dateStr = new Date(review.created_at).toLocaleDateString('ko-KR');
            return (
              <div key={review.id} className="rounded-xl border border-neon-border bg-neon-surface/50 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-surface-2 text-sm font-bold text-neon-text-muted">
                      {author.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-neon-text-muted">{author}</span>
                      <span className="ml-2 text-xs text-neon-text-muted">{dateStr}</span>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} />
                </div>
                <p className="text-sm leading-relaxed text-neon-text-muted">{review.content}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => toggleHelpful(review.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition ${
                      helpfulClicked.has(review.id)
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-neon-surface-2 text-neon-text-muted hover:text-neon-text-muted'
                    }`}
                  >
                    👍 도움됨 {review.upvote_count + (helpfulClicked.has(review.id) ? 1 : 0)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
