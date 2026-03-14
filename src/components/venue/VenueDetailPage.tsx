import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import VenueDetailTabs from '@/components/venue/VenueDetailTabs';
import Card from '@/components/ui/Card';
import type { Venue } from '@/types';

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
  const breadcrumbItems = [
    { name: '일산룸포털', url: '/' },
    { name: categoryLabel, url: categoryPath },
    { name: regionKo, url: regionPath },
    { name: venue.nameKo, url: detailPath },
  ];

  return (
    <div className="bg-neon-bg" style={{ paddingBottom: '80px' }}>
      <PageViewTracker venueId={venue.id} venueName={venue.nameKo} category={venue.category} region={venue.region} />
      <VenueJsonLd
        venue={venue}
        breadcrumbItems={breadcrumbItems}
        faqItems={faqs}
        reviews={[
          { author: '방문객', rating: venue.rating, text: `${venue.nameKo}은(는) 분위기도 좋고 서비스도 만족스럽습니다.`, date: '2026-03-10' },
        ]}
      />

      {/* Breadcrumb */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Breadcrumb items={[
          { label: categoryLabel, href: categoryPath },
          { label: regionKo, href: regionPath },
          { label: venue.nameKo },
        ]} />
      </section>

      {/* Hero */}
      <VenueHero
        name={venue.nameKo}
        staffNickname={venue.staffNickname}
        rating={venue.rating}
        reviewCount={venue.reviewCount}
        isPremium={venue.isPremium}
        isVerified={venue.isVerified}
        category={venue.category}
        regionKo={venue.regionKo}
      />

      {/* 8-Tab Content */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <VenueDetailTabs venue={venue} faqs={faqs} categoryLabel={categoryLabel} />
      </section>

      {/* Extra Content (e.g. 일산명월관 전용 2000자 SEO) */}
      {extraContent && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {extraContent}
        </section>
      )}

      {/* Bottom Recommendations */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-neon-text">비슷한 업소</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((v) => (
              <Card key={v.id} href={relatedHrefFn(v)}>
                <h3 className="text-base font-bold text-neon-text mb-1">{v.nameKo}</h3>
                {v.staffNickname && <p className="text-xs text-neon-gold">담당: {v.staffNickname}</p>}
                <p className="text-sm text-neon-text-muted">{v.regionKo} · {categoryLabel}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tags for SEO */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {venue.tags.map((t) => (
            <span key={t} className="rounded-full border border-neon-border bg-neon-surface-2 px-3 py-1 text-xs text-neon-text-muted">#{t}</span>
          ))}
        </div>
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
