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
const MIN_PAGE_SESSIONS = 3;     // 페이지별 판정 최소 표본 (초기 박한 트래픽도 타깃 노출)
const BOUNCE_HIGH = 0.75;        // 이탈률 이상이면 불만족 의심
const ENGAGE_LOW = 0.35;         // 참여율 이하면 불만족 의심
const DURATION_SHORT = 8;        // 평균 참여시간(초) 미만이면 너무 빨리 떠남
// ★사이트 전체 "GA4 점수" = 참여율(engagementRate)×100 = 100-이탈율. 목표선 이상이면 양호.
// 이하면 개선될 때까지 매일 메일 → 사장님이 다시 말 안 해도 점수가 목표에 닿을 때까지 자동 추적.
const TARGET_ENGAGE = 0.50;      // 참여율 50%(=이탈 50%) 이상이면 합격. 업계 "양호" 기준.

function kst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
}

// ★메일 표시값 PII 마스킹 — GA가 보통 path 쿼리를 떼지만, landingPage 등에 이메일·전화가
//   남을 가능성을 메일 본문에서 한 번 더 가린다(읽기전용 감시가 PII를 다시 노출하지 않게).
function maskPii(s) {
  return String(s == null ? '' : s)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted_email]')
    .replace(/\b0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}\b|\b0\d{8,10}\b/g, '[redacted_phone]');
}

// 사이트 전체 합계 지표 (차원 없음 = 1행). 실패 시 {ok:false}.
async function siteTotals(token, startDate, endDate) {
  const r = await runReport(token, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' },
      { name: 'screenPageViews' }, { name: 'averageSessionDuration' }, { name: 'engagedSessions' },
    ],
  });
  if (!r.ok) return { ok: false, r };
  const m = r.body.rows?.[0]?.metricValues || [];
  return {
    ok: true,
    sessions: Number(m[0]?.value || 0), bounce: Number(m[1]?.value || 0),
    engage: Number(m[2]?.value || 0), views: Number(m[3]?.value || 0),
    avgDur: Number(m[4]?.value || 0), engaged: Number(m[5]?.value || 0),
  };
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY}`);

  // ① 사이트 전체 headline — 현 7일 + 직전 7일 트렌드 (사장님이 보는 그 숫자를 자동화가 직접 측정)
  const cur = await siteTotals(token, '7daysAgo', 'today');
  if (!cur.ok) {
    console.error(`❌ runReport 실패 — ${gaErrorReason(cur.r.status, cur.r.body)}`);
    console.error(`   raw: ${JSON.stringify(cur.r.body).slice(0, 300)}`);
    await sendSetupAlert(gaErrorReason(cur.r.status, cur.r.body));
    process.exit(2);
  }
  const prev = await siteTotals(token, '14daysAgo', '8daysAgo');
  const score = Math.round(cur.engage * 100);                 // GA4 점수 = 참여율×100
  const prevScore = prev.ok && prev.sessions ? Math.round(prev.engage * 100) : null;
  const ppsCur = cur.sessions ? cur.views / cur.sessions : 0;  // 세션당 페이지
  console.log(`📊 최근7일 사이트 전체 — 세션 ${cur.sessions} · 조회 ${cur.views} · 세션당 ${ppsCur.toFixed(1)}p`);
  console.log(`   🎯 GA4 점수(참여율) ${score}/100 · 이탈율 ${(cur.bounce * 100).toFixed(0)}% · 평균체류 ${cur.avgDur.toFixed(1)}초` +
    (prevScore != null ? ` · 직전주 ${prevScore} (${score - prevScore >= 0 ? '+' : ''}${score - prevScore})` : ''));

  // ② 페이지별 행동 (체류/참여 약한 본문 타깃)
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
  const rows = (rep.body?.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    views: Number(r.metricValues?.[1]?.value || 0),
    bounce: Number(r.metricValues?.[2]?.value || 0),
    engageRate: Number(r.metricValues?.[3]?.value || 0),
    avgDur: Number(r.metricValues?.[4]?.value || 0),
    users: Number(r.metricValues?.[5]?.value || 0),
  }));

  // ③ 이탈이 새는 "진입(landing) 페이지" 순위 — 첫인상에서 떠나는 입구를 정확히 지목
  const lpRep = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  const landing = (lpRep.body?.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    bounce: Number(r.metricValues?.[1]?.value || 0),
    engageRate: Number(r.metricValues?.[2]?.value || 0),
  })).filter((r) => r.sessions >= MIN_PAGE_SESSIONS).sort((a, b) => b.bounce - a.bounce);
  const leakPages = landing.filter((r) => r.bounce >= BOUNCE_HIGH).slice(0, 25);

  // ④ 유입 채널별 이탈 — organic/direct 어디서 들어와 떠나는지
  const chRep = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });
  const channels = (chRep.body?.rows || []).map((r) => ({
    name: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    bounce: Number(r.metricValues?.[1]?.value || 0),
  }));

  // 실시간(데이터 파이프 살아있음 확인)
  const rt = await runRealtimeReport(token, { metrics: [{ name: 'activeUsers' }] });
  const rtActive = rt.ok ? Number(rt.body.rows?.[0]?.metricValues?.[0]?.value || 0) : -1;
  console.log(`📡 실시간 활성 사용자: ${rtActive < 0 ? '조회실패' : rtActive}`);

  // 데이터 부족 → 축적중, 정상 종료(노이즈 방지)
  if (cur.sessions < MIN_TOTAL_SESSIONS) {
    console.log(`⏳ 데이터 축적중 (세션 ${cur.sessions} < ${MIN_TOTAL_SESSIONS}) — 진단 보류, 메일 미발송`);
    return;
  }

  // 페이지별 불만족 신호
  const sample = rows.filter((r) => r.sessions >= MIN_PAGE_SESSIONS);
  const lowEngage = sample.filter((r) => r.engageRate <= ENGAGE_LOW).sort((a, b) => a.engageRate - b.engageRate);
  const shortDwell = sample.filter((r) => r.avgDur < DURATION_SHORT).sort((a, b) => a.avgDur - b.avgDur);

  console.log(`🔎 이탈새는입구 ${leakPages.length} · 참여낮음 ${lowEngage.length} · 체류짧음 ${shortDwell.length} · 채널 ${channels.length}`);

  // ★메일 발송 조건 = 사이트 점수가 목표 미만(headline 불합격) OR 페이지별 신호 존재.
  //   점수가 목표 이상이면 메일 없음 → 자동으로 멈춤(개선되면 조용해지는 자가수렴 루프).
  const siteFail = score < TARGET_ENGAGE * 100;
  const issueCount = leakPages.length + lowEngage.length + shortDwell.length;
  if (!siteFail && issueCount === 0) {
    console.log(`✅ GA4 점수 ${score}/100 (목표 ${TARGET_ENGAGE * 100} 이상) · 불만족 신호 없음 — 메일 미발송`);
    return;
  }
  await sendReport({ cur, prevScore, score, ppsCur, rtActive, siteFail, leakPages, lowEngage, shortDwell, channels });
}

function rowsTable(title, list, fmt) {
  if (!list.length) return '';
  const r = list.slice(0, 25).map((x) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${maskPii(x.path)}">${maskPii(x.path)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">세션 ${x.sessions}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#DC2626">${fmt(x)}</td></tr>`).join('');
  return `<h3>${title} (${list.length}${list.length > 25 ? ', 상위25' : ''})</h3>
    <table style="border-collapse:collapse;width:100%"><tbody>${r}</tbody></table>`;
}

