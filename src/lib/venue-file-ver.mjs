/**
 * venue 이미지 파일명 버전 — 이미지 "내용"을 교체했을 때 캐시(엣지 30일)와 무관하게
 * 모든 사용자에게 즉시 반영시키는 파일명 버전업 레지스트리.
 * 클라이언트(src)와 prerender(scripts/prerender-seo.mjs)가 공유하는 단일 소스.
 * 새 교체가 생기면 여기에 slug: '-v3' 식으로만 추가하면 전 참조가 따라온다.
 * 주의: 등록한 버전의 실제 파일(public/venues/{slug}-1{ver}.jpg/.webp, public/og/{slug}{ver}.jpg)이 실재해야 한다.
 */

/** slot 1(히어로/썸네일) 파일명 버전 */
export const HERO_FILE_VER = {
  // 2026-09-22 대표님 지시 — 옛 광고주 세트 → 일산룸 총책임자(010-4117-5556).
  // -v2 는 옛 닉네임·옛 번호가 그림에 합성돼 있어 글자만으로는 못 지운다. 생성기(gen-*-image.mjs)의
  // 배경·무늬·테두리를 그대로 다시 그리고 리본 글자와 번호 줄만 새 값으로 넣어 -v3 을 만들었다.
  // 옛 -v2 파일은 지우지 않고 남겨 둔다(되돌릴 근거).
  ilsanroom: '-v3',
  ilsanmyeongwolgwanyojeong: '-v3',
};

/** /og/{slug}.jpg 파일명 버전 */
export const OG_FILE_VER = {
  // [놀쿨12-2 · 2026-09-27] 전 업소 새 판 -v8(가게 이름이 가장 크게 · scripts/generate-og-name11.mjs) 로 통일 — 가게별 옛 판(-v6 · -v7)은 끝.
  //   옛 판 파일은 지우지 않았다(되돌릴 근거). 앞으로 한 가게만 다시 그리면 여기에 slug: '-v9' 식으로 올린다.
};

/** 2026-08-22 전 업소 "가게이름" 1:1 og 썸네일 전환(generate-og-name11.mjs).
 *  수동 합성본(OG_FILE_VER 등록 2곳)만 -v2 유지, 나머지 전 슬러그 -v3 파일 참조. */
export const OG_DEFAULT_VER = '-v8'; // [놀쿨12-2] 새 판 카드

export const heroVer = (slug) => HERO_FILE_VER[slug] || '';
export const ogVer = (slug) => OG_FILE_VER[slug] || OG_DEFAULT_VER;

/** [놀쿨12-2 · 13:18-6·7] 화면의 가게 그림 = 표준 카드(가게 이름이 가장 크게)의 webp 축소판(빌드가 dist/og/<이름>-w600.webp 로 만든다).
 *  가게 사진(/venues/*)은 사진 판정표(docs/NOLCOOL12_사진판정_2026-09-27.md) 여섯 가지를 모두 넘은 것만 쓰는데 지금 0장이라 전부 카드다. */
export const cardSrc = (slug) => `/og/${slug}${ogVer(slug)}-w600.webp`;

/** [놀쿨26-1 · 대표님 2026-10-04 03:43] 놀쿨 전용 명단(src/data/advertisers.nolcool.json · 따봉)의 4줄 카드 — 명단에 적힌 쪽에서만 쓴다.
 *  가게 쪽: 자기 쪽의 og:image·첫 그림만 이 판(-v9 · 가게이름 / 닉네임 / 번호 / 광고문의 카톡 besta12). 목록·검색 같은 다른 쪽은 ogVer(3줄 판) 그대로.
 *  매거진 쪽: og:image 만 MAGAZINE_OG 의 파일(public/og/<값>.jpg). 그림은 scripts/generate-og-name11.mjs 가 그린다. */
export const OG_OWN_PAGE_VER = {
  busanmulnight: '-v9',
  busanyeonsandongmulnight: '-v9',
};
export const ogOwnVer = (slug) => OG_OWN_PAGE_VER[slug] || ogVer(slug);
export const cardOwnSrc = (slug) => `/og/${slug}${ogOwnVer(slug)}-w600.webp`;
export const MAGAZINE_OG = {
  'busan-night-guide': 'magazine-busan-night-guide-v1',
  'busan-nightlife-roundup': 'magazine-busan-nightlife-roundup-v1',
};
