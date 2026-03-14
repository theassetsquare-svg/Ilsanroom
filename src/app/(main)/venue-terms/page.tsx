import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "업소 등록 약관 - 오늘밤어디",
  description:
    "오늘밤어디 업소 등록 약관. 업소 등록 조건, 콘텐츠 가이드라인, 금지 사항, 결제 조건을 안내합니다.",
};

const sections = [
  {
    number: 1,
    title: "총칙",
    items: [
      '본 약관은 오늘밤어디(이하 "플랫폼")에 업소 정보를 등록하고자 하는 사업자(이하 "등록 업소")와 플랫폼 간의 권리, 의무 및 책임사항을 규정합니다.',
      "등록 업소는 본 약관에 동의함으로써 플랫폼의 서비스를 이용할 수 있습니다.",
      "본 약관에서 정하지 않은 사항은 관련 법령 및 플랫폼의 이용약관에 따릅니다.",
    ],
  },
  {
    number: 2,
    title: "등록 자격 및 절차",
    items: [
      "업소 등록은 사업자등록증을 보유한 적법한 사업자만 신청할 수 있습니다.",
      "등록 신청 시 다음 정보를 제출해야 합니다: 사업자등록번호, 대표자명, 업소명, 소재지, 연락처, 영업 관련 인허가 서류.",
      "플랫폼은 제출된 정보를 검토한 후 등록 승인 여부를 결정합니다. 심사 기간은 영업일 기준 3~5일입니다.",
      "허위 정보를 제출하거나 관련 법령을 위반하는 업소는 등록이 거부되거나 사후에 삭제될 수 있습니다.",
    ],
  },
  {
    number: 3,
    title: "콘텐츠 가이드라인",
    description:
      "등록 업소가 플랫폼에 게시하는 모든 콘텐츠는 다음 가이드라인을 준수해야 합니다.",
    subsections: [
      {
        subtitle: "필수 정보",
        items: [
          "업소명 (실제 상호와 일치해야 합니다)",
          "정확한 소재지 및 영업시간",
          "업종 및 제공 서비스 설명",
          "대표 이미지 (실제 업소 사진이어야 합니다)",
        ],
      },
      {
        subtitle: "콘텐츠 품질 기준",
        items: [
          "사진은 최소 800x600px 이상의 해상도를 권장합니다",
          "업소 설명은 정확하고 성실하게 작성해야 합니다",
          "가격 정보는 실제 현장 가격과 일치해야 합니다",
          "허위 또는 과장된 정보를 게시할 수 없습니다",
        ],
      },
    ],
  },
  {
    number: 4,
    title: "금지 콘텐츠",
    description:
      "다음에 해당하는 콘텐츠는 게시가 엄격히 금지되며, 위반 시 즉시 삭제 및 계정 제재 조치가 이루어집니다.",
    items: [
      "성적으로 노골적이거나 선정적인 콘텐츠",
      "불법 행위를 조장하거나 암시하는 콘텐츠",
      "타인의 저작권, 초상권, 개인정보를 침해하는 콘텐츠",
      "인종, 성별, 종교, 장애 등에 대한 차별적 콘텐츠",
      "허위 리뷰 작성 또는 리뷰 조작을 유도하는 콘텐츠",
      "경쟁 업소를 비방하거나 허위 사실을 유포하는 콘텐츠",
      "개인 연락처(전화번호 등)를 노출하는 콘텐츠 (공식 연락처 제외)",
    ],
  },
  {
    number: 5,
    title: "결제 및 이용 요금",
    subsections: [
      {
        subtitle: "요금 체계",
        items: [
          "기본 등록: 무료 (기본 업소 정보 게시)",
          "프리미엄 등록: 월 정액제 (상위 노출, 프로모션 배너, 상세 통계 제공)",
          "광고 상품: 별도 협의 (메인 페이지 노출, 이벤트 프로모션 등)",
        ],
      },
      {
        subtitle: "결제 조건",
        items: [
          "유료 서비스는 월 단위로 결제되며, 매월 동일 일자에 자동 결제됩니다.",
          "결제 수단: 신용카드, 계좌이체, 사업자 세금계산서 발행 가능",
          "환불: 결제일로부터 7일 이내, 서비스 미이용 시 전액 환불 가능",
          "서비스 이용 중 해지 시 당월 말까지 서비스 이용 후 종료",
        ],
      },
    ],
  },
  {
    number: 6,
    title: "업소 정보 관리 의무",
    items: [
      "등록 업소는 영업시간, 가격, 서비스 내용 등 정보에 변경이 있을 경우 24시간 이내에 수정해야 합니다.",
      "임시 휴업 또는 폐업 시 즉시 플랫폼에 통보해야 합니다.",
      "정보 미갱신으로 인해 이용자에게 발생하는 불편이나 손해에 대한 책임은 등록 업소에 있습니다.",
      "플랫폼은 정보가 장기간 갱신되지 않은 업소를 비활성화하거나 삭제할 수 있습니다.",
    ],
  },
  {
    number: 7,
    title: "리뷰 및 평가 관리",
    items: [
      "등록 업소는 이용자의 리뷰에 공식 답변을 작성할 수 있습니다.",
      "리뷰에 대한 답변은 정중하고 건설적으로 작성해야 합니다.",
      "허위 리뷰에 대해서는 플랫폼에 신고할 수 있으며, 검토 후 조치합니다.",
      "리뷰 조작(자작 리뷰, 대가성 리뷰 요청 등)이 확인될 경우 등록이 해지될 수 있습니다.",
    ],
  },
  {
    number: 8,
    title: "계약 해지 및 등록 삭제",
    items: [
      "등록 업소는 언제든지 등록 해지를 요청할 수 있으며, 요청 후 영업일 기준 3일 이내에 처리됩니다.",
      "다음 사유에 해당하는 경우 플랫폼은 사전 통보 후 등록을 해지할 수 있습니다: 약관 위반, 허위 정보 반복 게시, 관련 법령 위반, 이용자 민원 누적.",
      "중대한 위반의 경우 즉시 등록 해지 및 향후 재등록이 제한될 수 있습니다.",
      "해지 시 미사용 유료 서비스에 대해서는 일할 계산하여 환불합니다.",
    ],
  },
  {
    number: 9,
    title: "지적재산권",
    items: [
      "등록 업소가 플랫폼에 게시한 콘텐츠의 저작권은 해당 업소에 귀속됩니다.",
      "플랫폼은 서비스 운영 목적으로 해당 콘텐츠를 사용할 수 있는 비독점적, 무상의 라이선스를 갖습니다.",
      "등록 해지 후에도 이미 공개된 콘텐츠(이용자 리뷰 포함)는 플랫폼에 잔존할 수 있습니다.",
    ],
  },
  {
    number: 10,
    title: "면책 및 손해배상",
    items: [
      "플랫폼은 등록 업소와 이용자 간의 분쟁에 대해 중개 의무를 지지 않습니다.",
      "등록 업소의 약관 위반으로 인해 플랫폼에 손해가 발생한 경우, 등록 업소는 이에 대한 배상 책임이 있습니다.",
      "플랫폼의 시스템 장애로 인한 등록 업소의 손실에 대해 플랫폼은 해당 기간의 유료 서비스 이용료를 환불하는 것으로 배상합니다.",
    ],
  },
];

