/**
 * 인기 점수 단일 소스 (한국1위 파트4 S1 — 순위 = 실측만).
 * 점수 산출·갱신은 scripts/popularity-engine.mjs(주 1회 GH Actions)만 한다.
 * 근거 JSON 공개본: /data/popularity.json (동일 내용).
 */
import raw from '@/data/popularity-scores.json';

export interface PopEntry {
  views: number;
  users: number;
  phoneClicks: number;
  gscClicks: number;
  score: number;
  /** 침묵 원칙 — 28일 조회수가 minViews28d 미만이면 false = 순위 부여 금지 */
  ranked: boolean;
}
interface PopData {
  generatedAt: string | null;
  windowDays: number;
  minViews28d: number;
  weights: Record<string, number>;
  venues: Record<string, PopEntry>;
}

export const popularity = raw as PopData;
export const POPULARITY_UPDATED_AT = popularity.generatedAt;

export function hasPopularityData(): boolean {
  return !!popularity.generatedAt && Object.keys(popularity.venues).length > 0;
}

export function popScore(slug: string): number {
  const e = popularity.venues[slug];
  return e && e.ranked ? e.score : 0;
}

export function isRanked(slug: string): boolean {
  return !!popularity.venues[slug]?.ranked;
}

/**
 * 실측 순위 분할 — ranked: 점수순(내림차), recent: 순위 미부여분 최신 등록순.
 * 입력 배열은 venues.ts 등록순이라는 전제(필터만 거친 배열은 순서 보존).
 */
export function splitByPopularity<T extends { slug: string }>(list: T[]): { ranked: T[]; recent: T[] } {
  const ranked = list
    .filter((v) => isRanked(v.slug))
    .sort((a, b) => popScore(b.slug) - popScore(a.slug));
  const rankedSet = new Set(ranked.map((v) => v.slug));
  const recent = list.filter((v) => !rankedSet.has(v.slug)).reverse();
  return { ranked, recent };
}

/** 실측 순위 우선 + 나머지 최신 등록순 단일 배열. */
export function popularityOrder<T extends { slug: string }>(list: T[]): T[] {
  const { ranked, recent } = splitByPopularity(list);
  return [...ranked, ...recent];
}
