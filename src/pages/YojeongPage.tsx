
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

const regions = [
  { key: 'ilsan', label: '일산' }, { key: 'jongno', label: '종로' }, { key: 'gangnam', label: '강남' },
  { key: 'yeouido', label: '여의도' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'suwon', label: '수원' }, { key: 'gwangju', label: '광주' }, { key: 'jeju', label: '제주' },
];

export default function YojeongPage() {
  const venues = getVenuesByCategory('yojeong');
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '요정' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">요정</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            한복 차림의 도우미가 한정식 코스를 차려내고, 가야금·해금·대금 연주가 배경음악처럼 흐르는 한국 전통 접대 문화의 원형입니다.
            조선시대 기방에서 유래한 이 형태는 현대에 와서 격식 있는 비즈니스 만찬, 상견례, 환갑·칠순 잔치 등에 활용됩니다.
            12첩 반상부터 산해진미 풀코스까지 계절 식재료로 구성된 한정식 메뉴가 핵심이며,
            식사 도중 국악 라이브 공연이 이어져 외국인 접대 자리에서도 높은 평가를 받습니다.
            일산명월관은 고양시 일산동구에 위치하며 30개 독립 좌석과 정찰제를 운영하는 대표적인 곳입니다.
            전국적으로 이 전통 형식을 유지하는 곳은 점차 줄고 있어 희소성이 높으니,
            방문 최소 하루 전 예약과 세미 포멀 이상 복장 준비를 권합니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/yojeong/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="전통 한정식 공간"
        dress="세미 포멀 이상 필수. 전통 문화 공간의 격조에 맞는 복장 권장. 한복도 환영."
        budget="한정식 코스 20~100만원+. 정찰제 업소 확인. 음료 별도인 곳도 있음."
        alone="1인 이용보다 접대·모임 목적. 사전 예약 시 인원·코스 조절 가능."
        reservation="사전 예약 필수. 원하는 공간과 코스를 확보하려면 최소 하루 전 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '18:00~22:00', level: 90 },
        { day: '토요일', time: '17:00~22:00', level: 85 },
        { day: '목요일', time: '18:00~21:00', level: 60 },
        { day: '수요일', time: '18:00~21:00', level: 45 },
        { day: '일요일', time: '12:00~15:00', level: 50 },
      ]} />

      <CategoryVSBattle venueA="일산명월관요정" venueB="강남클럽 아르쥬" topic="접대 장소 대결 — 전통 한정식 vs 모던" />

      <RelatedMagazine articles={[
        { title: '일산명월관 완벽 가이드: 접대부터 가족모임까지', tag: '전통' },
        { title: '한국 전통 코스 요리 문화 공간의 역사와 현재', tag: '문화' },
      ]} />
    </div>
  );
}
