import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  const regions = new Set(getVenuesByCategory('club').map((v) => v.region));
  return Array.from(regions).map((region) => ({ region }));
}

interface Props {
  params: Promise<{ region: string }>;
}

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', itaewon: '이태원', haeundae: '해운대',
  ilsan: '일산', cheongdam: '청담', paju: '파주', suwon: '수원',
  sinlim: '신림', busan: '부산', daejeon: '대전', geondae: '건대',
};

function VenueCard({ venue, href }: { venue: Venue; href: string }) {
  return (
    <Card href={href}>
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
    title: `${regionKo} 클럽 | 오늘밤어디`,
    description: `${regionKo} 지역 인기 클럽 리스트. ${regionKo}의 다양한 클럽 정보와 리뷰를 확인하세요.`,
  };
}

export default async function RegionalClubsPage({ params }: Props) {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  const clubs = getVenuesByCategoryAndRegion('club', region);

  return (
    <div className="bg-neutral-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '클럽', href: '/clubs' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-white">{regionKo} 클럽</h1>
        <p className="mt-3 text-neutral-400">{regionKo} 지역의 인기 클럽을 소개합니다.</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((venue) => (
            <VenueCard key={venue.id} venue={venue} href={`/clubs/${region}/${venue.slug}`} />
          ))}
        </div>
        {clubs.length === 0 && (
          <p className="py-20 text-center text-neutral-600">{regionKo} 지역에 등록된 클럽이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
