import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "팁 & 노하우 - 오늘밤어디 커뮤니티",
  description: "나이트라이프 고수들의 꿀팁과 노하우. 클럽, 나이트, 라운지 이용 팁을 공유합니다.",
};

const sampleTips = [
  {
    id: 1,
    title: "클럽 처음 가는 사람을 위한 완벽 가이드",
    author: "클럽마스터",
    date: "2026-03-10",
    category: "입문",
    likes: 456,
    comments: 89,
    bookmarks: 234,
    excerpt: "클럽 문화가 처음이라면 이 글 하나로 충분합니다. 입장부터 퇴장까지 알아야 할 모든 것을 정리했어요.",
  },
  {
    id: 2,
    title: "VIP 테이블 200% 활용하는 방법",
    author: "VIP단골",
    date: "2026-03-09",
    category: "고급",
    likes: 312,
    comments: 56,
    bookmarks: 189,
    excerpt: "VIP 테이블 예약의 장단점, 가성비 좋은 이용법, 그리고 테이블 매너까지 알려드립니다.",
  },
  {
    id: 3,
    title: "나이트에서 자연스럽게 즐기는 법",
    author: "댄스킹",
    date: "2026-03-08",
    category: "문화",
    likes: 278,
    comments: 43,
    bookmarks: 156,
    excerpt: "처음이라 어색한 분들을 위한 팁. 음악에 몸을 맡기는 법부터 시작해보세요.",
  },
  {
    id: 4,
    title: "지역별 나이트라이프 특징 총정리",
    author: "전국투어",
    date: "2026-03-07",
    category: "정보",
    likes: 523,
    comments: 67,
    bookmarks: 312,
    excerpt: "강남, 홍대, 이태원, 청담, 해운대... 각 지역마다 다른 분위기와 특징을 한눈에 비교해보세요.",
  },
  {
    id: 5,
    title: "택시 & 대리운전 스마트하게 이용하기",
    author: "안전귀가",
    date: "2026-03-06",
    category: "안전",
    likes: 198,
    comments: 34,
    bookmarks: 145,
    excerpt: "새벽 시간 안전하게 귀가하는 방법. 택시 앱 팁부터 대리운전 이용까지.",
  },
];

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          <Link href="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">팁 & 노하우</h1>
          <p className="mt-2 text-neon-text-muted">나이트라이프 고수들의 꿀팁 모음</p>
        </div>

        <div className="mb-6 flex gap-3">
          {["전체", "입문", "고급", "문화", "정보", "안전"].map((tab) => (
            <button
              key={tab}
              className="rounded-lg bg-neon-surface px-4 py-2 text-sm text-neon-text-muted transition hover:bg-neon-surface-2 hover:text-neon-text first:bg-neon-primary first:text-neon-text"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {sampleTips.map((tip) => (
            <div
              key={tip.id}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 transition hover:border-neon-primary/30"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-neon-primary-light/10 px-2.5 py-0.5 text-xs text-neon-primary-light">
                  {tip.category}
                </span>
                <span className="text-xs text-neon-text-muted">{tip.date}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold hover:text-neon-primary-light">
                {tip.title}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-neon-text-muted">
                {tip.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neon-text-muted">{tip.author}</span>
                <div className="flex gap-4 text-xs text-neon-text-muted">
                  <span>♥ {tip.likes}</span>
                  <span>💬 {tip.comments}</span>
                  <span>🔖 {tip.bookmarks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
