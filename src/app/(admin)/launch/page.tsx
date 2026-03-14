import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "런칭 체크리스트 - 오늘밤어디 관리자",
  description: "오늘밤어디 SaaS 런칭 전 확인 사항",
};

const sections = [
  {
    title: "데이터 & 콘텐츠",
    items: [
      { task: "100+ 업소 데이터 완성", status: "done", note: "101개 업소 등록 완료" },
      { task: "일산룸/명월관 메인 상단 프리미엄 카드", status: "done", note: "프리미엄 2개 상단 노출" },
      { task: "모든 가게이름 SEO (title/H1/JSON-LD)", status: "done", note: "7개 카테고리 상세 페이지 구조화 데이터" },
      { task: "매거진 콘텐츠 8개 시드", status: "done", note: "SEO 아티클 포함" },
      { task: "커뮤니티 6종 게시판 + 샘플 데이터", status: "done", note: "자유/후기/파티/팁/패션/QnA" },
    ],
  },
  {
    title: "AI 검색 & SEO",
    items: [
      { task: "llms.txt AI 크롤러 대응", status: "done", note: "업소/카테고리/API 정보 포함" },
      { task: "robots.txt AI 크롤러 허용", status: "done", note: "GPTBot/Bingbot/ClaudeBot 등" },
      { task: "사이트맵 자동 생성", status: "done", note: "정적+동적(101개 업소) 라우트" },
      { task: "JSON-LD 구조화 데이터", status: "done", note: "WebSite+ItemList+LocalBusiness+FAQ+BreadcrumbList" },
      { task: "네이버/구글/Bing 사이트맵 제출", status: "pending", note: "커스텀 도메인 연결 후 제출" },
      { task: "GA4 + 네이버 전환 추적", status: "pending", note: ".env에 ID 설정 필요" },
    ],
  },
  {
    title: "SaaS & 결제",
    items: [
      { task: "요금제 페이지 (4단계)", status: "done", note: "무료/₩99K/₩299K/₩599K" },
      { task: "토스페이먼츠 정기결제 연동", status: "done", note: "빌링키/재시도/취소 구현" },
      { task: "업주 온보딩 4단계 위저드", status: "done", note: "정보→사진→결제→완료" },
      { task: "업주 대시보드 CMS", status: "done", note: "통계/예약/리뷰/이벤트/구독 관리" },
      { task: "구독 해지 방지 3단계", status: "done", note: "할인→일시정지→최종확인" },
      { task: "토스 Secret Key 설정", status: "pending", note: ".env TOSS_SECRET_KEY" },
    ],
  },
  {
    title: "법적 & 사업",
    items: [
      { task: "이용약관 /terms", status: "done", note: "서비스 조건, 분쟁 해결" },
      { task: "개인정보처리방침 /privacy", status: "done", note: "PIPA 준수" },
      { task: "면책조항 /disclaimer", status: "done", note: "정보 정확성 미보장" },
      { task: "업소 등록 약관 /venue-terms", status: "done", note: "등록 조건, 수수료" },
      { task: "커뮤니티 가이드라인", status: "done", note: "/community/guidelines" },
      { task: "사업자등록증 발급", status: "pending", note: "홈택스 온라인 신청" },
      { task: "통신판매업 신고", status: "pending", note: "정부24 온라인 신청" },
      { task: "사업용 통장 개설", status: "pending", note: "법인/개인 사업자 통장" },
    ],
  },
  {
    title: "인프라 & 성능",
    items: [
      { task: "Cloudflare Pages 배포", status: "done", note: "GitHub 자동 배포" },
      { task: "커스텀 도메인 연결", status: "pending", note: "nightlife.kr 또는 ilsanroom.pages.dev" },
      { task: "SSL 인증서", status: "pending", note: "Cloudflare 자동 발급" },
      { task: "Sentry 에러 모니터링", status: "done", note: "클라이언트+서버 에러 캡처" },
      { task: "모바일 반응형", status: "done", note: "전 페이지 반응형" },
      { task: "다크/라이트 모드", status: "done", note: "토글 + localStorage" },
      { task: "Supabase 연결", status: "pending", note: ".env에 URL/KEY 설정" },
    ],
  },
  {
    title: "마케팅 & 분석",
    items: [
      { task: "Google Ads 리타겟팅", status: "done", note: "픽셀 설치 완료, ID 설정 필요" },
      { task: "네이버 전환 추적", status: "done", note: "WCS 스크립트 설치 완료" },
      { task: "카카오톡 채널", status: "done", note: "플로팅 버튼 설치" },
      { task: "RSS 피드", status: "done", note: "/feed.xml" },
      { task: "소셜 공유 UTM 추적", status: "done", note: "커뮤니티 공유 링크" },
      { task: "A/B 테스트 프레임워크", status: "done", note: "3개 실험 설정" },
    ],
  },
];

