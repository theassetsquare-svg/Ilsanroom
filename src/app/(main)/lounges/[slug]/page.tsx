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
  { question: `${name}의 위치와 가는 방법이 궁금해요`, answer: `정확한 위치는 기본정보 탭에서 확인하세요. 지도 탭에서 카카오맵 경로 안내도 이용 가능합니다.` },
  { question: `라운지 영업시간은 어떻게 되나요?`, answer: `영업시간은 기본정보 탭에서 확인하세요. 방문 전 전화로 확인을 권장합니다.` },
  { question: `라운지 드레스코드가 따로 있나요?`, answer: `보통 스마트 캐주얼 이상을 권장합니다. 자세한 사항은 기본정보 탭을 참고하세요.` },
  { question: `칵테일이나 주류 메뉴가 다양한가요?`, answer: `다양한 칵테일과 프리미엄 주류를 제공합니다. 메뉴·서비스 탭에서 상세 내용을 확인하세요.` },
  { question: `예약 없이 방문해도 되나요?`, answer: `워크인 방문도 가능하지만 사전 예약을 권장합니다. 하단 전화 버튼을 이용하세요.` },
  { question: `이용 요금은 어느 정도인가요?`, answer: `가격표 탭에서 확인할 수 있습니다. 이벤트나 시즌에 따라 변동될 수 있으니 업소에 직접 확인하세요.` },
  { question: `프라이빗 공간이나 단체석이 있나요?`, answer: `단체 이용 가능 여부와 프라이빗 공간 유무는 업소에 직접 문의해 주세요.` },
  { question: `${name}의 전체적인 분위기는 어떤가요?`, answer: `이곳의 인테리어와 분위기는 기본정보 탭에서 확인할 수 있습니다. 리뷰 탭에서 방문 후기도 참고하세요.` },
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
