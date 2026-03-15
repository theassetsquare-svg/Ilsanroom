import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '클럽 | 오늘밤어디 - 강남·홍대·이태원·부산 EDM 힙합 클럽',
  description: 'EDM·힙합·테크노 장르별로 골라가는 재미. 강남 레이스부터 홍대, 이태원, 부산까지 DJ 라인업과 입장료를 한눈에 비교하세요.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/8B5CF6/ffffff/png?text=클럽 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' }, { key: 'itaewon', label: '이태원' },
  { key: 'apgujeong', label: '압구정' }, { key: 'sinchon', label: '신촌' }, { key: 'geondae', label: '건대' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'incheon', label: '인천' }, { key: 'suwon', label: '수원' }, { key: 'jeju', label: '제주' },
];

export default function ClubsPage() {
  const venues = getVenuesByCategory('club');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '클럽' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">클럽</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            DJ가 선곡하는 EDM, 하우스, 테크노, 힙합 등 전자음악을 중심으로 운영되는 엔터테인먼트 공간입니다.
            소셜댄스 중심의 사교장과는 완전히 다른 업종으로, 20대~30대 초반 고객이 주를 이루며
            스탠딩 중심의 댄스 플로어에서 음악에 맞춰 자유롭게 즐기는 것이 특징입니다.
            강남은 대형 EDM 메가 공간이 밀집해 있으며, 홍대는 인디·힙합·EDM 등 다양한 장르의 중소형 공간이 특색입니다.
            이태원은 외국인 비율이 높아 글로벌한 파티 문화를 경험할 수 있고, 부산 서면에도 지역 특색의 씬이 형성되어 있습니다.
            국내외 유명 DJ 게스트 공연, 테이블 예약, 드레스코드 등 업소별 특성을 비교하여 자신에게 맞는 곳을 선택하세요.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/clubs/{region}/{slug}" regions={regions} />

      <FirstVisitGuide category="클럽"
        dress="스마트 캐주얼 (셔츠+슬랙스 or 깔끔한 청바지). 슬리퍼·운동복 입장 제한. 여성은 드레스나 블라우스+스커트."
        budget="입장료 2~3만원 + 음료 1~2만원. 테이블 예약 시 35~50만원+ (주말). 평일은 상대적으로 저렴."
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

      <CategoryVSBattle venueA="강남클럽레이스" venueB="클럽NB2" topic="이번 주 EDM 대결 — 논현 vs 홍대" />

      <RelatedMagazine articles={[
        { title: '논현 EDM TOP5 — 올해 꼭 가봐야 할 곳', tag: '추천' },
        { title: '홍대 vs 이태원 — 어디가 나에게 맞을까?', tag: '비교' },
      ]} />
    </div>
  );
}
