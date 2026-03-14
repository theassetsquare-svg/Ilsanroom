import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "요금제 - NEON 나이트라이프 SaaS",
  description:
    "NEON 업주 요금제 비교. 무료부터 프리미엄까지 최적의 플랜을 선택하세요.",
};

const plans = [
  {
    name: "무료",
    price: "0",
    period: "영구 무료",
    description: "시작하기 좋은 기본 플랜",
    features: [
      { text: "기본 업소 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "기본 통계 (조회수)", included: true },
      { text: "이벤트 등록", included: false },
      { text: "리뷰 답변", included: false },
      { text: "예약 관리", included: false },
      { text: "상단 노출", included: false },
      { text: "고객 분석", included: false },
      { text: "프리미엄 배지", included: false },
      { text: "전담 매니저", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "무료로 시작",
    ctaLink: "/admin/onboarding",
    highlighted: false,
    badge: null,
  },
  {
    name: "베이직",
    price: "99,000",
    period: "월",
    description: "성장하는 업소를 위한 필수 기능",
    features: [
      { text: "기본 업소 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "기본 통계 (조회수)", included: true },
      { text: "이벤트 등록 (월 5개)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상단 노출", included: false },
      { text: "고객 분석", included: false },
      { text: "프리미엄 배지", included: false },
      { text: "전담 매니저", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "베이직 시작",
    ctaLink: "/admin/onboarding?plan=basic",
    highlighted: false,
    badge: null,
  },
  {
    name: "프로",
    price: "299,000",
    period: "월",
    description: "매출을 극대화하는 프로 도구",
    features: [
      { text: "기본 업소 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "상세 통계 + 고객 분석", included: true },
      { text: "이벤트 등록 (무제한)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상단 노출 (지역 1위)", included: true },
      { text: "고객 분석 리포트", included: true },
      { text: "프리미엄 배지", included: true },
      { text: "전담 매니저", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "14일 무료 체험",
    ctaLink: "/admin/onboarding?plan=pro&trial=true",
    highlighted: true,
    badge: "가장 인기",
  },
  {
    name: "프리미엄",
    price: "599,000",
    period: "월",
    description: "대형 업소를 위한 올인원 솔루션",
    features: [
      { text: "기본 업소 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "상세 통계 + 고객 분석", included: true },
      { text: "이벤트 등록 (무제한)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상단 노출 (전국 1위)", included: true },
      { text: "고객 분석 리포트", included: true },
      { text: "프리미엄 배지", included: true },
      { text: "전담 매니저", included: true },
      { text: "API 접근 + 맞춤 개발", included: true },
    ],
    cta: "상담 신청",
    ctaLink: "/help",
    highlighted: false,
    badge: "엔터프라이즈",
  },
];

const faqs = [
  {
    question: "연간 할인이 있나요?",
    answer:
      "네, 연간 결제 시 2개월 무료 혜택이 적용됩니다. 베이직 연간 ₩990,000, 프로 연간 ₩2,990,000, 프리미엄 연간 ₩5,990,000으로 이용하실 수 있습니다.",
  },
  {
    question: "환불 정책은 어떻게 되나요?",
    answer:
      "결제일로부터 7일 이내 전액 환불이 가능합니다. 7일 이후에는 잔여 기간에 대한 일할 계산 환불이 적용됩니다. 무료 체험 기간 중 취소 시 비용이 발생하지 않습니다.",
  },
  {
    question: "플랜 변경은 자유롭게 가능한가요?",
    answer:
      "네, 언제든지 상위 또는 하위 플랜으로 변경할 수 있습니다. 상위 플랜으로 변경 시 차액만 결제되며, 하위 플랜으로 변경 시 다음 결제일부터 적용됩니다.",
  },
  {
    question: "무료 체험 후 자동 결제되나요?",
    answer:
      "14일 무료 체험 종료 3일 전에 알림을 보내드립니다. 체험 기간 중 취소하면 비용이 청구되지 않으며, 별도 조치가 없으면 선택한 플랜으로 자동 전환됩니다.",
  },
  {
    question: "어떤 결제 방법을 지원하나요?",
    answer:
      "신용카드, 체크카드, 계좌이체, 가상계좌, 간편결제(카카오페이, 네이버페이, 토스페이)를 지원합니다. 모든 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
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

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${
                plan.highlighted
                  ? "border-violet-500 shadow-lg shadow-violet-500/20"
                  : "border-neutral-800"
              } bg-neutral-900 p-8`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white ${
                    plan.highlighted ? "bg-violet-600" : "bg-neutral-700"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className="mb-1 text-2xl font-bold">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">
                    ₩{plan.price}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {plan.period === "영구 무료"
                      ? plan.period
                      : `/ ${plan.period}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
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
                href={plan.ctaLink}
                className={`block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "border border-neutral-600 text-white hover:bg-neutral-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* 14-day Trial CTA Banner */}
        <div className="mt-16 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-neutral-900 p-10 text-center">
          <h3 className="mb-3 text-3xl font-bold">
            14일 프로 <span className="text-violet-400">무료 체험</span>
          </h3>
          <p className="mx-auto mb-6 max-w-md text-neutral-400">
            신용카드 없이 바로 시작하세요. 프로 플랜의 모든 기능을 14일간 무료로
            체험할 수 있습니다.
          </p>
          <Link
            href="/admin/onboarding?plan=pro&trial=true"
            className="inline-block rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            무료 체험 시작하기
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="mb-8 text-center text-2xl font-bold">
            자주 묻는 <span className="text-violet-400">질문</span>
          </h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-neutral-200 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="ml-2 text-neutral-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-neutral-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom Help */}
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