function channelTable(channels) {
  if (!channels.length) return '';
  const r = channels.slice(0, 8).map((c) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.name}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">세션 ${c.sessions}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:${c.bounce >= 0.75 ? '#DC2626' : '#666'}">이탈 ${(c.bounce * 100).toFixed(0)}%</td></tr>`).join('');
  return `<h3>🌐 유입 채널별 이탈</h3><table style="border-collapse:collapse;width:100%"><tbody>${r}</tbody></table>`;
}

async function sendReport({ cur, prevScore, score, ppsCur, rtActive, siteFail, leakPages, lowEngage, shortDwell, channels }) {
  // 2026-07-12 사장님 지시: 정보성 리포트 메일 금지 (북극성 1통이 3대 지표 커버). 온디맨드 FORCE_EMAIL=1 만 발송.
  if (process.env.FORCE_EMAIL !== '1') { console.log('ℹ️ 정보성 리포트 — 메일 opt-in 아님, 콘솔만 (북극성 메일이 커버)'); return; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const trend = prevScore != null ? ` · 직전주 ${prevScore} (${score - prevScore >= 0 ? '+' : ''}${score - prevScore})` : '';
  const issueCount = leakPages.length + lowEngage.length + shortDwell.length;
  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:${siteFail ? '#DC2626' : '#D97706'}">[놀쿨 GA4] 점수 ${score}/100 ${siteFail ? '(목표 50 미달)' : ''} · 불만족 신호 ${issueCount}건</h2>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px;margin:12px 0">
      <p style="margin:0;font-size:15px"><b>🎯 GA4 점수(참여율) ${score}/100</b>${trend}</p>
      <p style="margin:6px 0 0;color:#444;font-size:13px">최근 7일 · 세션 ${cur.sessions} · 조회 ${cur.views} · <b>세션당 ${ppsCur.toFixed(1)}페이지</b> · 이탈율 ${(cur.bounce * 100).toFixed(0)}% · 평균체류 ${cur.avgDur.toFixed(1)}초 · 실시간 ${rtActive}</p>
      <p style="margin:6px 0 0;color:#6B7280;font-size:12px">점수=참여율(세션 중 10초+ 머물거나 2페이지+ 본 비율). 100 가까울수록 안 떠나고 논다 = 우선순위 #2(세션당 100페이지).</p>
    </div>
    ${rowsTable('🚪 이탈이 새는 진입(landing) 페이지 — 첫인상에서 떠나는 입구', leakPages, (x) => `이탈 ${(x.bounce * 100).toFixed(0)}%`)}
    ${rowsTable('😐 참여율 낮은 페이지', lowEngage, (x) => `참여율 ${(x.engageRate * 100).toFixed(0)}%`)}
    ${rowsTable('⏱️ 체류 짧은 페이지', shortDwell, (x) => `평균 ${x.avgDur.toFixed(1)}초`)}
    ${channelTable(channels)}
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 08:00 자동 — ga-health-audit.mjs (속성 540830544). 점수 50+ 도달 시 메일 자동 중단(자가수렴). 만족↑ = 자발적 추천(바이럴) #1 우선순위.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4] 점수 ${score}/100 · 이탈 ${(cur.bounce * 100).toFixed(0)}% · 신호 ${issueCount}건 (${kst().slice(0, 10)})`,
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
