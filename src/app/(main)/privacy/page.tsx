import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 일산룸포털",
  description:
    "일산룸포털 개인정보처리방침. 수집항목, 이용목적, 보유기간, 제3자 제공 등 개인정보 처리에 관한 사항을 안내합니다.",
};

const sections = [
  {
    number: 1,
    title: "개인정보의 수집 항목 및 수집 방법",
    subsections: [
      {
        subtitle: "수집 항목",
        items: [
          "필수 항목: 이메일 주소, 비밀번호, 닉네임",
          "선택 항목: 프로필 이미지, 휴대전화번호, 생년월일, 성별",
          "서비스 이용 과정에서 자동 수집: IP 주소, 쿠키, 접속 로그, 기기 정보, 방문 기록",
        ],
      },
      {
        subtitle: "수집 방법",
        items: [
          "회원가입 및 서비스 이용 시 이용자가 직접 입력",
          "소셜 로그인(카카오, 네이버, Google) 연동 시 제공받는 정보",
          "서비스 이용 과정에서 자동으로 생성 및 수집",
        ],
      },
    ],
  },
  {
    number: 2,
    title: "개인정보의 이용 목적",
    items: [
      "회원 가입 및 관리: 본인 확인, 회원 식별, 부정 이용 방지, 서비스 부정 이용 확인",
      "서비스 제공: 맞춤형 업소 정보 제공, 리뷰 및 커뮤니티 운영, 고객 문의 대응",
      "서비스 개선: 이용 통계 분석, 서비스 품질 향상, 신규 기능 개발",
      "마케팅 및 광고: 이벤트 안내, 맞춤형 광고 제공 (별도 동의 시)",
      "법적 의무 이행: 관련 법령에 따른 의무 준수",
    ],
  },
  {
    number: 3,
    title: "개인정보의 보유 및 이용 기간",
    items: [
      "회원 정보: 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)",
      "서비스 이용 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)",
      "접속 로그: 3개월 (통신비밀보호법)",
      "결제 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
      "불만 또는 분쟁 처리 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)",
    ],
  },
  {
    number: 4,
    title: "개인정보의 제3자 제공",
    description:
      "회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.",
    items: [
      "이용자가 사전에 별도 동의한 경우",
      "법령에 의거하거나 수사기관의 요청이 있는 경우",
      "서비스 제공을 위해 필요한 경우 (업소 예약 연동 등) - 이 경우 사전 고지 및 동의를 받습니다",
    ],
  },
  {
    number: 5,
    title: "개인정보의 처리 위탁",
    description:
      "회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.",
    items: [
      "클라우드 서비스 제공: 데이터 저장 및 관리",
      "결제 대행: 결제 처리 및 정산",
      "이메일 발송: 서비스 안내 메일 발송",
      "위탁 계약 시 개인정보보호 관련 법규 준수를 명시하고 있습니다",
    ],
  },
  {
    number: 6,
    title: "개인정보의 파기 절차 및 방법",
    subsections: [
      {
        subtitle: "파기 절차",
        items: [
          "보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.",
          "다른 법령에 따라 보관이 필요한 경우 별도의 DB로 옮겨 일정 기간 보관 후 파기합니다.",
        ],
      },
      {
        subtitle: "파기 방법",
        items: [
          "전자적 파일: 복원이 불가능한 방법으로 영구 삭제",
          "종이 문서: 분쇄기로 분쇄하거나 소각",
        ],
      },
    ],
  },
  {
    number: 7,
    title: "이용자의 권리 및 행사 방법",
    items: [
      "이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.",
      "이용자는 회원 탈퇴를 통해 개인정보 처리 동의를 철회할 수 있습니다.",
      "이용자는 개인정보의 오류에 대한 정정을 요청할 수 있습니다.",
      "이용자는 개인정보 처리 정지를 요구할 수 있습니다.",
      "위 권리 행사는 서비스 내 설정 또는 개인정보 보호 담당자에게 연락하여 가능합니다.",
    ],
  },
  {
    number: 8,
    title: "쿠키의 설치 및 운영",
    items: [
      "회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용합니다.",
      "쿠키는 웹사이트 서버가 이용자의 브라우저에 전송하는 소량의 텍스트 파일입니다.",
      "이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.",
      "쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.",
    ],
  },
  {
    number: 9,
    title: "개인정보의 안전성 확보 조치",
    items: [
      "관리적 조치: 개인정보 접근 권한 관리, 정기적 직원 교육",
      "기술적 조치: 개인정보의 암호화, 보안 프로그램 설치, 접근 통제 시스템 운영",
      "물리적 조치: 전산실 및 자료 보관실 접근 통제",
    ],
  },
  {
    number: 10,
    title: "개인정보 보호 책임자",
    description:
      "회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 이와 관련한 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.",
    items: [
      "개인정보 보호 책임자: 일산룸포털 개인정보보호팀",
      "문의: privacy@neon.com",
      "기타 개인정보 침해에 관한 신고나 상담은 아래 기관에 문의하실 수 있습니다:",
      "개인정보침해 신고센터 (privacy.kisa.or.kr / 118)",
      "대검찰청 사이버수사과 (spo.go.kr / 1301)",
      "경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            개인정보<span className="text-violet-400">처리방침</span>
          </h1>
          <p className="text-lg text-neutral-400">
            일산룸포털은 이용자의 개인정보를 소중히 보호합니다
          </p>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4 text-sm text-neutral-400">
          <span className="font-medium text-neutral-300">시행일:</span> 2026년
          3월 14일 |{" "}
          <span className="font-medium text-neutral-300">최종 수정일:</span>{" "}
          2026년 3월 14일
        </div>

        {/* Introduction */}
        <div className="mb-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 md:p-8">
          <p className="text-sm leading-relaxed text-neutral-300">
            일산룸포털(이하 &quot;회사&quot;)은 개인정보보호법, 정보통신망 이용촉진 및
            정보보호 등에 관한 법률 등 관련 법령에 따라 이용자의 개인정보를
            보호하고 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이
            개인정보처리방침을 수립하여 공개합니다.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <article
              key={section.number}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8"
            >
              <h2 className="mb-4 text-lg font-bold">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-sm font-bold text-violet-400">
                    {section.number}
                  </span>
                  {section.title}
                </span>
              </h2>

              {section.description && (
                <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                  {section.description}
                </p>
              )}

              {section.items && (
                <ul className="space-y-2.5">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed text-neutral-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.subsections &&
                section.subsections.map((sub) => (
                  <div key={sub.subtitle} className="mb-4 last:mb-0">
                    <h3 className="mb-3 text-sm font-semibold text-violet-400">
                      {sub.subtitle}
                    </h3>
                    <ul className="space-y-2.5">
                      {sub.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm leading-relaxed text-neutral-300"
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

        {/* Footer note */}
        <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <p className="text-sm text-neutral-400">
            본 개인정보처리방침에 대해 궁금한 사항이 있으시면{" "}
            <span className="font-medium text-violet-400">privacy@neon.com</span>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
