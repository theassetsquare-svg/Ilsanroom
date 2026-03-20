
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

const regions = [
  { key: 'gangnam', label: '강남' },
  { key: 'hongdae', label: '홍대' },
  { key: 'geondae', label: '건대' },
  { key: 'jangan', label: '장안동' },
  { key: 'jangandong', label: '장안동' },
  { key: 'suwon', label: '수원' },
  { key: 'busan-haeundae', label: '해운대' },
  { key: 'busan', label: '부산' },
  { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' },
  { key: 'jeonju', label: '전주' },
];

export default function HoppaPage() {
  const venues = getVenuesByCategory('hoppa');
  return (
    <div className="hoppa-theme mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '호빠' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-pink-700 mb-4">
          호빠 <span className="text-lg font-normal text-pink-400">· 호스트클럽</span>
        </h1>

        {/* 여성 친화 안내 배너 — 로즈골드/핑크 */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-white to-rose-50 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💎</span>
            <h2 className="text-lg font-bold text-pink-700">여성을 위한 프리미엄 공간</h2>
          </div>
          <p className="text-base leading-relaxed text-pink-900/70">
            대화 능력과 엔터테인먼트 스킬을 갖춘 전문 호스트가 여성 고객의 테이블에서 함께 시간을 보내는 여성 전용 사교 공간입니다.
            마술, 보드게임, 즉석 노래, 유머 토크 등 호스트마다 고유한 접객 스타일이 있어 매번 색다른 분위기를 즐길 수 있습니다.
            TC(타임차지) 방식으로 시간 단위 요금이 책정되며, 음료 주문은 별도입니다.
            친구 생일 서프라이즈, 직장 동료 모임, 혼자만의 힐링 타임 등 방문 목적이 다양하고,
            실제로 1인 고객 비율이 절반에 가까울 만큼 혼자 오시는 분도 편하게 이용합니다.
            전국 주요 도시 18곳이 등록되어 있으며, 사전 전화 상담으로 예산과 분위기 선호를 알려주면
            맞춤 안내를 받을 수 있습니다. 등록된 모든 업소는 현재 영업 중인지 직접 확인을 마쳤습니다.
          </p>
        </div>

        {/* 안전·가격·혼자 안내 카드 */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">💰 가격 투명</h3>
            <p className="text-sm text-pink-900/60">TC(타임차지)·주대 가격을 사전 전화로 확인 가능. 바가지 걱정 없다.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">🛡️ 안전 이용</h3>
            <p className="text-sm text-pink-900/60">모든 등록 업소는 영업 확인 완료. 불쾌한 상황 시 직원에게 즉시 요청.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">👩 혼자도 OK</h3>
            <p className="text-sm text-pink-900/60">혼자 방문해도 직원이 친절하게 안내. 오히려 혼자 오는 분이 더 많다.</p>
          </div>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />

      <FirstVisitGuide category="호빠"
        dress="깔끔한 복장이면 충분. 편안하면서 예쁜 옷이면 더 좋다. 운동복만 아니면 된다."
        budget="TC(타임차지) 1시간 3~5만원대가 일반적. 주대(음료)는 별도. 사전에 전화로 총 예상 비용 꼭 확인."
        alone="혼자 방문 완전 가능! 오히려 혼자 오시는 분이 많다. 직원이 처음부터 끝까지 안내해준다."
        reservation="사전 전화 상담 강력 권장. 원하는 시간·인원·예산을 미리 말하면 딱 맞는 안내를 받을 수 있다."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~03:00', level: 85 },
        { day: '토요일', time: '21:00~04:00', level: 95 },
        { day: '목요일', time: '21:00~01:00', level: 50 },
        { day: '수요일', time: '21:00~00:00', level: 30 },
        { day: '일요일', time: '20:00~00:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="강남 로얄" venueB="강남 어게인" topic="강남 호스트바 최강자는?" />

      <RelatedMagazine articles={[
        { title: '호스트 공간 처음 가는 분을 위한 완벽 가이드', tag: '입문' },
        { title: '강남 vs 해운대 — 지역별 분위기와 가격 비교', tag: '비교' },
      ]} />
    </div>
  );
}
