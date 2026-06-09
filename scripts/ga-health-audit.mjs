#!/usr/bin/env node
/**
 * 놀쿨 GA4 일일 건강 감사 (자동, 실패시만 메일).
 *
 * 매일 GA4 속성(540830544)에서 직접 읽어 "사용자 불만족 신호"를 자동 적발:
 *   - 이탈 높은 페이지 (bounceRate 높음 = 들어왔다 바로 나감)
 *   - 체류 짧은 페이지 (avg engagement 짧음 = 재미없음)
 *   - 참여율 낮은 페이지 (engagementRate 낮음)
 * 만족도↑ → 자발적 추천(바이럴) 이라는 #1 우선순위(커뮤니티 재미)에 직결.
 *
 * 데이터 부족 시(신규 설치 직후)엔 "축적중"으로 정상 종료 — 노이즈 메일 안 보냄.
 * 인증: GH Secret GSC_SA_JSON (로컬 키 불필요). cron + workflow_dispatch.
 */
import { getGaToken, gaErrorReason, runReport, runRealtimeReport, GA_PROPERTY } from './lib/ga-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

// 임계값 — 통계적 의미를 위한 최소 세션 + 불만족 판정선
const MIN_TOTAL_SESSIONS = 50;   // 사이트 전체 세션 이 미만이면 "데이터 축적중"
const MIN_PAGE_SESSIONS = 8;     // 페이지별 판정 최소 표본
const BOUNCE_HIGH = 0.75;        // 이탈률 이상이면 불만족 의심
const ENGAGE_LOW = 0.35;         // 참여율 이하면 불만족 의심
const DURATION_SHORT = 8;        // 평균 참여시간(초) 미만이면 너무 빨리 떠남

function kst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY}`);

  // 최근 7일 페이지별 행동 지표
  const rep = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'bounceRate' },
      { name: 'engagementRate' }, { name: 'averageSessionDuration' }, { name: 'activeUsers' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  if (!rep.ok) {
    console.error(`❌ runReport 실패 — ${gaErrorReason(rep.status, rep.body)}`);
    console.error(`   raw: ${JSON.stringify(rep.body).slice(0, 300)}`);
    // API 비활성/권한은 설정 문제 — 메일 보내 사람이 조치
    await sendSetupAlert(gaErrorReason(rep.status, rep.body));
    process.exit(2);
  }

  const rows = (rep.body.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    views: Number(r.metricValues?.[1]?.value || 0),
    bounce: Number(r.metricValues?.[2]?.value || 0),
    engageRate: Number(r.metricValues?.[3]?.value || 0),
    avgDur: Number(r.metricValues?.[4]?.value || 0),
    users: Number(r.metricValues?.[5]?.value || 0),
  }));
  const totalSessions = rows.reduce((n, r) => n + r.sessions, 0);
  const totalViews = rows.reduce((n, r) => n + r.views, 0);
  console.log(`📊 최근7일 — 페이지 ${rows.length}개 · 세션 ${totalSessions} · 조회 ${totalViews}`);

  // 실시간(데이터 파이프 살아있음 확인)
  const rt = await runRealtimeReport(token, { metrics: [{ name: 'activeUsers' }] });
  const rtActive = rt.ok ? Number(rt.body.rows?.[0]?.metricValues?.[0]?.value || 0) : -1;
  console.log(`📡 실시간 활성 사용자: ${rtActive < 0 ? '조회실패' : rtActive}`);

  // 데이터 부족 → 축적중, 정상 종료(노이즈 방지)
  if (totalSessions < MIN_TOTAL_SESSIONS) {
    console.log(`⏳ 데이터 축적중 (세션 ${totalSessions} < ${MIN_TOTAL_SESSIONS}) — 진단 보류, 메일 미발송`);
    return;
  }

  // 불만족 신호 적발 (표본 충분한 페이지만)
  const sample = rows.filter((r) => r.sessions >= MIN_PAGE_SESSIONS);
  const highBounce = sample.filter((r) => r.bounce >= BOUNCE_HIGH).sort((a, b) => b.bounce - a.bounce);
  const lowEngage = sample.filter((r) => r.engageRate <= ENGAGE_LOW).sort((a, b) => a.engageRate - b.engageRate);
  const shortDwell = sample.filter((r) => r.avgDur < DURATION_SHORT).sort((a, b) => a.avgDur - b.avgDur);
  // 조회는 있는데 세션 거의 0 = 거의 안 보는 페이지(상위 노출 약함)
  const zeroTraffic = rows.filter((r) => r.sessions === 0 && r.views <= 1);

  console.log(`🔎 이탈높음 ${highBounce.length} · 참여낮음 ${lowEngage.length} · 체류짧음 ${shortDwell.length} · 무트래픽 ${zeroTraffic.length}`);

  const issues = { highBounce, lowEngage, shortDwell };
  const issueCount = highBounce.length + lowEngage.length + shortDwell.length;
  if (issueCount === 0) {
    console.log('✅ 불만족 신호 없음 — 메일 미발송');
    return;
  }
  await sendReport({ totalSessions, totalViews, rtActive, ...issues, pageCount: rows.length });
}

function rowsTable(title, list, fmt) {
  if (!list.length) return '';
  const r = list.slice(0, 25).map((x) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${x.path}">${x.path}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">세션 ${x.sessions}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${fmt(x)}</td></tr>`).join('');
  return `<h3>${title} (${list.length}${list.length > 25 ? ', 상위25' : ''})</h3>
    <table style="border-collapse:collapse;width:100%"><tbody>${r}</tbody></table>`;
}

async function sendReport({ totalSessions, totalViews, rtActive, highBounce, lowEngage, shortDwell, pageCount }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[놀쿨 GA4] 사용자 불만족 신호 ${highBounce.length + lowEngage.length + shortDwell.length}건</h2>
    <p style="color:#666;font-size:13px">최근 7일 · 페이지 ${pageCount} · 세션 ${totalSessions} · 조회 ${totalViews} · 실시간 ${rtActive}</p>
    ${rowsTable('🚪 이탈 높은 페이지 (바로 나감)', highBounce, (x) => `이탈률 ${(x.bounce * 100).toFixed(0)}%`)}
    ${rowsTable('😐 참여율 낮은 페이지', lowEngage, (x) => `참여율 ${(x.engageRate * 100).toFixed(0)}%`)}
    ${rowsTable('⏱️ 체류 짧은 페이지', shortDwell, (x) => `평균 ${x.avgDur.toFixed(1)}초`)}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 08:00 자동 — ga-health-audit.mjs (속성 540830544). 만족↑ = 자발적 추천(바이럴) #1 우선순위.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4] 불만족 신호 ${highBounce.length + lowEngage.length + shortDwell.length}건 (${kst().slice(0, 10)})`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

async function sendSetupAlert(reason) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4] 설정 필요 — ${reason.slice(0, 40)}`,
      html: `<div style="font-family:sans-serif;padding:20px"><h2 style="color:#DC2626">GA4 데이터 조회 실패</h2>
        <p>${reason}</p><p style="color:#666">속성 540830544 / project theasset-gsc(447703608130). Data API 사용 설정 또는 SA 권한 확인 필요.</p></div>`,
    }),
  });
  console.log('설정알림 이메일 HTTP', r.status);
}

main().catch((e) => { console.error(e); process.exit(1); });
