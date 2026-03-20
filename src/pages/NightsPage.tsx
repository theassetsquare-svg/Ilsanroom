
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

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
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '나이트' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">소셜댄스 · 부킹</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            지루박, 부르스, 자이브 같은 소셜댄스를 파트너와 함께 추며 사교를 즐기는 한국 고유의 나이트 문화입니다.
            무대 위에서 라이브 밴드가 트로트·팝·발라드를 연주하면, 플로어 위 손님들이 자연스럽게 호흡을 맞춰 춤을 시작합니다.
            30대 후반부터 50대까지 폭넓은 연령대가 방문하며, 부킹 시스템을 통해 처음 만난 상대와도 부담 없이 한 곡을 함께할 수 있습니다.
            웨이터가 좌석 안내부터 부킹 중개까지 전 과정을 돕기 때문에, 초보자도 어렵지 않게 현장 분위기에 적응할 수 있습니다.
            금·토요일 밤 9시 이후가 가장 활기차며, 365일 매일 문을 여는 대형 홀부터 지역 단골 위주의 소규모 업소까지 전국에 분포합니다.
            양주 한 병과 과일 안주를 곁들이며 춤과 대화를 번갈아 즐기는 여유로운 저녁을 경험해 보세요.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/nights/{slug}" regions={regions} />

      <FirstVisitGuide category="나이트"
        dress="세미 포멀~포멀 권장. 정장 또는 셋업이 기본. 너무 캐주얼하면 분위기에 안 맞을 수 있음."
        budget="입장료 1~3만원 + 양주 1병 10~30만원. 부스/룸 추가 비용 발생. 웨이터 팁 별도."
        alone="웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭 가능."
        reservation="부스는 사전 예약 권장. 금토 저녁에는 일찍 가야 좋은 자리 확보 가능."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~02:00', level: 95 },
        { day: '토요일', time: '21:00~03:00', level: 100 },
        { day: '목요일', time: '20:00~01:00', level: 55 },
        { day: '수요일', time: '20:00~00:00', level: 35 },
        { day: '일요일', time: '19:00~23:00', level: 40 },
      ]} />

      <CategoryVSBattle venueA="수원찬스돔나이트" venueB="인천아라비안나이트" topic="경기 소셜댄스홀 최강자는?" />

      <RelatedMagazine articles={[
        { title: '처음 방문하는 분을 위한 A to Z 매너 가이드', tag: '입문' },
        { title: '전국 소셜댄스 명소 지역별 특징 총정리', tag: '정보' },
      ]} />
    </div>
  );
}
