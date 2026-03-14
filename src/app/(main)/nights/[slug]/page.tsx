import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageViewTracker from '@/components/venue/PageViewTracker';
import PremiumBadge from '@/components/venue/PremiumBadge';
import VenueJsonLd from '@/components/venue/VenueJsonLd';
import ReviewSection from '@/components/venue/ReviewSection';
import QRCode from '@/components/venue/QRCode';
import { getVenueBySlug, getRelatedVenues, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  return getVenuesByCategory('night').map((v) => ({
    slug: v.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

function RelatedCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/nights/${venue.slug}`}>
      <h3 className="text-base font-bold text-white mb-1">{venue.nameKo}</h3>
      <p className="text-sm text-neutral-500">{venue.regionKo}</p>
    </Card>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return { title: '나이트를 찾을 수 없습니다 | NEON' };
  return {
    title: `${venue.nameKo} - ${venue.regionKo} 나이트 | NEON`,
    description: venue.description,
  };
}

export default async function NightDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'night') notFound();

  const related = getRelatedVenues(venue, 3);

  return (
    <div className="bg-neutral-950">
      <PageViewTracker venueId={venue.id} venueName={venue.nameKo} category={venue.category} region={venue.region} />
      <VenueJsonLd
        venue={venue}
        breadcrumbItems={[
          { name: 'NEON', url: '/' },
          { name: '나이트', url: '/nights' },
          { name: venue.nameKo, url: `/nights/${venue.slug}` },
        ]}
        reviews={[
          { author: '김**', rating: 5, text: '분위기도 좋고 서비스도 최고였습니다.', date: '2026-03-10' },
          { author: '이**', rating: 4, text: '전체적으로 만족스러웠습니다.', date: '2026-03-05' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '나이트', href: '/nights' }, { label: venue.nameKo }]} />
      </section>

      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 to-neutral-950" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <PremiumBadge isPremium={venue.isPremium} isVerified={venue.isVerified} />
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">{venue.nameKo}</h1>
          <div className="mt-3 flex items-center gap-3 text-neutral-400">
            <span className="flex items-center gap-1"><span className="text-yellow-500">★</span> {venue.rating}</span>
            <span>·</span><span>리뷰 {venue.reviewCount}개</span>
            <span>·</span><span>{venue.regionKo}</span>
          </div>
        </div>
      </section>

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
                    <span className="text-blue-400">●</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-white">분위기</h2>
              <div className="flex flex-wrap gap-2">
                {venue.atmosphere.map((a) => <Badge key={a} variant="night">{a}</Badge>)}
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
                  url={`https://neon-nightlife.com/nights/${venue.slug}`}
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
    </div>
  );
}
