import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "안전 가이드 - 일산룸포털",
  description: "나이트라이프를 안전하게 즐기기 위한 가이드. 음주 안전, 교통, 긴급 연락처 정보.",
};

const safetyTips = [
  {
    category: "음주 안전",
    icon: "🍺",
    tips: [
      "자신의 주량을 파악하고 무리하지 않기",
      "술을 마시기 전 충분한 식사하기",
      "음료를 자리에 두고 떠나지 않기",
      "물을 자주 마셔 수분 보충하기",
      "모르는 사람이 건네는 음료는 주의하기",
    ],
  },
  {
    category: "교통 안전",
    icon: "🚕",
    tips: [
      "음주운전은 절대 금지 - 대리운전 또는 택시 이용",
      "귀가 방법을 미리 계획하기",
      "택시 이용 시 공식 앱(카카오T 등) 활용",
      "심야 시간 대중교통 막차 시간 확인",
      "지인에게 귀가 계획 공유하기",
    ],
  },
  {
    category: "개인 안전",
    icon: "🛡️",
    tips: [
      "친구와 함께 다니고 혼자 고립되지 않기",
      "소지품(지갑, 휴대폰) 관리 철저히",
      "낯선 사람과 개인정보 공유 자제",
      "불편한 상황에서는 즉시 자리를 피하기",
      "업소 스태프에게 도움 요청 가능",
    ],
  },
  {
    category: "건강 관리",
    icon: "❤️",
    tips: [
      "충분한 수면 후 외출하기",
      "편안한 신발 착용 권장",
      "귀마개 등 청력 보호 도구 준비",
      "컨디션이 좋지 않으면 무리하지 않기",
      "음주 후 충분한 휴식 취하기",
    ],
  },
];

const emergencyContacts = [
  { name: "경찰", number: "112", description: "범죄, 폭행, 긴급 상황" },
  { name: "소방/구급", number: "119", description: "화재, 응급 환자, 구조" },
  { name: "여성긴급전화", number: "1366", description: "여성 폭력 피해 상담" },
  { name: "음주운전 신고", number: "112", description: "음주운전 목격 시" },
  { name: "대리운전 (대표)", number: "1577-4400", description: "음주 후 안전 귀가" },
  { name: "응급의료정보센터", number: "1339", description: "야간 응급 의료 안내" },
];

const taxiApps = [
  { name: "카카오T", description: "가장 널리 사용되는 택시 호출 앱" },
  { name: "타다", description: "프리미엄 모빌리티 서비스" },
  { name: "UT(우티)", description: "우버 기반 택시 호출 서비스" },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            안전 <span className="text-violet-400">가이드</span>
          </h1>
          <p className="text-lg text-neutral-400">
            안전하고 즐거운 나이트라이프를 위한 필수 정보
          </p>
        </div>

        {/* Safety Tips */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {safetyTips.map((section) => (
            <div
              key={section.category}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold">
                <span className="text-2xl">{section.icon}</span>
                {section.category}
              </h2>
              <ul className="space-y-2.5">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Emergency Contacts */}
        <div className="mb-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h2 className="mb-6 text-2xl font-bold text-red-400">긴급 연락처</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.name}
                className="flex items-center justify-between rounded-xl bg-neutral-900/80 p-4"
              >
                <div>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <p className="text-xs text-neutral-400">{contact.description}</p>
                </div>
                <span className="text-lg font-bold text-red-400">{contact.number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Taxi Apps */}
        <div className="mb-12 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-6 text-2xl font-bold">안전 귀가 앱</h2>
          <div className="space-y-3">
            {taxiApps.map((app) => (
              <div
                key={app.name}
                className="flex items-center justify-between rounded-xl bg-neutral-950 p-4"
              >
                <div>
                  <h3 className="font-medium">{app.name}</h3>
                  <p className="text-sm text-neutral-400">{app.description}</p>
                </div>
                <span className="rounded-lg bg-violet-600/20 px-3 py-1 text-xs text-violet-400">
                  추천
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible Drinking */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-violet-400">책임감 있는 음주</h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-neutral-300">
            나이트라이프는 즐거운 경험이어야 합니다. 자신과 주변 사람의 안전을 항상 먼저 생각하고,
            음주는 적당히, 귀가는 안전하게. 일산룸포털은 모두의 안전한 밤 문화를 응원합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
