import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
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
  if (!venue) return { title: '라운지를 찾을 수 없습니다 | NEON' };
  return {
    title: `${venue.nameKo} - ${venue.regionKo} 라운지 | NEON`,
    description: venue.description,
  };
}

export default async function LoungeDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue || venue.category !== 'lounge') notFound();

  const related = getRelatedVenues(venue, 3);

  return (
    <div className="bg-neutral-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '라운지', href: '/lounges' }, { label: venue.nameKo }]} />
      </section>

      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 to-neutral-950" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
            {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{venue.nameKo}</h1>
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
            </div>
          </div>
        </div>
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
