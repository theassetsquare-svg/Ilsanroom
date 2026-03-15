import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('night').map((v) => ({ slug: v.slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '나이트를 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치와 교통편은?`, answer: `주소와 가까운 역은 상세 페이지에서 확인하세요. 지도에서 카카오맵 길찾기도 됩니다.` },
  { question: `영업시간이 궁금해요`, answer: `운영 시간은 페이지 상단에 표시됩니다. 방문 전 전화로 재확인을 권장합니다.` },
  { question: `주차가 가능한가요?`, answer: `주차 가능 여부는 페이지에 안내되어 있습니다. 대부분 인근 공영주차장을 이용합니다.` },
  { question: `드레스코드가 있나요?`, answer: `장소마다 복장 규정이 다릅니다. 방문 전 전화로 확인하시면 확실합니다.` },
  { question: `소셜 댄스를 즐길 수 있나요?`, answer: `대부분의 댄스홀에서 트로트·사교댄스를 즐길 수 있습니다. 라이브 밴드와 함께 다양한 춤을 즐겨보세요.` },
  { question: `주요 연령대는?`, answer: `연령대는 장소별로 다릅니다. 상세 안내를 참고하세요.` },
  { question: `가격대가 어떻게 되나요?`, answer: `가격표를 참고하세요. 정확한 금액은 직접 문의하시기 바랍니다.` },
  { question: `${name}에 처음 방문하는데 팁이 있나요?`, answer: `처음이시라면 직원에게 안내를 요청하세요. 편안하게 즐기실 수 있도록 도와드립니다.` },
];

export default async function NightDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'night') notFound();

  const related = getRelatedVenues(venue, 6);

  return (
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
    />
  );
}
