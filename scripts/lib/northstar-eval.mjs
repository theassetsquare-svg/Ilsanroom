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

/** [놀쿨16-1] 방문당 쪽 수 목표 — 한 곳. 대표님 2026-09-27 05:05 「들어오면 30페이지 이상 보고 갈 때까지」(옛 10 → 30). 측정만 · 조작 0. */
export const PAGES_PER_VISIT_GOAL = 30;

/** 사다리(현재 단계 → 다음 계단) 정의 — 파트5 프롬프트 계단. */
export const LADDERS = {
  pagesPerVisit: { label: '방문당 페이지', unit: '', steps: [2.65, 3.1, 4, 6, 10, PAGES_PER_VISIT_GOAL] },
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

/**
 * [놀쿨16-2] 3곳(GSC · GA4 · Clarity) 전 쪽 기준표 — 한 곳. 대표님 2026-09-27 05:20 「3개 사이트 API 로 사이트 문제점 전부 수정 · 매달 말일 자동화」.
 * 숫자는 새로 만든 것이 아니라 이미 쓰던 자리에서 옮겨 모은 것(출처 주석). 월간 감사가 이 표로 전 쪽을 판정해 [PAGE_DIAG_B64] 한 줄로 남기고,
 * 월간 개선 루틴(말일 08:1x)은 그 줄의 code 이름 그대로 고친다. 측정·판정만 — 조작 0.
 */
export const PAGE_CRITERIA = {
  gsc: { ctrMinImp: 50, ctrMaxPos: 10, ctrLow: 0.02, farPos: 20 },            // monthly-full-audit CTR 기회(노출≥50·CTR<2%) · 20위밖
  ga: { minSessions: 3, bounceHigh: 0.70, dwellShort: 30, scrollLow: 0.35, engageLow: 0.40 }, // ga-optimizer 처방 임계
  clarity: { minPage: 10, clickSessions: 3, quickbackSessions: 5, quickbackPct: 0.30, scriptSessions: 2, scriptMinPage: 5, excessiveSessions: 5 }, // clarity-daily-watch 착시 컷
  cwv: { perfGoal: 90, lcpMs: 2500, cls: 0.1, tbtMs: 200 },                   // lighthouse-daily 목표 90 · CLAUDE.md CWV(LCP<2.5s·CLS<0.1) · INP 대신 실험실 TBT
};

/** 기준표 항목 이름(code) → 무엇이 문제인가 · 고칠 것(놀쿨 규칙 안: 주소 변경 0 · 창작 0 · 사실만). */
export const PAGE_CODES = {
  'GSC-IDX': ['색인 안 됨(URL 검사 verdict≠PASS)', '같은 주소에서 내용·내부 링크·사이트맵·색인 요청(주소 변경 0)'],
  'GSC-NOINDEX-SITEMAP': ['noindex 쪽이 사이트맵에 있음', '사이트맵에서 빼거나 noindex 를 뗀다(쪽 성격대로 하나만)'],
  'GSC-ZERO': ['28일 노출 0', '내부 링크·제목·구조화 데이터'],
  'GSC-CTR': ['1쪽(≤10위)인데 CTR<2%(노출≥50)', '사실 후킹 제목·설명(제목 고유성 검사 통과)'],
  'GSC-FAR': ['평균 순위 20위 밖', '내부 링크·본문 구조(가게 자기 사실만)'],
  'GA-BOUNCE': ['이탈 70% 이상', '첫 화면 H1·도입·다음 길(11-4 부품)'],
  'GA-DWELL': ['평균 체류 30초 미만', '읽는 차례·소제목·다음 읽을 것'],
  'GA-SCROLL': ['끝까지 읽기(scroll_100/조회) 35% 미만', '완독 뼈대·짧은 단락(11-2 부품)'],
  'GA-ENGAGE': ['참여율 40% 미만(체류 30초 이상인데)', '본문 안 관련 쪽 연결·가입 진입(11-5 부품)'],
  'CL-RAGE': ['Clarity 분노 클릭(문제 세션≥3·쪽 세션≥10)', '실제 UI 원인(반응 없는 요소·겹침)'],
  'CL-DEAD': ['Clarity 죽은 클릭(문제 세션≥3·쪽 세션≥10)', '눌리는 것처럼 보이는데 안 눌리는 요소'],
  'CL-ERRCLICK': ['Clarity 오류 클릭(문제 세션≥3·쪽 세션≥10)', '누른 뒤 JS 오류 원인'],
  'CL-QUICKBACK': ['Clarity 빠른 되돌아감(문제 세션≥5·30% 이상)', '누른 곳과 도착 쪽 내용 맞추기'],
  'CL-SCRIPT': ['Clarity 스크립트 오류(문제 세션≥2·쪽 세션≥5)', 'JS 오류 코드 원인'],
  'CL-EXSCROLL': ['Clarity 지나친 스크롤(문제 세션≥5)', '찾는 것이 늦게 나옴 → 차례·앞자리'],
  'CWV-PERF': ['Lighthouse 성능 90 미만', '코드 원인(무거운 JS·그림)'],
  'CWV-LCP': ['LCP 2.5초 초과', '첫 그림·글자 늦음 → 코드 원인'],
  'CWV-CLS': ['CLS 0.1 초과', '자리 밀림 → 높이 확보'],
  'CWV-TBT': ['TBT 200ms 초과(INP 대신 실험실 값)', '긴 JS 작업 → 코드 원인'],
  'SITE-ORPHAN': ['다른 쪽에서 들어오는 내부 링크 0', '관련 허브·가게·매거진에서 링크'],
};

/**
 * 한 쪽 판정. 입력 칸이 없으면(null) 그 칸은 「데이터 없음」— 문제로 세지 않는다(모르는 것을 지어내지 않음).
 * p = { path, index?:{verdict,state}, noindex?:bool, inbound?:number, gsc?:{imp,clicks,ctr,pos}, ga?:{sessions,bounce,engage,dwell,scroll},
 *       clarity?:{pageSessions, rage, dead, errclick, quickback, script, excessive}, cwv?:{perf,lcpMs,cls,tbtMs} }
 */
export function judgePage(p) {
  const C = PAGE_CRITERIA, out = [];
  const add = (code, v) => out.push({ code, v });
  if (p.index && p.index.verdict !== 'PASS') add('GSC-IDX', p.index.state || p.index.verdict);
  if (p.noindex === true) add('GSC-NOINDEX-SITEMAP', 'noindex');
  if (p.gsc) {
    const g = p.gsc;
    if (g.imp === 0 && p.noindex !== true) add('GSC-ZERO', 0);
    if (g.imp >= C.gsc.ctrMinImp && g.pos <= C.gsc.ctrMaxPos && g.ctr < C.gsc.ctrLow) add('GSC-CTR', +(g.ctr * 100).toFixed(1));
    if (g.imp > 0 && g.pos > C.gsc.farPos) add('GSC-FAR', +g.pos.toFixed(1));
  }
  if (p.ga && p.ga.sessions >= C.ga.minSessions) {
    const a = p.ga;
    if (a.bounce >= C.ga.bounceHigh) add('GA-BOUNCE', Math.round(a.bounce * 100));
    if (a.dwell < C.ga.dwellShort) add('GA-DWELL', Math.round(a.dwell));
    if (a.scroll != null && a.scroll < C.ga.scrollLow) add('GA-SCROLL', Math.round(a.scroll * 100));
    if (a.engage < C.ga.engageLow && a.dwell >= C.ga.dwellShort) add('GA-ENGAGE', Math.round(a.engage * 100));
  }
  if (p.clarity) {
    const c = p.clarity, K = C.clarity, n = c.pageSessions || 0;
    if (n >= K.minPage && (c.rage || 0) >= K.clickSessions) add('CL-RAGE', c.rage);
    if (n >= K.minPage && (c.dead || 0) >= K.clickSessions) add('CL-DEAD', c.dead);
    if (n >= K.minPage && (c.errclick || 0) >= K.clickSessions) add('CL-ERRCLICK', c.errclick);
    if ((c.quickback || 0) >= K.quickbackSessions && n > 0 && c.quickback / n >= K.quickbackPct) add('CL-QUICKBACK', c.quickback);
    if (n >= K.scriptMinPage && (c.script || 0) >= K.scriptSessions) add('CL-SCRIPT', c.script);
    if ((c.excessive || 0) >= K.excessiveSessions) add('CL-EXSCROLL', c.excessive);
  }
  if (p.cwv) {
    const w = p.cwv, K = C.cwv;
    if (w.perf != null && w.perf < K.perfGoal) add('CWV-PERF', w.perf);
    if (w.lcpMs != null && w.lcpMs > K.lcpMs) add('CWV-LCP', w.lcpMs);
    if (w.cls != null && w.cls > K.cls) add('CWV-CLS', w.cls);
    if (w.tbtMs != null && w.tbtMs > K.tbtMs) add('CWV-TBT', w.tbtMs);
  }
  if (p.inbound === 0 && p.path !== '/') add('SITE-ORPHAN', 0);
  return out;
}

/** 사이트맵 전 쪽 판정 — 쪽 수는 사이트맵 쪽 수와 같다(빠짐 0). sources[칸] = Map(path → 값). */
export function diagnosePages(paths, sources = {}) {
  const get = (k, path) => (sources[k] && sources[k].has(path) ? sources[k].get(path) : null);
  return paths.map((path) => {
    const p = { path, index: get('index', path), noindex: get('noindex', path), inbound: get('inbound', path), gsc: get('gsc', path), ga: get('ga', path), clarity: get('clarity', path), cwv: get('cwv', path) };
    const problems = judgePage(p);
    const have = ['index', 'gsc', 'ga', 'clarity', 'cwv'].filter((k) => p[k] != null);
    return { path, have, problems };
  });
}
