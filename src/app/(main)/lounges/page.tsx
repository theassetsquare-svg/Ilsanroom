import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '라운지 | 일산룸포털 - 강남 · 청담 · 압구정 프리미엄 라운지',
  description:
    '대한민국 프리미엄 라운지 정보. 강남, 청담, 압구정, 논현 등 서울 핵심 지역의 하이엔드 라운지 리스트와 상세 정보를 확인하세요. 골드 라운지, 블랙 라운지, VIP 공간.',
};

function VenueCard({ venue }: { venue: Venue }) {
  const isBlackTier = venue.rating >= 4.5;
  return (
    <div className="group relative">
      {isBlackTier && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <Card href={`/lounges/${venue.slug}`} className={isBlackTier ? 'border-amber-500/20' : ''}>
        <div className="flex flex-wrap gap-2 mb-3">
          {isBlackTier ? (
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              BLACK
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              GOLD
            </span>
          )}
          {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
        </div>
        <h3 className={`text-lg font-bold mb-1 ${isBlackTier ? 'text-amber-50' : 'text-white'}`}>
          {venue.nameKo}
        </h3>
        {/* Staff Info */}
        {venue.staffNickname && (
          <p className="mb-1 text-sm font-medium text-amber-400">
            담당: {venue.staffNickname}
          </p>
        )}
        {venue.staffPhone && (
          <p className="mb-2 text-sm text-emerald-400">
            📞 {venue.staffPhone}
          </p>
        )}
        <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
          <span>{venue.regionKo}</span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400">★</span> {venue.rating}
            <span className="text-neutral-600">({venue.reviewCount})</span>
          </span>
        </div>
        <p className="text-sm text-neutral-500 line-clamp-2">{venue.shortDescription}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {venue.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                isBlackTier
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function LoungesPage() {
  const lounges = getVenuesByCategory('lounge');
  const blackLounges = lounges.filter((v) => v.rating >= 4.5);
  const goldLounges = lounges.filter((v) => v.rating < 4.5);

  return (
    <div className="bg-neutral-950">
      {/* Hero - Gold/Black Theme */}
      <section className="relative overflow-hidden border-b border-amber-900/30">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-amber-400">LOUNGE</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="gradient-text-gold">라운지</span>
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            세련된 공간, 정제된 음악, 프리미엄 음료 — 특별한 밤을 위한 라운지
          </p>
        </div>
      </section>

      {/* Tier Legend */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              BLACK
            </span>
            <span className="text-xs text-neutral-500">평점 4.5 이상</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              GOLD
            </span>
            <span className="text-xs text-neutral-500">인증된 라운지</span>
          </div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="rounded-xl border border-amber-900/20 bg-neutral-900/40 p-6">
          <h2 className="mb-3 text-lg font-bold text-amber-100">프리미엄 라운지 셀렉션</h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              라운지는 시끄러운 댄스 음악 대신 정제된 음악과 편안한 좌석 배치로 대화와
              분위기를 중시하는 프리미엄 공간입니다. 서울 강남권을 중심으로 발달한 한국의
              라운지 문화는 뉴욕, 도쿄, 런던의 트렌드를 빠르게 흡수하면서도 한국만의
              VIP 서비스 문화를 결합해 독특한 포지션을 확립했습니다. 인테리어 디자인에
              수십억 원을 투자하는 하이엔드 라운지부터 감성적인 조명과 시그니처 음료로
              승부하는 부티크 라운지까지, 목적과 취향에 따라 다양한 선택지가 존재합니다.
            </p>
            <p>
              특히 압구정·청담·논현 라운지 벨트는 글로벌 수준의 믹솔로지 바와 프리미엄
              위스키 바가 밀집한 구역으로, 셀러브리티와 업계 관계자들이 자주 찾는 것으로
              알려져 있습니다. 라운지를 선택할 때는 분위기(시끄러운 vs 조용한), 음료
              전문성(칵테일 vs 위스키 vs 와인), 프라이빗 공간 유무를 기준으로 비교하면
              실패 확률을 줄일 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* BLACK Tier */}
      {blackLounges.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/40 to-transparent" />
            <h2 className="text-sm font-bold tracking-[0.3em] text-amber-400">BLACK TIER</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-amber-500/40 to-transparent" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blackLounges.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
        </section>
      )}

      {/* GOLD Tier */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-700 to-transparent" />
          <h2 className="text-sm font-bold tracking-[0.3em] text-neutral-500">GOLD TIER</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-neutral-700 to-transparent" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goldLounges.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
        {lounges.length === 0 && (
          <p className="py-20 text-center text-neutral-600">등록된 라운지가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
