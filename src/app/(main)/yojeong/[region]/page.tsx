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
    title: `${regionKo} 요정 | 일산룸포털 - ${regionKo}요정 정보`,
    description: `${regionKo} 지역 전통 요정 리스트. ${regionKo}요정의 시설, 한정식, 서비스를 비교하고 나에게 맞는 요정을 찾아보세요.`,
  };
}

export default async function RegionalYojeongPage({ params }: Props) {
  const { region } = await params;
  const regionKo = regionNames[region] || region;
  const yojeongs = getVenuesByCategoryAndRegion('yojeong', region);
  const isIlsan = region === 'ilsan';

  return (
    <div className="bg-neutral-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '요정', href: '/yojeong' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-white">{regionKo} 요정</h1>
        <p className="mt-3 text-neutral-400">{regionKo} 지역의 전통 요정을 소개합니다.</p>
      </section>

      {isIlsan && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-6">
            <h2 className="mb-3 text-lg font-bold text-white">일산요정 안내</h2>
            <p className="text-sm leading-relaxed text-neutral-400">
              일산요정은 경기 서북부 지역의 전통 요정 문화를 대표합니다.
              일산명월관요정을 중심으로 격조 높은 한정식 코스 요리와 국악 연주,
              프라이빗 룸 서비스를 경험할 수 있습니다. 기업 접대와 VIP 모임을 위한
              품격 있는 공간을 찾는 분들에게 일산 지역 요정은 최적의 선택입니다.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yojeongs.map((venue) => <VenueCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {yojeongs.length === 0 && (
          <p className="py-20 text-center text-neutral-600">{regionKo} 지역에 등록된 요정이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
