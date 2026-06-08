#!/usr/bin/env node
/**
 * Google Search Console — 검색 분석 리포트 (키워드/페이지별 클릭·노출·CTR·평균순위)
 *
 * 인증 (scripts/lib/gsc-auth.mjs):
 *   서비스계정 GSC_SA_JSON (만료 없음)
 *   RESEND_API_KEY / NOTIFICATION_EMAIL (메일 발송, 선택)
 *
 * 동작: searchanalytics.query 로 최근 28일 상위 키워드 + 상위 페이지를 조회,
 *       콘솔 로그로 출력하고 (RESEND 설정 시) 이메일 1통 발송. 읽기 전용.
 */
import { getAccessToken, gscQuery, hasGscCredentials } from './lib/gsc-auth.mjs';

const DAYS = 28;
const ROW_LIMIT = 25;

if (!hasGscCredentials()) {
  console.log('⏭️  GSC 인증정보 미설정 (GSC_SA_JSON) — 스킵');
  process.exit(0);
}

const query = (token, dimensions) => gscQuery(token, { dimensions, rowLimit: ROW_LIMIT, days: DAYS });

function fmtRows(rows) {
  return rows.map((row, i) => {
    const key = row.keys[0];
    const clicks = row.clicks || 0;
    const imp = row.impressions || 0;
    const ctr = ((row.ctr || 0) * 100).toFixed(1);
    const pos = (row.position || 0).toFixed(1);
    return { i: i + 1, key, clicks, imp, ctr, pos };
  });
}

function logTable(title, rows) {
  console.log(`\n=== ${title} ===`);
  console.log('순위  클릭  노출   CTR    평균순위  키워드/페이지');
  for (const r of rows) {
    console.log(
      `${String(r.i).padStart(3)}  ${String(r.clicks).padStart(4)}  ${String(r.imp).padStart(5)}  ${String(r.ctr + '%').padStart(6)}  ${String(r.pos).padStart(7)}   ${r.key}`
    );
  }
  if (rows.length === 0) console.log('  (데이터 없음 — 색인/유입 아직 미발생일 수 있음)');
}

function htmlTable(title, rows) {
  const body = rows
    .map(
      (r) =>
        `<tr><td style="text-align:right;color:#9CA3AF">${r.i}</td><td style="padding:4px 10px">${r.key}</td><td style="text-align:right;font-weight:600">${r.clicks}</td><td style="text-align:right">${r.imp}</td><td style="text-align:right">${r.ctr}%</td><td style="text-align:right">${r.pos}</td></tr>`
    )
    .join('');
  return `<h3 style="margin:24px 0 8px">${title}</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="border-bottom:2px solid #E5E7EB;color:#6B7280;font-size:11px">
      <th>#</th><th style="text-align:left;padding:4px 10px">키워드/페이지</th><th>클릭</th><th>노출</th><th>CTR</th><th>평균순위</th>
    </tr></thead><tbody>${body || '<tr><td colspan="6" style="padding:10px;color:#9CA3AF">데이터 없음</td></tr>'}</tbody>
  </table>`;
}

async function sendEmail(range, queries, pages, totals) {
  // 참고용 검색분석 리포트 — 기본 비발송(인박스0). 진단은 CI 콘솔에 항상 남고,
  // 메일이 필요하면 SEARCH_REPORT_EMAIL=1로 옵트인. 매일 요약은 별도 issue-monitor가 담당.
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
  if (!RESEND_API_KEY || process.env.SEARCH_REPORT_EMAIL !== '1') return;
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
  const html = `<div style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#111">
    <h2 style="color:#7C3AED">📊 놀쿨 서치콘솔 검색분석 (${range.start} ~ ${range.end})</h2>
    <p style="color:#666;font-size:12px">발송: ${kst} · 최근 ${DAYS}일 · nolcool.com</p>
    <p style="font-size:14px">총 클릭 <b>${totals.clicks}</b> · 총 노출 <b>${totals.imp}</b> · 평균 CTR <b>${totals.ctr}%</b> · 평균순위 <b>${totals.pos}</b></p>
    ${htmlTable('🔑 상위 검색어 (키워드)', queries)}
    ${htmlTable('📄 상위 유입 페이지', pages)}
    <p style="color:#9CA3AF;font-size:11px;margin-top:24px">데이터는 Google 정책상 약 2일 지연. 읽기 전용 리포트.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][📊] 서치콘솔 검색분석 — 클릭 ${totals.clicks} / 상위키워드 ${queries[0]?.key || '없음'}`,
      html,
    }),
  }).catch(() => null);
  console.log(`\n📧 메일 발송: ${r ? r.status : '실패'} → ${TO}`);
}

(async () => {
  const token = await getAccessToken();
  if (!token) process.exit(0);

  const q = await query(token, ['query']);
  const p = await query(token, ['page']);
  const range = { start: q.start, end: q.end };

  const queries = fmtRows(q.rows);
  const pages = fmtRows(p.rows);

  // 전체 합계 (totals 행)
  const tot = q.rows.reduce(
    (a, r) => ({ clicks: a.clicks + (r.clicks || 0), imp: a.imp + (r.impressions || 0) }),
    { clicks: 0, imp: 0 }
  );
  const totals = {
    clicks: tot.clicks,
    imp: tot.imp,
    ctr: tot.imp ? ((tot.clicks / tot.imp) * 100).toFixed(1) : '0.0',
    pos: queries.length ? (queries.reduce((a, r) => a + parseFloat(r.pos), 0) / queries.length).toFixed(1) : '0.0',
  };

  console.log(`\n📊 놀쿨 서치콘솔 검색분석  ${range.start} ~ ${range.end} (최근 ${DAYS}일)`);
  console.log(`총 클릭 ${totals.clicks} · 총 노출 ${totals.imp} · 평균 CTR ${totals.ctr}% · 평균순위 ${totals.pos}`);
  logTable('🔑 상위 검색어 (키워드)', queries);
  logTable('📄 상위 유입 페이지', pages);

  await sendEmail(range, queries, pages, totals);
})();
