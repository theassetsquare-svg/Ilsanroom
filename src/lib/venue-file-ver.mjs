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
  // [놀쿨26-3 · 대표님 2026-10-04 04:02] 답십리미라클나이트 광고 해지 — 3줄 판(가게 이름 / 광고문의 / 카톡 besta12)을 새 이름으로.
  //   옛 판(-v3 · -v5 · -v8)은 해지한 닉네임·번호가 그려져 있어 파일을 지웠다(git 기록에 남음 · sha1 은 scripts/forbidden-images.json).
  dapsimnimiraclenight: '-v9',
  // [놀쿨44-1 · 대표님 2026-10-11 18:09] 일산룸 = 광고문의 — 3줄 판(일산룸 / 광고문의 / 카톡 besta12)을 새 이름으로(목록·자기 쪽 같은 판).
  //   일산명월관요정 = 신실장 광고주(쪽 한정) — 목록·검색 같은 다른 쪽에 쓰는 3줄 판을 새 이름(-v9)으로 · 자기 쪽 4줄 판은 아래 OG_OWN_PAGE_VER(-v10).
  //   옛 판(-v8 · 그 앞)은 옛 담당 줄·번호가 그려져 있다 — 파일은 그대로 두고(주소 404 0) 어느 쪽도 부르지 않는다(sha1 은 scripts/forbidden-images.json · page-gate A5 가 막는다).
  ilsanroom: '-v10',
  ilsanmyeongwolgwanyojeong: '-v9',
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
  // [놀쿨33-1 · 대표님 2026-10-06 17:01] 신림그랑프리나이트 광고주 쌍코피 — 자기 쪽만 4줄 판(-v9) · 목록은 -v8(3줄) 그대로
  sinlimgrandprixnight: '-v9',
  // [놀쿨44-1 · 대표님 2026-10-11 18:09] 일산명월관요정 광고주 신실장 — 자기 쪽만 4줄 판(-v10) · 목록은 -v9(3줄)
  ilsanmyeongwolgwanyojeong: '-v10',
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
  'busan-night-guide': 'magazine-busan-night-guide-v1',
  'busan-nightlife-roundup': 'magazine-busan-nightlife-roundup-v1',
  // [놀쿨33-1] 신림그랑프리나이트 문단이 있는 매거진 1쪽
  'seoul-southwest-night-guide': 'magazine-seoul-southwest-night-guide-v1',
};

/** [놀쿨44-1 · 대표님 2026-10-11 18:09] 쪽 카드 — 제목(title · og:title · h1)에 「일산명월관」·「일산요정」이 든 쪽 = 신실장 광고 카드(kind 'ad' · 4줄),
 *  「일산룸」이 든 쪽 = 광고문의 카드(kind 'inquiry' · 3줄 · 번호 0). 가게 쪽 둘은 위 OG_OWN_PAGE_VER · OG_FILE_VER 가 맡고, 여기는 그 밖의 쪽(안내·매거진·지역·태그·목록)이다.
 *  쪽마다 다른 파일(public/og/<file>.jpg · 1200×1200 · scripts/generate-og-name11.mjs 가 그린다). 프리렌더(writePage)가 이 표 하나로 og:image · twitter:image · 첫 그림 · 본문 카드를 넣는다.
 *  kind 'ad' 인 쪽은 놀쿨 명단(src/data/advertisers.nolcool.json)에 적힌 쪽이어야 한다 — scripts/page-gate.mjs 가 본다. 열쇠 = 풀어 쓴(한글) 경로 + 끝 빗금. */
