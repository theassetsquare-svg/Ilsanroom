import type { Metadata } from "next";
import {
  Eye,
  MessageSquare,
  BarChart3,
  BadgeCheck,
  CalendarCheck,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle,
  CreditCard,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "업주 전용 - 오늘밤어디 | 내 업소를 등록하고 매출을 올리세요",
  description:
    "오늘밤어디에 업소를 등록하면 검색 노출 증가, 리뷰 관리, 실시간 통계, 예약 시스템까지. 14일 무료 체험으로 매출 성장을 경험하세요.",
};

const features = [
  {
    icon: Eye,
    title: "검색 노출 증가",
    description:
      "오늘밤어디 플랫폼 내 프리미엄 검색 노출로 잠재 고객에게 더 많이 보여집니다. SEO 최적화와 카테고리 상위 배치를 지원합니다.",
  },
  {
    icon: MessageSquare,
    title: "리뷰 관리",
    description:
      "고객 리뷰에 즉시 답변하고 평판을 관리하세요. 리뷰 알림과 감성 분석 도구로 고객 만족도를 높일 수 있습니다.",
  },
  {
    icon: BarChart3,
    title: "실시간 통계",
    description:
      "방문자 수, 페이지 조회, 전환율 등 핵심 지표를 실시간 대시보드로 확인합니다. 데이터 기반 의사결정이 가능합니다.",
  },
  {
    icon: BadgeCheck,
    title: "프리미엄 배지",
    description:
      "오늘밤어디 인증 배지로 신뢰도를 높이세요. 인증 업소는 고객 클릭률이 평균 2.3배 높습니다.",
  },
  {
    icon: CalendarCheck,
    title: "예약 시스템",
    description:
      "온라인 예약 접수부터 확인, 리마인더까지 자동화합니다. 노쇼율 감소와 테이블 회전율 향상을 동시에 달성하세요.",
  },
  {
    icon: Megaphone,
    title: "이벤트 프로모션",
    description:
      "특별 이벤트, 할인 프로모션을 오늘밤어디 플랫폼에서 직접 홍보하세요. 타겟 고객에게 푸시 알림으로 전달됩니다.",
  },
];

const stats = [
  { value: "101개", label: "등록 업소" },
  { value: "50,000+", label: "월 방문자" },
  { value: "4.5", label: "평균 평점" },
  { value: "89%", label: "재가입률" },
];

const steps = [
  {
    step: "01",
    title: "가입",
    description: "무료로 오늘밤어디 업주 계정을 생성합니다. 1분이면 충분합니다.",
  },
  {
    step: "02",
    title: "업소 등록",
    description:
      "업소 정보, 사진, 운영 시간, 메뉴를 입력합니다. 가이드를 따라 쉽게 완성하세요.",
  },
  {
    step: "03",
    title: "매출 성장",
    description:
      "대시보드에서 성과를 확인하고 최적화합니다. 고객이 찾아옵니다.",
  },
];

const caseStudies = [
  {
    name: "일산명월관",
    metric: "+520%",
    description: "검색 노출 증가",
    detail: "오늘밤어디 등록 3개월 만에 온라인 문의량 5배 이상 증가",
  },
  {
    name: "일산룸",
    metric: "+340%",
    description: "예약 전환율 상승",
    detail: "예약 시스템 도입 후 노쇼율 60% 감소, 매출 3.4배 성장",
  },
  {
    name: "옥타곤",
    metric: "3.2x",
    description: "매출 성장",
    detail: "프리미엄 배지와 이벤트 프로모션으로 주말 매출 3.2배 달성",
  },
];

const plans = [
  {
    name: "무료",
    price: "₩0",
    period: "/월",
    features: ["업소 프로필 1개", "기본 월간 통계", "리뷰 알림"],
    highlighted: false,
  },
  {
    name: "프로",
    price: "₩49,000",
    period: "/월",
    features: [
      "프리미엄 검색 노출",
      "실시간 통계 대시보드",
      "리뷰 관리 도구",
      "인증 배지",
    ],
    highlighted: true,
  },
  {
    name: "비즈니스",
    price: "₩99,000",
    period: "/월",
    features: [
      "프로 플랜 전체 기능",
      "예약 시스템",
      "이벤트 프로모션",
      "우선 고객 지원",
    ],
    highlighted: false,
  },
  {
    name: "엔터프라이즈",
    price: "맞춤 견적",
    period: "",
    features: [
      "멀티 업소 관리",
      "전담 매니저 배정",
      "API 연동",
      "맞춤 리포트",
    ],
    highlighted: false,
  },
];

