import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import PremiumBadge from '@/components/venue/PremiumBadge';
import VenueHero from '@/components/venue/VenueHero';
import StickyPhoneBar from '@/components/venue/StickyPhoneBar';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import ReviewSection from '@/components/venue/ReviewSection';
import QRCode from '@/components/venue/QRCode';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  return getVenuesByCategory('lounge').map((v) => ({
    slug: v.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

function RelatedCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/lounges/${venue.slug}`}>
      <h3 className="text-base font-bold text-white mb-1">{venue.nameKo}</h3>
      <p className="text-sm text-neutral-500">{venue.regionKo}</p>
    </Card>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '라운지를 찾을 수 없습니다 | 일산룸포털' };
  return {
    title: `${venue.nameKo} - ${venue.regionKo} 라운지 | 일산룸포털`,
    description: venue.description,
  };
}

export default async function LoungeDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'lounge') notFound();

  const related = getRelatedVenues(venue, 3);

  return (
    <div className="bg-neutral-950 pb-20">
      <PageViewTracker venueId={venue.id} venueName={venue.nameKo} category={venue.category} region={venue.region} />
      <VenueJsonLd
        venue={venue}
        breadcrumbItems={[
          { name: '일산룸포털', url: '/' },
          { name: '라운지', url: '/lounges' },
          { name: venue.nameKo, url: `/lounges/${venue.slug}` },
        ]}
        reviews={[
          { author: '김**', rating: 5, text: '분위기도 좋고 서비스도 최고였습니다.', date: '2026-03-10' },
          { author: '이**', rating: 4, text: '전체적으로 만족스러웠습니다.', date: '2026-03-05' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '라운지', href: '/lounges' }, { label: venue.nameKo }]} />
      </section>

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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">소개</h2>
              <p className="leading-relaxed text-neutral-400">{venue.description}</p>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">특징</h2>
              <ul className="grid grid-cols-2 gap-2">
                {venue.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="text-amber-400">●</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">분위기</h2>
              <div className="flex flex-wrap gap-2">
                {venue.atmosphere.map((a) => <Badge key={a} variant="lounge">{a}</Badge>)}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">태그</h2>
              <div className="flex flex-wrap gap-2">
                {venue.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="mb-4 font-bold text-white">기본 정보</h3>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-neutral-600">위치</dt><dd className="text-neutral-300">{venue.address}</dd></div>
                <div><dt className="text-neutral-600">영업시간</dt><dd className="text-neutral-300">{venue.openHours}</dd></div>
                <div><dt className="text-neutral-600">연령대</dt><dd className="text-neutral-300">{venue.ageGroup}</dd></div>
                <div><dt className="text-neutral-600">드레스코드</dt><dd className="text-neutral-300">{venue.dressCode}</dd></div>
                <div><dt className="text-neutral-600">주차</dt><dd className="text-neutral-300">{venue.parking}</dd></div>
                <div><dt className="text-neutral-600">가까운 역</dt><dd className="text-neutral-300">{venue.nearbyStation}</dd></div>
                <div><dt className="text-neutral-600">추천 방문 시간</dt><dd className="text-neutral-300">{venue.bestTime}</dd></div>
              </dl>
              <div className="mt-6 flex justify-center">
                <QRCode
                  url={`https://neon-nightlife.com/lounges/${venue.slug}`}
                  venueName={venue.nameKo}
                />
              </div>
              <a
                href={`/print/${venue.slug}`}
                target="_blank"
                className="mt-4 block text-center text-xs text-neutral-600 transition hover:text-violet-400"
              >
                프린트용 페이지 →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ReviewSection venueId={venue.id} venueName={venue.nameKo} />
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-white">관련 업소</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((v) => <RelatedCard key={v.id} venue={v} />)}
          </div>
        </section>
      )}
      <StickyPhoneBar
        phone={venue.staffPhone}
        staffName={venue.staffNickname}
        venueName={venue.nameKo}
      />
    </div>
  );
}
