import { useState } from 'react';
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
  // 시즌29 — 이미지 없는 venue는 갤러리 자체를 skip. 있는 venue는 manifest 슬롯만 렌더.
  if (!hasVenueImage(slug)) return null;
  const slots = getVenueImageSlots(slug);
  const renderSlots = slots.length > 0 ? slots : [1];

  const handleError = (n: number) => {
    setFailed((prev) => new Set(prev).add(n));
  };

  return (
    <div className="my-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {renderSlots.map((n) =>
          failed.has(n) ? null : (
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
          )
        )}
      </div>
    </div>
  );
}
