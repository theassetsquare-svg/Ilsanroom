#!/usr/bin/env node
/**
 * 놀쿨 GA4 전 차원·전 지표 덤프 (★100% 읽기전용 — 메일·사이트·DB 변경 0).
 *
 * ga4-page-report.mjs(요약)의 후속. 대표님 "GA4 API로 뽑을 수 있는 전 데이터" 요청용.
 * GA Data API runReport(GET성 읽기)만 호출 → 콘솔 표 덤프. 가짜 이벤트 주입·전송 0.
 *
 * 커버: 인구(연령·성별·국가·도시·언어) · 기술(기기·OS·브라우저·모델·해상도) ·
 *       유입(source/medium·campaign·channel) · 유지(newVsReturning) ·
 *       시간(date·hour·요일) · 이벤트(eventName 전수) · 페이지(path·landing·title).
 * 인증: GH Secret GSC_SA_JSON(analytics.readonly). 속성 540830544 고정.
 * 각 호출은 독립 guard — 한 차원이 실패해도 나머지는 계속 덤프.
 */
import { getGaToken, gaErrorReason, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';

const DR = [{ startDate: '28daysAgo', endDate: 'today' }];
let token;

async function dump(label, dims, mets, opts = {}) {
  const body = {
    dateRanges: DR,
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    limit: opts.limit || 50,
  };
  if (opts.dimOrderAsc) body.orderBys = [{ dimension: { dimensionName: dims[0] }, desc: false }];
  else body.orderBys = [{ metric: { metricName: mets[0] }, desc: true }];
  const r = await runReport(token, body);
  console.log(`\n══════ ${label} ══════`);
  if (!r.ok) { console.log('  ⚠️ ' + gaErrorReason(r.status, r.body)); return; }
  const rows = r.body.rows || [];
  if (!rows.length) { console.log('  (데이터 없음 / 인구 임계값 미달)'); return; }
  console.log('  ' + [...dims, ...mets].join(' · '));
  for (const x of rows) {
    const dv = (x.dimensionValues || []).map((d) => d.value);
    const mv = (x.metricValues || []).map((m) => {
      const n = Number(m.value);
      return Number.isFinite(n) && n > 0 && n < 1 ? (n * 100).toFixed(1) + '%' : m.value;
    });
    console.log('  ' + [...dv, ...mv].join(' | '));
  }
  console.log(`  (행 ${rows.length})`);
}

async function main() {
  token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY} · 28일 · 100% 읽기전용(변경 0)`);

  const beh = ['sessions', 'activeUsers', 'engagementRate', 'bounceRate', 'averageSessionDuration'];

  console.log('\n░░░░░░░░ ① 인구(Demographics) ░░░░░░░░');
  await dump('연령 userAgeBracket', ['userAgeBracket'], beh, { limit: 20 });
  await dump('성별 userGender', ['userGender'], beh, { limit: 10 });
  await dump('국가 country', ['country'], beh, { limit: 20 });
  await dump('도시 city', ['city'], beh, { limit: 30 });
  await dump('언어 language', ['language'], beh, { limit: 15 });

  console.log('\n░░░░░░░░ ② 기술(Tech) ░░░░░░░░');
  await dump('기기 deviceCategory', ['deviceCategory'], beh, { limit: 10 });
  await dump('OS operatingSystemWithVersion', ['operatingSystemWithVersion'], beh, { limit: 20 });
  await dump('브라우저 browser', ['browser'], beh, { limit: 15 });
  await dump('기기모델 mobileDeviceModel', ['mobileDeviceModel'], beh, { limit: 25 });
  await dump('화면해상도 screenResolution', ['screenResolution'], beh, { limit: 25 });

  console.log('\n░░░░░░░░ ③ 유입(Acquisition) ░░░░░░░░');
  await dump('소스/매체 sessionSourceMedium', ['sessionSourceMedium'], beh, { limit: 30 });
  await dump('캠페인 sessionCampaignName', ['sessionCampaignName'], beh, { limit: 20 });
  await dump('채널 sessionDefaultChannelGroup', ['sessionDefaultChannelGroup'], beh, { limit: 15 });
  await dump('최초유입 firstUserSourceMedium', ['firstUserSourceMedium'], beh, { limit: 20 });

  console.log('\n░░░░░░░░ ④ 유지(Retention) ░░░░░░░░');
  await dump('신규vs재방문 newVsReturning', ['newVsReturning'],
    ['sessions', 'activeUsers', 'newUsers', 'engagementRate', 'averageSessionDuration'], { limit: 10 });

  console.log('\n░░░░░░░░ ⑤ 시간(Time) ░░░░░░░░');
  await dump('일자 date', ['date'],
    ['sessions', 'activeUsers', 'screenPageViews', 'engagementRate', 'averageSessionDuration'],
    { limit: 31, dimOrderAsc: true });
  await dump('시간대 hour', ['hour'], ['sessions', 'activeUsers', 'engagementRate'], { limit: 24, dimOrderAsc: true });
  await dump('요일 dayOfWeekName', ['dayOfWeekName'], ['sessions', 'activeUsers', 'engagementRate'], { limit: 7 });

  console.log('\n░░░░░░░░ ⑥ 이벤트(Events) 전수 ░░░░░░░░');
  await dump('이벤트명 eventName', ['eventName'], ['eventCount', 'totalUsers', 'eventCountPerUser'], { limit: 60 });
  // 핵심이벤트(conversions/keyEvents)는 메트릭명이 속성마다 달라 독립 guard
  await dump('핵심이벤트 keyEvents(있으면)', ['eventName'], ['keyEvents'], { limit: 30 });

  console.log('\n░░░░░░░░ ⑦ 페이지(Content) ░░░░░░░░');
  await dump('pagePath 전수', ['pagePath'],
    ['screenPageViews', 'sessions', 'bounceRate', 'engagementRate', 'averageSessionDuration', 'userEngagementDuration'],
    { limit: 1000 });
  await dump('landingPage', ['landingPage'], beh, { limit: 100 });
  await dump('pageTitle', ['pageTitle'], ['screenPageViews', 'sessions', 'engagementRate'], { limit: 60 });

  console.log('\n░░░░░░░░ ⑧ 사이트 합계(전 지표) ░░░░░░░░');
  const tot = await runReport(token, {
    dateRanges: DR,
    metrics: ['sessions', 'totalUsers', 'activeUsers', 'newUsers', 'engagedSessions', 'screenPageViews',
      'screenPageViewsPerSession', 'engagementRate', 'bounceRate', 'averageSessionDuration',
      'userEngagementDuration', 'eventCount'].map((name) => ({ name })),
  });
  if (tot.ok) {
    const m = tot.body.rows?.[0]?.metricValues?.map((v) => v.value) || [];
    console.log('  세션', m[0], '· 총사용자', m[1], '· 활성', m[2], '· 신규', m[3], '· 참여세션', m[4]);
    console.log('  PV', m[5], '· PV/세션', m[6], '· 참여율', m[7], '· 이탈율', m[8]);
    console.log('  평균체류', m[9], 's · 총참여시간', m[10], 's · 이벤트', m[11]);
  } else console.log('  ⚠️ ' + gaErrorReason(tot.status, tot.body));

  console.log('\n※ 전부 GA Data API 실측. 가짜 이벤트 주입·전송 0. 메일 미발송(콘솔 덤프).');
}
main().catch((e) => { console.error('ga4-full-dump error:', e.message); process.exit(1); });
