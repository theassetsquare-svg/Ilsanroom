#!/usr/bin/env node
/**
 * 놀쿨 GA4 정체불명 트래픽 출처 프로브 (★100% 읽기전용 — 사이트/설정/DB 변경 0).
 *
 * 문제①: 채널 Unassigned·랜딩 (unknown)/(not set) 세션이 100% 이탈·0 참여로 이탈률 오염.
 * GA Data API GET 만으로 그 덩어리를 source/medium·host·browser·device·이벤트·streamId 로
 * 분해해 근본원인(봇 / config타이밍 page_view누락 / staging호스트 / UTM유실)을 가른다.
 * 가짜 이벤트 주입·전송 0. 콘솔 출력만(메일 X).
 *
 * 인증: GH Secret GSC_SA_JSON. workflow_dispatch.
 */
import { getGaToken, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';

const RANGE = { startDate: '28daysAgo', endDate: 'today' };
const pct = (n) => `${(Number(n) * 100).toFixed(1)}%`;
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);
const v = (row, i) => row.dimensionValues?.[i]?.value ?? '';
const m = (row, i) => Number(row.metricValues?.[i]?.value ?? 0);

const chFilter = (group) => ({ filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { value: group } } });
const landUnknown = { orGroup: { expressions: [
  { filter: { fieldName: 'landingPage', stringFilter: { value: '(unknown)' } } },
  { filter: { fieldName: 'landingPage', stringFilter: { value: '(not set)' } } },
] } };

async function q(token, { dims, mets, filter, order = 0, limit = 25 }) {
  const r = await runReport(token, {
    dateRanges: [RANGE],
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    ...(filter ? { dimensionFilter: filter } : {}),
    orderBys: [{ metric: { metricName: mets[order] }, desc: true }],
    limit,
  });
  if (!r.ok) { console.log(`   (쿼리 실패 ${r.status}: ${JSON.stringify(r.body).slice(0, 160)})`); return null; }
  return r.body.rows || [];
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY} · 28일 · 100% 읽기전용\n`);

  // 1) Unassigned 채널 → source / medium
  console.log('═══ ① Unassigned 채널의 source / medium ═══');
  let rows = await q(token, { dims: ['sessionSource', 'sessionMedium'], mets: ['sessions', 'bounceRate', 'eventCount'], filter: chFilter('Unassigned'), limit: 20 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0) + ' / ' + v(x, 1), 40)} 세션 ${padL(m(x, 0), 4)} · 이탈 ${padL(pct(m(x, 1)), 6)} · 이벤트 ${padL(m(x, 2), 5)}`);

  // 2) Unassigned 채널 → host / browser / device
  console.log('\n═══ ② Unassigned 채널의 host · browser · device ═══');
  rows = await q(token, { dims: ['hostName', 'browser', 'deviceCategory'], mets: ['sessions', 'bounceRate'], filter: chFilter('Unassigned'), limit: 25 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0), 24)} ${pad(v(x, 1), 16)} ${pad(v(x, 2), 8)} 세션 ${padL(m(x, 0), 4)} · 이탈 ${padL(pct(m(x, 1)), 6)}`);

  // 3) (unknown)/(not set) 랜딩 세션이 실제로 발생시킨 이벤트 — page_view 있나?
  console.log('\n═══ ③ (unknown)/(not set) 랜딩 세션의 이벤트 구성 (page_view 유무 = 핵심) ═══');
  rows = await q(token, { dims: ['eventName'], mets: ['eventCount'], filter: landUnknown, limit: 30 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0), 32)} ${padL(m(x, 0), 6)}`);

  // 4) (unknown)/(not set) 랜딩 → source / browser / host
  console.log('\n═══ ④ (unknown)/(not set) 랜딩의 source · browser · host ═══');
  rows = await q(token, { dims: ['sessionSource', 'browser', 'hostName'], mets: ['sessions', 'bounceRate'], filter: landUnknown, limit: 25 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0), 22)} ${pad(v(x, 1), 16)} ${pad(v(x, 2), 22)} 세션 ${padL(m(x, 0), 4)} · 이탈 ${padL(pct(m(x, 1)), 6)}`);

  // 5) 전체 hostName — production(nolcool.com) 외 staging/pages.dev/localhost 섞였나
  console.log('\n═══ ⑤ 전체 hostName 분포 (production 외 호스트 = 오염 의심) ═══');
  rows = await q(token, { dims: ['hostName'], mets: ['sessions', 'bounceRate', 'engagementRate'], limit: 15 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0), 30)} 세션 ${padL(m(x, 0), 5)} · 이탈 ${padL(pct(m(x, 1)), 6)} · 참여 ${padL(pct(m(x, 2)), 6)}`);

  // 6) 전체 browser — Headless/구버전/봇 시그널
  console.log('\n═══ ⑥ 전체 browser 분포 (Headless/봇 시그널) ═══');
  rows = await q(token, { dims: ['browser'], mets: ['sessions', 'bounceRate', 'engagementRate'], limit: 15 });
  if (rows) for (const x of rows) console.log(`${pad(v(x, 0), 24)} 세션 ${padL(m(x, 0), 5)} · 이탈 ${padL(pct(m(x, 1)), 6)} · 참여 ${padL(pct(m(x, 2)), 6)}`);

  // 7) streamId — 다중 스트림(다른 사이트/앱)이 같은 속성에 섞였나
  console.log('\n═══ ⑦ streamId 분포 ═══');
  rows = await q(token, { dims: ['streamId'], mets: ['sessions', 'bounceRate'], limit: 10 });
  if (rows) for (const x of rows) console.log(`stream ${pad(v(x, 0), 14)} 세션 ${padL(m(x, 0), 5)} · 이탈 ${padL(pct(m(x, 1)), 6)}`);

  console.log('\n※ 전부 GA Data API 실측. 가짜 이벤트 0. 진단 전용(콘솔), 사이트 무변경.');
}
main().catch((e) => { console.error('probe error:', e.message); process.exit(1); });
