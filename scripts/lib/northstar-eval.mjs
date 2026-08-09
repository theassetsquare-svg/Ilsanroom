/**
 * 놀쿨 북극성 판정 로직 (순수 함수 — I/O·인증·발송 없음, 100% 단위테스트 가능).
 * 파트5/5: 계기판 사다리 · "한국 유흥정보 1위" 판정 상수 · 마일스톤(교차 발생시만).
 *
 * 기준선 출처 = reports/audit/2026-08-korea1.md [3] D1 (파트1 실측, 2026-08-08~09):
 *   비브랜드 상위쿼리 845(브랜드 0) 중 1페이지(평균순위≤10) 진입 363쿼리=43% · TOP3 62쿼리 ·
 *   6업종 전부 1페이지 진입 존재(나이트187·클럽73·룸3·요정9·호빠1·라운지2) · phone_click 6회.
 *   ⚠️ 어떤 수치도 창작 아님. 라이브 산출은 northstar-dashboard.mjs가 GA4/GSC 실측으로 대체.
 */

/** 파트1 실측 기준선 (계기판 첫 스냅샷 시드 + 사다리 시작점). */
export const PART1_BASELINE = {
  week: '2026-W32',
  source: 'part1-baseline(reports/audit/2026-08-korea1.md)',
  members: null,              // ⚠️ 08-09 가짜 UGC 정리 후 실회원 수 = 라이브 산출 필요(확정 전 null)
  pagesPerVisit: 2.65,        // PV 4,906 ÷ 세션 1,848
  readEndRate: 12.9,          // 완독률(%) — 파트1 정의 기준선
  dwellSec: 97,               // 세션 평균 체류(초)
  revisitPct: 10.6,           // 재방문 세션 비중(%) — 세션 189/1,848
  phoneClick: 6,              // phone_click 실적(회)
  sharePct: 43,               // 비브랜드 1페이지 진입 점유율(%) = 363/845
  top3Queries: 62,            // TOP3 진입 쿼리 수
  totalQueries: 845,
  categoryPage1: { night: 187, club: 73, room: 3, yojeong: 9, hoppa: 1, lounge: 2 }, // 업종별 1페이지 진입 쿼리
};

/** "한국 유흥정보 1위" 판정 상수 (파트1 정의 명문화). 4주 연속 유지 시 달성. */
export const KOREA1_CRITERIA = {
  page1SharePct: 70,   // 비브랜드 핵심 키워드군 1페이지 점유율 ≥70%
  top3Queries: 200,    // TOP3 진입 쿼리 ≥200개
  allSixCategories: true, // 6업종 전 카테고리 1페이지 진입 존재
  sustainedWeeks: 4,   // 위 3조건 4주 연속 유지
};

const SIX = ['night', 'club', 'room', 'yojeong', 'hoppa', 'lounge'];
const SIX_KO = { night: '나이트', club: '클럽', room: '룸', yojeong: '요정', hoppa: '호빠', lounge: '라운지' };

/** 사다리(현재 단계 → 다음 계단) 정의 — 파트5 프롬프트 계단. */
export const LADDERS = {
  pagesPerVisit: { label: '방문당 페이지', unit: '', steps: [2.65, 3.1, 4, 6, 10] },
  readEndRate: { label: '완독률', unit: '%', steps: [12.9, 30, 50] },
  dwellSec: { label: '평균 체류', unit: '초', steps: [97, 180, 300, 600] },
  revisitPct: { label: '재방문 비중', unit: '%', steps: [10.6, 15, 25] },
  sharePct: { label: '1페이지 점유율', unit: '%', steps: [43, 50, 60, 70] },
};

/** 현재값이 놓인 계단과 다음 목표 계단을 반환. */
export function ladderPosition(key, current) {
  const L = LADDERS[key];
  if (!L) return null;
  const steps = L.steps;
  let stage = 0;
  for (let i = 0; i < steps.length; i++) if (current >= steps[i]) stage = i;
  const next = stage < steps.length - 1 ? steps[stage + 1] : null;
  const gap = next == null ? 0 : +(next - current).toFixed(2);
  return { label: L.label, unit: L.unit, current, stage, stageValue: steps[stage], next, gap, steps, atTop: next == null };
}

/** 계기판 사다리 대비표 전체(계산된 지표 → 각 계단 위치). */
export function ladderTable(m) {
  return Object.keys(LADDERS)
    .filter(k => m[k] != null)
    .map(k => ladderPosition(k, m[k]));
}

/** 6업종 전 카테고리 1페이지 진입 여부 + 결측/미점유 목록. */
export function sixCategoryStatus(categoryPage1 = {}) {
  const missing = SIX.filter(c => !(Number(categoryPage1[c]) > 0));
  return { pass: missing.length === 0, missing: missing.map(c => SIX_KO[c]), counts: categoryPage1 };
}

/** "한국 1위" 3조건 판정(단주). sustained 는 별도(연속 주 카운트). */
export function evaluateKorea1(m) {
  const share = { value: m.sharePct, target: KOREA1_CRITERIA.page1SharePct, pass: m.sharePct >= KOREA1_CRITERIA.page1SharePct };
  const top3 = { value: m.top3Queries, target: KOREA1_CRITERIA.top3Queries, pass: m.top3Queries >= KOREA1_CRITERIA.top3Queries };
  const six = sixCategoryStatus(m.categoryPage1);
  const conditionsMet = share.pass && top3.pass && six.pass;
  return {
    share, top3, six,
    conditionsMet,
    // 4주 연속은 이력에서 산출 — streakWeeks 주입 시 최종 판정
    achieved: (streakWeeks) => conditionsMet && Number(streakWeeks) >= KOREA1_CRITERIA.sustainedWeeks,
  };
}

/** 마일스톤 정의 — 값이 임계선을 "이번에 처음 넘겼을 때만" 발화(교차 기반). */
export const MILESTONES = [
  { key: 'share50', label: '검색 1페이지 점유율 50% 돌파', field: 'sharePct', threshold: 50 },
  { key: 'share60', label: '검색 1페이지 점유율 60% 돌파', field: 'sharePct', threshold: 60 },
  { key: 'top3_100', label: 'TOP3 진입 쿼리 100개 돌파', field: 'top3Queries', threshold: 100 },
  { key: 'members100', label: '회원 100명 돌파', field: 'members', threshold: 100 },
  { key: 'members1000', label: '회원 1,000명 돌파', field: 'members', threshold: 1000 },
  { key: 'members10000', label: '회원 10,000명 돌파', field: 'members', threshold: 10000 },
];

/**
 * 직전 스냅샷(prev) 대비 이번(cur)에 "새로 넘긴" 마일스톤만 반환(교차 기반).
 * → 이미 넘긴 임계선은 소급 발화 안 함(첫 실행/기존 초과분 스팸 0). prev 없으면 [] (기준선만 기록).
 */
export function crossedMilestones(prev, cur) {
  if (!prev) return [];
  return MILESTONES.filter(ms => {
    const p = prev[ms.field], c = cur[ms.field];
    return p != null && c != null && p < ms.threshold && c >= ms.threshold;
  });
}

/** 마일스톤 현재 상태(리포트/드라이런용): 도달/미도달 + 소급불발 표시. */
export function milestoneStatus(cur) {
  return MILESTONES.map(ms => {
    const v = cur[ms.field];
    const reached = v != null && v >= ms.threshold;
    return { ...ms, current: v, reached };
  });
}
