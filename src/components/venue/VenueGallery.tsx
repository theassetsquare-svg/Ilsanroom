import { useState } from 'react';

interface VenueGalleryProps {
  slug: string;
  name: string;
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
                src={`/venues/${slug}-${n}.jpg`}
                alt={name}
                width={600}
                height={400}
                loading="eager"
                onError={() => handleError(n)}
                className="w-full object-cover"
                style={{ aspectRatio: '3/2' }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
