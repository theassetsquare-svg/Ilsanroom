import { useState } from 'react';

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
 */
const IMAGE_OVERRIDES: Record<string, Record<number, string>> = {
  'haeundaehoppa-kkantappiya': {
    4: '/venues/haeundaehoppa-kkantappiya-subin-ad.jpg',
  },
};

const CACHE_VER = 'v2';

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

  const handleError = (n: number) => {
    setFailed((prev) => new Set(prev).add(n));
  };

  return (
    <div className="my-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) =>
          failed.has(n) ? null : (
            <div key={n} className="overflow-hidden rounded-xl">
              <img
                src={getSrc(slug, n)}
                alt={name}
                width={600}
                height={isSquareSlot(slug, n) ? 600 : 400}
                loading="lazy"
                onError={() => handleError(n)}
                className="w-full object-cover"
                style={{ aspectRatio: isSquareSlot(slug, n) ? '1/1' : '3/2' }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
