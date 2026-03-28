import { useParams } from 'react-router-dom';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getVenuesByCategoryAndRegion } from '@/data/venues';
import type { Venue } from '@/types';


const regionNames: Record<string, string> = {
  gangnam: '강남', hongdae: '홍대', ilsan: '일산', cheongdam: '청담',
};

function YojeongCard({ venue, region }: { venue: Venue; region: string }) {
  const hasPerformance = venue.features?.some((f) =>
    f.includes('공연') || f.includes('국악') || f.includes('연주') || f.includes('전통')
  );
  return (
    <Card href={`/yojeong/${region}/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {hasPerformance && (
          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            전통 공연
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        {!venue.nameKo.includes(venue.regionKo) && <span>{venue.regionKo}</span>}
        {venue.dressCode && <span>복장: {venue.dressCode}</span>}
      </div>
      <p className="text-sm text-neon-text-muted line-clamp-2">{venue.shortDescription}</p>
      {venue.atmosphere?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.atmosphere.slice(0, 3).map((a) => (
            <span key={a} className="text-xs text-amber-600">#{a}</span>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function RegionalYojeongPage() {
  const { region } = useParams<{ region: string }>();
  const regionKo = regionNames[region] || region;
  useDocumentMeta(`${regionKo} 일대 한식 접객 공간 | 플밤`, `${regionKo} 한정식·국악 접객, 여긴 격이 다르다.`);
  const yojeongs = getVenuesByCategoryAndRegion('yojeong', region);

  return (
    <div className="bg-neon-bg">
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Breadcrumb items={[{ label: '요정', href: '/yojeong' }, { label: regionKo }]} />
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <h1 className="text-3xl font-extrabold text-neon-text">{regionKo} 일대 요정</h1>
        <p className="mt-3 text-neon-text-muted">
          {regionKo} 일대에서 한국 고유 접객 문화를 경험할 수 있는 곳입니다. 격조 높은 자리에 적합합니다.
        </p>
      </section>

      {/* 문화적 맥락 안내 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-2 text-base font-bold text-amber-800">요정이란 어떤 곳?</h2>
          <p className="text-sm leading-relaxed text-amber-900/80">
            요정은 한옥 또는 전통식 건물의 독립 좌석에서 코스 한정식과 함께 대화를 나누는
            격조 높은 만남의 장소입니다. 과거 정치인과 기업인이 주로 이용했으며,
            현재는 귀빈 초대와 잊지 못할 기념일에 활용됩니다.
            단순한 식사를 넘어 한국의 미학과 예절이 담긴 독자적 문화 체험입니다.
          </p>
        </div>
      </section>

      {/* 코스 요리 안내 */}
      <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
        <div className="rounded-xl border border-neon-border bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-neon-text">코스 요리 살펴보기</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <p className="font-semibold text-stone-700">기본 코스</p>
              <p className="mt-1 text-xs text-neon-text-muted">전채, 탕, 구이, 후식 등 8-10첩 구성</p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <p className="font-semibold text-stone-700">특선 코스</p>
              <p className="mt-1 text-xs text-neon-text-muted">계절 재료 활용 12첩 이상 상차림</p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <p className="font-semibold text-stone-700">귀빈 코스</p>
              <p className="mt-1 text-xs text-neon-text-muted">맞춤 메뉴 구성, 사전 협의 필수</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yojeongs.map((venue) => <YojeongCard key={venue.id} venue={venue} region={region} />)}
        </div>
        {yojeongs.length === 0 && (
          <p className="py-20 text-center text-neon-text-muted">{regionKo} 일대에 등록된 매장이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
