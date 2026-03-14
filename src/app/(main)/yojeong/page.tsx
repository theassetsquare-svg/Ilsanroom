import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '요정 | 일산룸포털 - 일산명월관요정·전국 전통 요정 한정식',
  description:
    '전국 전통 요정 정보. 일산명월관요정, 서울 삼청동요정 등 한정식 코스와 국악 공연을 즐기는 격조 높은 공간. 비즈니스 접대, 가족 기념일 장소를 일산룸포털에서 찾아보세요.',
};

const regions = [
  { key: 'ilsan', label: '일산' }, { key: 'jongno', label: '종로' }, { key: 'gangnam', label: '강남' },
  { key: 'yeouido', label: '여의도' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'suwon', label: '수원' }, { key: 'gwangju', label: '광주' }, { key: 'jeju', label: '제주' },
];

export default function YojeongPage() {
  const venues = getVenuesByCategory('yojeong');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '요정' }]} />
      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">요정</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            요정은 한국 전통 한정식 코스 요리와 국악 라이브 공연을 함께 제공하는 격조 높은 전통 문화 공간입니다.
            프라이빗 룸에서 한복을 입은 직원의 정갈한 서비스를 받으며, 가야금·해금·대금 등 전통 악기의
            선율과 함께 식사를 즐기는 것이 요정 문화의 핵심입니다. 비즈니스 접대, VIP 미팅, 돌잔치,
            환갑·칠순 잔치, 상견례 등 격식이 필요한 자리에 최적의 공간으로 활용되어 왔습니다.
            일산명월관요정은 고양시 일산동구 장항로 895-1에 위치한 일산 대표 요정으로,
            총 30개 프라이빗 룸과 정찰제 한정식을 운영하며 신실장이 전반을 총괄합니다.
            과거 종로 삼청각, 대원각 등이 유명했으나 현재 대부분 문화 공간으로 전환되었으며,
            전통 요정 형태로 운영되는 곳은 전국에 많지 않아 희소성이 높은 업종입니다.
            방문 시 세미 포멀 이상의 복장을 권장하며, 사전 예약이 필수입니다.
          </p>
        </div>
      </div>
      <VenueListClient venues={venues} hrefPattern="/yojeong/{region}/{slug}" regions={regions} />
    </div>
  );
}
