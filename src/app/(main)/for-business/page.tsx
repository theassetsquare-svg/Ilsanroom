import type { Metadata } from "next";
import {
  Eye,
  MessageSquare,
  BarChart3,
  BadgeCheck,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "업주 전용 - NEON",
  description:
    "NEON으로 업소 노출을 높이고, 리뷰를 관리하고, 데이터 기반으로 매출을 성장시키세요.",
};

const benefits = [
  {
    icon: Eye,
    title: "노출 증가",
    description:
      "NEON 플랫폼 내 프리미엄 노출로 잠재 고객에게 더 많이 보여집니다. 검색 최적화와 카테고리 상위 배치를 지원합니다.",
  },
  {
    icon: MessageSquare,
    title: "리뷰 관리",
    description:
      "고객 리뷰에 즉시 답변하고 평판을 관리하세요. 리뷰 알림과 분석 도구로 고객 만족도를 높일 수 있습니다.",
  },
  {
    icon: BarChart3,
    title: "데이터 분석",
    description:
      "방문자 수, 페이지 조회, 전환율 등 핵심 지표를 실시간 대시보드로 확인합니다. 데이터 기반 의사결정이 가능합니다.",
  },
  {
    icon: BadgeCheck,
    title: "프리미엄 배지",
    description:
      "NEON 인증 배지로 신뢰도를 높이세요. 인증 업소는 고객 클릭률이 평균 2.3배 높습니다.",
  },
];

const stats = [
  { value: "2,400+", label: "월간 활성 사용자" },
  { value: "184%", label: "평균 노출 증가" },
  { value: "4.7", label: "업주 만족도" },
  { value: "98%", label: "재계약률" },
];

const testimonials = [
  {
    text: "NEON 도입 후 신규 고객이 눈에 띄게 늘었습니다. 대시보드 덕분에 어떤 프로모션이 효과적인지 바로 알 수 있어요.",
    name: "김** 대표",
    venue: "루미에르 라운지",
  },
  {
    text: "리뷰 관리 기능이 정말 유용합니다. 고객 피드백에 빠르게 대응하면서 평점이 크게 올랐어요.",
    name: "박** 매니저",
    venue: "비트 클럽",
  },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <span className="mb-4 inline-block rounded-full bg-violet-600/20 px-4 py-1 text-xs font-medium text-violet-400">
            업주 전용
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl">
            데이터로 키우는
            <br />
            <span className="text-violet-400">나이트라이프 비즈니스</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-neutral-400">
            NEON은 업소 노출, 리뷰 관리, 성과 분석을 하나의 플랫폼에서
            제공합니다. 지금 시작하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              요금제 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              데모 체험하기
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          왜 <span className="text-violet-400">NEON</span>인가요?
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
            >
              <div className="mb-4 inline-flex rounded-xl bg-violet-600/20 p-3">
                <b.icon className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{b.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="border-y border-neutral-800 bg-neutral-900/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-16 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-violet-400">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-neutral-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          업주 <span className="text-violet-400">후기</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
            >
              <div className="mb-4 flex gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-neutral-300">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-neutral-500">{t.venue}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          시작은 <span className="text-violet-400">간단합니다</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "가입하기",
              desc: "무료로 NEON 업주 계정을 생성합니다.",
            },
            {
              step: "02",
              title: "업소 등록",
              desc: "업소 정보, 사진, 운영 시간을 입력합니다.",
            },
            {
              step: "03",
              title: "성장 시작",
              desc: "대시보드에서 성과를 확인하고 최적화합니다.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center"
            >
              <span className="mb-4 inline-block text-3xl font-extrabold text-violet-400/40">
                {item.step}
              </span>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-purple-600/10 p-12 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-violet-400" />
          <h2 className="mb-4 text-3xl font-bold">지금 바로 시작하세요</h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-neutral-400">
            무료 플랜으로 시작해 NEON의 가치를 직접 경험하세요. 업그레이드는
            언제든 가능합니다.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-10 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            요금제 선택하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
