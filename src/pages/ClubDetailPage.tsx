import { useParams, Navigate } from 'react-router-dom';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', apgujeong: '압구정', sinchon: '신촌', geondae: '건대',
  busan: '부산', daegu: '대구', daejeon: '대전', incheon: '인천', gwangju: '광주', suwon: '수원', jeju: '제주',
};

const defaultFaqs = (name: string) => [
  { question: `${name} 위치와 가까운 역은?`, answer: `주소와 교통편은 상세 페이지에서 확인하세요. 지도에서 카카오맵 길찾기도 됩니다.` },
  { question: `영업시간이 궁금해요`, answer: `운영 시간은 페이지 상단에 안내됩니다. 대부분 밤 10시 이후 영업합니다.` },
  { question: `입장료는 얼마인가요?`, answer: `가격표를 참고하세요. 입장료와 테이블 가격이 정리되어 있습니다.` },
  { question: `드레스코드가 있나요?`, answer: `스마트 캐주얼 이상을 권장합니다. 장소별 규정이 다르니 확인하세요.` },
  { question: `음악 장르는?`, answer: `메인 장르와 분위기는 소개글에서 확인할 수 있습니다.` },
  { question: `테이블 예약이 되나요?`, answer: `예약 가능 여부와 가격은 가격표를 참고하세요.` },
  { question: `외국인도 입장 가능한가요?`, answer: `신분증 확인 후 외국인도 입장 가능합니다.` },
  { question: `${name} 처음 방문 팁은?`, answer: `직원에게 안내를 요청하시면 친절히 도와드립니다. 첫 방문 가이드도 참고하세요.` },
];

export default function ClubDetailPage() {
  const { region, slug } = useParams<{ region: string; slug: string }>();
  const venue = getVenueBySlug(slug!);
  if (!venue || venue.category !== 'club') return <Navigate to="/404" replace />;

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
