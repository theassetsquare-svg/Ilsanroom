import { useParams , Navigate } from 'react-router-dom';

import VenueDetailPage from '@/components/venue/VenueDetailPage';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getHookingTitle, getHookingDescription } from '@/lib/seo-hooks';
import { getVenueOgImageBySlug } from '@/lib/og-image';
import { pageCardOf, pageCardJpg } from '@/lib/venue-file-ver'; // [일산76-1] 쪽 카드 표 — 광고 카드가 걸린 가게 쪽은 og:image 도 그 카드(프리렌더 withPageCard · VenueHero 첫 그림과 같은 파일)
import { getVenueBySlug, getRelatedVenues } from '@/data/venues';

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', ilsan: '일산', cheongdam: '청담', geondae: '건대',
  suwon: '수원', busan: '부산', daegu: '대구', daejeon: '대전', incheon: '인천', bundang: '분당', anyang: '안양',
};

const defaultFaqs = (name: string) => [
  { question: `${name}의 최소·최대 인원 구성은 어떻게 되나요?`, answer: `방마다 들어가는 인원이 다릅니다. 예약할 때 인원을 먼저 알려 주고 맞는 방이 있는지 확인하는 게 확실합니다.` }, // [일산76-1 · 2026-11-13] 옛 「2인부터 30인 넘게」 = 룸 가게 둘 자료에 근거 없는 숫자라 뺌
  { question: `예약 없이 워크인 방문도 가능한가요?`, answer: `평일 이른 시간대에는 워크인 입장이 가능한 경우가 많지만, 금·토요일이나 연말 시즌에는 빈 룸이 없을 확률이 높습니다. 최소 당일 오후에는 전화로 잔여 룸을 확인하는 것이 좋습니다.` },
  { question: `룸 크기와 시설 차이가 궁금해요`, answer: `기본 룸에는 소파·테이블·가라오케 기기가 갖춰져 있고, VIP 룸은 넓은 공간에 전용 화장실·대형 TV·고급 음향 시스템이 추가됩니다. 업소에 따라 다트·보드게임 등 부대시설 갖춘 룸도 있어.` },
  { question: `음식 반입이나 별도 주문이 가능한가요?`, answer: `외부 음식 반입은 대부분 안 되고, 룸 안에서 자체 메뉴(안주·과일·디저트)를 주문하면 됩니다. 케이크 등 기념일 용품은 사전 협의하면 반입을 허용하는 곳이 많으니 미리 물어보세요.` },
  { question: `비즈니스 접대 시 추천 코스가 있나요?`, answer: `VIP 룸을 예약하고 고급 양주 세트와 안주 코스를 주문하는 게 보통입니다. 담당 매니저에게 접대 목적이라고 말하면 서비스 수준과 룸 분위기를 한 단계 높여 준비해 줍니다.` },
  { question: `시간 연장은 어떻게 하고 추가 비용은?`, answer: `기본 이용 시간은 보통 2~3시간이고, 30분이나 1시간 단위로 늘릴 수 있어. 연장 요금은 기본의 반~동일 수준인데, 금토 피크 때는 뒷팀이 있어서 연장 안 되는 경우도 있으니 미리 물어봐.` },
  { question: `여성 전용 서비스가 따로 있나요?`, answer: `일부 업소에서는 여성 전용 룸, 여성 할인 이벤트, 레이디스 나이트 등을 운영합니다. 여성 고객 안심 서비스로 여성 매니저 배정이나 안전 귀가 택시 호출을 지원하는 곳도 있습니다.` },
  { question: `취소·환불 정책은 어떻게 되나요?`, answer: `대부분 방문 당일 2~3시간 전까지 무료 취소가 가능하며, 노쇼(No-show) 시 예약금 환불이 불가한 곳이 많습니다. 정확한 취소 규정은 예약 시 담당자에게 반드시 확인해봐.` },
];

export default function RoomDetailPage() {
  const { region, slug } = useParams<{ region: string; slug: string }>();
  const venue = getVenueBySlug(slug!);
  // [놀쿨12-2 · P39·P40] 훅은 일찍 돌아가기(Navigate) 전에 — 같은 쪽 틀에서 잘못된 주소 → 맞는 주소로 옮길 때 React 오류 #310(훅 수가 달라짐)이 나던 것
  const valid = !!venue && venue.category === 'room';
  // [일산76-1 · 대표님 2026-11-13 13:30] 쪽 카드(PAGE_CARD · kind 'ad')가 걸린 가게 쪽은 og:image 도 그 카드 파일 — 프리렌더가 박은 값을 수화 뒤 가게 카드(홈·목록용 3줄 판)로 덮어쓰지 않게 한다(호빠 틀의 놀쿨61-1 과 같은 길)
  const pageCard = valid ? pageCardOf(`/rooms/${region}/${slug}/`) : null;
  const ogImage = valid ? (pageCard && pageCard.kind === 'ad' ? `https://nolcool.com${pageCardJpg(pageCard.file)}` : getVenueOgImageBySlug(venue!.slug)) : undefined;
  useDocumentMeta(valid ? getHookingTitle(venue!) + '' : '', valid ? getHookingDescription(venue!) : '', ogImage);
  if (!valid || !venue) return <Navigate to="/404" replace />;

  const regionKo = region ? regionNames[region] || region : '';
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
