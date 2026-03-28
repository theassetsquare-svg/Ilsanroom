import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const sampleReviews = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
  useDocumentMeta('업소 솔직 후기 게시판 | 놀쿨', '직접 가본 사람들의 솔직한 후기와 별점.');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [sortByHelpful, setSortByHelpful] = useState(false);

  let displayed = [...sampleReviews];
  if (starFilter) displayed = displayed.filter((r) => r.rating === starFilter);
  if (photoOnly) displayed = displayed.filter((r) => r.hasPhoto);
  if (sortByHelpful) displayed.sort((a, b) => b.helpful - a.helpful);

  const avgRating = (sampleReviews.reduce((sum, r) => sum + r.rating, 0) / sampleReviews.length).toFixed(1);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">방문 후기 모아보기</h1>
          <p className="mt-2 text-neon-text-muted">
            직접 다녀온 사람들의 생생한 경험담 모아봤다
          </p>
        </div>

        {/* Rating Summary */}
        <div className="mb-8 flex items-center gap-6 rounded-2xl border border-neon-border bg-neon-surface p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-neon-gold">{avgRating}</div>
            <StarDisplay rating={Math.round(Number(avgRating))} size="sm" />
            <div className="mt-1 text-xs text-neon-text-muted">{sampleReviews.length}건</div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = sampleReviews.filter((r) => r.rating === star).length;
              const pct = Math.round((count / sampleReviews.length) * 100);
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
            <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
              후기 남기기
            </button>
          </div>
        </div>

        {/* Review Cards */}
        <div className="space-y-4">
          {displayed.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/30"
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
                  <span className="rounded-lg bg-neon-surface-2 px-3 py-1">{review.venue}</span>
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
            </div>
          ))}
        </div>

        {displayed.length === 0 && (
          <div className="rounded-2xl border border-neon-border bg-neon-surface p-12 text-center text-neon-text-muted">
            해당 조건에 맞는 후기가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
