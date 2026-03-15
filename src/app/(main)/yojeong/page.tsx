import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '요정 | 오늘밤어디 - 일산명월관요정·전국 전통 요정 한정식',
  description: '전국 전통 요정 정보. 일산명월관요정 등 한정식 코스와 국악 공연을 즐기는 격조 높은 공간.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/10B981/ffffff/png?text=요정 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'ilsan', label: '일산' }, { key: 'jongno', label: '종로' }, { key: 'gangnam', label: '강남' },
  { key: 'yeouido', label: '여의도' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'suwon', label: '수원' }, { key: 'gwangju', label: '광주' }, { key: 'jeju', label: '제주' },
];

export default function YojeongPage() {
  const venues = getVenuesByCategory('yojeong');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '요정' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">요정</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정은 한국적 한정식 코스 요리와 국악 라이브 공연을 함께 제공하는 격조 높은 한정식 문화 공간입니다.
            프라이빗 룸에서 정갈한 서비스를 받으며, 가야금·해금·대금 등 고유한 악기의 선율과 함께 식사를 즐기는 것이
            이곳 문화의 핵심입니다. 비즈니스 접대, VIP 미팅, 돌잔치, 환갑·칠순 잔치, 상견례 등
            격식이 필요한 자리에 최적의 전통 공간으로 활용됩니다.
            일산명월관요정은 고양시 일산동구 장항로 895-1에 위치한 일산 대표 한정식 문화 공간으로,
            총 30개 프라이빗 룸과 정찰제 한정식을 운영하며 신실장이 전반을 총괄합니다.
            역사 깊은 형태로 운영되는 곳은 전국에 많지 않아 희소성이 높은 업종입니다.
            방문 시 세미 포멀 이상의 복장을 권장하며, 사전 예약이 필수입니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/yojeong/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="요정"
        dress="세미 포멀 이상 필수. 전통 공간의 격조에 맞는 복장 권장. 한복도 환영."
        budget="한정식 코스 20~100만원+. 정찰제 업소 확인. 음료 별도인 곳도 있음."
        alone="1인 이용보다 접대·모임 목적. 사전 예약 시 인원·코스 조절 가능."
        reservation="사전 예약 필수. 원하는 룸과 코스를 확보하려면 최소 하루 전 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '18:00~22:00', level: 90 },
        { day: '토요일', time: '17:00~22:00', level: 85 },
        { day: '목요일', time: '18:00~21:00', level: 60 },
        { day: '수요일', time: '18:00~21:00', level: 45 },
        { day: '일요일', time: '12:00~15:00', level: 50 },
      ]} />

      <CategoryVSBattle venueA="일산명월관요정" venueB="강남라운지아르쥬" topic="접대 장소 대결 — 전통 vs 모던" />

      <RelatedMagazine articles={[
        { title: '일산명월관 완벽 가이드: 접대부터 가족모임까지', tag: '요정' },
        { title: '한국 한정식 문화 공간의 역사와 현재', tag: '문화' },
      ]} />
    </div>
  );
}
