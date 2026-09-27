import { cardSrc } from '@/lib/venue-file-ver';

interface VenueHeroProps {
  name: string;
  staffNickname?: string;
  /** [놀쿨12-2 · 13:18-2] 명단 광고주 가게 — 「광고」 표시(표시광고법). 옛 「PREMIUM」 배지는 쓰지 않는다 */
  isAd: boolean;
  category: string;
  regionLabel: string;
  slug?: string;
}

/**
 * 가게 쪽 첫 화면 — [놀쿨12-2 · 13:18-6·7] 가게 사진 대신 가게 이름이 크게 그려진 표준 카드(쪽마다 고유)를 보인다.
 * 프리렌더 첫 화면(scripts/prerender-seo.mjs ssr-hero)은 같은 카드를 더 크게(가로 최대 420px) 먼저 그린다
 * → React 가 첫 화면을 다시 그려도 그보다 큰 요소가 없어 첫 화면 그리기(LCP)가 자바스크립트 뒤로 밀리지 않는다(web.dev/articles/optimize-lcp).
 */
export default function VenueHero({ name, staffNickname, isAd, regionLabel, slug }: VenueHeroProps) {
  return (
    <section className="border-b border-neon-border bg-neon-bg">
      <div className="mx-auto max-w-[1200px] px-4 pb-6 sm:px-6">
        {slug && (
          <img
            src={cardSrc(slug)}
            alt={`${name} 표준 카드`}
            width={600}
            height={600}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="block w-full rounded-xl bg-[#111]"
            style={{ maxWidth: 300, aspectRatio: '1 / 1', height: 'auto' }}
          />
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isAd && (
            <span className="rounded border border-[#111] bg-white px-2 py-0.5 text-xs font-bold text-[#111]" data-ad-label>광고</span>
          )}
          <span className="text-sm text-[#444]">{regionLabel}</span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold text-neon-text sm:text-4xl">{name}</h1>
        {staffNickname && (
          <p className="mt-2 text-base font-bold text-[#111]">
            <span className="text-[#6D28D9]">★</span> 담당: {staffNickname}
          </p>
        )}
      </div>
    </section>
  );
}
