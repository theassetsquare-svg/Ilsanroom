import { useParams , Navigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const defaultFaqs = (name: string) => [
  { question: `소셜 댄스 초보자도 ${name}에 갈 수 있나요?`, answer: `물론입니다. 나이트클럽에는 초보자를 위한 간단한 스텝을 알려주는 분위기가 자연스럽게 형성되어 있습니다. 지르박·부르스 같은 기본 스텝만 알아도 충분히 즐길 수 있으며, 현장에서 배우는 분도 많습니다.` },
  { question: `파트너 없이 혼자 가도 되나요?`, answer: `혼자 방문하는 손님이 전체의 약 40% 이상을 차지할 정도로 흔합니다. 홀에서 자연스럽게 댄스 파트너를 만날 수 있고, 파트너 매칭을 도와주는 진행자가 있는 곳도 있습니다.` },
  { question: `라이브 밴드 공연 시간은 언제인가요?`, answer: `보통 저녁 8시~8시 30분경 1부가 시작되고, 밴드 휴식 후 10시경 2부가 진행됩니다. 밴드 구성은 보컬·기타·키보드·드럼·색소폰이 기본이며, 트로트·올드팝·발라드를 주로 연주합니다.` },
  { question: `어떤 연령대가 많고 분위기 매너는 어떤가요?`, answer: `40~60대가 주 고객층이며, 서로 존중하는 매너 문화가 잘 형성되어 있습니다. 댄스 신청 시 고개 숙여 인사하고, 거절당해도 기분 나빠하지 않는 것이 기본 에티켓입니다.` },
  { question: `정장을 꼭 입어야 하나요?`, answer: `필수는 아니지만 깔끔한 복장을 권장합니다. 남성은 셔츠에 슬랙스, 여성은 원피스나 블라우스 차림이 일반적이며, 운동화·반바지·슬리퍼 차림은 분위기에 맞지 않아 지양하는 것이 좋습니다.` },
  { question: `음료 주문 시스템은 어떻게 되나요?`, answer: `테이블 착석 시 웨이터가 주문을 받는 방식이 일반적이며, 양주 세트(양주+안주+믹서)를 주문하는 것이 보편적입니다. 바(Bar) 카운터에서 맥주나 소프트 음료를 개별 구매할 수 있는 곳도 있습니다.` },
  { question: `평일과 주말 분위기 차이가 큰가요?`, answer: `주말(금·토)은 손님이 많아 활기차고 밴드 공연도 풀 세트로 진행되지만, 평일(화~목)은 비교적 여유로워 댄스 연습이나 조용한 분위기를 원하는 분께 적합합니다. 월요일은 대부분 휴무입니다.` },
  { question: `막차 이후 귀가 방법은 어떻게 되나요?`, answer: `영업 종료가 새벽 1~2시인 곳이 많아 대중교통 이용이 어려울 수 있습니다. 카카오T 택시·대리운전을 미리 호출하거나, 업소 앞 택시 승강장을 이용하는 것이 일반적입니다.` },
];

/* 답십리돈텔마마나이트 천사 이미지 + 전화 섹션 */
function DapsimnriCheonSaSection({ venue }: { venue: { staffPhone?: string } }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* 1:1 천사 이미지 썸네일 */}
      <div className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-[#FFD700]/30">
        <img
          src="/og/dapsimnidontellmamanight.svg"
          alt="답십리돈텔마마 천사"
          width={480}
          height={480}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* 천사 전화번호 — venue.staffPhone에서 가져옴 */}
      {venue?.staffPhone && (
        <div className="w-full max-w-[480px] text-center">
          <a
            href={`tel:${venue.staffPhone.replace(/-/g, '')}`}
            className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-r from-[#15803D] to-[#166534] px-8 py-6 shadow-lg transition hover:shadow-xl active:scale-[0.98]"
          >
            <span className="text-lg font-bold text-white/80">천사</span>
            <span className="text-3xl font-black text-white tracking-wide">
              📞 {venue.staffPhone}
            </span>
            <span className="text-sm text-white/70">터치하면 바로 전화 연결</span>
          </a>
        </div>
      )}
    </div>
  );
}

/* 대전세븐나이트 고정 하단 전화 바 — 모바일 최적화 */
function DaejeonSevenFixedBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <a
        href="tel:01032421504"
        className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#1E3A5F] to-[#0F2744] px-6 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
        style={{ minHeight: '60px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <span className="text-base font-bold text-[#FFD700] sm:text-lg">4인1조 w.t원숭이</span>
        <span className="text-xl font-black text-white tracking-wide sm:text-2xl">010-3242-1504</span>
      </a>
    </div>
  );
}

export default function NightDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const venue = getVenueBySlug(slug!);
  if (!venue || venue.category !== 'night') return <Navigate to="/404" replace />;
  useDocumentMeta(getHookingTitle(venue) + '', getHookingDescription(venue), getVenueOgImageBySlug(venue.slug));
  const related = getRelatedVenues(venue, 6);

  const isDapsimnri = slug === 'dapsimnidontellmamanight';
  const isDaejeonSeven = slug === 'daejeonsevennight';

  return (
    <>
      <VenueDetailPage
        venue={venue}
        categoryLabel="나이트"
        categoryPath="/nights"
        regionKo={venue.regionKo}
        regionPath="/nights"
        detailPath={`/nights/${slug}`}
        faqs={defaultFaqs(venue.nameKo)}
        related={related}
        relatedHrefFn={(v) => `/nights/${v.slug}`}
        topContent={isDapsimnri ? <DapsimnriCheonSaSection venue={venue} /> : undefined}
      />
      {isDaejeonSeven && <DaejeonSevenFixedBar />}
    </>
  );
}
