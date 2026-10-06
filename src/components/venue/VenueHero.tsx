import NcH1 from '@/components/seo/NcH1';
import { cardOwnJpg, cardOwnLight } from '@/lib/venue-file-ver'; // [놀쿨26-1] 가게 자기 쪽 판(놀쿨 명단 가게는 4줄 -v9 · 그 밖은 목록과 같은 판) · [놀쿨34-1] og:image 와 같은 jpg 파일 + 같은 카드의 가벼운 판

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
          <picture>
            {/* [놀쿨34-1 · G3 · 속도] 같은 카드의 가벼운 판(webp · 가로 1200) — 프리렌더 첫 화면이 이미 받아 둔 그 파일이라 다시 받지 않는다 */}
            <source type="image/webp" srcSet={cardOwnLight(slug)} />
            <img
              /* [놀쿨34-1 · G3] 첫 그림의 주소 = og:image 와 같은 파일(1200×1200 jpg) · 그림 설명은 그림에 그려진 그대로 */
              src={cardOwnJpg(slug)}
              alt={`${name} 안내 카드`}
              width={1200}
              height={1200}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="block w-full rounded-xl bg-[#111]"
              style={{ maxWidth: 300, aspectRatio: '1 / 1', height: 'auto' }}
            />
          </picture>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isAd && (
            <span className="rounded border border-[#111] bg-white px-2 py-0.5 text-xs font-bold text-[#111]" data-ad-label>광고</span>
          )}
          <span className="text-sm text-[#444]">{regionLabel}</span>
        </div>
        <NcH1 className="mt-1 text-3xl font-extrabold text-neon-text sm:text-4xl">{name}</NcH1>
        {staffNickname && (
          <p className="mt-2 text-base font-bold text-[#111]">
            <span className="text-[#6D28D9]">★</span> 담당: {staffNickname}
          </p>
        )}
      </div>
    </section>
  );
}
