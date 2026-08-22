/**
 * OG Image URL generator — public/og/ 정적 파일 참조.
 * 2026-08-22 전 업소 "가게이름" 1:1 썸네일(generate-og-name11.mjs) 단일 배선.
 * 수동 합성본 2곳(OG_FILE_VER -v2)만 등록 버전, 나머지 전 슬러그 -v3.
 * prerender-seo.mjs getVenueOgImage 와 같은 규칙 (같은 커밋 동기화 필수).
 */

import { ogVer } from '@/lib/venue-file-ver';

const SITE_URL = 'https://nolcool.com';

/** 업소 상세 OG image (slug 기반) — 가게이름 1:1 JPG 썸네일 */
export function getVenueOgImageBySlug(slug: string): string {
  return `${SITE_URL}/og/${slug}${ogVer(slug)}.jpg`;
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
