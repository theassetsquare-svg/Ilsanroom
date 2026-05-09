
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
  { key: 'ilsan', label: '일산' }, { key: 'jongno', label: '종로' }, { key: 'gangnam', label: '강남' },
  { key: 'yeouido', label: '여의도' }, { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' }, { key: 'suwon', label: '수원' }, { key: 'gwangju', label: '광주' }, { key: 'jeju', label: '제주' },
];

export default function YojeongPage() {
  useDocumentMeta('요정 갔는데 격 떨어지면 끝장이죠? 20년 실장이 봐드림', '사장님 모시는데 격 떨어지면 다음은 없어요. 20년 일한 요정 실장이 한정식·접대·진행 매너 한 줄로 정리합니다. 진짜 격 있는 곳만 →');
  const venues = getVenuesByCategory('yojeong');
  const featured = venues.find(v => v.isPremium) || venues[0];

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

      <VenueListClient venues={venues} hrefPattern="/yojeong/{region}/{slug}" regions={regions} showEngagementHooks accentColor="emerald" />

      <BrowseOtherCategories currentPath="/yojeong" />

      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 p-4 text-center">
        <p className="text-sm font-bold text-emerald-700">👇 코스 종류 · 접대 매너 · 예약 방법까지 아래에 전부 정리</p>
        <p className="text-xs text-[#999] mt-1">거래처 만찬에서 실수 안 하는 법</p>
      </div>

      <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            요정에 들어서면 가야금 선율이 흐르고, 15가지 한정식이 하나씩 차려진다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정에서 한복 차림의 도우미가 요리를 올리고, 해금 연주가 배경에 깔린다. 요정 문화는 조선시대 기방에서 유래했고 지금도 거래처 만찬, VIP 접대 자리에서 "격이 다르다"는 평가를 받는다. 외국인 대접 자리에서는 반응이 더 뜨겁다. 국악 라이브를 처음 보는 외국인 거래처 임원이 감동해서 계약이 성사됐다는 실제 후기도 있다.
          </p>
          <MidContentHook seed="yojeong-intro" />
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정의 코스는 12첩 반상부터 산해진미 풀코스까지 계절 식재료로 구성한다. 봄에는 두릅과 냉이, 가을에는 송이와 전복이 올라온다. 음식 하나하나에 정성이 들어가니까 먹는 속도가 자연스럽게 느려지고, 대화가 길어진다. 이게 대접의 핵심이다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            전국적으로 요정 고유의 형식을 유지하는 곳이 점점 줄고 있다. 요정의 희소성이 높다. 일산명월관요정은 고양시 일산동구 장항로 895-1에 위치하며, 개별 룸 30개와 정찰제를 운영한다. 15가지 한정식 코스, 국악 라이브 연주, 발렛 주차까지 갖추고 있다. 신실장(010-3695-4929)이 예약부터 당일 안내까지 전부 챙겨준다. 바가지 걱정 없이 코스를 고르면 된다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            요정은 거래처 접대, VIP 만찬, 외국인 대접까지 폭넓게 쓰인다. 외국인 거래처 임원에게 국악 라이브를 보여줬더니 감동해서 계약이 성사됐다는 실제 후기도 있다. 좌식 테이블에 병풍이 둘러진 전통 공간인데, 요즘 이런 곳이 전국에 몇 안 남았다. 최소 하루 전 예약 문의는 필수이고, 인기 있는 주말 날짜는 2주 전에 잡아야 한다. 세미 포멀 이상 착장을 준비하자.
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

      <CategoryVSBattle venueA="일산명월관요정" venueB="강남청담클럽 아르쥬" topic="만찬 장소 대결 — 전통 정찬 vs 모던" />

      <RelatedMagazine articles={[
        { title: '일산명월관 완벽 가이드: 만찬부터 기념행사까지', tag: '격식' },
        { title: '한국 고유의 코스 요리 문화의 역사와 현재', tag: '문화' },
      ]} />

      <LiveActivityFeed maxItems={5} category="yojeong" />

      <BottomFinishCounter baseCount={108} />
    </div>
  );
}
