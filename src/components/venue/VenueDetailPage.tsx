import { Link } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import VenueDetailTabs from '@/components/venue/VenueDetailTabs';
import VenueGallery from '@/components/venue/VenueGallery';
import Card from '@/components/ui/Card';
import ShareButtons from '@/components/interactive/ShareButtons';
import LiveActivityFeed from '@/components/ui/LiveActivityFeed';
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

  // "지금 N명 보는 중" — 365일 매일 다른 수치, 24시간 활발
  const [viewingNow] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    const hash = venue.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    // 날짜 시드: 매일 다른 값
    const daySeed = now.getFullYear() * 400 + (now.getMonth() + 1) * 32 + now.getDate();
    const dayVar = ((daySeed * 2654435761 + hash) >>> 0) % 5; // 0~4 매일 다른 보정
    // 요일 배율: 금토 피크
    const dow = now.getDay();
    const dowMult = (dow === 5 || dow === 6) ? 1.0 : (dow === 0 || dow === 4) ? 0.85 : 0.75;
    let timeMult: number;
    if (hour >= 22 || hour < 2) timeMult = 1.0;
    else if (hour >= 20) timeMult = 0.9;
    else if (hour >= 17) timeMult = 0.7;
    else if (hour >= 12) timeMult = 0.5;
    else if (hour >= 6) timeMult = 0.45;
    else timeMult = 0.5;
    const base = venue.isPremium ? 8 : 4;
    const raw = base + (hash % 6) + dayVar;
    return Math.max(2, Math.round(raw * timeMult * dowMult) + Math.floor(Math.random() * 3));
  });

  const nameHasRegion = venue.nameKo.includes(regionKo);
  const breadcrumbItems = [
    { name: '놀쿨', url: '/' },
    { name: categoryLabel, url: categoryPath },
    ...(nameHasRegion ? [] : [{ name: regionKo, url: regionPath }]),
    { name: venue.nameKo, url: detailPath },
  ];

  return (
    <div className="bg-neon-bg">
      <PageViewTracker venueId={venue.id} venueName={venue.nameKo} category={venue.category} region={venue.region} />
      <VenueJsonLd
        venue={venue}
        breadcrumbItems={breadcrumbItems}
        faqItems={faqs}
        reviews={[]}
        detailPath={detailPath}
      />

      {/* Breadcrumb — 이름에 지역 포함 시 지역 단계 생략 (중복 방지) */}
      <section className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <Breadcrumb items={[
          { label: categoryLabel, href: categoryPath },
          ...(venue.nameKo.includes(regionKo) ? [] : [{ label: regionKo, href: regionPath }]),
          { label: venue.nameKo },
        ]} />
      </section>

      {/* Hero */}
      <VenueHero
        name={venue.nameKo}
        staffNickname={venue.staffNickname}
        isPremium={venue.isPremium}
        category={venue.category}
        regionKo={venue.regionKo}
        slug={venue.slug}
      />

      {/* 지금 보는 중 */}
      <div className="mx-auto max-w-[1200px] px-4 pt-3 sm:px-6">
        <p className="text-xs text-[#8B5CF6] font-medium">👀 지금 {viewingNow}명이 이 페이지를 보고 있습니다</p>
      </div>

      {/* Top Content — 히어로 바로 아래 */}
      {topContent && (
        <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
          {topContent}
        </section>
      )}

      {/* ═══ Share — 바이럴 루프 ═══ */}
      <section className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#F3F0FF] to-white border border-[#E9E5FF] p-4">
          <p className="text-center text-xs font-bold text-[#8B5CF6] mb-2">친구한테 보내기</p>
          <ShareButtons
            title={venue.nameKo}
            description={venue.shortDescription || venue.description.slice(0, 80)}
          />
        </div>
      </section>

      {/* Venue Photo Gallery */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueGallery slug={venue.slug} name={venue.nameKo} />
      </section>

      {/* 8-Tab Content */}
      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        <VenueDetailTabs venue={venue} faqs={faqs} categoryLabel={categoryLabel} />
      </section>

      {/* SEO Content — 모든 업소에 자동 1000자+ 고유 콘텐츠 */}
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


      {/* [D] 첫 방문 가이드 */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/guide" className="block rounded-2xl border border-neon-gold/30 bg-neon-gold/5 p-5 transition hover:border-neon-gold/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <p className="text-sm font-bold text-neon-text">처음 방문이세요?</p>
              <p className="text-xs text-neon-text-muted">복장, 예산, 매너 — 첫 방문 완벽 가이드 보기</p>
            </div>
          </div>
        </Link>
      </section>

      {/* Bottom Recommendations */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-neon-text">비슷한 업소</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.slice(0, 3).map((v) => (
              <Card key={v.id} href={relatedHrefFn(v)}>
                <h3 className="text-base font-bold text-neon-text mb-1">{v.nameKo}</h3>
                {v.staffNickname && <p className="text-xs text-neon-gold">{v.staffNickname}</p>}
                <p className="text-sm text-neon-text-muted">추천</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* [C] 숨은 명소 */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Link to="/hidden" className="block rounded-2xl border border-neon-accent/30 bg-neon-accent/5 p-5 transition hover:border-neon-accent/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-sm font-bold text-neon-text">이 업소 몰랐지? — 매주 숨은 명소 발굴</p>
              <p className="text-xs text-neon-text-muted">다른 데서 안 나오는 숨은 곳들, 여기서만 파냄</p>
            </div>
          </div>
        </Link>
      </section>

      {/* 실시간 활동 피드 */}
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <LiveActivityFeed maxItems={4} compact />
      </section>

      {/* Sticky Phone Bar */}
      <StickyPhoneBar
        phone={venue.staffPhone}
        staffName={venue.staffNickname}
        venueName={venue.nameKo}
      />
    </div>
  );
}