const businessEssentials = [
  { item: "사업자등록증", detail: "홈택스(hometax.go.kr)에서 온라인 신청 가능. 업태: 정보통신업, 종목: 포털 및 기타 인터넷 정보매개 서비스업" },
  { item: "통신판매업 신고", detail: "정부24(gov.kr)에서 온라인 신청. 사업자등록증 발급 후 진행. 보통 3~5일 소요" },
  { item: "사업용 통장", detail: "사업자등록증 지참 후 은행 방문. 토스뱅크/카카오뱅크는 온라인 개설 가능" },
  { item: "사업용 카드", detail: "사업용 통장 개설 후 연계 카드 발급. 홈택스에서 사업용 카드로 등록 필수" },
  { item: "부가세 신고", detail: "일반과세자: 1월/7월 반기별 신고. 간이과세자: 1월 연 1회 신고" },
];

const domainStrategy = [
  { domain: "nightlife.kr", desc: ".kr 도메인 - 한국 검색엔진 최적화에 유리" },
  { domain: "ilsanroom.pages.dev", desc: ".com 도메인 - 글로벌 확장성" },
  { domain: "neon.club", desc: ".club 도메인 - 나이트라이프 브랜드 적합" },
];

export default function LaunchChecklistPage() {
  const allItems = sections.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const doneItems = allItems.filter((i) => i.status === "done").length;
  const pendingItems = totalItems - doneItems;
  const progressPercent = Math.round((doneItems / totalItems) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">런칭 체크리스트</h1>
        <p className="mt-2 text-neutral-400">
          오늘밤어디 SaaS 런칭 전 확인 사항
        </p>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-300">전체 진행률</span>
          <span className="text-2xl font-bold text-violet-400">{progressPercent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex gap-6 text-sm text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            완료: {doneItems}개
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            대기: {pendingItems}개
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-600" />
            전체: {totalItems}개
          </span>
        </div>
      </div>

      {/* Section Cards */}
      {sections.map((section) => {
        const sectionDone = section.items.filter((i) => i.status === "done").length;
        const sectionTotal = section.items.length;
        return (
          <div
            key={section.title}
            className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
                {sectionDone}/{sectionTotal}
              </span>
            </div>
            <ul className="divide-y divide-neutral-800/50">
              {section.items.map((item) => (
                <li key={item.task} className="flex items-start gap-3 px-6 py-3.5">
                  {item.status === "done" ? (
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.status === "done" ? "text-neutral-300" : "text-white"
                      }`}
                    >
                      {item.task}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{item.note}</p>
                  </div>
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      item.status === "done"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {item.status === "done" ? "완료" : "대기"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Business Essentials Info Box */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-amber-400">사업 시작 전 필수 사항</h3>
        </div>
        <ul className="space-y-3">
          {businessEssentials.map((be) => (
            <li key={be.item} className="flex gap-3">
              <span className="mt-1 flex-shrink-0 text-amber-500">&#8226;</span>
              <div>
                <p className="text-sm font-medium text-white">{be.item}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{be.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Domain Strategy Info Box */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="h-5 w-5 text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <h3 className="text-lg font-semibold text-violet-400">도메인 전략</h3>
        </div>
        <div className="space-y-2 mb-4">
          {domainStrategy.map((d) => (
            <div key={d.domain} className="flex items-center gap-3 rounded-lg bg-neutral-900/50 px-4 py-2.5">
              <code className="text-sm font-mono text-violet-300">{d.domain}</code>
              <span className="text-xs text-neutral-400">{d.desc}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-neutral-900/50 p-4">
          <p className="text-sm font-medium text-neutral-300 mb-2">Cloudflare Pages 설정 순서</p>
          <ol className="space-y-1.5 text-xs text-neutral-400">
            <li>1. Cloudflare Dashboard &rarr; Pages &rarr; 프로젝트 선택</li>
            <li>2. Custom domains &rarr; Set up a custom domain</li>
            <li>3. 도메인 입력 후 DNS 레코드 자동 설정 확인</li>
            <li>4. SSL/TLS &rarr; Full (strict) 모드 활성화</li>
            <li>5. 배포 후 https://도메인 접속 확인</li>
          </ol>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{doneItems}</p>
          <p className="mt-1 text-sm text-neutral-400">완료 항목</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center">
          <p className="text-3xl font-bold text-amber-400">{pendingItems}</p>
          <p className="mt-1 text-sm text-neutral-400">대기 항목</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center">
          <p className="text-3xl font-bold text-violet-400">{progressPercent}%</p>
          <p className="mt-1 text-sm text-neutral-400">진행률</p>
        </div>
      </div>
    </div>
  );
}
