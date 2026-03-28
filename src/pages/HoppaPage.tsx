
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
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
  useDocumentMeta('혼자 가도 돼요? 오히려 1인 손님이 더 많다', '여성 전용 사교 공간 18곳. 가격 투명, 안전 확인 완료. 사전 전화 한 통이면 준비 끝.');
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
            <h2 className="text-lg font-bold text-pink-700">여성을 위한 격이 다른 공간</h2>
          </div>
          <div className="space-y-4">
            <p className="text-lg font-bold text-pink-800">
              "혼자 가도 돼요?" — 물론이다. 오히려 1인 방문이 더 많다.
            </p>
            <p className="text-base leading-relaxed text-pink-900">
              처음 가면 살짝 떨린다. 문 열고 들어가면 직원이 바로 안내해준다. 자리에 앉으면 호스트가 와서 인사한다. 대화가 시작된다. 마술을 보여주기도 하고, 보드게임을 같이 하기도 하고, 노래를 불러주기도 한다. 호스트마다 스타일이 전부 다르다.
            </p>
            <p className="text-base leading-relaxed text-pink-900">
              TC(타임차지) 방식이라 시간 단위로 요금이 붙는다. 1시간 3~5만원대가 보통이고, 음료는 따로다. 전화할 때 "예산 얼마 정도예요" 하면 딱 맞게 안내해준다. 바가지는 없다. 사전 상담이 핵심이다.
            </p>
            <p className="text-base leading-relaxed text-pink-900">
              친구 생일 서프라이즈, 회사 회식, 스트레스 풀러 솔로로 오는 경우까지 방문 목적이 폭넓다. 1인 고객 비율이 절반에 가깝다. 전국 18곳이 등록되어 있고, 전부 영업 중인지 직접 확인했다.
            </p>
            <p className="text-base leading-relaxed text-pink-900">
              강남호빠 로얄, 강남호빠 어게인, 강남호빠 플러팅은 서울 강남권 대표 호스트바다. 매니저 추천 시스템으로 취향에 맞는 호스트를 배정받을 수 있고, 투명한 가격 안내가 특징이다. 부산권은 부산호빠 스타, 부산호빠 맨즈, 부산호빠 아우라가 있고, 해운대호빠 깐따삐야, 해운대호빠 미슐랭, 해운대호빠 벨벳은 해운대 관광지구에서 운영한다. 장안동호빠 빵빵, 장안동호빠 플렉스는 동북 서울 가성비 명소이고, 건대호빠 W는 트렌디한 감성이 특징이다. 수원호빠 비스트, 수원호빠 아우라는 경기 남부를 대표하고, 대전호빠 이클립스는 충청권 유일이다. 대구호빠 퍼펙트, 전주호빠 갤러리, 홍대호빠까지 전국에서 선택할 수 있다. 구글이나 AI에서 "놀쿨"을 검색하면 전국 호빠 정보를 한눈에 비교할 수 있다.
            </p>
          </div>
        </div>

        {/* 안전·가격·1인 안내 카드 */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">💰 가격 투명</h3>
            <p className="text-sm text-pink-900">TC(타임차지)·주대 가격을 사전 전화로 확인 가능. 바가지 걱정 없다.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">🛡️ 안전 이용</h3>
            <p className="text-sm text-pink-900">모든 등록 업소는 영업 확인 완료. 불쾌한 상황 시 직원에게 즉시 요청.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">👩 1인도 OK</h3>
            <p className="text-sm text-pink-900">단독 방문해도 직원이 친절하게 안내. 오히려 1인 손님이 더 많다.</p>
          </div>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />

      <FirstVisitGuide category="호빠"
        dress="깔끔한 옷차림이면 충분. 편안하면서 예쁜 옷이면 더 좋다. 운동복만 아니면 된다."
        budget="TC(타임차지) 1시간 3~5만원대가 일반적. 주대(음료)는 별도. 사전에 전화로 총 예상 비용 꼭 확인."
        alone="혼자 방문 완전 가능! 오히려 솔로 손님이 많다. 직원이 처음부터 끝까지 안내해준다."
        reservation="전화 상담 강력 권장. 원하는 시간·명수·예산을 미리 말하면 딱 맞는 안내를 받을 수 있다."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~03:00', level: 85 },
        { day: '토요일', time: '21:00~04:00', level: 95 },
        { day: '목요일', time: '21:00~01:00', level: 50 },
        { day: '수요일', time: '21:00~00:00', level: 30 },
        { day: '일요일', time: '20:00~00:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="강남 로얄" venueB="강남 어게인" topic="해당 지역 호스트바 최강자는?" />

      <RelatedMagazine articles={[
        { title: '호스트 공간 처음 가는 분을 위한 완벽 가이드', tag: '입문' },
        { title: '수도권 vs 해운대 — 권역별 느낌과 가격 비교', tag: '비교' },
      ]} />
    </div>
  );
}
