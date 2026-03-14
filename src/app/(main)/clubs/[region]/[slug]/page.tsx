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
  if (!venue) return { title: '클럽을 찾을 수 없습니다 | 일산룸포털' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 일산룸포털`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치는 어디인가요?`, answer: `${name}의 정확한 위치는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `${name}의 영업시간은?`, answer: `영업시간은 기본정보 탭에서 확인하세요. 대부분의 클럽은 밤 10시 이후 영업합니다.` },
  { question: `${name}의 입장료는 얼마인가요?`, answer: `가격표 탭에서 입장료와 테이블 가격을 확인할 수 있습니다.` },
  { question: `${name}의 드레스코드가 있나요?`, answer: `대부분의 클럽은 스마트 캐주얼 이상을 권장합니다.` },
  { question: `${name}의 음악 장르는?`, answer: `${name}의 메인 장르는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `${name}에 테이블 예약이 가능한가요?`, answer: `테이블 예약 가능 여부와 가격은 가격표 탭에서 확인하세요.` },
  { question: `${name}에 외국인도 입장 가능한가요?`, answer: `대부분의 클럽은 신분증 확인 후 외국인도 입장 가능합니다.` },
  { question: `${name}의 분위기는 어떤가요?`, answer: `${name}의 분위기와 특징은 기본정보 탭에서 확인하세요.` },
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
