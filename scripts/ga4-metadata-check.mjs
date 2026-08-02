#!/usr/bin/env node
/**
 * GA4 지표명 자기검증 (★100% 읽기전용 — properties.getMetadata GET 1회, 변경 0).
 *
 * 월간 성장 사이클 v3 규칙: 수집 전 이 속성(540830544)의 실제 사용 가능
 * 지표·차원 목록을 받아 v3 46계열이 쓰는 이름과 대조 — 이름 추측 금지,
 * 스키마에 없는 이름은 ⚠️로 보고서에 표기한다.
 * 인증: GH Secret GSC_SA_JSON. workflow_dispatch 수동.
 */
import { getGaToken, gaErrorReason, GA_PROPERTY, GA_QUOTA_PROJECT } from './lib/ga-auth.mjs';

// v3 46계열이 덤프 스크립트에서 실제 사용하는 이름 (계열번호 주석)
const V3_METRICS = [
  'screenPageViews', 'sessions', 'totalUsers', 'newUsers',            // ①⑤
  'averageSessionDuration', 'userEngagementDuration',                 // ②
  'bounceRate', 'engagementRate',                                     // ③⑯
  'screenPageViewsPerSession',                                        // ④⑪
  'cohortActiveUsers',                                                // ⑦⑧⑨
  'activeUsers', 'eventCount',                                        // ⑩⑰⑱
  'engagedSessions', 'sessionsPerUser',                               // ㉑
  'dauPerMau', 'wauPerMau',                                           // ㉒
];
const V3_DIMENSIONS = [
  'pagePath', 'landingPage', 'landingPagePlusQueryString',            // ①⑪
  'sessionSource', 'sessionMedium', 'sessionDefaultChannelGroup',     // ⑥
  'pageReferrer', 'newVsReturning',                                   // ⑥⑤
  'hour', 'dateHour', 'city', 'deviceCategory', 'browser',            // ⑬⑭⑮
  'eventName', 'searchTerm',                                          // ⑰⑱⑳
  'firstUserSource', 'cohort', 'cohortNthWeek',                       // ⑲⑦⑧⑨
];
// v3가 요구하지만 GA4 Data API에 개념 자체가 없(을 수 있)는 것 — 대체 경로 명시용
const V3_WANTED_MISSING_OK = ['exitPage' /* ⑫ 종료페이지: GA4 미제공이면 exit 이벤트(page_events)로 대체 중 */];

const token = await getGaToken();
const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${GA_PROPERTY}/metadata`, {
  // quota project 헤더 필수 — 없으면 SA 자체 프로젝트(API 비활성)로 귀속돼 403
  headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': GA_QUOTA_PROJECT },
});
const body = await res.json();
if (!res.ok) {
  console.log(`❌ getMetadata ${res.status} — ${gaErrorReason(res.status, body)}`);
  process.exit(1);
}
const apiMetrics = new Set((body.metrics || []).map((m) => m.apiName));
const apiDims = new Set((body.dimensions || []).map((d) => d.apiName));
console.log(`✅ getMetadata OK — 속성 ${GA_PROPERTY}: 지표 ${apiMetrics.size}개 · 차원 ${apiDims.size}개 (커스텀 포함)`);

let bad = 0;
for (const [label, wanted, have] of [
  ['지표', V3_METRICS, apiMetrics],
  ['차원', V3_DIMENSIONS, apiDims],
]) {
  const missing = wanted.filter((n) => !have.has(n));
  console.log(`\n[${label}] v3 사용 ${wanted.length}개 중 스키마 일치 ${wanted.length - missing.length}개`);
  if (missing.length) { bad += missing.length; missing.forEach((n) => console.log(`  ⚠️ 스키마에 없음: ${n}`)); }
}
for (const n of V3_WANTED_MISSING_OK) {
  console.log(`\n[확인] ${n}: ${apiDims.has(n) || apiMetrics.has(n) ? '✅ 존재(대체 불필요)' : '⚠️ GA4 미제공 확정 — page_events exit로 대체 유지'}`);
}
// 커스텀 디멘션 존재 여부(㉓ 회원 상태) — 있으면 이름 나열
const custom = (body.dimensions || []).filter((d) => d.apiName.startsWith('customEvent:') || d.apiName.startsWith('customUser:'));
console.log(`\n[커스텀 차원] ${custom.length}개${custom.length ? ' — ' + custom.map((d) => d.apiName).join(', ') : ' (㉓ 회원 분해 ⚠️ 그대로)'}`);
console.log(`\n결과: ${bad === 0 ? '✅ v3 지표명 전부 실스키마 일치' : `⚠️ 불일치 ${bad}건 — 위 이름 교정 필요`}`);
