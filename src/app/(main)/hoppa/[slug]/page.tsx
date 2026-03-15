import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('hoppa').map((v) => ({ slug: v.slug }));
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '호빠를 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치와 찾아가는 방법은?`, answer: `정확한 위치는 기본정보 탭에서 확인하세요. 지도 탭에서 카카오맵 경로 안내도 이용 가능합니다.` },
  { question: `호빠 영업시간은 어떻게 되나요?`, answer: `영업시간은 기본정보 탭에서 확인하세요. 방문 전 전화로 확인하시는 것을 권장합니다.` },
  { question: `처음 방문인데 어떻게 이용하나요?`, answer: `처음 방문하셔도 편안하게 즐기실 수 있습니다. 입장 후 담당 직원이 친절하게 안내해 드립니다.` },
  { question: `호스트 지명이 가능한가요?`, answer: `지명 서비스 운영 여부는 업소마다 다릅니다. 방문 전 전화로 문의하시는 것을 권장합니다.` },
  { question: `이용 요금은 어느 정도인가요?`, answer: `가격표 탭에서 확인할 수 있습니다. 정확한 요금은 방문 시 변동될 수 있으니 업소에 직접 확인하세요.` },
  { question: `예약 없이 방문해도 되나요?`, answer: `워크인 방문도 가능하지만 주말이나 피크 시간대에는 사전 예약을 권장합니다. 하단 전화 버튼을 이용하세요.` },
  { question: `단체 방문이나 생일 파티도 가능한가요?`, answer: `단체 이용 및 파티 가능 여부는 업소에 직접 문의해 주세요. 사전 예약 시 맞춤 서비스를 받을 수 있습니다.` },
  { question: `${name}의 전반적인 분위기는 어떤가요?`, answer: `이곳의 분위기와 특징은 기본정보 탭에서 확인할 수 있습니다. 리뷰 탭에서 실제 방문 후기도 참고하세요.` },
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
