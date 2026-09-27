/**
 * [놀쿨12-2 · 대표님 13:18-1·2·4] 목록의 지역 2단 · 추천 정렬 · 「광고」 표시 · 같은 가게 한 번 — 한 자리.
 * 클라이언트(src/components/venue/VenueListClient.tsx 등)와 프리렌더(scripts/prerender-seo.mjs)가 같이 쓴다
 * → 두 곳의 순서·칩 숫자가 어긋나지 않는다(venue-file-ver.mjs 와 같은 방식).
 *
 * - 지역: 가게 주소(verified — 가게 장부·인허가 공개 자료로 채운 값)에서 시·도 / 시·군·구를 뽑는다. 이름으로 짐작 0.
 *   주소가 없는 가게는 「지역 확인 중」.
 * - 추천순: ① 광고(광고주 명단 = naver-watch data/advertisers.json 11명 · 놀쿨에서는 staffPhone 이 그 번호인 가게 · 「광고」 표시)
 *           ② 인기 엔진 순위(src/data/popularity-scores.json ranked=true 점수순 · 실측값만) ③ 순위 없는 곳 가나다.
 * - 같은 가게 두 쪽: sameAs 가 있는 쪽은 목록·숫자에서 빠진다(쪽 주소는 그대로 · 본 쪽으로 링크).
 */

/** 일산룸·일산명월관 두 가게 쪽에만 두는 총책임자 번호(광고주 명단 밖 · 대표님 규칙 R12) — 광고 블록에 넣지 않는다 */
export const ILSAN_CHIEF_PHONE = '010-4117-5556';

const digits = (s) => String(s || '').replace(/\D/g, '');

/** 광고주 가게인가 — 명단 번호가 붙은 가게(일산 총책임자 제외) */
export function isAdVenue(v) {
  return !!(v && v.staffPhone && digits(v.staffPhone) !== digits(ILSAN_CHIEF_PHONE));
}

/** 목록·숫자에 드는가 — 영업 확인 + 같은 가게 둘째 쪽 아님 */
export function isListed(v) {
  return !!v && v.status !== 'closed_or_unclear' && !v.sameAs;
}

const SIDO = {
  서울: '서울', 서울특별시: '서울', 서울시: '서울',
  부산: '부산', 부산광역시: '부산', 대구: '대구', 대구광역시: '대구', 인천: '인천', 인천광역시: '인천',
  광주: '광주', 광주광역시: '광주', 대전: '대전', 대전광역시: '대전', 울산: '울산', 울산광역시: '울산',
  세종: '세종', 세종특별자치시: '세종',
  경기: '경기', 경기도: '경기', 강원: '강원', 강원도: '강원', 강원특별자치도: '강원',
  충북: '충북', 충청북도: '충북', 충남: '충남', 충청남도: '충남',
  전북: '전북', 전라북도: '전북', 전북특별자치도: '전북', 전남: '전남', 전라남도: '전남',
  경북: '경북', 경상북도: '경북', 경남: '경남', 경상남도: '경남',
  제주: '제주', 제주도: '제주', 제주특별자치도: '제주',
};
const METRO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산']);

/** 시·도 차례(네이버 지도 지역 목록과 같은 흔한 차례) */
export const SIDO_ORDER = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

/**
 * 주소 → { sido, sgg } · 시·도를 못 찾으면 null(「지역 확인 중」).
 * 광역시·특별시는 구·군, 도는 시·군(고양시 일산동구 → 고양시). 구·군을 못 찾으면 sgg = null.
 */
export function adminArea(address) {
  const t = String(address || '').replace(/\([^)]*\)/g, ' ').split(/[\s,]+/).filter(Boolean);
  if (!t.length) return null;
  const si = t.findIndex((x) => SIDO[x]);
  if (si < 0) return null;
  const sido = SIDO[t[si]];
  let sgg = null;
  if (METRO.has(sido)) {
    sgg = t.find((x, i) => i !== si && /^[가-힣]{1,4}(구|군)$/.test(x)) || null;
  } else if (sido === '세종') {
    sgg = null;
  } else {
    sgg = t.find((x, i) => i !== si && /^[가-힣]{1,4}(시|군)$/.test(x) && !SIDO[x]) || null;
  }
  return { sido, sgg };
}

