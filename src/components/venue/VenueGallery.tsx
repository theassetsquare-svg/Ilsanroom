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

function getSrc(slug: string, n: number): string {
  return `/venues/${slug}-${n}.jpg`;
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
