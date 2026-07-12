#!/usr/bin/env node
/**
 * 놀쿨 일일 GSC+GA4 약점 진단 + 메일 리포트 (100% 읽기 전용 — 사이트·콘텐츠·광고주 전화 0 변경).
 *
 * 목적: 사장님이 매일 아침 "열어서 보고 판단"하는 단 하나의 약점 진단 다이제스트.
 *   기존 알림들(northstar 08:20 / ga-health 08:00 / ga-optimizer 09:10 / opportunity 주1회)은
 *   "목표 미달시만 울리고 좋아지면 침묵하는 자기수렴 알림"이다. 본 스크립트는 그와 역할이 다르다 —
 *   GSC striking-distance(주1회였음) + 저CTR + GA4 고이탈 페이지를 *매일 한 통에* 모으고,
 *   각 약점에 "사람이 승인 후 직접 할" 안전 레버를 *제안*으로 붙인다. 자동 수정은 절대 하지 않는다.
 *
 * ★자동 수정 0 (사이트 피해 0): 콘텐츠·메타·광고주 전화(staffPhone) 어떤 것도 건드리지 않는다.
 *   오직 GSC searchAnalytics + GA4 runReport 읽기 호출만 한다. 진단·리포트·제안만, 실행은 사장님 승인 후 별도.
 *
 * ★속성 분리 절대규칙 (런타임 하드가드): NOLCOOL 속성만 읽는다.
 *   GA4 = properties/540830544, GSC = https://nolcool.com/.
 *   둘 중 하나라도 NOLCOOL이 아니면(env override 등으로 오염되면) 즉시 중단하고 가드 알림만 보낸다.
 *   theassetsquare(sc-domain) 등 타 속성 혼입 0 — 빌드게이트 diagnosis-property-gate.mjs 로 정적 차단도 병행.
 *
 * ★정직: 데이터 소스가 조회 불가면 "확인불가"로 정직 표기한다(없는 수치 창작 0).
 *   합성(가짜 이벤트/수치 조작)은 Google 활동조작 페널티 → 절대 안 함. 측정·제안만.
 *
 * 메일 발송 조건(노이즈 0 = 사장님 silent-on-success 규칙 준수):
 *   - 손쓸 약점이 1건이라도 있으면 발송(사장님이 검토·판단할 실내용이 있을 때만).
 *   - 모든 소스가 확인불가면 "키/권한 손봐주세요" 셋업 알림 1통(행동 필요).
 *   - 약점 0 + 실패 0 인 깨끗한 날엔 발송 안 함(이상없음/안심 메일 금지).
 *
 * 스케줄: 매일 KST 09:40 (UTC 00:40) — ga-health 08:00 / northstar 08:20 / ga-optimizer 09:10 와 시간 분리.
 * 인증/시크릿(전부 기존 재사용, 신규 0): GSC_SA_JSON · RESEND_API_KEY · NOTIFICATION_EMAIL.
 */
import { getGaToken, gaErrorReason, runReport, GA_PROPERTY } from './lib/ga-auth.mjs';
import { getAccessToken as getGscToken, gscQuery, hasGscCredentials, SITE_PROPERTY } from './lib/gsc-auth.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

// ── 속성 잠금 — 이 둘만 허용. 어떤 경로로든 다르면 진단 중단(타 속성 혼입 0 보장) ──
const ALLOWED_GA_PROPERTY = 'properties/540830544';
const ALLOWED_GSC_HOST = 'nolcool.com';

// ── 임계값 — 기존 스크립트(search-console-opportunity / ga-health)와 동일 기준 재사용(일관성) ──
const GSC_DAYS = 28;
const GSC_ROW_LIMIT = 250;
const MIN_TOTAL_IMPRESSIONS = 30;   // GSC 표본 게이트
const STRIKE_POS_MIN = 3.5;         // 클릭 직전 밴드 하한(3~4위 위는 이미 상단)
const STRIKE_POS_MAX = 15.0;        // 클릭 직전 밴드 상한(2페이지 중반까지)
const STRIKE_MIN_IMP = 10;
const LOWCTR_POS_MAX = 10.0;        // 1페이지인데 CTR 새는 곳
const LOWCTR_MIN_IMP = 20;
const EXPECTED_CTR = (pos) => (pos <= 3 ? 0.12 : pos <= 6 ? 0.06 : 0.03);
const GA_MIN_SESSIONS = 50;         // 사이트 전체 세션 표본 게이트
const GA_MIN_PAGE_SESSIONS = 3;     // 페이지별 표본 게이트
const BOUNCE_HIGH = 0.75;           // 고이탈 입구 판정선

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const pct = (v) => (v * 100).toFixed(1);
const pathOf = (k) => (k || '').replace(/^https?:\/\/nolcool\.com/, '') || '/';

