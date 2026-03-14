import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '클럽 | 일산룸포털 - 강남·홍대·이태원·부산 EDM 힙합 클럽',
  description:
    '전국 인기 클럽 정보. 강남 EDM 클럽, 홍대 힙합 클럽, 이태원 글로벌 클럽, 부산 서면 클럽까지 장르별·지역별 클럽 리스트, DJ 스케줄, 입장 정보를 일산룸포털에서 확인하세요.',
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'sinchon', label: '신촌' }, { key: 'geondae', label: '건대' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'incheon', label: '인천' }, { key: 'suwon', label: '수원' }, { key: 'jeju', label: '제주' },
];

export default function ClubsPage() {
  const venues = getVenuesByCategory('club');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '클럽' }]} />

      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">클럽</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            클럽은 DJ가 선곡하는 EDM, 하우스, 테크노, 힙합 등 전자음악을 중심으로 운영되는 엔터테인먼트 공간입니다.
            나이트클럽(나이트)과는 완전히 다른 업종으로, 클럽은 20대~30대 초반 고객이 주를 이루며
            스탠딩 중심의 댄스 플로어에서 음악에 맞춰 자유롭게 즐기는 것이 특징입니다.
            강남 클럽은 대형 EDM 메가 클럽이 밀집해 있으며, 홍대 클럽은 인디·힙합·EDM 등 다양한 장르의 중소형 클럽이 특색입니다.
            이태원 클럽은 외국인 비율이 높아 글로벌한 파티 문화를 경험할 수 있고, 부산 서면에도 지역 특색의 클럽 씬이 형성되어 있습니다.
            국내외 유명 DJ 게스트 공연, 테이블 예약, 드레스코드 등 클럽별 특성을 비교하여 자신에게 맞는 곳을 선택하세요.
          </p>
        </div>
      </div>

      <VenueListClient
        venues={venues}
        hrefPattern="/clubs/{region}/{slug}"
        regions={regions}
      />
    </div>
  );
}
