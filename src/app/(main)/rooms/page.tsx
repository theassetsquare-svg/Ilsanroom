import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '룸 | 일산룸포털 - 일산룸·해운대고구려·전국 프라이빗 룸',
  description: '전국 프라이빗 룸 정보. 일산룸, 해운대고구려, 강남룸 등 지역별 룸 시설 리스트.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/F59E0B/ffffff/png?text=룸 | 일산룸포털', width: 1200, height: 630 }] },
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
            룸은 프라이빗한 독립 공간에서 소규모 모임, 비즈니스 미팅, 회식, 생일파티 등을 즐길 수 있는 업소입니다.
            홀이나 부스와 달리 완전히 분리된 개별 공간을 제공하여 프라이버시가 보장되며,
            룸마다 사운드 시스템과 조명이 독립적으로 설치되어 있습니다.
            일산룸은 신실장(총책임자)이 운영하는 일산 대표 프리미엄 룸이며,
            해운대고구려는 부산 마린시티에 위치한 룸 60개+ 대형 업소로 정찰제 운영과 픽업 서비스를 제공합니다.
            강남, 홍대, 건대 등 서울 주요 지역과 수원, 부산, 대구 등 전국에 다양한 콘셉트의 룸이 있습니다.
            인원과 예산에 맞는 룸을 선택하여 사전 예약 후 방문하시면 최적의 서비스를 받을 수 있습니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/rooms/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="룸"
        dress="캐주얼~비즈니스 캐주얼. 모임 목적에 맞게 조절."
        budget="룸 이용료 + 음료. 업소마다 다름. 사전 전화 문의 필수."
        alone="보통 2인 이상 이용. 1인 가능 여부 업소에 확인."
        reservation="사전 예약 필수. 원하는 크기의 룸을 확보하려면 미리 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '19:00~01:00', level: 90 },
        { day: '토요일', time: '18:00~01:00', level: 95 },
        { day: '목요일', time: '19:00~23:00', level: 65 },
        { day: '수요일', time: '19:00~23:00', level: 45 },
        { day: '일요일', time: '17:00~22:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="일산룸" venueB="해운대고구려" topic="프리미엄 룸 대결" />

      <RelatedMagazine articles={[
        { title: '비즈니스 접대에 최적인 프리미엄 룸 가이드', tag: '비즈니스' },
        { title: '해운대고구려 — 부산 룸 60개의 비밀', tag: '부산' },
      ]} />
    </div>
  );
}
