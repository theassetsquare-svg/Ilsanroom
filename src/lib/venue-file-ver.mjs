/**
 * venue 이미지 파일명 버전 — 이미지 "내용"을 교체했을 때 캐시(엣지 30일)와 무관하게
 * 모든 사용자에게 즉시 반영시키는 파일명 버전업 레지스트리.
 * 클라이언트(src)와 prerender(scripts/prerender-seo.mjs)가 공유하는 단일 소스.
 * 새 교체가 생기면 여기에 slug: '-v3' 식으로만 추가하면 전 참조가 따라온다.
 * 주의: 등록한 버전의 실제 파일(public/venues/{slug}-1{ver}.jpg/.webp, public/og/{slug}{ver}.jpg)이 실재해야 한다.
 */

/** slot 1(히어로/썸네일) 파일명 버전 */
export const HERO_FILE_VER = {
  // 2026-09-22 일산룸·일산명월관요정 사진 판 -v3 을 만들었으나 그 그림에 옛 일산룸 총책임자 번호가 들어 있다(대표님 2026-10-04 04:35 「어디에도 0」).
  // [놀쿨70-1 · 2026-11-09] 그래서 두 -v3 판(jpg·webp)을 public/venues 에서 뺐고(_to_delete · git 기록 · sha1 은 scripts/forbidden-images.json) 여기도 비웠다.
  //   가게 사진은 PHOTO_PASS(scripts/gen-image-manifest.mjs)가 비어 지금 어느 쪽도 부르지 않는다. 출처가 확인된 새 사진을 쓸 때 slug: '-v4' 식으로 다시 넣는다.
};

/** /og/{slug}.jpg 파일명 버전 */
export const OG_FILE_VER = {
  // [놀쿨12-2 · 2026-09-27] 전 업소 새 판 -v8(가게 이름이 가장 크게 · scripts/generate-og-name11.mjs) 로 통일 — 가게별 옛 판(-v6 · -v7)은 끝.
  //   옛 판 파일은 지우지 않았다(되돌릴 근거). 앞으로 한 가게만 다시 그리면 여기에 slug: '-v9' 식으로 올린다.
  // [놀쿨26-3 · 대표님 2026-10-04 04:02] 답십리미라클나이트 광고 해지 — 3줄 판(가게 이름 / 광고문의 / 카톡 besta12)을 새 이름으로.
  //   옛 판(-v3 · -v5 · -v8)은 해지한 닉네임·번호가 그려져 있어 파일을 지웠다(git 기록에 남음 · sha1 은 scripts/forbidden-images.json).
  dapsimnimiraclenight: '-v9',
  // [놀쿨44-1 · 대표님 2026-10-11 18:09] 일산룸 = 광고문의 — 3줄 판(일산룸 / 광고문의 / 카톡 besta12)을 새 이름으로(목록·자기 쪽 같은 판).
  //   일산명월관요정 = 3줄 판(-v11 · 가게 이름 / 광고문의 / 카톡 besta12 · 오른쪽 아래 배치) — [일산74-1 · 대표님 2026-11-11 13:2x] 일산 담당 광고 해지로 자기 쪽도 이 판(자기 쪽 4줄 판 -v10 은 public/og 에서 뺌 · sha1 은 scripts/forbidden-images.json). · [일산76-1 · 대표님 2026-11-13] 자기 쪽은 아래 PAGE_CARD 의 광고 카드(4줄)가 맡고, 이 3줄 판은 홈·목록에만 실린다.
  //   [일산74-1 · 2026-11-12] 기본 배치 3줄 판(-v9)은 다른 가게 3줄 카드 15장과 dHash 거리 7 이하라(AI 냄새 검사 「그림-닮은카드」) 배치를 바꾼 -v11 로 올렸다 — -v9 파일은 public/og 에 둔다(담당 줄·번호 없음 · 어느 쪽도 부르지 않음).
  //   옛 판(-v8 · 그 앞)은 옛 담당 줄·번호가 그려져 있다 — 어느 쪽도 부르지 않는다(sha1 은 scripts/forbidden-images.json · page-gate A5 가 막는다).
  //   [놀쿨70-1 · 2026-11-09] 그중 옛 일산룸 총책임자 번호가 그려진 판(일산룸·일산명월관요정 -v6 · -v8)은 「어디에도 0」(대표님 2026-10-04 04:35)이라 public/og 에서 뺐다(_to_delete · git 기록).
  ilsanroom: '-v10',
  ilsanmyeongwolgwanyojeong: '-v11',
  // [놀쿨70-1 · 2026-11-09] 울산챔피언나이트·부평키스나이트 담당 광고 해지(2026-10-25 · 전체57-1 ④) — 3줄 판(가게 이름 / 광고문의 / 카톡 besta12)을 새 이름으로.
  //   옛 판(울산 -v3 · -v5 · -v8 · 판 없는 jpg·svg · 부평 -v5 · -v8)은 해지한 담당 줄이 그려져 있어 public/og 에서 뺐다(_to_delete · git 기록 · sha1 은 scripts/forbidden-images.json).
  ulsanchampionnight: '-v9',
  bupyeongkissnight: '-v9',
};

