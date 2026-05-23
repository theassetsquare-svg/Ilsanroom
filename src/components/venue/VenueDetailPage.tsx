import { Link } from '../ui/SafeLink';
import { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueDetailTabs from '@/components/venue/VenueDetailTabs';
import VenueGallery from '@/components/venue/VenueGallery';
import Card from '@/components/ui/Card';
import ShareButtons from '@/components/interactive/ShareButtons';
import { MidContentHook } from '@/components/engagement/ReadingEngagement';
import RelatedVenues30 from '@/components/venue/RelatedVenues30';
import RelatedMagazineForVenue from '@/components/venue/RelatedMagazineForVenue';
import LiveStats from '@/components/live/LiveStats';
import VenueLivePulse from '@/components/venue/VenueLivePulse';
import type { Venue } from '@/types';

const VenueSeoContent = lazy(() => import('@/components/venue/VenueSeoContent'));

interface FAQ {
  question: string;
  answer: string;
}

interface VenueDetailPageProps {
  venue: Venue;
  categoryLabel: string;
  categoryPath: string;
  regionKo: string;
  regionPath: string;
  detailPath: string;
  faqs: FAQ[];
  related: Venue[];
  relatedHrefFn: (v: Venue) => string;
  extraContent?: React.ReactNode;
  topContent?: React.ReactNode;
}


export default function VenueDetailPage({
  venue,
  categoryLabel,
  categoryPath,
  regionKo,
  regionPath,
  detailPath,
  faqs,
  related,
  relatedHrefFn,
  extraContent,
  topContent,
}: VenueDetailPageProps) {
  // 업소 상세페이지: 전화바와 겹치는 하단 engagement 요소 숨기기
  useEffect(() => {
    document.body.classList.add('venue-detail-page');
    return () => { document.body.classList.remove('venue-detail-page'); };
  }, []);

  // "지금 N명 보는 중" — 시드 기반 가짜 카운터 제거 (놀쿨 신뢰 규칙).
  // VenueLivePulse 자체가 null 컴포넌트라 0을 넘겨도 무시됨.
  const viewingNow = 0;

  // 비슷한 업소 — 동적 hook text
  const relatedHookText = useMemo(() => {
    const hooks = [
      '여기 다녀온 사람들이 같이 가본 곳',
      '이 업소 좋아하면 여기도 갈만하다',
      '단골들이 번갈아 가는 곳',
    ];
    const hash = venue.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return hooks[hash % hooks.length];
  }, [venue.slug]);

  return (
    <div className="bg-neon-bg">
      {/* JSON-LD (NightClub/BarOrPub + BreadcrumbList + FAQPage) is emitted by SSR prerender-seo.mjs.
          Runtime React duplicate removed 2026-05-19 to fix Google Rich Results "FAQPage 입력란이 중복되었습니다" error. */}

      {/* ═══ 1. Breadcrumb ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <Breadcrumb items={[
          { label: categoryLabel, href: categoryPath },
          ...(venue.nameKo.includes(regionKo) ? [] : [{ label: regionKo, href: regionPath }]),
          { label: venue.nameKo },
        ]} />
      </section>

      {/* ═══ 2. Hero ═══ */}
      <VenueHero
        name={venue.nameKo}
        staffNickname={venue.staffNickname}
        isPremium={venue.isPremium}
        category={venue.category}
        regionKo={venue.regionKo}
        slug={venue.slug}
      />

      {/* ═══ 3. 라이브 펄스 — 보는중/조회/찜 회전 메시지 ═══ */}
      <div className="mx-auto max-w-[1200px] px-4 pt-3 sm:px-6">
        <VenueLivePulse slug={venue.slug} isPremium={venue.isPremium} initialViewing={viewingNow} />
      </div>


      {/* Top Content — 히어로 바로 아래 */}
      {topContent && (
        <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
          {topContent}
        </section>
      )}

      {/* ═══ 5. Venue Photo Gallery (moved up before tabs) ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueGallery slug={venue.slug} name={venue.nameKo} />
      </section>

      {/* ═══ 6. 8-Tab Content ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueDetailTabs venue={venue} faqs={faqs} categoryLabel={categoryLabel} />
      </section>

      {/* ═══ 7. Mid-content hook divider ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <MidContentHook seed={venue.slug} variant={3} />
      </section>

      {/* ═══ 8. SEO Content — 모든 업소에 자동 1000자+ 고유 콘텐츠 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Suspense fallback={null}>
          <VenueSeoContent venue={venue} />
        </Suspense>
      </section>

      {/* Extra Content (e.g. 일산명월관 전용 2000자 SEO) */}
      {extraContent && (
        <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          {extraContent}
        </section>
      )}

      {/* ═══ 9. Share — 바이럴 루프 (읽은 뒤에 공유) ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-2 pb-4 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#F3F0FF] to-white border border-[#E9E5FF] p-4">
          <p className="text-center text-xs font-bold text-[#8B5CF6] mb-2">이 정보 괜찮았다면 — 친구한테 보내기</p>
          <ShareButtons
            title={venue.nameKo}
            description={venue.shortDescription || venue.description.slice(0, 80)}
          />
        </div>
      </section>

      {/* ═══ 10. 첫 방문 가이드 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/guide" className="block rounded-2xl border border-neon-gold/30 bg-neon-gold/5 p-5 transition hover:border-neon-gold/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{'\uD83D\uDCD6'}</span>
            <div>
              <p className="text-sm font-bold text-neon-text">처음 방문이세요?</p>
              <p className="text-xs text-neon-text-muted">복장, 예산, 매너 — 첫 방문 완벽 가이드 보기</p>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══ 10-b. 관련 매거진 — 본문 키워드 기반 자동 cross-link (역방향) ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <RelatedMagazineForVenue venue={venue} />
      </section>

      {/* ═══ 11. 30개 추천 카드 (비교 늪) ═══ */}
      <RelatedVenues30 venue={venue} />

      {/* ═══ 11-b. 실시간 현황 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <LiveStats />
      </section>

      {/* ═══ 12. 숨은 명소 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/hidden" className="block rounded-2xl border border-neon-accent/30 bg-neon-accent/5 p-5 transition hover:border-neon-accent/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{'\uD83D\uDC8E'}</span>
            <div>
              <p className="text-sm font-bold text-neon-text">이 업소 몰랐지? — 매주 숨은 명소 발굴</p>
              <p className="text-xs text-neon-text-muted">다른 데서 안 나오는 숨은 곳들, 여기서만 파냄</p>
            </div>
          </div>
        </Link>
      </section>


      {/* ═══ 14. Sticky Phone Bar ═══ */}
      <StickyPhoneBar
        phone={venue.staffPhone}
        staffName={venue.staffNickname}
        venueName={venue.nameKo}
      />
    </div>
  );
}
