import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImage } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

export function generateStaticParams() {
  return getVenuesByCategory('room').map((v) => ({ region: v.region, slug: v.slug }));
}

interface Props { params: Promise<{ region: string; slug: string }> }

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', ilsan: '일산', cheongdam: '청담', geondae: '건대',
  suwon: '수원', busan: '부산', daegu: '대구', daejeon: '대전', incheon: '인천', bundang: '분당', anyang: '안양',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '룸을 찾을 수 없습니다 | 오늘밤어디' };
  return {
    title: getHookingTitle(venue),
    description: getHookingDescription(venue),
    openGraph: { title: `${venue.nameKo} | 오늘밤어디`, description: venue.shortDescription, images: [{ url: getVenueOgImage(venue.nameKo, venue.category), width: 1200, height: 630 }] },
  };
}

const defaultFaqs = (name: string) => [
  { question: `${name}의 위치와 찾아가는 길이 궁금해요`, answer: `정확한 위치는 기본정보 탭에서 확인할 수 있습니다. 지도 탭에서 카카오맵으로 경로 안내도 가능합니다.` },
  { question: `룸 크기와 수용 인원은 어떻게 되나요?`, answer: `소규모부터 대규모 인원까지 다양한 룸 옵션이 있습니다. 정확한 수용 인원은 업소에 직접 문의해 주세요.` },
  { question: `주차 및 발렛 서비스가 가능한가요?`, answer: `주차 가능 여부와 발렛 서비스 운영 여부는 기본정보 탭에서 확인할 수 있습니다.` },
  { question: `룸 이용 시 드레스코드가 있나요?`, answer: `업소마다 드레스코드 기준이 다릅니다. 기본정보 탭에서 확인하거나 방문 전 전화 문의를 권장합니다.` },
  { question: `예약은 어떻게 하나요?`, answer: `전화 연결을 통해 예약이 가능합니다. 하단의 전화 버튼을 눌러 직접 문의해 주세요.` },
  { question: `이용 요금은 어느 정도인가요?`, answer: `가격표 탭에서 확인할 수 있습니다. 요금은 변동될 수 있으므로 방문 전 업소에 직접 확인하세요.` },
  { question: `단체 모임이나 회식도 가능한가요?`, answer: `단체 이용 가능 여부와 수용 인원은 업소에 직접 문의해 주세요. 사전 예약을 권장합니다.` },
  { question: `${name}의 전반적인 분위기는 어떤가요?`, answer: `이곳의 분위기와 특징은 기본정보 탭에서 확인할 수 있습니다. 실제 방문 후기도 리뷰 탭에서 확인하세요.` },
];

export default async function RoomDetailPage({ params }: Props) {
  const { region, slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'room') notFound();

  const regionKo = regionNames[region] || region;
  const related = getRelatedVenues(venue, 6);

  return (
    <VenueDetailPage
      venue={venue}
      categoryLabel="룸"
      categoryPath="/rooms"
      regionKo={regionKo}
      regionPath={`/rooms/${region}`}
      detailPath={`/rooms/${region}/${slug}`}
      faqs={defaultFaqs(venue.nameKo)}
      related={related}
      relatedHrefFn={(v) => `/rooms/${v.region}/${v.slug}`}
    />
  );
}