export default function VenueTermsPage() {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            업소 등록 <span className="text-neon-primary-light">약관</span>
          </h1>
          <p className="text-lg text-neon-text-muted">
            오늘밤어디 플랫폼에 업소를 등록하기 위한 이용 약관
          </p>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neon-border bg-neon-surface px-6 py-4 text-sm text-neon-text-muted">
          <span className="font-medium text-neon-text">최종 수정일:</span>{" "}
          2026년 3월 14일
        </div>

        {/* CTA for venue owners */}
        <div className="mb-10 rounded-2xl border border-violet-500/20 bg-neon-primary-light/5 p-6 md:p-8">
          <h2 className="mb-3 text-lg font-bold text-neon-primary-light">
            업소 사장님이신가요?
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-neon-text">
            오늘밤어디에 업소를 등록하고 더 많은 고객에게 다가가세요. 기본 등록은
            무료이며, 프리미엄 서비스를 통해 더 높은 노출 효과를 얻을 수
            있습니다. 등록 전 아래 약관을 반드시 확인해 주세요.
          </p>
          <a
            href="mailto:business@neon.com"
            className="inline-flex rounded-xl bg-neon-primary px-6 py-2.5 text-sm font-medium text-neon-text transition hover:bg-neon-primary-light"
          >
            등록 문의하기
          </a>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <article
              key={section.number}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 md:p-8"
            >
              <h2 className="mb-4 text-lg font-bold">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-primary/20 text-sm font-bold text-neon-primary-light">
                    {section.number}
                  </span>
                  {section.title}
                </span>
              </h2>

              {section.description && (
                <p className="mb-4 text-sm leading-relaxed text-neon-text-muted">
                  {section.description}
                </p>
              )}

              {section.items && (
                <ul className="space-y-2.5">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed text-neon-text"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.subsections &&
                section.subsections.map((sub) => (
                  <div key={sub.subtitle} className="mb-5 last:mb-0">
                    <h3 className="mb-3 text-sm font-semibold text-neon-primary-light">
                      {sub.subtitle}
                    </h3>
                    <ul className="space-y-2.5">
                      {sub.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm leading-relaxed text-neon-text"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </article>
          ))}
        </div>

        {/* Footer contact */}
        <div className="mt-12 rounded-xl border border-neon-border bg-neon-surface p-6 text-center">
          <p className="text-sm text-neon-text-muted">
            업소 등록 관련 문의:{" "}
            <span className="font-medium text-neon-primary-light">
              business@neon.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
