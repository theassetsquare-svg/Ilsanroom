import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import JsonLd from '@/components/seo/JsonLd';
import { categories, getPopularVenues, getVenueBySlug, getVenuesByCategory } from '@/data/venues';
import type { Venue, VenueCategory } from '@/types';

export const metadata: Metadata = {
  title: '일산룸 · 일산명월관요정 | NEON 대한민국 No.1 나이트라이프 가이드',
  description: '일산룸, 일산명월관요정 등 대한민국 나이트라이프 정보를 한눈에. 클럽, 나이트, 라운지, 룸, 요정, 호빠 전국 101개 인기 업소 정보와 리뷰를 NEON에서 확인하세요.',
  openGraph: {
    title: '일산룸 · 일산명월관요정 | NEON 나이트라이프',
    description: '클럽, 나이트, 라운지, 룸, 요정, 호빠 — 전국 101개 업소 정보. 일산룸, 일산명월관요정 프리미엄 추천.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'NEON 나이트라이프',
  },
};

function getCategoryHref(category: string, slug: string, region: string) {
  const pathMap: Record<string, string> = {
    club: `/clubs/${region}/${slug}`,
    night: `/nights/${slug}`,
    lounge: `/lounges/${slug}`,
    room: `/rooms/${region}/${slug}`,
    yojeong: `/yojeong/${region}/${slug}`,
    hoppa: `/hoppa/${slug}`,
    collatek: `/collatek/${slug}`,
  };
  return pathMap[category] || `/${category}/${slug}`;
}

function VenueCard({ venue, href }: { venue: Venue; href: string }) {
  return (
    <Card href={href}>
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{venue.nameKo}</h3>
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          {venue.rating}
          <span className="text-neutral-600">({venue.reviewCount})</span>
        </span>
      </div>
      <p className="text-sm leading-relaxed text-neutral-500 line-clamp-2">
        {venue.shortDescription}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.tags.slice(0, 3).map((tag) => (
          <Badge key={tag}>#{tag}</Badge>
        ))}
      </div>
    </Card>
  );
}

