import type { Metadata } from "next";
import { venues } from "@/data/venues";

export const metadata: Metadata = {
  title: "인기 업소 랭킹 - 일산룸포털",
  description: "카테고리별 인기 나이트라이프 업소 랭킹. 클럽, 나이트, 라운지, 호빠 TOP 순위를 확인하세요.",
};

const rankingTabs = [
  { key: "all", label: "전체" },
  { key: "club", label: "클럽" },
  { key: "night", label: "나이트" },
  { key: "lounge", label: "라운지" },
  { key: "hoppa", label: "호빠" },
];

const rankedVenues = [
  ...venues.sort((a, b) => b.rating - a.rating),
].map((v, i) => ({ ...v, rank: i + 1 }));

function getRankBadge(rank: number) {
  if (rank === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (rank === 2) return "bg-neutral-400/20 text-neutral-300 border-neutral-400/30";
  if (rank === 3) return "bg-amber-700/20 text-amber-500 border-amber-700/30";
  return "bg-neutral-800 text-neutral-500 border-neutral-700";
}

export default function RankingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            인기 업소 <span className="text-violet-400">랭킹</span>
          </h1>
          <p className="text-lg text-neutral-400">
            리뷰와 평점 기반 인기 순위
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {rankingTabs.map((tab) => (
            <button
              key={tab.key}
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-white first:bg-violet-600 first:text-white"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {rankedVenues.map((venue) => (
            <div
              key={venue.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold ${getRankBadge(venue.rank)}`}
              >
                {venue.rank}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{venue.nameKo}</h3>
                  {venue.isPremium && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                      PREMIUM
                    </span>
                  )}
                  {venue.isVerified && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                      인증
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
                  <span>{venue.regionKo}</span>
                  <span>·</span>
                  <span>{venue.category === "club" ? "클럽" : venue.category === "night" ? "나이트" : venue.category === "lounge" ? "라운지" : venue.category === "yojeong" ? "요정" : venue.category === "hoppa" ? "호빠" : "룸"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-lg font-bold">{venue.rating}</span>
                </div>
                <div className="text-xs text-neutral-500">
                  리뷰 {venue.reviewCount}개
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <p className="text-sm text-neutral-400">
            랭킹은 사용자 리뷰 평점, 리뷰 수, 인기도를 종합하여 산출됩니다.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            매주 월요일 업데이트 | 최근 3개월 데이터 기준
          </p>
        </div>
      </div>
    </div>
  );
}
