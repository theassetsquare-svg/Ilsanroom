import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - 오늘밤어디",
  description: "오늘밤어디 서비스 이용약관. 서비스 이용 조건, 회원 의무, 책임 제한 등을 안내합니다.",
};

const articles = [
  {
    number: "제1조",
    title: "목적",
    content:
      '이 약관은 오늘밤어디(이하 "회사")이 제공하는 나이트라이프 정보 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    number: "제2조",
    title: "정의",
    items: [
      '"서비스"란 회사가 제공하는 나이트라이프 업소 정보, 리뷰, 커뮤니티 등 관련 제반 서비스를 의미합니다.',
      '"이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.',
      '"회원"이란 서비스에 가입하여 이용자 계정을 부여받은 자를 말합니다.',
      '"콘텐츠"란 서비스 내에 게시된 텍스트, 이미지, 리뷰 등 일체의 정보를 말합니다.',
    ],
  },
  {
    number: "제3조",
    title: "약관의 효력 및 변경",
    items: [
      "본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.",
      "회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 최소 7일 전에 공지합니다.",
      "변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.",
    ],
  },
  {
    number: "제4조",
    title: "서비스의 제공",
    items: [
      "회사는 다음의 서비스를 제공합니다: 나이트라이프 업소 정보 제공, 이용자 리뷰 및 평가 기능, 커뮤니티 게시판 운영, 기타 회사가 정하는 서비스.",
      "서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 단, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.",
      "회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.",
    ],
  },
  {
    number: "제5조",
    title: "회원가입 및 계정",
    items: [
      "이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.",
      "회사는 회원가입 신청자가 다음 각 호에 해당하는 경우 승인을 거부할 수 있습니다: 실명이 아닌 경우, 타인의 정보를 도용한 경우, 이전에 회원자격을 상실한 경우.",
      "회원은 가입 시 등록한 정보에 변경이 있는 경우 즉시 수정하여야 합니다.",
      "회원은 자신의 계정과 비밀번호를 관리할 책임이 있으며, 제3자에게 이를 양도하거나 대여할 수 없습니다.",
    ],
  },
  {
    number: "제6조",
    title: "이용자의 의무",
    items: [
      "이용자는 관계 법령, 본 약관, 서비스 이용안내 등을 준수하여야 합니다.",
      "이용자는 다음 행위를 하여서는 안 됩니다: 타인의 정보 도용, 허위정보 게시, 음란 또는 불법적 콘텐츠 게시, 서비스 운영 방해, 타인의 명예 훼손, 영리 목적의 광고 무단 게시.",
      "이용자는 서비스를 통해 얻은 정보를 회사의 사전 동의 없이 상업적으로 이용할 수 없습니다.",
    ],
  },
  {
    number: "제7조",
    title: "콘텐츠의 관리",
    items: [
      "이용자가 게시한 콘텐츠에 대한 책임은 해당 이용자에게 있습니다.",
      "회사는 관련 법령에 위반되거나 약관을 위반하는 콘텐츠를 사전 통지 없이 삭제하거나 이동시킬 수 있습니다.",
      "이용자가 게시한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다. 단, 회사는 서비스 운영 목적으로 해당 콘텐츠를 사용할 수 있는 비독점적 라이선스를 갖습니다.",
    ],
  },
  {
    number: "제8조",
    title: "책임의 제한",
    items: [
      "회사는 업소 정보의 정확성, 완전성, 신뢰성을 보증하지 않습니다. 업소 정보는 참고용으로만 제공됩니다.",
      "회사는 이용자 간 또는 이용자와 업소 간의 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.",
      "회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.",
      "회사는 이용자가 서비스를 이용하여 기대하는 이익을 얻지 못한 것에 대해 책임을 지지 않습니다.",
    ],
  },
  {
    number: "제9조",
    title: "회원 탈퇴 및 자격 상실",
    items: [
      "회원은 언제든지 서비스 내 설정을 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 처리합니다.",
      "회사는 회원이 본 약관을 위반한 경우 사전 통보 후 회원 자격을 제한 또는 상실시킬 수 있습니다.",
      "탈퇴 시 회원이 작성한 콘텐츠는 삭제되지 않을 수 있으며, 삭제를 원하는 경우 탈퇴 전 직접 삭제하여야 합니다.",
    ],
  },
  {
    number: "제10조",
    title: "분쟁 해결 및 관할",
    items: [
      "본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.",
      "서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 대해서는 민사소송법상의 관할법원에 소를 제기할 수 있습니다.",
      "회사와 이용자 간의 분쟁은 상호 협의에 의해 해결함을 원칙으로 합니다.",
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
            오늘밤어디 서비스 이용약관
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
            본 약관에 대해 궁금한 사항이 있으시면{" "}
            <span className="font-medium text-neon-primary-light">support@neon.com</span>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
