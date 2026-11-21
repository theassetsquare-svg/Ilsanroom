
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { sortVenues } from '@/lib/venue-order';
import { popularity } from '@/lib/popularity';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';
import { PageLiveCounter, TodayStats } from '@/components/ui/LiveStats';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
import { MidContentHook, ReadFinishCount } from '@/components/engagement/ReadingEngagement';
import { CategoryHero, FeaturedVenueCard, BrowseOtherCategories, BottomFinishCounter } from '@/components/venue/CategoryListingEngagement';


export default function YojeongPage() {
  useDocumentMeta(
    '요정 한정식 코스와 국악 — 거래처 첫 접대 전에 챙길 예약 예절',
    '요정은 한정식 코스를 받으며 국악을 듣는 전통 접대 공간입니다. 예약 예절과 일산명월관요정의 계절 15첩 상차림, 방 15개 구성을 모았습니다.' // [놀쿨86-1 · 2026-11-22] = scripts/prerender-seo.mjs 의 /yojeong 제목 · 설명
  );
  const venues = getVenuesByCategory('yojeong');
  const featured = sortVenues(venues, 'rec', popularity.venues)[0]; // [놀쿨12-2 · 13:18-2] 목록 추천 순서의 첫 가게(광고면 「광고」 표시)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '요정' }]} />

        <div className="mt-6">
          <CategoryHero
            emoji="🏮"
            title="전통 한정식 · 국악 정찬"
            hook="가야금 선율이 흐르고, 15가지 한정식이 하나씩 차려진다. 격이 다른 만찬의 시작."
            venueCount={venues.length}
            gradient="from-emerald-600 via-teal-700 to-cyan-800"
            accentColor="emerald"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
          <PageLiveCounter pageName="" baseCount={29} />
          <TodayStats />
        </div>

        {featured && (
          <div className="mb-4">
            <FeaturedVenueCard
              venue={featured}
              href={`/yojeong/${featured.region}/${featured.slug}`}
              accentColor="emerald"
              categoryLabel="요정"
            />
          </div>
        )}
      </div>

      <VenueListClient venues={venues} hrefPattern="/yojeong/{region}/{slug}" showEngagementHooks accentColor="emerald" />

      <CategoryVSBattle venueA="일산명월관요정" venueB="강남청담클럽 아르쥬" topic="만찬 장소 대결 — 전통 정찬 vs 모던" />

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            요정에 들어서면 가야금 선율이 흐르고, 15가지 한정식이 하나씩 차려진다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정에서 한복 차림의 도우미가 요리를 올리고, 해금 연주가 배경에 깔린다. 요정 문화는 조선시대 기방에서 유래했고 지금도 거래처 만찬, VIP 접대 자리에서 격을 갖춘 공간으로 쓰인다.
          </p>
          <MidContentHook seed="yojeong-intro" />
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정의 코스는 12첩 반상부터 산해진미 풀코스까지 계절 식재료로 구성한다. 봄에는 두릅과 냉이, 가을에는 송이와 전복이 올라온다. 음식 하나하나에 정성이 들어가니까 먹는 속도가 자연스럽게 느려지고, 대화가 길어진다. 이게 대접의 핵심이다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            {/* [일산76-1 · 2026-11-13] 일산명월관요정 사실은 src/data/ilsanmyeongwolgwan-confirmed.json(2026-07-30 업소 확인)만 — 옛 글의 장항로·룸 30개·정찰제는 확인 자료와 어긋나거나 없어 고쳤다 */}
            전국적으로 요정 고유의 형식을 유지하는 곳이 점점 줄고 있다. 일산명월관요정은 고양시 일산동구 장항동 895-1 지하 1층에 있고, 방은 모두 15개다. 상차림은 계절마다 바뀌는 15첩 궁중 상차림이고, 식사에는 거문고·해금 합주가 함께한다. 차로 오면 발렛 주차를 맡길 수 있다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정은 거래처 접대, VIP 만찬, 격식 있는 모임까지 폭넓게 쓰인다. 좌식 테이블에 병풍이 둘러진 전통 공간인데, 요즘 이런 곳이 전국에 몇 안 남았다. 최소 하루 전 예약 문의는 필수이고, 인기 있는 주말 날짜는 2주 전에 잡아야 한다. 세미 포멀 이상 착장을 준비하자.
          </p>
          <ReadFinishCount pageName="요정 가이드" baseCount={120} />
        </div>

      <FirstVisitGuide category="격식 있는 한식 접대"
        dress="세미 포멀 이상 필수. 옛 멋이 살아있는 곳의 격조에 맞는 차림 권장. 한복도 환영."
        budget="코스 요리 중심. 정찰제 매장 확인. 주류 별도인 곳도 있음."
        alone="1인 이용보다 만찬·모임 자리. 전화 문의 시 참석자·코스 조절 가능."
        reservation="미리 문의 필수. 원하는 공간과 코스를 확보하려면 최소 하루 전 연락."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '18:00~22:00', level: 90 },
        { day: '토요일', time: '17:00~22:00', level: 85 },
        { day: '목요일', time: '18:00~21:00', level: 60 },
        { day: '수요일', time: '18:00~21:00', level: 45 },
        { day: '일요일', time: '12:00~15:00', level: 50 },
      ]} />

      <RelatedMagazine category="yojeong" />

      <LiveActivityFeed maxItems={5} category="yojeong" />

      <BrowseOtherCategories currentPath="/yojeong" />

      <BottomFinishCounter baseCount={108} />
    </div>
  );
}
