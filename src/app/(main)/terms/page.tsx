import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - 본사",
  description: "본사 시스템 이용약관. 시스템 이용 조건, 회원 책무, 책임 제한 등을 안내시행합니다.",
};

const articles = [
  {
    number: "제1조",
    title: "취지",
    content:
      '이 약관은 본사(이하 "회사")이 공급하는 나이트라이프 데이터 서비스(이하 "서비스")의 이용과 연관하여 회사와 사용자 간의 권리, 책무 및 책임항목, 기타 필요한 항목을 규정함을 취지으로 시행합니다.',
  },
  {
    number: "제2조",
    title: "정의",
    items: [
      '"서비스"란 회사가 공급하는 나이트라이프 입점업체 데이터, 감상문, 커뮤니티 등 연관 제반 서비스를 의미시행합니다.',
      '"이용자"란 본 약관에 따라 시스템을 이용하는 회원 및 비회원을 말시행합니다.',
      '"회원"이란 본 시스템에 가입하여 회원 계정을 부여받은 자를 말시행합니다.',
      '"게시글"란 사이트 내에 게시된 텍스트, 이미지, 감상문 등 일체의 데이터를 말시행합니다.',
    ],
  },
  {
    number: "제3조",
    title: "약관의 효력 및 개정",
    items: [
      "본 약관은 사이트 화면에 게시하거나 기타의 방법으로 사용자에게 공지함으로써 효력이 발생시행합니다.",
      "당사는 연관 법규을 저촉하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 최소 7일 전에 공지시행합니다.",
      "개정된 약관에 동의하지 않는 이용자는 웹사이트 이용을 중단하고 탈퇴할 수 해당시행합니다.",
    ],
  },
  {
    number: "제4조",
    title: "웹사이트 기능 공급",
    items: [
      "당사는 다음의 기능을 공급시행합니다: 나이트라이프 입점업체 데이터 공급, 회원 감상문 및 평가 기능, 커뮤니티 게시판 진행, 기타 진행사가 정하는 기능.",
      "본 시스템은 연중무휴, 1일 24시간 공급을 원칙으로 시행합니다. 단, 시스템 점검 등의 사유로 일시 중단될 수 해당시행합니다.",
      "진행사는 플랫폼의 내용을 개정하거나 중단할 수 있으며, 이 때 사전에 공지시행합니다.",
    ],
  },
  {
    number: "제5조",
    title: "회원가입 및 계정",
    items: [
      "사용자는 진행사가 정한 양식에 따라 회원데이터를 기입한 후 본 약관에 동의함으로써 회원가입을 신청시행합니다.",
      "플랫폼은 회원가입 신청자가 다음 각 호에 해당하는 상황에서 승인을 거부할 수 해당시행합니다: 실명이 아닌 때, 타인의 데이터를 도용한 때, 이전에 회원자격을 상실한 상황.",
      "회원은 가입 시 등록한 데이터에 개정이 있는 상황에서 즉시 수정하여야 시행합니다.",
      "회원은 자신의 계정과 비밀번호를 관리할 책임이 있으며, 제3자에게 이를 양도하거나 대여할 수 없습니다.",
    ],
  },
  {
    number: "제6조",
    title: "이용자의 책무",
    items: [
      "회원는 관계 법규, 본 약관, 플랫폼 이용안내 등을 준수하여야 시행합니다.",
      "사용자는 다음 행위를 하여서는 안 됩니다: 타인의 데이터 도용, 허위데이터 게시, 음란 혹은 불법적 게시글 게시, 플랫폼 진행 방해, 타인의 명예 훼손, 영리 취지의 홍보물 무단 게시.",
      "이용자는 본 시스템을 경유하여 얻은 데이터를 당사의 사전 동의 없이 상업적으로 이용할 수 없습니다.",
    ],
  },
  {
    number: "제7조",
    title: "콘텐츠의 관리",
    items: [
      "회원가 게시한 콘텐츠에 대한 책임은 해당 사용자에게 해당시행합니다.",
      "당사는 연관 법규에 저촉되거나 약관을 저촉하는 콘텐츠를 사전 통지 없이 삭제하거나 이동시킬 수 해당시행합니다.",
      "이용자가 게시한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다. 단, 진행사는 플랫폼 진행 취지으로 해당 콘텐츠를 사용할 수 있는 비독점적 라이선스를 갖습니다.",
    ],
  },
  {
    number: "제8조",
    title: "책임의 제한",
    items: [
      "플랫폼은 입점업체 데이터의 정확성, 완전성, 신뢰성을 보증하지 않습니다. 입점업체 데이터는 참고용으로만 공급됩니다.",
      "당사는 사용자 간 혹은 이용자와 입점업체 간의 이견에 대해 개입할 책무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.",
      "진행사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로 인한 본 시스템 중단에 대해 책임을 지지 않습니다.",
      "플랫폼은 회원가 본 시스템을 이용하여 기대하는 이익을 얻지 못한 것에 대해 책임을 지지 않습니다.",
    ],
  },
  {
    number: "제9조",
    title: "회원 탈퇴 및 자격 상실",
    items: [
      "회원은 언제든지 플랫폼 내 설정을 경유하여 탈퇴를 요청할 수 있으며, 당사는 즉시 처리시행합니다.",
      "진행사는 회원이 본 약관을 저촉한 사유가 있을 때 사전 통보 후 회원 자격을 제한 혹은 상실시킬 수 해당시행합니다.",
      "탈퇴 시 회원이 작성한 콘텐츠는 삭제되지 않을 수 있으며, 삭제를 원하는 경우 탈퇴 전 직접 삭제하여야 시행합니다.",
    ],
  },
  {
    number: "제10조",
    title: "이견 해결 및 관할",
    items: [
      "본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.",
      "플랫폼 이용과 연관하여 당사와 사용자 간에 발생한 이견에 대해서는 민사소송법상의 관할법원에 소를 제기할 수 해당시행합니다.",
      "당사와 이용자 간의 이견은 상호 협의에 의해 해결함을 원칙으로 시행합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            이용<span className="text-neon-primary-light">약관</span>
          </h1>
          <p className="text-lg text-neon-text-muted">
            본사 플랫폼 이용약관
          </p>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neon-border bg-neon-surface px-6 py-4 text-sm text-neon-text-muted">
          <span className="font-medium text-neon-text">최종 수정일:</span>{" "}
          2026년 3월 14일
        </div>

        {/* Articles */}
        <div className="space-y-8">
          {articles.map((article) => (
            <article
              key={article.number}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 md:p-8"
            >
              <h2 className="mb-4 text-lg font-bold">
                <span className="text-neon-primary-light">{article.number}</span>{" "}
                ({article.title})
              </h2>

              {article.content && (
                <p className="text-sm leading-relaxed text-neon-text">
                  {article.content}
                </p>
              )}

              {article.items && (
                <ol className="space-y-3">
                  {article.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm leading-relaxed text-neon-text"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neon-primary/20 text-xs font-medium text-neon-primary-light">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-xl border border-violet-500/20 bg-neon-primary-light/5 p-6 text-center">
          <p className="text-sm text-neon-text-muted">
            본 약관에 대해 궁금한 항목이 있으시면{" "}
            <span className="font-medium text-neon-primary-light">support@neon.com</span>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
