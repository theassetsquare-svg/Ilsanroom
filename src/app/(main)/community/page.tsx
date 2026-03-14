import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 - NEON 나이트라이프",
  description: "나이트라이프를 즐기는 사람들의 커뮤니티. 자유게시판, 후기, 파티 모집, 팁, 패션 가이드, Q&A까지.",
};

const sections = [
  {
    title: "자유게시판",
    description: "자유롭게 이야기 나누는 공간",
    href: "/community/free",
    icon: "💬",
    count: 1284,
  },
  {
    title: "후기 게시판",
    description: "업소 방문 후기와 솔직한 리뷰",
    href: "/community/reviews",
    icon: "⭐",
    count: 892,
  },
  {
    title: "파티 모집",
    description: "함께 갈 파티 멤버를 찾아보세요",
    href: "/community/party",
    icon: "🎉",
    count: 346,
  },
  {
    title: "팁 & 노하우",
    description: "나이트라이프 고수들의 꿀팁",
    href: "/community/tips",
    icon: "💡",
    count: 567,
  },
  {
    title: "패션 가이드",
    description: "드레스코드와 스타일링 정보",
    href: "/community/fashion",
    icon: "👔",
    count: 231,
  },
  {
    title: "Q&A",
    description: "궁금한 점을 질문하고 답변받기",
    href: "/community/qna",
    icon: "❓",
    count: 478,
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            <span className="text-violet-400">NEON</span> 커뮤니티
          </h1>
          <p className="text-lg text-neutral-400">
            나이트라이프를 사랑하는 사람들의 소통 공간
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-violet-500/50 hover:bg-neutral-900/80"
            >
              <div className="mb-4 text-4xl">{section.icon}</div>
              <h2 className="mb-2 text-xl font-semibold group-hover:text-violet-400">
                {section.title}
              </h2>
              <p className="mb-4 text-sm text-neutral-400">
                {section.description}
              </p>
              <div className="text-xs text-neutral-500">
                게시글 <span className="text-violet-400 font-medium">{section.count.toLocaleString()}</span>개
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-6 text-2xl font-bold">최근 인기글</h2>
          <div className="space-y-4">
            {[
              { title: "강남 클럽 첫 방문 후기 (초보자 시점)", category: "후기", likes: 234, comments: 45 },
              { title: "홍대 vs 강남 클럽 비교 정리해봤습니다", category: "자유", likes: 189, comments: 67 },
              { title: "이번 주말 이태원 파티 같이 가실 분?", category: "파티모집", likes: 156, comments: 32 },
              { title: "나이트 드레스코드 완벽 가이드 2026", category: "패션", likes: 312, comments: 28 },
              { title: "해운대 여름 클럽 시즌 정보 공유", category: "팁", likes: 198, comments: 41 },
            ].map((post, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-5 py-4 transition hover:border-neutral-700"
              >
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
                    {post.category}
                  </span>
                  <span className="text-sm font-medium">{post.title}</span>
                </div>
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span>♥ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
