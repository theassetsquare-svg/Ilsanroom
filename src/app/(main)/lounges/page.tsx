import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '라운지 | 일산룸포털 - 강남·압구정·이태원·부산 프리미엄 라운지바',
  description:
    '전국 프리미엄 라운지 정보. 강남 라운지, 압구정 라운지, 이태원 라운지바. 칵테일, 프라이빗 공간, 고급 분위기의 라운지를 일산룸포털에서 찾아보세요.',
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'cheongdam', label: '청담' },
  { key: 'busan', label: '부산' }, { key: 'daejeon', label: '대전' },
];

export default function LoungesPage() {
  const venues = getVenuesByCategory('lounge');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '라운지' }]} />
      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">라운지</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            라운지는 고급스러운 인테리어와 조용한 분위기에서 칵테일, 와인, 위스키 등 프리미엄 주류를 즐기며
            대화와 사교를 나누는 공간입니다. 클럽이나 나이트처럼 대형 댄스 플로어가 있는 것이 아니라,
            소파석이나 프라이빗 부스에서 편안하게 앉아서 시간을 보내는 것이 특징입니다.
            강남과 압구정 일대에 밀집한 라운지바는 세련된 인테리어와 전문 바텐더의 시그니처 칵테일로 유명하며,
            이태원 라운지는 다국적 분위기와 독특한 콘셉트가 매력입니다.
            소규모 비즈니스 미팅, 지인 모임, 커플 데이트 등 목적에 따라 분위기가 다른 라운지를 선택할 수 있습니다.
            대부분의 라운지는 스마트 캐주얼 이상의 복장을 권장하며, 프라이빗 룸이 있는 곳도 있으니
            사전에 전화로 좌석 유무를 확인하시는 것이 좋습니다.
          </p>
        </div>
      </div>
      <VenueListClient venues={venues} hrefPattern="/lounges/{slug}" regions={regions} />
    </div>
  );
}
