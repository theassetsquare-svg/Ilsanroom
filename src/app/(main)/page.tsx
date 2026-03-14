import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import JsonLd from '@/components/seo/JsonLd';
import HeroSearch from '@/components/home/HeroSearch';
import HotWidget from '@/components/home/HotWidget';
import QuizCTA from '@/components/home/QuizCTA';
import { categories, getPopularVenues, getVenueBySlug } from '@/data/venues';
import type { Venue, VenueCategory } from '@/types';

export const metadata: Metadata = {
  title: '일산룸, 일산명월관요정 | 일산룸포털 - 전국 클럽·나이트·라운지·룸·요정·호빠',
  description: '일산룸, 일산명월관요정 등 전국 나이트라이프 업소 정보를 한눈에. 클럽, 나이트, 라운지, 룸, 요정, 호빠 인기 업소 검색, 리뷰, 이벤트 정보를 일산룸포털에서 확인하세요.',
  openGraph: {
    title: '일산룸, 일산명월관요정 | 일산룸포털',
    description: '클럽, 나이트, 라운지, 룸, 요정, 호빠 — 전국 인기 업소 정보. 일산룸, 일산명월관요정 프리미엄 추천.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '일산룸포털',
    url: 'https://ilsanroom.pages.dev',
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

function VenueCard({ venue, href, rank }: { venue: Venue; href: string; rank?: number }) {
  return (
    <Card href={href}>
      {rank && (
        <span className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-neon-primary text-xs font-bold text-white shadow-md">
          {rank}
        </span>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {venue.isPremium && <Badge variant="premium">PREMIUM</Badge>}
        {venue.isVerified && <Badge variant="verified">인증됨</Badge>}
      </div>
      <h3 className="text-lg font-bold text-neon-text mb-1">{venue.nameKo}</h3>
      {venue.staffNickname && (
        <p className="mb-1 text-sm font-medium text-neon-gold">
          담당: {venue.staffNickname}
        </p>
      )}
      {venue.staffPhone && (
        <p className="mb-2 text-sm text-neon-green">
          {venue.staffPhone}
        </p>
      )}
      <div className="mb-2 flex items-center gap-3 text-sm text-neon-text-muted">
        <span>{venue.regionKo}</span>
        <span className="flex items-center gap-1">
          <span className="text-neon-gold">★</span>
          {venue.rating}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-neon-text-muted/70 line-clamp-2">
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

/* ── Region quick-links ── */
const regions = [
  { label: '강남', href: '/clubs/gangnam' },
  { label: '홍대', href: '/clubs/hongdae' },
  { label: '이태원', href: '/clubs/itaewon' },
  { label: '일산', href: '/rooms/ilsan' },
  { label: '부산', href: '/clubs/busan' },
  { label: '대구', href: '/clubs/daegu' },
  { label: '인천', href: '/clubs/incheon' },
  { label: '수원', href: '/nights/suwon' },
  { label: '대전', href: '/clubs/daejeon' },
  { label: '광주', href: '/clubs/gwangju' },
  { label: '울산', href: '/nights/ulsan' },
  { label: '제주', href: '/clubs/jeju' },
];

/* ── Fake latest reviews ── */
const latestReviews = [
  { venue: '일산명월관요정', author: '김**', text: '한정식 코스가 정말 훌륭했습니다. 국악 공연도 감동적이었어요.', rating: 5, date: '2026-03-12' },
  { venue: '강남클럽레이스', author: '이**', text: 'EDM 사운드가 압도적입니다. 강남 클럽 중 최고라고 생각해요.', rating: 4.5, date: '2026-03-11' },
  { venue: '수원찬스돔나이트', author: '박**', text: '365일 운영이라 언제든 갈 수 있어서 좋습니다. 분위기도 좋아요.', rating: 4, date: '2026-03-10' },
  { venue: '클럽NB2', author: '최**', text: '홍대 힙합 클럽의 정석. 20년 넘게 이어온 레전드 클럽입니다.', rating: 4.5, date: '2026-03-09' },
];

/* ── Magazine preview ── */
const magazineItems = [
  { title: '2026년 강남 클럽 TOP5 — 올해 꼭 가봐야 할 곳', tag: '클럽', href: '/magazine' },
  { title: '일산 요정 완벽 가이드: 접대부터 가족모임까지', tag: '요정', href: '/magazine' },
  { title: '처음 나이트 가는 분을 위한 A to Z 매너 가이드', tag: '나이트', href: '/magazine' },
  { title: '홍대 vs 이태원 클럽 비교 — 어디가 나에게 맞을까?', tag: '비교', href: '/magazine' },
];

/* ── Instagram hashtags ── */
const instaHashtags = [
  { tag: '#일산룸', desc: '프리미엄 룸 인테리어', url: 'https://www.instagram.com/explore/tags/일산룸/' },
  { tag: '#일산명월관', desc: '전통 한정식 코스', url: 'https://www.instagram.com/explore/tags/일산명월관/' },
  { tag: '#강남클럽', desc: '주말 파티 현장', url: 'https://www.instagram.com/explore/tags/강남클럽/' },
  { tag: '#홍대클럽', desc: '힙합 & EDM', url: 'https://www.instagram.com/explore/tags/홍대클럽/' },
  { tag: '#일산요정', desc: '국악 라이브 연주', url: 'https://www.instagram.com/explore/tags/일산요정/' },
  { tag: '#나이트라이프', desc: '전국 나이트 문화', url: 'https://www.instagram.com/explore/tags/나이트라이프/' },
];

export default function HomePage() {
  const ilsanRoom = getVenueBySlug('ilsan-room');
  const ilsanYojeong = getVenueBySlug('ilsan-myeongwolgwan-yojeong');
  const popularVenues = getPopularVenues(10);

  const categoryKeys: VenueCategory[] = ['club', 'night', 'lounge', 'room', 'yojeong', 'hoppa'];

  return (
    <div className="bg-neon-bg">
      {/* JSON-LD: WebSite + SearchAction */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '일산룸포털',
        url: 'https://ilsanroom.pages.dev',
        description: '일산룸, 일산명월관요정 등 전국 나이트라이프 업소 정보 포털',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/map?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      }} />

      {/* JSON-LD: ItemList */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '인기 나이트라이프 업소',
        itemListElement: popularVenues.slice(0, 10).map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'LocalBusiness', name: v.nameKo, address: v.address },
        })),
      }} />

      {/* ═══════ 1. HERO — particles bg + search + quick filter ═══════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Particle-like bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-neon-primary/10 via-neon-bg to-neon-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-primary/15 via-transparent to-transparent" />
        {/* Animated dots */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-[10%] h-1 w-1 rounded-full bg-neon-primary/40 animate-pulse" />
          <div className="absolute top-32 left-[30%] h-1.5 w-1.5 rounded-full bg-neon-accent/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-16 right-[20%] h-1 w-1 rounded-full bg-neon-pink/30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-[35%] h-1 w-1 rounded-full bg-neon-gold/30 animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-28 left-[55%] h-2 w-2 rounded-full bg-neon-primary/20 animate-pulse" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-44 left-[75%] h-1 w-1 rounded-full bg-neon-accent/25 animate-pulse" style={{ animationDelay: '1.2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="text-center">
            <Badge variant="premium" className="mb-6 text-sm">일산룸포털 GUIDE 2026</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-neon-text sm:text-5xl lg:text-6xl">
              일산룸 · 일산명월관요정
              <br />
              <span className="gradient-text">전국 나이트라이프 가이드</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neon-text-muted">
              클럽 · 나이트 · 라운지 · 룸 · 요정 · 호빠
              <span className="hidden sm:inline"> — </span>
              <br className="sm:hidden" />
              전국 인기 업소 정보를 한곳에서 검색하세요
            </p>

            {/* ★ Working Search Bar ★ */}
            <div className="mt-10">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 2. PREMIUM CARDS — 일산룸(골드) + 명월관(바이올렛) ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-neon-gold/50 to-transparent" />
          <h2 className="text-sm font-bold tracking-[0.3em] text-neon-gold">PREMIUM PICK</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-neon-gold/50 to-transparent" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 일산룸 — Gold Glow */}
          {ilsanRoom && (
            <Link href="/rooms/ilsan/ilsan-room" target="_blank" rel="noopener noreferrer" className="group block">
              <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-neon-gold/30 bg-neon-surface transition-all duration-500 hover:border-neon-gold/60 hover:shadow-2xl hover:shadow-neon-gold/15">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-neon-surface to-neon-bg" />
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-neon-gold/8 blur-3xl transition-all duration-500 group-hover:bg-neon-gold/15" />
                <div className="relative flex h-full min-h-[380px] flex-col justify-end p-8">
                  <Badge variant="premium" className="mb-4 w-fit">PREMIUM</Badge>
                  <h3 className="mb-2 text-3xl font-bold text-neon-text transition-colors group-hover:text-neon-gold">
                    {ilsanRoom.nameKo}
                  </h3>
                  <p className="mb-1 text-sm font-semibold text-neon-gold">신실장 (총책임자)</p>
                  <p className="mb-3 text-sm text-neon-green">{ilsanRoom.staffPhone}</p>
                  <p className="mb-3 text-sm text-neon-text-muted">
                    일산 대표 프리미엄 룸. 비즈니스 모임과 소규모 회식에 적합한 최고급 프라이빗 공간.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-neon-text-muted">
                    <span className="flex items-center gap-1"><span className="text-neon-gold">★</span> {ilsanRoom.rating}</span>
                    <span>·</span>
                    <span>{ilsanRoom.regionKo}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-neon-gold transition-colors group-hover:text-neon-gold/80">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* 일산명월관요정 — Violet Glow */}
          {ilsanYojeong && (
            <Link href="/yojeong/ilsan/ilsan-myeongwolgwan-yojeong" target="_blank" rel="noopener noreferrer" className="group block">
              <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-neon-primary/30 bg-neon-surface transition-all duration-500 hover:border-neon-primary/60 hover:shadow-2xl hover:shadow-neon-primary/15">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-neon-surface to-neon-bg" />
                <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-neon-primary/8 blur-3xl transition-all duration-500 group-hover:bg-neon-primary/15" />
                <div className="relative flex h-full min-h-[380px] flex-col justify-end p-8">
                  <Badge variant="premium" className="mb-4 w-fit">PREMIUM</Badge>
                  <h3 className="mb-2 text-3xl font-bold text-neon-text transition-colors group-hover:text-neon-primary-light">
                    {ilsanYojeong.nameKo}
                  </h3>
                  <p className="mb-1 text-sm font-semibold text-neon-primary-light">신실장</p>
                  <p className="mb-3 text-sm text-neon-green">{ilsanYojeong.staffPhone}</p>
                  <p className="mb-3 text-sm text-neon-text-muted">
                    한정식 코스와 국악 라이브, 총 30개 프라이빗 룸. 정찰제 운영. 비즈니스 접대와 기념일에 최적.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-neon-text-muted">
                    <span className="flex items-center gap-1"><span className="text-neon-gold">★</span> {ilsanYojeong.rating}</span>
                    <span>·</span>
                    <span>{ilsanYojeong.regionKo} · {ilsanYojeong.address}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-neon-primary-light transition-colors group-hover:text-neon-primary">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ═══════ 3. HOT WIDGET TOP5 — 맥박, lazy ═══════ */}
      <HotWidget />

      {/* ═══════ 4. 인기 TOP 10 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">인기 업소 TOP 10</h2>
          <Link href="/ranking" target="_blank" rel="noopener noreferrer" className="text-sm text-neon-primary-light transition-colors hover:text-neon-primary">
            전체 랭킹 →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {popularVenues.slice(0, 10).map((venue, i) => (
            <div key={venue.id} className="relative">
              <VenueCard venue={venue} href={getCategoryHref(venue.category, venue.slug, venue.region)} rank={i + 1} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ 5. 지역 이동 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-neon-text">지역별 업소 찾기</h2>
        <div className="flex flex-wrap gap-3">
          {regions.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-neon-border bg-neon-surface/50 px-5 py-3 text-sm font-medium text-neon-text-muted transition-all hover:border-neon-primary/40 hover:bg-neon-surface hover:text-neon-text card-hover"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ 6. 퀴즈 CTA ═══════ */}
      <QuizCTA />

      {/* ═══════ 7. 최신 후기 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">최신 후기</h2>
          <Link href="/community/reviews" target="_blank" rel="noopener noreferrer" className="text-sm text-neon-primary-light hover:text-neon-primary">
            전체 후기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latestReviews.map((review, i) => (
            <div key={i} className="glass rounded-2xl p-5 card-hover">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-neon-gold text-sm">{'★'.repeat(Math.floor(review.rating))}</span>
                <span className="text-xs text-neon-text-muted">{review.rating}</span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-neon-text line-clamp-3">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center justify-between text-xs text-neon-text-muted">
                <span>{review.author} · {review.venue}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ 8. 매거진 미리보기 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">매거진</h2>
          <Link href="/magazine" target="_blank" rel="noopener noreferrer" className="text-sm text-neon-primary-light hover:text-neon-primary">
            더보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {magazineItems.map((item, i) => (
            <Link key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-5 card-hover block">
              <Badge className="mb-3">{item.tag}</Badge>
              <h3 className="text-sm font-semibold text-neon-text leading-snug line-clamp-2">{item.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ 9. 인스타그램 피드 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">인스타그램</h2>
          <span className="text-sm text-neon-pink">#일산룸 #일산명월관</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {instaHashtags.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl border border-neon-border bg-gradient-to-br from-neon-surface-2 to-neon-surface transition-all hover:border-neon-pink/40 card-hover"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <svg className="mb-2 h-6 w-6 text-neon-pink/40 group-hover:text-neon-pink/70 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span className="text-xs font-medium text-neon-pink">{post.tag}</span>
                <span className="mt-1 text-[10px] text-neon-text-muted">{post.desc}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ 10. 업주 유치 배너 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Link href="/for-business" target="_blank" rel="noopener noreferrer" className="group block">
          <div className="relative overflow-hidden rounded-2xl border border-neon-primary/30 bg-gradient-to-r from-neon-primary/10 via-neon-surface to-neon-accent/10 p-8 sm:p-12 transition-all hover:border-neon-primary/50 hover:shadow-lg hover:shadow-neon-primary/10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon-primary/8 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-neon-accent/8 blur-3xl" />
            <div className="relative flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-neon-text sm:text-3xl">
                  내 업소를 등록하고 <span className="text-neon-primary">매출 300%</span> 올리세요
                </h3>
                <p className="text-neon-text-muted">
                  일산룸포털에 업소를 등록하면 월 평균 방문자 1,200명 이상 노출됩니다. 무료로 시작해 보세요.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-8 shrink-0">
                <span className="inline-flex items-center gap-2 rounded-xl bg-neon-primary px-8 py-4 text-lg font-bold text-white btn-glow transition-all group-hover:bg-neon-primary-light">
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

      {/* ═══════ SEO Text ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-neon-border/50 bg-neon-surface/30 p-8">
          <h2 className="mb-4 text-xl font-bold text-neon-text">일산룸포털 — 일산룸, 일산명월관요정 전국 나이트라이프 가이드</h2>
          <div className="space-y-4 text-sm leading-relaxed text-neon-text-muted/70">
            <p>
              일산룸포털은 일산룸, 일산명월관요정을 비롯한 전국의 나이트, 클럽, 라운지, 룸, 요정, 호빠
              업소 정보를 한곳에 모은 나이트라이프 전문 포털입니다. 서울 강남, 홍대, 이태원부터
              부산 해운대, 경기 일산, 수원, 대구, 광주, 대전, 인천, 울산까지 전국 주요 지역의
              검증된 업소 정보와 이용 가이드를 제공합니다.
            </p>
            <p>
              일산룸은 일산 지역을 대표하는 프리미엄 룸으로 신실장이 총책임자로 운영하고 있습니다.
              일산명월관요정은 고양시 일산동구 장항로 895-1에 위치한 전통 요정으로,
              한정식 코스와 국악 라이브 공연, 30개 프라이빗 룸을 갖춘 격조 높은 공간입니다.
            </p>
            <p>
              클럽과 나이트는 완전히 다른 업종입니다. 클럽은 EDM, 힙합 등 전자음악 중심의 공간이고,
              나이트(나이트클럽)는 소셜 댄스와 라이브 밴드가 있는 사교 공간입니다.
              일산룸포털에서는 이러한 업종 차이를 명확히 구분하여 정확한 정보를 제공합니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
