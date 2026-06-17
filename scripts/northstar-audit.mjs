#!/usr/bin/env node
/**
 * 놀쿨 북극성 3대 지표 통합 자동 감사 (읽기 전용, 사이트 크롤 0 = 피해 0).
 *
 * 사장님이 가장 중요하다고 못박은 3가지를 매일 한 통에 모아 측정하고,
 * 목표 미달시에만 메일을 보낸다(개선되면 자동 침묵 = 자기수렴 루프).
 *
 *   ① 클릭률(CTR)        — Google Search Console searchanalytics (사이트 전체 + 저CTR 기회 페이지)
 *   ② 끝까지읽기+체류10분 — Supabase page_events: scroll_100 도달률 + 세션 누적 exit dwell_ms ≥600초
 *   ③ 이탈률 → 0%를 향해  — GA4 bounceRate (진짜 방문자만; 봇·감사·미리보기 이미 제외됨)
 *
 * ⚠️ 정직 불변식: 이탈률 literal 0% / 참여율 100% / 모든 페이지 10분은 물리적으로 불가능하고,
 *    합성(가짜 이벤트 주입)하면 Google이 활동조작으로 탐지 → 영구 페널티 → 사이트 사망.
 *    이 스크립트는 오직 "측정 + 알림"만 한다. 어떤 수치도 조작하지 않는다(읽기 전용).
 *    화이트햇 개선은 콘텐츠·동선·재미로 진짜 방문자를 붙잡는 것뿐.
 *
 * 인증/시크릿 (전부 기존 것 재사용, 신규 구축 없음):
 *   GSC_SA_JSON          — GSC + GA4 공용 서비스계정 (만료 없음)
 *   SUPABASE_SECRET_KEY  — page_events 읽기
 *   RESEND_API_KEY       — 메일 (선택)
 *   NOTIFICATION_EMAIL   — 수신 (기본 theassetsquare@gmail.com)
 *
 * 데이터 부족(저트래픽) 시엔 "축적중"으로 조용히 종료 — 노이즈 메일 0.
 * 스케줄: 매일 KST 08:20 (UTC 23:20) + workflow_dispatch. ga-health(08:00)/dwell(06:30)과 시간 분리.
 */
import https from 'node:https';
import { getGaToken, gaErrorReason, runReport } from './lib/ga-auth.mjs';
import { getAccessToken as getGscToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

// ── 목표선 (북극성 = 이 방향으로 끌어올림). 합성 아님, 진짜 방문자 기준 ──
const MIN_SESSIONS = 50;          // 사이트 전체 세션 이 미만이면 통계 무의미 → 축적중
const MIN_GSC_IMPRESSIONS = 200;  // 노출 이 미만이면 CTR 판정 보류
const TARGET_CTR = 0.03;          // 클릭률 3% 이상 = 양호 (검색결과에서 눌러 들어옴). 목표=최대화
const TARGET_READ_END = 0.30;     // 세션 30%+ 가 글 끝(scroll 100%)까지 읽음. 목표=최대화
const TARGET_SESSION_SEC = 600;   // 세션 누적 체류 10분(600초) 이상. 목표=최대화
// 이탈률 경보선 = 55% (GA4 정의 보정). 목표 방향은 변함없이 0%를 향해 최소화.
//  ★ GA4 bounceRate = 1 − engagementRate 이고, engaged session = 10초 이상 OR 2페이지뷰 이상
//    OR 전환 1+ 이다. UA 의 "단일페이지=이탈"과 정의가 근본적으로 다르다(GA4 가 훨씬 관대).
//    기존 0.40 은 UA 감각으로 잡은 과엄격선이라, 콘텐츠/커뮤니티 사이트의 구조적 정상치
//    (engagement 45~50% / 세션당 4~5페이지 / 평균 200초+)에서도 매일 🛑 가짜 경보를 냈다.
//    GA4 콘텐츠 사이트 정상 밴드(이탈 45~55%)에 맞춰 55%로 보정 — 이 위로 올라가면 진짜 악화.
//    ※ 측정값(GA4 bounceRate)은 그대로 실측·읽기전용. 바뀐 건 "언제 경보를 울릴지"의 임계선뿐
//      (수치 합성·조작 아님 = 정직 불변식 준수). 추세 배지가 0% 방향 개선/악화는 계속 추적.
const TARGET_BOUNCE_MAX = 0.55;

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
const pct = (n) => (n * 100).toFixed(1);
const ymd = (d) => new Date(d).toISOString().slice(0, 10);

// ── 추세 표시 — 전 기간(저장된 실측값) 대비 변화. 창작·합성 0, 측정만 ──
// good='up' 이면 증가가 개선(↑녹색), good='down' 이면 감소가 개선. cur/prev 둘 다 유효할 때만 표시.
function trendBadge(cur, prev, good, fmt) {
  if (prev == null || !Number.isFinite(prev) || !Number.isFinite(cur)) {
    return '<span style="color:#9CA3AF;font-size:12px">전 대비 비교불가(이전 데이터 없음)</span>';
  }
  const d = cur - prev;
  const eps = Math.abs(prev) * 0.005;
  let arrow, color;
  if (Math.abs(d) <= eps) { arrow = '→'; color = '#6B7280'; }
  else {
    const improving = good === 'up' ? d > 0 : d < 0;
    arrow = d > 0 ? '▲' : '▼';
    color = improving ? '#059669' : '#DC2626';
  }
  const sign = d > 0 ? '+' : '';
  return `<span style="color:${color};font-size:12px">${arrow} 전 대비 ${sign}${fmt(d)} (이전 ${fmt(prev)})</span>`;
}
function trendText(cur, prev, good, fmt) {
  if (prev == null || !Number.isFinite(prev) || !Number.isFinite(cur)) return '(전 대비 -)';
  const d = cur - prev;
  const improving = good === 'up' ? d > 0 : d < 0;
  const arrow = Math.abs(d) < 1e-9 ? '→' : (d > 0 ? '▲' : '▼');
  const sign = d > 0 ? '+' : '';
  return `(전 대비 ${arrow}${sign}${fmt(d)}${improving ? ' 개선' : d === 0 ? '' : ' 악화'})`;
}

function fetchJson(url, headers) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 30000);
    https.get(url, { headers }, (r) => {
      const chunks = [];
      r.on('data', (d) => chunks.push(d));
      r.on('end', () => {
        clearTimeout(t);
        try { res({ status: r.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (e) { res({ status: r.statusCode, body: null, error: e.message }); }
      });
    }).on('error', (e) => { clearTimeout(t); rej(e); });
  });
}

