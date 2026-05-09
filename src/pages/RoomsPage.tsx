
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
  { key: 'ilsan', label: '일산' }, { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' },
  { key: 'geondae', label: '건대' }, { key: 'suwon', label: '수원' }, { key: 'bundang', label: '분당' },
  { key: 'anyang', label: '안양' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'incheon', label: '인천' },
];

export default function RoomsPage() {
  useDocumentMeta('룸 — 초이스 진짜 만족하나요? 10년차 실장이 봐드립니다', '이 룸, 진짜 갈 만한가요? 초이스·양주 라인·진행 케어를 10년차 현장 실장이 1줄 진단 — 후회하기 전에 진짜 좋은 곳만. 지금 무료 →');
  const venues = getVenuesByCategory('room');
  const featured = venues.find(v => v.isPremium) || venues[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '룸' }]} />

        <div className="mt-6">
          <CategoryHero
            emoji="🚪"
            title="프라이빗 모임 장소"
            hook="문 닫으면 바깥 소리가 안 들린다. 비즈니스부터 생일파티까지, 우리만의 시간이 시작된다."
            venueCount={venues.length}
            gradient="from-rose-600 via-pink-700 to-fuchsia-800"
            accentColor="rose"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
          <PageLiveCounter pageName="" baseCount={48} />
          <TodayStats />
        </div>

        {featured && (
          <div className="mb-4">
            <FeaturedVenueCard
              venue={featured}
              href={`/rooms/${featured.region}/${featured.slug}`}
              accentColor="rose"
              categoryLabel="룸"
            />
          </div>
        )}
      </div>

      <VenueListClient venues={venues} hrefPattern="/rooms/{region}/{slug}" regions={regions} showEngagementHooks accentColor="rose" />

      <BrowseOtherCategories currentPath="/rooms" />

      <div className="rounded-xl bg-gradient-to-r from-rose-50 to-white border border-rose-200 p-4 text-center">
        <p className="text-sm font-bold text-rose-600">👇 룸 크기별 추천 · 예약 꿀팁 · 예산 가이드 아래에 전부 정리</p>
        <p className="text-xs text-[#999] mt-1">비즈니스·생일·모임 목적별로 딱 맞는 곳 찾는 법</p>
      </div>

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            문 닫으면 바깥 소리가 안 들린다. 우리만의 시간이 시작된다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            벽으로 완전히 분리된 독립 룸이다. 룸은 옆에서 아무리 시끄럽게 해도 이쪽은 조용하다. 룸 안에서 방음이 되니까 비즈니스 얘기를 해도 되고, 마음껏 노래를 불러도 된다. 룸마다 독립 음향, 개별 조명, 노래방 기기까지 갖춰진 곳이 대부분이다.
          </p>
          <MidContentHook seed="rooms-intro" />
          <p className="text-base leading-relaxed text-neon-text-muted">
            룸 크기는 4인 소형부터 30인 넘는 대형까지 선택 폭이 넓다. 룸에서 생일파티, 비즈니스 모임, 단체 모임, 기업 워크숍 뒤풀이까지 인원에 맞게 고르면 된다. 일산은 신실장이 전화 한 통이면 인원수에 맞는 자리를 바로 잡아준다. 해운대 마린시티에는 개별 공간이 60개 넘는 대형 시설도 있다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            룸 예약의 핵심은 사전 전화다. 원하는 인원, 예산, 음식 주문 여부를 미리 말하면 딱 맞는 룸 크기를 배정받는다. 금토는 빨리 차니까 이틀 전에는 연락하자. 주중은 한산해서 여유롭게 쓸 수 있다. 주차장 있는 곳이 많아서 차 끌고 가기도 좋다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            일산룸은 신실장(010-3695-4929)이 직접 예약부터 당일 세팅까지 챙긴다. 마두역 1번출구 도보 3분 거리에 있고, 방음이 확실해서 비즈니스 미팅부터 생일파티까지 다 된다. VIP룸은 별도 분리되어 있어서 중요한 손님 모실 때 제격이다. 해운대고구려는 부산 마린시티에 위치한 대형 시설로, 룸이 60개가 넘는다. 2인용부터 20인 넘는 대형방까지 골라서 쓸 수 있고, 정찰제라서 바가지 걱정이 없다. 픽업 서비스도 제공한다.
          </p>
          <ReadFinishCount pageName="룸 가이드" baseCount={165} />
        </div>

      <FirstVisitGuide category="프라이빗 룸"
        dress="캐주얼~비즈니스 캐주얼. 모임 목적에 맞게 조절."
        budget="공간 이용료 + 음료. 매장마다 다름. 사전 전화 문의 필수."
        alone="보통 2인 이상 이용. 1인 가능 여부 매장에 확인."
        reservation="사전 예약 필수. 원하는 크기의 룸을 확보하려면 미리 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '19:00~01:00', level: 90 },
        { day: '토요일', time: '18:00~01:00', level: 95 },
        { day: '목요일', time: '19:00~23:00', level: 65 },
        { day: '수요일', time: '19:00~23:00', level: 45 },
        { day: '일요일', time: '17:00~22:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="일산룸" venueB="해운대고구려" topic="독립 룸 맞대결" />

      <RelatedMagazine articles={[
        { title: '비즈니스 접대에 최적인 독립 룸 안내', tag: '비즈니스' },
        { title: '해운대고구려 — 마린시티 60개 개별 룸의 비밀', tag: '부산' },
      ]} />

      <LiveActivityFeed maxItems={5} category="room" />

      <BottomFinishCounter baseCount={155} />
    </div>
  );
}
