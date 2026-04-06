import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, fetchComments, createComment, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';

const sampleReviews = [
  {
    id: "sample-1",
    title: "라페스타 라운지 — 분위기 최고였어요",
    author: "해당 지역 단골",
    date: "2026-03-18",
    venue: "라페스타 라운지",
    region: "일산",
    rating: 5,
    helpful: 47,
    comments: 14,
    hasPhoto: true,
    excerpt: "인테리어가 최근 리뉴얼 되었더라고요. 조명 세팅이 은은하면서도 세련됐고, 칵테일 퀄리티도 기대 이상이었습니다.",
  },
  {
    id: "sample-2",
    title: "킨텍스 근처 나이트 솔직 체험담",
    author: "야행성직장인",
    date: "2026-03-17",
    venue: "킨텍스 나이트",
    region: "해당 업소",
    rating: 3,
    helpful: 31,
    comments: 22,
    hasPhoto: false,
    excerpt: "사운드 장비는 괜찮은데, 환기 시스템이 아쉬웠어요. 여름에는 좀 더울 수 있을 것 같습니다.",
  },
  {
    id: "sample-3",
    title: "백석동 신규 오픈한 바 — 기대보다 훨씬 나았습니다",
    author: "맛집헌터",
    date: "2026-03-16",
    venue: "백석 프라이빗바",
    region: "해당 지역",
    rating: 4,
    helpful: 63,
    comments: 9,
    hasPhoto: true,
    excerpt: "프라이빗 룸이 있어서 소규모 모임에 딱이에요. 안주 메뉴가 다양하고 가성비도 나쁘지 않았습니다.",
  },
  {
    id: "sample-4",
    title: "주엽역 와인바 재방문 — 여전히 좋네요",
    author: "와인매니아",
    date: "2026-03-14",
    venue: "주엽 와인라운지",
    region: "일산",
    rating: 4,
    helpful: 28,
    comments: 7,
    hasPhoto: true,
    excerpt: "셀렉션이 넓어졌고 소믈리에 추천도 적극적이라 와인 입문자도 편하게 즐길 수 있는 공간입니다.",
  },
  {
    id: "sample-5",
    title: "탄현 쪽 요정 방문 — 전통 있는 곳",
    author: "전통탐방",
    date: "2026-03-12",
    venue: "탄현 요정",
    region: "일산",
    rating: 4,
    helpful: 55,
    comments: 18,
    hasPhoto: false,
    excerpt: "접대 매너와 한정식 퀄리티 모두 수준급이었습니다. 비용이 좀 있지만 중요한 자리에 딱 맞는 장소예요.",
  },
];

