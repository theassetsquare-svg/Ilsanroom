import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('lounge').map((v) => ({ slug: v.slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '라운지를 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치는 어디인가요?`, answer: `이 업소의 정확한 위치는 기본정보 탭에서 확인하세요.` },
  { question: `영업시간이 궁금해요`, answer: `영업시간은 기본정보 탭에서 확인하세요. 방문 전 전화로 확인을 권장합니다.` },
  { question: `드레스코드가 있나요?`, answer: `라운지는 보통 스마트 캐주얼 이상을 권장합니다.` },
  { question: `${name}에서 칵테일을 즐길 수 있나요?`, answer: `대부분의 라운지에서 다양한 칵테일과 주류를 제공합니다.` },
  { question: `예약은 어떻게 하나요?`, answer: `전화를 통해 예약이 가능합니다. 하단 전화 버튼을 이용하세요.` },
  { question: `가격대가?`, answer: `가격표 탭에서 확인할 수 있습니다.` },
  { question: `단체 이용이 가능한가요?`, answer: `단체 이용 가능 여부는 업소에 직접 문의해 주세요.` },
  { question: `분위기는 어떤가요?`, answer: `기본정보 탭에서 확인할 수 있습니다.` },
];

export default async function LoungeDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'lounge') notFound();

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
