import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fetchPosts, createPost, type Post } from '@/lib/community-api';
import { useAuth } from '@/hooks/useAuth';
import { PageLiveCounter } from '@/components/ui/LiveStats';
import { PostListSkeleton } from '@/components/ui/Skeleton';

const RichTextEditor = lazy(() => import('@/components/community/RichTextEditor'));
import WriteHeader from '@/components/community/WriteHeader';

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
      setSubmitting(false);
      return;
    } else {
      setShowWriteModal(false);
      setWriteTitle(""); setWriteContent(""); setWriteVenue(""); setWriteRating(0);
      const { data } = await fetchPosts('reviews');
      if (data.length > 0) setReviews(data.map(postToReview));
    }
    setSubmitting(false);
  };

  // 시드 글 (DB 비어있을 때 사이트가 살아보이게)
  const seedPosts: ReviewItem[] = [
    { id: 'seed-1', title: '강남클럽 레이스 솔직 후기', author: '강남올빼미', date: '2026-04-18', venue: '레이스', rating: 5, helpful: 27, comments: 9, hasPhoto: false, excerpt: '금요일 밤에 갔는데 사운드 진짜 미쳤음. DJ 라인업도 좋고 테이블 위치도 괜찮았다. 재방문 의사 100%.' },
    { id: 'seed-2', title: '수원나이트 찬스돔 처음 가봄', author: '수원첫방문', date: '2026-04-18', venue: '찬스돔', rating: 4, helpful: 18, comments: 6, hasPhoto: false, excerpt: '부킹 시스템이 생각보다 체계적이라 놀랐음. 웨이터가 친절해서 분위기 좋았다.' },
    { id: 'seed-3', title: '해운대고구려 뷔페 레벨이...', author: '부산밤손님', date: '2026-04-17', venue: '고구려', rating: 5, helpful: 34, comments: 12, hasPhoto: true, excerpt: '여기 뷔페 수준이 호텔급임 진심. 룸도 넓고 초이스도 괜찮고. 부산 가면 무조건 여기.' },
    { id: 'seed-4', title: '라운지 디엠 분위기 좋은데 가격이', author: '디엠단골', date: '2026-04-17', venue: '디엠', rating: 3, helpful: 15, comments: 8, hasPhoto: false, excerpt: '인테리어 분위기는 서울 탑급인데 주대가 좀 쎈 편. 특별한 날에 가기엔 좋다.' },
    { id: 'seed-5', title: '일산룸 단체 회식으로 갔는데', author: '일산직장인', date: '2026-04-16', venue: '', rating: 4, helpful: 11, comments: 5, hasPhoto: false, excerpt: '8명이서 갔는데 룸 사이즈 딱 좋았음. 음향도 괜찮고 직원분들 서비스 좋았다.' },
  ];
  const displayReviews = reviews.length > 0 ? reviews : seedPosts;

  let displayed = [...displayReviews];
  if (starFilter) displayed = displayed.filter((r) => r.rating === starFilter);
  if (photoOnly) displayed = displayed.filter((r) => r.hasPhoto);
  if (sortByHelpful) displayed.sort((a, b) => b.helpful - a.helpful);

  const avgRating = displayReviews.length > 0
    ? (displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length).toFixed(1)
    : "0.0";

  // 인기 후기 TOP 3
  const hotReviews = [...displayReviews].sort((a, b) => (b.helpful + b.comments * 2) - (a.helpful + a.comments * 2)).slice(0, 3);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="mb-6">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">← 커뮤니티</Link>
          <h1 className="text-3xl font-bold">업소후기</h1>
          <p className="mt-2 text-sm font-bold" style={{ color: '#8B5CF6' }}>
            "광고글 아님. 직접 가본 사람들이 쓴 리얼 후기만 모았다."
          </p>
          <div className="mt-2"><PageLiveCounter pageName="후기 읽는 중" baseCount={28} /></div>
        </div>

        {/* 인기 후기 하이라이트 */}
        {!loading && hotReviews.length > 0 && (
          <div className="mb-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🔥</span>
              <h2 className="text-sm font-black" style={{ color: '#111' }}>지금 뜨는 후기</h2>
            </div>
            <div className="space-y-2">
              {hotReviews.map((r, idx) => (
                <button key={r.id} onClick={() => !r.id.startsWith('seed-') && navigate('/community/post/' + r.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white"
                  style={{ minHeight: 44 }}>
                  <span className="text-sm font-black shrink-0" style={{ color: idx === 0 ? '#EF4444' : '#F59E0B', width: 20 }}>{idx + 1}</span>
                  <StarDisplay rating={r.rating} size="sm" />
                  <span className="text-sm font-medium truncate flex-1" style={{ color: '#111' }}>{r.title}</span>
                  <span className="text-xs shrink-0" style={{ color: '#999' }}>👍{r.helpful}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rating Summary */}
        {displayReviews.length > 0 && (
          <div className="mb-8 flex items-center gap-6 rounded-2xl border border-neon-border bg-neon-surface p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-neon-gold">{avgRating}</div>
              <StarDisplay rating={Math.round(Number(avgRating))} size="sm" />
              <div className="mt-1 text-xs text-neon-text-muted">{displayReviews.length}건</div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = displayReviews.filter((r) => r.rating === star).length;
                const pct = displayReviews.length > 0 ? Math.round((count / displayReviews.length) * 100) : 0;
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
                className={`rounded-lg px-3 py-1.5 text-sm transition ${starFilter === s ? "bg-neon-gold/20 text-neon-gold" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}
                style={{ minHeight: 36 }}>
                {s}★
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-neon-border" />
          <button onClick={() => setPhotoOnly(!photoOnly)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${photoOnly ? "bg-neon-primary/20 text-neon-primary-light" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}
            style={{ minHeight: 36 }}>
            사진 후기만
          </button>
          <button onClick={() => setSortByHelpful(!sortByHelpful)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${sortByHelpful ? "bg-neon-green/20 text-neon-green" : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"}`}
            style={{ minHeight: 36 }}>
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
          <PostListSkeleton />
        )}

        {!loading && displayed.length > 0 && (
          <div className="space-y-4">
            {displayed.map((review) => (
              <button key={review.id} onClick={() => !review.id.startsWith('seed-') && navigate('/community/post/' + review.id)}
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

        {!loading && displayed.length === 0 && starFilter && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            해당 별점의 후기가 없습니다. 다른 별점을 선택해보세요!
          </div>
        )}

        {/* 다른 게시판 순환 */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <span className="shrink-0 text-xs" style={{ color: '#999' }}>다른 게시판</span>
          {[
            { label: '💬 자유', href: '/community/free' },
            { label: '🗺️ 오늘어디', href: '/community/qna' },
            { label: '🧩 조각모임', href: '/community/jogak' },
            { label: '💡 꿀팁', href: '/community/tips' },
            { label: '👗 패션', href: '/community/fashion' },
            { label: '🎉 파티', href: '/community/party' },
          ].map(b => (
            <Link key={b.label} to={b.href} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-[#8B5CF6]/40 whitespace-nowrap"
              style={{ borderColor: '#E5E7EB', color: '#555' }}>
              {b.label}
            </Link>
          ))}
        </div>

        {showWriteModal && (
          <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
            <WriteHeader onCancel={() => setShowWriteModal(false)} title="후기 작성" />
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
                <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: '#999' }}>에디터 로딩 중...</div>}>
                  <RichTextEditor value={writeContent} onChange={setWriteContent} placeholder="솔직한 후기를 작성해주세요. 사진/동영상 첨부 가능!" minHeight={300} />
                </Suspense>
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
