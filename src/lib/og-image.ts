/**
 * OG Image URL generator for each page type.
 * Uses placehold.co for dynamic text-on-color images.
 * Each page gets a unique OG image with venue name + category.
 */

const categoryColors: Record<string, string> = {
  club: '7C3AED',
  night: 'E11D48',
  lounge: '0891B2',
  room: 'D97706',
  yojeong: '059669',
  hoppa: 'DB2777',
};

const categoryLabels: Record<string, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

/** Venue detail OG image: venueName + category label */
export function getVenueOgImage(venueName: string, category: string): string {
  const color = categoryColors[category] || '7C3AED';
  const label = categoryLabels[category] || '';
  const text = `${venueName} | ${label}`;
  return `https://placehold.co/1200x630/${color}/ffffff/png?text=${encodeURIComponent(text)}`;
}

/** Category page OG image */
export function getCategoryOgImage(category: string): string {
  const color = categoryColors[category] || '7C3AED';
  const label = categoryLabels[category] || '전체';
  return `https://placehold.co/1200x630/${color}/ffffff/png?text=${encodeURIComponent(`${label} | 오늘밤어디`)}`;
}

/** Default OG image for non-specific pages */
export function getDefaultOgImage(): string {
  return 'https://placehold.co/1200x630/8B5CF6/ffffff/png?text=%EC%98%A4%EB%8A%98%EB%B0%A4%EC%96%B4%EB%94%94';
}
