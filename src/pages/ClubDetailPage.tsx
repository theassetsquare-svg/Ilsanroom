import { useParams, Navigate } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', apgujeong: '압구정', sinchon: '신촌', geondae: '건대',
  busan: '부산', daegu: '대구', daejeon: '대전', incheon: '인천', gwangju: '광주', suwon: '수원', jeju: '제주',
};

const defaultFaqs = (name: string) => [
  { question: `${name} 입장 가능 나이와 신분증 검사 방식은?`, answer: `만 19세 이상만 입장 가능하며, 입구에서 주민등록증·운전면허증·여권 중 하나를 반드시 제시해야 합니다. 모바일 신분증은 업소마다 인정 여부가 다르므로 실물 신분증을 준비하세요.` },
  { question: `음악 장르별 특징과 DJ 타임테이블은?`, answer: `보통 오픈 시간에는 EDM·하우스 위주로 시작하고, 자정 이후 메인 DJ가 힙합·트랩·테크노 등 메인 장르를 진행합니다. 특별 게스트 DJ가 출연하는 날은 SNS 공지를 통해 사전 안내됩니다.` },
  { question: `드레스코드 구체적 예시가 궁금해요 (OK/NG)`, answer: `셔츠·블라우스·깔끔한 원피스·구두·부츠는 OK이며, 슬리퍼·반바지·트레이닝복·후드티는 입장이 거절될 수 있습니다. 올블랙 코디가 무난하고 가장 선호되는 스타일입니다.` },
  { question: `테이블석과 스탠딩석의 차이는 뭔가요?`, answer: `테이블석은 지정 좌석에서 편하게 즐길 수 있고 음료를 세팅받는 반면, 스탠딩석은 플로어에서 자유롭게 움직이며 바에서 직접 음료를 주문합니다. 테이블석은 최소 주문 금액 조건이 있는 경우가 많습니다.` },
  { question: `재입장이 가능한가요?`, answer: `대부분의 클럽은 손등 스탬프나 팔찌를 통해 당일 재입장을 허용합니다. 다만 일부 특별 이벤트나 페스티벌 파티에서는 재입장이 제한될 수 있으니 입장 시 직원에게 미리 체크해 둬.` },
  { question: `생일 파티 예약은 어떻게 하나요?`, answer: `보통 1~2주 전에 전화나 카카오톡으로 인원·예산·희망 테이블 위치를 알려주면 됩니다. 케이크 반입 허용, LED 전광판 축하 메시지, 샴페인 서비스 등을 제공하는 곳도 있습니다.` },
  { question: `피크 타임과 한산한 시간대는 언제인가요?`, answer: `금·토요일 자정~새벽 2시가 가장 붐비는 피크 타임이며, 오픈 직후인 밤 10~11시는 비교적 널널하게 들어갑니다. 평일은 수요일·목요일 레이디스 나이트 같은 깜짝 이벤트가 있는 날이 활발합니다.` },
  { question: `주변 주차장과 대리운전은 이용 가능한가요?`, answer: `클럽 주변 공영주차장이나 민영주차장을 이용할 수 있습니다. 귀가 시 카카오T 대리나 클럽 앞 대리운전 기사를 쉽게 잡을 수 있습니다.` },
];

export default function ClubDetailPage() {
  const { region, slug } = useParams<{ region: string; slug: string }>();
  const venue = getVenueBySlug(slug!);
  if (!venue || venue.category !== 'club') return <Navigate to="/404" replace />;
  useDocumentMeta(getHookingTitle(venue) + '', getHookingDescription(venue), getVenueOgImageBySlug(venue.slug));
  const regionKo = regionNames[region!] || region!;
  const related = getRelatedVenues(venue, 6);

  return (
    <VenueDetailPage
      venue={venue}
      categoryLabel="클럽"
      categoryPath="/clubs"
      regionKo={regionKo}
      regionPath={`/clubs/${region}`}
      detailPath={`/clubs/${region}/${slug}`}
      faqs={defaultFaqs(venue.nameKo)}
      related={related}
      relatedHrefFn={(v) => `/clubs/${v.region}/${v.slug}`}
    />
  );
}