// 메일 표시값 PII 마스킹(landingPage 등에 전화·이메일 잔류 가능 → 한 번 더 가림)
function maskPii(s) {
  return String(s == null ? '' : s)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted_email]')
    .replace(/\b0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}\b|\b0\d{8,10}\b/g, '[redacted_phone]');
}

// ── 속성 잠금 검사 — 진단 시작 전 단 한 번. 위반 시 진단 자체를 막는다 ──
function assertNolcoolProperty() {
  const problems = [];
  if (GA_PROPERTY !== ALLOWED_GA_PROPERTY) problems.push(`GA4 속성이 NOLCOOL이 아님: ${GA_PROPERTY} (허용 ${ALLOWED_GA_PROPERTY})`);
  let gscHost = '';
  try { gscHost = new URL(SITE_PROPERTY).host; } catch { problems.push(`GSC 속성 파싱 불가: ${SITE_PROPERTY}`); }
  if (gscHost && gscHost !== ALLOWED_GSC_HOST) problems.push(`GSC 속성이 NOLCOOL이 아님: ${SITE_PROPERTY} (허용 호스트 ${ALLOWED_GSC_HOST})`);
  return problems;
}

function norm(rows) {
  return (rows || []).map((r) => ({
    key: r.keys[0], clicks: r.clicks || 0, imp: r.impressions || 0, ctr: r.ctr || 0, pos: r.position || 0,
  }));
}

// ── GSC 약점 — striking-distance(키워드/페이지) + 저CTR(키워드). 현재 28일 + 직전 28일 델타 ──
async function diagnoseGsc() {
  if (!hasGscCredentials()) return { ok: false, reason: 'GSC 인증정보 없음(GSC_SA_JSON)' };
  const token = await getGscToken();
  if (!token) return { ok: false, reason: 'GSC 토큰 발급 실패/속성 권한 없음' };

  const [q, p] = await Promise.all([
    gscQuery(token, { dimensions: ['query'], rowLimit: GSC_ROW_LIMIT, days: GSC_DAYS }),
    gscQuery(token, { dimensions: ['page'], rowLimit: GSC_ROW_LIMIT, days: GSC_DAYS }),
  ]);
  const queries = norm(q.rows);
  const pages = norm(p.rows);
  const range = { start: q.start, end: q.end };
  const totalImp = queries.reduce((n, r) => n + r.imp, 0);
  const totalClk = queries.reduce((n, r) => n + r.clicks, 0);

  if (totalImp < MIN_TOTAL_IMPRESSIONS) {
    return { ok: true, accumulating: true, range, totalImp, totalClk, strikeQ: [], lowctr: [], pageStrike: [] };
  }

  const inStrike = (r) => r.pos >= STRIKE_POS_MIN && r.pos <= STRIKE_POS_MAX && r.imp >= STRIKE_MIN_IMP;
  const strikeQ = queries.filter(inStrike).sort((a, b) => b.imp - a.imp).slice(0, 20);
  const lowctr = queries
    .filter((r) => r.pos <= LOWCTR_POS_MAX && r.imp >= LOWCTR_MIN_IMP && r.ctr < EXPECTED_CTR(r.pos))
    .map((r) => ({ ...r, leak: Math.round(r.imp * (EXPECTED_CTR(r.pos) - r.ctr)) }))
    .filter((r) => r.leak >= 1).sort((a, b) => b.leak - a.leak).slice(0, 20);
  const pageStrike = pages.filter(inStrike).sort((a, b) => b.imp - a.imp).slice(0, 15);

  // ★델타 — 직전 28일(저장된 실측값) striking-distance 키워드 수와 비교. 창작 0, 측정만.
  const prevEnd = new Date(new Date(range.start).getTime() - 86400 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (GSC_DAYS - 1) * 86400 * 1000);
  const ymd = (d) => d.toISOString().slice(0, 10);
  const qp = await gscQuery(token, { dimensions: ['query'], rowLimit: GSC_ROW_LIMIT, startDate: ymd(prevStart), endDate: ymd(prevEnd) });
  const prevQ = norm(qp.rows);
  const prevImp = prevQ.reduce((n, r) => n + r.imp, 0);
  const prevStrikeCount = prevImp >= MIN_TOTAL_IMPRESSIONS ? prevQ.filter(inStrike).length : null;

  return { ok: true, accumulating: false, range, totalImp, totalClk, strikeQ, lowctr, pageStrike, prevStrikeCount };
}

