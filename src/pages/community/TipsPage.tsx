import { useState } from "react";
import { Link } from "react-router-dom";

type Category = "초보자" | "절약" | "안전" | "매너";
type Difficulty = "쉬움" | "보통" | "고급";

const categoryIcons: Record<Category, string> = {
  "초보자": "🌱",
  "절약": "💰",
  "안전": "🛡️",
  "매너": "🤝",
};

const difficultyColors: Record<Difficulty, string> = {
  "쉬움": "bg-neon-green/15 text-neon-green",
  "보통": "bg-neon-gold/15 text-neon-gold",
  "고급": "bg-neon-red/15 text-neon-red",
};

const tipCards = [
  {
    id: 1,
    title: "첫 방문 전 확인해야 할 세 가지",
    category: "초보자" as Category,
    difficulty: "쉬움" as Difficulty,
    author: "길잡이",
    bookmarks: 312,
    summary: "영업시간, 위치, 복장 규정을 미리 파악하면 당황할 일이 없습니다. 홈페이지나 SNS에서 최신 정보를 확인하세요.",
  },
  {
    id: 2,
    title: "음료비 아끼는 현명한 방법",
    category: "절약" as Category,
    difficulty: "쉬움" as Difficulty,
    author: "스마트소비",
    bookmarks: 278,
    summary: "조기 입장 프로모션이나 플랫폼 제휴 할인을 활용하세요. 세트 메뉴가 단품보다 경제적인 경우가 많습니다.",
  },
  {
    id: 3,
    title: "안전 귀가를 위한 사전 준비",
    category: "안전" as Category,
    difficulty: "쉬움" as Difficulty,
    author: "세이프가드",
    bookmarks: 405,
    summary: "출발 전 대리운전 앱을 설치하고, 지인에게 위치를 공유해 두세요. 배터리 잔량도 충분히 확보해야 합니다.",
  },
  {
    id: 4,
    title: "테이블 매너 기본 에티켓",
    category: "매너" as Category,
    difficulty: "보통" as Difficulty,
    author: "에티켓코치",
    bookmarks: 189,
    summary: "주변 테이블에 소음으로 불편을 주지 않도록 하고, 직원에게 정중하게 요청하는 것이 기본입니다.",
  },
  {
    id: 5,
    title: "단체 예약 시 비용 분담 요령",
    category: "절약" as Category,
    difficulty: "보통" as Difficulty,
    author: "모임장",
    bookmarks: 234,
    summary: "사전에 1인당 예산을 정하고 공용 계좌로 모은 뒤, 추가 주문은 개별 결제하면 정산이 깔끔합니다.",
  },
  {
    id: 6,
    title: "분위기 파악하고 자연스럽게 즐기기",
    category: "초보자" as Category,
    difficulty: "보통" as Difficulty,
    author: "분위기메이커",
    bookmarks: 156,
    summary: "도착 후 30분은 관찰 시간으로 두세요. 음악 장르, 연령대, 전체적인 흐름을 파악하면 훨씬 편안해집니다.",
  },
  {
    id: 7,
    title: "응급 상황 대처 가이드",
    category: "안전" as Category,
    difficulty: "고급" as Difficulty,
    author: "응급매뉴얼",
    bookmarks: 367,
    summary: "과음으로 인한 응급 상황 발생 시 직원에게 즉시 알리고, 119 연락 및 구토 시 옆으로 눕히는 것이 중요합니다.",
  },
  {
    id: 8,
    title: "VIP석 활용 노하우",
    category: "매너" as Category,
    difficulty: "고급" as Difficulty,
    author: "VIP안내원",
    bookmarks: 201,
    summary: "VIP석 예약 시 최소 주문 금액을 확인하세요. 담당 직원과 소통하며 원하는 서비스를 명확히 요청하는 것이 핵심입니다.",
  },
];

const categories: Array<Category | "전체"> = ["전체", "초보자", "절약", "안전", "매너"];

export default function TipsPage() {
  const [activeCat, setActiveCat] = useState<Category | "전체">("전체");

  const filtered = activeCat === "전체" ? tipCards : tipCards.filter((t) => t.category === activeCat);

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">실전 노하우 카드</h1>
          <p className="mt-2 text-neon-text-muted">
            상황별로 정리된 핵심 요령을 카드 형태로 빠르게 훑어보세요
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
                activeCat === cat
                  ? "bg-neon-primary text-neon-text"
                  : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"
              }`}
            >
              {cat !== "전체" && <span>{categoryIcons[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tip) => (
            <div
              key={tip.id}
              className="flex flex-col rounded-2xl border border-neon-border bg-neon-surface p-5 transition hover:border-neon-primary/40 hover:shadow-lg hover:shadow-neon-primary/5"
            >
              {/* Icon + Category */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[tip.category]}</span>
                  <span className="rounded-full bg-neon-primary-light/10 px-2.5 py-0.5 text-xs text-neon-primary-light">
                    {tip.category}
                  </span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[tip.difficulty]}`}>
                  {tip.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-base font-bold leading-snug">{tip.title}</h3>

              {/* Summary */}
              <p className="mb-4 flex-1 text-sm leading-relaxed text-neon-text-muted">
                {tip.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                <span>{tip.author}</span>
                <span>🔖 {tip.bookmarks}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
