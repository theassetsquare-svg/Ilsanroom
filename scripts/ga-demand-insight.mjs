#!/usr/bin/env node
/**
 * 놀쿨 GA4 주간 "사용자 수요" 인사이트 (긍정 절반).
 *
 * ga-health-audit = 불만족 신호(이탈/체류/참여) 적발 = "고칠 페이지".
 * 본 스크립트 = 사용자가 *원하는* 것 발견 = "더 만들/키울 페이지".
 *   - 🔥 가장 많이 찾는 페이지 (수요 = 조회/세션 top)
 *   - ❤️ 가장 사랑받는 페이지 (참여율↑ + 체류↑ = 이걸 더 만들어라)
 *   - 📈 떠오르는 페이지 (지난주 대비 성장 = 지금 뜨는 수요)
 *   - 🚪 사람들이 들어오는 입구 (top landing = 유입 수요 진입점)
 *
 * 백만 회원 = 사용자가 원하는 페이지를 사람이 직접 만든다(콘텐츠는 100% 사람).
 * 이 리포트는 "무엇을 만들지"만 데이터로 알려줌 — 글은 운영자가 씀.
 *
 * 주 1회 월 KST 11:00. 데이터<50세션이면 축적중 보류. 인증: GH Secret GSC_SA_JSON.
 */
import { runReport, getGaToken, GA_PROPERTY } from './lib/ga-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const MIN_TOTAL_SESSIONS = 50;  // 미만이면 데이터 축적중
const MIN_PAGE_SESSIONS = 8;    // 페이지 판정 최소 표본

function kst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

const num = (v) => Number(v || 0);
function parseRows(body, n) {
  return (body.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: num(r.metricValues?.[0]?.value),
    views: num(r.metricValues?.[1]?.value),
    engageRate: num(r.metricValues?.[2]?.value),
    avgDur: num(r.metricValues?.[3]?.value),
    users: num(r.metricValues?.[4]?.value),
  })).slice(0, n || 1000);
}

const METRICS = [
  { name: 'sessions' }, { name: 'screenPageViews' },
  { name: 'engagementRate' }, { name: 'averageSessionDuration' }, { name: 'activeUsers' },
];

