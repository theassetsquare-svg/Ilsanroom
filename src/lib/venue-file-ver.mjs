/**
 * venue 이미지 파일명 버전 — 이미지 "내용"을 교체했을 때 캐시(엣지 30일)와 무관하게
 * 모든 사용자에게 즉시 반영시키는 파일명 버전업 레지스트리.
 * 클라이언트(src)와 prerender(scripts/prerender-seo.mjs)가 공유하는 단일 소스.
 * 새 교체가 생기면 여기에 slug: '-v3' 식으로만 추가하면 전 참조가 따라온다.
 * 주의: 등록한 버전의 실제 파일(public/venues/{slug}-1{ver}.jpg/.webp, public/og/{slug}{ver}.jpg)이 실재해야 한다.
 */

/** slot 1(히어로/썸네일) 파일명 버전 */
export const HERO_FILE_VER = {
  ilsanroom: '-v2', // 2026-08-01 전화번호 합성본 (backup/venue-images/20260801-ilsanroom-phone)
};

/** /og/{slug}.jpg 파일명 버전 */
export const OG_FILE_VER = {
  ilsanroom: '-v2', // 동일 건
};

export const heroVer = (slug) => HERO_FILE_VER[slug] || '';
export const ogVer = (slug) => OG_FILE_VER[slug] || '';
