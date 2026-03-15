import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import PricingCTA from "@/components/saas/PricingCTA";

export const metadata: Metadata = {
  title: "요금제 - 플랫폼 SaaS",
  description:
    "플랫폼 사업자 요금제 비교. 0원부터 하이엔드까지 최적의 구독안을 채택하세요.",
};

const plans = [
  {
    name: "프리",
    planId: "free",
    price: "0",
    period: "영구 0원",
    description: "개시하기 좋은 스타트 구독안",
    features: [
      { text: "스타트 입점처 정보 등록", included: true },
      { text: "리뷰 열람", included: true },
      { text: "스타트 데이터 (조회수)", included: true },
      { text: "특별행사 게시", included: false },
      { text: "후기 답변", included: false },
      { text: "접수 운영", included: false },
      { text: "상단 표시", included: false },
      { text: "이용자 리서치", included: false },
      { text: "하이엔드 인증마크", included: false },
      { text: "전담 담당자", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "0원으로 개시",
    ctaLink: "/admin/onboarding",
    highlighted: false,
    badge: null,
  },
  {
    name: "베이직",
    planId: "basic",
    price: "99,000",
    period: "월",
    description: "성장하는 입점처를 위한 필수 기능",
    features: [
      { text: "스타트 입점처 정보 등록", included: true },
      { text: "리뷰 열람", included: true },
      { text: "스타트 데이터 (조회수)", included: true },
      { text: "특별행사 등록 (월 5개)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "접수 운영", included: true },
      { text: "상단 표시", included: false },
      { text: "이용자 리서치", included: false },
      { text: "하이엔드 인증마크", included: false },
      { text: "전담 담당자", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "베이직 개시",
    ctaLink: "/admin/onboarding?plan=basic",
    highlighted: false,
    badge: null,
  },
  {
    name: "프로",
    planId: "pro",
    price: "299,000",
    period: "월",
    description: "매출을 극대화하는 프로 솔루션",
    features: [
      { text: "스타트 입점처 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "상세 데이터 + 이용자 리서치", included: true },
      { text: "특별행사 등록 (무제한)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "접수 관리", included: true },
      { text: "상단 표시 (지역 1위)", included: true },
      { text: "이용자 리서치 리포트", included: true },
      { text: "하이엔드 인증마크", included: true },
      { text: "전담 담당자", included: false },
      { text: "API 접근", included: false },
    ],
    cta: "14일 무상 트라이얼",
    ctaLink: "/admin/onboarding?plan=pro&trial=true",
    highlighted: true,
    badge: "가장 인기",
  },
  {
    name: "하이엔드",
    planId: "premium",
    price: "599,000",
    period: "월",
    description: "대형 입점처를 위한 올인원 솔루션",
    features: [
      { text: "스타트 입점처 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "상세 데이터 + 이용자 리서치", included: true },
      { text: "특별행사 등록 (무제한)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "접수 관리", included: true },
      { text: "상단 표시 (전국 1위)", included: true },
      { text: "이용자 리서치 리포트", included: true },
      { text: "하이엔드 인증마크", included: true },
      { text: "전담 담당자", included: true },
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
      "네, 연간 납입 시 2개월 무상 혜택이 적용됩니다. 베이직 연간 ₩990,000, 프로 연간 ₩2,990,000, 하이엔드 연간 ₩5,990,000으로 이용하실 수 해당됩니다.",
  },
  {
    question: "반환 정책은 어떻게 되나요?",
    answer:
      "납입일로부터 7일 이내 전액 반환이 실현합니다. 7일 이후에는 잔여 기간에 대한 일할 계산 반환이 적용됩니다. 비용없이 시범 이용 중 취소 시 요금이 발생하지 않습니다.",
  },
  {
    question: "구독안 변경은 언제든롭게 실현한가요?",
    answer:
      "네, 언제든지 상위 또는 하위 구독안으로 변경할 수 해당됩니다. 상위 구독안으로 변경 시 차액만 납입되며, 하위 구독안으로 변경 시 다음 납입일부터 적용됩니다.",
  },
  {
    question: "프리 테스트 후 자동 납입되나요?",
    answer:
      "14일 비용없이 테스트 종료 3일 전에 알림을 보내드립니다. 시범 기간 중 취소하면 요금이 청구되지 않으며, 별도 조치가 없으면 채택한 구독안으로 자동 전환됩니다.",
  },
  {
    question: "어떤 납입 방법을 지원하나요?",
    answer:
      "신용, 체크카드, 계좌이체, 가상계좌, 간편납입(카카오페이, 네이버페이, 토스페이)를 지원합니다. 모든 납입는 토스페이먼츠를 통해 안전하게 이루어집니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            요금제 <span className="text-neon-primary-light">비교</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-neon-text-muted">
            영업 규모에 맞는 구독안을 채택하세요. 언제든지 업그레이드하거나
            변경할 수 해당됩니다.
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
                  : "border-neon-border"
              } bg-neon-surface p-8`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-neon-text ${
                    plan.highlighted ? "bg-neon-primary" : "bg-neon-surface-2"
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
                  <span className="text-sm text-neon-text-muted">
                    {plan.period === "영구 0원"
                      ? plan.period
                      : `/ ${plan.period}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neon-text-muted">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-neon-primary-light" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-neon-text-muted/60" />
                    )}
                    <span
                      className={
                        f.included ? "text-neutral-200" : "text-neon-text-muted"
                      }
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <PricingCTA planId={plan.planId} label={plan.cta} highlighted={plan.highlighted} />
            </div>
          ))}
        </div>

        {/* 14-day Trial CTA Banner */}
        <div className="mt-16 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-neutral-900 p-10 text-center">
          <h3 className="mb-3 text-3xl font-bold">
            14일 프로 <span className="text-neon-primary-light">프리 트라이얼</span>
          </h3>
          <p className="mx-auto mb-6 max-w-md text-neon-text-muted">
            신용 없이 바로 개시하세요. 프로 구독안의 모든 기능을 14일간 공짜로
            이용할 수 해당됩니다.
          </p>
          <Link
            href="/admin/onboarding?plan=pro&trial=true"
            className="inline-block rounded-xl bg-neon-primary px-8 py-3.5 text-sm font-semibold text-neon-text transition-colors hover:bg-neon-primary-light"
          >
            프리 시범 개시하기
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="mb-8 text-center text-2xl font-bold">
            자주 묻는 <span className="text-neon-primary-light">질문</span>
          </h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-neon-border bg-neon-surface"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-neutral-200 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="ml-2 text-neon-text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-neon-text-muted">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom Help */}
        <div className="mt-16 rounded-2xl border border-neon-border bg-neon-surface p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">궁금한 점이 있으신가요?</h3>
          <p className="mb-4 text-sm text-neon-text-muted">
            요금제, 납입, 반환 등 궁금한 사항은 이용자센터에서 확인하세요.
          </p>
          <Link
            href="/help"
            className="inline-block rounded-xl bg-neon-surface-2 px-6 py-2.5 text-sm font-medium text-neon-text transition-colors hover:bg-neon-surface-2"
          >
            이용자센터 바로가기
          </Link>
        </div>
      </div>
    </div>
  );
}
