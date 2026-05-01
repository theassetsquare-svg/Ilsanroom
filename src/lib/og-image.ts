/**
 * OG Image URL generator — public/og/ 정적 파일 참조.
 * 닉네임이 있는 가게는 실제 사진 + 닉네임 오버레이 JPG를 사용.
 * 이미지 없는 업소는 스크린샷 서비스 폴백.
 */

import { getVenueScreenshotUrl } from '@/lib/screenshot-url';

const SITE_URL = 'https://nolcool.com';

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
  'dapsimnidontellmamanight',
  'daejeonsevennight',
]);

/**
 * JPG OG 이미지를 사용하는 가게 (카카오톡/밴드/인스타/페북 호환 — SVG 미지원).
 * 1:1 1200x1200 JPG 정적 파일.
 */
const JPG_OG_SLUGS = new Set([
  'haeundaehoppa-kkantappiya',
]);

/** 이미지 파일이 없는 업소 — 스크린샷 서비스 폴백 */
const NO_IMAGE_SLUGS: Record<string, string> = {
  'seongnamshampoonight': 'night',
  'gangnamclub-face': 'club',
  'ilsanclub-cj': 'club',
  'busanhoppa-star': 'hoppa',
  'haeundaehoppa-michelin': 'hoppa',
  'busanhoppa-aura': 'hoppa',
  'daeguhoppa-perfect': 'hoppa',
  'gangnam-hoppa-again': 'hoppa',
  'hongdae-hoppa': 'hoppa',
};

/** 업소 상세 OG image (slug 기반) — JPG 우선 (카톡/밴드/인스타 호환) */
export function getVenueOgImageBySlug(slug: string): string {
  // JPG 1:1 커스텀 썸네일 (카톡/밴드/인스타 호환) — 최우선
  if (JPG_OG_SLUGS.has(slug)) {
    return `${SITE_URL}/og/${slug}.jpg`;
  }
  // 닉네임 오버레이 OG JPG
  if (NICKNAME_OG_SLUGS.has(slug)) {
    return `${SITE_URL}/og/${slug}.jpg`;
  }
  // 이미지 없는 업소 — 스크린샷 서비스 폴백
  if (NO_IMAGE_SLUGS[slug]) {
    return getVenueScreenshotUrl(slug, NO_IMAGE_SLUGS[slug]);
  }
  // 기본: 실제 가게 사진 JPG (SVG 대신 JPG 사용)
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
  const params = new URLSearchParams({ title: venueName, subtitle: label, bg });
  if (staffNickname) params.set('staff', `담당: ${staffNickname}`);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

/** 카테고리 페이지 OG image — JPG fallback */
export function getCategoryOgImage(category: string): string {
  return `${SITE_URL}/og/nolcool-og.jpg`;
}

/** 메인페이지 OG image — JPG (소셜미디어 호환) */
export function getDefaultOgImage(): string {
  return `${SITE_URL}/og/nolcool-og.jpg`;
}

/** 유틸 페이지 OG image — JPG fallback */
export function getPageOgImage(page: string): string {
  return `${SITE_URL}/og/nolcool-og.jpg`;
}
