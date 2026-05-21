import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const legalSections = [
  {
    icon: '⚖️',
    title: '서비스 성격',
    body:
      '본 서비스는 전국 야간 문화 매장에 대한 정보를 정리·게재하는 인터넷 정보 플랫폼입니다. 방문자가 직접 매장을 선택·이용·결제하는 데에 참고할 수 있는 자료를 제공할 뿐, 어떠한 형태의 알선·중개·예약 대행도 수행하지 않습니다. 가게의 영업 행위와 본 플랫폼의 정보 게재 행위는 명확히 분리되어 있습니다.',
  },
  {
    icon: '📜',
    title: '준수하는 국내 법령',
    body:
      '본 플랫폼은 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「개인정보 보호법」, 「청소년 보호법」, 「전자상거래 등에서의 소비자보호에 관한 법률」을 비롯한 대한민국 관련 법령을 준수합니다. 콘텐츠 운영은 방송통신심의위원회 권고 사항을 참고하여 자체 검수 절차를 두고 있으며, 위법·유해 게시물이 확인될 경우 즉시 비공개 처리합니다.',
  },
  {
    icon: '🛡️',
    title: '청소년 보호',
    body:
      '본 사이트는 야간 문화 정보를 다루는 특성상 만 19세 이상 이용자를 대상으로 운영됩니다. 회원 가입·후기 작성·커뮤니티 활동은 만 19세 이상 본인 확인을 거친 회원에게만 허용되며, 비회원도 정보 열람은 가능하나 게시·신고 기능은 제한됩니다. 청소년에게 부적절한 단어·이미지는 노출되지 않도록 단어 필터와 콘텐츠 검수 절차를 운영합니다.',
  },
  {
    icon: '📝',
    title: '콘텐츠 운영 원칙',
    body:
      '본 플랫폼에 게시되는 매장 소개·후기·매거진은 운영진의 자체 작성 또는 검증된 회원의 작성을 원칙으로 합니다. 가공된 통계, 출처 없는 매출 변화율, 사전 조율 후기, 거짓 평점은 게재하지 않으며, 발견 시 즉시 삭제합니다. 광고성 콘텐츠는 광고임을 명시하고, 본문과 분리하여 표기합니다.',
  },
  {
    icon: '🚫',
    title: '금지 행위',
    body:
      '회원·비회원을 불문하고 불법 정보 게재, 타인 비방, 명예훼손, 음란물·불법촬영물 업로드, 도박·마약·매매춘 알선, 개인정보 유출, 외부 결제 유도, 사기·피싱 시도는 모두 금지됩니다. 위반 시 사전 통보 없이 게시물 삭제 및 계정 영구 정지가 적용되며, 사안에 따라 수사기관에 신고됩니다.',
  },
  {
    icon: '🔐',
    title: '개인정보 보호',
    body:
      '본 플랫폼은 본명·주민등록번호를 수집하지 않습니다. 닉네임, 이메일, 통신사 본인 확인 토큰만 보관하며, 수집한 정보는 회원 탈퇴 시 즉시 파기됩니다. 자세한 처리 방침은 개인정보 처리방침 페이지에서 확인하실 수 있습니다.',
  },
  {
    icon: '📮',
    title: '신고·문의 창구',
    body:
      '불법 콘텐츠, 권리침해, 광고성 도배, 청소년 유해정보, 개인정보 침해 등 문제가 있는 게시물은 각 게시물의 신고 버튼 또는 운영팀 이메일로 접수해 주십시오. 영업일 기준 24시간 이내 1차 조치, 7일 이내 처리 결과 회신을 원칙으로 합니다.',
  },
  {
    icon: '🏢',
    title: '운영 주체와 책임 범위',
    body:
      '본 플랫폼은 인터넷 정보 게재업으로 운영되며, 매장의 실제 영업 행위·서비스 품질·요금 정산·내부 분쟁에는 관여하지 않습니다. 매장 이용 중 발생하는 사고·분쟁·환불 등은 해당 매장과 이용자 간의 직접 해결을 원칙으로 합니다.',
  },
];

export default function LegalPage() {
  useDocumentMeta(
    '법적 준수 안내 — 정보통신망법·청소년보호법·개인정보보호법',
    '본 플랫폼이 준수하는 국내 법령과 운영 원칙을 한 페이지에서 확인하세요. 청소년 보호, 콘텐츠 검수, 개인정보 처리, 신고 창구까지 운영 책임 범위를 투명하게 공개합니다.',
  );

  return (
    <div className="min-h-screen bg-neon-bg text-neon-text">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">법적 준수 안내</h1>
          <p className="text-lg text-neon-text-muted">
            본 플랫폼이 따르는 국내 법령과 운영 원칙을 투명하게 공개합니다.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h2 className="mb-2 font-bold text-emerald-400">한 줄 요약</h2>
              <p className="text-sm leading-relaxed text-neon-text">
                만 19세 이상 이용자를 대상으로, 국내 법령과 방송통신심의위원회 권고를 따르는 인터넷 정보 플랫폼입니다.
                불법·유해 콘텐츠, 가공된 통계와 가짜 후기를 배제하고, 매장 알선·중개 행위는 일절 하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-neon-border bg-neon-surface px-6 py-4 text-sm text-neon-text-muted">
          <span className="font-medium text-neon-text">최종 업데이트:</span> 2026년 5월 21일
        </div>

        <div className="space-y-6">
          {legalSections.map((section, i) => (
            <article
              key={i}
              className="rounded-2xl border border-neon-border bg-neon-surface p-6 md:p-8"
            >
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed text-neon-text">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-violet-500/20 bg-neon-primary-light/5 p-6 md:p-8 text-center">
          <h2 className="mb-4 text-xl font-bold text-neon-primary-light">관련 페이지</h2>
          <ul className="mx-auto max-w-2xl text-sm leading-relaxed text-neon-text space-y-2">
            <li>
              <a className="underline" href="/privacy/">개인정보 처리방침</a> — 수집 항목·보유 기간·파기 절차
            </li>
            <li>
              <a className="underline" href="/terms/">이용약관</a> — 가입·활동·탈퇴 시 적용되는 회원 권리·의무
            </li>
            <li>
              <a className="underline" href="/disclaimer/">법적 고지·면책</a> — 정보의 정확성과 책임 한계
            </li>
            <li>
              <a className="underline" href="/safety/">안전 가이드</a> — 음주·귀가·긴급 연락처
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-neon-text-muted">
          신고·문의:{' '}
          <span className="font-medium text-neon-primary-light">theassetsquare@gmail.com</span>
        </div>
      </div>
    </div>
  );
}
