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
    venue: "일산명월관요정",
    category: "전통 요정",
    location: "고양시 일산동구",
    period: "도입 8개월",
    image: "bg-gradient-to-br from-emerald-900/40 to-amber-600/20",
    summary:
      "일산명월관요정은 NEON 프리미엄 등록 후 온라인 검색 노출이 대폭 증가했습니다. 특히 '일산요정', '일산명월관' 키워드에서 상위 노출을 달성하며, 40~60대 비즈니스 고객층의 예약 문의가 크게 늘었습니다. 리뷰 관리 기능을 적극 활용하여 사장님 답변을 달기 시작한 이후 재방문율이 눈에 띄게 향상되었습니다.",
    quote:
      "전통 요정이라는 특수한 업종에서 디지털 마케팅 효과를 실감했습니다. NEON 덕분에 예약이 5배 이상 늘었습니다.",
    quoteName: "이** 대표",
    metrics: [
      {
        label: "예약 증가율",
        value: "+520%",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "월 검색 노출",
        value: "12,400회",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "매출 변화",
        value: "+89%",
        icon: DollarSign,
        color: "text-violet-400",
      },
    ],
  },
  {
    venue: "일산룸",
    category: "프리미엄 룸",
    location: "고양시 일산서구",
    period: "도입 6개월",
    image: "bg-gradient-to-br from-rose-900/40 to-violet-600/20",
    summary:
      "일산룸은 NEON 프로 플랜 도입 후 '일산룸' 키워드에서 1위를 유지하고 있습니다. 실시간 통계 대시보드를 통해 어떤 시간대에 방문자가 집중되는지 파악하고, 그에 맞춘 프로모션을 진행하여 비수기 매출까지 안정적으로 관리하고 있습니다. QR코드 프린트 기능으로 오프라인 명함에도 활용 중입니다.",
    quote:
      "데이터를 보고 의사결정을 하니까 감으로 하던 때와는 차원이 다릅니다. 이제 없으면 안 될 서비스입니다.",
    quoteName: "김** 대표",
    metrics: [
      {
        label: "방문자 증가율",
        value: "+340%",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "리뷰 수",
        value: "197건",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "매출 변화",
        value: "+65%",
        icon: DollarSign,
        color: "text-violet-400",
      },
    ],
  },
  {
    venue: "클럽 옥타곤",
    category: "메가 클럽",
    location: "서울시 강남구",
    period: "도입 12개월",
    image: "bg-gradient-to-br from-blue-900/40 to-cyan-600/20",
    summary:
      "아시아 대표 메가 클럽 옥타곤은 NEON 엔터프라이즈 플랜을 통해 API 연동까지 완료했습니다. 실시간 이벤트 업데이트, DJ 스케줄 자동 동기화, VIP 예약 시스템 연계 등 운영 효율이 크게 개선되었습니다. NEON을 통한 예약 전환율이 기존 채널 대비 3.2배 높게 나타났습니다.",
    quote:
      "대형 클럽도 결국 디지털 플랫폼이 핵심입니다. NEON의 분석 도구 덕분에 마케팅 ROI를 정확히 측정할 수 있게 되었습니다.",
    quoteName: "박** 매니저",
    metrics: [
      {
        label: "예약 전환율",
        value: "3.2배",
        icon: TrendingUp,
        color: "text-green-400",
      },
      {
        label: "API 연동",
        value: "완료",
        icon: Star,
        color: "text-yellow-400",
      },
      {
        label: "운영 효율",
        value: "+45%",
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
