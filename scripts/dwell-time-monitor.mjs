/**
 * 체류시간/세션 24h 자동 모니터.
 *
 * page_events 테이블에서 최근 24h 데이터를 가져와 분석:
 *   ① 총 세션 / 총 페이지뷰 / 세션당 평균 페이지뷰 (세션 깊이)
 *   ② Bounce rate (1페이지만 보고 나간 세션 비율)
 *   ③ 페이지별 평균 체류시간 (다음 이벤트까지의 간격, 단위 초)
 *   ④ Top 10 진입 페이지 (세션 첫 페이지)
 *   ⑤ Top 10 이탈 페이지 (세션 마지막 페이지)
 *   ⑥ 디바이스 분포 (PC/Mobile)
 *
 * 환경 변수:
 *   SUPABASE_URL           기본 https://rkqnblbajhnehmxfnvri.supabase.co
 *   SUPABASE_SECRET_KEY    필수 — page_events 읽기
 *   RESEND_API_KEY         필수 — 메일 발송
 *   NOTIFICATION_EMAIL     선택 (기본 theassetsquare@gmail.com)
 */
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

const EXCLUDE_PREFIXES = ['/_verify', '/_final', '/_post_fix', '/_regression'];

function fetchJson(url, headers) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), 30000);
    https.get(url, { headers }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        clearTimeout(t);
        try { res({ status: r.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (e) { res({ status: r.statusCode, body: null, error: e.message }); }
      });
    }).on('error', e => { clearTimeout(t); rej(e); });
  });
}

