import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '나이트 | 오늘밤어디 - 전국 소셜댄스 부킹 명소',
  description: '라이브 밴드와 소셜 댄스를 동시에 즐기는 사교 공간. 수원찬스돔, 부산연산동물 등 지역별 명소와 드레스코드·이용 팁 안내.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/F43F5E/ffffff/png?text=나이트 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'seoul', label: '서울' }, { key: 'ilsan', label: '일산' },
  { key: 'suwon', label: '수원' }, { key: 'seongnam', label: '성남' }, { key: 'incheon', label: '인천' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'gwangju', label: '광주' }, { key: 'ulsan', label: '울산' }, { key: 'paju', label: '파주' },
  { key: 'changwon', label: '창원' }, { key: 'jeonju', label: '전주' }, { key: 'jeju', label: '제주' },
];

export default function NightsPage() {
  const venues = getVenuesByCategory('night');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '나이트' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-neon-text mb-4">소셜댄스 · 부킹</h1>
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-6">
          <p className="text-base leading-relaxed text-neon-text-muted">
            소셜 댄스 중심의 사교 공간으로, EDM 중심의 댄스홀과는 완전히 다른 업종입니다.
            주로 30대~50대 고객이 방문하며, 라이브 밴드가 트로트·팝·발라드 등 다양한 음악을 연주합니다.
            파트너와 함께 춤을 즐기는 것이 핵심이며, 부킹 시스템을 통해 이성 간 매칭이 이루어집니다.
            좌석은 부스, 룸, 테이블, 홀 등 다양한 형태로 구성됩니다. 양주 등 주류를 주문하여 웨이터 서비스를
            받으며 즐기는 것이 일반적입니다. 365일 운영하는 대형 업소부터
            지역 밀착형 소규모까지 전국에 분포해 있으며, 처음 방문하시는 분도 웨이터 안내를 통해
            편안하게 즐길 수 있습니다.
          </p>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/nights/{slug}" regions={regions} />

      <FirstVisitGuide category="나이트"
        dress="세미 포멀~포멀 권장. 정장 또는 셋업이 기본. 너무 캐주얼하면 분위기에 안 맞을 수 있음."
        budget="입장료 1~3만원 + 양주 1병 10~30만원. 부스/룸 추가 비용 발생. 웨이터 팁 별도."
        alone="웨이터에게 안내 요청하면 부스 배정. 부킹 시스템으로 파트너 매칭 가능."
        reservation="부스는 사전 예약 권장. 금토 저녁에는 일찍 가야 좋은 자리 확보 가능."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~02:00', level: 95 },
        { day: '토요일', time: '21:00~03:00', level: 100 },
        { day: '목요일', time: '20:00~01:00', level: 55 },
        { day: '수요일', time: '20:00~00:00', level: 35 },
        { day: '일요일', time: '19:00~23:00', level: 40 },
      ]} />

      <CategoryVSBattle venueA="수원찬스돔나이트" venueB="인천아라비안나이트" topic="경기 나이트 최강자는?" />

      <RelatedMagazine articles={[
        { title: '처음 방문하는 분을 위한 A to Z 매너 가이드', tag: '입문' },
        { title: '전국 소셜댄스 명소 지역별 특징 총정리', tag: '정보' },
      ]} />
    </div>
  );
}
