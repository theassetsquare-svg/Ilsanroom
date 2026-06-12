import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const disclaimerSections = [
  {
    icon: "📋",
    title: "정보의 정확성",
    content:
      '놀쿨(이하 "플랫폼")에 게시된 모든 매장 정보(영업시간, 위치, 분위기, 라인업 등)는 참고용으로만 게재됩니다. 해당 정보는 매장 측의 변경, 시기적 차이, 기타 사유로 실제와 다를 수 있습니다. 본 플랫폼은 정보의 정확성·완전성·최신성을 보증하지 않으며, 방문 전 매장에 직접 확인하시길 권장합니다.',
  },
  {
    icon: "🏢",
    title: "매장 운영에 대한 책임",
    content:
      "플랫폼에 등록된 매장의 운영, 서비스 품질, 안전, 위생 등에 대한 책임은 전적으로 해당 매장에 있습니다. 본 플랫폼은 매장의 영업 행위에 관여하지 않으며, 매장 이용 과정에서 발생하는 손해에 대해 책임을 지지 않습니다.",
  },
  {
    icon: "💬",
    title: "이용자 작성 콘텐츠",
    content:
      "후기, 댓글, 게시글 등 이용자가 작성한 콘텐츠는 해당 이용자 개인의 의견이며, 놀쿨의 공식 입장을 대변하지 않습니다. 이용자 작성 콘텐츠의 진위 여부에 대해 본 플랫폼은 보증하지 않습니다.",
  },
  {
    icon: "🔗",
    title: "외부 링크",
    content:
      "본 플랫폼에 게재되는 외부 웹사이트 링크는 이용자의 편의를 위해 제공됩니다. 본 플랫폼은 외부 웹사이트의 콘텐츠, 개인정보 보호 정책, 보안에 대해 책임을 지지 않습니다.",
  },
  {
    icon: "⚖️",
    title: "법적 준수",
    content:
      "이용자는 플랫폼 이용 시 대한민국 관련 법령을 준수해야 합니다. 본 플랫폼에 게시된 정보를 불법적 용도로 활용하는 것은 엄격히 금지되며, 이로 인한 법적 책임은 이용자 본인에게 있습니다.",
  },
  {
    icon: "🛡️",
    title: "서비스 가용성",
    content:
      "본 플랫폼은 안정적이고 지속적인 운영을 위해 노력하지만, 기술적 오류, 서버 장애, 유지보수 등의 사유로 서비스가 일시적으로 중단될 수 있습니다. 이로 인한 손해에 대해 본 플랫폼은 책임을 지지 않습니다.",
  },
  {
    icon: "💳",
    title: "결제·거래 책임",
    content:
      "본 플랫폼은 매장 정보를 정리·게재하는 인터넷 정보 플랫폼으로, 어떠한 형태의 알선·중개·예약 대행도 수행하지 않습니다. 따라서 매장과 이용자 사이에 발생하는 결제·거래는 양 당사자 간의 직접 거래이며, 본 플랫폼은 이에 관여하거나 책임지지 않습니다. 결제 관련 문제는 해당 매장에 직접 문의하시기 바랍니다.",
  },
  {
    icon: "🔄",
    title: "면책조항의 변경",
    content:
      "본 면책조항은 플랫폼 운영 상황 및 관련 법령의 변경에 따라 수정될 수 있습니다. 변경 시 사이트 내 공지를 통해 고지하며, 변경된 면책조항은 공지된 시점부터 효력이 발생합니다.",
  },
];

export default function DisclaimerPage() {
  useDocumentMeta('법적 고지 및 면책사항', '본 사이트 정보는 참고 목적이며 법적 보증을 하지 않습니다. 업소 정보 변경 시 책임 한계, 사용자 콘텐츠 면책, 외부 링크 책임 범위, 분쟁 시 관할 법원까지 안내.');
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
                본 플랫폼은 나이트라이프 매장에 대한 정보를 정리·게재하는 인터넷 정보 플랫폼입니다.
                게시된 모든 정보는 참고 목적으로만 제공되며, 어떠한 형태의 보증·추천·알선·중개도 의미하지
                않습니다. 본 사이트를 이용함으로써 아래의 면책조항에 동의하는 것으로 간주됩니다.
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
            본 플랫폼은 매장 정보를 모아서 보여주는 인터넷 정보 플랫폼이며, 매장 알선·중개는 하지 않습니다.
            실제 영업 상황과 서비스 품질은 해당 매장에 직접 확인하시기 바랍니다. 모든
            정보는 참고용이며, 이용에 따른 책임은 이용자 본인에게 있습니다.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neon-text-muted">
            문의사항:{" "}
            <span className="font-medium text-neon-primary-light">
              theassetsquare@gmail.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
