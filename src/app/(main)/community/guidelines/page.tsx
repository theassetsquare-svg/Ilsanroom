import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 가이드라인 - 일산룸포털",
  description: "일산룸포털 커뮤니티의 운영 규칙과 가이드라인을 안내합니다. 건전하고 유익한 나이트라이프 커뮤니티를 함께 만들어갑니다.",
};

const sections = [
  {
    id: "basic-rules",
    icon: "📜",
    title: "기본 규칙",
    items: [
      "다른 회원을 존중하고 예의 바르게 소통해 주세요.",
      "건전한 토론 문화를 지향합니다. 의견이 다르더라도 상대방을 비하하지 마세요.",
      "본인의 실제 경험에 기반한 정보를 공유해 주세요.",
      "커뮤니티의 목적에 맞는 주제로 게시글을 작성해 주세요.",
      "동일하거나 유사한 내용을 반복 게시하지 마세요.",
      "타인의 게시글이나 댓글을 무단으로 복제하지 마세요.",
    ],
  },
  {
    id: "prohibited",
    icon: "🚫",
    title: "금지 콘텐츠",
    items: [
      "허위 리뷰: 방문하지 않은 업소에 대한 거짓 리뷰, 경쟁 업소를 폄하하기 위한 악성 리뷰는 즉시 삭제됩니다.",
      "스팸 및 광고: 업소 홍보, 상업적 광고, 외부 링크 스팸은 허용되지 않습니다. 업주분은 공식 채널을 이용해 주세요.",
      "성적/음란 콘텐츠: 선정적이거나 음란한 텍스트, 이미지, 링크는 즉시 삭제되며 계정이 정지될 수 있습니다.",
      "폭력 및 위협: 타인에 대한 폭력, 위협, 괴롭힘은 어떤 형태로든 금지됩니다.",
      "개인정보 노출: 타인의 실명, 연락처, 주소, 사진 등 개인정보를 동의 없이 게시하는 것은 금지됩니다.",
      "불법 행위 조장: 불법 약물, 도박, 기타 법률 위반 행위를 권유하거나 조장하는 콘텐츠는 금지됩니다.",
    ],
  },
  {
    id: "review-guide",
    icon: "✍️",
    title: "리뷰 작성 가이드",
    items: [
      "솔직한 경험을 바탕으로 작성해 주세요. 과장이나 축소 없이 실제 경험을 공유해 주시면 다른 회원들에게 큰 도움이 됩니다.",
      "구체적인 정보를 포함해 주세요. 방문 시간대, 분위기, 서비스 수준, 음료 퀄리티 등 구체적인 정보가 좋은 리뷰를 만듭니다.",
      "사진 첨부를 권장합니다. 실제 현장 사진은 리뷰의 신뢰도를 높이고, 추가 XP를 획득할 수 있습니다.",
      "별점은 공정하게 매겨 주세요. 1점과 5점만 남기기보다 실제 경험에 맞는 별점을 부여해 주세요.",
      "업소 관계자의 대리 리뷰는 금지됩니다. 적발 시 해당 리뷰 삭제 및 계정 정지 조치가 이루어집니다.",
      "리뷰 수정은 자유롭게 가능하지만, 삭제 후 재작성은 월 1회로 제한됩니다.",
    ],
  },
  {
    id: "report-process",
    icon: "⚖️",
    title: "신고 및 제재 절차",
    steps: [
      {
        step: "1단계: 신고 접수",
        description: "게시글이나 댓글의 '신고' 버튼을 통해 사유를 선택하고 제출합니다. 모든 신고는 익명으로 처리됩니다.",
      },
      {
        step: "2단계: 관리자 검토",
        description: "접수된 신고는 24시간 이내에 관리자가 검토합니다. 긴급 신고(폭력, 위협 등)는 즉시 처리됩니다.",
      },
      {
        step: "3단계: 조치",
        description: "검토 결과에 따라 경고, 콘텐츠 삭제, 일시 정지(7일/30일), 또는 영구 정지 조치가 이루어집니다.",
      },
      {
        step: "이의 제기",
        description: "조치에 이의가 있는 경우, 고객센터를 통해 소명할 수 있습니다. 소명은 조치일로부터 7일 이내에 가능합니다.",
      },
    ],
  },
  {
    id: "level-system",
    icon: "🏆",
    title: "레벨 시스템",
    levels: [
      { name: "뉴비", range: "0 ~ 99 XP", color: "text-neutral-400", badge: "⬜" },
      { name: "클러버", range: "100 ~ 499 XP", color: "text-blue-400", badge: "🟦" },
      { name: "파티피플", range: "500 ~ 1,499 XP", color: "text-purple-400", badge: "🟪" },
      { name: "VIP", range: "1,500 ~ 4,999 XP", color: "text-yellow-400", badge: "🟨" },
      { name: "레전드", range: "5,000+ XP", color: "text-red-400", badge: "🟥" },
    ],
    xpRules: [
      { action: "게시글 작성", xp: "+10 XP" },
      { action: "댓글 작성", xp: "+3 XP" },
      { action: "리뷰 작성", xp: "+20 XP" },
      { action: "사진 포함 리뷰", xp: "+30 XP" },
      { action: "좋아요 받기", xp: "+2 XP" },
      { action: "채택된 답변", xp: "+15 XP" },
      { action: "연속 출석 (7일)", xp: "+50 XP" },
    ],
  },
  {
    id: "contact",
    icon: "📞",
    title: "문의 안내",
    content: true,
  },
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold">커뮤니티 가이드라인</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            일산룸포털 커뮤니티는 모든 회원이 안전하고 즐겁게 소통할 수 있는 공간을 지향합니다.
            아래 가이드라인을 숙지하시고, 함께 건전한 나이트라이프 문화를 만들어 주세요.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1: Basic Rules */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">📜</span>
              <h2 className="text-xl font-bold">기본 규칙</h2>
            </div>
            <ul className="space-y-3">
              {sections[0].items!.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: Prohibited Content */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">🚫</span>
              <h2 className="text-xl font-bold">금지 콘텐츠</h2>
            </div>
            <ul className="space-y-3">
              {sections[1].items!.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Review Guide */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <h2 className="text-xl font-bold">리뷰 작성 가이드</h2>
            </div>
            <ul className="space-y-3">
              {sections[2].items!.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Report Process */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <h2 className="text-xl font-bold">신고 및 제재 절차</h2>
            </div>
            <div className="space-y-4">
              {sections[3].steps!.map((s, i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{s.step}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Level System */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h2 className="text-xl font-bold">레벨 시스템</h2>
            </div>
            <p className="mb-6 text-sm text-neutral-400">
              커뮤니티 활동을 통해 XP를 획득하고, 레벨을 올려보세요. 높은 레벨일수록 특별한 혜택이 주어집니다.
            </p>

            {/* Level Table */}
            <div className="mb-6 overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/50">
                    <th className="px-4 py-3 text-left font-medium text-neutral-400">배지</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-400">등급</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-400">필요 XP</th>
                  </tr>
                </thead>
                <tbody>
                  {sections[4].levels!.map((level, i) => (
                    <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                      <td className="px-4 py-3">{level.badge}</td>
                      <td className={`px-4 py-3 font-medium ${level.color}`}>{level.name}</td>
                      <td className="px-4 py-3 text-neutral-300">{level.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* XP Rules */}
            <h3 className="mb-3 font-semibold text-white">XP 획득 방법</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {sections[4].xpRules!.map((rule, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/50 px-4 py-2.5">
                  <span className="text-sm text-neutral-300">{rule.action}</span>
                  <span className="text-sm font-medium text-violet-400">{rule.xp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Contact */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">📞</span>
              <h2 className="text-xl font-bold">문의 안내</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-neutral-300">
              가이드라인에 대한 궁금한 점이나, 부당한 제재에 대한 이의 신청, 기타 커뮤니티 관련 문의는
              아래 페이지를 통해 접수하실 수 있습니다.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium transition hover:bg-violet-500"
            >
              고객센터 바로가기
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-4 text-xs text-neutral-500">
              신고 처리 결과는 영업일 기준 1~3일 이내에 알림으로 안내드립니다.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
          <p className="text-sm text-neutral-400">
            본 가이드라인은 2026년 3월 14일에 마지막으로 업데이트되었습니다.
            <br />
            일산룸포털은 커뮤니티 환경 개선을 위해 가이드라인을 수시로 업데이트할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
