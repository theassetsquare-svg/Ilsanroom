import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import JsonLd from '@/components/seo/JsonLd';
import HeroSearch from '@/components/home/HeroSearch';
import HotWidget from '@/components/home/HotWidget';
import QuizCTA from '@/components/home/QuizCTA';
import HomeRoulette from '@/components/home/HomeRoulette';
import HomeVSBattle from '@/components/home/HomeVSBattle';
import PopularTimeWidget from '@/components/home/PopularTimeWidget';
import { getPopularVenues, categories } from '@/data/venues';
import type { Venue } from '@/types';

export const metadata: Metadata = {
  title: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
  description: '일산룸, 일산명월관요정 등 전국 103개 업소 정보를 한눈에. 실시간 인기 순위, 첫 방문 가이드, VS 대결 투표까지.',
  openGraph: {
    title: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
    description: '전국 103개 업소 정보. 실시간 인기 순위, 첫 방문 가이드, VS 대결 투표.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '오늘밤어디',
    url: 'https://ilsanroom.pages.dev',
    images: [{ url: 'https://placehold.co/1200x630/8B5CF6/ffffff/png?text=%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94', width: 1200, height: 630, alt: '오늘밤어디' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘밤어디 — 전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
    images: ['https://placehold.co/1200x630/8B5CF6/ffffff/png?text=%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94'],
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
  };
  return pathMap[category] || `/${category}/${slug}`;
}

function getCategoryLabel(cat: string) {
  const map: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };
  return map[cat] || cat;
}

function VenueCard({ venue, href, rank }: { venue: Venue; href: string; rank?: number }) {
  const nameIncludesRegion = venue.nameKo.includes(venue.regionKo);
  const nameIncludesCategory = venue.nameKo.includes(getCategoryLabel(venue.category));
  return (
    <Card href={href}>
      <div className="flex h-full min-h-[100px] flex-col justify-between">
        <div>
          {rank && (
            <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neon-primary text-[10px] font-bold text-white">
              {rank}
            </span>
          )}
          {venue.isPremium && <Badge variant="premium" className="mb-2 block w-fit">PREMIUM</Badge>}
          <h3 className="text-sm font-bold text-neon-text leading-tight line-clamp-2 sm:text-base">{venue.nameKo}</h3>
        </div>
        <p className="mt-2 text-xs text-neon-text-muted line-clamp-1">
          {!nameIncludesRegion && venue.regionKo}
          {!nameIncludesRegion && !nameIncludesCategory && ' · '}
          {!nameIncludesCategory && getCategoryLabel(venue.category)}
          {venue.staffNickname && <> · {venue.staffNickname}</>}
        </p>
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
  { label: '부산', href: '/rooms/busan-haeundae' },
  { label: '대구', href: '/nights/daegu' },
  { label: '인천', href: '/nights/incheon' },
  { label: '수원', href: '/nights/suwon' },
  { label: '대전', href: '/nights/daejeon' },
  { label: '광주', href: '/nights/gwangju' },
  { label: '울산', href: '/nights/ulsan' },
  { label: '제주', href: '/nights/jeju' },
];

/* ── Latest reviews (real venues only) ── */
const latestReviews = [
  { venue: '일산명월관요정', text: '한정식 코스가 정말 훌륭했습니다. 국악 공연도 감동적이었어요.', author: '김**', date: '2026-03-12' },
  { venue: '강남클럽 레이스', text: '베이스 사운드에 몸이 먼저 반응합니다. 강남 최고 수준.', author: '이**', date: '2026-03-11' },
  { venue: '수원찬스돔나이트', text: '돔 구조가 만들어내는 공간감이 독특해요. 강호동 담당자 재밌음.', author: '박**', date: '2026-03-10' },
  { venue: '해운대고구려', text: '룸이 60개 넘으니까 웨이팅 없이 바로 들어갈 수 있어서 좋아요.', author: '최**', date: '2026-03-09' },
];

/* ── Magazine preview ── */
const magazineItems = [
  { title: '강남 TOP5 — 올해 꼭 가봐야 할 핫플', tag: '추천', href: '/magazine' },
  { title: '전통 격식 공간 완벽 안내서: 접대부터 가족모임까지', tag: '전통', href: '/magazine' },
  { title: '처음 방문하는 분을 위한 A to Z 매너 핸드북', tag: '입문', href: '/magazine' },
  { title: '홍대 vs 이태원 비교 — 어디가 나에게 맞을까?', tag: '비교', href: '/magazine' },
];

/* ── Instagram hashtags ── */
const instaHashtags = [
  { tag: '#일산룸', desc: '프리미엄 룸 인테리어', url: 'https://www.instagram.com/explore/tags/일산룸/' },
  { tag: '#일산명월관', desc: '전통 코스 요리', url: 'https://www.instagram.com/explore/tags/일산명월관/' },
  { tag: '#강남클럽', desc: '주말 파티 현장', url: 'https://www.instagram.com/explore/tags/강남클럽/' },
  { tag: '#강남호빠', desc: '호스트클럽 현장', url: 'https://www.instagram.com/explore/tags/강남호빠/' },
  { tag: '#일산요정', desc: '국악 라이브 연주', url: 'https://www.instagram.com/explore/tags/일산요정/' },
  { tag: '#부산나이트', desc: '부산 사교 댄스 명소', url: 'https://www.instagram.com/explore/tags/부산나이트/' },
];

export default function HomePage() {
  const popularVenues = getPopularVenues(10);

  return (
    <div className="bg-neon-bg">
      {/* JSON-LD: WebSite + SearchAction */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '오늘밤어디',
        url: 'https://ilsanroom.pages.dev',
        description: '전국 클럽·나이트·라운지·룸·요정·호빠 실시간 정보',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://ilsanroom.pages.dev/map?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      }} />

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '인기 업소',
        itemListElement: popularVenues.slice(0, 10).map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'LocalBusiness', name: v.nameKo, address: v.address },
        })),
      }} />

      {/* ═══════ 1. HERO — 검색바 + 카테고리 아이콘 ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-neon-bg to-neon-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/60 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:py-14 lg:py-16">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-neon-text sm:text-4xl lg:text-5xl">
              <span className="gradient-text">오늘밤어디</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-neon-text-muted sm:text-lg">
              전국 클럽 · 나이트 · 라운지 · 룸 · 요정 · 호빠 실시간 정보
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <HeroSearch />
            </div>
          </div>

          {/* 6종 카테고리 아이콘 */}
          <div className="mt-8 grid grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link key={cat.key} href={cat.path} className="group flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:bg-white/80">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition-all group-hover:shadow-md group-hover:scale-105">
                  {cat.icon}
                </span>
                <span className="text-xs font-semibold text-neon-text-muted group-hover:text-neon-text">{cat.labelKo}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 2. 지금 뜨는 TOP 5 ═══════ */}
      <HotWidget />

      {/* ═══════ 3. 오늘 갈 곳 룰렛 ═══════ */}
      <HomeRoulette />

      {/* ═══════ 4. VS 대결 투표 ═══════ */}
      <HomeVSBattle />

      {/* ═══════ 5. 지역별 업소 찾기 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-5 text-xl font-bold text-neon-text">지역별 업소 찾기</h2>
        <div className="flex flex-wrap gap-3">
          {regions.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className="rounded-xl border border-neon-border bg-white px-5 py-3 text-sm font-medium text-neon-text-muted transition-all hover:border-neon-primary/40 hover:text-neon-text card-hover"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ 6. 퀴즈 CTA ═══════ */}
      <QuizCTA />

      {/* ═══════ 7. 첫 방문 가이드 배너 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/guide" className="group block">
          <div className="rounded-2xl border border-neon-border bg-white p-5 sm:p-6 transition-all hover:shadow-md card-hover">
            <div className="flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neon-text sm:text-lg">처음이세요? 이것만 알면 됩니다</h3>
                <p className="text-sm text-neon-text-muted">뭐 입고? 얼마? 혼자 가도 돼? — 업종별 첫 방문 필수 정보</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-xl border border-neon-border px-5 py-2.5 text-sm font-semibold text-neon-primary transition group-hover:bg-neon-primary/5">
                가이드 보기 →
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══════ 8. 인기 TOP 10 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">인기 업소 TOP 10</h2>
          <Link href="/ranking" className="text-sm text-neon-primary hover:underline">
            전체 랭킹 →
          </Link>
        </div>
        <div className="venue-card-grid">
          {popularVenues.slice(0, 10).map((venue, i) => (
            <div key={venue.id} className="relative">
              <VenueCard venue={venue} href={getCategoryHref(venue.category, venue.slug, venue.region)} rank={i + 1} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ 9. 최신 후기 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">최신 후기</h2>
          <Link href="/community/reviews" className="text-sm text-neon-primary hover:underline">
            전체 후기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latestReviews.map((review, i) => (
            <div key={i} className="rounded-2xl border border-neon-border bg-white p-5 card-hover">
              <p className="mb-3 text-sm leading-relaxed text-neon-text line-clamp-3">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center justify-between text-xs text-neon-text-muted">
                <span>{review.author} · {review.venue}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ 10. 매거진 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neon-text">매거진</h2>
          <Link href="/magazine" className="text-sm text-neon-primary hover:underline">
            더보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {magazineItems.map((item, i) => (
            <Link key={i} href={item.href} className="rounded-2xl border border-neon-border bg-white p-5 card-hover block">
              <Badge className="mb-3">{item.tag}</Badge>
              <h3 className="text-sm font-semibold text-neon-text leading-snug line-clamp-2">{item.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ 11. 인스타그램 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-neon-text">인스타그램</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {instaHashtags.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl border border-neon-border bg-white transition-all hover:border-neon-pink/40 card-hover"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <svg className="mb-2 h-6 w-6 text-neon-pink/60 group-hover:text-neon-pink transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span className="text-xs font-medium text-neon-pink">{post.tag}</span>
                <span className="mt-1 text-[10px] text-neon-text-muted">{post.desc}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ 12. 인기 시간대 ═══════ */}
      <PopularTimeWidget />

      {/* ═══════ 13. 업주 유치 배너 ═══════ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link href="/for-business" className="group block">
          <div className="relative overflow-hidden rounded-2xl border border-neon-primary/20 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-8 sm:p-12 transition-all hover:shadow-lg">
            <div className="relative flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-neon-text sm:text-3xl">
                  내 업소를 등록하고 <span className="text-neon-primary">매출 300%</span> 올리세요
                </h3>
                <p className="text-neon-text-muted">
                  등록 시 월 평균 방문자 1,200명 이상 노출. 무료 체험으로 시작해 보세요.
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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-neon-border bg-white p-8">
          <h2 className="mb-4 text-lg font-bold text-neon-text">업종별 특징과 이용 팁</h2>
          <div className="space-y-4 text-sm leading-relaxed text-neon-text-muted">
            <p>
              일산룸은 고양시 중심가에서 프라이빗한 모임 공간을 찾는 분들에게 인기 있는 곳이고,
              일산명월관요정은 장항로에 위치한 전통 한정식 공간으로 비즈니스 접대와 기념일 행사에 적합합니다.
            </p>
            <p>
              EDM 중심의 댄스홀과 소셜 댄스 기반의 사교장은 완전히 다른 업종입니다.
              전자는 DJ 세트에 맞춰 자유롭게 즐기는 공간이고,
              후자는 라이브 밴드와 파트너 댄스 문화가 중심인 사교 공간입니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