// ── 지표① CTR — GSC 사이트 전체 + 저CTR 기회 페이지 ──
async function measureCtr() {
  if (!hasGscCredentials()) return { ok: false, reason: 'GSC 인증정보 없음' };
  const token = await getGscToken();
  if (!token) return { ok: false, reason: 'GSC 토큰 발급 실패' };
  const q = await gscQuery(token, { dimensions: ['date'], rowLimit: 1000, days: 28 });
  const pages = await gscQuery(token, { dimensions: ['page'], rowLimit: 1000, days: 28 });
  const tot = (q.rows || []).reduce(
    (a, r) => ({ clicks: a.clicks + (r.clicks || 0), imp: a.imp + (r.impressions || 0) }),
    { clicks: 0, imp: 0 },
  );
  const ctr = tot.imp ? tot.clicks / tot.imp : 0;
  // ★추세 — 그 직전 28일(저장된 실측값) CTR. 현재창 시작 하루 전을 prev 종료로. 창작 0, 측정만.
  const prevEnd = new Date(new Date(q.start).getTime() - 86400 * 1000);
  const prevStart = new Date(prevEnd.getTime() - 27 * 86400 * 1000);
  const qp = await gscQuery(token, { dimensions: ['date'], rowLimit: 1000, startDate: ymd(prevStart), endDate: ymd(prevEnd) });
  const totP = (qp.rows || []).reduce(
    (a, r) => ({ clicks: a.clicks + (r.clicks || 0), imp: a.imp + (r.impressions || 0) }),
    { clicks: 0, imp: 0 },
  );
  const prevCtr = totP.imp >= MIN_GSC_IMPRESSIONS ? totP.clicks / totP.imp : null;
  // 기회 페이지 = 노출 충분(≥30)한데 CTR이 목표 미만 = 제목/설명만 손보면 클릭 솟는 곳
  const opp = (pages.rows || [])
    .map((r) => ({ page: r.keys[0], clicks: r.clicks || 0, imp: r.impressions || 0, ctr: r.ctr || 0, pos: r.position || 0 }))
    .filter((r) => r.imp >= 30 && r.ctr < TARGET_CTR)
    .sort((a, b) => b.imp - a.imp)
    .slice(0, 20);
  return { ok: true, clicks: tot.clicks, imp: tot.imp, ctr, prevCtr, opp, range: { start: q.start, end: q.end } };
}

