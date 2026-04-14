import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

interface ReviewItem {
  id: string;
  title: string;
  author: string;
  date: string;
  venue: string;
  rating: number;
  helpful: number;
  comments: number;
  hasPhoto: boolean;
  excerpt: string;
}

function postToReview(post: Post): ReviewItem {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    date: post.created_at.slice(0, 10),
    venue: post.venue_slug || "",
    rating: post.rating || 0,
    helpful: post.likes,
    comments: post.comment_count || 0,
    hasPhoto: false,
    excerpt: post.content.length > 100 ? post.content.slice(0, 100) + "…" : post.content,
  };
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";
  return (
    <span className={`${cls} tracking-wider`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-neon-gold" : "text-neutral-700"}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  useDocumentMeta('가본 사람만 쓸 수 있다, 실제 방문 후기', '별점과 한 줄 평으로 보는 업소 리얼 리뷰. 광고 아닌 진짜 목소리.');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [sortByHelpful, setSortByHelpful] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writeVenue, setWriteVenue] = useState("");
  const [writeRating, setWriteRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('reviews');
      if (data.length > 0) {
        setReviews(data.map(postToReview));
      }
      setLoading(false);
    })();
  }, []);

  const handleWriteClick = () => {
    if (!user) { window.location.href = '/login'; return; }
    setShowWriteModal(true);
  };

  const handleSubmit = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) return;
    setSubmitting(true);
    const result = await createPost({
      category: 'reviews',
      title: writeTitle,
      content: writeContent,
      venue_slug: writeVenue || undefined,
      rating: writeRating,
    });
    if (result.error) {
      alert('저장 실패: ' + result.error);
    } else {
      alert('후기가 저장되었습니다!');
      setShowWriteModal(false);
      setWriteTitle(""); setWriteContent(""); setWriteVenue(""); setWriteRating(0);
      const { data } = await fetchPosts('reviews');
      if (data.length > 0) setReviews(data.map(postToReview));
    }
    setSubmitting(false);
  };

  let displayed = [...reviews];
  if (starFilter) displayed = displayed.filter((r) => r.rating === starFilter);
  if (photoOnly) displayed = displayed.filter((r) => r.hasPhoto);
  if (sortByHelpful) displayed.sort((a, b) => b.helpful - a.helpful);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <h1 className="text-3xl font-bold">업소후기</h1>
          <p className="mt-2 text-neon-text-muted">직접 다녀온 사람들의 생생한 경험담 모아봤다</p>
        </div>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="mb-8 flex items-center gap-6 rounded-2xl border border-neon-border bg-neon-surface p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-neon-gold">{avgRating}</div>
              <StarDisplay rating={Math.round(Number(avgRating))} size="sm" />
              <div className="mt-1 text-xs text-neon-text-muted">{reviews.length}건</div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-neon-text-muted">{star}점</span>
                    <div className="h-2 flex-1 rounded-full bg-neon-surface-2">
                      <div className="h-2 rounded-full bg-neon-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-neon-text-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${starFilter === s ? "bg-neon-gold/20 text-neon-gold" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}>
                {s}★
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-neon-border" />
          <button onClick={() => setPhotoOnly(!photoOnly)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${photoOnly ? "bg-neon-primary/20 text-neon-primary-light" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}>
            사진 후기만
          </button>
          <button onClick={() => setSortByHelpful(!sortByHelpful)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${sortByHelpful ? "bg-neon-green/20 text-neon-green" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}>
            도움이 됐어요 순
          </button>
          <div className="ml-auto">
            <button onClick={handleWriteClick} className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}>
              후기 남기기
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">불러오는 중...</div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="space-y-4">
            {displayed.map((review) => (
              <button key={review.id} onClick={() => navigate('/community/post/' + review.id)}
                className="w-full text-left rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/30" style={{ minHeight: 48 }}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <StarDisplay rating={review.rating} size="lg" />
                    <h3 className="mt-2 text-lg font-semibold hover:text-neon-primary-light">{review.title}</h3>
                  </div>
                  {review.hasPhoto && (
                    <span className="shrink-0 rounded-lg bg-neon-primary-light/10 px-2.5 py-1 text-xs text-neon-primary-light">사진 포함</span>
                  )}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-neon-text-muted">{review.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neon-text-muted">
                    {review.venue && <span className="rounded-lg bg-neon-surface-2 px-3 py-1">{review.venue}</span>}
                    <span>{review.author}</span>
                    <span>{review.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neon-green">👍 {review.helpful}</span>
                    <span className="text-xs text-neon-text-muted">💬 {review.comments}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            아직 후기가 없습니다. 첫 번째 후기를 남겨보세요!
          </div>
        )}

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button onClick={() => setShowWriteModal(false)} className="text-sm font-medium" style={{ color: '#555', minHeight: 44 }}>취소</button>
              <h2 className="text-base font-bold" style={{ color: '#111' }}>후기 작성</h2>
              <div style={{ width: 44 }} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-2xl mx-auto w-full">
              <div className="mb-3">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>별점</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setWriteRating(s)} className="text-3xl" style={{ color: s <= writeRating ? '#B45309' : '#D1D5DB', minHeight: 44 }}>★</button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>업소명 (선택)</label>
                <input value={writeVenue} onChange={(e) => setWriteVenue(e.target.value)} placeholder="업소명"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>제목</label>
                <input value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="제목을 입력하세요"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 48 }} />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs" style={{ color: '#555' }}>내용</label>
                <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="솔직한 후기를 작성해주세요"
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#111', minHeight: '50vh', lineHeight: '1.8' }} />
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                className="w-full rounded-xl py-4 text-base font-bold transition active:scale-[0.98] disabled:opacity-30"
                style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 56 }}>
                {submitting ? "등록 중..." : "후기 저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
