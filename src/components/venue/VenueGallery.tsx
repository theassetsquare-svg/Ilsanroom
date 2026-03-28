import { useState } from 'react';

interface VenueGalleryProps {
  slug: string;
  name: string;
}

interface ImageSlot {
  src: string;
  fallback: string;
  loaded: boolean;
  failed: boolean;
}

export default function VenueGallery({ slug, name }: VenueGalleryProps) {
  const [slots, setSlots] = useState<ImageSlot[]>(() =>
    [1, 2, 3, 4, 5, 6].map((n) => ({
      src: `/venues/${slug}-${n}.jpg`,
      fallback: `/venues/${slug}-${n}.webp`,
      loaded: false,
      failed: false,
    }))
  );

  const handleLoad = (idx: number) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, loaded: true } : s)));
  };

  const handleError = (idx: number) => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        if (s.src.endsWith('.jpg')) {
          return { ...s, src: s.fallback };
        }
        if (s.src.endsWith('.webp')) {
          return { ...s, src: s.src.replace('.webp', '.png') };
        }
        return { ...s, failed: true };
      })
    );
  };

  const visibleSlots = slots.filter((s) => !s.failed);
  if (visibleSlots.length === 0) return null;

  return (
    <div className="my-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, idx) =>
          slot.failed ? null : (
            <div key={idx} className="relative overflow-hidden rounded-xl bg-neon-surface-2">
              <img
                src={slot.src}
                alt={name}
                width={600}
                height={400}
                loading="lazy"
                onLoad={() => handleLoad(idx)}
                onError={() => handleError(idx)}
                className={`w-full object-cover transition-opacity duration-300 ${
                  slot.loaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ aspectRatio: '3/2' }}
              />
              {!slot.loaded && !slot.failed && (
                <div className="absolute inset-0 animate-pulse bg-neon-surface-2" style={{ aspectRatio: '3/2' }} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
