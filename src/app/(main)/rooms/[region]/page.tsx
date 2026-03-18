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
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        {!venue.nameKo.includes(venue.regionKo) && <span>{venue.regionKo}</span>}
      </div>
      <p className="text-sm text-neon-text-muted line-clamp-2">{venue.shortDescription}</p>
    </Card>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  return {
    title: { absolute: `${regionKo} 룸 | 오늘밤어디 - ${regionKo} 프라이빗 공간 정보` },
    description: `${regionKo} 프라이빗 공간 모음. 방음 수준, 좌석 배치, 가격대를 한눈에 확인하세요.`,
  };
}

export default async function RegionalRoomsPage({ params }: Props) {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  const rooms = getVenuesByCategoryAndRegion('room', region);
  const isIlsan = region === 'ilsan';

  return (
    <div className="bg-neon-bg">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '룸', href: '/rooms' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-neon-text">{regionKo} 룸</h1>
        <p className="mt-3 text-neon-text-muted">{regionKo} 지역의 프리미엄 프라이빗 공간을 소개합니다.</p>
      </section>

      {isIlsan && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="rounded-xl border border-neon-border bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-neon-text">일산 프라이빗 공간 안내</h2>
            <p className="text-sm leading-relaxed text-neon-text-muted">
              고양시 일산 지역을 중심으로 발달한 프라이빗 문화를 대표하는 공간입니다.
              교통이 편리한 일산 신도시 상권에 위치하여 직장인 회식, 비즈니스 접대,
              가족 모임 등 다양한 용도로 활용되고 있습니다.
              최신 인테리어와 고급 음향 시설을 갖춘 일산 지역 독립 공간 정보를 확인해 보세요.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((venue) => <VenueCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {rooms.length === 0 && (
          <p className="py-20 text-center text-neon-text-muted">{regionKo} 지역에 등록된 프라이빗 공간이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
