import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('club').map((v) => ({ region: v.region, slug: v.slug }));
}

interface Props { params: Promise<{ region: string; slug: string }> }

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', apgujeong: '압구정', sinchon: '신촌', geondae: '건대',
  busan: '부산', daegu: '대구', daejeon: '대전', incheon: '인천', gwangju: '광주', suwon: '수원', jeju: '제주',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '클럽을 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name} 위치와 가까운 역은?`, answer: `정확한 주소와 교통편은 기본정보 탭에서 확인하세요. 지도 탭에서 카카오맵 길찾기도 가능합니다.` },
  { question: `영업시간이 궁금해요`, answer: `영업시간은 기본정보 탭에서 확인하세요. 대부분 밤 10시 이후 영업합니다.` },
  { question: `입장료는 얼마인가요?`, answer: `가격표 탭에서 입장료와 테이블 가격을 확인할 수 있습니다.` },
  { question: `드레스코드가 있나요?`, answer: `스마트 캐주얼 이상을 권장합니다. 기본정보 탭에서 상세 확인 가능합니다.` },
  { question: `음악 장르는?`, answer: `메인 장르와 분위기는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `테이블 예약이 가능한가요?`, answer: `예약 가능 여부와 가격은 가격표 탭에서 확인하세요.` },
  { question: `외국인도 입장 가능한가요?`, answer: `신분증 확인 후 외국인도 입장 가능합니다.` },
  { question: `${name} 처음 방문 팁은?`, answer: `직원에게 안내를 요청하시면 친절히 도와드립니다. 첫 방문 가이드도 참고해 주세요.` },
];

export default async function ClubDetailPage({ params }: Props) {
  const { region, slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'club') notFound();

  const regionKo = regionNames[region] || region;
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
