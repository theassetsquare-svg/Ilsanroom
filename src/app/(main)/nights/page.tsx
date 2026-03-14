import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '나이트 | 일산룸포털 - 전국 나이트클럽 소셜댄스 정보',
  description:
    '전국 나이트클럽 정보. 강남·수원·부산·대구·인천 나이트. 부킹 시스템, 부스/룸/테이블/홀, 라이브 밴드, 소셜 댄스 정보를 일산룸포털에서 확인하세요.',
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'seoul', label: '서울' }, { key: 'ilsan', label: '일산' },
  { key: 'suwon', label: '수원' }, { key: 'seongnam', label: '성남' }, { key: 'incheon', label: '인천' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'gwangju', label: '광주' }, { key: 'ulsan', label: '울산' }, { key: 'paju', label: '파주' },
  { key: 'changwon', label: '창원' }, { key: 'jeonju', label: '전주' }, { key: 'jeju', label: '제주' },
];

export default function NightsPage() {
  const venues = getVenuesByCategory('night');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '나이트' }]} />

      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">나이트</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            나이트클럽(나이트)은 소셜 댄스를 중심으로 운영되는 사교 공간으로, 클럽과는 완전히 다른 업종입니다.
            주로 30대~50대 고객이 방문하며, 라이브 밴드가 트로트·팝·발라드 등 다양한 음악을 연주하는 가운데
            파트너와 함께 춤을 즐기는 것이 핵심입니다. 부킹 시스템을 통해 이성 간 매칭이 이루어지며,
            좌석은 부스, 룸, 테이블, 홀 등 다양한 형태로 구성됩니다.
            양주 등 주류를 주문하여 웨이터 서비스를 받으며 즐기는 것이 일반적인 이용 방식입니다.
            수원찬스돔나이트처럼 365일 운영하는 대형 업소부터 지역 밀착형 소규모 나이트까지 전국에 분포해 있으며,
            각 지역마다 고유한 분위기와 고객층이 형성되어 있습니다. 처음 방문하시는 분도 웨이터 안내를 통해
            편안하게 즐길 수 있으니, 관심 있는 업소에 사전 전화로 문의해 보시기 바랍니다.
          </p>
        </div>
      </div>

      <VenueListClient
        venues={venues}
        hrefPattern="/nights/{slug}"
        regions={regions}
      />
    </div>
  );
}
