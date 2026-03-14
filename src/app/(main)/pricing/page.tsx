import type { Metadata } from "next";
import { Check, X, Zap, Crown, Building2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "요금제 - NEON",
  description:
    "NEON SaaS 요금제 비교. 무료, Pro, Enterprise 플랜으로 나이트라이프 업소 관리를 시작하세요.",
};

const tiers = [
  {
    name: "Free",
    nameKo: "무료",
    price: "₩0",
    period: "영구 무료",
    description: "소규모 업소를 위한 기본 플랜",
    icon: Zap,
    accent: "border-neutral-700",
    badgeBg: "bg-neutral-800 text-neutral-300",
    cta: "무료로 시작하기",
    ctaStyle:
      "border border-neutral-600 text-white hover:bg-neutral-800 transition-colors",
    features: [
      { text: "업소 프로필 1개", included: true },
      { text: "기본 통계 (월간)", included: true },
      { text: "리뷰 알림", included: true },
      { text: "NEON 배지", included: false },
      { text: "실시간 분석 대시보드", included: false },
      { text: "프리미엄 노출 순위", included: false },
      { text: "맞춤 리포트", included: false },
      { text: "전담 매니저", included: false },
    ],
  },
  {
    name: "Pro",
    nameKo: "프로",
    price: "₩49,000",
    period: "/ 월",
    description: "성장하는 업소를 위한 올인원 솔루션",
    icon: Crown,
    accent: "border-violet-500",
    badgeBg: "bg-violet-600 text-white",
    cta: "Pro 시작하기",
    ctaStyle: "bg-violet-600 text-white hover:bg-violet-500 transition-colors",
    popular: true,
    features: [
      { text: "업소 프로필 3개", included: true },
      { text: "실시간 통계 대시보드", included: true },
      { text: "리뷰 관리 및 답변", included: true },
      { text: "NEON 인증 배지", included: true },
      { text: "프리미엄 노출 순위", included: true },
      { text: "월간 성과 리포트", included: true },
      { text: "맞춤 리포트", included: false },
      { text: "전담 매니저", included: false },
    ],
  },
  {
    name: "Enterprise",
    nameKo: "엔터프라이즈",
    price: "맞춤형",
    period: "별도 문의",
    description: "대규모 프랜차이즈 및 체인을 위한 플랜",
    icon: Building2,
    accent: "border-neutral-700",
    badgeBg: "bg-neutral-800 text-neutral-300",
    cta: "문의하기",
    ctaStyle:
      "border border-neutral-600 text-white hover:bg-neutral-800 transition-colors",
    features: [
      { text: "무제한 업소 프로필", included: true },
      { text: "실시간 통계 대시보드", included: true },
      { text: "리뷰 관리 및 답변", included: true },
      { text: "NEON 인증 배지", included: true },
      { text: "프리미엄 노출 순위", included: true },
      { text: "월간 성과 리포트", included: true },
      { text: "맞춤 리포트 (주간/일간)", included: true },
      { text: "전담 매니저 배정", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            요금제 <span className="text-violet-400">비교</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-neutral-400">
            비즈니스 규모에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나
            변경할 수 있습니다.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border ${tier.accent} bg-neutral-900 p-8`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-xs font-semibold text-white">
                  인기
                </span>
              )}

              <div className="mb-6">
                <span
                  className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tier.badgeBg}`}
                >
                  <tier.icon className="h-3.5 w-3.5" />
                  {tier.name}
                </span>
                <h2 className="mb-1 text-2xl font-bold">{tier.nameKo}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{tier.price}</span>
                  <span className="text-sm text-neutral-400">
                    {tier.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  {tier.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-violet-400" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-neutral-600" />
                    )}
                    <span
                      className={
                        f.included ? "text-neutral-200" : "text-neutral-500"
                      }
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/for-business"
                className={`block rounded-xl px-6 py-3 text-center text-sm font-semibold ${tier.ctaStyle}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Callout */}
        <div className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">궁금한 점이 있으신가요?</h3>
          <p className="mb-4 text-sm text-neutral-400">
            요금제, 결제, 환불 등 궁금한 사항은 고객센터에서 확인하세요.
          </p>
          <Link
            href="/help"
            className="inline-block rounded-xl bg-neutral-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            고객센터 바로가기
          </Link>
        </div>
      </div>
    </div>
  );
}
