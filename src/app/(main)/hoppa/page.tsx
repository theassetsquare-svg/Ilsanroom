import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '호빠 | 오늘밤어디 - 강남·부산·장안동 호스트바 정보',
  description: '전국 호빠(호스트바) 정보. 강남호빠로얄, 부산호빠스타, 장안동호빠빵빵 등 호스트클럽 리스트.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/EC4899/ffffff/png?text=호빠 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'sinsa', label: '신사' },
  { key: 'itaewon', label: '이태원' }, { key: 'seoul', label: '서울' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
];

export default function HoppaPage() {
  const venues = getVenuesByCategory('hoppa');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '호빠' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">호빠</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            호빠(호스트바)는 전문 남성 호스트가 여성 고객에게 대화, 음료 서비스, 엔터테인먼트를 제공하는
            여성 전용 유흥 공간입니다. 프라이빗 룸이나 부스에서 1:1 또는 소그룹 형태로 호스트와 함께
            시간을 보내는 것이 주된 이용 방식입니다. 강남은 대형 호스트클럽이 가장 밀집한 지역이며,
            부산은 해운대·서면 등에 분포해 있고, 장안동은 동북 서울의 가성비 좋은 호빠로 알려져 있습니다.
            각 업소마다 콘셉트와 분위기가 다르며, 사전 전화 상담을 통해 인원과 목적에 맞는
            서비스를 안내받을 수 있습니다. 처음 방문하시는 분은 직원에게 안내를 요청하시면
            친절하게 이용 방법을 알려드립니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />

      <FirstVisitGuide category="호빠"
        dress="깔끔한 복장이면 충분. 너무 캐주얼하지만 않으면 됨."
        budget="업소마다 다름. 사전 전화 상담으로 예상 비용 확인 권장."
        alone="혼자 또는 소그룹 방문 가능. 직원이 안내."
        reservation="사전 전화 상담 권장. 주말은 예약이 빠르게 찰 수 있음."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~03:00', level: 85 },
        { day: '토요일', time: '21:00~04:00', level: 95 },
        { day: '목요일', time: '21:00~01:00', level: 50 },
        { day: '수요일', time: '21:00~00:00', level: 30 },
        { day: '일요일', time: '20:00~00:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="강남호빠로얄" venueB="부산호빠스타" topic="호빠 양대 산맥" />

      <RelatedMagazine articles={[
        { title: '호빠 처음 가는 분을 위한 완벽 가이드', tag: '입문' },
        { title: '강남 vs 부산 호빠 — 분위기와 가격 비교', tag: '비교' },
      ]} />
    </div>
  );
}