/** 2026-08-22 전 업소 "가게이름" 1:1 og 썸네일 전환(generate-og-name11.mjs).
 *  수동 합성본(OG_FILE_VER 등록 2곳)만 -v2 유지, 나머지 전 슬러그 -v3 파일 참조. */
export const OG_DEFAULT_VER = '-v8'; // [놀쿨12-2] 새 판 카드

export const heroVer = (slug) => HERO_FILE_VER[slug] || '';
export const ogVer = (slug) => OG_FILE_VER[slug] || OG_DEFAULT_VER;

/** [놀쿨86-1 · 2026-11-22] 업종 6장 og 카드(clubs · nights · rooms · lounges · yojeong · hoppa)의 파일 이름 판 — 한 곳.
 *  빌드 서버에서 넣은 글꼴이 안 먹어 획이 깨지던 판(판 없는 이름)을 글꼴 파일로 다시 그리며 올렸다(엣지 30일 · 같은 이름이면 옛 그림).
 *  쓰는 곳: scripts/gen-category-og.mjs(그림) · scripts/prerender-seo.mjs(og:image) · scripts/og-asset-gate.mjs · scripts/gate-bypass-audit.mjs
 *  다시 그리면 '-v3' 으로 올린다. 옛 판 파일은 지우지 않는다(이미 퍼진 공유 주소). */
export const CAT_OG_VER = '-v2';
export const catOgFile = (slug) => `${slug}${CAT_OG_VER}`;

/** [놀쿨12-2 · 13:18-6·7] 화면의 가게 그림 = 표준 카드(가게 이름이 가장 크게)의 webp 축소판(빌드가 dist/og/<이름>-w600.webp 로 만든다).
 *  가게 사진(/venues/*)은 사진 판정표(docs/NOLCOOL12_사진판정_2026-09-27.md) 여섯 가지를 모두 넘은 것만 쓰는데 지금 0장이라 전부 카드다. */
export const cardSrc = (slug) => `/og/${slug}${ogVer(slug)}-w600.webp`;

/** [놀쿨26-1 · 대표님 2026-10-04 03:43] 놀쿨 전용 명단(src/data/advertisers.nolcool.json · 따봉)의 4줄 카드 — 명단에 적힌 쪽에서만 쓴다.
 *  가게 쪽: 자기 쪽의 og:image·첫 그림만 이 판(-v9 · 가게이름 / 닉네임 / 번호 / 광고문의 카톡 besta12). 목록·검색 같은 다른 쪽은 ogVer(3줄 판) 그대로.
 *  매거진 쪽: og:image 만 MAGAZINE_OG 의 파일(public/og/<값>.jpg). 그림은 scripts/generate-og-name11.mjs 가 그린다.
 *  (2026-11-11 구글72-1: 부산 나이트 매거진 두 쪽은 대표님 말씀으로 광고문의 카드가 됐다 — 아래 PAGE_CARD · 이 명단의 4줄 카드는 가게 쪽 둘뿐) */
