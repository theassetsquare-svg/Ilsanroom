#!/usr/bin/env node
/**
 * 월간 성장 사이클 갭 계열 덤프 (★100% 읽기전용 — 메일·사이트·DB 변경 0)
 *
 * ga4-full-dump/monthly-full-audit 가 커버하지 않는 계열만:
 *   ① GA4 dauPerMau·wauPerMau (습관 점수)
 *   ② GA4 일일 코호트 D1/D7/D30 (cohortSpec DAILY)
 *   ③ GA4 채널별 리텐션 품질 (firstUserSource × newVsReturning)
 *   ④ GSC 이미지 검색 (searchType=image) 노출·클릭
 *   ⑤ GSC searchAppearance (검색 노출 형태)
 * 인증: GH Secret GSC_SA_JSON. 속성 540830544 · https://nolcool.com/ 고정.
 */
import { getGaToken, gaErrorReason, runReport } from './lib/ga-auth.mjs';
import { getAccessToken, SITE_PROPERTY } from './lib/gsc-auth.mjs';

const ymd = (d) => d.toISOString().slice(0, 10);

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 실패'); process.exit(1); }

  // ① 습관 점수
  const hab = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    metrics: [{ name: 'dauPerMau' }, { name: 'wauPerMau' }, { name: 'dauPerWau' }],
  });
  if (hab.ok) {
    const m = hab.body.rows?.[0]?.metricValues?.map((v) => v.value) || [];
    console.log(`HABIT dauPerMau=${m[0]} wauPerMau=${m[1]} dauPerWau=${m[2]}`);
  } else console.log('HABIT ⚠️ ' + gaErrorReason(hab.status, hab.body));

  // ② 일일 코호트 — 최근 35일 내 획득 4개 코호트(각 7일 폭), Day0~30
  const mkCo = (name, s, e) => ({ name, dateRange: { startDate: s, endDate: e } });
  const now = Date.now(), D = 86400000;
  const co = await runReport(token, {
    dimensions: [{ name: 'cohort' }, { name: 'cohortNthDay' }],
    metrics: [{ name: 'cohortActiveUsers' }],
    cohortSpec: {
      cohorts: [
        mkCo('C_35_29', ymd(new Date(now - 35 * D)), ymd(new Date(now - 29 * D))),
        mkCo('C_28_22', ymd(new Date(now - 28 * D)), ymd(new Date(now - 22 * D))),
        mkCo('C_14_8', ymd(new Date(now - 14 * D)), ymd(new Date(now - 8 * D))),
      ],
      cohortsRange: { granularity: 'DAILY', startOffset: 0, endOffset: 30 },
    },
    limit: 400,
  });
  if (co.ok) {
    for (const r of co.body.rows || []) {
      const [c, day] = r.dimensionValues.map((d) => d.value);
      console.log(`COHORT ${c} day=${day} users=${r.metricValues[0].value}`);
    }
  } else console.log('COHORT ⚠️ ' + gaErrorReason(co.status, co.body));

  // ③ 채널별 리텐션 품질
  const src = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'firstUserSource' }, { name: 'newVsReturning' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'engagementRate' }],
    limit: 60,
  });
  if (src.ok) {
    for (const r of src.body.rows || []) {
      const [s, nr] = r.dimensionValues.map((d) => d.value);
      const [u, se, er] = r.metricValues.map((m) => m.value);
      console.log(`SRCRET ${s} | ${nr} | users=${u} sessions=${se} engRate=${er}`);
    }
  } else console.log('SRCRET ⚠️ ' + gaErrorReason(src.status, src.body));

  // ④⑤ GSC
  const gt = await getAccessToken();
  if (!gt) { console.log('GSC ⚠️ 토큰 실패'); return; }
  const end = ymd(new Date(now - 2 * D)), start = ymd(new Date(now - 30 * D));
  const gq = async (body) => {
    const r = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/searchAnalytics/query`,
      { method: 'POST', headers: { Authorization: `Bearer ${gt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, ...body }) });
    if (!r.ok) { console.log(`GSC ⚠️ ${r.status} ${await r.text().catch(() => '')}`); return []; }
    return (await r.json()).rows || [];
  };
  const imgTot = await gq({ type: 'image', rowLimit: 1 });
  const img = await gq({ type: 'image', dimensions: ['page'], rowLimit: 25 });
  console.log(`IMGTOT ${JSON.stringify(imgTot[0] || {})}`);
  for (const r of img) console.log(`IMG ${r.keys[0]} clicks=${r.clicks} imp=${r.impressions} pos=${(r.position || 0).toFixed(1)}`);
  const appear = await gq({ dimensions: ['searchAppearance'], rowLimit: 20 });
  for (const r of appear) console.log(`APPEAR ${r.keys[0]} clicks=${r.clicks} imp=${r.impressions}`);

  console.log('※ 전부 API 읽기전용. 메일·사이트·DB 변경 0.');
}
main().catch((e) => { console.error('gap-dump error:', e.message); process.exit(1); });