function postToReview(post: Post) {
  return {
    id: post.id,
    title: post.title,
    author: post.users?.nickname || "익명",
    date: post.created_at.slice(0, 10),
    venue: post.venue_slug || "",
    region: "",
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
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [sortByHelpful, setSortByHelpful] = useState(false);
  const [reviews, setReviews] = useState(sampleReviews);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writeVenue, setWriteVenue] = useState("");
  const [writeRating, setWriteRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchPosts('reviews');
      if (data.length > 0) {
        setReviews(data.map(postToReview));
      }
      // If empty, keep sampleReviews as fallback
      setLoading(false);
    })();
  }, []);

  const [viewingReview, setViewingReview] = useState<typeof sampleReviews[0] | null>(null);
  const [reviewComments, setReviewComments] = useState<{ id: string; author: string; text: string; date: string; isMine: boolean }[]>([]);
  const [commentText, setCommentText] = useState('');

  const openReview = (review: typeof sampleReviews[0]) => {
    setViewingReview(review);
    setCommentText('');
    const dummyComments = [
      { id: 'dc1', author: '단골손님', text: '동의합니다 분위기 좋았어요', date: '03-20', isMine: false },
      { id: 'dc2', author: '첫방문', text: '참고할게요 감사합니다!', date: '03-19', isMine: false },
    ];
    setReviewComments(dummyComments);
    fetchComments(review.id).then(data => {
      if (data.length > 0) {
        setReviewComments(data.map(c => ({
          id: c.id,
          author: c.users?.nickname || '익명',
          text: c.content,
          date: c.created_at.slice(5, 10),
          isMine: c.user_id === user?.id,
        })));
      }
    });
  };

  const submitReviewComment = async () => {
    if (!commentText.trim() || !user || !viewingReview) return;
    const { data } = await createComment(viewingReview.id, commentText.trim());
    if (data) {
      setReviewComments(prev => [...prev, { id: data.id || `local-${Date.now()}`, author: user.user_metadata?.name || '나', text: commentText.trim(), date: new Date().toISOString().slice(5, 10), isMine: true }]);
      setCommentText('');
    }
  };

  const deleteComment = (commentId: string) => {
    setReviewComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleWriteClick = () => {
    if (!user) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
      return;
    }
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
    if (!result.error) {
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteContent("");
      setWriteVenue("");
      setWriteRating(5);
      // Refresh posts
      const { data } = await fetchPosts('reviews');
      if (data.length > 0) {
        setReviews(data.map(postToReview));
      }
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
        {/* Header */}
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">업소후기</h1>
          <p className="mt-2 text-neon-text-muted">
            직접 다녀온 사람들의 생생한 경험담 모아봤다
          </p>
        </div>

        {/* Auth Error Toast */}
        {authError && (
          <div className="mb-4 rounded-xl border border-neon-red/30 bg-neon-red/10 px-5 py-3 text-sm text-neon-red">
            로그인이 필요합니다
          </div>
        )}

        {/* Rating Summary */}
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Star filter */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  starFilter === s
                    ? "bg-neon-gold/20 text-neon-gold"
                    : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
                }`}
              >
                {s}★
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-neon-border" />

          {/* Photo toggle */}
          <button
            onClick={() => setPhotoOnly(!photoOnly)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              photoOnly
                ? "bg-neon-primary/20 text-neon-primary-light"
                : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
            }`}
          >
            사진 후기만
          </button>

          {/* Helpful sort */}
          <button
            onClick={() => setSortByHelpful(!sortByHelpful)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              sortByHelpful
                ? "bg-neon-green/20 text-neon-green"
                : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
            }`}
          >
            도움이 됐어요 순
          </button>

          <div className="ml-auto">
            <button
              onClick={handleWriteClick}
              className="rounded-xl px-5 py-2.5 text-sm font-bold transition"
              style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 44 }}
            >
              후기 남기기
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            불러오는 중...
          </div>
        )}

        {/* Review Cards */}
        {!loading && (
          <div className="space-y-4">
            {displayed.map((review) => (
              <button
                key={review.id}
                onClick={() => openReview(review)}
                className="w-full text-left rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/30"
                style={{ minHeight: 48 }}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <StarDisplay rating={review.rating} size="lg" />
                    <h3 className="mt-2 text-lg font-semibold hover:text-neon-primary-light">
                      {review.title}
                    </h3>
                  </div>
                  {review.hasPhoto && (
                    <span className="shrink-0 rounded-lg bg-neon-primary-light/10 px-2.5 py-1 text-xs text-neon-primary-light">
                      사진 포함
                    </span>
                  )}
                </div>

                <p className="mb-4 text-sm leading-relaxed text-neon-text-muted">
                  {review.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neon-text-muted">
                    {review.venue && <span className="rounded-lg bg-neon-surface-2 px-3 py-1">{review.venue}</span>}
                    <span>{review.author}</span>
                    <span>{review.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 rounded-lg bg-neon-green/10 px-3 py-1.5 text-xs text-neon-green transition hover:bg-neon-green/20">
                      <span>👍</span> 도움이 됐어요 {review.helpful}
                    </button>
                    <span className="text-xs text-neon-text-muted">💬 {review.comments}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            해당 조건에 맞는 후기가 없습니다
          </div>
        )}

        {/* Write Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowWriteModal(false)}>
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />
            <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', color: '#111' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#111' }}>후기 남기기</h2>
                <button onClick={() => setShowWriteModal(false)} style={{ minWidth: 44, minHeight: 44, color: '#555' }}>✕</button>
              </div>
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
                <textarea value={writeContent} onChange={(e) => setWriteContent(e.target.value)} placeholder="솔직한 후기를 작성해주세요" rows={6}
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#111' }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowWriteModal(false)} className="flex-1 rounded-xl py-3 text-sm font-medium" style={{ backgroundColor: '#F3F4F6', color: '#555', minHeight: 48 }}>취소</button>
                <button onClick={handleSubmit} disabled={submitting || !writeTitle.trim() || !writeContent.trim()}
                  className="flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-40" style={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', minHeight: 48 }}>
                  {submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Detail + Comments Modal */}
        {viewingReview && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setViewingReview(null)}>
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', color: '#111' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <StarDisplay rating={viewingReview.rating} size="lg" />
                <button onClick={() => setViewingReview(null)} style={{ minWidth: 44, minHeight: 44, color: '#555' }}>✕</button>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#111' }}>{viewingReview.title}</h2>
              <div className="flex items-center gap-2 text-xs mb-4" style={{ color: '#999' }}>
                <span style={{ color: '#555' }}>{viewingReview.author}</span>
                <span>·</span>
                <span>{viewingReview.date}</span>
                {viewingReview.venue && <><span>·</span><span style={{ color: '#8B5CF6' }}>{viewingReview.venue}</span></>}
              </div>
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F9FAFB' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#333' }}>{viewingReview.excerpt}</p>
              </div>

              {/* 댓글 */}
              <div className="pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-sm font-bold mb-3" style={{ color: '#111' }}>💬 댓글 {reviewComments.length}개</p>
                <div className="space-y-2 mb-4">
                  {reviewComments.map((c) => (
                    <div key={c.id} className="rounded-lg px-3 py-2 flex items-start justify-between" style={{ backgroundColor: c.isMine ? '#F3F0FF' : '#F3F4F6' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: '#111' }}>{c.text}</p>
                        <span className="text-xs" style={{ color: '#999' }}>{c.author} · {c.date}</span>
                      </div>
                      {c.isMine && (
                        <button onClick={() => deleteComment(c.id)} className="shrink-0 ml-2 text-xs" style={{ color: '#EF4444', minHeight: 32 }}>삭제</button>
                      )}
                    </div>
                  ))}
                  {reviewComments.length === 0 && <p className="text-xs" style={{ color: '#999' }}>아직 댓글이 없어요</p>}
                </div>

                {user ? (
                  <div className="flex gap-2">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitReviewComment(); }}
                      placeholder="댓글을 입력하세요..." className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111', minHeight: 44 }} />
                    <button onClick={submitReviewComment} disabled={!commentText.trim()}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                      style={{ backgroundColor: '#8B5CF6', minHeight: 44 }}>등록</button>
                  </div>
                ) : (
                  <Link to="/login" className="block text-center text-sm font-medium py-2" style={{ color: '#8B5CF6' }}>로그인하고 댓글 달기</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