// ── GA4 약점 — 고이탈 진입(landing) 페이지. 현재 7일 + 직전 7일 델타 ──
async function diagnoseGa() {
  const token = await getGaToken();
  if (!token) return { ok: false, reason: 'GA 토큰 발급 실패(GSC_SA_JSON 확인)' };

  const site = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }],
  });
  if (!site.ok) return { ok: false, reason: gaErrorReason(site.status, site.body) };
  const sm = site.body.rows?.[0]?.metricValues || [];
  const sessions = Number(sm[0]?.value || 0);
  const bounce = Number(sm[1]?.value || 0);
  const engage = Number(sm[2]?.value || 0);

  if (sessions < GA_MIN_SESSIONS) {
    return { ok: true, accumulating: true, sessions, bounce, engage, leakPages: [] };
  }

  const lp = await runReport(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  const leakPages = (lp.body?.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '(unknown)',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    bounce: Number(r.metricValues?.[1]?.value || 0),
    engage: Number(r.metricValues?.[2]?.value || 0),
  })).filter((r) => r.sessions >= GA_MIN_PAGE_SESSIONS && r.bounce >= BOUNCE_HIGH)
    .sort((a, b) => b.bounce - a.bounce).slice(0, 25);

  // ★델타 — 직전 7일(14~8일전, 저장된 실측값) 고이탈 입구 수와 비교. 창작 0, 측정만.
  const lpP = await runReport(token, {
    dateRanges: [{ startDate: '14daysAgo', endDate: '8daysAgo' }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1000,
  });
  let prevLeakCount = null;
  if (lpP.ok) {
    prevLeakCount = (lpP.body?.rows || []).map((r) => ({
      sessions: Number(r.metricValues?.[0]?.value || 0), bounce: Number(r.metricValues?.[1]?.value || 0),
    })).filter((r) => r.sessions >= GA_MIN_PAGE_SESSIONS && r.bounce >= BOUNCE_HIGH).length;
  }

  return { ok: true, accumulating: false, sessions, bounce, engage, leakPages, prevLeakCount };
}

// ── 델타 뱃지(전 대비). good='down'이면 약점 수 감소가 개선 ──
function deltaBadge(cur, prev) {
  if (prev == null || !Number.isFinite(prev)) return '<span style="color:#9CA3AF;font-size:12px">전 대비 비교불가</span>';
  const d = cur - prev;
  if (d === 0) return '<span style="color:#6B7280;font-size:12px">→ 전 대비 동일</span>';
  const improving = d < 0; // 약점 수가 줄면 개선
  const color = improving ? '#059669' : '#DC2626';
  const arrow = d > 0 ? '▲' : '▼';
  return `<span style="color:${color};font-size:12px">${arrow} 전 대비 ${d > 0 ? '+' : ''}${d} (직전 ${prev})</span>`;
}

