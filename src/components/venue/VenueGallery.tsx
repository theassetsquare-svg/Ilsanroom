import { useState, useRef, useEffect } from 'react';
import { getVenueImageSlots, hasVenueImage } from '@/data/venue-image-manifest';

interface VenueGalleryProps {
  slug: string;
  name: string;
}

/**
 * 슬러그별 1:1 정사각형 비율로 렌더해야 하는 슬롯 (광고 카드 등).
 */
const SQUARE_SLOTS: Record<string, number[]> = {
  'haeundaehoppa-kkantappiya': [4],
};

/**
 * 슬러그별 특정 슬롯에서 기본 파일명 대신 사용할 이미지 경로.
 * 브라우저/CDN 캐시 완전 무효화를 위해 파일명 자체를 교체할 때 사용.
 * 시즌29: 실재하는 파일만 등록 (없는 override는 404를 만든다).
 */
const IMAGE_OVERRIDES: Record<string, Record<number, string>> = {};

const CACHE_VER = 'v3';

function getSrc(slug: string, n: number): string {
  const override = IMAGE_OVERRIDES[slug]?.[n];
  if (override) return `${override}?${CACHE_VER}`;
  return `/venues/${slug}-${n}.webp?${CACHE_VER}`;
}

function isSquareSlot(slug: string, n: number): boolean {
  const slots = SQUARE_SLOTS[slug];
  return !!(slots && slots.includes(n));
}

export default function VenueGallery({ slug, name }: VenueGalleryProps) {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // 시즌29 — 이미지 없는 venue는 갤러리 자체를 skip. 있는 venue는 manifest 슬롯만 렌더.
  if (!hasVenueImage(slug)) return null;
  const slots = getVenueImageSlots(slug);
  const renderSlots = (slots.length > 0 ? slots : [1]).filter((n) => !failed.has(n));

  const handleError = (n: number) => {
    setFailed((prev) => new Set(prev).add(n));
  };

  /* 시즌157B — 사진 ≥2장이면 carousel + dot nav (Zillow·Redfin photo gallery 패턴).
     1장은 기존 단일 이미지 유지 (불필요한 carousel 비용 0). */
  const isCarousel = renderSlots.length >= 2;

  /* IntersectionObserver로 활성 dot 동기화 */
  useEffect(() => {
    if (!isCarousel || !scrollerRef.current) return;
    const scroller = scrollerRef.current;
    const slides = Array.from(scroller.querySelectorAll('[data-slide-idx]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            const idx = Number((e.target as HTMLElement).dataset.slideIdx);
            if (Number.isFinite(idx)) setActiveIdx(idx);
          }
        }
      },
      { root: scroller, threshold: [0.5] },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [isCarousel, renderSlots.length]);

  const scrollToSlide = (idx: number) => {
    if (!scrollerRef.current) return;
    const slide = scrollerRef.current.querySelector<HTMLElement>(`[data-slide-idx="${idx}"]`);
    if (slide) slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  if (!isCarousel) {
    return (
      <div className="my-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {renderSlots.map((n) => (
            <div key={n} className="overflow-hidden rounded-xl">
              <img
                src={getSrc(slug, n)}
                alt={`${name} 매장 사진 ${n}`}
                width={600}
                height={isSquareSlot(slug, n) ? 600 : 400}
                loading="lazy"
                onError={() => handleError(n)}
                className="w-full object-cover"
                style={{ aspectRatio: isSquareSlot(slug, n) ? '1/1' : '3/2' }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8" data-testid="venue-photo-carousel">
      {/* 가로 스크롤 carousel — CSS scroll-snap, 모바일 swipe 자동 지원 */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-2 rounded-xl -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
          role="region"
          aria-label={`${name} 매장 사진 ${renderSlots.length}장`}
        >
          {renderSlots.map((n, i) => (
            <div
              key={n}
              data-slide-idx={i}
              className="shrink-0 w-full snap-start overflow-hidden rounded-xl"
            >
              <img
                src={getSrc(slug, n)}
                alt={`${name} 매장 사진 ${n}`}
                width={600}
                height={isSquareSlot(slug, n) ? 600 : 400}
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={() => handleError(n)}
                className="w-full object-cover"
                style={{ aspectRatio: isSquareSlot(slug, n) ? '1/1' : '3/2' }}
              />
            </div>
          ))}
        </div>

        {/* 좌우 화살표 — PC */}
        {activeIdx > 0 && (
          <button
            type="button"
            aria-label="이전 사진"
            onClick={() => scrollToSlide(activeIdx - 1)}
            className="hidden sm:inline-flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center rounded-full bg-white/85 text-[#111] shadow-md hover:bg-white"
            style={{ width: 40, height: 40 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {activeIdx < renderSlots.length - 1 && (
          <button
            type="button"
            aria-label="다음 사진"
            onClick={() => scrollToSlide(activeIdx + 1)}
            className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center rounded-full bg-white/85 text-[#111] shadow-md hover:bg-white"
            style={{ width: 40, height: 40 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Dot navigation — 부동산 정점 #10 (Zillow photo dots) */}
        <div
          data-testid="venue-photo-dots"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1.5"
          aria-hidden="true"
        >
          {renderSlots.map((_n, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              aria-label={`사진 ${i + 1}로 이동`}
              className={`rounded-full transition-all ${i === activeIdx ? 'bg-white w-4 h-1.5' : 'bg-white/50 hover:bg-white/80 w-1.5 h-1.5'}`}
            />
          ))}
        </div>

        {/* 현재/전체 카운트 */}
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1">
          {activeIdx + 1} / {renderSlots.length}
        </div>
      </div>
    </div>
  );
}
