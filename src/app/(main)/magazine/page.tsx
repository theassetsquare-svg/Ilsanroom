import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매거진 - NEON 나이트라이프",
  description: "나이트라이프 문화, 트렌드, 인터뷰 등 다양한 콘텐츠를 만나보세요.",
};

const featuredArticle = {
  title: "2026 대한민국 나이트라이프 트렌드 리포트",
  excerpt: "올해 주목해야 할 클럽, 라운지, 나이트 씬의 변화를 분석합니다. 새로운 장르의 부상부터 공간 디자인 트렌드까지.",
  category: "트렌드",
  date: "2026-03-10",
  readTime: "8분",
};

const articles = [
  {
    id: 1,
    title: "강남 vs 홍대: 두 개의 클럽 문화",
    excerpt: "같은 서울이지만 전혀 다른 분위기. 두 지역의 나이트라이프 문화를 비교합니다.",
    category: "문화",
    date: "2026-03-08",
    readTime: "5분",
  },
  {
    id: 2,
    title: "DJ 인터뷰: 한국 EDM 씬의 현재와 미래",
    excerpt: "국내 톱 DJ들이 말하는 한국 일렉트로닉 뮤직 씬의 성장과 전망.",
    category: "인터뷰",
    date: "2026-03-06",
    readTime: "7분",
  },
  {
    id: 3,
    title: "라운지 바 문화 입문 가이드",
    excerpt: "클럽이 부담스럽다면? 편안하면서도 세련된 라운지 바 문화를 소개합니다.",
    category: "가이드",
    date: "2026-03-04",
    readTime: "4분",
  },
  {
    id: 4,
    title: "해운대 나이트라이프의 사계절",
    excerpt: "여름만 있는 줄 알았던 해운대. 계절마다 다른 매력을 가진 부산의 밤.",
    category: "여행",
    date: "2026-03-02",
    readTime: "6분",
  },
  {
    id: 5,
    title: "나이트클럽의 역사: 한국 나이트 문화 40년",
    excerpt: "80년대 디스코텍부터 현재의 메가 클럽까지. 한국 나이트 문화의 변천사.",
    category: "역사",
    date: "2026-02-28",
    readTime: "10분",
  },
  {
    id: 6,
    title: "칵테일 101: 라운지에서 주문하는 법",
    excerpt: "기본 칵테일부터 시그니처 드링크까지. 라운지 초보를 위한 음료 가이드.",
    category: "가이드",
    date: "2026-02-25",
    readTime: "5분",
  },
  {
    id: 7,
    title: "일산 명월관 요정 — 비즈니스 접대의 새로운 기준",
    excerpt: "전통 한정식과 국악 라이브가 어우러지는 일산명월관요정. 15가지 코스 요리, 30개 프라이빗 룸, 정찰제 운영으로 비즈니스 접대의 격을 높이는 공간을 소개합니다.",
    category: "비즈니스",
    date: "2026-03-12",
    readTime: "7분",
  },
  {
    id: 8,
    title: "일산 룸 문화 가이드 — 프라이빗 모임의 정석",
    excerpt: "일산룸은 경기 서북부를 대표하는 프리미엄 룸 공간입니다. 비즈니스 회식부터 소규모 모임까지, 일산 지역 룸 문화의 특징과 이용 팁을 정리했습니다.",
    category: "가이드",
    date: "2026-03-11",
    readTime: "6분",
  },
];

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "트렌드": "bg-violet-500/10 text-violet-400",
    "문화": "bg-blue-500/10 text-blue-400",
    "인터뷰": "bg-amber-500/10 text-amber-400",
    "가이드": "bg-green-500/10 text-green-400",
    "여행": "bg-cyan-500/10 text-cyan-400",
    "역사": "bg-orange-500/10 text-orange-400",
    "비즈니스": "bg-rose-500/10 text-rose-400",
  };
  return colors[category] || "bg-neutral-500/10 text-neutral-400";
}

export default function MagazinePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            NEON <span className="text-violet-400">매거진</span>
          </h1>
          <p className="text-lg text-neutral-400">
            나이트라이프 문화와 트렌드 이야기
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-12 overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-violet-600/10 to-neutral-900">
          <div className="flex flex-col md:flex-row">
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-violet-600/30 to-transparent md:h-auto md:w-1/2">
              <span className="text-7xl opacity-40">📰</span>
            </div>
            <div className="flex flex-col justify-center p-8 md:w-1/2">
              <span className={`mb-3 w-fit rounded-full px-3 py-1 text-xs ${getCategoryColor(featuredArticle.category)}`}>
                {featuredArticle.category}
              </span>
              <h2 className="mb-3 text-2xl font-bold">{featuredArticle.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                {featuredArticle.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span>{featuredArticle.date}</span>
                <span>·</span>
                <span>읽는 시간 {featuredArticle.readTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all hover:border-violet-500/50"
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <span className="text-4xl opacity-30 transition group-hover:opacity-60">📖</span>
              </div>
              <div className="p-5">
                <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                <h3 className="mb-2 font-semibold leading-tight group-hover:text-violet-400">
                  {article.title}
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-neutral-400">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
