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
  // [P2 · 설계도 14-4] 2026-09-06 전 업소 표준 글자 카드(-v5)로 통일 — 광고주 4줄·비광고주 3줄, 예외 없음
  bulgwangdonghobaknight: '-v6', // 2026-09-07 광고주 등록(손흥민 010-2221-1937) → 4줄 카드로 다시 그림(scripts/make-venue-card.py). 파일명을 올려야 엣지 캐시가 옛 3줄 카드를 안 준다
  // 2026-09-22 대표님 지시 — 옛 광고주 세트를 일산룸 총책임자(010-4117-5556)로 교체.
  // -v5 카드의 배경·테두리·가게이름·노란 줄·맨아래 줄은 그대로 두고 닉네임·번호 두 줄만 다시 그렸다.
  // 파일명을 올려야 Cloudflare 엣지가 옛 번호 카드를 계속 주지 않는다(썸네일 표준 5절 함정 5).
  ilsanroom: '-v6',
  ilsanmyeongwolgwanyojeong: '-v6',
  // 2026-09-24 긴급 — 수원찬스돔나이트 카드가 명단 밖 옛 닉네임·번호였다 → 광고주 기준 「박찬호 010-7117-5077」로 두 줄만 다시 그림(scripts/redraw-adv-card.mjs).
  suwonchancenight: '-v6',
};

/** 2026-08-22 전 업소 "가게이름" 1:1 og 썸네일 전환(generate-og-name11.mjs).
 *  수동 합성본(OG_FILE_VER 등록 2곳)만 -v2 유지, 나머지 전 슬러그 -v3 파일 참조. */
export const OG_DEFAULT_VER = '-v5';

export const heroVer = (slug) => HERO_FILE_VER[slug] || '';
export const ogVer = (slug) => OG_FILE_VER[slug] || OG_DEFAULT_VER;
