import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "추천 프로그램 - 일산룸포털",
  description:
    "일산룸포털 추천 프로그램으로 친구를 초대하고 보상을 받으세요. 추천할수록 더 많은 혜택이 쌓입니다.",
};

const steps = [
  {
    step: 1,
    title: "초대 링크 공유",
    description:
      "내 프로필에서 고유 추천 링크를 복사하여 친구에게 카카오톡, 문자, SNS 등으로 공유하세요.",
    icon: "🔗",
  },
  {
    step: 2,
    title: "친구 가입 완료",
    description:
      "공유한 링크를 통해 친구가 일산룸포털에 회원가입을 완료하면 추천이 인정됩니다.",
    icon: "👤",
  },
  {
    step: 3,
    title: "보상 지급",
    description:
      "추천이 확인되면 추천인과 피추천인 모두에게 보상이 자동 지급됩니다.",
    icon: "🎁",
  },
];

const rewards = [
  {
    tier: "브론즈",
    range: "1~4명 추천",
    reward: "추천 1건당 500 일산룸포털 포인트",
    color: "from-amber-700 to-amber-900",
    borderColor: "border-amber-700/30",
    textColor: "text-amber-400",
  },
  {
    tier: "실버",
    range: "5~14명 추천",
    reward: "추천 1건당 800 일산룸포털 포인트",
    color: "from-neutral-400 to-neutral-600",
    borderColor: "border-neutral-500/30",
    textColor: "text-neutral-300",
  },
  {
    tier: "골드",
    range: "15~29명 추천",
    reward: "추천 1건당 1,200 일산룸포털 포인트 + 프리미엄 1주 무료",
    color: "from-yellow-500 to-yellow-700",
    borderColor: "border-yellow-600/30",
    textColor: "text-yellow-400",
  },
  {
    tier: "다이아몬드",
    range: "30명 이상 추천",
    reward: "추천 1건당 2,000 일산룸포털 포인트 + 프리미엄 1개월 무료",
    color: "from-violet-500 to-violet-700",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
  },
];

const faqs = [
  {
    q: "추천 보상은 언제 지급되나요?",
    a: "친구가 회원가입을 완료한 후 24시간 이내에 자동 지급됩니다.",
  },
  {
    q: "일산룸포털 포인트는 어디에 사용할 수 있나요?",
    a: "프리미엄 구독 결제, 이벤트 응모, 제휴 업소 할인 쿠폰 교환 등에 사용할 수 있습니다.",
  },
  {
    q: "추천 인원에 제한이 있나요?",
    a: "추천 인원에 제한은 없습니다. 많이 추천할수록 더 높은 등급의 보상을 받으실 수 있습니다.",
  },
  {
    q: "이미 가입한 친구도 추천이 되나요?",
    a: "아닙니다. 추천 링크를 통해 신규 가입한 회원만 추천 실적으로 인정됩니다.",
  },
  {
    q: "추천 현황은 어디서 확인하나요?",
    a: "내 프로필 > 추천 프로그램 탭에서 추천 현황, 누적 포인트, 등급을 실시간으로 확인할 수 있습니다.",
  },
];

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex rounded-full bg-violet-600/20 px-4 py-1.5 text-sm font-medium text-violet-400">
            일산룸포털 추천 프로그램
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            친구를 초대하고
            <br />
            <span className="text-violet-400">보상을 받으세요</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-neutral-400">
            추천 링크를 공유하면 당신과 친구 모두에게 일산룸포털 포인트가 지급됩니다.
            추천할수록 등급이 올라가고, 보상도 커집니다.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            이렇게 <span className="text-violet-400">진행됩니다</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center"
              >
                <div className="mb-4 text-4xl">{step.icon}</div>
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards structure */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            보상 <span className="text-violet-400">등급</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {rewards.map((tier) => (
              <div
                key={tier.tier}
                className={`rounded-2xl border ${tier.borderColor} bg-neutral-900 p-6`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${tier.textColor}`}>
                    {tier.tier}
                  </h3>
                  <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-400">
                    {tier.range}
                  </span>
                </div>
                <p className="text-sm text-neutral-300">{tier.reward}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral bonus highlight */}
        <div className="mb-16 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-900/10 p-8 text-center md:p-12">
          <h2 className="mb-3 text-2xl font-bold">피추천인 혜택</h2>
          <p className="mb-6 text-neutral-400">
            추천 링크를 통해 가입한 친구도 혜택을 받습니다
          </p>
          <div className="inline-flex flex-col items-center rounded-2xl bg-neutral-900/80 px-8 py-6">
            <span className="mb-2 text-3xl font-bold text-violet-400">
              300P
            </span>
            <span className="text-sm text-neutral-400">
              가입 즉시 일산룸포털 포인트 지급
            </span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            자주 묻는 <span className="text-violet-400">질문</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <h3 className="mb-2 font-bold text-neutral-200">
                  Q. {faq.q}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  A. {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-violet-900/20 p-8 text-center md:p-12">
          <h2 className="mb-3 text-2xl font-bold">
            지금 바로 시작하세요
          </h2>
          <p className="mb-6 text-neutral-400">
            로그인 후 내 프로필에서 추천 링크를 확인할 수 있습니다
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex rounded-xl bg-violet-600 px-8 py-3 font-medium text-white transition hover:bg-violet-500"
            >
              회원가입
            </a>
            <a
              href="/login"
              className="inline-flex rounded-xl border border-neutral-700 bg-neutral-900 px-8 py-3 font-medium text-white transition hover:bg-neutral-800"
            >
              로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