const testimonials = [
  {
    text: "오늘밤어디 도입 후 신규 고객이 눈에 띄게 늘었습니다. 대시보드 덕분에 어떤 프로모션이 효과적인지 바로 알 수 있어요. 매출이 2배 이상 올랐습니다.",
    name: "김** 대표",
    venue: "일산명월관",
    rating: 5,
  },
  {
    text: "리뷰 관리 기능이 정말 유용합니다. 고객 피드백에 빠르게 대응하면서 평점이 3.2에서 4.7로 크게 올랐어요. 이제 없으면 안 될 도구입니다.",
    name: "박** 매니저",
    venue: "일산룸",
    rating: 5,
  },
  {
    text: "예약 시스템 하나로 노쇼가 거의 사라졌습니다. 직원들이 전화 받느라 바빴는데 이제 서비스에 집중할 수 있게 됐어요.",
    name: "이** 실장",
    venue: "옥타곤",
    rating: 5,
  },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center md:py-36">
          <span className="mb-4 inline-block rounded-full bg-neon-primary/20 px-4 py-1.5 text-xs font-medium text-neon-primary-light">
            업주 전용
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            내 업소를 오늘밤어디에 등록하고
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              매출 300% 올리세요
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-neon-text-muted">
            검색 노출, 리뷰 관리, 실시간 통계, 예약 시스템까지. 오늘밤어디 하나로
            나이트라이프 비즈니스의 모든 것을 관리하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/admin/onboarding?plan=pro&trial=true"
              className="inline-flex items-center gap-2 rounded-xl bg-neon-primary px-10 py-4 text-sm font-semibold text-neon-text shadow-lg shadow-violet-600/25 transition-all hover:bg-neon-primary-light hover:shadow-violet-500/30"
            >
              14일 무료 체험 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-neon-border px-8 py-4 text-sm font-semibold text-neon-text transition-colors hover:bg-neon-surface-2"
            >
              요금제 비교하기
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-neon-text-muted">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-neon-primary-light" />
              즉시 가입
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-neon-primary-light" />
              신용카드 불필요
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-neon-primary-light" />
              언제든 해지
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-neon-border bg-neon-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-neon-primary-light">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-neon-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold">
          왜 <span className="text-neon-primary-light">오늘밤어디</span>인가요?
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm text-neon-text-muted">
          업소 운영에 필요한 모든 도구를 하나의 플랫폼에서 제공합니다.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neon-border bg-neon-surface p-8 transition-colors hover:border-neon-primary/30"
            >
              <div className="mb-4 inline-flex rounded-xl bg-neon-primary/20 p-3">
                <f.icon className="h-6 w-6 text-neon-primary-light" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-neon-text-muted">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold">
          시작은 <span className="text-neon-primary-light">간단합니다</span>
        </h2>
        <p className="mx-auto mb-12 max-w-md text-center text-sm text-neon-text-muted">
          3단계만 거치면 오늘밤어디의 모든 기능을 사용할 수 있습니다.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-neon-border bg-neon-surface p-8 text-center"
            >
              <span className="mb-4 inline-block text-4xl font-extrabold text-neon-primary-light/30">
                {item.step}
              </span>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-neon-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <div className="hidden items-center gap-2 text-xs text-neon-text-muted md:flex">
            <span className="rounded-full bg-neon-primary/20 px-3 py-1 text-neon-primary-light">
              가입
            </span>
            <ArrowRight className="h-3 w-3 text-neon-text-muted/60" />
            <span className="rounded-full bg-neon-primary/20 px-3 py-1 text-neon-primary-light">
              업소 등록
            </span>
            <ArrowRight className="h-3 w-3 text-neon-text-muted/60" />
            <span className="rounded-full bg-neon-primary/20 px-3 py-1 text-neon-primary-light">
              매출 성장
            </span>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="border-y border-neon-border bg-neon-surface/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="mb-4 text-center text-3xl font-bold">
            실제 <span className="text-neon-primary-light">성과</span>
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-sm text-neon-text-muted">
            오늘밤어디을 도입한 업소들의 실제 성장 사례입니다.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {caseStudies.map((cs) => (
              <div
                key={cs.name}
                className="rounded-2xl border border-neon-border bg-neon-surface p-8 text-center"
              >
                <TrendingUp className="mx-auto mb-3 h-8 w-8 text-neon-green" />
                <p className="text-4xl font-extrabold text-neon-primary-light">
                  {cs.metric}
                </p>
                <p className="mt-1 text-sm font-medium text-neon-text">
                  {cs.description}
                </p>
                <p className="mt-1 text-xs font-semibold text-neon-primary-light">
                  {cs.name}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-neon-text-muted">
                  {cs.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold">
          합리적인 <span className="text-neon-primary-light">요금제</span>
        </h2>
        <p className="mx-auto mb-12 max-w-md text-center text-sm text-neon-text-muted">
          비즈니스 규모에 맞는 플랜을 선택하세요.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-violet-500 bg-neon-primary/10 ring-1 ring-violet-500/50"
                  : "border-neon-border bg-neon-surface"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block rounded-full bg-neon-primary px-3 py-0.5 text-xs font-medium text-neon-text">
                  인기
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-2xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-neon-text-muted">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-neon-text-muted"
                  >
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-primary-light" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neon-primary-light transition-colors hover:text-violet-300"
          >
            전체 요금제 비교하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-neon-border bg-neon-surface/30">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">
            업주 <span className="text-neon-primary-light">후기</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neon-border bg-neon-surface p-8"
              >
                <div className="mb-4 flex gap-1 text-neon-gold">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-neon-text">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-neon-text-muted">{t.venue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-violet-600/10 p-12 text-center md:p-16">
          <Zap className="mx-auto mb-4 h-12 w-12 text-neon-primary-light" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-neon-text-muted">
            14일 프로 무료 체험으로 오늘밤어디의 모든 기능을 경험하세요. 신용카드 없이
            시작하고, 언제든 해지할 수 있습니다.
          </p>
          <Link
            href="/admin/onboarding?plan=pro&trial=true"
            className="inline-flex items-center gap-2 rounded-xl bg-neon-primary px-12 py-4 text-base font-semibold text-neon-text shadow-lg shadow-violet-600/25 transition-all hover:bg-neon-primary-light hover:shadow-violet-500/30"
          >
            14일 프로 무료 체험 시작하기
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-neon-text-muted">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-neon-primary-light" />
              즉시 가입
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-neon-primary-light" />
              신용카드 불필요
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-neon-primary-light" />
              언제든 해지
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