function gscTable(title, sub, list, cols) {
  if (!list.length) return '';
  const head = cols.map((c) => `<th style="border:1px solid #E5E7EB;padding:6px;font-size:11px;text-align:left;background:#F9FAFB">${c.h}</th>`).join('');
  const body = list.map((x) => `<tr>${cols.map((c) => `<td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c.f(x)}</td>`).join('')}</tr>`).join('');
  return `<h3 style="margin:20px 0 4px">${title}</h3>
    <p style="margin:0 0 8px;color:#6B7280;font-size:12px">${sub}</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function leakTable(list) {
  if (!list.length) return '<p style="color:#059669;margin:8px 0">✅ 고이탈(≥75%) 진입 페이지 없음.</p>';
  const r = list.map((x) => `<tr>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px"><a href="https://nolcool.com${maskPii(x.path)}" style="color:#2563EB">${maskPii(x.path)}</a></td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right">세션 ${x.sessions}</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right;color:#DC2626">이탈 ${(x.bounce * 100).toFixed(0)}%</td>
    <td style="border:1px solid #E5E7EB;padding:6px;font-size:12px;text-align:right">참여 ${(x.engage * 100).toFixed(0)}%</td></tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F9FAFB">
    <th align="left" style="border:1px solid #E5E7EB;padding:6px;font-size:11px">진입 페이지</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">세션</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">이탈률</th>
    <th style="border:1px solid #E5E7EB;padding:6px;font-size:11px">참여율</th></tr></thead><tbody>${r}</tbody></table>`;
}

// NOLCOOL 특이점: 공식 데이터 백본이 없다 → "공식데이터 보강" 레버 없음.
// 안전 레버 = 검색의도 정렬 · 내부링크 · 합법 포지셔닝. (전부 제안일 뿐, 자동 적용 0)
const SAFE_LEVERS_HTML = `
  <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;padding:14px;margin:18px 0">
    <p style="margin:0 0 8px;font-weight:bold;color:#5B21B6">🛠️ 안전 레버 제안 — ★제안일 뿐, 자동 적용 0 (사장님 승인 후 별도 작업)</p>
    <ul style="margin:0;padding-left:18px;color:#374151;font-size:13px;line-height:1.7">
      <li><b>🎯 클릭 직전(4~15위)</b> — 해당 검색어 의도에 맞춰 그 페이지 본문을 더 채우고, 관련 페이지에서 내부링크를 건다. 순위를 1페이지 상단으로 민다.</li>
      <li><b>✍️ 저CTR(1페이지인데 클릭 적음)</b> — 순위는 그대로 두고 title/description을 더 끌리는 후킹으로 손본다. 클릭만 늘린다.</li>
      <li><b>🚪 고이탈 진입 페이지</b> — 첫 화면 자기완결 답변·내부 동선(다음에 볼 것)을 보강해 한 페이지만 보고 나가지 않게 한다.</li>
    </ul>
    <p style="margin:8px 0 0;color:#6B7280;font-size:12px">놀쿨은 공식 데이터 백본이 없어 "공식데이터 보강" 레버는 쓰지 않는다. 위 3개(검색의도 정렬·내부링크·합법 포지셔닝)가 안전한 화이트햇 레버다. 가짜 후기/별점/회원/수치 조작은 Google 페널티 → 절대 금지.</p>
  </div>`;

function unavailableNote(parts) {
  if (!parts.length) return '';
  return `<div style="background:#FFFBEB;border-left:3px solid #D97706;padding:10px 12px;margin:14px 0;font-size:12px;color:#92400E">
    ⚠️ <b>확인불가</b> — ${parts.join(' · ')}. 이 소스는 이번 진단에서 빠졌습니다(없는 수치 창작 안 함). 키/권한 점검이 필요할 수 있습니다.</div>`;
}

async function send(subject, html) {
  // 2026-07-12 사장님 지시: 정보성 진단 메일 금지 — 런로그만. 온디맨드 FORCE_EMAIL=1 만 발송.
  if (process.env.FORCE_EMAIL !== '1') { console.log('ℹ️ 정보성 진단 — 메일 opt-in 아님, 콘솔만'); return -1; }
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return -1; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO], subject, html }),
  }).catch(() => null);
  console.log('이메일 HTTP', r ? r.status : '실패');
  return r ? r.status : -1;
}

async function main() {
  console.log(`🔎 놀쿨 일일 약점 진단 — ${kst()} (읽기전용, 사이트 변경 0)`);

  // 0) 속성 잠금 — NOLCOOL 아니면 진단 중단 + 가드 알림
  const propProblems = assertNolcoolProperty();
  if (propProblems.length) {
    console.error('🛑 속성 가드 위반 — 진단 중단:', propProblems.join(' | '));
    await send(`[놀쿨][🛑속성가드] NOLCOOL 외 속성 감지 — 진단 중단 (${kst()})`,
      `<div style="font-family:sans-serif;padding:20px"><h2 style="color:#DC2626">속성 분리 가드 작동 — 진단을 막았습니다</h2>
       <p>NOLCOOL 속성만 읽어야 하는데 다음이 감지되어 진단을 실행하지 않았습니다(타 속성 혼입 0 보장):</p>
       <ul>${propProblems.map((p) => `<li>${p}</li>`).join('')}</ul>
       <p style="color:#6B7280;font-size:12px">허용: GA4 ${ALLOWED_GA_PROPERTY} · GSC host ${ALLOWED_GSC_HOST}. GA_PROPERTY_ID / GSC_SITE_PROPERTY 환경변수를 확인하세요.</p></div>`);
    process.exit(1);
  }
  console.log(`🔒 속성 잠금 OK — GA4 ${GA_PROPERTY} · GSC ${SITE_PROPERTY}`);

  const [gsc, ga] = await Promise.all([diagnoseGsc(), diagnoseGa()]);

  const unavailable = [];
  if (!gsc.ok) unavailable.push(`GSC(${gsc.reason})`);
  else if (gsc.accumulating) unavailable.push(`GSC(데이터 축적중, 노출 ${gsc.totalImp} < ${MIN_TOTAL_IMPRESSIONS})`);
  if (!ga.ok) unavailable.push(`GA4(${ga.reason})`);
  else if (ga.accumulating) unavailable.push(`GA4(데이터 축적중, 세션 ${ga.sessions} < ${GA_MIN_SESSIONS})`);

  const strikeQ = (gsc.ok && !gsc.accumulating) ? gsc.strikeQ : [];
  const lowctr = (gsc.ok && !gsc.accumulating) ? gsc.lowctr : [];
  const pageStrike = (gsc.ok && !gsc.accumulating) ? gsc.pageStrike : [];
  const leakPages = (ga.ok && !ga.accumulating) ? ga.leakPages : [];
  const weakCount = strikeQ.length + lowctr.length + pageStrike.length + leakPages.length;

  console.log(`🎯 클릭직전 ${strikeQ.length} · ✍️ 저CTR ${lowctr.length} · 📄 보강페이지 ${pageStrike.length} · 🚪 고이탈 ${leakPages.length} · 확인불가 ${unavailable.length}`);

  // 약점 0 + 실패/확인불가 0 = 깨끗한 날 → 메일 안 보냄(이상없음 메일 금지)
  if (weakCount === 0 && unavailable.length === 0) {
    console.log('✅ 손쓸 약점 없음 + 전 소스 정상 — 메일 미발송(silent-on-success)');
    return;
  }
  // 약점 0 인데 모든 소스가 확인불가 = 행동 필요(키/권한) → 셋업 알림 1통
  if (weakCount === 0 && (!gsc.ok || gsc.accumulating) && (!ga.ok || ga.accumulating)) {
    await send(`[놀쿨][진단] 데이터 확인불가 — 점검 필요 (${kst()})`,
      `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
        <h2 style="color:#D97706">일일 약점 진단 — 데이터 확인불가</h2>
        ${unavailableNote(unavailable)}
        <p style="color:#6B7280;font-size:12px">읽기전용 진단(사이트 변경 0). 데이터가 쌓이거나 키/권한이 복구되면 자동으로 진단이 재개됩니다.</p></div>`);
    return;
  }

  const gscHead = (gsc.ok && !gsc.accumulating)
    ? `${gsc.range.start}~${gsc.range.end} · 노출 ${gsc.totalImp} · 클릭 ${gsc.totalClk} · 클릭직전 키워드 ${deltaBadge(strikeQ.length, gsc.prevStrikeCount)}`
    : '확인불가';
  const gaHead = (ga.ok && !ga.accumulating)
    ? `최근 7일 · 세션 ${ga.sessions} · 이탈 ${(ga.bounce * 100).toFixed(0)}% · 참여 ${(ga.engage * 100).toFixed(0)}% · 고이탈 입구 ${deltaBadge(leakPages.length, ga.prevLeakCount)}`
    : '확인불가';

  const html = `<div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED">[놀쿨] 일일 약점 진단 — 검토·판단용 (${kst()})</h2>
    <p style="color:#374151;font-size:13px;background:#F0FDF4;border:1px solid #BBF7D0;padding:10px;border-radius:8px">
      ★ <b>읽기 전용</b> · 사이트·콘텐츠·광고주 전화 <b>0 변경</b> · 자동 수정 없음. 아래는 약점 <b>진단과 제안</b>일 뿐이며, 실제 수정은 사장님 승인 후 별도로 진행합니다.</p>
    <p style="color:#6B7280;font-size:12px">🔒 속성 잠금: GA4 ${GA_PROPERTY} · GSC ${pathOf(SITE_PROPERTY) === '/' ? SITE_PROPERTY : SITE_PROPERTY} (NOLCOOL 외 속성 혼입 0)</p>

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin:12px 0;font-size:13px">
      <p style="margin:0"><b>📊 GSC</b> — ${gscHead}</p>
      <p style="margin:6px 0 0"><b>📈 GA4</b> — ${gaHead}</p>
    </div>

    ${unavailableNote(unavailable)}

    ${gscTable('🎯 클릭 직전 키워드 (4~15위, 조금만 밀면 1페이지 상단)',
      '평균순위 4~15위 + 노출 충분. 이 검색어 의도에 맞게 해당 페이지 본문·내부링크를 보강하면 순위가 오릅니다.',
      strikeQ, [
        { h: '검색어', f: (x) => x.key }, { h: '노출', f: (x) => x.imp },
        { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) }])}

    ${gscTable('✍️ 노출 많은데 클릭 적음 (제목·설명만 손보면 클릭 ↑)',
      '이미 1페이지인데 CTR이 낮아 클릭이 새는 검색어. title/description을 더 끌리게 고치면 순위 그대로 클릭만 늘어납니다.',
      lowctr, [
        { h: '검색어', f: (x) => x.key }, { h: '노출', f: (x) => x.imp },
        { h: 'CTR', f: (x) => pct(x.ctr) + '%' }, { h: '평균순위', f: (x) => x.pos.toFixed(1) },
        { h: '놓친클릭(추정)', f: (x) => `~${x.leak}` }])}

    ${gscTable('📄 보강하면 좋은 페이지 (1페이지 문턱, 4~15위)',
      '이 페이지들은 순위가 1페이지 문턱에 있습니다. 본문을 더 채우고 관련 페이지에서 내부링크를 걸면 효과가 큽니다.',
      pageStrike, [
        { h: '페이지', f: (x) => `<a href="https://nolcool.com${pathOf(x.key)}" style="color:#2563EB">${pathOf(x.key)}</a>` },
        { h: '노출', f: (x) => x.imp }, { h: '클릭', f: (x) => x.clicks }, { h: '평균순위', f: (x) => x.pos.toFixed(1) }])}

    <h3 style="margin:20px 0 4px">🚪 첫인상에서 떠나는 입구 (GA4 고이탈 진입 페이지 ≥75%)</h3>
    <p style="margin:0 0 8px;color:#6B7280;font-size:12px">들어오자마자 한 페이지만 보고 나가는 입구. 첫 화면 자기완결 답변·다음 동선을 보강하면 이탈이 줄어듭니다.</p>
    ${(ga.ok && !ga.accumulating) ? leakTable(leakPages) : '<p style="color:#9CA3AF;font-size:12px">GA4 확인불가 — 위 확인불가 안내 참조</p>'}

    ${SAFE_LEVERS_HTML}

    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 09:40 자동 — seo-weakness-diagnosis.mjs · 읽기 전용(GSC/GA4 API 읽기만, 사이트 크롤·변경 0) · NOLCOOL 속성 전용 · GSC 약 2일 지연. 약점이 있을 때만 발송(깨끗한 날 침묵).</p>
  </div>`;

  await send(`[놀쿨][🔎진단] 약점 ${weakCount}건${unavailable.length ? ` · 확인불가 ${unavailable.length}` : ''} (${kst()})`, html);
}

main().catch((e) => { console.error(e); process.exit(1); });
