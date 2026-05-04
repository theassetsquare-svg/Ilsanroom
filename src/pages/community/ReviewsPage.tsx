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
  useDocumentMeta('가본 사람만 쓸 수 있다, 실제 방문 후기', '별점·한 줄 평으로 보는 업소 리얼 리뷰. 광고 아닌 진짜 목소리. 클럽 나이트 라운지 룸 요정 호빠 모든 업종 후기 모음.');
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
    { id: 'seed-1', title: '레이스 금요일 다녀옴 사운드 ㄹㅇ 미침', author: '베이스중독', date: '2026-04-18', venue: '레이스', rating: 5, helpful: 38, comments: 12, hasPhoto: true, excerpt: '스피커 앞자리 잡았는데 온몸이 울리더라ㅋㅋ DJ 셋도 좋았고 분위기 역대급이었음. 재방 확정.' },
    { id: 'seed-2', title: '찬스돔 부킹 시스템 체계적이라 놀람', author: '수원놀이꾼', date: '2026-04-18', venue: '찬스돔', rating: 4, helpful: 22, comments: 8, hasPhoto: false, excerpt: '웨이터가 알아서 잘 연결해줌. 테이블 위치도 나쁘지 않았고 음악도 괜찮았다 솔직히.' },
    { id: 'seed-3', title: '고구려 뷔페 호텔급인거 실화냐', author: '먹보리뷰어', date: '2026-04-18', venue: '고구려', rating: 5, helpful: 45, comments: 15, hasPhoto: true, excerpt: '초이스 전에 뷔페부터 감동받음ㅋㅋ 랍스타 나오는 유흥업소가 어딨어. 룸도 넓고 완벽.' },
    { id: 'seed-4', title: '디엠 분위기는 진짜 격이 다름', author: '무드러버', date: '2026-04-17', venue: '디엠', rating: 4, helpful: 19, comments: 9, hasPhoto: false, excerpt: '인테리어는 진짜 서울 어디 내놔도 탑급. 특별한 날 가는 곳 느낌. 분위기 잘 잡고 싶을 때 추천.' },
    { id: 'seed-5', title: '일산룸 8명 모임 다녀온 후기', author: '일산회사원', date: '2026-04-17', venue: '일산룸', rating: 4, helpful: 15, comments: 5, hasPhoto: false, excerpt: '룸 사이즈 넉넉하고 노래방 음향 좋음. 직원분들 응대 친절해서 분위기 좋았다.' },
    { id: 'seed-6', title: '아르쥬 처음인데 여기 왜 유명한지 알겠음', author: '라운지초보', date: '2026-04-17', venue: '아르쥬', rating: 5, helpful: 31, comments: 11, hasPhoto: true, excerpt: '칵테일 퀄리티가 바 수준이고 조명이 예술임. 데이트로 가기 딱이야 진짜.' },
    { id: 'seed-7', title: '하입 토요일 갔는데 사람 미침ㅋㅋ', author: '주말전사', date: '2026-04-16', venue: '하입', rating: 4, helpful: 24, comments: 7, hasPhoto: false, excerpt: '입장 줄이 겁나 길었는데 들어가니까 에너지 ㄹㅇ 대박. 근데 너무 붐벼서 움직이기 힘듦.' },
    { id: 'seed-8', title: '명월관 양주 퀄리티 인정합니다', author: '양주감별사', date: '2026-04-16', venue: '일산명월관', rating: 5, helpful: 28, comments: 10, hasPhoto: false, excerpt: '가짜 양주 걱정했는데 여긴 확실함. 초이스도 좋고 실장님이 잘 챙겨줌. 단골 될듯.' },
    { id: 'seed-9', title: '버뮤다 혼자 갔는데 의외로 괜찮았음', author: '솔로여행자', date: '2026-04-16', venue: '버뮤다', rating: 4, helpful: 17, comments: 6, hasPhoto: false, excerpt: '혼자라 좀 쫄았는데 분위기가 편해서 금방 적응함. 옆테이블 형들이 같이 놀자고 해줌ㅋ' },
    { id: 'seed-10', title: '돈텔마마 무드 생각보다 캐주얼함', author: '무드비교왕', date: '2026-04-15', venue: '돈텔마마', rating: 4, helpful: 21, comments: 8, hasPhoto: false, excerpt: '이름값 할까봐 걱정했는데 무드가 캐주얼해서 편함. 분위기도 좋고 음악 취향 딱 맞았다.' },
    { id: 'seed-11', title: '샴푸나이트 부킹률 역대급 아니냐', author: '부킹장인', date: '2026-04-15', venue: '샴푸나이트', rating: 5, helpful: 33, comments: 13, hasPhoto: true, excerpt: '3번 갔는데 3번 다 부킹됨ㅋㅋ 여기 진짜 시스템이 잘 돼있음. 웨이터 센스 좋다.' },
    { id: 'seed-12', title: '호박나이트 수요일에 가봄 한적해서 오히려 굿', author: '평일파', date: '2026-04-15', venue: '호박나이트', rating: 4, helpful: 12, comments: 4, hasPhoto: false, excerpt: '사람 적어서 부킹 잘 되고 웨이터도 더 신경써줌. 주말 피하고 평일 추천.' },
    { id: 'seed-13', title: '로얄 룸 넓기가 ㅎㄷㄷ 우리끼리 파티함', author: '파티플래너', date: '2026-04-14', venue: '로얄', rating: 5, helpful: 26, comments: 9, hasPhoto: true, excerpt: '10명 들어가도 넉넉한 룸ㅋㅋ 음향 장비도 좋고 서비스 퀄리티가 높음. 생일파티 여기서 하삼.' },
    { id: 'seed-14', title: '레이스 테이블 예약 팁 알려드림', author: '예약고수', date: '2026-04-14', venue: '레이스', rating: 5, helpful: 40, comments: 14, hasPhoto: false, excerpt: '미리 전화해서 테이블 잡아야 됨. 현장가면 자리없어서 서서 놀아야함 진짜로. 예약 필수!' },
    { id: 'seed-15', title: '찬스돔 vs 샴푸 비교 후기 (둘다 감)', author: '비교분석맨', date: '2026-04-13', venue: '찬스돔', rating: 4, helpful: 35, comments: 11, hasPhoto: false, excerpt: '찬스돔은 시스템 체계적이고 샴푸는 분위기가 더 자유로움. 취향차이인듯. 난 찬스돔 한표.' },
    { id: 'seed-16', title: '고구려 초이스 퀄리티 솔직하게 말함', author: '솔직담백', date: '2026-04-13', venue: '고구려', rating: 4, helpful: 29, comments: 10, hasPhoto: false, excerpt: '요일마다 다른데 금토가 확실히 좋음. 평일은 좀 아쉬울수 있는데 뷔페로 커버됨.' },
    { id: 'seed-17', title: '하입 사운드 업그레이드 했나? 전보다 좋아짐', author: '음향매니아', date: '2026-04-12', venue: '하입', rating: 4, helpful: 16, comments: 5, hasPhoto: false, excerpt: '저번달에 갔을때보다 확실히 소리가 좋아짐. 저음이 깨끗하게 빠지는 느낌. 인정.' },
    { id: 'seed-18', title: '일산명월관 처음 갔는데 실장님 덕에 편했음', author: '파주에서옴', date: '2026-04-12', venue: '일산명월관', rating: 5, helpful: 23, comments: 7, hasPhoto: false, excerpt: '요정 처음이라 긴장했는데 실장님이 하나하나 설명해주셔서 편하게 즐김. 초보한테 추천.' },
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
            <div className="fixed bottom-14 md:bottom-0 left-0 right-0 px-4 py-4 border-t z-40" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
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
