import { useParams , Navigate } from 'react-router-dom';

import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';

const defaultFaqs = (name: string) => [
  { question: `${name} 이용 절차와 시스템은 어떻게 되나요?`, answer: `입장 후 룸에 안내되면 담당 호스트가 배정됩니다. 음료를 주문하고 대화·게임·노래 등을 함께 즐기는 방식이며, 이용 시간은 보통 2시간 기본 세트로 운영됩니다. 첫 방문이라면 입구에서 시스템 안내를 받을 수 있습니다.` },
  { question: `지명과 역지명이 뭔가요?`, answer: `지명은 고객이 원하는 호스트를 선택하는 것이고, 역지명은 호스트가 고객을 선택하여 다시 찾아오는 것입니다. 지명 시 추가 비용이 발생할 수 있으며, 인기 호스트는 사전 예약이 필요한 경우도 있습니다.` },
  { question: `음료 가격 체계는 어떻게 구성되나요?`, answer: `기본 세트(음료+안주+호스트 서비스)로 운영되며, 추가 음료·샴페인·선물 등은 별도 비용이 발생합니다. 세트 구성과 가격은 업소마다 차이가 있으므로 입장 전에 명확하게 확인하는 것이 중요합니다.` },
  { question: `혼자 방문해도 괜찮나요?`, answer: `1인 방문 고객이 전체의 절반 이상을 차지할 만큼 일반적입니다. 혼자 오시면 오히려 호스트와 더 깊은 대화를 나눌 수 있고, 부담 없이 편안한 시간을 보내기에 적합합니다.` },
  { question: `안전하게 이용하는 팁이 있나요?`, answer: `이용 전 세트 구성과 총 비용을 반드시 확인하고, 추가 주문 시에도 금액을 미리 물어보세요. 카드 결제를 기본으로 하고, 불편한 상황이 생기면 매니저에게 즉시 알리는 것이 좋습니다.` },
  { question: `영업시간과 추천 방문 시간대는?`, answer: `대부분 저녁 7시~새벽 3시 사이에 운영합니다. 저녁 8~9시에 방문하면 호스트 선택 폭이 넓고 여유로운 분위기를 즐길 수 있으며, 자정 이후에는 분위기가 더 활발해집니다.` },
  { question: `예약 방법과 추천 연락 시기는?`, answer: `전화나 카카오톡으로 당일 오후 3~5시 사이에 예약하는 것이 가장 좋습니다. 주말에는 인기 호스트가 일찍 마감되므로 하루 전 예약을 추천하며, 방문 희망 시간과 인원을 미리 알려주세요.` },
  { question: `주변 교통편과 대리운전은 이용 가능한가요?`, answer: `지하철역 도보권에 위치한 곳이 많고, 늦은 귀가 시에는 카카오T 택시나 업소 앞 대기 택시를 타면 됩니다. 자차 방문 시 인근 유료 주차장을 이용하고 대리운전을 부르는 게 안전합니다.` },
];

export default function HoppaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const venue = getVenueBySlug(slug);
  useDocumentMeta(getHookingTitle(venue!) + ' | 플밤', getHookingDescription(venue!), getVenueOgImageBySlug(venue!.slug));

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
