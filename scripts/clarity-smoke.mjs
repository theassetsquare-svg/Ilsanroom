#!/usr/bin/env node
/**
 * clarity-smoke — Clarity Data Export API 1콜 스모크 (dispatch 전용, 메일 0, 스케줄 0)
 * 목적: 놀쿨 CLARITY_API_TOKEN이 실데이터를 수신하는지 + 놀쿨 프로젝트 분리 확인.
 * 실API: GET https://www.clarity.ms/export-data/api/v1/project-live-insights
 *        numOfDays 최대 3 · 토큰에 프로젝트 내장 · 10 성공요청/일 제한 (여기선 1콜)
 */
const TOKEN = process.env.CLARITY_API_TOKEN;
if (!TOKEN) { console.log('⏭️ CLARITY_API_TOKEN 없음 — Clarity 프로젝트 Settings→Data Export→토큰 생성 후 GH Secret 등록 필요'); process.exit(0); }

const r = await fetch('https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3&dimension1=URL', {
  headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
});
console.log(`HTTP ${r.status}`);
if (!r.ok) { console.error((await r.text()).slice(0, 300)); process.exit(1); }
const data = await r.json();
if (!Array.isArray(data)) { console.error('예상 밖 응답:', JSON.stringify(data).slice(0, 300)); process.exit(1); }

const urls = new Set();
for (const m of data) {
  const rows = m.information || [];
  console.log(`metric ${m.metricName}: ${rows.length}행 · 예시 ${JSON.stringify(rows[0] || {}).slice(0, 200)}`);
  for (const row of rows) { const u = row.URL || row.Url || row.url; if (u) urls.add(u); }
}
const foreign = [...urls].filter((u) => !String(u).includes('nolcool.com') && String(u).startsWith('http'));
console.log(`URL ${urls.size}개 · 놀쿨 외 도메인 ${foreign.length}개 ${urls.size && !foreign.length ? '✅ 놀쿨 전용 프로젝트 확인' : foreign.length ? '❌ 교차 의심: ' + foreign.slice(0, 3).join(', ') : '(URL 데이터 없음)'}`);
process.exit(foreign.length ? 1 : 0);
