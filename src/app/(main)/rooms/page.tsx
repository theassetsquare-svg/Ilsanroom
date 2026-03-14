import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory, getVenueBySlug } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '룸 | NEON - 일산룸 · 강남룸 · 전국 프리미엄 룸 정보',
  description:
    '대한민국 전국 프리미엄 룸 정보. 일산룸, 강남룸, 홍대룸 등 지역별 룸 시설 리스트. 프라이빗 공간, VIP 서비스, 비즈니스 모임 최적화 룸 안내.',
};

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/rooms/${venue.region}/${venue.slug}`}>
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

export default function RoomsPage() {
  const rooms = getVenuesByCategory('room');
  const ilsanRoom = getVenueBySlug('ilsan-room');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-rose-400">ROOM</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">룸</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            프라이빗 공간에서 비즈니스 접대와 특별한 모임을 즐기세요
          </p>
        </div>
      </section>

      {/* 일산룸 Featured */}
      {ilsanRoom && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link href="/rooms/ilsan/ilsan-room" target="_blank" rel="noopener noreferrer" className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-neutral-900 transition-all duration-500 hover:border-rose-400/60 hover:shadow-2xl hover:shadow-rose-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-neutral-900/80 to-neutral-950" />
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-rose-600/10 blur-3xl transition-all duration-500 group-hover:bg-rose-600/20" />
              <div className="relative p-8 sm:p-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="premium">PREMIUM PICK</Badge>
                  <Badge variant="verified">인증됨</Badge>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                  {ilsanRoom.nameKo}
                </h2>
                <p className="mb-4 max-w-2xl text-sm leading-relaxed text-neutral-300">
                  {ilsanRoom.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span> {ilsanRoom.rating}
                    <span className="text-neutral-600">({ilsanRoom.reviewCount})</span>
                  </span>
                  <span>{ilsanRoom.regionKo}</span>
                  <span>{ilsanRoom.nearbyStation}</span>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-rose-400 transition-colors group-hover:text-rose-300">
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Intro Text */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6">
          <h2 className="mb-3 text-lg font-bold text-white">프리미엄 룸 이용 가이드</h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              일산룸을 포함한 프리미엄 룸 문화는 한국 비즈니스 사교의 핵심 인프라로
              자리잡아 왔습니다. 비즈니스 접대, 거래처 회식, 팀 빌딩, 생일 파티 등
              프라이빗한 공간이 필요한 모든 상황에서 룸은 가장 현실적인 선택지입니다.
              특히 경기 서북부의 중심인 일산 지역은 접근성과 시설 수준 양면에서
              수도권 최고 수준의 룸 인프라를 갖추고 있습니다.
            </p>
            <p>
              일산룸은 대형 주차 시설, 최신 음향·영상 장비, 전문 서비스 인력을 갖춘
              프리미엄 공간으로, 강남이나 여의도에서 이동하는 법인 고객도 적지 않습니다.
              룸을 선택할 때 가장 중요한 기준은 수용 인원, 음향 시스템 수준, 주차 편의성,
              그리고 서비스 품질입니다. 각 지역과 업소별로 차별화된 특성이 있으므로,
              목적에 맞는 공간을 사전에 비교하는 것이 만족스러운 이용의 첫걸음입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Venue Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">전체 룸 ({rooms.length})</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
        {rooms.length === 0 && (
          <p className="py-20 text-center text-neutral-600">등록된 룸이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
