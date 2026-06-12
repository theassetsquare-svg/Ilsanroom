import { useParams , Navigate } from 'react-router-dom';

import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const defaultFaqs = (name: string) => [
  { question: `${name}은 예약 필수인가요, 워크인도 가능한가요?`, answer: `평일 저녁에는 워크인 입장이 비교적 수월하지만, 주말이나 공휴일 전야에는 만석인 경우가 많아 최소 하루 전 예약을 권장합니다. 카카오톡이나 전화로 간편하게 잡으면 됩니다.` },
  { question: `미니멈 차지(최소 주문 금액)가 있나요?`, answer: `대부분의 라운지는 1인당 음료 1잔 이상 주문이 기본이며, 프라이빗 좌석이나 루프탑 구역은 별도의 미니멈 차지가 적용될 수 있습니다. 구체적인 금액은 좌석 유형에 따라 다릅니다.` },
  { question: `프라이빗 공간과 오픈 좌석의 차이점은?`, answer: `오픈 좌석은 바 카운터나 홀에서 자유로운 분위기를 즐기기 좋고, 프라이빗 공간은 파티션이나 별도 룸으로 구획되어 대화에 집중하기 편합니다. 프라이빗 공간은 추가 요금이 발생하는 경우가 일반적입니다.` },
  { question: `시그니처 칵테일 메뉴가 있나요?`, answer: `바텐더가 직접 만드는 시그니처 드링크를 운영하는 곳이 많습니다. 클래식 칵테일부터 매장 고유의 변주까지 라인업은 매장마다 다르니 방문 전 문의해 보면 됩니다.` },
  { question: `비즈니스 미팅 장소로 적합한가요?`, answer: `조용한 프라이빗 좌석과 차분한 음악 볼륨 덕분에 소규모 비즈니스 미팅에 적합합니다. 프로젝터나 스크린이 비치된 공간을 제공하는 곳도 있으니 사전에 문의하면 맞춤 세팅을 받을 수 있습니다.` },
  { question: `운영 시간과 라스트 오더는 언제인가요?`, answer: `대부분 오후 6시~새벽 2시 사이에 운영하며, 라스트 오더는 마감 30분~1시간 전에 마감됩니다. 금·토요일에는 새벽 3시까지 연장 운영하는 곳도 있으니 방문 전 체크해 둬.` },
  { question: `발렛 파킹 서비스를 이용할 수 있나요?`, answer: `무료 또는 유료 발렛 파킹을 운영하는 곳이 많습니다. 운영 여부와 조건은 매장마다 다르니 방문 전 문의해 두면 편합니다.` },
  { question: `단체 이벤트나 프라이빗 파티 예약이 되나요?`, answer: `생일 파티, 기업 행사, 소규모 세미나 등 맞춤형 이벤트도 됩니다. 2주 이상 전에 인원·예산·콘셉트를 알려주면 전담 매니저가 공간 세팅부터 케이터링까지 한 번에 잡아 줍니다.` },
];

export default function LoungeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const venue = getVenueBySlug(slug!);
  if (!venue || venue.category !== 'lounge') return <Navigate to="/404" replace />;
  useDocumentMeta(getHookingTitle(venue) + '', getHookingDescription(venue), getVenueOgImageBySlug(venue.slug));

  const related = getRelatedVenues(venue, 6);

  return (
    <VenueDetailPage
      venue={venue}
      categoryLabel="라운지"
      categoryPath="/lounges"
      regionKo={venue.regionKo}
      regionPath="/lounges"
      detailPath={`/lounges/${slug}`}
      faqs={defaultFaqs(venue.nameKo)}
      related={related}
      relatedHrefFn={(v) => `/lounges/${v.slug}`}
    />
  );
}
