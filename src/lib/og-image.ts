/**
 * OG Image URL generator for each page type.
 * Uses SVG-based dynamic generation via URL params.
 * For static export: falls back to default SVG or category-specific images.
 */

const SITE_URL = 'https://ilsanroom.pages.dev';

const categoryColors: Record<string, string> = {
  club: '8B5CF6',
  night: 'F43F5E',
  lounge: '06B6D4',
  room: 'F59E0B',
  yojeong: '10B981',
  hoppa: 'EC4899',
};

const categoryLabels: Record<string, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

/**
 * Generate OG image URL for a venue detail page.
 * Uses a placeholder service that renders text on colored backgrounds.
 */
export function getVenueOgImage(venueName: string, category: string): string {
  const color = categoryColors[category] || '8B5CF6';
  const label = categoryLabels[category] || '';
  // Use placehold.co as a fallback with text rendering
  return `https://placehold.co/1200x630/${color}/ffffff/png?text=${encodeURIComponent(`${venueName}\\n${label} | 오늘밤어디`)}&font=pretendard`;
}

/**
 * Get default OG image for non-venue pages
 */
export function getDefaultOgImage(): string {
  return `${SITE_URL}/og/default.svg`;
}

/**
 * Get category-specific OG image
 */
export function getCategoryOgImage(category: string): string {
  const color = categoryColors[category] || '8B5CF6';
  const label = categoryLabels[category] || '전체';
  return `https://placehold.co/1200x630/${color}/ffffff/png?text=${encodeURIComponent(`${label} | 오늘밤어디`)}&font=pretendard`;
}
