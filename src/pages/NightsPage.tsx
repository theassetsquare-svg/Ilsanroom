
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';
import { PageLiveCounter, TodayStats } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
import { MidContentHook, ReadFinishCount } from '@/components/engagement/ReadingEngagement';
import { CategoryHero, FeaturedVenueCard, BrowseOtherCategories, BottomFinishCounter } from '@/components/venue/CategoryListingEngagement';

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'seoul', label: '서울' }, { key: 'ilsan', label: '일산' },
  { key: 'suwon', label: '수원' }, { key: 'seongnam', label: '성남' }, { key: 'incheon', label: '인천' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'gwangju', label: '광주' }, { key: 'ulsan', label: '울산' }, { key: 'paju', label: '파주' },
  { key: 'changwon', label: '창원' }, { key: 'jeonju', label: '전주' }, { key: 'jeju', label: '제주' },
];

export default function NightsPage() {
  useDocumentMeta('나이트 부킹 한 번도 못 잡고 집 간 적? 10년 웨이터가 거를 곳 알려줘요', '부킹 안 잡히는 나이트 가면 1차로 끝나요. 10년 짠밥 웨이터가 홀·부스·물·진행 다 풀어드립니다. 121곳 갈 곳 vs 거를 곳 →');
  const venues = getVenuesByCategory('night');
  const featured = venues.find(v => v.isPremium) || venues[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '나이트' }]} />

        <div className="mt-6">
          <CategoryHero
            emoji="🌙"
            title="소셜댄스 · 부킹 명소"
            hook="밴드가 첫 곡을 시작하면 홀 전체가 움직인다. 처음 만난 사람과 지루박 한 곡, 어색함은 사라진다."
            venueCount={venues.length}
            gradient="from-blue-600 via-indigo-700 to-purple-800"
            accentColor="blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
          <PageLiveCounter pageName="" baseCount={55} />
          <TodayStats />
        </div>

        {featured && (
          <div className="mb-4">
            <FeaturedVenueCard
              venue={featured}
              href={`/nights/${featured.slug}`}
              accentColor="blue"
              categoryLabel="나이트"
            />
          </div>
        )}
      </div>

      <VenueListClient venues={venues} hrefPattern="/nights/{slug}" regions={regions} showEngagementHooks accentColor="blue" />

      {/* 시즌62 — 그리드 직후 인터랙티브 + 본문 즉시 노출 (체류 ↑) */}
      <CategoryVSBattle venueA="수원찬스돔나이트" venueB="인천아라비안나이트" topic="경기 소셜댄스홀 최강자는?" />

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            토요일 밤 9시. 밴드가 첫 곡을 시작하면 홀 전체가 움직인다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            웨이터가 테이블로 다가와 "저쪽 분이 같이 춤추고 싶어하십니다" 하면, 자연스럽게 댄스홀로 나간다. 이게 부킹이다. 처음 만난 사람과 지루박 한 곡을 추는 동안 어색함은 사라지고, 대화가 시작된다. 한국에만 있는 독특한 사교 문화다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            라이브 밴드가 트로트·팝·발라드를 번갈아 연주한다. 무대 바로 앞 댄스홀에서 춤추는 사람들, 자리에 앉아 양주 마시며 구경하는 사람들, 웨이터가 분주하게 오가는 모습이 한 공간에 섞인다. 30대 후반부터 50대까지 연령대가 넓다. 20대가 가면 오히려 귀여워해주셔서 대접받는다는 후기도 있다.
          </p>
          <MidContentHook seed="nights-intro" />
          <p className="text-base leading-relaxed text-neon-text-muted">
            시스템은 간단하다. 들어가면 웨이터가 좌석을 안내한다. 양주 한 병 시키고 과일 안주 받으면 준비 끝. 춤추고 싶으면 댄스홀로 나가면 되고, 앉아서 무드만 즐겨도 된다. 부킹은 거절해도 전혀 문제 없다. 강제 아니다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            전국 60곳이 등록되어 있다. 수원찬스돔나이트처럼 돔 구조로 유명한 곳, 부산연산동물나이트처럼 부킹률로 이름난 곳, 각각 개성이 확실하다. 금·토 밤 9시가 절정이고, 365일 매일 여는 곳도 많다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            서울 지역은 강남줄리아나나이트, 청담H2O나이트, 신림그랑프리나이트, 상봉동한국관나이트, 노원호박나이트, 노원스타나이트, 영등포터미널나이트 등이 각 권역을 대표한다. 강남줄리아나나이트는 30년 전통의 사교 명가로, 넓은 홀과 복고·댄스팝이 번갈아 나오는 DJ 선곡이 특징이다. 청담H2O나이트는 워터 테마 인테리어로 유명하고, 펩시맨이라 불리는 담당자가 첫 방문 손님 응대를 잘한다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            경기권은 일산샴푸나이트, 파주야당스카이돔나이트, 화정한국관나이트, 김포호박나이트, 수원찬스돔나이트, 수원코리아나이트, 성남국빈관나이트, 분당퐁퐁나이트 등이 있다. 충청권은 대전세븐나이트, 대전봉명나이트, 천안스타돔나이트가, 경상권은 부산연산동물나이트, 부산아시아드나이트, 울산뉴월드나이트, 울산챔피언나이트, 대구한국관나이트가 핵심이다. 전라권은 광주상무나이트, 광주MGM나이트, 광주올나이트가 대표한다.
          </p>
          <ReadFinishCount pageName="나이트 가이드" baseCount={185} />
        </div>

      <FirstVisitGuide category="나이트"
        dress="세미 포멀~포멀 권장. 정장 또는 셋업이 기본. 너무 캐주얼하면 무드에 안 맞을 수 있음."
        budget="양주 위주 운영. 부스/룸 구성과 웨이터 매너는 매장별로 확인."
        alone="웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭 가능."
        reservation="좌석은 미리 예약 권장. 금토 저녁에는 일찍 가야 좋은 자리 확보 가능."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~02:00', level: 95 },
        { day: '토요일', time: '21:00~03:00', level: 100 },
        { day: '목요일', time: '20:00~01:00', level: 55 },
        { day: '수요일', time: '20:00~00:00', level: 35 },
        { day: '일요일', time: '19:00~23:00', level: 40 },
      ]} />

      <RelatedMagazine articles={[
        { title: '처음 방문하는 분을 위한 A to Z 매너 안내', tag: '입문' },
        { title: '전국 소셜댄스 명소 동네별 특징 총정리', tag: '정보' },
      ]} />

      <LiveActivityFeed maxItems={5} category="night" />

      <BrowseOtherCategories currentPath="/nights" />

      <BottomFinishCounter baseCount={172} />
    </div>
  );
}
