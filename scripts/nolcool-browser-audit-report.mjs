#!/usr/bin/env node
/**
 * Browser Audit 결과를 이메일로 발송 (Resend)
 *
 * 사용: node scripts/nolcool-browser-audit-report.mjs <json> <txt>
 *   - json: nolcool-browser-audit.mjs --save 결과 (total_issues, results[])
 *   - txt:  콘솔 로그 텍스트 (안 쓰면 생략 가능)
 *
 * 정책: 기존 9개 알림과 동일 패턴 (onboarding@resend.dev, /admin 링크만)
 */

import { readFileSync, existsSync } from 'node:fs';

const [jsonPath] = process.argv.slice(2);
const RESEND = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL;

if (!RESEND || !TO) {
  console.log('⚠️  RESEND_API_KEY 또는 NOTIFICATION_EMAIL 미설정 — 메일 스킵');
  process.exit(0);
}

if (!jsonPath || !existsSync(jsonPath)) {
  console.log(`⚠️  ${jsonPath} 없음 — 메일 스킵 (audit 실패)`);
  process.exit(0);
}

const report = JSON.parse(readFileSync(jsonPath, 'utf-8'));
const { total_loads = 0, total_issues = 0, stats = {}, results = [] } = report;

const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const status = total_issues === 0 ? '✅ 0 에러' : `🛑 ${total_issues}건`;

const body = [
  `놀쿨 PC+Mobile 풀크롤 ${today}`,
  ``,
  `📊 ${total_loads} loads  /  ${status}`,
  `   CONSOLE: ${stats.CONSOLE || 0}  JS: ${stats.JS || 0}  NET: ${stats.NET || 0}  HTTP: ${stats.HTTP || 0}  LOAD: ${stats.LOAD || 0}`,
  ``,
];

if (results.length) {
  body.push(`📋 이슈 상위 ${Math.min(20, results.length)}:`);
  body.push('');
  for (const r of results.slice(0, 20)) {
    body.push(`[${r.vp}] ${r.url}`);
    for (const i of r.issues.slice(0, 3)) {
      body.push(`  🛑 ${i.sev}: ${i.msg}`);
    }
    body.push('');
  }
  if (results.length > 20) body.push(`… (+${results.length - 20} URL 더)`);
}

body.push('대시보드: https://nolcool.com/admin');

const text = body.join('\n');
const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.6">${text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')}</pre>`;

console.log(text);

const subj = total_issues === 0
  ? `[놀쿨 풀크롤] ${today} ✅ 0 에러 (${total_loads} loads)`
  : `[놀쿨 풀크롤] ${today} 🛑 ${total_issues}건 발견`;

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND}` },
  body: JSON.stringify({
    from: '놀쿨 <onboarding@resend.dev>',
    to: TO,
    subject: subj,
    html,
  }),
});

if (!res.ok) {
  console.error(`❌ Resend ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`\n✅ 메일 발송 → ${TO}`);
