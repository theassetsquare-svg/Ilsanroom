import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '호빠 | 일산룸포털 - 강남 · 홍대 · 이태원 호스트바 정보',
  description:
    '대한민국 호빠(호스트바) 정보. 강남, 홍대, 이태원, 신사 등 지역별 호빠 리스트와 상세 정보. 검증된 업소 정보와 이용 가이드를 확인하세요.',
};

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/hoppa/${venue.slug}`}>
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

export default function HoppaPage() {
  const hoppas = getVenuesByCategory('hoppa');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-950/30 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-sm font-medium tracking-wider text-pink-400">HOPPA</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">호빠</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">
            검증된 호스트바 정보와 이용 가이드를 제공합니다
          </p>
        </div>
      </section>

      {/* Intro Text */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-neutral-800/50 bg-neutral-900/30 p-6">
          <h2 className="mb-3 text-lg font-bold text-white">호빠(호스트바) 이용 가이드</h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
            <p>
              호빠(호스트바)는 여성 고객을 주 타겟으로 하는 유흥업소로, 한국에서
              유흥주점 영업허가를 받은 합법 업종에 해당합니다. 2010년대 이후 한국 사회에서
              여성의 경제적 독립과 소비 패턴 변화에 따라 빠르게 성장한 업종으로, 현재
              강남·신사·홍대·이태원 등 서울 주요 상권에 밀집해 있습니다. 호빠의 핵심은
              호스트와의 대화와 엔터테인먼트이며, 음료와 가벼운 안주를 곁들여 편안한
              시간을 보내는 것이 일반적인 이용 방식입니다.
            </p>
            <p>
              좋은 호빠를 구분하는 기준으로는 호스트의 대화 수준과 매너, 공간의 청결도와
              인테리어, 합리적인 가격 체계의 세 가지가 대표적입니다. 최근에는 프라이빗
              룸을 갖춘 프리미엄 호빠부터 홀 좌석 중심의 캐주얼 호빠까지 다양한 스타일이
              생겨나, 고객 취향에 맞는 선택의 폭이 넓어졌습니다. 일산룸포털에서 검증된 호빠
              정보를 확인하고, 후기와 평점을 참고하여 안전하고 즐거운 방문을 준비하세요.
            </p>
          </div>
        </div>
      </section>

      {/* Selection Guide */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: '프리미엄 호빠', desc: '프라이빗 룸, 고급 인테리어, VIP 서비스. 소규모 모임이나 특별한 날에 적합.', color: 'pink' },
            { title: '스탠다드 호빠', desc: '홀+룸 겸용, 합리적 이용 환경. 친구 모임이나 첫 방문에 추천.', color: 'violet' },
            { title: '캐주얼 호빠', desc: '오픈 홀 중심, 자유로운 분위기. 부담 없이 가볍게 즐기기 좋은 공간.', color: 'cyan' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <h3 className={`mb-2 font-semibold text-${item.color}-400`}>{item.title}</h3>
              <p className="text-sm text-neutral-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Venue Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">전체 호빠 ({hoppas.length})</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hoppas.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
        {hoppas.length === 0 && (
          <p className="py-20 text-center text-neutral-600">등록된 호빠가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
