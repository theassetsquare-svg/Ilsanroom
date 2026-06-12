
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
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'sinchon', label: '신촌' }, { key: 'geondae', label: '건대' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'incheon', label: '인천' }, { key: 'suwon', label: '수원' }, { key: 'jeju', label: '제주' },
];

export default function ClubsPage() {
  useDocumentMeta('클럽 줄 서다 입장컷 당하기 싫죠? 10년 MD가 들어갈 곳만 알려줌', '클럽 줄 컷이면 그날 끝. 10년 MD가 강남·홍대 클럽 Funktion-One·드레스코드·해외 게스트 DJ·새벽 3시 피크·VIP 부킹까지 클럽 121곳 갈 곳만 추려요 →');
  const venues = getVenuesByCategory('club');
  const featured = venues.find(v => v.isPremium) || venues[0];
  const byRegion = venues.reduce<Record<string, number>>((m, v) => { m[v.regionKo] = (m[v.regionKo] || 0) + 1; return m; }, {});
  const topRegions = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topRegionText = topRegions.map(([r, n]) => `${r} ${n}곳`).join(', ');

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '클럽' }]} />

        {/* Category Hero */}
        <div className="mt-6">
          <CategoryHero
            emoji="🎵"
            title="전국 EDM · 힙합 파티 공간"
            hook="금요일 밤, 베이스가 가슴을 때리는 순간 — 일상이 사라진다. 전국 클럽을 한눈에."
            venueCount={venues.length}
            gradient="from-violet-600 via-purple-700 to-indigo-800"
            accentColor="violet"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
          <PageLiveCounter pageName="" baseCount={72} />
          <TodayStats />
        </div>

        {/* Featured #1 venue */}
        {featured && (
          <div className="mb-4">
            <FeaturedVenueCard
              venue={featured}
              href={`/clubs/${featured.region}/${featured.slug}`}
              accentColor="violet"
              categoryLabel="클럽"
            />
          </div>
        )}
      </div>

      {/* ═══ 업소 목록 — 핵심 콘텐츠 즉시 노출 ═══ */}
      <VenueListClient venues={venues} hrefPattern="/clubs/{region}/{slug}" regions={regions} showEngagementHooks accentColor="violet" />

      {/* 시즌62 — 그리드 직후 인터랙티브 + 본문 즉시 노출 */}
      <CategoryVSBattle venueA="청담 레이스" venueB="압구정 하입" topic="강남 vs 압구정 — EDM 파티 대결" />

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
        <p className="text-lg font-bold text-neon-text">
          놀쿨에 등록된 클럽은 {venues.length}곳. 갈 동네부터 고르면 빠릅니다.
        </p>
        <p className="text-base leading-relaxed text-neon-text-muted">
          지역별로는 {topRegionText}에 가장 많이 모여 있고, 나머지는 수도권과 지방 도시에 한두 곳씩 흩어져 있습니다. 위 지역 버튼을 누르면 그 동네 클럽만 바로 추려서 볼 수 있습니다.
        </p>
        <p className="text-base leading-relaxed text-neon-text-muted">
          클럽은 DJ가 트는 음악에 맞춰 춤추는 공간입니다. EDM·힙합·하우스·테크노가 주로 흐르고, 공간은 댄스플로어와 바 카운터, 예약제 테이블로 나뉩니다. 일반 입장은 바에서 음료를 받아 플로어에 합류하고, 테이블은 미리 예약해 자리를 잡는 방식이 일반적입니다.
        </p>
        <MidContentHook seed="clubs-intro" />
        <p className="text-base leading-relaxed text-neon-text-muted">
          동네마다 색이 다릅니다. 강남·압구정·청담에는 규모가 큰 베뉴가 모여 있고, 홍대는 중소형 공간에 인디·얼터너티브가 섞입니다. 이태원은 외국인이 많은 동네라 다국적 파티 분위기가 강한 편입니다.
        </p>
        <p className="text-base leading-relaxed text-neon-text-muted">
          영업시간·드레스코드·입장 조건은 업소마다 다릅니다. 확인된 정보만 표기하고, 확인되지 않은 항목은 비워 둡니다. 그러니 방문 전 각 업소 상세 페이지에서 영업 여부와 조건을 한 번 더 확인하는 편이 안전합니다. 슬리퍼·운동복 차림은 대부분 입장이 제한되니 깔끔한 옷차림을 권합니다.
        </p>
        <ReadFinishCount pageName="클럽 가이드" baseCount={210} />
      </div>

      <FirstVisitGuide category="EDM 파티 공간"
        dress="스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼·운동복 입장 제한. 여성은 드레스나 블라우스+스커트."
        budget="음료/테이블 운영. 분위기·드레스코드 위주로 매장별 차이를 확인."
        alone="혼자 방문 가능. 바 카운터에서 음료 마시며 분위기 즐기다 댄스플로어 합류하면 됨."
        reservation="테이블은 사전 예약 권장. 일반 입장은 현장 대기. 주말은 0시 이후 대기 길어질 수 있음."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '23:00~03:00', level: 90 },
        { day: '토요일', time: '23:00~04:00', level: 100 },
        { day: '일요일', time: '22:00~02:00', level: 50 },
        { day: '목요일', time: '23:00~02:00', level: 60 },
        { day: '수요일', time: '22:00~01:00', level: 30 },
      ]} />

      <RelatedMagazine articles={[
        { title: '논현 EDM TOP5 — 올해 꼭 가봐야 할 곳', tag: '추천' },
        { title: '홍대 vs 이태원 — 어디가 나에게 맞을까?', tag: '비교' },
      ]} />

      <LiveActivityFeed maxItems={5} category="club" />

      <BrowseOtherCategories currentPath="/clubs" />

      <BottomFinishCounter baseCount={195} />
    </div>
  );
}
