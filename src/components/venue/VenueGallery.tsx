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
  /* 데드클릭 근절(Clarity 실측: 사진 탭 무반응) — 사진 탭 = 전체화면 확대 */
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
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

  /* 라이트박스 열린 동안 ESC 닫기 + 배경 스크롤 잠금 (cleanup 필수) */
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIdx]);

  const lightbox = lightboxIdx !== null && renderSlots[lightboxIdx] !== undefined && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} 사진 크게 보기`}
      onClick={() => setLightboxIdx(null)}
    >
      <img
        src={getSrc(slug, renderSlots[lightboxIdx])}
        alt={`${name} 매장 사진 ${renderSlots[lightboxIdx]} 확대`}
        className="max-h-[92vh] max-w-[96vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        aria-label="닫기"
        onClick={() => setLightboxIdx(null)}
        className="absolute right-3 top-3 z-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
        style={{ width: 44, height: 44 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {renderSlots.length > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 사진"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + renderSlots.length) % renderSlots.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
            style={{ width: 44, height: 44 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % renderSlots.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
            style={{ width: 44, height: 44 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
            {lightboxIdx + 1} / {renderSlots.length}
          </div>
        </>
      )}
    </div>
  );

  if (!isCarousel) {
    return (
      <div className="my-8" id="venue-gallery">
        <div className="grid gap-3 sm:grid-cols-2">
          {renderSlots.map((n, i) => (
            <button
              key={n}
              type="button"
              aria-label={`${name} 매장 사진 ${n} 크게 보기`}
              onClick={() => setLightboxIdx(i)}
              className="block w-full cursor-zoom-in overflow-hidden rounded-xl p-0 text-left"
            >
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
            </button>
          ))}
        </div>
        {lightbox}
      </div>
    );
  }

  return (
    <div className="my-8" id="venue-gallery" data-testid="venue-photo-carousel">
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
            <button
              key={n}
              type="button"
              data-slide-idx={i}
              aria-label={`${name} 매장 사진 ${n} 크게 보기`}
              onClick={() => setLightboxIdx(i)}
              className="block shrink-0 w-full snap-start cursor-zoom-in overflow-hidden rounded-xl p-0 text-left"
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
            </button>
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
      {lightbox}
    </div>
  );
}
