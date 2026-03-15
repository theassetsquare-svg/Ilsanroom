import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "자유게시판 - 오늘밤어디 커뮤니티",
  description: "나이트라이프에 관한 자유로운 이야기. 일상, 정보 공유, 잡담까지 편하게 소통하세요.",
};

const samplePosts = [
  { id: 1, title: "오늘 강남 클럽 분위기 어떤가요?", author: "파티러버", date: "2026-03-13", views: 342, likes: 28, comments: 15 },
  { id: 2, title: "주말마다 클럽 가는 사람 저만 그런가요 ㅋㅋ", author: "위켄드홀릭", date: "2026-03-13", views: 567, likes: 89, comments: 34 },
  { id: 3, title: "나이트라이프 입문 3개월차 소감", author: "뉴비탈출", date: "2026-03-12", views: 891, likes: 156, comments: 42 },
  { id: 4, title: "해운대 여름 시즌 시작되면 어디가 제일 좋나요", author: "부산사람", date: "2026-03-12", views: 234, likes: 45, comments: 23 },
  { id: 5, title: "혼자 클럽 가본 사람 있나요? 후기 공유", author: "솔로댄서", date: "2026-03-11", views: 1203, likes: 234, comments: 78 },
  { id: 6, title: "요즘 홍대 트렌드가 바뀐 것 같아요", author: "홍대매니아", date: "2026-03-11", views: 456, likes: 67, comments: 29 },
  { id: 7, title: "클럽 음악 장르별 추천 부탁드립니다", author: "뮤직러버", date: "2026-03-10", views: 678, likes: 98, comments: 51 },
  { id: 8, title: "이태원 vs 청담 라운지 고민 중", author: "라운지탐험가", date: "2026-03-10", views: 345, likes: 34, comments: 18 },
];

export default function FreeBoardPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
              ← 커뮤니티
            </Link>
            <h1 className="text-3xl font-bold">자유게시판</h1>
            <p className="mt-2 text-neon-text-muted">자유롭게 이야기 나누는 공간</p>
          </div>
          <button className="rounded-xl bg-neon-primary px-5 py-2.5 text-sm font-medium transition hover:bg-neon-primary-light">
            글쓰기
          </button>
        </div>

        <div className="mb-6 flex gap-3">
          {["전체", "인기", "최신", "댓글많은"].map((tab) => (
            <button
              key={tab}
              className="rounded-lg bg-neon-surface px-4 py-2 text-sm text-neon-text-muted transition hover:bg-neon-surface-2 hover:text-neon-text first:bg-neon-primary first:text-neon-text"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-neon-border">
          {samplePosts.map((post, i) => (
            <div
              key={post.id}
              className={`flex items-center justify-between px-5 py-4 transition hover:bg-neon-surface ${
                i !== samplePosts.length - 1 ? "border-b border-neon-border" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium hover:text-neon-primary-light">
                  {post.title}
                  {post.comments > 30 && (
                    <span className="ml-2 text-xs text-neon-primary-light">[{post.comments}]</span>
                  )}
                </h3>
                <div className="mt-1 flex gap-3 text-xs text-neon-text-muted">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-neon-text-muted">
                <span>👁 {post.views}</span>
                <span>♥ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition ${
                page === 1
                  ? "bg-neon-primary text-neon-text"
                  : "bg-neon-surface text-neon-text-muted hover:bg-neon-surface-2"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
