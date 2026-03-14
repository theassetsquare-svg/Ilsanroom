import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('night').map((v) => ({ slug: v.slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '나이트를 찾을 수 없습니다 | 일산룸포털' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 일산룸포털`, description: venue.shortDescription },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치는 어디인가요?`, answer: `${name}의 정확한 위치는 기본정보 탭에서 확인할 수 있습니다. 지도 탭에서 카카오맵으로도 확인 가능합니다.` },
  { question: `${name}의 영업시간은?`, answer: `영업시간은 기본정보 탭에서 확인하세요. 방문 전 전화로 확인하시는 것을 권장합니다.` },
  { question: `${name}에 주차가 가능한가요?`, answer: `주차 가능 여부는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `${name}의 드레스코드가 있나요?`, answer: `나이트클럽마다 드레스코드가 다릅니다. 기본정보 탭에서 확인하거나 방문 전 전화 문의를 권장합니다.` },
  { question: `${name}에서 소셜 댄스를 즐길 수 있나요?`, answer: `대부분의 나이트클럽에서 소셜 댄스를 즐길 수 있습니다. 라이브 밴드와 DJ 음악에 맞춰 다양한 춤을 즐겨보세요.` },
  { question: `${name}의 연령대는 어떻게 되나요?`, answer: `연령대 정보는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `${name}의 가격대는?`, answer: `가격표 탭에서 확인할 수 있습니다. 정확한 가격은 업소에 직접 확인하세요.` },
  { question: `${name}에 처음 가는데 어떻게 하나요?`, answer: `처음 방문하시는 분도 편안하게 즐기실 수 있습니다. 직원에게 안내를 요청하시면 친절하게 도와드립니다.` },
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
