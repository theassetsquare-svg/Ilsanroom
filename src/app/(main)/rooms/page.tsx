import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '룸 | 일산룸포털 - 일산룸·강남룸·전국 프라이빗 룸 정보',
  description:
    '전국 프라이빗 룸 정보. 일산룸, 강남룸, 수원룸, 부산룸 등 지역별 룸 시설 리스트. 비즈니스 모임, 소규모 회식에 적합한 프라이빗 공간을 일산룸포털에서 찾아보세요.',
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '룸' }]} />
      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">룸</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            룸은 프라이빗한 독립 공간에서 소규모 모임, 비즈니스 미팅, 회식, 생일파티 등을 즐길 수 있는 업소입니다.
            홀이나 부스와 달리 완전히 분리된 개별 공간을 제공하여 프라이버시가 보장되며,
            룸마다 사운드 시스템과 조명이 독립적으로 설치되어 있는 것이 일반적입니다.
            일산룸은 신실장(총책임자)이 운영하는 일산 대표 프리미엄 룸으로,
            경기 서북부 지역에서 비즈니스 접대와 모임 장소로 오랫동안 사랑받아왔습니다.
            강남, 홍대, 건대 등 서울 주요 지역에도 다양한 콘셉트의 룸이 있으며,
            수원, 분당, 부산, 대구 등 전국 각지에서도 지역 특색에 맞는 룸 문화가 형성되어 있습니다.
            인원과 예산에 맞는 룸을 선택하여 사전 예약 후 방문하시면 최적의 서비스를 받을 수 있습니다.
          </p>
        </div>
      </div>
      <VenueListClient venues={venues} hrefPattern="/rooms/{region}/{slug}" regions={regions} />
    </div>
  );
}
