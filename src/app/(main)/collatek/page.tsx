import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getVenuesByCategory } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '콜라텍 | 일산룸포털 - 중장년 사교댄스 · 트로트 · 콜라텍 정보',
  description:
    '전국 콜라텍 정보. 40~60대 중장년층을 위한 사교댄스 공간. 트로트, 폭스트롯, 왈츠를 즐길 수 있는 건전한 여가 문화 공간을 소개합니다.',
};

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card href={`/collatek/${venue.slug}`}>
      <div className="flex flex-wrap gap-2 mb-4">
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      {/* 큰 글씨 - 4050 타겟 */}
      <h3 className="text-xl font-bold text-white mb-2 sm:text-2xl">{venue.nameKo}</h3>
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
      <div className="mb-3 flex items-center gap-4 text-base text-neutral-400">
        <span className="font-medium">{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span className="font-semibold">{venue.rating}</span>
          <span className="text-neutral-600">({venue.reviewCount})</span>
        </span>
      </div>
      <p className="text-base leading-relaxed text-neutral-400 line-clamp-2">{venue.shortDescription}</p>
      <div className="mt-4 space-y-2 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="text-orange-400">⏰</span>
          <span className="text-base">{venue.openHours}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">💰</span>
          <span className="text-base">입장료: {venue.priceEntry || '문의'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-400">🅿️</span>
          <span className="text-base">{venue.parking}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {venue.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm text-orange-400">
            #{tag}
          </span>
        ))}
      </div>
    </Card>
  );
}

export default function CollatekPage() {
  const collateks = getVenuesByCategory('collatek');

  return (
    <div className="bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-orange-900/30">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/30 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="mb-2 text-base font-medium tracking-wider text-orange-400">COLLATEK</p>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">콜라텍</h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-400">
            건강한 사교와 즐거운 댄스 — 중장년을 위한 최고의 여가 공간
          </p>
        </div>
      </section>

      {/* Quick Info - 큰 글씨 */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">주간 운영</p>
            <p className="mt-2 text-base text-neutral-400">오전 9시 ~ 오후 6시</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">입장료</p>
            <p className="mt-2 text-base text-neutral-400">8,000원 ~ 15,000원</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">음료 무료</p>
            <p className="mt-2 text-base text-neutral-400">콜라, 사이다, 커피 등</p>
          </div>
        </div>
      </section>

      {/* Intro Text - 큰 글씨 */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="rounded-xl border border-orange-900/20 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xl font-bold text-orange-100">콜라텍 완벽 가이드</h2>
          <div className="space-y-4 text-base leading-relaxed text-neutral-400">
            <p>
              콜라텍은 40~60대 중장년층을 위한 대표적인 사교 공간으로, 주간 시간대에
              운영되는 것이 일반적인 나이트클럽과 가장 큰 차이점입니다.
              &apos;콜라+디스코텍&apos;의 합성어에서 알 수 있듯, 주류 대신 음료수를
              마시며 트로트·폭스·왈츠 등 다양한 장르의 사교댄스를 즐기는
              건전한 여가 문화 공간입니다.
            </p>
            <p>
              2000년대 후반부터 전국적으로 확산되기 시작해, 현재는 서울·경기 수도권을
              비롯해 부산·대구·대전 등 전국 주요 도시에 수백 개의 콜라텍이 운영되고
              있습니다. 이용 방법은 간단합니다. 입장료를 내고 들어가면 넓은 댄스홀에서
              자유롭게 파트너를 바꿔가며 춤을 출 수 있으며, 대부분의 콜라텍에서 초보자를
              위한 댄스 교실도 병행 운영합니다. 건강 관리와 사회적 교류를 동시에 충족할
              수 있다는 점에서, 은퇴 후 사교 공간을 찾는 분들에게 특히 인기가 높습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 준비물 안내 - 큰 글씨 */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-white">처음 가시는 분을 위한 안내</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: '👟', title: '편안한 운동화', desc: '춤을 오래 추려면 쿠션이 좋은 운동화가 필수입니다.' },
            { icon: '👔', title: '움직이기 좋은 복장', desc: '정장보다는 활동이 편한 깔끔한 차림을 추천합니다.' },
            { icon: '💧', title: '수건과 물', desc: '댄스 후 땀을 닦을 수건을 준비하면 좋습니다.' },
            { icon: '😊', title: '밝은 표정', desc: '첫 방문이라도 용기를 내면 금방 친구가 생깁니다.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-base text-neutral-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Venue Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">전체 콜라텍 ({collateks.length})</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {collateks.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
        {collateks.length === 0 && (
          <p className="py-20 text-center text-lg text-neutral-600">등록된 콜라텍이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
