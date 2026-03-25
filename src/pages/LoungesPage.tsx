
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'cheongdam', label: '청담' },
  { key: 'busan', label: '부산' }, { key: 'daejeon', label: '대전' },
];

export default function LoungesPage() {
  useDocumentMeta('셰이커 소리만 들리는 곳, 대화에 집중하고 싶다면 | 밤키', '압구정·청담 감각적인 바 3곳. 비즈니스 접대와 데이트에 딱 맞는 무드 살펴보기.');
  const venues = getVenuesByCategory('lounge');
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '라운지' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">감각적인 칵테일 바 · 라운지</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6 space-y-4">
          <p className="text-lg font-bold text-neon-text">
            조명이 어둡다. 소파가 깊다. 바텐더가 흔드는 셰이커 소리만 들린다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            시끄러운 곳이 싫은 사람한테 딱이다. 음악은 깔리는데 대화가 안 묻힌다. 맞은편 사람 얼굴이 잘 보이고, 목소리가 선명하게 들린다. 그래서 비즈니스 접대나 소개팅 장소로 핫하다. 무드가 확실하니까.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            근처 청담 일대에 집중되어 있다. VIP 전용 부스는 미리 연락제로 운영하고, 부스마다 전담 스태프가 붙는다. 바에서 앉으면 바텐더가 취향을 물어보고 시그니처 드링크를 만들어준다. 위스키 셀렉션이 100종 넘는 곳도 있고, 내추럴 와인이나 크래프트 진토닉에 특화된 곳도 있다.
          </p>
          <p className="text-base leading-relaxed text-neon-text-muted">
            1인으로 와서 바에서 앉는 사람도 많다. 오히려 1인이 오는 게 자연스러운 곳이다. 한 잔 비용 1.5~3만 원 정도. 세미포멀 편한 차림이면 어디든 들어간다. 금토 저녁은 만석이 잦으니 당일 전화로 빈자리 확인하는 게 안전하다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/lounges/{slug}" regions={regions} />

      <FirstVisitGuide category="칵테일 바"
        dress="세미포멀 편한 차림 이상. 세련된 착장 추천. 트레이닝·샌들 비추."
        budget="드링크 1잔 1.5~3만 원. 프라이빗 부스는 최소 주문 금액 있을 수 있음."
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

      <CategoryVSBattle venueA="디엠" venueB="이디엇" topic="해당 동네 감성 바 맞대결" />

      <RelatedMagazine articles={[
        { title: '논현·청담 무드 좋은 바 — 취향별 고르는 가이드', tag: '픽' },
        { title: '1인 가기 좋은 프라이빗 장소 TOP5', tag: '혼술' },
      ]} />
    </div>
  );
}
