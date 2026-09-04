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
  ilsanmyeongwolgwanyojeong: '-v2', // 2026-08-02 전화번호 합성본 (backup/venue-images/20260802-ilsanmyeongwolgwan-phone)
};

/** /og/{slug}.jpg 파일명 버전 */
export const OG_FILE_VER = {
  ilsanroom: '-v2', // 동일 건
  ilsanmyeongwolgwanyojeong: '-v2', // 동일 건
  gwangjucheomdanempanight: '-v4', // 2026-08-23 정식명 교정(엠파→엠파이어) 재생성 — 엣지 캐시 무효화 버전업
  seongnamshampoonight: '-v2', // 2026-09-04 광고주 등록(이쁜이 010-3432-4758) 재생성
  busanasiadnight: '-v4', // 2026-08-25 광고주 등록(새우깡 010-3614-1056) 재생성 — 엣지 캐시 무효화 버전업
  pajuyadangskydomenight: '-v4', // 2026-09-02 광고주 교체(막내 → 딸기 010-3447-0963) 재생성 — 엣지 캐시 무효화 버전업
};

/** 2026-08-22 전 업소 "가게이름" 1:1 og 썸네일 전환(generate-og-name11.mjs).
 *  수동 합성본(OG_FILE_VER 등록 2곳)만 -v2 유지, 나머지 전 슬러그 -v3 파일 참조. */
export const OG_DEFAULT_VER = '-v3';

export const heroVer = (slug) => HERO_FILE_VER[slug] || '';
export const ogVer = (slug) => OG_FILE_VER[slug] || OG_DEFAULT_VER;
