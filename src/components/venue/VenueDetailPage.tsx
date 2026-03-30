import { Link } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import VenueDetailTabs from '@/components/venue/VenueDetailTabs';
import VenueGallery from '@/components/venue/VenueGallery';
import Card from '@/components/ui/Card';
import { useEngagementStore } from '@/lib/engagement-store';
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
}: VenueDetailPageProps) {
  const trackView = useEngagementStore((s) => s.trackView);
  useEffect(() => { trackView(venue.slug); }, [venue.slug, trackView]);

  // 업소 상세페이지: 전화바와 겹치는 하단 engagement 요소 숨기기
  useEffect(() => {
    document.body.classList.add('venue-detail-page');
    return () => { document.body.classList.remove('venue-detail-page'); };
  }, []);

  const nameHasRegion = venue.nameKo.includes(regionKo);
  const breadcrumbItems = [
    { name: '놀쿨', url: '/' },
    { name: categoryLabel, url: categoryPath },
    ...(nameHasRegion ? [] : [{ name: regionKo, url: regionPath }]),
    { name: venue.nameKo, url: detailPath },
  ];

  return (
    <div className="bg-neon-bg pb-20">
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
        <Link target="_blank" rel="noopener noreferrer" to="/guide" className="block rounded-2xl border border-neon-gold/30 bg-neon-gold/5 p-5 transition hover:border-neon-gold/50 card-hover">
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
        <Link target="_blank" rel="noopener noreferrer" to="/hidden" className="block rounded-2xl border border-neon-accent/30 bg-neon-accent/5 p-5 transition hover:border-neon-accent/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-sm font-bold text-neon-text">이 업소 몰랐지? — 매주 숨은 명소 발굴</p>
              <p className="text-xs text-neon-text-muted">다른 데서 안 나오는 숨은 곳들, 여기서만 파냄</p>
            </div>
          </div>
        </Link>
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
