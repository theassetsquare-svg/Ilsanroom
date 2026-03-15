import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "면책조항 - 오늘밤어디",
  description:
    "오늘밤어디 면책조항. 매장 내역의 정확성, 플랫폼 이용에 관한 책임 제한 사항을 안내합니다.",
};

const disclaimerSections = [
  {
    icon: "📋",
    title: "내역의 정확성",
    content:
      '오늘밤어디(이하 "플랫폼")에 게시된 모든 매장 내역(영업시간, 위치, 가격, 당사사이트 내용 등)는 참고용으로만 게재됩니다. 관계된 내역는 입점처 측의 수정, 시기적 차이, 기타 사유로 인해 실제와 다를 수 있습니다. 본 사이트는 내역의 정확성, 완전성, 최신성을 보증하지 못합니다.',
  },
  {
    icon: "🏢",
    title: "점포 관리운용에 대한 책임",
    content:
      "플랫폼에 등록된 장소의 관리운용, 게재 품질, 안전, 위생 등에 대한 책임은 전적으로 해당 매장에 있습니다. 오늘밤어디은 점포의 관리운용 행위에 대해 어떠한 책임도 지지 않으며, 장소 이용으로 인해 발생하는 손해에 대해 배상 의책가 없습니다.",
  },
  {
    icon: "💬",
    title: "이용자 생성 자료",
    content:
      "평가글, 댓글, 게시글 등 방문자가 작성한 자료는 해당 이용자 개인의 의견이며, 오늘밤어디의 공식 입장을 대변하지 않습니다. 방문자 생성 콘텐츠의 진위 여부에 대해 본 플랫폼은 보증하지 않습니다.",
  },
  {
    icon: "🔗",
    title: "외부 링크",
    content:
      "본 시스템 내에서 게재되는 외부 웹사이트 링크는 이용자의 편의를 위해 게재됩니다. 오늘밤어디은 외부 웹사이트의 콘텐츠, 개인내역 보호 정책, 보안에 대해 책임을 지지 않습니다.",
  },
  {
    icon: "⚖️",
    title: "법적 준수",
    content:
      "방문자는 플랫폼 이용 시 대한민국 관계된 법조항을 준수해야 합니다. 본 시스템에 게시된 자료를 불법적 용도으로 활용하는 것은 엄격히 금지되며, 이로 인한 법적 책임은 이용자에게 있습니다.",
  },
  {
    icon: "🛡️",
    title: "시스템 가용성",
    content:
      "오늘밤어디은 안정적이고 지속적인 관리운용을 위해 노력하지만, 기술적 오류, 서버 장애, 유지보수 등의 사유로 플랫폼이 일시적으로 중단될 수 있습니다. 이로 인한 손해에 대해 본 시스템은 책임을 지지 않습니다.",
  },
  {
    icon: "💰",
    title: "금전적 거래",
    content:
      "플랫폼을 매개로 이루어지는 입점처와 방문자 간의 금전적 거래(입장료, 예약비 등)에 대해 오늘밤어디은 중개자 역할만 수행하며, 거래 당사자 간의 갈등에 대해 책임을 지지 않습니다. 결제 관계된 문제는 해당 매장 또는 결제 대행사에게 직접 문의하시기 바랍니다.",
  },
  {
    icon: "🔄",
    title: "면책조항의 수정",
    content:
      "본 면책조항은 플랫폼 관리운용 상황 및 관계된 법조항의 수정에 따라 수정될 수 있습니다. 수정 시 사이트 내 공지를 매개로 고지하며, 수정된 면책조항은 공지된 시점부터 효력이 발생합니다.",
  },
];

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            면책<span className="text-neon-primary-light">조항</span>
          </h1>
          <p className="text-lg text-neon-text-muted">
            플랫폼 이용 전 반드시 확인해 주세요
          </p>
        </div>

        {/* Important notice */}
        <div className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="mb-2 font-bold text-amber-400">중요 안내</h2>
              <p className="text-sm leading-relaxed text-neon-text">
                오늘밤어디는 나이트라이프 매장에 대한 자료를
                게재하는 플랫폼입니다. 본 웹사이트에 게시된 모든 내역는 내역 게재
                용도으로만 사용되며, 어떠한 형태의 보증이나 추천을 의미하지
                않습니다. 당사 사이트를 이용함으로써 아래의 면책조항에 동의하는 것으로
                간주됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neon-border bg-neon-surface px-6 py-4 text-sm text-neon-text-muted">
          <span className="font-medium text-neon-text">최종 수정일:</span>{" "}
          2026년 3월 14일
        </div>

        {/* Disclaimer sections */}
        <div className="space-y-6">
          {disclaimerSections.map((section, index) => (
            <article
              key={index}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 md:p-8"
            >
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-neon-text">
                {section.content}
              </p>
            </article>
          ))}
        </div>

        {/* Summary box */}
        <div className="mt-12 rounded-2xl border border-violet-500/20 bg-neon-primary-light/5 p-6 md:p-8 text-center">
          <h2 className="mb-4 text-xl font-bold text-neon-primary-light">요약</h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-neon-text">
            오늘밤어디은 매장 내역를 모아서 보여주는 내역 플랫폼입니다. 해당 장소의 실제
            관리운용 상황과 게재 품질은 해당 가게에 직접 확인하시기 바랍니다. 모든
            내역는 참고용이며, 이용에 따른 책임은 이용자 본인에게 있습니다.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neon-text-muted">
            문의사항:{" "}
            <span className="font-medium text-neon-primary-light">
              support@neon.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
