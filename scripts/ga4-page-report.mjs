#!/usr/bin/env node
/**
 * 놀쿨 GA4 전 페이지 현황 덤프 (★100% 읽기전용 — 메일·사이트·DB 변경 0).
 *
 * 대표님 "지금 GA4 모든 페이지 어떻게 돼있는지 브리핑" 요청용 온디맨드 진단.
 * GA Data API 로 GET/runReport 만 호출 → 콘솔에 표로 출력(메일 발송 없음).
 * 가짜 이벤트 주입·전송 0 (정직 불변식 CLAUDE.md #0).
 *
 * 출력: ① 사이트 합계(7일/28일) ② 페이지별 행동지표 표 ③ 끝까지읽기(scroll_100)
 *       ④ 랜딩페이지 이탈 ⑤ 유입 채널 ⑥ 기기. 모두 실측, 창작 0.
 * 인증: GH Secret GSC_SA_JSON. workflow_dispatch 수동.
 */
import { getGaToken, gaErrorReason, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';

const pct = (n) => `${(Number(n) * 100).toFixed(1)}%`;
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);

async function agg(token, start, end) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' },
      { name: 'screenPageViews' }, { name: 'screenPageViewsPerSession' },
      { name: 'bounceRate' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' },
    ],
  });
  if (!r.ok) return null;
  const m = r.body.rows?.[0]?.metricValues || [];
  return {
    sessions: Number(m[0]?.value || 0), users: Number(m[1]?.value || 0), newUsers: Number(m[2]?.value || 0),
    views: Number(m[3]?.value || 0), vps: Number(m[4]?.value || 0),
    bounce: Number(m[5]?.value || 0), engage: Number(m[6]?.value || 0), dwell: Number(m[7]?.value || 0),
  };
}

async function pages(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'bounceRate' },
      { name: 'engagementRate' }, { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  return (r.body?.rows || []).map((x) => ({
    path: x.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(x.metricValues?.[0]?.value || 0),
    views: Number(x.metricValues?.[1]?.value || 0),
    bounce: Number(x.metricValues?.[2]?.value || 0),
    engage: Number(x.metricValues?.[3]?.value || 0),
    dwell: Number(x.metricValues?.[4]?.value || 0),
  }));
}

async function scroll100(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'scroll_100' } } },
    limit: 1000,
  });
  const map = new Map();
  for (const x of r.body?.rows || []) map.set(x.dimensionValues?.[0]?.value || '', Number(x.metricValues?.[0]?.value || 0));
  return map;
}

async function landing(token) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25,
  });
  return (r.body?.rows || []).map((x) => ({
    path: x.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(x.metricValues?.[0]?.value || 0),
    bounce: Number(x.metricValues?.[1]?.value || 0),
    engage: Number(x.metricValues?.[2]?.value || 0),
  }));
}

async function dim1(token, dimName) {
  const r = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: dimName }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 12,
  });
  return (r.body?.rows || []).map((x) => ({
    key: x.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(x.metricValues?.[0]?.value || 0),
    bounce: Number(x.metricValues?.[1]?.value || 0),
    engage: Number(x.metricValues?.[2]?.value || 0),
  }));
}

function printAgg(label, a) {
  if (!a) { console.log(`${label}: 읽기 실패`); return; }
  console.log(`${label}  세션 ${a.sessions} · 사용자 ${a.users}(신규 ${a.newUsers}) · 페이지뷰 ${a.views} · 페이지/세션 ${a.vps.toFixed(2)}`);
  console.log(`${' '.repeat(label.length)}  이탈 ${pct(a.bounce)} · 참여 ${pct(a.engage)} · 평균체류 ${a.dwell.toFixed(0)}초`);
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY} · 100% 읽기전용(변경 0)\n`);

  const a7 = await agg(token, '7daysAgo', 'today');
  const a28 = await agg(token, '28daysAgo', 'today');
  if (!a7 && !a28) { console.error(`❌ runReport 실패 — ${gaErrorReason(0, {})}`); process.exit(2); }
  console.log('═══ 사이트 합계 ═══');
  printAgg('【7일 】', a7);
  printAgg('【28일】', a28);

  const [rows, sc, land, ch, dev] = await Promise.all([
    pages(token), scroll100(token), landing(token), dim1(token, 'sessionDefaultChannelGroup'), dim1(token, 'deviceCategory'),
  ]);

  console.log('\n═══ 페이지별 행동지표 (28일, 세션순 상위 40) ═══');
  console.log(`${pad('경로', 38)} ${padL('세션', 5)} ${padL('PV', 5)} ${padL('이탈', 6)} ${padL('참여', 6)} ${padL('체류s', 6)} ${padL('끝까지', 7)}`);
  for (const p of rows.slice(0, 40)) {
    const reach = p.views > 0 ? Math.min(1, (sc.get(p.path) || 0) / p.views) : 0;
    console.log(`${pad(p.path, 38)} ${padL(p.sessions, 5)} ${padL(p.views, 5)} ${padL(pct(p.bounce), 6)} ${padL(pct(p.engage), 6)} ${padL(p.dwell.toFixed(0), 6)} ${padL(pct(reach), 7)}`);
  }
  console.log(`… 총 ${rows.length}개 경로`);

  console.log('\n═══ 랜딩페이지 이탈 (28일, 세션순 상위 25 — 첫인상 이탈 진단) ═══');
  for (const p of land) console.log(`${pad(p.path, 44)} 세션 ${padL(p.sessions, 5)} · 이탈 ${padL(pct(p.bounce), 6)} · 참여 ${padL(pct(p.engage), 6)}`);

  console.log('\n═══ 유입 채널 (28일) ═══');
  for (const c of ch) console.log(`${pad(c.key, 22)} 세션 ${padL(c.sessions, 5)} · 이탈 ${padL(pct(c.bounce), 6)} · 참여 ${padL(pct(c.engage), 6)}`);

  console.log('\n═══ 기기 (28일) ═══');
  for (const d of dev) console.log(`${pad(d.key, 12)} 세션 ${padL(d.sessions, 5)} · 이탈 ${padL(pct(d.bounce), 6)} · 참여 ${padL(pct(d.engage), 6)}`);

  console.log('\n※ 전부 GA Data API 실측. 가짜 이벤트 주입·전송 0. 메일 미발송(온디맨드 콘솔 덤프).');
}
main().catch((e) => { console.error('page-report error:', e.message); process.exit(1); });