export const OG_OWN_PAGE_VER = {
  busanmulnight: '-v9',
  busanyeonsandongmulnight: '-v9',
  // [놀쿨33-1 · 대표님 2026-10-06 17:01] 신림그랑프리나이트 광고주 쌍코피 — 자기 쪽만 4줄 판(-v9) · 목록은 -v8(3줄) 그대로
  sinlimgrandprixnight: '-v9',
  // [일산74-1 · 대표님 2026-11-11 13:2x] 일산명월관요정 줄을 뺐다(일산 담당 광고 해지) — 자기 쪽도 목록과 같은 3줄 판(-v11 · 광고문의) · [일산76-1 · 대표님 2026-11-13] 다시 광고주 — 자기 쪽 카드는 아래 PAGE_CARD(광고 카드 · 쪽으로 묶음)라 이 표에는 넣지 않는다
};
export const ogOwnVer = (slug) => OG_OWN_PAGE_VER[slug] || ogVer(slug);
export const cardOwnSrc = (slug) => `/og/${slug}${ogOwnVer(slug)}-w600.webp`;
/** [놀쿨34-1 · G3] 가게 자기 쪽의 첫 그림 = og:image 와 같은 파일(1200×1200 jpg · 프리렌더 getVenueOgImage 와 같은 이름).
 *  구글이 「이 쪽의 큰 그림」으로 집는 주소가 og:image 와 하나가 되게 한다(축소판 webp 는 목록·검색 쪽에서만). */
export const cardOwnJpg = (slug) => `/og/${slug}${ogOwnVer(slug)}.jpg`;
/** [놀쿨34-1 · G3 · 속도] 같은 카드의 가벼운 판(webp · 가로 1200 — 빌드가 og jpg 에서 만든다 · scripts/prerender-seo.mjs buildOgWebp).
 *  <picture> 의 source 로만 쓴다(<img src> 는 og:image 와 같은 jpg 그대로). 프리렌더 첫 화면과 같은 이름이라 React 가 다시 그려도 새로 받지 않는다. */
export const cardOwnLight = (slug) => `/og/${slug}${ogOwnVer(slug)}-w1200.webp`;
export const MAGAZINE_OG = {
  // 'busan-night-guide' · 'busan-nightlife-roundup' — 2026-11-11 구글72-1 에서 광고문의 카드로 바뀜(아래 PAGE_CARD · 옛 4줄 그림 magazine-busan-night-guide-v1 · magazine-busan-nightlife-roundup-v1 은 public/og 에서 뺌)
  // [놀쿨33-1] 신림그랑프리나이트 문단이 있는 매거진 1쪽
  'seoul-southwest-night-guide': 'magazine-seoul-southwest-night-guide-v1',
};

/** [놀쿨44-1 · 대표님 2026-10-11 18:09 → 일산74-1 · 대표님 2026-11-11 13:2x → 일산76-1 · 대표님 2026-11-13 13:30 · 13:48] 쪽 카드 — 제목(title · og:title · h1)에 「일산명월관」·「일산요정」·「일산룸」이 든 쪽과 일산 지역 쪽 = 광고 카드(kind 'ad' · 4줄 · 명단의 닉네임 줄 + 새 번호). 2026-11-12 부터 이 고침 전까지는 광고문의 카드(kind 'inquiry')였다.
 *  kind 'ad'(4줄)는 놀쿨 명단에 적힌 광고주의 쪽뿐이다. 일산 가게 쪽 둘도 이 표의 광고 카드가 맡고(자기 쪽), 홈·목록에 실리는 두 가게 카드는 위 OG_FILE_VER 의 3줄 판 그대로다.
 *  쪽마다 다른 파일(public/og/<file>.jpg · 1200×1200 · scripts/generate-og-name11.mjs 가 그린다). 프리렌더(writePage)가 이 표 하나로 og:image · twitter:image · 첫 그림 · 본문 카드를 넣는다.
 *  kind 'ad' 인 쪽은 놀쿨 명단(src/data/advertisers.nolcool.json)에 적힌 쪽이어야 한다 — scripts/page-gate.mjs 가 본다. 열쇠 = 풀어 쓴(한글) 경로 + 끝 빗금. */
