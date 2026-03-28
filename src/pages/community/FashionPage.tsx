import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

type VenueType = "lounge" | "night" | "bar" | "yojeong";
type FilterType = VenueType | "all";

const venueLabel: Record<VenueType, string> = {
  lounge: "칵테일 바",
  night: "댄스 공간",
  bar: "바",
  yojeong: "한식 접대",
};

const venueFilters: Array<FilterType> = ["all", "lounge", "night", "bar", "yojeong"];

interface OutfitCard {
  id: number;
  title: string;
  author: string;
  tags: string[];
  suitability: Record<VenueType, number>; // 1-5 score
  saves: number;
  season: string;
}

const outfitCards: OutfitCard[] = [
  {
    id: 1,
    title: "셋업 수트로 완성하는 단정한 스타일",
    author: "수트마스터",
    tags: ["셋업", "포멀", "남성"],
    suitability: { lounge: 5, night: 5, bar: 4, yojeong: 5 },
    saves: 284,
    season: "사계절",
  },
  {
    id: 2,
    title: "여름 린넨 코디 — 시원하면서 격식 유지",
    author: "린넨매니아",
    tags: ["린넨", "여름", "캐주얼"],
    suitability: { lounge: 4, night: 3, bar: 5, yojeong: 3 },
    saves: 197,
    season: "여름",
  },
  {
    id: 3,
    title: "미니멀 원피스 + 힐 조합",
    author: "원피스퀸",
    tags: ["원피스", "여성", "미니멀"],
    suitability: { lounge: 5, night: 4, bar: 5, yojeong: 3 },
    saves: 341,
    season: "봄·가을",
  },
  {
    id: 4,
    title: "가죽 재킷으로 포인트 주기",
    author: "레더팬",
    tags: ["재킷", "스트릿", "유니섹스"],
    suitability: { lounge: 3, night: 5, bar: 4, yojeong: 2 },
    saves: 156,
    season: "가을·겨울",
  },
  {
    id: 5,
    title: "한복 퓨전 — 전통 접대 공간 방문 차림",
    author: "퓨전한복",
    tags: ["한복", "퓨전", "특별"],
    suitability: { lounge: 2, night: 1, bar: 2, yojeong: 5 },
    saves: 223,
    season: "사계절",
  },
  {
    id: 6,
    title: "올블랙 스타일링의 정석",
    author: "블랙무드",
    tags: ["올블랙", "시크", "유니섹스"],
    suitability: { lounge: 5, night: 5, bar: 5, yojeong: 3 },
    saves: 412,
    season: "사계절",
  },
  {
    id: 7,
    title: "니트 + 슬랙스 — 겨울 데이트 복장",
    author: "겨울감성",
    tags: ["니트", "겨울", "데이트"],
    suitability: { lounge: 4, night: 3, bar: 4, yojeong: 3 },
    saves: 178,
    season: "겨울",
  },
  {
    id: 8,
    title: "액세서리 하나로 분위기 전환",
    author: "포인트장인",
    tags: ["액세서리", "시계", "목걸이"],
    suitability: { lounge: 4, night: 4, bar: 3, yojeong: 3 },
    saves: 265,
    season: "사계절",
  },
];

function SuitabilityDots({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${i <= score ? "bg-neon-primary-light" : "bg-neon-surface-2"}`}
        />
      ))}
    </span>
  );
}

export default function FashionPage() {
  useDocumentMeta('뭐 입고 가야 해? 패션 가이드 | 놀쿨', '셔츠냐 정장이냐, 운동화 되냐 안 되냐. 옷 고민 끝.');
  const [venueFilter, setVenueFilter] = useState<FilterType>("all");

  const sorted = [...outfitCards].sort((a, b) => {
    if (venueFilter !== "all") {
      return b.suitability[venueFilter] - a.suitability[venueFilter];
    }
    return b.saves - a.saves;
  });

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link target="_blank" rel="noopener noreferrer" to="/community" className="mb-2 inline-block text-sm text-neon-text-muted hover:text-neon-primary-light">
            ← 커뮤니티
          </Link>
          <h1 className="text-3xl font-bold">스타일 갤러리</h1>
          <p className="mt-2 text-neon-text-muted">
            장소 유형에 맞는 착장 영감을 얻고, 나만의 스타일을 공유하세요
          </p>
        </div>

        {/* Venue Type Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {venueFilters.map((v) => (
            <button
              key={v}
              onClick={() => setVenueFilter(v)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                venueFilter === v
                  ? "bg-neon-primary text-neon-text"
                  : "border border-neon-border text-neon-text-muted hover:border-neon-primary/50"
              }`}
            >
              {v === "all" ? "모든 유형" : `${venueLabel[v]} 적합도 순`}
            </button>
          ))}
        </div>

        {/* Pinterest-style Grid */}
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {sorted.map((card) => (
            <div
              key={card.id}
              className="mb-5 break-inside-avoid rounded-2xl border border-neon-border bg-neon-surface overflow-hidden transition hover:border-neon-primary/40"
            >
              {/* Image Placeholder */}
              <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-neon-surface-2 to-neon-bg">
                <div className="text-center text-neon-text-muted">
                  <div className="text-4xl mb-2">👔</div>
                  <div className="text-xs">착장 이미지</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="mb-2 text-sm font-bold leading-snug">{card.title}</h3>

                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-neon-surface-2 px-2 py-0.5 text-xs text-neon-text-muted">
                      #{tag}
                    </span>
                  ))}
                  <span className="rounded-full bg-neon-primary-light/10 px-2 py-0.5 text-xs text-neon-primary-light">
                    {card.season}
                  </span>
                </div>

                {/* Venue Suitability Scores */}
                <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {(Object.entries(card.suitability) as [VenueType, number][]).map(([venue, score]) => (
                    <div key={venue} className="flex items-center justify-between">
                      <span className="text-neon-text-muted">{venueLabel[venue]}</span>
                      <SuitabilityDots score={score} />
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-neon-border pt-3 text-xs text-neon-text-muted">
                  <span>{card.author}</span>
                  <span>🔖 {card.saves}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
