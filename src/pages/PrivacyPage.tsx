import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const sections = [
  {
    number: 1,
    title: "이용자 데이터의 수집 항목 및 수집 방법",
    subsections: [
      {
        subtitle: "수집 항목",
        items: [
          "필수 항목(소셜 로그인): 카카오·구글 계정 식별번호, 이메일 주소(제공자가 넘겨주는 경우), 닉네임(없으면 「회원+번호」 자동)",
          "필수 항목(이메일 가입): 이메일 주소, 비밀번호(암호화 저장), 닉네임",
          "동의 기록: 만 19세 이상 확인·이용약관·개인정보 수집 동의 여부와 시각, 선택 동의(서비스 알림·광고성 정보) 여부와 시각",
          "이용 중 생기는 정보: 찜 목록, 주간 투표 기록, 작성한 글·후기, 알림 설정(관심 지역·업종·주간 횟수)",
          "자동 수집: 접속 기록, 쿠키, 기기·브라우저 정보, 방문 기록(Google Analytics·Microsoft Clarity)",
          "받지 않는 정보: 휴대전화번호, 생년월일, 성별, 주민등록번호, 결제 정보",
        ],
      },
      {
        subtitle: "수집 방법",
        items: [
          "회원가입 및 플랫폼 사용 시 이용자가 직접 입력",
          "소셜 로그인(카카오, Google) 연동 시 제공받는 개인자료",
          "본 시스템 활용 과정에서 자동으로 생성 및 수집",
        ],
      },
    ],
  },
  {
    number: 2,
    title: "가입자 개인자료의 활용 활용처",
    items: [
      "회원 식별과 관리: 로그인, 부정 이용·중복 가입 방지, 만 19세 이상 확인 기록",
      "서비스 제공: 찜 목록 저장, 주간 투표(1인 1표), 글·후기·커뮤니티 운영, 문의 대응",
      "서비스 알림(선택 동의 시): 관심 지역·업종의 새 가게·새 글·주간 투표 결과 — 주 최대 3회, 오후 9시~오전 8시에는 보내지 않음",
      "광고성 정보(선택 동의 시): 이벤트·광고주 소식 — 제목에 (광고) 표시, 언제든 한 번에 수신 거부",
      "서비스 개선: 방문 통계 분석(개인을 알아볼 수 없는 형태)",
      "선택 항목에 동의하지 않아도 가입과 이용에 제한이 없습니다.",
    ],
  },
  {
    number: 3,
    title: "회원 데이터의 보유 및 활용 기간",
    items: [
      "회원 정보(계정 식별번호·이메일·닉네임·찜 목록·투표·알림 설정): 회원 탈퇴 시까지 — 탈퇴하면 즉시 파기",
      "동의 기록: 동의를 철회하거나 탈퇴할 때까지 — 철회·탈퇴하면 즉시 파기",
      "작성한 글·후기: 탈퇴 시까지(탈퇴 전 직접 지울 수 있음)",
      "접속 기록: 3개월 (통신비밀보호법)",
    ],
  },
  {
    number: 4,
    title: "이용자 개인자료의 제3자 전달",
    description:
      "회사는 원칙적으로 이용자의 개인 데이터를 제3자에게 제공하지 않습니다. 다만, 다음의 상황에서는 예외로 합니다.",
    items: [
      "가입자가 사전에 별도 동의한 상황",
      "관계법에 의거하거나 수사기관의 요청이 있는 상황",
      "서비스 제공을 위해 필요한 때 (영업점 예약 연동 등) - 이 때 사전 고지 및 동의를 받습니다",
    ],
  },
  {
    number: 5,
    title: "개인 데이터의 처리 위탁",
    description:
      "회사는 서비스 전달을 위해 다음과 같이 사용자 데이터 처리를 위탁합니다.",
    items: [
      "Supabase Inc.: 회원 인증과 데이터 저장",
      "Cloudflare, Inc.: 사이트 전송(호스팅)과 보안",
      "Resend(Plus Five Five, Inc.): 안내 메일 발송",
      "웹 트래픽 분석: Google Analytics(Google LLC)·Microsoft Clarity(Microsoft Corporation) — 방문 통계 및 사용성(스크롤·클릭) 분석 목적으로 쿠키를 통해 접속 로그·기기 정보가 수집되며, 개인을 식별하지 않는 형태로 처리됩니다",
      "위탁 계약 시 개인자료보호 유관 법규 준수를 명시합니다",
    ],
  },
  {
    number: 6,
    title: "사용자 데이터의 파기 절차 및 방법",
    subsections: [
      {
        subtitle: "파기 절차",
        items: [
          "보유 기간이 경과하거나 처리 활용처이 달성된 이용자 개인자료는 지체 없이 파기됩니다.",
          "다른 관계법에 따라 보관이 필요한 때 별도의 DB로 옮겨 일정 기간 보관 후 파기됩니다.",
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
      "가입자는 언제든지 자신의 등록 개인자료를 조회하거나 수정하실 수 있어요.",
      "회원 탈퇴를 하시면 개인 데이터 처리 동의도 함께 철회돼요.",
      "가입자 개인자료에 오류가 있으면 정정을 요청하실 수 있어요.",
      "사용자 데이터 처리 정지도 요구하실 수 있어요.",
      "위 권리 행사는 플랫폼 내 설정 또한 개인자료보호 담당자에게 연락하여 가능합니다.",
    ],
  },
  {
    number: 8,
    title: "쿠키의 설치 및 운영",
    items: [
      "회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용합니다.",
      "쿠키는 웹사이트 서버가 가입자의 브라우저에 전송하는 소량의 텍스트 파일입니다.",
      "분석 쿠키: Google Analytics와 Microsoft Clarity가 방문 통계 및 페이지 사용성 분석을 위해 쿠키를 사용합니다. 이 쿠키는 방문 경로·체류·스크롤·클릭 등 익명 통계 수집에만 쓰이며 개인을 특정하지 않습니다.",
      "브라우저 설정에서 쿠키 저장을 거부하거나 삭제하실 수 있으며, Google Analytics 차단은 Google 애널리틱스 옵트아웃 브라우저 부가기능으로도 가능합니다.",
      "쿠키 저장을 거부할 때 일부 플랫폼 활용에 제한이 생길 수 있으니 유의하시기 바랍니다.",
    ],
  },
  {
    number: 9,
    title: "사용자 개인자료의 안전성 확보 조치",
    items: [
      "관리적 조치: 이용자 개인자료 접근 권한 관리, 정기적 직원 교육",
      "기술적 조치: 개인 데이터 암호화, 보안 프로그램 설치, 접근 통제 시스템 운용",
      "물리적 조치: 전산실 및 자료 보관실 접근 통제",
    ],
  },
  {
    number: 10,
    title: "개인자료보호 책임자",
    description:
      "회사는 가입자 데이터 처리에 관한 업무를 총괄하여 책임지고, 이와 유관된 불만 처리 및 피해 구제를 위해 아래와 같이 개인자료보호 책임자를 지정합니다.",
    items: [
      "개인정보 보호 담당: 놀쿨 운영팀",
      "문의: 카카오톡 besta12(놀쿨 운영 창구)",
      "기타 사용자 개인자료 침해에 대한 신고나 상담은 아래 기관에 문의하실 수 있습니다:",
      "개인개인자료침해 신고센터 (privacy.kisa.or.kr / 118)",
      "대검찰청 사이버수사과 (spo.go.kr / 1301)",
      "경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)",
    ],
  },
];

export default function PrivacyPage() {
  useDocumentMeta('개인정보 수집·이용·파기 안내', '수집 항목·보유 기간·제3자 제공 여부 투명 공개. 개인정보보호법 준수, SSL 암호화, 자동 파기 정책, 회원 탈퇴 시 즉시 삭제. 안전하고 투명한 데이터 처리 방침 전문 공시.');
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            개인정보<span className="text-neon-primary-light">처리방침</span>
          </h1>
          <p className="text-lg text-neon-text-muted">
            놀쿨은 회원의 소중한 개인자료를 안전히 보호합니다
          </p>
        </div>

        {/* Updated date */}
        <div className="mb-10 rounded-xl border border-neon-border bg-neon-surface px-6 py-4 text-sm text-neon-text-muted">
          <span className="font-medium text-neon-text">시행일:</span> 2026년
          3월 14일 |{" "}
          <span className="font-medium text-neon-text">최종 수정일:</span>{" "}
          2026년 9월 24일(수집 항목·동의·알림·위탁처를 실제대로 고침)
        </div>

        {/* Introduction */}
        <div className="mb-10 rounded-2xl border border-violet-500/20 bg-neon-primary-light/5 p-6 md:p-8">
          <p className="text-sm leading-relaxed text-neon-text">
            놀쿨(이하 &quot;회사&quot;)은 개인개인자료보호법, 개인자료통신망 이용촉진 및
            개인자료보호 등에 관한 법률 등 유관 관계법에 따라 이용자의 개인 데이터를
            보호하고 이와 유관한 고충을 신속하게 처리하기 위하여 다음과 같이
            개인개인자료처리방침을 수립하여 공개합니다.
          </p>
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
                  <div key={sub.subtitle} className="mb-4 last:mb-0">
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

        {/* Footer note */}
        <div className="mt-12 rounded-xl border border-neon-border bg-neon-surface p-6 text-center">
          <p className="text-sm text-neon-text-muted">
            본 방침에 대해 궁금한 조건이 있으시면{" "}
            <span className="font-medium text-neon-primary-light">카카오톡 besta12</span>
            으로 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