//  hue = 바탕 색조(0~359). 같은 글자의 카드가 여러 쪽에 쓰이므로 쪽마다 그림이 달라야 한다(같은 그림 재사용 0). 색조를 파일 이름 해시에만 맡기면
//  가까운 값끼리 겹친다 — 10-11 실측: 가게 쪽(13) · 매거진(14) 카드가 바이트까지 같은 그림이 됐다 → 세 장은 색조를 적어 새 이름(-v11)으로 다시 그렸다.
//  (/og/* 는 30일 캐시라 같은 이름에 다른 그림을 넣지 않는다 · 앞서 올라간 -v10 세 장은 지우지 않았다 — 주소 404 0 · 부르는 쪽 0)
export const PAGE_CARD = {
  '/guide/ilsan-yojeong/': { file: 'guide-ilsan-yojeong-v10', kind: 'ad', shop: '일산명월관요정' },
  '/magazine/ilsan-myeongwolgwan-guide/': { file: 'magazine-ilsan-myeongwolgwan-guide-v11', kind: 'ad', shop: '일산명월관요정', hue: 110 },
  '/region/일산/yojeong/': { file: 'region-ilsan-yojeong-v11', kind: 'ad', shop: '일산명월관요정', hue: 160 },
  '/tag/일산요정/': { file: 'tag-ilsan-yojeong-v10', kind: 'ad', shop: '일산명월관요정' },
  '/yojeong/ilsan/': { file: 'yojeong-ilsan-v11', kind: 'ad', shop: '일산명월관요정', hue: 60 },
  '/magazine/ilsan-room-guide/': { file: 'magazine-ilsan-room-guide-v10', kind: 'inquiry', shop: '일산룸' },
  '/region/일산/rooms/': { file: 'region-ilsan-rooms-v10', kind: 'inquiry', shop: '일산룸' },
  '/rooms/ilsan/': { file: 'rooms-ilsan-v10', kind: 'inquiry', shop: '일산룸' },
  '/tag/일산룸/': { file: 'tag-ilsan-room-v10', kind: 'inquiry', shop: '일산룸' },
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
  // [놀쿨70-1 · 대표님 2026-11-07 19:53 · 11-08 22:0x] 일산룸 가게 쪽 · 일산 지역 쪽 = 일산룸 광고주 카드(신실장 · 명단 「일산룸」 줄 · 쪽으로만 묶음 — 제목에 「일산룸」이 든 다른 쪽 넷은 위 광고문의 카드 그대로)
  //   google: true(구글69-1 과 같은 길) · altFull = 그림 설명에 가게 이름·닉네임 줄·번호까지(지시서 1-2 · 카드에 그려진 글자 그대로) · 색조·배치를 달리해 두 장이 서로 다른 그림
  '/rooms/ilsan/ilsanroom/': { file: 'ilsanroom-sinsiljang-card-v1', kind: 'ad', shop: '일산룸', hue: 35, google: true, altFull: true, variant: 'mid' }, // 기본 배치는 옛 일산룸 카드(ilsanroom-v8)와 dHash 거리 7 → mid(세로 가운데 · 글자 크기 그대로) = 가장 가까운 카드와 거리 20(11-08 실측)
  '/region/일산/': { file: 'region-ilsan-sinsiljang-card-v1', kind: 'ad', shop: '일산룸', hue: 265, google: true, altFull: true, variant: 'low' },
};
/** [놀쿨70-1] 쪽 카드 그림 설명(alt) 한 곳 — 프리렌더(withPageCard)와 화면(VenueDetailPage → VenueHero)이 같이 쓴다.
 *  altFull 인 쪽 = 「<가게> <닉네임> <번호> 안내 카드」(카드에 그려진 글자 그대로) · 그 밖 = 옛 글자 「<가게> 안내 카드」 그대로 */
export const pageCardAlt = (pc, ad) => (pc && pc.altFull && ad ? `${ad.shop} ${ad.nickname} ${ad.phone} 안내 카드` : `${pc ? pc.shop : ''} 안내 카드`);
/** [놀쿨61-1] 쪽 카드 그림 주소 — 가게 쪽이 PAGE_CARD 에 있으면 첫 그림(VenueHero)도 이 파일(프리렌더 withPageCard 의 og:image 와 같은 파일) */
export const pageCardJpg = (file) => `/og/${file}.jpg`;
export const pageCardLight = (file) => `/og/${file}-w1200.webp`;
/** 경로(인코딩돼 있어도 됨 · 끝 빗금 없어도 됨) → 표의 열쇠 꼴 */
export const pageKey = (route) => { let r = String(route || ''); try { r = decodeURIComponent(r); } catch { /* 풀 수 없는 글자는 그대로 */ } return r === '/' ? '/' : r.replace(/\/*$/, '/'); };
export const pageCardOf = (route) => PAGE_CARD[pageKey(route)] || null;
