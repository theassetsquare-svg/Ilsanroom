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
    { name: '오늘밤어디', url: '/' },
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
        reviews={[]}
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
        isPremium={venue.isPremium}
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

      {/* [D] 첫 방문 가이드 */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/guide" target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-neon-gold/30 bg-neon-gold/5 p-5 transition hover:border-neon-gold/50 card-hover">
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
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-neon-text">비슷한 업소</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.slice(0, 2).map((v) => (
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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/hidden" target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-neon-accent/30 bg-neon-accent/5 p-5 transition hover:border-neon-accent/50 card-hover">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-sm font-bold text-neon-text">이 업소 몰랐지? — 매주 숨은 명소 발굴</p>
              <p className="text-xs text-neon-text-muted">다른 사이트에서 찾기 어려운 알짜 업소를 만나보세요</p>
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
