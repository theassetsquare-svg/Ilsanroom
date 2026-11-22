/**
 * [놀쿨86-1 · 대표님 2026-11-22 18:26] 놀쿨 홈에 보이는 가게 그림 = 광고주 넉 줄 카드만 · 광고문의 석 줄 카드 0
 *   대표님 「놀쿨 홈화면에 있는 광고문의 썸네일이미지 보이지 않게 하고 광고주 썸네일이미지만 보이게 하라고 …
 *   놀쿨홈화면 보자마자 놀쿨은 사람들이 많이 이용하는구나 하고 보자마자 광고문의하게 만들라고」(01:00 · 02:01 에 이어 세 번째 말씀)
 *
 * 홈의 가게 그림은 이 파일 한 자리에서만 고른다.
 *  - HOME_AD_CARDS = 홈 「놀쿨 광고주」 진열장(가게 광고주 = 가게 자료의 담당 번호 · 놀쿨 명단 광고주 = src/data/advertisers.nolcool.json).
 *  - 카드 그림 = 그 가게 쪽이 싣는 넉 줄 카드 그대로(adCardFile):
 *      쪽 카드 표(PAGE_CARD)의 광고 카드 → 가게 자기 쪽 판(OG_OWN_PAGE_VER) → 가게 목록 카드(담당 번호가 있는 가게만 넉 줄).
 *  - homeCardImg(slug) = 홈 목록 칸(인기 · 신규 · 지역 · 이어 보기)에 실을 그림 — 진열장 가게만 · 그 밖은 null(업종 색 이름 칸).
 *  - listCardImg(slug) = 가게 광고주의 목록 카드(사이트 어디에 실어도 되는 판) — 최근 본 · 찜 줄이 홈에서 쓴다.
 *  명단 광고주의 카드는 원래 명단 쪽에서만 싣는다(page-gate AD_CARDS). 홈 진열장 하나만 대표님 말씀으로 예외 — 홈 글자(번호 · 닉네임)는 그대로 0.
 * 검사: scripts/page-gate.mjs 「홈 광고주 진열장」 — 광고주가 아닌 줄 · 목록 카드가 석 줄인 가게 · 그림 파일 없음 = 막음 / 빠진 광고주 = 품질.
 */
import { OG_OWN_PAGE_VER, ogOwnVer, ogVer, pageCardOf } from './venue-file-ver.mjs';

const CAT_PATH = { club: 'clubs', night: 'nights', lounge: 'lounges', room: 'rooms', yojeong: 'yojeong', hoppa: 'hoppa' };
export const CAT_KO = { club: '클럽', night: '나이트', lounge: '라운지', room: '룸', yojeong: '요정', hoppa: '호빠' };

/** 가게 쪽 주소(끝 빗금) — 클럽 · 룸 · 요정은 지역 칸이 들어간다(HomePage getCategoryHref 와 같은 꼴) */
export function venuePath(cat, slug, region) {
  if (cat === 'club' || cat === 'room' || cat === 'yojeong') return `/${CAT_PATH[cat]}/${region}/${slug}/`;
  return `/${CAT_PATH[cat] || cat}/${slug}/`;
}

/** 진열장 가게 — 가게 자료(src/data/venues.ts)의 slug · 이름 · 업종 · 지역 그대로. 차례 = 지역 묶음(날마다 시작 칸만 돈다) */
const ROWS = [
  { slug: 'ilsanmyeongwolgwanyojeong', shop: '일산명월관요정', cat: 'yojeong', region: 'ilsan', regionKo: '일산' },
  { slug: 'ilsanroom', shop: '일산룸', cat: 'room', region: 'ilsan', regionKo: '일산' },
  { slug: 'pajuyadangskydomenight', shop: '파주야당스카이돔나이트', cat: 'night', region: 'paju', regionKo: '파주' },
  { slug: 'bulgwangdonghobaknight', shop: '불광동호박나이트', cat: 'night', region: 'bulgwang', regionKo: '불광' },
  { slug: 'sinlimgrandprixnight', shop: '신림그랑프리나이트', cat: 'night', region: 'sinlim', regionKo: '신림' },
  { slug: 'cheongdamh2onight', shop: '청담H2O나이트', cat: 'night', region: 'cheongdam', regionKo: '청담' },
  { slug: 'jangandong-hoppa-flex', shop: '장안동호빠 큐브', cat: 'hoppa', region: 'jangandong', regionKo: '장안동' },
  { slug: 'geondaehoppa-w', shop: '건대호빠', cat: 'hoppa', region: 'geondae', regionKo: '건대' },
  { slug: 'seongnamshampoonight', shop: '성남샴푸나이트', cat: 'night', region: 'seongnam', regionKo: '성남' },
  { slug: 'suwonchancenight', shop: '수원찬스돔나이트', cat: 'night', region: 'suwon', regionKo: '수원' },
  { slug: 'daejeonsevennight', shop: '대전세븐나이트', cat: 'night', region: 'daejeon', regionKo: '대전' },
  { slug: 'daejeononenight', shop: '대전원나이트', cat: 'night', region: 'daejeon', regionKo: '대전' },
  { slug: 'busanasiadnight', shop: '부산아시아드나이트', cat: 'night', region: 'busan', regionKo: '부산' },
  { slug: 'busanmulnight', shop: '부산물나이트', cat: 'night', region: 'busan', regionKo: '부산' },
  { slug: 'changwon-lululalala', shop: '창원룰루랄라나이트', cat: 'night', region: 'changwon', regionKo: '창원' },
];

/** 그 가게 쪽이 싣는 광고 카드 파일 이름(확장자 없음) */
export function adCardFile(row) {
  const href = venuePath(row.cat, row.slug, row.region);
  const pc = pageCardOf(href);
  if (pc && pc.kind === 'ad') return pc.file;
  if (OG_OWN_PAGE_VER[row.slug]) return `${row.slug}${ogOwnVer(row.slug)}`;
  return `${row.slug}${ogVer(row.slug)}`;
}

const w600 = (file) => `/og/${file}-w600.webp`;

export const HOME_AD_CARDS = ROWS.map((r) => {
  const file = adCardFile(r);
  return { ...r, href: venuePath(r.cat, r.slug, r.region), file, img: w600(file), listCard: file === `${r.slug}${ogVer(r.slug)}` };
});

const BY_SLUG = new Map(HOME_AD_CARDS.map((c) => [c.slug, c]));

/** 홈 목록 칸 그림 — 진열장 가게만(넉 줄 카드) · 그 밖은 null */
export function homeCardImg(slug) {
  const c = BY_SLUG.get(slug);
  return c ? c.img : null;
}

/** 가게 광고주의 목록 카드(어느 쪽에 실어도 되는 판) — 명단 광고주(쪽에만 싣는 카드)는 null */
export function listCardImg(slug) {
  const c = BY_SLUG.get(slug);
  return c && c.listCard ? c.img : null;
}

/** 오늘(한국 날짜) 진열 차례 — 날마다 시작 칸이 한 칸씩 돈다(앞자리를 광고주가 고루 나눠 씀) */
export function homeAdCardsToday(now = new Date()) {
  const day = Math.floor((now.getTime() + 9 * 3600 * 1000) / 86400000);
  const n = HOME_AD_CARDS.length;
  if (!n) return [];
  const s = ((day % n) + n) % n;
  return [...HOME_AD_CARDS.slice(s), ...HOME_AD_CARDS.slice(0, s)];
}
