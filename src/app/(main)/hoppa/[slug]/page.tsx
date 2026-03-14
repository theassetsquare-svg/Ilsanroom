import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('hoppa').map((v) => ({ slug: v.slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '호빠를 찾을 수 없습니다 | 일산룸포털' };
  return {
    title: `${venue.nameKo} 후기,가격,예약 | 일산룸포털`,
    description: venue.description,
    openGraph: { title: `${venue.nameKo} | 일산룸포털`, description: venue.shortDescription },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치는 어디인가요?`, answer: `${name}의 정확한 위치는 기본정보 탭에서 확인하세요.` },
  { question: `${name}의 영업시간은?`, answer: `영업시간은 기본정보 탭에서 확인하세요.` },
  { question: `${name}의 드레스코드가 있나요?`, answer: `깔끔한 복장을 권장합니다.` },
  { question: `${name}의 예약은 어떻게 하나요?`, answer: `전화로 예약 가능합니다. 하단 전화 버튼을 이용하세요.` },
  { question: `${name}의 가격대는?`, answer: `가격표 탭에서 확인할 수 있습니다.` },
  { question: `${name}에 처음 가는데 어떻게 하나요?`, answer: `처음 방문하셔도 편안하게 즐기실 수 있습니다. 직원에게 안내를 요청하세요.` },
  { question: `${name}에 단체 이용이 가능한가요?`, answer: `업소에 직접 문의해 주세요.` },
  { question: `${name}의 분위기는 어떤가요?`, answer: `기본정보 탭에서 확인할 수 있습니다.` },
];

export default async function HoppaDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'hoppa') notFound();

  const related = getRelatedVenues(venue, 6);

  return (
    <VenueDetailPage
      venue={venue}
      categoryLabel="호빠"
      categoryPath="/hoppa"
      regionKo={venue.regionKo}
      regionPath="/hoppa"
      detailPath={`/hoppa/${slug}`}
      faqs={defaultFaqs(venue.nameKo)}
      related={related}
      relatedHrefFn={(v) => `/hoppa/${v.slug}`}
    />
  );
}