async function fetchEvents() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/page_events?select=session_id,path,event_type,created_at,device_type,source_type,dwell_ms&created_at=gt.${since}&order=created_at.asc&limit=20000`;
  const r = await fetchJson(url, {
    'apikey': SUPABASE_SECRET_KEY,
    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
  });
  if (r.status !== 200) throw new Error(`Supabase HTTP ${r.status}: ${JSON.stringify(r.body)}`);
  /* 검증/회귀 자동 트래픽 제외 */
  return r.body.filter(e => !EXCLUDE_PREFIXES.some(p => (e.path || '').startsWith(p)));
}

function analyze(events) {
  /* 세션 단위 그룹핑 */
  const sessions = {};
  for (const e of events) {
    if (!sessions[e.session_id]) sessions[e.session_id] = [];
    sessions[e.session_id].push(e);
  }
  for (const sid in sessions) sessions[sid].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const sessionCount = Object.keys(sessions).length;
  const pageviewCount = events.length;
  const avgDepth = sessionCount > 0 ? (pageviewCount / sessionCount).toFixed(2) : '0.00';

  /* Bounce: unique path 1개만 본 세션 (보조 이벤트는 path 중복이므로 unique로 셈) */
  const uniquePathsBySession = Object.values(sessions).map(s => new Set(s.map(e => e.path)).size);
  const bounceSessions = uniquePathsBySession.filter(n => n === 1).length;
  const bounceRate = sessionCount > 0 ? ((bounceSessions / sessionCount) * 100).toFixed(1) : '0.0';

  /* 진짜 세션 깊이 — unique path 평균 (보조 이벤트로 부풀려진 pageviewCount/sessionCount 아님) */
  const avgUniqueDepth = sessionCount > 0
    ? (uniquePathsBySession.reduce((a, b) => a + b, 0) / sessionCount).toFixed(2)
    : '0.00';

  /* 페이지별 평균 체류시간 — 정확 측정 ──
   * 1순위: exit 이벤트의 dwell_ms 컬럼 (visitor-tracker가 페이지 떠날 때 정확히 기록)
   * 2순위: path 변경 시점의 시간차 (exit 이벤트 누락된 모바일 일부)
   * 같은 path 내 보조 이벤트(scroll/time_*) 사이 간격은 무시 — 페이지 체류시간이 아님 */
  const dwellByPath = {}; /* path → { totalMs, count } */
  /* 1순위 — exit dwell_ms 직접 사용 */
  for (const e of events) {
    if (e.event_type !== 'exit') continue;
    const ms = Number(e.dwell_ms);
    if (!Number.isFinite(ms) || ms <= 0 || ms > 10 * 60 * 1000) continue;
    const p = e.path;
    if (!dwellByPath[p]) dwellByPath[p] = { totalMs: 0, count: 0 };
    dwellByPath[p].totalMs += ms;
    dwellByPath[p].count++;
  }
  /* 2순위 — path 변경 시점 시간차 (exit 누락 보강) */
  for (const evs of Object.values(sessions)) {
    let curPath = evs[0]?.path;
    let curStart = evs[0] ? new Date(evs[0].created_at).getTime() : 0;
    let hasExitForCur = false;
    for (let i = 1; i < evs.length; i++) {
      if (evs[i].event_type === 'exit' && evs[i].path === curPath) {
        hasExitForCur = true;
        continue;
      }
      if (evs[i].path !== curPath) {
        if (!hasExitForCur) {
          const ms = new Date(evs[i].created_at).getTime() - curStart;
          if (ms > 0 && ms <= 10 * 60 * 1000) {
            if (!dwellByPath[curPath]) dwellByPath[curPath] = { totalMs: 0, count: 0 };
            dwellByPath[curPath].totalMs += ms;
            dwellByPath[curPath].count++;
          }
        }
        curPath = evs[i].path;
        curStart = new Date(evs[i].created_at).getTime();
        hasExitForCur = false;
      }
    }
  }
  const dwellRanking = Object.entries(dwellByPath)
    .map(([path, d]) => ({ path, avgSec: (d.totalMs / d.count / 1000).toFixed(1), n: d.count }))
    .filter(d => d.n >= 2)
    .sort((a, b) => parseFloat(b.avgSec) - parseFloat(a.avgSec));

  /* Top 10 진입 (세션 첫 페이지) */
  const entryCounts = {};
  for (const evs of Object.values(sessions)) {
    const first = evs[0].path;
    entryCounts[first] = (entryCounts[first] || 0) + 1;
  }
  const topEntries = Object.entries(entryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  /* Top 10 이탈 (세션 마지막 페이지) */
  const exitCounts = {};
  for (const evs of Object.values(sessions)) {
    const last = evs[evs.length - 1].path;
    exitCounts[last] = (exitCounts[last] || 0) + 1;
  }
  const topExits = Object.entries(exitCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  /* 디바이스 분포 */
  const devices = {};
  for (const e of events) devices[e.device_type || 'unknown'] = (devices[e.device_type || 'unknown'] || 0) + 1;

  return {
    sessionCount, pageviewCount, avgDepth, avgUniqueDepth, bounceRate, bounceSessions,
    dwellTop: dwellRanking.slice(0, 10),
    dwellBottom: dwellRanking.slice(-10).reverse(),
    topEntries, topExits, devices,
  };
}

function buildEmail(a) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const depthColor = parseFloat(a.avgUniqueDepth) >= 3 ? '#059669' : parseFloat(a.avgUniqueDepth) >= 2 ? '#F59E0B' : '#DC2626';
  const bounceColor = parseFloat(a.bounceRate) <= 40 ? '#059669' : parseFloat(a.bounceRate) <= 60 ? '#F59E0B' : '#DC2626';

  const row = (cells) => `<tr>${cells.map(c => `<td style="border:1px solid #E5E7EB;padding:6px">${c}</td>`).join('')}</tr>`;
  const tbl = (head, rows) => `<table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr style="background:#F3F4F6">${head.map(h => `<th align="left" style="border:1px solid #E5E7EB;padding:6px">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;

  return `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
    <h2 style="color:#111">[놀쿨] 체류시간 24h 자동 리포트</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} / 윈도우: 최근 24시간</p>

    <h3>📊 핵심 KPI</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA">세션 수</td><td style="border:1px solid #E5E7EB;padding:8px;text-align:right;font-weight:bold">${a.sessionCount.toLocaleString()}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA">페이지뷰</td><td style="border:1px solid #E5E7EB;padding:8px;text-align:right;font-weight:bold">${a.pageviewCount.toLocaleString()}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA">세션당 페이지뷰 (보조 이벤트 포함)</td><td style="border:1px solid #E5E7EB;padding:8px;text-align:right">${a.avgDepth}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA"><b>세션 깊이 (unique path 수)</b></td><td style="border:1px solid #E5E7EB;padding:8px;text-align:right;font-weight:bold;color:${depthColor};font-size:18px">${a.avgUniqueDepth}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F8F9FA">Bounce rate (1페이지만 보고 나감)</td><td style="border:1px solid #E5E7EB;padding:8px;text-align:right;font-weight:bold;color:${bounceColor};font-size:18px">${a.bounceRate}% (${a.bounceSessions})</td></tr>
    </table>

    <h3>🏆 체류시간 Top 10 (가장 오래 보는 페이지)</h3>
    ${tbl(['Path', '평균 체류 (초)', '샘플'], a.dwellTop.map(d => row([`<a href="https://nolcool.com${esc(d.path)}">${esc(d.path)}</a>`, `<b>${d.avgSec}s</b>`, d.n])))}

    <h3>⚠️ 체류시간 Bottom 10 (가장 빨리 떠나는 페이지 — 손봐야 함)</h3>
    ${tbl(['Path', '평균 체류 (초)', '샘플'], a.dwellBottom.map(d => row([`<a href="https://nolcool.com${esc(d.path)}">${esc(d.path)}</a>`, `<span style="color:#DC2626"><b>${d.avgSec}s</b></span>`, d.n])))}

    <h3>🚪 Top 10 진입 페이지 (사용자가 처음 만나는 곳)</h3>
    ${tbl(['Path', '진입'], a.topEntries.map(([p, n]) => row([`<a href="https://nolcool.com${esc(p)}">${esc(p)}</a>`, n])))}

    <h3>🏃 Top 10 이탈 페이지 (사용자가 마지막으로 본 곳)</h3>
    ${tbl(['Path', '이탈'], a.topExits.map(([p, n]) => row([`<a href="https://nolcool.com${esc(p)}">${esc(p)}</a>`, n])))}

    <h3>📱 디바이스 분포</h3>
    ${tbl(['디바이스', '페이지뷰'], Object.entries(a.devices).sort((x, y) => y[1] - x[1]).map(([d, n]) => row([d, n])))}

    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">매일 KST 06:30 자동 실행 — dwell-time-monitor.mjs<br>
    KPI 해석: 세션깊이 3+ = 양호 / 2-3 = 보통 / &lt;2 = 개선필요. Bounce ≤40% 양호 / 40-60% 보통 / &gt;60% 개선필요.</p>
  </div>`;
}

async function sendEmail(html, subject) {
  if (!RESEND_API_KEY) { console.warn('::warning::RESEND_API_KEY 미설정 — 이메일 스킵'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: '놀쿨 자동감사 <onboarding@resend.dev>', to: [TO], subject, html }),
  });
  const t = await r.text();
  console.log(`이메일 발송 HTTP ${r.status}: ${t.slice(0, 200)}`);
  return r.ok;
}

(async () => {
  if (!SUPABASE_SECRET_KEY) {
    console.error('SUPABASE_SECRET_KEY 미설정 — 종료');
    process.exit(1);
  }
  console.log('📋 page_events 최근 24h 로드 중…');
  const events = await fetchEvents();
  console.log(`   이벤트 ${events.length}건 로드`);
  if (events.length === 0) {
    console.log('   데이터 없음 — 메일 스킵');
    return;
  }
  console.log('📊 분석 중…');
  const a = analyze(events);
  console.log(`   세션 ${a.sessionCount} / 페이지뷰 ${a.pageviewCount} / unique 깊이 ${a.avgUniqueDepth} / Bounce ${a.bounceRate}%`);

  const subject = `[놀쿨] 체류시간 24h — 깊이 ${a.avgUniqueDepth} / Bounce ${a.bounceRate}%`;
  const html = buildEmail(a);
  await sendEmail(html, subject);
})().catch(e => { console.error(e); process.exit(1); });
