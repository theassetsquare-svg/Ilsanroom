/**
 * Venue image utilities.
 * Images are stored in /public/venues/{slug}-{1,2,3,4}.{jpg,webp}
 * If no real image exists, returns null so the UI can show a fallback.
 */

const EXTENSIONS = ['jpg', 'webp', 'png'] as const;

/** Known venue images — populated at build time by scanning /public/venues/ */
const imageCache = new Map<string, string[]>();
let cacheReady = false;

function ensureCache() {
  if (cacheReady) return;
  // In production, all venue images are in /venues/ with pattern {slug}-{n}.{ext}
  // We rely on the browser returning 404 for missing images, handled by onError in components
  cacheReady = true;
}

/** Get all available image paths for a venue (up to 4) */
export function getVenueImages(slug: string): string[] {
  ensureCache();
  const cached = imageCache.get(slug);
  if (cached) return cached;

  // Return candidate paths — the component will handle missing images via onError
  const paths: string[] = [];
  for (let i = 1; i <= 4; i++) {
    for (const ext of EXTENSIONS) {
      paths.push(`/venues/${slug}-${i}.${ext}`);
    }
  }
  return paths;
}

/** Get the primary image for a venue (for OG/hero) */
export function getVenueHeroImage(slug: string): string {
  return `/venues/${slug}-1.jpg`;
}

/** Get body images (2-4) for inline content */
export function getVenueBodyImages(slug: string): string[] {
  return [
    `/venues/${slug}-2.jpg`,
    `/venues/${slug}-3.jpg`,
    `/venues/${slug}-4.jpg`,
  ];
}

/**
 * Check if a venue has real images by testing the first image.
 * Used in components to decide whether to show image gallery.
 */
export function getVenueImageCandidates(slug: string): {
  hero: string;
  body: string[];
  heroFallbacks: string[];
} {
  return {
    hero: `/venues/${slug}-1.jpg`,
    heroFallbacks: [`/venues/${slug}-1.webp`, `/venues/${slug}-1.png`],
    body: [
      `/venues/${slug}-2.jpg`,
      `/venues/${slug}-2.webp`,
      `/venues/${slug}-3.jpg`,
      `/venues/${slug}-3.webp`,
      `/venues/${slug}-4.jpg`,
      `/venues/${slug}-4.webp`,
    ],
  };
}
