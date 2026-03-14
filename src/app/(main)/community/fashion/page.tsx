import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "패션 가이드 - NEON 커뮤니티",
  description: "나이트라이프 드레스코드와 스타일링 가이드. 클럽, 나이트, 라운지에 맞는 패션 정보.",
};

const fashionGuides = [
  {
    id: 1,
    title: "클럽별 드레스코드 완벽 정리 2026",
    author: "패션에디터",
    date: "2026-03-12",
    category: "드레스코드",
    likes: 567,
    comments: 78,
    tags: ["클럽", "드레스코드", "기본"],
  },
  {
    id: 2,
    title: "라운지 데이트룩 스타일링 제안",
    author: "스타일리스트K",
    date: "2026-03-11",
    category: "스타일링",
    likes: 423,
    comments: 56,
    tags: ["라운지", "데이트", "셋업"],
  },
  {
    id: 3,
    title: "여름 클럽 패션 - 시원하면서 멋지게",
    author: "썸머파티",
    date: "2026-03-10",
    category: "시즌",
    likes: 345,
    comments: 41,
    tags: ["여름", "클럽", "캐주얼"],
  },
  {
    id: 4,
    title: "나이트 정장 스타일 가이드 (남성편)",
    author: "댄디맨",
    date: "2026-03-09",
    category: "남성",
    likes: 289,
    comments: 34,
    tags: ["나이트", "정장", "남성"],
  },
  {
    id: 5,
    title: "클럽 메이크업 & 액세서리 추천 (여성편)",
    author: "글로우업",
    date: "2026-03-08",
    category: "여성",
    likes: 512,
    comments: 92,
    tags: ["클럽", "메이크업", "여성"],
  },
];

const dressCodeGuide = [
  { venue: "클럽", level: "스마트 캐주얼", description: "깔끔한 셔츠 + 슬랙스 또는 청바지. 슬리퍼/운동화 입장 제한 가능." },
  { venue: "나이트", level: "포멀 ~ 세미포멀", description: "정장 또는 셋업 권장. 격식 있는 복장이 기본." },
  { venue: "라운지", level: "스마트 캐주얼+", description: "분위기에 맞는 세련된 복장. 너무 캐주얼한 복장은 지양." },
  { venue: "호빠", level: "자유", description: "편안하면서도 깔끔한 복장이면 충분." },
];

export default function FashionPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          <Link href="/community" className="mb-2 inline-block text-sm text-neutral-500 hover:text-violet-400">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">패션 가이드</h1>
          <p className="mt-2 text-neutral-400">드레스코드와 스타일링 정보</p>
        </div>

        <div className="mb-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-xl font-bold text-violet-400">업종별 드레스코드 기본 가이드</h2>
          <div className="space-y-3">
            {dressCodeGuide.map((item) => (
              <div key={item.venue} className="flex items-start gap-4 rounded-xl bg-neutral-950 p-4">
                <span className="shrink-0 rounded-lg bg-violet-600/20 px-3 py-1 text-sm font-medium text-violet-400">
                  {item.venue}
                </span>
                <div>
                  <span className="text-sm font-medium">{item.level}</span>
                  <p className="mt-1 text-xs text-neutral-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="mb-4 text-xl font-bold">인기 패션 가이드</h2>
        <div className="space-y-4">
          {fashionGuides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-violet-500/30"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-400">
                  {guide.category}
                </span>
                <span className="text-xs text-neutral-500">{guide.date}</span>
              </div>
              <h3 className="mb-3 text-lg font-semibold hover:text-violet-400">
                {guide.title}
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {guide.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">{guide.author}</span>
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span>♥ {guide.likes}</span>
                  <span>💬 {guide.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
