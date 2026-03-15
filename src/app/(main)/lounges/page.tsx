import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '라운지 | 오늘밤어디 - 강남·압구정·이태원 프리미엄 라운지바',
  description: '전국 프리미엄 바 정보. 압구정, 논현, 이태원 칵테일·프라이빗 공간.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/06B6D4/ffffff/png?text=라운지 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'cheongdam', label: '청담' },
  { key: 'busan', label: '부산' }, { key: 'daejeon', label: '대전' },
];

export default function LoungesPage() {
  const venues = getVenuesByCategory('lounge');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '라운지' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">라운지</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            라운지는 고급스러운 인테리어와 조용한 분위기에서 칵테일, 와인, 위스키 등 프리미엄 주류를 즐기며
            대화와 사교를 나누는 공간입니다. 소파석이나 프라이빗 부스에서 편안하게 앉아서 시간을 보내는 것이 특징입니다.
            신사동 일대에 밀집한 프리미엄 바는 세련된 인테리어와 전문 바텐더의 시그니처 칵테일로 유명하며,
            이태원의 프라이빗 공간은 다국적 분위기와 독특한 콘셉트가 매력입니다. 소규모 비즈니스 미팅, 지인 모임,
            커플 데이트 등 목적에 따라 분위기가 다른 이곳을 선택할 수 있습니다.
            대부분 스마트 캐주얼 이상의 복장을 권장하며, 논현·청담 일대에는 프라이빗 룸이 있는 곳도 있으니
            사전에 전화로 좌석 유무를 확인하시는 것이 좋습니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/lounges/{slug}" regions={regions} />

      <FirstVisitGuide category="라운지"
        dress="스마트 캐주얼 이상. 세련된 복장 권장. 운동복·슬리퍼 비추."
        budget="칵테일 1잔 1.5~3만원. 프라이빗 부스는 최소 주문 금액 있을 수 있음."
        alone="혼자 방문 매우 적합. 바 카운터에서 바텐더와 대화하며 칵테일 즐기기."
        reservation="주말 저녁은 사전 예약 권장. 평일은 워크인 가능한 곳이 많음."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '20:00~02:00', level: 85 },
        { day: '토요일', time: '19:00~02:00', level: 90 },
        { day: '목요일', time: '20:00~00:00', level: 50 },
        { day: '수요일', time: '19:00~23:00', level: 30 },
        { day: '일요일', time: '18:00~23:00', level: 40 },
      ]} />

      <CategoryVSBattle venueA="강남라운지아르쥬" venueB="강남라운지하입" topic="압구정 라운지 대결" />

      <RelatedMagazine articles={[
        { title: '논현·청담 프리미엄 바 — 분위기로 고르는 가이드', tag: '추천' },
        { title: '혼자 가기 좋은 프라이빗 공간 TOP5', tag: '혼술' },
      ]} />
    </div>
  );
}