export default function HomePage() {
  const ilsanRoom = getVenueBySlug('ilsan-room');
  const ilsanYojeong = getVenueBySlug('ilsan-myeongwolgwan-yojeong');
  const popularVenues = getPopularVenues(8);

  const categoryKeys: VenueCategory[] = ['club', 'night', 'lounge', 'room', 'yojeong', 'hoppa', 'collatek'];
  const categoryVenueCounts: Record<string, number> = {};
  for (const key of categoryKeys) {
    categoryVenueCounts[key] = getVenuesByCategory(key).length;
  }

  return (
    <div className="bg-neutral-950">
      {/* JSON-LD: WebSite */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'NEON 나이트라이프',
        url: 'https://neon-nightlife.com',
        description: '대한민국 No.1 나이트라이프 가이드',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://neon-nightlife.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }} />

      {/* JSON-LD: ItemList */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '인기 나이트라이프 업소',
        itemListElement: popularVenues.slice(0, 8).map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'LocalBusiness',
            name: v.nameKo,
            address: v.address,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: v.rating,
              reviewCount: v.reviewCount,
            },
          },
        })),
      }} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="text-center">
            <Badge variant="premium" className="mb-6 text-sm">
              NEON GUIDE 2026
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              대한민국 No.1
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                나이트라이프 가이드
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">
              클럽 · 나이트 · 라운지 · 룸 · 요정 · 호빠
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> — </span>
              전국 인기 업소 정보를 한곳에서 확인하세요
            </p>

            {/* Decorative Search Bar */}
            <div className="mx-auto mt-10 max-w-xl">
              <Link
                href="/clubs"
                className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/80 px-5 py-4 text-neutral-500 backdrop-blur-sm transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <svg className="h-5 w-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>업소명, 지역, 카테고리로 검색...</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Picks Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-violet-500/50 to-transparent" />
          <h2 className="text-sm font-bold tracking-[0.3em] text-violet-400">NEON PREMIUM PICK</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-violet-500/50 to-transparent" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 일산룸 Premium Card */}
          {ilsanRoom && (
            <Link href="/rooms/ilsan/ilsan-room" className="group block">
              <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-violet-500/30 bg-neutral-900 transition-all duration-500 hover:border-violet-400/60 hover:shadow-2xl hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 via-neutral-900/80 to-neutral-950" />
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-600/10 blur-3xl transition-all duration-500 group-hover:bg-violet-600/20" />
                <div className="relative flex h-full min-h-[360px] flex-col justify-end p-8">
                  <Badge variant="premium" className="mb-4 w-fit">PREMIUM</Badge>
                  <h3 className="mb-2 text-3xl font-bold text-white transition-colors group-hover:text-violet-400">
                    {ilsanRoom.nameKo}
                  </h3>
                  <p className="mb-3 text-sm text-neutral-400">
                    일산 지역 대표 프리미엄 룸. 최고급 시설과 세심한 서비스로 비즈니스 모임과 소규모 회식에 적합합니다.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span> {ilsanRoom.rating}
                    </span>
                    <span>·</span>
                    <span>{ilsanRoom.regionKo}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-400 transition-colors group-hover:text-violet-300">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* 일산명월관요정 Premium Card */}
          {ilsanYojeong && (
            <Link href="/yojeong/ilsan/ilsan-myeongwolgwan-yojeong" className="group block">
              <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-violet-500/30 bg-neutral-900 transition-all duration-500 hover:border-violet-400/60 hover:shadow-2xl hover:shadow-violet-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-neutral-900/80 to-neutral-950" />
                <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-rose-600/10 blur-3xl transition-all duration-500 group-hover:bg-rose-600/20" />
                <div className="relative flex h-full min-h-[360px] flex-col justify-end p-8">
                  <Badge variant="premium" className="mb-4 w-fit">PREMIUM</Badge>
                  <h3 className="mb-2 text-3xl font-bold text-white transition-colors group-hover:text-violet-400">
                    {ilsanYojeong.nameKo}
                  </h3>
                  <p className="mb-3 text-sm text-neutral-400">
                    일산요정 문화를 대표하는 격조 높은 공간. 15가지 한정식 코스 요리와 국악 연주를 즐길 수 있는 전통 요정입니다.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span> {ilsanYojeong.rating}
                    </span>
                    <span>·</span>
                    <span>{ilsanYojeong.regionKo}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-400 transition-colors group-hover:text-violet-300">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold text-white">카테고리별 탐색</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.path}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-center transition-all hover:border-violet-500/40 hover:bg-neutral-900"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="font-semibold text-white">{cat.labelKo}</span>
              <span className="text-xs text-neutral-500">
                {categoryVenueCounts[cat.key] || 0}개 업소
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Venues */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">인기 업소</h2>
          <Link href="/clubs" className="text-sm text-violet-400 transition-colors hover:text-violet-300">
            전체보기 →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              href={getCategoryHref(venue.category, venue.slug, venue.region)}
            />
          ))}
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">인스타그램</h2>
          <span className="text-sm text-violet-400">#일산룸 #일산명월관</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { tag: '#일산룸', desc: '프리미엄 룸 인테리어', likes: 234 },
            { tag: '#일산명월관', desc: '전통 한정식 코스', likes: 189 },
            { tag: '#강남클럽', desc: '주말 파티 현장', likes: 567 },
            { tag: '#홍대나이트', desc: '라이브 공연', likes: 345 },
            { tag: '#일산요정', desc: '국악 라이브 연주', likes: 156 },
            { tag: '#네온나이트라이프', desc: 'NEON 추천 업소', likes: 423 },
          ].map((post, i) => (
            <div
              key={i}
              className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-800 to-neutral-900 transition-all hover:border-violet-500/40"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <span className="mb-1 text-2xl opacity-40 group-hover:opacity-70 transition-opacity">📷</span>
                <span className="text-xs font-medium text-violet-400">{post.tag}</span>
                <span className="mt-1 text-[10px] text-neutral-500">{post.desc}</span>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-red-400">♥</span>
                <span className="text-[10px] text-neutral-400">{post.likes}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-neutral-600">
          Instagram API 연동 후 실시간 피드가 표시됩니다
        </p>
      </section>

      {/* SEO Text Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/30 p-8">
          <h2 className="mb-4 text-xl font-bold text-white">대한민국 나이트라이프 가이드 NEON</h2>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-500">
            <p>
              NEON은 대한민국 전역의 나이트, 클럽, 라운지, 룸, 요정, 호빠 정보를 한곳에 모은
              나이트라이프 전문 디렉토리입니다. 서울 강남, 홍대, 이태원부터 부산 해운대, 경기 일산까지
              검증된 업소 정보와 이용 가이드를 제공합니다.
            </p>
            <p>
              일산룸, 일산요정 등 경기 서북부 지역의 프리미엄 업소부터 강남 클럽, 홍대 클럽까지
              각 지역과 카테고리별로 세분화된 정보를 확인할 수 있습니다. 일산명월관요정처럼
              전통과 현대가 어우러진 격조 높은 공간도 소개하고 있습니다.
            </p>
            <p>
              NEON에서 제공하는 모든 정보는 실제 방문 검증을 기반으로 하며,
              분위기, 서비스, 접근성 등 다양한 기준으로 평가합니다.
              즐겁고 안전한 밤 문화를 위한 정확한 정보를 만나보세요.
            </p>
          </div>
        </div>
      </section>

      {/* Business CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Link href="/for-business" className="group block">
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/80 via-neutral-900 to-fuchsia-950/80 p-8 sm:p-12 transition-all hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-600/10 blur-3xl" />
            <div className="relative flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                  내 업소를 등록하고
                  <span className="text-violet-400"> 매출 300%</span> 올리세요
                </h3>
                <p className="text-neutral-400">
                  NEON에 업소를 등록하면 월 평균 방문자 1,200명 이상 노출됩니다.
                  무료로 시작해 보세요.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-8 shrink-0">
                <span className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-bold text-white transition-all group-hover:bg-violet-500 group-hover:shadow-lg">
                  무료 시작하기
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
