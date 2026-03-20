import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: { absolute: '룸 | 오늘밤어디 - 일산룸·해운대고구려·전국 프라이빗 공간' },
  description: '방음 완비된 독립 공간에서 모임·회식·비즈니스까지. 일산룸부터 해운대고구려 60개+ 정찰제 공간까지 전국 비교.',
  openGraph: { images: [{ url: 'https://ilsanroom.pages.dev/api/og?title=오늘밤어디&subtitle=밤문화+정보&bg=%238B5CF6', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'ilsan', label: '일산' }, { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' },
  { key: 'geondae', label: '건대' }, { key: 'suwon', label: '수원' }, { key: 'bundang', label: '분당' },
  { key: 'anyang', label: '안양' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'incheon', label: '인천' },
];

export default function RoomsPage() {
  const venues = getVenuesByCategory('room');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '룸' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">룸</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            완전히 분리된 독립 공간에서 소규모 모임, 비즈니스 미팅, 회식, 생일파티까지 진행하는 프라이빗 업종입니다.
            홀이나 부스와 달리 개별 공간이 벽으로 완전 분리되어 프라이버시가 보장되고,
            각각 사운드 시스템과 조명이 독립 설치되어 있습니다.
            일산 지역 대표 프리미엄 공간부터 해운대 마린시티 60개+ 대형 업소까지 전국에 다양한 콘셉트가 있으며,
            인원과 예산에 맞게 사전 예약 후 방문하시면 최적의 서비스를 받을 수 있습니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/rooms/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="프라이빗 공간"
        dress="캐주얼~비즈니스 캐주얼. 모임 목적에 맞게 조절."
        budget="공간 이용료 + 음료. 업소마다 다름. 사전 전화 문의 필수."
        alone="보통 2인 이상 이용. 1인 가능 여부 업소에 확인."
        reservation="사전 예약 필수. 원하는 크기의 공간을 확보하려면 미리 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '19:00~01:00', level: 90 },
        { day: '토요일', time: '18:00~01:00', level: 95 },
        { day: '목요일', time: '19:00~23:00', level: 65 },
        { day: '수요일', time: '19:00~23:00', level: 45 },
        { day: '일요일', time: '17:00~22:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="일산룸" venueB="해운대고구려" topic="프리미엄 독립 공간 대결" />

      <RelatedMagazine articles={[
        { title: '비즈니스 접대에 최적인 독립 공간 가이드', tag: '비즈니스' },
        { title: '해운대고구려 — 마린시티 60개 개별 공간의 비밀', tag: '부산' },
      ]} />
    </div>
  );
}
