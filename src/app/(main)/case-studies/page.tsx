import type { Metadata } from "next";
import { TrendingUp, Star, DollarSign, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "사례 연구 - NEON",
  description:
    "NEON을 도입한 업소들의 성과를 확인하세요. 방문자 증가, 리뷰 개선, 매출 성장 사례.",
};

const caseStudies = [
  {
    venue: "루미에르 라운지",
    category: "프리미엄 라운지",
    location: "일산 웨스턴돔",
    period: "도입 6개월",
    image: "bg-gradient-to-br from-violet-900/40 to-purple-600/20",
    summary:
      "NEON Pro 도입 후 온라인 노출이 크게 증가하며 신규 고객 유입이 눈에 띄게 늘었습니다. 리뷰 관리 기능으로 고객 만족도가 향상되었습니다.",
    quote:
      "리뷰에 빠르게 답변할 수 있게 되면서 단골 고객이 확실히 늘었어요.",
    quoteName: "김** 대표",
    metrics: [
      {
        label: "방문자 증가율",
        value: "+184%",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "리뷰 수",
        value: "127건",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "매출 변화",
        value: "+42%",
        icon: DollarSign,
        color: "text-violet-400",
      },
    ],
  },
  {
    venue: "비트 클럽",
    category: "나이트클럽",
    location: "일산 라페스타",
    period: "도입 4개월",
    image: "bg-gradient-to-br from-blue-900/40 to-cyan-600/20",
    summary:
      "젊은 층을 타깃으로 NEON 노출 순위 최적화를 진행했습니다. 이벤트 프로모션과 연계해 주말 예약률이 대폭 상승했습니다.",
    quote:
      "NEON 대시보드로 어떤 이벤트가 효과적인지 데이터로 확인할 수 있어 좋습니다.",
    quoteName: "박** 매니저",
    metrics: [
      {
        label: "방문자 증가율",
        value: "+256%",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "리뷰 수",
        value: "89건",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "매출 변화",
        value: "+67%",
        icon: DollarSign,
        color: "text-violet-400",
      },
    ],
  },
  {
    venue: "소담 요정",
    category: "전통 요정",
    location: "일산 중앙로",
    period: "도입 8개월",
    image: "bg-gradient-to-br from-amber-900/40 to-orange-600/20",
    summary:
      "전통 요정이라는 특수한 업종에서도 NEON을 통해 온라인 인지도를 높이는 데 성공했습니다. 40-50대 고객층의 앱 유입이 크게 늘었습니다.",
    quote:
      "전통 업소도 디지털 시대에 맞게 변해야 한다는 걸 실감했습니다.",
    quoteName: "이** 대표",
    metrics: [
      {
        label: "방문자 증가율",
        value: "+98%",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "리뷰 수",
        value: "64건",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "매출 변화",
        value: "+31%",
        icon: DollarSign,
        color: "text-violet-400",
      },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            사례 <span className="text-violet-400">연구</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-neutral-400">
            NEON과 함께 성장한 업소들의 실제 성과를 확인하세요.
          </p>
        </div>

        {/* Case Study Cards */}
        <div className="space-y-8">
          {caseStudies.map((study) => (
            <div
              key={study.venue}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              {/* Top Section */}
              <div className={`${study.image} p-8`}>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {study.category}
                  </span>
                  <span className="text-xs text-white/60">
                    {study.location}
                  </span>
                  <span className="text-xs text-white/60">{study.period}</span>
                </div>
                <h2 className="text-2xl font-bold">{study.venue}</h2>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 divide-x divide-neutral-800 border-b border-neutral-800">
                {study.metrics.map((m) => (
                  <div key={m.label} className="p-5 text-center">
                    <m.icon
                      className={`mx-auto mb-2 h-5 w-5 ${m.color}`}
                    />
                    <p className="text-2xl font-extrabold">{m.value}</p>
                    <p className="mt-1 text-xs text-neutral-500">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="p-8">
                <p className="mb-4 text-sm leading-relaxed text-neutral-300">
                  {study.summary}
                </p>
                <blockquote className="rounded-xl border-l-2 border-violet-500 bg-neutral-950 px-5 py-4">
                  <p className="text-sm italic text-neutral-300">
                    &ldquo;{study.quote}&rdquo;
                  </p>
                  <cite className="mt-2 block text-xs not-italic text-neutral-500">
                    &mdash; {study.quoteName}
                  </cite>
                </blockquote>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">
            다음 성공 사례의 주인공이 되세요
          </h3>
          <p className="mb-6 text-sm text-neutral-400">
            지금 NEON을 도입하고 데이터 기반으로 업소를 성장시키세요.
          </p>
          <Link
            href="/for-business"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            업주 전용 페이지
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
