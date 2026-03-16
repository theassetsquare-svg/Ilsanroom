import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: { absolute: '호빠 | 오늘밤어디 - 전국 호스트바 정보' },
  description: '여성 고객을 위한 프리미엄 호스트 엔터테인먼트. 강남 로얄·보스턴, 수원 비스트, 해운대 깐따삐야 등 전국 인기 호스트바 비교.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/DB2777/ffffff/png?text=%ED%98%B8%EB%B9%A0+%7C+%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' },
  { key: 'hongdae', label: '홍대' },
  { key: 'sinlim', label: '신림' },
  { key: 'geondae', label: '건대' },
  { key: 'jangandong', label: '장안동' },
  { key: 'songpa', label: '송파' },
  { key: 'yeongdeungpo', label: '영등포' },
  { key: 'suwon', label: '수원' },
  { key: 'incheon', label: '인천' },
  { key: 'busan-haeundae', label: '해운대' },
  { key: 'busan', label: '부산' },
  { key: 'daegu', label: '대구' },
  { key: 'daejeon', label: '대전' },
  { key: 'gwangju', label: '광주' },
  { key: 'ulsan', label: '울산' },
  { key: 'jeju', label: '제주' },
];

export default function HoppaPage() {
  const venues = getVenuesByCategory('hoppa');
  return (
    <div className="hoppa-theme mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      <div>
        <Breadcrumb items={[{ label: '호빠' }]} />
        <h1 className="mt-6 text-3xl font-extrabold text-pink-700 mb-4">
          호빠 <span className="text-lg font-normal text-pink-400">· 호스트클럽</span>
        </h1>

        {/* 여성 친화 안내 배너 — 로즈골드/핑크 */}
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-white to-rose-50 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💎</span>
            <h2 className="text-lg font-bold text-pink-700">여성을 위한 프리미엄 공간</h2>
          </div>
          <p className="text-base leading-relaxed text-pink-900/70">
            전문 호스트가 여성 고객에게 대화와 엔터테인먼트를 제공하는 여성 전용 프라이빗 공간입니다.
            편안한 분위기에서 대화와 게임을 즐기며 스트레스를 풀 수 있는 곳으로,
            강남·홍대·건대·장안동·수원·해운대·부산·대구·대전·인천·광주·울산·제주 등
            전국 주요 도시에 25곳 이상 위치해 있습니다.
            TC(타임차지) 방식으로 운영되며, 사전 전화 한 통이면 분위기와 이용 방법을
            바로 안내받을 수 있어서 처음 방문하시는 분도 부담 없이 이용할 수 있습니다.
            친구 생일, 회식 2차, 스트레스 해소 등 다양한 목적으로 방문하시는 여성분들이 많고,
            프라이빗한 공간에서 안전하게 즐길 수 있다는 것이 가장 큰 장점입니다.
            이 페이지의 모든 업소는 구글·네이버 검색으로 현재 영업 중인지 직접 확인한 곳만 등록했습니다.
          </p>
        </div>

        {/* 안전·가격·혼자 안내 카드 */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">💰 가격 투명</h3>
            <p className="text-sm text-pink-900/60">TC(타임차지)·주대 가격을 사전 전화로 확인 가능. 바가지 걱정 없다.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">🛡️ 안전 이용</h3>
            <p className="text-sm text-pink-900/60">모든 등록 업소는 영업 확인 완료. 불쾌한 상황 시 직원에게 즉시 요청.</p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <h3 className="text-sm font-bold text-pink-700 mb-2">👩 혼자도 OK</h3>
            <p className="text-sm text-pink-900/60">혼자 방문해도 직원이 친절하게 안내. 오히려 혼자 오는 분이 더 많다.</p>
          </div>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />

      <FirstVisitGuide category="호빠"
        dress="깔끔한 복장이면 충분. 편안하면서 예쁜 옷이면 더 좋다. 운동복만 아니면 된다."
        budget="TC(타임차지) 1시간 3~5만원대가 일반적. 주대(음료)는 별도. 사전에 전화로 총 예상 비용 꼭 확인."
        alone="혼자 방문 완전 가능! 오히려 혼자 오시는 분이 많다. 직원이 처음부터 끝까지 안내해준다."
        reservation="사전 전화 상담 강력 권장. 원하는 시간·인원·예산을 미리 말하면 딱 맞는 안내를 받을 수 있다."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~03:00', level: 85 },
        { day: '토요일', time: '21:00~04:00', level: 95 },
        { day: '목요일', time: '21:00~01:00', level: 50 },
        { day: '수요일', time: '21:00~00:00', level: 30 },
        { day: '일요일', time: '20:00~00:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="강남호빠 로얄" venueB="강남호빠 보스턴" topic="강남 호스트바 최강자는?" />

      <RelatedMagazine articles={[
        { title: '호스트 공간 처음 가는 분을 위한 완벽 가이드', tag: '입문' },
        { title: '강남 vs 해운대 — 지역별 분위기와 가격 비교', tag: '비교' },
      ]} />
    </div>
  );
}
