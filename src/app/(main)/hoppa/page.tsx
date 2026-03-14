import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '호빠 | 일산룸포털 - 강남·홍대·부산·대구 호스트바 정보',
  description:
    '전국 호빠(호스트바) 정보. 강남, 홍대, 부산, 대구 호빠 리스트. 세련된 분위기, 전문 호스트 서비스를 일산룸포털에서 확인하세요.',
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'sinsa', label: '신사' },
  { key: 'itaewon', label: '이태원' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' },
];

export default function HoppaPage() {
  const venues = getVenuesByCategory('hoppa');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: '호빠' }]} />
      <div className="mt-6 mb-10">
        <h1 className="text-3xl font-extrabold text-neon-text mb-4">호빠</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-sm leading-relaxed text-neon-text-muted/80">
            호빠(호스트바)는 전문 남성 호스트가 여성 고객에게 대화, 음료 서비스, 엔터테인먼트를 제공하는
            여성 전용 유흥 공간입니다. 클럽이나 나이트와 달리 프라이빗 룸이나 부스에서 1:1 또는
            소그룹 형태로 호스트와 함께 시간을 보내는 것이 주된 이용 방식입니다.
            강남은 대형 호빠가 가장 밀집한 지역으로, 세련된 인테리어와 다수의 전문 호스트를 보유한
            업소가 많습니다. 부산은 해운대·서면·광안리 등에 호빠가 분포해 있으며,
            대구에도 동성로 일대에 호스트바 문화가 형성되어 있습니다.
            각 업소마다 콘셉트와 분위기가 다르며, 사전 전화 상담을 통해 인원과 목적에 맞는
            서비스를 안내받을 수 있습니다. 처음 방문하시는 분은 업소 직원에게 이용 방법을
            문의하시면 친절하게 안내받을 수 있습니다.
          </p>
        </div>
      </div>
      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />
    </div>
  );
}