// ── 지표② 끝까지읽기 + 체류10분 — Supabase page_events 24h ──
const RD_TRANSIT = ['/login', '/signup', '/404', '/admin', '/auth', '/search', '/logout', '/reset'];
const rdIsTransit = (p) => RD_TRANSIT.some((t) => p === t || (p || '').startsWith(t + '/') || (p || '').startsWith(t + '?'));

// page_events 윈도(gt..lt)를 읽어 끝까지읽기율·세션평균체류·측정세션수 집계. 같은 게이트(scroll_100/exit) 기준.
async function readDwellWindow(gt, lt) {
  let url = `${SUPABASE_URL}/rest/v1/page_events?select=session_id,path,event_type,dwell_ms,created_at&created_at=gt.${gt}&order=created_at.asc&limit=40000`;
  if (lt) url += `&created_at=lt.${lt}`;
  const r = await fetchJson(url, { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` });
  if (r.status !== 200 || !Array.isArray(r.body)) return { ok: false, status: r.status };
  const viewSessions = new Set();
  const readEndSessions = new Set();
  const sessionDwellMs = {};
  for (const e of r.body) {
    if (e.event_type === 'view') viewSessions.add(e.session_id);
    if (e.event_type === 'scroll_100') readEndSessions.add(e.session_id);
    if (e.event_type === 'exit') {
      const ms = Number(e.dwell_ms);
      if (Number.isFinite(ms) && ms > 0 && ms <= 10 * 60 * 1000 && !rdIsTransit(e.path)) {
        sessionDwellMs[e.session_id] = (sessionDwellMs[e.session_id] || 0) + ms;
      }
    }
  }
  const sessions = viewSessions.size;
  const dwellTotals = Object.values(sessionDwellMs);
  return {
    ok: true,
    sessions,
    readEndCount: readEndSessions.size,
    readEndRate: sessions ? readEndSessions.size / sessions : 0,
    avgSessionSec: dwellTotals.length ? dwellTotals.reduce((a, b) => a + b, 0) / dwellTotals.length / 1000 : 0,
    tenMinRate: dwellTotals.length ? dwellTotals.filter((ms) => ms >= TARGET_SESSION_SEC * 1000).length / dwellTotals.length : 0,
    measured: dwellTotals.length,
  };
}

async function measureReadDwell() {
  if (!SUPABASE_SECRET_KEY) return { ok: false, reason: 'SUPABASE_SECRET_KEY 없음' };
  const now = Date.now();
  const cur = await readDwellWindow(new Date(now - 24 * 3600 * 1000).toISOString());
  if (!cur.ok) return { ok: false, reason: `Supabase HTTP ${cur.status}` };
  // ★추세 — 그 직전 24h(48h전~24h전, 저장된 실측값) 윈도. 창작 0, 측정만.
  const prev = await readDwellWindow(
    new Date(now - 48 * 3600 * 1000).toISOString(),
    new Date(now - 24 * 3600 * 1000).toISOString(),
  );
  const prevValid = prev.ok && prev.sessions >= MIN_SESSIONS;
  return {
    ...cur,
    prevReadEndRate: prevValid ? prev.readEndRate : null,
    prevAvgSessionSec: prevValid && prev.measured >= MIN_SESSIONS ? prev.avgSessionSec : null,
  };
}

// ── 지표③ 이탈률 — GA4 사이트 전체 (진짜 방문자만) ──
async function measureBounce() {
  const token = await getGaToken();
  if (!token) return { ok: false, reason: 'GA 토큰 발급 실패 (GSC_SA_JSON 확인)' };
  const rep = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }],
  });
  if (!rep.ok) return { ok: false, reason: gaErrorReason(rep.status, rep.body) };
  const m = rep.body.rows?.[0]?.metricValues || [];
  // ★추세 — 그 직전 7일(14일전~8일전, 저장된 실측값) 이탈률. 창작 0, 측정만.
  const repP = await runReport(token, {
    dateRanges: [{ startDate: '14daysAgo', endDate: '8daysAgo' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
  });
  let prevBounce = null;
  if (repP.ok) {
    const mp = repP.body.rows?.[0]?.metricValues || [];
    if (Number(mp[0]?.value || 0) >= MIN_SESSIONS) prevBounce = Number(mp[1]?.value || 0);
  }
  return {
    ok: true,
    sessions: Number(m[0]?.value || 0),
    bounce: Number(m[1]?.value || 0),
    engage: Number(m[2]?.value || 0),
    avgDur: Number(m[3]?.value || 0),
    prevBounce,
  };
}

function verdictRow(label, value, target, ok, dir, trendHtml) {
  const color = ok ? '#059669' : '#DC2626';
  const mark = ok ? '✅' : '🛑';
  const trendCell = `<td style="border:1px solid #E5E7EB;padding:8px;text-align:right">${trendHtml || '<span style="color:#9CA3AF;font-size:12px">-</span>'}</td>`;
  return `<tr>
    <td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA"><b>${label}</b></td>
    <td style="border:1px solid #E5E7EB;padding:8px;text-align:right;font-weight:bold;color:${color};font-size:18px">${mark} ${value}</td>
    ${trendCell}
    <td style="border:1px solid #E5E7EB;padding:8px;text-align:right;color:#6B7280">목표 ${dir} ${target}</td></tr>`;
}

function oppTable(opp) {
  if (!opp.length) return '<p style="color:#059669;margin:8px 0">✅ 저CTR 기회 페이지 없음.</p>';
  const rows = opp.map((o) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="${o.page}">${o.page.replace('https://nolcool.com', '')}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right">노출 ${o.imp}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right;color:#DC2626">CTR ${pct(o.ctr)}%</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right">순위 ${o.pos.toFixed(1)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6">
    <th align="left" style="border:1px solid #E5E7EB;padding:6px;font-size:11px">페이지</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">노출</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">CTR</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">평균순위</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function sendMail({ ctr, rd, bo, fails }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const ctrOk = !ctr.ok || ctr.imp < MIN_GSC_IMPRESSIONS || ctr.ctr >= TARGET_CTR;
  const readOk = !rd.ok || rd.sessions < MIN_SESSIONS || rd.readEndRate >= TARGET_READ_END;
  const dwellOk = !rd.ok || rd.measured < MIN_SESSIONS || rd.avgSessionSec >= TARGET_SESSION_SEC;
  const bounceOk = !bo.ok || bo.sessions < MIN_SESSIONS || bo.bounce <= TARGET_BOUNCE_MAX;

  const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#DC2626">[놀쿨 북극성] 3대 지표 ${fails}건 목표 미달 (${kst().slice(0, 10)})</h2>
    <p style="color:#6B7280;font-size:12px">사장님이 못박은 3가지를 매일 한 통에 자동 측정 — 목표 미달시만 발송(자기수렴). 모든 수치 읽기전용·진짜 방문자 기준.</p>

    <h3>① 클릭률 (CTR) — GSC 최근 28일 <span style="color:#9CA3AF;font-size:12px">(전 대비 = 직전 28일)</span></h3>
    ${ctr.ok && ctr.imp >= MIN_GSC_IMPRESSIONS
      ? `<table style="border-collapse:collapse;width:100%">${verdictRow('사이트 전체 CTR', pct(ctr.ctr) + '%', pct(TARGET_CTR) + '%', ctrOk, '≥', trendBadge(ctr.ctr, ctr.prevCtr, 'up', (n) => pct(n) + '%p'))}
         <tr><td colspan="4" style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#6B7280">클릭 ${ctr.clicks} · 노출 ${ctr.imp} · ${ctr.range.start}~${ctr.range.end}</td></tr></table>
         <h4 style="margin:12px 0 6px">🔧 제목·설명만 손보면 클릭 솟는 기회 페이지 (노출 많은데 저CTR)</h4>${oppTable(ctr.opp)}`
      : `<p style="color:#6B7280">데이터 부족/조회불가 (${ctr.ok ? `노출 ${ctr.imp} < ${MIN_GSC_IMPRESSIONS}` : ctr.reason}) — 판정 보류</p>`}

    <h3>② 끝까지 읽기 + 체류 10분 — page_events 최근 24h <span style="color:#9CA3AF;font-size:12px">(전 대비 = 직전 24h)</span></h3>
    ${rd.ok && rd.sessions >= MIN_SESSIONS
      ? `<table style="border-collapse:collapse;width:100%">
         ${verdictRow('끝까지 읽기율 (scroll 100%)', pct(rd.readEndRate) + '%', pct(TARGET_READ_END) + '%', readOk, '≥', trendBadge(rd.readEndRate, rd.prevReadEndRate, 'up', (n) => pct(n) + '%p'))}
         ${verdictRow('세션 평균 누적 체류', rd.avgSessionSec.toFixed(0) + '초', TARGET_SESSION_SEC + '초', dwellOk, '≥', trendBadge(rd.avgSessionSec, rd.prevAvgSessionSec, 'up', (n) => n.toFixed(0) + '초'))}
         <tr><td colspan="4" style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#6B7280">세션 ${rd.sessions} · 끝까지읽음 ${rd.readEndCount} · 10분+ 세션비율 ${pct(rd.tenMinRate)}% (측정 ${rd.measured})</td></tr></table>`
      : `<p style="color:#6B7280">데이터 부족 (${rd.ok ? `세션 ${rd.sessions} < ${MIN_SESSIONS}` : rd.reason}) — 판정 보류</p>`}

    <h3>③ 이탈률 → 0%를 향해 — GA4 최근 7일 (진짜 방문자) <span style="color:#9CA3AF;font-size:12px">(전 대비 = 직전 7일)</span></h3>
    ${bo.ok && bo.sessions >= MIN_SESSIONS
      ? `<table style="border-collapse:collapse;width:100%">
         ${verdictRow('사이트 전체 이탈률', pct(bo.bounce) + '%', pct(TARGET_BOUNCE_MAX) + '%', bounceOk, '≤', trendBadge(bo.bounce, bo.prevBounce, 'down', (n) => pct(n) + '%p'))}
         <tr><td colspan="4" style="border:1px solid #E5E7EB;padding:6px;font-size:12px;color:#6B7280">세션 ${bo.sessions} · 참여율 ${pct(bo.engage)}% · 평균체류 ${bo.avgDur.toFixed(0)}초</td></tr></table>`
      : `<p style="color:#6B7280">데이터 부족/조회불가 (${bo.ok ? `세션 ${bo.sessions} < ${MIN_SESSIONS}` : bo.reason}) — 판정 보류</p>`}

    <p style="background:#FEF2F2;border-left:3px solid #DC2626;padding:10px 12px;margin:16px 0;font-size:12px;color:#7F1D1D">
      ⚠️ 이탈률 literal 0%·참여율 100%는 합성하면 Google 페널티(활동조작). 이 알림은 측정만 — 개선은 콘텐츠·동선·재미로 진짜 방문자를 붙잡는 화이트햇만.</p>
    <p style="color:#9CA3AF;font-size:11px;margin-top:16px">매일 KST 08:20 자동 — northstar-audit.mjs (읽기전용, 사이트 크롤 0). 3개 전부 목표 도달 시 메일 자동 중단(자기수렴).</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][🌟북극성] 3대 지표 ${fails}건 목표 미달 (${kst().slice(0, 10)})`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

async function main() {
  console.log(`🌟 북극성 3대 지표 감사 — ${kst()}`);
  const [ctr, rd, bo] = await Promise.all([measureCtr(), measureReadDwell(), measureBounce()]);

  // 각 지표 판정 (데이터 부족이면 "보류"=통과 취급 → 노이즈 0)
  const ctrFail = ctr.ok && ctr.imp >= MIN_GSC_IMPRESSIONS && ctr.ctr < TARGET_CTR;
  const readFail = rd.ok && rd.sessions >= MIN_SESSIONS && rd.readEndRate < TARGET_READ_END;
  const dwellFail = rd.ok && rd.measured >= MIN_SESSIONS && rd.avgSessionSec < TARGET_SESSION_SEC;
  const bounceFail = bo.ok && bo.sessions >= MIN_SESSIONS && bo.bounce > TARGET_BOUNCE_MAX;

  console.log(`① CTR: ${ctr.ok ? pct(ctr.ctr) + '% (노출 ' + ctr.imp + ') ' + trendText(ctr.ctr, ctr.prevCtr, 'up', (n) => pct(n) + '%p') : ctr.reason}${ctrFail ? ' 🛑' : ''}`);
  console.log(`② 끝까지읽기: ${rd.ok ? pct(rd.readEndRate) + '% ' + trendText(rd.readEndRate, rd.prevReadEndRate, 'up', (n) => pct(n) + '%p') : rd.reason}${readFail ? ' 🛑' : ''} · 세션체류: ${rd.ok ? rd.avgSessionSec.toFixed(0) + '초 ' + trendText(rd.avgSessionSec, rd.prevAvgSessionSec, 'up', (n) => n.toFixed(0) + '초') : '-'}${dwellFail ? ' 🛑' : ''}`);
  console.log(`③ 이탈률: ${bo.ok ? pct(bo.bounce) + '% ' + trendText(bo.bounce, bo.prevBounce, 'down', (n) => pct(n) + '%p') : bo.reason}${bounceFail ? ' 🛑' : ''}`);

  const fails = [ctrFail, readFail, dwellFail, bounceFail].filter(Boolean).length;
  if (fails === 0) {
    console.log('✅ 3대 지표 전부 목표 도달(또는 데이터 보류) — 메일 미발송(자기수렴)');
    return;
  }
  await sendMail({ ctr, rd, bo, fails });
}

main().catch((e) => { console.error(e); process.exit(1); });