async function pageReport(token, startDate, endDate, dimension = 'pagePath') {
  return runReport(token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: dimension }],
    metrics: METRICS,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY}`);

  const r28 = await pageReport(token, '28daysAgo', 'today');
  if (!r28.ok) {
    console.error(`❌ runReport 실패 HTTP ${r28.status}: ${JSON.stringify(r28.body).slice(0, 200)}`);
    process.exit(2);
  }
  const all = parseRows(r28.body);
  const totalSessions = all.reduce((n, r) => n + r.sessions, 0);
  const totalViews = all.reduce((n, r) => n + r.views, 0);
  console.log(`📊 최근28일 — 페이지 ${all.length} · 세션 ${totalSessions} · 조회 ${totalViews}`);

  if (totalSessions < MIN_TOTAL_SESSIONS) {
    console.log(`⏳ 데이터 축적중 (세션 ${totalSessions} < ${MIN_TOTAL_SESSIONS}) — 인사이트 보류, 메일 미발송`);
    return;
  }

  // 🔥 수요: 조회 많은 페이지
  const demand = [...all].sort((a, b) => b.views - a.views).slice(0, 15);
  // ❤️ 사랑받음: 표본 충분 + 참여·체류 높은 순 (love score = engageRate * dur)
  const loved = all.filter((r) => r.sessions >= MIN_PAGE_SESSIONS)
    .map((r) => ({ ...r, love: r.engageRate * Math.min(r.avgDur, 600) }))
    .sort((a, b) => b.love - a.love).slice(0, 15);

  // 📈 떠오름: 최근7일 vs 직전7일 세션 성장
  const [cur, prev] = await Promise.all([
    pageReport(token, '7daysAgo', 'today'),
    pageReport(token, '14daysAgo', '8daysAgo'),
  ]);
  let rising = [];
  if (cur.ok && prev.ok) {
    const prevMap = new Map(parseRows(prev.body).map((r) => [r.path, r.sessions]));
    rising = parseRows(cur.body)
      .map((r) => ({ ...r, prev: prevMap.get(r.path) || 0, delta: r.sessions - (prevMap.get(r.path) || 0) }))
      .filter((r) => r.delta > 0 && r.sessions >= 3)
      .sort((a, b) => b.delta - a.delta).slice(0, 12);
  }

  // 🚪 입구: top landing pages
  const land = await pageReport(token, '28daysAgo', 'today', 'landingPage');
  const entries = land.ok ? parseRows(land.body).filter((r) => r.path !== '(not set)').slice(0, 12) : [];

  console.log(`🔥 수요 ${demand.length} · ❤️ 사랑 ${loved.length} · 📈 떠오름 ${rising.length} · 🚪 입구 ${entries.length}`);
  await sendInsight({ totalSessions, totalViews, pageCount: all.length, demand, loved, rising, entries });
}

function tbl(title, list, cols) {
  if (!list.length) return '';
  const head = cols.map((c) => `<th style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:left;background:#F9FAFB">${c.h}</th>`).join('');
  const body = list.map((x) => `<tr>${cols.map((c) =>
    `<td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.f(x)}</td>`).join('')}</tr>`).join('');
  return `<h3 style="margin-top:22px">${title}</h3>
    <table style="border-collapse:collapse;width:100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const link = (x) => `<a href="https://nolcool.com${x.path}">${x.path}</a>`;

async function sendInsight({ totalSessions, totalViews, pageCount, demand, loved, rising, entries }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const html = `<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px">
    <h2 style="color:#2563EB">[놀쿨 GA4] 사용자가 원하는 것 — 주간 수요 인사이트</h2>
    <p style="color:#666;font-size:13px">최근 28일 · 페이지 ${pageCount} · 세션 ${totalSessions} · 조회 ${totalViews}</p>
    <p style="color:#374151;font-size:13px;background:#EFF6FF;padding:10px;border-radius:8px">
      이 데이터로 <b>사람이 직접</b> 사용자가 원하는 페이지·콘텐츠를 더 만드세요. (글은 100% 사람)
      ❤️ 사랑받는 페이지의 주제·형식을 늘리고, 📈 떠오르는 수요를 빠르게 받쳐주는 것이 백만 회원의 길입니다.</p>
    ${tbl('🔥 가장 많이 찾는 페이지 (수요 top)', demand, [
      { h: '페이지', f: link }, { h: '조회', f: (x) => x.views }, { h: '세션', f: (x) => x.sessions }])}
    ${tbl('❤️ 가장 사랑받는 페이지 (이 주제를 더 만들어라)', loved, [
      { h: '페이지', f: link }, { h: '참여율', f: (x) => `${(x.engageRate * 100).toFixed(0)}%` },
      { h: '평균체류', f: (x) => `${x.avgDur.toFixed(0)}초` }, { h: '세션', f: (x) => x.sessions }])}
    ${tbl('📈 떠오르는 페이지 (지난주 대비 성장)', rising, [
      { h: '페이지', f: link }, { h: '이번주', f: (x) => x.sessions }, { h: '지난주', f: (x) => x.prev },
      { h: '증가', f: (x) => `+${x.delta}` }])}
    ${tbl('🚪 사람들이 들어오는 입구 (유입 진입점)', entries, [
      { h: '랜딩', f: link }, { h: '세션', f: (x) => x.sessions }, { h: '사용자', f: (x) => x.users }])}
    <p style="color:#9CA3AF;font-size:11px;margin-top:22px">매주 월 KST 11:00 자동 — ga-demand-insight.mjs (속성 540830544). 사용자가 원하는 사이트 = #1 커뮤니티 재미 → 자발적 추천(바이럴).</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4] 사용자 수요 인사이트 (${kst()})`,
      html,
    }),
  });
  console.log('수요인사이트 이메일 HTTP', r.status);
}

main().catch((e) => { console.error(e); process.exit(1); });
