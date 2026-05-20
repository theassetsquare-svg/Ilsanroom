#!/usr/bin/env node
/**
 * CrUX 일일 리포트 메일 — Resend 경유
 *
 * 어제 수집된 crux_data + 어제 RUM 평균 → 관리자 메일 1통.
 * Lab 점수는 무시. 실사용자 p75만 보고.
 *
 * 환경변수:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   RESEND_API_KEY
 *   NOTIFICATION_EMAIL  — 관리자 메일 (e.g. theassetsquare@gmail.com)
 *
 * v28.0 (2026-05-20)
 */

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL;

if (!SUPA_URL || !SUPA_KEY) {
  console.error('❌ Supabase env 없음');
  process.exit(1);
}

async function q(path) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!res.ok) {
    console.error(`Supabase ${path} → ${res.status}`);
    return [];
  }
  return res.json();
}

function avg(arr, key) {
  const xs = arr.map((r) => r[key]).filter((v) => v != null && !Number.isNaN(Number(v)));
  if (xs.length === 0) return null;
  return Math.round(xs.reduce((a, b) => a + Number(b), 0) / xs.length);
}

function fAvg(arr, key) {
  const xs = arr.map((r) => r[key]).filter((v) => v != null);
  if (xs.length === 0) return null;
  return Number((xs.reduce((a, b) => a + Number(b), 0) / xs.length).toFixed(3));
}

function rate(value, good, ni) {
  if (value == null) return '⚪ NoData';
  if (value <= good) return '✅ Good';
  if (value <= ni) return '⚠️ Improve';
  return '❌ Poor';
}

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todayRows = await q(`crux_data?collected_at=gte.${today}T00:00:00`);
  const mobile = todayRows.filter((r) => r.form_factor === 'PHONE');
  const desktop = todayRows.filter((r) => r.form_factor === 'DESKTOP');

  // RUM (어제 24h)
  const rumRows = await q(`web_vitals_rum?created_at=gte.${yest}T00:00:00&created_at=lt.${today}T00:00:00&limit=10000`);
  const rumMobile = rumRows.filter((r) => r.device === 'mobile');
  const rumDesktop = rumRows.filter((r) => r.device === 'desktop');

  const m = {
    lcp: avg(mobile, 'lcp_p75'),
    cls: fAvg(mobile, 'cls_p75'),
    inp: avg(mobile, 'inp_p75'),
  };
  const d = {
    lcp: avg(desktop, 'lcp_p75'),
    cls: fAvg(desktop, 'cls_p75'),
    inp: avg(desktop, 'inp_p75'),
  };

  const rumByMetric = (rows, name) => {
    const xs = rows.filter((r) => r.metric_name === name).map((r) => Number(r.value));
    if (xs.length === 0) return null;
    return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  };

  const lines = [
    `놀쿨 CrUX + RUM 일일 리포트 (${today})`,
    `Lab 점수 무시 — Google 검색 순위 기준은 실사용자 p75`,
    ``,
    `[CrUX p75 모바일 평균]  타깃 ${mobile.length}개`,
    `  LCP: ${m.lcp ?? '-'}ms  ${rate(m.lcp, 2500, 4000)}`,
    `  CLS: ${m.cls ?? '-'}     ${rate(m.cls, 0.1, 0.25)}`,
    `  INP: ${m.inp ?? '-'}ms  ${rate(m.inp, 200, 500)}`,
    ``,
    `[CrUX p75 PC 평균]  타깃 ${desktop.length}개`,
    `  LCP: ${d.lcp ?? '-'}ms  ${rate(d.lcp, 2500, 4000)}`,
    `  CLS: ${d.cls ?? '-'}     ${rate(d.cls, 0.1, 0.25)}`,
    `  INP: ${d.inp ?? '-'}ms  ${rate(d.inp, 200, 500)}`,
    ``,
    `[RUM 어제 24h 평균]  샘플 모바일 ${rumMobile.length} / PC ${rumDesktop.length}`,
    `  모바일 LCP: ${rumByMetric(rumMobile, 'LCP') ?? '-'}ms`,
    `  모바일 CLS: ${rumByMetric(rumMobile, 'CLS') ?? '-'}`,
    `  모바일 INP: ${rumByMetric(rumMobile, 'INP') ?? '-'}ms`,
    `  PC LCP: ${rumByMetric(rumDesktop, 'LCP') ?? '-'}ms`,
    ``,
    `결론: 실사용자 경험 (CrUX/RUM) > Lab 점수`,
    `대시보드: https://nolcool.com/admin/audit`,
  ];

  const body = lines.join('\n');
  console.log(body);

  if (!RESEND || !TO) {
    console.log('\n(RESEND_API_KEY 또는 NOTIFICATION_EMAIL 없음 → 메일 skip)');
    return;
  }

  const subj = `[놀쿨 CrUX] ${today} 모바일 LCP ${m.lcp ?? '-'}ms / CLS ${m.cls ?? '-'} / INP ${m.inp ?? '-'}ms`;
  const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.6">${body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</pre>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND}` },
    body: JSON.stringify({
      from: 'NOLCOOL <noreply@nolcool.com>',
      to: TO,
      subject: subj,
      html,
    }),
  });

  if (!res.ok) {
    console.error(`❌ Resend ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`\n✅ 메일 발송 완료 → ${TO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
