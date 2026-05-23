/**
 * Bottom 페이지 진단 — 매일 KST 06:45 자동.
 * dwell-time-monitor의 Bottom 10 (체류 짧은 페이지)을 다시 산출 후
 * 각 페이지의 HTML 길이 / 이미지 수 / first-h1 / first-paragraph 길이를 측정해 메일.
 *
 * 환경:
 *   SUPABASE_URL          기본 https://rkqnblbajhnehmxfnvri.supabase.co
 *   SUPABASE_SECRET_KEY   필수
 *   RESEND_API_KEY        필수
 *   NOTIFICATION_EMAIL    기본 theassetsquare@gmail.com
 *   BASE_URL              기본 https://nolcool.com
 */
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkqnblbajhnehmxfnvri.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const BASE = process.env.BASE_URL || 'https://nolcool.com';

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
  const url = `${SUPABASE_URL}/rest/v1/page_events?select=session_id,path,event_type,created_at,dwell_ms&created_at=gt.${since}&order=created_at.asc&limit=20000`;
  const r = await fetchJson(url, {
    'apikey': SUPABASE_SECRET_KEY,
    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
  });
  if (r.status !== 200) throw new Error(`Supabase HTTP ${r.status}: ${JSON.stringify(r.body)}`);
  return r.body.filter(e => !EXCLUDE_PREFIXES.some(p => (e.path || '').startsWith(p)));
}

function dwellRanking(events) {
  const sessions = {};
  for (const e of events) {
    if (!sessions[e.session_id]) sessions[e.session_id] = [];
    sessions[e.session_id].push(e);
  }
  for (const sid in sessions) sessions[sid].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const byPath = {};
  for (const e of events) {
    if (e.event_type !== 'exit') continue;
    const ms = Number(e.dwell_ms);
    if (!Number.isFinite(ms) || ms <= 0 || ms > 10 * 60 * 1000) continue;
    if (!byPath[e.path]) byPath[e.path] = { totalMs: 0, count: 0 };
    byPath[e.path].totalMs += ms;
    byPath[e.path].count++;
  }
  for (const evs of Object.values(sessions)) {
    let curPath = evs[0]?.path;
    let curStart = evs[0] ? new Date(evs[0].created_at).getTime() : 0;
    let hasExit = false;
    for (let i = 1; i < evs.length; i++) {
      if (evs[i].event_type === 'exit' && evs[i].path === curPath) { hasExit = true; continue; }
      if (evs[i].path !== curPath) {
        if (!hasExit) {
          const ms = new Date(evs[i].created_at).getTime() - curStart;
          if (ms > 0 && ms <= 10 * 60 * 1000) {
            if (!byPath[curPath]) byPath[curPath] = { totalMs: 0, count: 0 };
            byPath[curPath].totalMs += ms;
            byPath[curPath].count++;
          }
        }
        curPath = evs[i].path;
        curStart = new Date(evs[i].created_at).getTime();
        hasExit = false;
      }
    }
  }
  return Object.entries(byPath)
    .map(([path, d]) => ({ path, avgSec: d.totalMs / d.count / 1000, n: d.count }))
    .filter(d => d.n >= 2)
    .sort((a, b) => a.avgSec - b.avgSec)
    .slice(0, 10);
}

function fetchHtml(url) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ ok: false, html: '', size: 0 }), 20000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolBottomDiag/1.0' } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => {
        clearTimeout(t);
        const html = Buffer.concat(chunks).toString('utf8');
        res({ ok: r.statusCode === 200, html, size: html.length, status: r.statusCode });
      });
    }).on('error', () => { clearTimeout(t); res({ ok: false, html: '', size: 0 }); });
  });
}

function diagnose(html) {
  const imgCount = (html.match(/<img\s/gi) || []).length;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const firstP = (html.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [, ''])[1].replace(/<[^>]+>/g, '').trim();
  const heroImg = /<img[^>]+(eager|fetchpriority="high")/i.test(html);
  const jsonLdCount = (html.match(/application\/ld\+json/gi) || []).length;
  return { imgCount, h1Len: h1.length, firstPLen: firstP.length, heroImg, jsonLdCount };
}

async function main() {
  if (!SUPABASE_SECRET_KEY) { console.error('SUPABASE_SECRET_KEY 없음'); process.exit(1); }
  console.log('📋 page_events 로드 중…');
  const events = await fetchEvents();
  console.log(`   ${events.length}건`);
  if (events.length === 0) { console.log('데이터 없음'); return; }

  const bottom = dwellRanking(events);
  if (bottom.length === 0) { console.log('Bottom 페이지 없음'); return; }

  console.log(`🔍 Bottom ${bottom.length}개 페이지 진단 중…`);
  const rows = [];
  for (const b of bottom) {
    const r = await fetchHtml(BASE + b.path);
    const d = diagnose(r.html);
    rows.push({ ...b, status: r.status, size: r.size, ...d });
    console.log(`   ${b.path} — dwell ${b.avgSec.toFixed(1)}s / HTML ${(r.size/1024).toFixed(1)}KB / img ${d.imgCount} / firstP ${d.firstPLen}자`);
  }

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const tr = (cells) => `<tr>${cells.map(c => `<td style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${c}</td>`).join('')}</tr>`;
  const head = ['Path', '체류(초)', '샘플', 'HTML(KB)', 'img', 'h1자', '첫문단자', 'JSON-LD', '진단'];

  const diag = (r) => {
    const issues = [];
    if (r.size < 8000) issues.push('HTML이 너무 짧음(8KB↓) — 본문 부족');
    if (r.imgCount < 2) issues.push('이미지 부족(<2) — 시각자극 약함');
    if (r.firstPLen < 80) issues.push('첫 문단이 짧음(<80자) — 후킹 약함');
    if (r.h1Len < 8) issues.push('H1 짧음');
    if (r.jsonLdCount === 0) issues.push('JSON-LD 없음 — SEO 회귀');
    if (issues.length === 0) issues.push('문제 없음 — 콘텐츠 양보다 매력 보강');
    return issues.join(' / ');
  };

  const rowsHtml = rows.map(r => tr([
    `<a href="${BASE}${esc(r.path)}">${esc(r.path)}</a>`,
    `<b style="color:#DC2626">${r.avgSec.toFixed(1)}</b>`,
    r.n,
    (r.size / 1024).toFixed(1),
    r.imgCount,
    r.h1Len,
    r.firstPLen,
    r.jsonLdCount,
    `<span style="font-size:11px;color:#666">${esc(diag(r))}</span>`,
  ])).join('');

  const html = `<div style="font-family:sans-serif;max-width:920px;margin:0 auto;padding:20px">
    <h2 style="color:#111">[놀쿨] Bottom 10 페이지 진단</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst} / 윈도우: 최근 24시간 / 체류 짧은 순</p>
    <table style="border-collapse:collapse;width:100%"><thead><tr style="background:#F3F4F6">${head.map(h => `<th align="left" style="border:1px solid #E5E7EB;padding:6px;font-size:12px">${h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:45 자동 — bottom-page-diagnostics.mjs<br>처방: HTML &lt;8KB = 콘텐츠 증량 / 이미지 &lt;2 = 비주얼 추가 / 첫 문단 &lt;80자 = 후킹 보강 / JSON-LD 0 = SEO 회귀 즉시 수정</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: '놀쿨 자동감사 <onboarding@resend.dev>', to: [TO], subject: `[놀쿨] Bottom 10 페이지 진단 — 평균 ${(rows.reduce((s,r)=>s+r.avgSec,0)/rows.length).toFixed(1)}s`, html }),
  });
  console.log(`이메일 HTTP ${r.status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
