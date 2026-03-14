import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "후기 게시판 - 일산룸포털 커뮤니티",
  description: "실제 방문자들의 솔직한 업소 후기. 클럽, 나이트, 라운지 리뷰를 확인하세요.",
};

const sampleReviews = [
  {
    id: 1,
    title: "강남 클럽 레이스 주말 방문 후기",
    author: "클럽마스터",
    date: "2026-03-13",
    venue: "Club Race",
    region: "강남",
    rating: 4.5,
    likes: 89,
    comments: 23,
    excerpt: "사운드 시스템이 정말 좋았고, DJ 라인업도 만족스러웠습니다. VIP 테이블 서비스도 깔끔하고...",
  },
  {
    id: 2,
    title: "홍대 M2 금요일 밤 솔직 리뷰",
    author: "홍대프로",
    date: "2026-03-12",
    venue: "M2",
    region: "홍대",
    rating: 4.0,
    likes: 67,
    comments: 31,
    excerpt: "음악은 항상 좋은데 주말에는 사람이 너무 많아서 조금 답답할 수 있어요. 평일 추천...",
  },
  {
    id: 3,
    title: "청담 나이트클럽 처음 가봤는데...",
    author: "나이트초보",
    date: "2026-03-12",
    venue: "청담 나이트클럽",
    region: "청담",
    rating: 4.8,
    likes: 145,
    comments: 38,
    excerpt: "분위기가 정말 다르더라고요. 라이브 밴드 퀄리티가 상당하고, 연령대가 좀 있어서 차분하게...",
  },
  {
    id: 4,
    title: "해운대 크림 여름 시즌 미리보기",
    author: "부산나이트",
    date: "2026-03-11",
    venue: "Cream",
    region: "해운대",
    rating: 4.2,
    likes: 56,
    comments: 19,
    excerpt: "테라스에서 보는 오션뷰가 진짜 압도적입니다. 여름 되면 사람 엄청 많아질 듯...",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-neon-gold" : "text-neutral-700"}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm text-neon-text-muted">{rating}</span>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">후기 게시판</h1>
            <p className="mt-2 text-neon-text-muted">실제 방문자들의 솔직한 리뷰</p>
          </div>
          <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
            후기 작성
          </button>
        </div>

        <div className="mb-6 flex gap-3">
          {["전체", "클럽", "나이트", "라운지", "호빠"].map((tab) => (
            <button
              key={tab}
              className="rounded-lg bg-neon-surface px-4 py-2 text-sm text-neon-text-muted transition hover:bg-neon-surface-2 hover:text-neon-text first:bg-neon-primary first:text-neon-text"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {sampleReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-border"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold hover:text-neon-primary-light">
                    {review.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-neon-text-muted">
                    <span>{review.author}</span>
                    <span>·</span>
                    <span>{review.date}</span>
                    <span className="rounded-full bg-neon-primary-light/10 px-2 py-0.5 text-xs text-neon-primary-light">
                      {review.region}
                    </span>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mb-4 text-sm leading-relaxed text-neon-text">
                {review.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-neon-surface-2 px-3 py-1 text-xs text-neon-text-muted">
                  {review.venue}
                </span>
                <div className="flex gap-4 text-xs text-neon-text-muted">
                  <span>♥ {review.likes}</span>
                  <span>💬 {review.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
