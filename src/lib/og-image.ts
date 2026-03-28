/**
 * OG Image URL generator — public/og/ 정적 파일 참조.
 * 닉네임이 있는 가게는 실제 사진 + 닉네임 오버레이 JPG를 사용.
 */

const SITE_URL = 'https://ilsanroom.pages.dev';

/** 닉네임 오버레이 OG 이미지가 있는 가게 목록 */
const NICKNAME_OG_SLUGS = new Set([
  'ilsanmyeongwolgwanyojeong',
  'ilsanroom',
  'busanyeonsandongmulnight',
  'busanmulnight',
  'seongnamshampoonight',
  'suwonchancenight',
  'sinlimgrandprixnight',
  'cheongdamh2onight',
  'pajuyadangskydomenight',
  'ulsanchampionnight',
  'gangnamjuliananight',
  'sangbonghangukgwannight',
  'hwajeonghangukgwannight',
  'suwonkoreanight',
  'bundangpongpongnight',
  'busanasiadnight',
  'ulsannewworldnight',
]);

/** 업소 상세 OG image (slug 기반) */
export function getVenueOgImageBySlug(slug: string): string {
  // 닉네임 오버레이 OG가 있으면 그것을 사용
  if (NICKNAME_OG_SLUGS.has(slug)) {
    return `${SITE_URL}/og/${slug}.jpg`;
  }
  // 없으면 실제 가게 사진
  return `${SITE_URL}/venues/${slug}-1.jpg`;
}

/** 업소 상세 OG image (이름 기반 — API 폴백) */
export function getVenueOgImage(venueName: string, category: string, staffNickname?: string): string {
  const categoryLabels: Record<string, string> = {
    club: '클럽', night: '나이트', lounge: '라운지',
    room: '룸', yojeong: '요정', hoppa: '호빠',
  };
  const categoryColors: Record<string, string> = {
    club: '#7C3AED', night: '#EC4899', lounge: '#D4AF37',
    room: '#1E3A5F', yojeong: '#059669', hoppa: '#DC2626',
  };
  const bg = categoryColors[category] || '#7C3AED';
  const label = categoryLabels[category] || '';
  const params = new URLSearchParams({ title: venueName, subtitle: `${label} | 플밤`, bg });
  if (staffNickname) params.set('staff', `담당: ${staffNickname}`);
  return `${SITE_URL}/api/og?${params.toString()}`;
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
