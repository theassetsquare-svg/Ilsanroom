import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import PricingCTA from "@/components/saas/PricingCTA";
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const plans = [
  {
    name: "무료",
    planId: "free",
    price: "0",
    period: "영구 0원",
    description: "처음 시작하기 좋은 기본 플랜",
    features: [
      { text: "업소 기본 정보 입점", included: true },
      { text: "후기 확인", included: true },
      { text: "기본 통계 (조회수)", included: true },
      { text: "이벤트 등록", included: false },
      { text: "후기 답변", included: false },
      { text: "예약 관리", included: false },
      { text: "상위 노출", included: false },
      { text: "고객 분석 리포트", included: false },
      { text: "인증 뱃지", included: false },
      { text: "전담 매니저", included: false },
    ],
    cta: "비용 없이 시작",
    ctaLink: "/onboarding",
    highlighted: false,
    badge: null,
  },
  {
    name: "베이직",
    planId: "basic",
    price: "99,000",
    period: "월",
    description: "성장하는 업소를 위한 필수 기능",
    features: [
      { text: "업소 기본 정보 가입", included: true },
      { text: "후기 확인", included: true },
      { text: "기본 통계 (조회수)", included: true },
      { text: "이벤트 등록 (월 5개)", included: true },
      { text: "후기 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상위 노출", included: false },
      { text: "고객 분석 리포트", included: false },
      { text: "인증 뱃지", included: false },
      { text: "전담 매니저", included: false },
    ],
    cta: "베이직 시작",
    ctaLink: "/onboarding?plan=basic",
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
      { text: "업소 기본 정보 등록", included: true },
      { text: "리뷰 확인", included: true },
      { text: "상세 통계 + 고객 분석", included: true },
      { text: "이벤트 가입 (무제한)", included: true },
      { text: "리뷰 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상위 노출 (지역 1위)", included: true },
      { text: "고객 분석 리포트", included: true },
      { text: "인증 뱃지", included: true },
      { text: "전담 매니저", included: false },
    ],
    cta: "14일 0원 체험",
    ctaLink: "/onboarding?plan=pro&trial=true",
    highlighted: true,
    badge: "가장 인기",
  },
  {
    name: "하이엔드",
    planId: "premium",
    price: "599,000",
    period: "월",
    description: "대형 업소를 위한 올인원 솔루션",
    features: [
      { text: "업소 기본 정보 등록", included: true },
      { text: "평가 확인", included: true },
      { text: "상세 통계 + 고객 분석", included: true },
      { text: "이벤트 입점 (무제한)", included: true },
      { text: "평가 답변", included: true },
      { text: "예약 관리", included: true },
      { text: "상위 노출 (전국 TOP)", included: true },
      { text: "고객 분석 리포트", included: true },
      { text: "인증 뱃지", included: true },
      { text: "전담 매니저 + API", included: true },
    ],
    cta: "상담 신청",
    ctaLink: "/help",
    highlighted: false,
    badge: "엔터프라이즈",
  },
];

const faqs = [
  {
    question: "연간 구독하면 할인이 있나요?",
    answer:
      "네, 연간 구독 시 2개월 공짜 혜택이 적용됩니다. 베이직 연간 ₩990,000, 프로 연간 ₩2,990,000, 하이엔드 연간 ₩5,990,000입니다.",
  },
  {
    question: "환불은 어떻게 되나요?",
    answer:
      "구매일로부터 7일 이내 전액 환불됩니다. 7일 이후에는 잔여 기간에 대해 일할 계산 환불이 적용됩니다. 체험 기간 중 취소하면 비용이 발생하지 않습니다.",
  },
  {
    question: "플랜 변경이 자유로운가요?",
    answer:
      "네, 언제든지 상위나 하위 요금제로 바꾸면 됩니다. 올리면 차액만 내고, 내리면 다음 갱신일부터 바뀝니다.",
  },
  {
    question: "무료 체험 후 자동 결제되나요?",
    answer:
      "14일 체험 종료 3일 전에 알림을 보내드립니다. 체험 기간 중 취소하면 비용이 청구되지 않으며, 별도 조치가 없으면 선택한 구독으로 자동 전환됩니다.",
  },
  {
    question: "어떤 결제 수단을 지원하나요?",
    answer:
      "신용카드, 체크카드, 계좌이체, 가상계좌, 간편결제(카카오페이, 네이버페이, 토스페이)를 지원합니다. 모든 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.",
  },
];

export default function PricingPage() {
  useDocumentMeta('업주님, 14일 무료 체험으로 시작하세요 | 밤키', '0원부터 하이엔드까지 4단계. 체험 후 결정. 해지도 원클릭.');
  return (
    <div className="min-h-screen bg-neon-bg">
      <div className="mx-auto max-w-[1200px] px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neon-text">
            업주 <span className="text-neon-primary">요금제</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-neon-text-muted">
            업소 규모에 맞는 플랜을 골라보세요. 언제든 업그레이드하거나 바꿔도 됩니다.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${
                plan.highlighted
                  ? "border-neon-primary shadow-lg shadow-neon-primary/20"
                  : "border-neon-border"
              } bg-white p-8`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold ${
                    plan.highlighted ? "bg-neon-primary text-white" : "bg-neon-surface-2 text-neon-text-muted"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h2 className="mb-1 text-2xl font-bold text-neon-text">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-neon-text">
                    ₩{plan.price}
                  </span>
                  <span className="text-sm text-neon-text-muted">
                    {plan.period === "영구 0원"
                      ? plan.period
                      : `/ ${plan.period}`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neon-text-muted leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-neon-green" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-neon-border" />
                    )}
                    <span
                      className={
                        f.included ? "text-neon-text" : "text-neon-text-subtle"
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
        <div className="mt-16 rounded-2xl border border-neon-primary/30 bg-gradient-to-r from-violet-50 via-white to-violet-50 p-10 text-center">
          <h3 className="mb-3 text-3xl font-bold text-neon-text">
            14일 프로 <span className="text-neon-primary">체험</span>
          </h3>
          <p className="mx-auto mb-6 max-w-md text-base text-neon-text-muted leading-relaxed">
            카드 정보 없이 바로 시작하세요. 프로 플랜 기능 전부 14일간 비용 없이 써보세요.
          </p>
          <Link target="_blank" rel="noopener noreferrer" to="/onboarding?plan=pro&trial=true"
            className="inline-block rounded-xl bg-neon-primary px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neon-primary-light"
          >
            체험 시작하기
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="mb-8 text-center text-2xl font-bold text-neon-text">
            자주 묻는 <span className="text-neon-primary">질문</span>
          </h3>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-neon-border bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-base font-semibold text-neon-text [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="ml-2 text-neon-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-neon-text-muted">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom Help */}
        <div className="mt-16 rounded-2xl border border-neon-border bg-white p-8 text-center">
          <h3 className="mb-2 text-xl font-bold text-neon-text">궁금한 점이 있으신가요?</h3>
          <p className="mb-4 text-sm text-neon-text-muted leading-relaxed">
            요금제, 결제, 환불 등 궁금한 사항은 고객센터에서 확인하세요.
          </p>
          <Link target="_blank" rel="noopener noreferrer" to="/help"
            className="inline-block rounded-xl border border-neon-border bg-neon-surface-2 px-6 py-2.5 text-sm font-medium text-neon-text transition-colors hover:bg-neon-border"
          >
            고객센터 바로가기
          </Link>
        </div>
      </div>
    </div>
  );
}