/** 가게 → 지역 열쇠 · 라벨 · 매개변수 값(?region=서울 · ?region=서울-강남구 · ?region=확인중) */
export const UNKNOWN_REGION = '확인중';
export function regionOf(v) {
  const a = adminArea(v && v.address);
  if (!a) return { sido: null, sgg: null, label: '지역 확인 중', key: UNKNOWN_REGION };
  return { sido: a.sido, sgg: a.sgg, label: a.sgg ? `${a.sido} ${a.sgg}` : a.sido, key: a.sgg ? `${a.sido}-${a.sgg}` : a.sido };
}

/** 매개변수 값이 이 가게에 맞나(시·도 값이면 그 시·도 전부) */
export function inRegionKey(v, key) {
  if (!key || key === 'all') return true;
  const r = regionOf(v);
  if (key === UNKNOWN_REGION) return r.key === UNKNOWN_REGION;
  if (!r.sido) return false;
  return key === r.sido || key === `${r.sido}-${r.sgg}`;
}

/**
 * 목록 → 2단 칩 자료. 숫자는 목록에서 센다(칩 숫자 = 목록 수).
 * 반환: { total, sidos: [{ key, label, count, sggs: [{ key, label, count }] }], unknown }
 */
export function regionTree(list) {
  const by = new Map();
  let unknown = 0;
  for (const v of list) {
    const r = regionOf(v);
    if (!r.sido) { unknown++; continue; }
    if (!by.has(r.sido)) by.set(r.sido, { key: r.sido, label: r.sido, count: 0, sub: new Map(), noSgg: 0 });
    const s = by.get(r.sido);
    s.count++;
    if (r.sgg) s.sub.set(r.sgg, (s.sub.get(r.sgg) || 0) + 1);
    else s.noSgg++;
  }
  const order = (k) => { const i = SIDO_ORDER.indexOf(k); return i < 0 ? 99 : i; };
  const sidos = [...by.values()]
    .sort((a, b) => order(a.key) - order(b.key))
    .map((s) => ({
      key: s.key, label: s.label, count: s.count,
      sggs: [...s.sub.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko')).map(([g, n]) => ({ key: `${s.key}-${g}`, label: g, count: n })),
      noSgg: s.noSgg,
    }));
  return { total: list.length, sidos, unknown };
}

/** 정렬 칩(같은 주소의 ?sort= 만 바뀐다) */
export const SORT_KEYS = ['rec', 'pop', 'name', 'new'];
export const SORT_LABELS = { rec: '추천', pop: '인기', name: '가나다', new: '새로 입점' };

const byName = (a, b) => String(a.nameKo || '').localeCompare(String(b.nameKo || ''), 'ko');
const idNum = (v) => Number(String(v.id || '').replace(/\D/g, '')) || 0;

/** 인기 엔진 점수 표(popularity-scores.json 의 venues) → 순위가 있는 가게의 점수 */
export function popScoreOf(pop, slug) {
  const e = pop && pop[slug];
  return e && e.ranked ? Number(e.score) || 0 : 0;
}

/**
 * 정렬.
 *  rec  = 광고(인기 점수순 → 가나다) → 인기 순위(점수순) → 순위 없는 곳 가나다
 *  pop  = 인기 순위(점수순) → 순위 없는 곳 가나다 (광고도 같은 잣대 · 「광고」 표시는 그대로)
 *  name = 가나다
 *  new  = 등록 차례 거꾸로(가장 나중에 들어온 가게 먼저)
 */
export function sortVenues(list, mode, pop) {
  const arr = [...list];
  const byPop = (a, b) => popScoreOf(pop, b.slug) - popScoreOf(pop, a.slug) || byName(a, b);
  if (mode === 'name') return arr.sort(byName);
  if (mode === 'new') return arr.sort((a, b) => idNum(b) - idNum(a) || byName(a, b));
  if (mode === 'pop') return arr.sort(byPop);
  const ads = arr.filter(isAdVenue).sort(byPop);
  const rest = arr.filter((v) => !isAdVenue(v));
  const ranked = rest.filter((v) => popScoreOf(pop, v.slug) > 0).sort(byPop);
  const others = rest.filter((v) => popScoreOf(pop, v.slug) <= 0).sort(byName);
  return [...ads, ...ranked, ...others];
}
