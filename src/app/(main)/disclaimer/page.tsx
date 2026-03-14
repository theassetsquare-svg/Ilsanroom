import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "면책조항 - 일산룸포털",
  description:
    "일산룸포털 면책조항. 업소 정보의 정확성, 서비스 이용에 관한 책임 제한 사항을 안내합니다.",
};

const disclaimerSections = [
  {
    icon: "📋",
    title: "정보의 정확성",
    content:
      '일산룸포털(이하 "서비스")에 게시된 모든 업소 정보(영업시간, 위치, 가격, 서비스 내용 등)는 참고용으로만 제공됩니다. 해당 정보는 업소 측의 변경, 시기적 차이, 기타 사유로 인해 실제와 다를 수 있습니다. 서비스는 정보의 정확성, 완전성, 최신성을 보증하지 않습니다.',
  },
  {
    icon: "🏢",
    title: "업소 운영에 대한 책임",
    content:
      "서비스에 등록된 업소의 운영, 서비스 품질, 안전, 위생 등에 대한 책임은 전적으로 해당 업소에 있습니다. 일산룸포털은 업소의 운영 행위에 대해 어떠한 책임도 지지 않으며, 업소 이용으로 인해 발생하는 손해에 대해 배상 의무가 없습니다.",
  },
  {
    icon: "💬",
    title: "이용자 생성 콘텐츠",
    content:
      "리뷰, 댓글, 게시글 등 이용자가 작성한 콘텐츠는 해당 이용자 개인의 의견이며, 일산룸포털의 공식 입장을 대변하지 않습니다. 이용자 생성 콘텐츠의 진위 여부에 대해 서비스는 보증하지 않습니다.",
  },
  {
    icon: "🔗",
    title: "외부 링크",
    content:
      "서비스 내에서 제공되는 외부 웹사이트 링크는 이용자의 편의를 위해 제공됩니다. 일산룸포털은 외부 웹사이트의 콘텐츠, 개인정보 보호 정책, 보안에 대해 책임을 지지 않습니다.",
  },
  {
    icon: "⚖️",
    title: "법적 준수",
    content:
      "이용자는 서비스 이용 시 대한민국 관련 법령을 준수해야 합니다. 서비스에 게시된 정보를 불법적 목적으로 이용하는 것은 엄격히 금지되며, 이로 인한 법적 책임은 이용자에게 있습니다.",
  },
  {
    icon: "🛡️",
    title: "서비스 가용성",
    content:
      "일산룸포털은 서비스의 지속적이고 안정적인 제공을 위해 노력하지만, 기술적 오류, 서버 장애, 유지보수 등의 사유로 서비스가 일시적으로 중단될 수 있습니다. 이로 인한 손해에 대해 서비스는 책임을 지지 않습니다.",
  },
  {
    icon: "💰",
    title: "금전적 거래",
    content:
      "서비스를 통해 이루어지는 업소와 이용자 간의 금전적 거래(입장료, 예약비 등)에 대해 일산룸포털은 중개자 역할만 수행하며, 거래 당사자 간의 분쟁에 대해 책임을 지지 않습니다. 결제 관련 문제는 해당 업소 또는 결제 서비스 제공자에게 직접 문의하시기 바랍니다.",
  },
  {
    icon: "🔄",
    title: "면책조항의 변경",
    content:
      "본 면책조항은 서비스 운영 상황 및 관련 법령의 변경에 따라 수정될 수 있습니다. 변경 시 서비스 내 공지를 통해 고지하며, 변경된 면책조항은 공지된 시점부터 효력이 발생합니다.",
  },
];

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            면책<span className="text-violet-400">조항</span>
          </h1>
          <p className="text-lg text-neutral-400">
            서비스 이용 전 반드시 확인해 주세요
          </p>
        </div>

        {/* Important notice */}
        <div className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="mb-2 font-bold text-amber-400">중요 안내</h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                일산룸포털 서비스는 나이트라이프 업소에 대한 정보를
                제공하는 플랫폼입니다. 본 서비스에 게시된 모든 정보는 정보 제공
                목적으로만 사용되며, 어떠한 형태의 보증이나 추천을 의미하지
                않습니다. 서비스를 이용함으로써 아래의 면책조항에 동의하는 것으로
                간주됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4 text-sm text-neutral-400">
          <span className="font-medium text-neutral-300">최종 수정일:</span>{" "}
          2026년 3월 14일
        </div>

        {/* Disclaimer sections */}
        <div className="space-y-6">
          {disclaimerSections.map((section, index) => (
            <article
              key={index}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8"
            >
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                {section.content}
              </p>
            </article>
          ))}
        </div>

        {/* Summary box */}
        <div className="mt-12 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 md:p-8 text-center">
          <h2 className="mb-4 text-xl font-bold text-violet-400">요약</h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-neutral-300">
            일산룸포털은 업소 정보를 모아서 보여주는 정보 플랫폼입니다. 업소의 실제
            운영 상황과 서비스 품질은 해당 업소에 직접 확인하시기 바랍니다. 모든
            정보는 참고용이며, 이용에 따른 책임은 이용자 본인에게 있습니다.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            문의사항:{" "}
            <span className="font-medium text-violet-400">
              support@neon.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