//  hue = 바탕 색조(0~359). 같은 글자의 카드가 여러 쪽에 쓰이므로 쪽마다 그림이 달라야 한다(같은 그림 재사용 0). 색조를 파일 이름 해시에만 맡기면
//  가까운 값끼리 겹친다 — 10-11 실측: 가게 쪽(13) · 매거진(14) 카드가 바이트까지 같은 그림이 됐다 → 세 장은 색조를 적어 새 이름(-v11)으로 다시 그렸다.
//  (/og/* 는 30일 캐시라 같은 이름에 다른 그림을 넣지 않는다 · 앞서 올라간 -v10 · -v11 카드는 담당 닉네임·번호가 그려진 그림이라 [일산74-1] 에서 public/og 에서 뺐다)
export const PAGE_CARD = {
  // [일산76-1 · 대표님 2026-11-13 13:30 · 13:48] 일산룸 · 일산명월관 · 일산요정 쪽 = 다시 광고주(새 번호 · 명단 src/data/advertisers.nolcool.json 두 줄) — 일산 쪽 열두 곳 = 광고 카드(4줄 · kind 'ad').
  //   가게 쪽 둘(일산명월관요정 · 일산룸)도 이 표가 맡는다(홈·목록의 두 가게 카드는 위 OG_FILE_VER 의 3줄 판 그대로 — 홈·목록은 일산 쪽이 아니다).
  //   닉네임 줄: 일산룸 쪽 여섯(제목에 「일산룸」 다섯 + 세 가게가 섞인 일산 지역 쪽) = 명단 「일산룸」 줄 · 일산명월관·일산요정 쪽 여섯 = 명단 「일산명월관요정」 줄. 카드 첫 줄 = 그 줄의 가게 이름.
  //   새 파일 이름(*-chief-card-v1 · /og/* 30일 캐시 — 2026-11-11 까지의 옛 4줄 카드 · 2026-11-12 의 광고문의 카드와 다른 이름) · 같은 글자 카드는 배치(variant)·색조를 쪽마다 달리
  //   (2026-11-13 실측: 새 열두 장끼리 dHash 거리 17 이상 · public/og 의 그림 전부와 17 이상 — 닮음 잣대는 10 이하). google: true = 구글69-1 과 같은 길 · altFull = 카드에 그려진 글자를 alt 에 다 적음.
  //   2026-11-12 의 광고문의 카드 열 장(*-inquiry-card-v1)은 public/og 에 그대로 둔다(번호 없음 · 부르는 쪽 0 · 이미 퍼진 주소가 404 로 바뀌지 않게).
  '/yojeong/ilsan/ilsanmyeongwolgwanyojeong/': { file: 'ilsanmyeongwolgwanyojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 40, google: true, altFull: true, variant: 'right-low' },
  '/yojeong/ilsan/': { file: 'yojeong-ilsan-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 100, google: true, altFull: true },
  '/guide/ilsan-yojeong/': { file: 'guide-ilsan-yojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 160, google: true, altFull: true, variant: 'right' },
  '/magazine/ilsan-myeongwolgwan-guide/': { file: 'magazine-ilsan-myeongwolgwan-guide-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 220, google: true, altFull: true, variant: 'left-low' },
  '/region/일산/yojeong/': { file: 'region-ilsan-yojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 280, google: true, altFull: true, variant: 'small' },
  '/tag/일산요정/': { file: 'tag-ilsan-yojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 340, google: true, altFull: true, variant: 'small-low' },
  '/rooms/ilsan/ilsanroom/': { file: 'ilsanroom-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 10, google: true, altFull: true, variant: 'left' },
  '/region/일산/': { file: 'region-ilsan-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 70, google: true, altFull: true, variant: 'small-mid' },
  '/region/일산/rooms/': { file: 'region-ilsan-rooms-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 130, google: true, altFull: true, variant: 'right' },
  '/rooms/ilsan/': { file: 'rooms-ilsan-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 190, google: true, altFull: true, variant: 'left-low' },
  '/magazine/ilsan-room-guide/': { file: 'magazine-ilsan-room-guide-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 250, google: true, altFull: true, variant: 'small' },
  '/tag/일산룸/': { file: 'tag-ilsan-room-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 310, google: true, altFull: true, variant: 'mid' },
  // [놀쿨85-1 · 대표님 2026-11-15 12:58 「요정하고 일산룸하고 명월관들어간페이지에는 광고주 신실장 썸네일이미지하고 번호 넣으라고」] 요정 · 일산룸이 주제인 쪽 열다섯 — 명단 두 줄의 untitledPages(제목에 가게 이름이 없어도 광고 카드 쪽).
  //   요정 여덟(요정 모음 · 새 요정 · 요정 인기 · 요정 라운지 · 일산명월관요정 한 곳만 실린 태그 넷) = 「일산명월관요정」 줄 · 룸 일곱(룸 모음 · 새 룸 · 룸 인기 · 마두역 도보권 · 일산룸 한 곳만 실린 태그 셋) = 「일산룸」 줄.
  //   같은 글자 카드가 열 장을 넘어 배치 낱말을 둘 더함(scripts/generate-og-name11.mjs 'one' · 'top') · 2026-11-15 실측: 새 열다섯 장끼리 dHash 거리 17 이상 · public/og 의 그림 536장 전부와 17 이상(닮음 잣대 10 이하).
  '/yojeong/': { file: 'yojeong-hub-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 195, google: true, altFull: true, variant: 'one' },
  '/new/yojeong/': { file: 'new-yojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 0, google: true, altFull: true, variant: 'left-top' },
  '/best/yojeong/': { file: 'best-yojeong-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 255, google: true, altFull: true, variant: 'mid' },
  '/lounge/yojung/': { file: 'lounge-yojung-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 135, google: true, altFull: true, variant: 'one-low' },
  '/tag/국악/': { file: 'tag-gugak-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 15, google: true, altFull: true, variant: 'small-mid' },
  '/tag/비즈니스접대/': { file: 'tag-business-entertain-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 240, google: true, altFull: true, variant: 'one-mid' },
  '/tag/프라이빗룸/': { file: 'tag-private-room-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 75, google: true, altFull: true, variant: 'right-top' },
  '/tag/한정식/': { file: 'tag-hanjeongsik-chief-card-v1', kind: 'ad', shop: '일산명월관요정', hue: 315, google: true, altFull: true, variant: 'low' },
  '/rooms/': { file: 'rooms-hub-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 345, google: true, altFull: true, variant: 'right-top' },
  '/new/rooms/': { file: 'new-rooms-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 210, google: true, altFull: true, variant: 'left-top' },
  '/best/rooms/': { file: 'best-rooms-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 105, google: true, altFull: true, variant: 'left-split-low' },
  '/near/마두/': { file: 'near-madu-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 150, google: true, altFull: true, variant: 'left-top-split' },
  '/tag/VIP/': { file: 'tag-vip-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 270, google: true, altFull: true, variant: 'right-split-low' },
  '/tag/비즈니스/': { file: 'tag-business-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 45, google: true, altFull: true, variant: 'small-split' },
  '/tag/프라이빗/': { file: 'tag-private-chief-card-v1', kind: 'ad', shop: '일산룸', hue: 30, google: true, altFull: true, variant: 'left-split' },
  // [놀쿨61-1 · 대표님 2026-10-25 16:1x·17:5x] 제목에 「장안동호빠」가 든 쪽 4 = 장안동호빠 큐브(유현재 실장 010-7674-8310) 광고 카드 — 큐브 자기 쪽은 놀쿨에 없고,
  //   빵빵·플렉스는 다른 가게의 쪽이라 가게 담당 칸이 아니라 여기(쪽 카드)로 넣는다(가게 쪽도 PAGE_CARD 가 있으면 첫 그림·og:image = 이 카드 · VenueHero). 색조는 넷 다 적어 서로 다른 그림.
  //   [구글69-1 · 2026-11-07 · 대표님 00:23 「사진을 구글정식문서에 맞게 전부다 넣어」] google: true = 구글 이미지 공식 문서대로 더 넣는 쪽(scripts/prerender-seo.mjs withPageCard):
  //   alt 「<가게> 안내 카드」(그려진 것만 · 번호 0) · 본문 카드 loading="eager" · og:image alt 같은 글자 · JSON-LD image(광고주 쪽만 telephone) · 사이트맵 <image:image>. 표시 없는 쪽은 글자 변화 0.
  '/hoppa/jangandonghoppa-bbangbbang/': { file: 'hoppa-jangandonghoppa-bbangbbang-cube-v1', kind: 'ad', shop: '장안동호빠 큐브', hue: 20, google: true },
  '/hoppa/jangandong-hoppa-flex/': { file: 'hoppa-jangandong-hoppa-flex-cube-v1', kind: 'ad', shop: '장안동호빠 큐브', hue: 205, google: true, variant: 'low' },
  '/region/장안동/hoppa/': { file: 'region-jangandong-hoppa-cube-v1', kind: 'ad', shop: '장안동호빠 큐브', hue: 290, google: true, variant: 'split' },
  '/tag/장안동호빠/': { file: 'tag-jangandong-hoppa-cube-v1', kind: 'ad', shop: '장안동호빠 큐브', hue: 340, google: true, variant: 'left' },
  // [구글69-1 · 대표님 2026-11-07 00:23 「건대호빠 광고주는 유현재실장 010 7674 8310」] 제목에 「건대호빠」가 든 쪽 3 = 건대호빠(유현재 실장 · 큐브와 같은 번호 · 명단 src/data/advertisers.nolcool.json) 광고 카드 · 색조 셋 다 적어 서로 다른 그림
  '/hoppa/geondaehoppa-w/': { file: 'geondae-hoppa-card-v1', kind: 'ad', shop: '건대호빠', hue: 80, google: true },
  '/region/건대/hoppa/': { file: 'region-geondae-hoppa-card-v1', kind: 'ad', shop: '건대호빠', hue: 130, google: true, variant: 'low' }, // [구글69-1] variant = 같은 글자 카드 묶음(장안동 4 · 건대 3 · 광고문의 3)의 지각해시(dHash) 거리를 벌리는 배치(generate-og-name11 · 색조만 달라선 거리 1~8 · 기본=위 가운데 · low=아래로 · mid=세로 가운데 · split=줄 나눔 · small=0.7배 · left/right=왼쪽/오른쪽 맞춤 · -로 조합)
  '/tag/건대호빠/': { file: 'tag-geondae-hoppa-card-v1', kind: 'ad', shop: '건대호빠', hue: 250, google: true, variant: 'right-low' }, // split(두 줄 · 위 가운데)은 보통 가게 카드와 거리 8 → right-low
  // [구글69-1 · 대표님 2026-11-07 00:23 「강남호빠 광고문의 · 해운대호빠 광고문의 · 부산호빠 광고문의」] 지역 허브 3 = 광고문의 카드(3줄 · 번호 0 · 카톡 besta12 는 카드·본문 카드에만)
  '/region/강남/hoppa/': { file: 'region-gangnam-hoppa-inquiry-card-v1', kind: 'inquiry', shop: '강남호빠', hue: 5, google: true, variant: 'left' },
  '/region/부산 해운대/hoppa/': { file: 'region-busan-haeundae-hoppa-inquiry-card-v1', kind: 'inquiry', shop: '해운대호빠', hue: 190, google: true, variant: 'right' }, // split 은 보통 가게 카드와 거리 10 → right
  '/region/부산/hoppa/': { file: 'region-busan-hoppa-inquiry-card-v1', kind: 'inquiry', shop: '부산호빠', hue: 310, google: true, variant: 'low' },
  // [구글72-1 · 대표님 2026-11-11 08:38 「이거두개 페이지에서 부산물나이트 따봉 전화번호 삭제하고 광고문의 카톡 besta12 로 넣어」] 부산 나이트 매거진 두 쪽 = 광고문의 카드(3줄 · 번호 0)
  //   첫 줄 = 그 쪽 주제(제목에 든 글자 그대로) · 옛 4줄 카드와 다른 새 이름(같은 이름에 다른 그림 0 — /og/* 30일 캐시) · 색조·배치를 달리 적어 서로 다른 그림
  '/magazine/busan-night-guide/': { file: 'magazine-busan-night-guide-inquiry-card-v1', kind: 'inquiry', shop: '부산 나이트 3곳', hue: 45, google: true, variant: 'mid' },
  '/magazine/busan-nightlife-roundup/': { file: 'magazine-busan-nightlife-roundup-inquiry-card-v1', kind: 'inquiry', shop: '부산 나이트라이프 총정리', hue: 235, google: true, variant: 'left-low' },
  // [나머지86-1 · 대표님 2026-11-22 01:00 · 02:01 · 07:25 「놀쿨사이트 먼저 대전원나이트 광고주 … 썸네일이미지하고 번호 넣으라고」] 제목에 「대전원나이트」·「대전나이트」가 든 쪽 넷 + 대전 지역 모음 쪽 = 대전원나이트 광고 카드(4줄 · 명단 src/data/advertisers.nolcool.json 「대전원나이트」 줄)
  //   가게 쪽(/nights/daejeononenight/)도 이 표가 맡는다(첫 그림 · og:image = 이 카드 · 목록에 실리는 가게 카드는 위 OG_FILE_VER 의 3줄 판 그대로) · 새 파일 이름(*-call-card-v1 · /og/* 30일 캐시) · 색조·배치는 다섯 장 다 적어 서로 다른 그림
  '/nights/daejeononenight/': { file: 'daejeononenight-call-card-v1', kind: 'ad', shop: '대전원나이트', hue: 22, google: true, altFull: true, variant: 'left-top' },
  '/magazine/daejeon-night-guide/': { file: 'magazine-daejeon-night-guide-call-card-v1', kind: 'ad', shop: '대전원나이트', hue: 165, google: true, altFull: true, variant: 'left' },
  '/region/대전/nights/': { file: 'region-daejeon-nights-call-card-v1', kind: 'ad', shop: '대전원나이트', hue: 330, google: true, altFull: true, variant: 'right-top' },
  '/tag/대전나이트/': { file: 'tag-daejeon-night-call-card-v1', kind: 'ad', shop: '대전원나이트', hue: 100, google: true, altFull: true, variant: 'one-mid' },
  '/region/대전/': { file: 'region-daejeon-call-card-v1', kind: 'ad', shop: '대전원나이트', hue: 225, google: true, altFull: true, variant: 'left-split-low' },
};
/** [일산76-1 · 대표님 2026-11-13 13:48] 광고주 이름 줄 한 곳 — 「<가게><sep><닉네임>」. 닉네임 줄이 가게 이름으로 시작하면(「일산룸 총책임자 …」) 가게 이름을 두 번 적지 않고 닉네임 줄만 적는다.
 *  카드 그림 설명(아래 pageCardAlt · sep 빈칸)과 프리렌더 카드 블록의 이름 줄(sep 가운뎃점)이 같이 쓴다 — 닉네임이 가게 이름으로 시작하지 않는 다른 광고주는 옛 글자 그대로 */
export const adNameLine = (ad, sep = ' ') => (String(ad.nickname).startsWith(ad.shop) ? ad.nickname : `${ad.shop}${sep}${ad.nickname}`);
/** [놀쿨70-1] 쪽 카드 그림 설명(alt) 한 곳 — 프리렌더(withPageCard)와 화면(VenueDetailPage → VenueHero)이 같이 쓴다.
 *  altFull 인 쪽 = 「<이름 줄 — 위 adNameLine> <번호> 안내 카드」(카드에 그려진 가게 이름·닉네임 줄·번호) · 그 밖 = 옛 글자 「<가게> 안내 카드」 그대로 */
export const pageCardAlt = (pc, ad) => (pc && pc.altFull && ad ? `${adNameLine(ad)} ${ad.phone} 안내 카드` : `${pc ? pc.shop : ''} 안내 카드`);
/** [놀쿨61-1] 쪽 카드 그림 주소 — 가게 쪽이 PAGE_CARD 에 있으면 첫 그림(VenueHero)도 이 파일(프리렌더 withPageCard 의 og:image 와 같은 파일) */
export const pageCardJpg = (file) => `/og/${file}.jpg`;
export const pageCardLight = (file) => `/og/${file}-w1200.webp`;
/** 경로(인코딩돼 있어도 됨 · 끝 빗금 없어도 됨) → 표의 열쇠 꼴 */
export const pageKey = (route) => { let r = String(route || ''); try { r = decodeURIComponent(r); } catch { /* 풀 수 없는 글자는 그대로 */ } return r === '/' ? '/' : r.replace(/\/*$/, '/'); };
export const pageCardOf = (route) => PAGE_CARD[pageKey(route)] || null;
