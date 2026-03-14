import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory, getVenueBySlug } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '요정 | 일산룸포털 - 일산명월관요정 · 전통 요정 · 한정식 · 국악',
  description:
    '대한민국 전통 요정 정보. 일산명월관요정, 일산요정 등 격조 높은 요정 리스트와 상세 정보. 한정식 코스, 국악 연주, 프라이빗 룸, 비즈니스 접대 안내.',
};

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/yojeong/${venue.region}/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{venue.nameKo}</h3>
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
          <span className="text-yellow-500">★</span> {venue.rating}
          <span className="text-neutral-600">({venue.reviewCount})</span>
        </span>
      </div>
      <p className="text-sm text-neutral-500 line-clamp-2">{venue.shortDescription}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.tags.slice(0, 3).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
      </div>
    </Card>
  );
}

export default function YojeongPage() {
  const yojeongs = getVenuesByCategory('yojeong');
  const myeongwolgwan = getVenueBySlug('ilsan-myeongwolgwan-yojeong');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-emerald-900/30">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-emerald-400">YOJEONG</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">요정</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            한정식, 국악, 프라이빗 룸 — 한국 전통 접대 문화의 정수
          </p>
        </div>
      </section>

      {/* 명월관 Featured */}
      {myeongwolgwan && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link href="/yojeong/ilsan/ilsan-myeongwolgwan-yojeong" target="_blank" rel="noopener noreferrer" className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-neutral-900 transition-all duration-500 hover:border-emerald-400/60 hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-neutral-900/80 to-neutral-950" />
              <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-emerald-600/10 blur-3xl transition-all duration-500 group-hover:bg-emerald-600/20" />
              <div className="relative p-8 sm:p-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="premium">PREMIUM PICK</Badge>
                  <Badge variant="verified">인증됨</Badge>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                  {myeongwolgwan.nameKo}
                </h2>
                <p className="mb-4 max-w-2xl text-sm leading-relaxed text-neutral-300">
                  {myeongwolgwan.description}
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {myeongwolgwan.features.map((f) => (
                    <span key={f} className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span> {myeongwolgwan.rating}
                    <span className="text-neutral-600">({myeongwolgwan.reviewCount})</span>
                  </span>
                  <span>{myeongwolgwan.regionKo}</span>
                  <span>{myeongwolgwan.nearbyStation}</span>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-emerald-400 transition-colors group-hover:text-emerald-300">
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Intro Text */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="rounded-xl border border-emerald-900/20 bg-neutral-900/30 p-6">
          <h2 className="mb-3 text-lg font-bold text-emerald-100">한국 요정 문화의 이해</h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              한국의 요정 문화는 조선시대 기방 문화에 뿌리를 둔 전통적인 사교 공간으로,
              현대에 와서는 한정식과 국악 공연을 핵심으로 한 고급 접대 문화의 장으로
              진화했습니다. 일산명월관요정으로 대표되는 현대 요정은 15~20가지에 달하는
              전통 한정식 코스 요리를 정찰제로 운영하며, 가야금·대금·판소리 등 국악
              라이브 공연을 상시 제공합니다. 정치·재계·문화계 인사들의 사교 모임
              장소로 오랜 역사를 가진 요정은, 완벽한 프라이버시와 격조 높은 서비스를
              기본으로 합니다.
            </p>
            <p>
              일산요정은 서울 도심의 요정에 비해 접근성과 주차 편의성에서 우위를 가지며,
              자연 친화적인 환경에서 전통 문화를 경험할 수 있다는 차별점이 있습니다.
              요정 이용 시에는 복장(세미 포멀 이상 권장), 예약 방식(전화 사전 예약 필수),
              코스 선택(인원과 예산에 맞는 메뉴 사전 협의)을 미리 준비하면 한층 격조 있는
              시간을 보낼 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Venue Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">전체 요정 ({yojeongs.length})</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yojeongs.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
        {yojeongs.length === 0 && (
          <p className="py-20 text-center text-neutral-600">등록된 요정이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
