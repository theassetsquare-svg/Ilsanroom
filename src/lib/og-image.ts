/**
 * OG Image URL generator — public/og/ 정적 SVG 파일 참조.
 * 카카오톡/네이버/구글에서 썸네일이 정상 표시됨.
 */

const SITE_URL = 'https://ilsanroom.pages.dev';

/** 업소 상세 OG image */
export function getVenueOgImage(venueName: string, category: string, staffNickname?: string): string {
  // staffNickname is baked into the pre-generated SVG, so just use slug-based URL
  // This function is called with venue.nameKo but we need slug — fallback to API
  // Since we can't derive slug from nameKo here, use the API endpoint as fallback
  const categoryColors: Record<string, string> = {
    club: '#7C3AED', night: '#EC4899', lounge: '#D4AF37',
    room: '#1E3A5F', yojeong: '#059669', hoppa: '#DC2626',
  };
  const categoryLabels: Record<string, string> = {
    club: '클럽', night: '나이트', lounge: '라운지',
    room: '룸', yojeong: '요정', hoppa: '호빠',
  };
  const bg = categoryColors[category] || '#7C3AED';
  const label = categoryLabels[category] || '';
  const params = new URLSearchParams({ title: venueName, subtitle: `${label} | 플밤`, bg });
  if (staffNickname) params.set('staff', `담당: ${staffNickname}`);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

/** 업소 상세 OG image (slug 기반 — 실제 사진 우선, 없으면 SVG 폴백) */
export function getVenueOgImageBySlug(slug: string): string {
  // Real venue photo takes priority over text SVG
  return `${SITE_URL}/venues/${slug}-1.jpg`;
}

/** 카테고리 페이지 OG image */
export function getCategoryOgImage(category: string): string {
  const pathMap: Record<string, string> = {
    club: 'clubs', night: 'nights', lounge: 'lounges',
    room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa',
  };
  return `${SITE_URL}/og/${pathMap[category] || category}.svg`;
}

/** 메인페이지 OG image */
export function getDefaultOgImage(): string {
  return `${SITE_URL}/og/main.svg`;
}

/** 유틸 페이지 OG image */
export function getPageOgImage(page: string): string {
  return `${SITE_URL}/og/${page}.svg`;
}
