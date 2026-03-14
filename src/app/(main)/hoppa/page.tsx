import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueListClient from '@/components/venue/VenueListClient';
import { FirstVisitGuide, PopularTimes, CategoryVSBattle, RelatedMagazine } from '@/components/venue/CategoryExtras';
import { getVenuesByCategory } from '@/data/venues';

export const metadata: Metadata = {
  title: '호빠 | 오늘밤어디 - 강남·부산·대구·대전·홍대·전주·제주 호스트바',
  description: '전국 호빠(호스트바) 정보. 강남보스턴, 수원비스트, 대구퍼펙트, 해운대깐따삐야 등 검증된 호스트클럽 리스트.',
  openGraph: { images: [{ url: 'https://placehold.co/1200x630/EC4899/ffffff/png?text=호빠 | 오늘밤어디', width: 1200, height: 630 }] },
};

const regions = [
  { key: 'gangnam', label: '강남' }, { key: 'hongdae', label: '홍대' },
  { key: 'seoul', label: '서울' }, { key: 'suwon', label: '수원' }, { key: 'dongtan', label: '동탄' },
  { key: 'busan', label: '부산' }, { key: 'daegu', label: '대구' }, { key: 'daejeon', label: '대전' },
  { key: 'gwangju', label: '광주' }, { key: 'ulsan', label: '울산' },
  { key: 'jeonju', label: '전주' }, { key: 'jeju', label: '제주' },
];

export default function HoppaPage() {
  const venues = getVenuesByCategory('hoppa');
  return (
    /* ★ 호빠 전용 — 로즈골드/핑크 여성 친화 테마 래퍼 */
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12"
      style={{ '--hoppa-rose': '#F9A8D4', '--hoppa-gold': '#D4A574' } as React.CSSProperties}>

      <div>
        <Breadcrumb items={[{ label: '호빠' }]} />
        <h1 className="mt-6 text-3xl font-extrabold mb-4" style={{ color: '#F9A8D4' }}>
          호빠 <span className="text-lg font-normal text-pink-300/60">· 호스트클럽</span>
        </h1>

        {/* 여성 친화 안내 배너 */}
        <div className="rounded-2xl border border-pink-400/20 bg-gradient-to-r from-pink-950/30 via-neon-surface to-rose-950/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💎</span>
            <h2 className="text-lg font-bold text-pink-300">여성을 위한 프리미엄 공간</h2>
          </div>
          <p className="text-base leading-relaxed text-pink-200/70">
            호스트클럽은 전문 호스트가 여성 고객에게 대화와 엔터테인먼트를 제공하는 여성 전용 공간입니다.
            프라이빗 룸이나 부스에서 편안하게 시간을 보낼 수 있으며,
            강남·홍대·부산·대구·대전·수원·광주·울산·전주·제주 등 전국 주요 도시에 위치해 있습니다.
            사전 전화 상담을 통해 분위기, 가격, 이용 방법을 안내받을 수 있어
            처음 방문하시는 분도 부담 없이 이용 가능합니다.
            모든 업소는 구글/네이버 검색을 통해 2026년 현재 영업 중인 곳만 확인하여 등록했습니다.
          </p>
        </div>

        {/* 안전 & 가격 투명 안내 */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-pink-400/15 bg-pink-950/20 p-4">
            <h3 className="text-sm font-bold text-pink-300 mb-2">💰 가격 투명</h3>
            <p className="text-sm text-pink-200/60">TC(타임차지)·주대 등 가격 체계를 사전 전화로 확인 가능. 바가지 걱정 NO.</p>
          </div>
          <div className="rounded-xl border border-pink-400/15 bg-pink-950/20 p-4">
            <h3 className="text-sm font-bold text-pink-300 mb-2">🛡️ 안전 이용</h3>
            <p className="text-sm text-pink-200/60">모든 등록 업소는 영업 확인 완료. 불쾌한 상황 시 직원에게 즉시 요청 가능.</p>
          </div>
          <div className="rounded-xl border border-pink-400/15 bg-pink-950/20 p-4">
            <h3 className="text-sm font-bold text-pink-300 mb-2">👩 혼자도 OK</h3>
            <p className="text-sm text-pink-200/60">혼자 방문해도 직원이 친절하게 안내. 부담 없는 분위기.</p>
          </div>
        </div>
      </div>

      <VenueListClient venues={venues} hrefPattern="/hoppa/{slug}" regions={regions} />

      <FirstVisitGuide category="호빠"
        dress="깔끔한 복장이면 충분합니다. 편안하면서 예쁜 옷이면 더 좋아요. 운동복만 아니면 됩니다."
        budget="TC(타임차지) 1시간 3~5만원대가 일반적. 주대(음료)는 별도. 사전에 전화로 총 예상 비용 꼭 확인하세요."
        alone="혼자 방문 완전 가능합니다! 오히려 혼자 오시는 분이 많아요. 직원이 처음부터 끝까지 안내해드립니다."
        reservation="사전 전화 상담 강력 권장. 원하는 시간·인원·예산을 미리 말하면 딱 맞는 안내를 받을 수 있어요."
      />

      <PopularTimes slots={[
        { day: '금요일', time: '21:00~03:00', level: 85 },
        { day: '토요일', time: '21:00~04:00', level: 95 },
        { day: '목요일', time: '21:00~01:00', level: 50 },
        { day: '수요일', time: '21:00~00:00', level: 30 },
        { day: '일요일', time: '20:00~00:00', level: 35 },
      ]} />

      <CategoryVSBattle venueA="강남보스턴호빠" venueB="대구퍼펙트호빠" topic="호스트클럽 최강자는?" />

      <RelatedMagazine articles={[
        { title: '호빠 처음 가는 분을 위한 완벽 가이드 — 가격, 매너, 팁', tag: '입문' },
        { title: '강남 vs 부산 vs 대구 호빠 — 지역별 분위기와 가격 비교', tag: '비교' },
      ]} />
    </div>
  );
}
