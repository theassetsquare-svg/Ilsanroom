
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
  { key: 'apgujeong', label: '압구정' }, { key: 'cheongdam', label: '청담' },
  { key: 'busan', label: '부산' }, { key: 'daejeon', label: '대전' },
];

export default function LoungesPage() {
  useDocumentMeta('라운지 시끄러워서 데이트 망친 적 한 번이라도? 10년 실장이 거름', '분위기 보고 갔는데 어수선하면 데이트도 망합니다. 10년 본 라운지 실장이 인테리어·시그니처·만남 결까지 다 풀어드립니다. 조용히 가서 조용히 나와요 →');
  const venues = getVenuesByCategory('lounge');
  const featured = venues.find(v => v.isPremium) || venues[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '라운지' }]} />

        <div className="mt-6">
          <CategoryHero
            emoji="🍸"
            title="감각적인 칵테일 바 · 라운지"
            hook="조명이 어둡다. 소파가 깊다. 바텐더가 흔드는 셰이커 소리만 들린다. 대화가 묻히지 않는 밤."
            venueCount={venues.length}
            gradient="from-amber-600 via-orange-700 to-red-800"
            accentColor="amber"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
          <PageLiveCounter pageName="" baseCount={35} />
          <TodayStats />
        </div>

        {featured && (
          <div className="mb-4">
            <FeaturedVenueCard
              venue={featured}
              href={`/lounges/${featured.slug}`}
              accentColor="amber"
              categoryLabel="라운지"
            />
          </div>
        )}
      </div>

      <VenueListClient venues={venues} hrefPattern="/lounges/{slug}" regions={regions} showEngagementHooks accentColor="amber" />

      <CategoryVSBattle venueA="디엠" venueB="이디엇" topic="해당 동네 감성 바 맞대결" />

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            조명이 어둡다. 소파가 깊다. 바텐더가 흔드는 셰이커 소리만 들린다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            시끄러운 곳이 싫은 사람한테 라운지가 딱이다. 라운지는 음악이 깔리는데 대화가 안 묻힌다. 맞은편 사람 얼굴이 잘 보이고, 목소리가 선명하게 들린다. 그래서 라운지가 비즈니스 접대나 소개팅 장소로 핫하다. 무드가 확실하니까.
          </p>
          <MidContentHook seed="lounges-intro" />
          <p className="text-base leading-relaxed text-neon-text-muted">
            라운지는 청담 일대에 집중되어 있다. 라운지 VIP 전용 부스는 미리 연락제로 운영하고, 부스마다 전담 스태프가 붙는다. 바에서 앉으면 바텐더가 취향을 물어보고 시그니처 드링크를 만들어준다. 위스키·와인·칵테일 등 매장마다 주력 라인업이 다르니 상세는 각 매장에서 확인하면 된다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            1인으로 와서 바에서 앉는 사람도 많다. 오히려 라운지는 1인이 오는 게 자연스러운 곳이다. 세미포멀 편한 차림이면 어디든 들어간다. 금토 저녁은 만석이 잦으니 당일 전화로 빈자리 확인하는 게 안전하다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            압구정라운지 디엠은 청담 경계에 위치한 격 있는 라운지로, 아마로 리큐르 컬렉션을 갖춘 식후주 중심의 조용한 공간이다. 압구정이디엇라운지는 도발적인 이름과 달리 재즈·소울이 흐르는 감각적인 곳으로, 좋아하는 향 키워드를 말하면 즉석에서 칵테일을 조제해준다. 두 곳 다 비즈니스 접대나 소개팅 장소로 어울리고, 조용하면서도 격이 느껴지는 공간이다.
          </p>
          <ReadFinishCount pageName="라운지 가이드" baseCount={140} />
        </div>

      <FirstVisitGuide category="칵테일 바"
        dress="세미포멀 편한 차림 이상. 깔끔하게 차려입으면 OK. 트레이닝·샌들 비추."
        budget="드링크·시그니처 칵테일 중심. 프라이빗 부스는 최소 주문이 있을 수 있음."
        alone="1인 입장 매우 적합. 바에서 바텐더와 대화하며 한 잔 즐기기."
        reservation="금토 저녁은 미리 연락 추천. 월~목은 워크인 가능한 곳이 많음."
      />

      <PopularTimes slots={[
        { day: '주말 저녁', time: '20:00~02:00', level: 85 },
        { day: '토', time: '19:00~02:00', level: 90 },
        { day: '목', time: '20:00~00:00', level: 50 },
        { day: '수', time: '19:00~23:00', level: 30 },
        { day: '일', time: '18:00~23:00', level: 40 },
      ]} />

      <RelatedMagazine category="lounge" />

      <LiveActivityFeed maxItems={5} category="lounge" />

      <BrowseOtherCategories currentPath="/lounges" />

      <BottomFinishCounter baseCount={128} />
    </div>
  );
}
