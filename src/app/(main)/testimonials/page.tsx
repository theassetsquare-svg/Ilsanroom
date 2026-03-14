import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "업주 후기 - NEON 나이트라이프",
  description:
    "NEON을 사용하는 업주들의 실제 후기와 추천사. 매출 증가, 노출 확대, 리뷰 관리까지.",
};

const testimonials = [
  {
    name: "이** 대표",
    venue: "일산명월관요정",
    category: "요정",
    region: "일산",
    rating: 5,
    text: "전통 요정이라 디지털 마케팅이 어려울 줄 알았는데, NEON에 등록한 뒤 40~60대 비즈니스 고객 예약이 5배 이상 늘었습니다. 사장님 답변 기능으로 리뷰 관리도 수월해졌고요.",
    plan: "프리미엄",
    since: "2025년 7월",
  },
  {
    name: "김** 대표",
    venue: "일산룸",
    category: "룸",
    region: "일산",
    rating: 5,
    text: "NEON 대시보드로 방문자 패턴을 분석하고 비수기 프로모션을 설계했더니 매출이 안정되었습니다. QR코드 기능도 명함에 활용 중입니다.",
    plan: "프로",
    since: "2025년 9월",
  },
  {
    name: "박** 매니저",
    venue: "클럽 옥타곤",
    category: "클럽",
    region: "강남",
    rating: 5,
    text: "API 연동으로 DJ 스케줄과 이벤트가 자동 동기화됩니다. 예약 전환율이 기존 채널 대비 3배 이상 높아졌어요.",
    plan: "엔터프라이즈",
    since: "2025년 3월",
  },
  {
    name: "최** 대표",
    venue: "강남 레이스 나이트",
    category: "나이트",
    region: "강남",
    rating: 4,
    text: "나이트클럽은 온라인 홍보가 어려운 업종인데, NEON 덕분에 젊은 신규 고객이 많이 유입되었습니다. 이벤트 등록 기능이 특히 유용합니다.",
    plan: "프로",
    since: "2025년 11월",
  },
  {
    name: "한** 사장",
    venue: "DM 라운지",
    category: "라운지",
    region: "논현",
    rating: 5,
    text: "프리미엄 배지 덕분에 고급 라운지 이미지가 더 강화되었어요. VIP 고객 유치에 큰 도움이 됩니다.",
    plan: "프리미엄",
    since: "2025년 5월",
  },
  {
    name: "정** 대표",
    venue: "강남 밤사이",
    category: "호빠",
    region: "강남",
    rating: 4,
    text: "처음에는 반신반의했는데, 등록 첫 달부터 문의가 2배로 늘었습니다. 무료 플랜으로 시작해서 부담도 없었어요.",
    plan: "베이직",
    since: "2025년 12월",
  },
  {
    name: "윤** 대표",
    venue: "강남 그랜드 콜라텍",
    category: "콜라텍",
    region: "강남",
    rating: 5,
    text: "중장년층 고객도 NEON을 통해 검색하고 방문합니다. 댄스 교실 스케줄 공유가 편리해졌어요.",
    plan: "프로",
    since: "2025년 8월",
  },
  {
    name: "송** 매니저",
    venue: "클럽 에이스 홍대",
    category: "클럽",
    region: "홍대",
    rating: 5,
    text: "NEON 통계로 어떤 이벤트가 집객에 효과적인지 수치로 확인할 수 있어서 기획이 훨씬 정확해졌습니다.",
    plan: "프로",
    since: "2025년 10월",
  },
];

function getPlanColor(plan: string): string {
  const colors: Record<string, string> = {
    "프리미엄": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "프로": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "엔터프라이즈": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "베이직": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  };
  return colors[plan] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            업주 <span className="text-violet-400">후기</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-neutral-400">
            NEON을 사용하는 업주들의 실제 후기와 추천사를 확인하세요.
          </p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-violet-500/30"
            >
              {/* Top: Avatar + Info */}
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getPlanColor(t.plan)}`}
                    >
                      {t.plan}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {t.venue} · {t.region}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < t.rating ? "text-yellow-400" : "text-neutral-700"}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="mb-4 text-sm leading-relaxed text-neutral-300">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Since */}
              <p className="text-xs text-neutral-500">
                이용 시작: {t.since}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">
            지금 무료로 시작하기
          </h3>
          <p className="mb-6 text-sm text-neutral-400">
            NEON에 업소를 등록하고 성장을 경험하세요.
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
