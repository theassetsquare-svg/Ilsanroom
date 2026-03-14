import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  const regions = new Set(getVenuesByCategory('room').map((v) => v.region));
  return Array.from(regions).map((region) => ({ region }));
}

interface Props {
  params: Promise<{ region: string }>;
}

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', ilsan: '일산',
  cheongdam: '청담', geondae: '건대',
};

function VenueCard({ venue, region }: { venue: Venue; region: string }) {
  return (
    <Card href={`/rooms/${region}/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500">★</span> {venue.rating}
        </span>
      </div>
      <p className="text-sm text-neutral-500 line-clamp-2">{venue.shortDescription}</p>
    </Card>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  return {
    title: `${regionKo} 룸 | NEON - ${regionKo}룸 정보`,
    description: `${regionKo} 지역 프리미엄 룸 리스트. ${regionKo}룸의 시설, 분위기, 서비스를 비교하고 나에게 맞는 룸을 찾아보세요.`,
  };
}

export default async function RegionalRoomsPage({ params }: Props) {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  const rooms = getVenuesByCategoryAndRegion('room', region);
  const isIlsan = region === 'ilsan';

  return (
    <div className="bg-neutral-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '룸', href: '/rooms' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-white">{regionKo} 룸</h1>
        <p className="mt-3 text-neutral-400">{regionKo} 지역의 프리미엄 룸을 소개합니다.</p>
      </section>

      {isIlsan && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="rounded-xl border border-rose-800/30 bg-rose-950/20 p-6">
            <h2 className="mb-3 text-lg font-bold text-white">일산룸 안내</h2>
            <p className="text-sm leading-relaxed text-neutral-400">
              일산룸은 고양시 일산 지역을 중심으로 발달한 프라이빗 룸 문화를 대표합니다.
              교통이 편리한 일산 신도시 상권에 위치하여 직장인 회식, 비즈니스 접대,
              가족 모임 등 다양한 용도로 활용되고 있습니다.
              최신 인테리어와 고급 음향 시설을 갖춘 일산 지역 룸 정보를 확인해 보세요.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((venue) => <VenueCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {rooms.length === 0 && (
          <p className="py-20 text-center text-neutral-600">{regionKo} 지역에 등록된 룸이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
