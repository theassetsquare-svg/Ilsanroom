/**
 * OG Image URL generator — SVG data URI (no external service dependency).
 * Each page gets a unique OG image with venue name + category.
 * Renders as valid image in og:image meta tags.
 */

const SITE_URL = 'https://ilsanroom.pages.dev';

const categoryColors: Record<string, string> = {
  club: '#7C3AED',
  night: '#E11D48',
  lounge: '#0891B2',
  room: '#D97706',
  yojeong: '#059669',
  hoppa: '#DB2777',
};

const categoryLabels: Record<string, string> = {
  club: '클럽',
  night: '나이트',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

function buildOgSvgUrl(title: string, subtitle: string, bgColor: string): string {
  // Use a simple API endpoint approach for OG images
  // Encode into URL-safe params for a serverless OG image generator
  const params = new URLSearchParams({
    title,
    subtitle,
    bg: bgColor,
  });
  return `${SITE_URL}/api/og?${params.toString()}`;
}

/** Venue detail OG image: venueName + category label */
export function getVenueOgImage(venueName: string, category: string): string {
  const color = categoryColors[category] || '#7C3AED';
  const label = categoryLabels[category] || '';
  return buildOgSvgUrl(venueName, `${label} | 오늘밤어디`, color);
}

/** Category page OG image */
export function getCategoryOgImage(category: string): string {
  const color = categoryColors[category] || '#7C3AED';
  const label = categoryLabels[category] || '전체';
  return buildOgSvgUrl(label, '오늘밤어디', color);
}

/** Default OG image for non-specific pages */
export function getDefaultOgImage(): string {
  return buildOgSvgUrl('오늘밤어디', '전국 밤문화 실시간 정보', '#8B5CF6');
}
