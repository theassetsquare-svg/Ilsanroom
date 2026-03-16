import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion, getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export function generateStaticParams() {
  const regions = new Set(getVenuesByCategory('yojeong').map((v) => v.region));
  return Array.from(regions).map((region) => ({ region }));
}

interface Props {
  params: Promise<{ region: string }>;
}

const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', ilsan: '일산', cheongdam: '청담',
};

function VenueCard({ venue, region }: { venue: Venue; region: string }) {
  return (
    <Card href={`/yojeong/${region}/${venue.slug}`}>
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
    title: { absolute: `${regionKo} 요정 | 오늘밤어디 - ${regionKo} 전통 한정식 공간` },
    description: `${regionKo} 지역 전통 한정식 문화 공간 리스트. 코스 요리, 국악 공연, 프라이빗 다이닝을 비교하고 나에게 맞는 곳을 찾아보세요.`,
  };
}

export default async function RegionalYojeongPage({ params }: Props) {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  const yojeongs = getVenuesByCategoryAndRegion('yojeong', region);
  const isIlsan = region === 'ilsan';

  return (
    <div className="bg-neon-bg">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '요정', href: '/yojeong' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-neon-text">{regionKo} 전통 한정식</h1>
        <p className="mt-3 text-neon-text-muted">{regionKo} 지역의 격조 높은 전통 문화 공간을 소개합니다.</p>
      </section>

      {isIlsan && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="rounded-xl border border-neon-border bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-neon-text">일산 전통 한정식 안내</h2>
            <p className="text-sm leading-relaxed text-neon-text-muted">
              경기 서북부 지역의 전통 한정식 문화를 대표하는 공간입니다.
              일산명월관을 중심으로 격조 높은 코스 요리와 국악 연주,
              프라이빗 다이닝 서비스를 경험할 수 있습니다. 기업 접대와 VIP 모임을 위한
              품격 있는 공간을 찾는 분들에게 일산 지역은 최적의 선택입니다.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yojeongs.map((venue) => <VenueCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {yojeongs.length === 0 && (
          <p className="py-20 text-center text-neon-text-muted">{regionKo} 지역에 등록된 전통 한정식 공간이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
