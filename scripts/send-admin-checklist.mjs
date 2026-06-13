#!/usr/bin/env node
/**
 * 대표님께 GA4 관리자 체크리스트(docs/ga4-admin-checklist.md)를 1회 메일 발송.
 * 시크릿(RESEND_API_KEY/NOTIFICATION_EMAIL)은 GitHub Actions 에만 있으므로 workflow_dispatch 로 실행.
 * 읽기전용: 사이트/데이터 변경 0. 본문은 docs 파일 그대로(가공·창작 0).
 */
import { readFileSync } from 'node:fs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL;
if (!RESEND_API_KEY || !TO) {
  console.error('RESEND_API_KEY / NOTIFICATION_EMAIL 시크릿 누락 — 발송 불가');
  process.exit(1);
}

const md = readFileSync('docs/ga4-admin-checklist.md', 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code style="background:#F3F4F6;padding:1px 5px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#7C3AED">$1</a>')
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1" style="color:#7C3AED">$1</a>');
}

const lines = md.split('\n');
const out = [];
let inList = false;
const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
for (const raw of lines) {
  const l = raw.replace(/\s+$/, '');
  if (/^#{1,3}\s/.test(l)) {
    closeList();
    const lvl = l.match(/^#+/)[0].length;
    const txt = inline(l.replace(/^#+\s/, ''));
    const sz = lvl === 1 ? 22 : lvl === 2 ? 17 : 15;
    out.push(`<h${lvl} style="font-size:${sz}px;margin:18px 0 8px;color:#111">${txt}</h${lvl}>`);
  } else if (/^[-*]\s+/.test(l)) {
    if (!inList) { out.push('<ul style="margin:6px 0;padding-left:22px;color:#333;font-size:14px;line-height:1.7">'); inList = true; }
    out.push(`<li style="margin:3px 0">${inline(l.replace(/^[-*]\s+/, ''))}</li>`);
  } else if (/^\s{2,}[-*]\s+/.test(l)) {
    out.push(`<li style="margin:3px 0;list-style:circle">${inline(l.trim().replace(/^[-*]\s+/, ''))}</li>`);
  } else if (/^>\s?/.test(l)) {
    closeList();
    out.push(`<blockquote style="margin:8px 0;padding:8px 12px;border-left:3px solid #C4B5FD;background:#FAF5FF;color:#555;font-size:13px">${inline(l.replace(/^>\s?/, ''))}</blockquote>`);
  } else if (/^---+$/.test(l)) {
    closeList();
    out.push('<hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">');
  } else if (l.trim() === '') {
    closeList();
  } else {
    closeList();
    out.push(`<p style="margin:6px 0;color:#333;font-size:14px;line-height:1.7">${inline(l)}</p>`);
  }
}
closeList();

const html = `<div style="max-width:680px;margin:0 auto;font-family:-apple-system,'Segoe UI',Roboto,'Apple SD Gothic Neo',sans-serif;padding:8px 4px">
  <div style="background:#7C3AED;color:#fff;padding:14px 18px;border-radius:10px;margin-bottom:14px">
    <div style="font-size:18px;font-weight:700">놀쿨 GA4 — 대표님 관리자 체크리스트</div>
    <div style="font-size:13px;opacity:.9;margin-top:4px">GA4 화면에서 한 번씩 클릭만 하면 끝나는 항목입니다. 코드 쪽(추적·PII 차단·읽기전용 감시)은 자동 완료됐습니다.</div>
  </div>
  ${out.join('\n')}
  <p style="color:#9CA3AF;font-size:11px;margin-top:20px">자동 발송 1회 · 본문=docs/ga4-admin-checklist.md 원문. 측정ID G-W6VE6KHLLD · 속성 540830544.</p>
</div>`;

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'NOLCOOL auto <onboarding@resend.dev>',
    to: [TO],
    subject: '[놀쿨][GA4] 대표님 관리자 체크리스트 — 클릭 한 줄씩 (9단계)',
    html,
  }),
});
console.log('이메일 HTTP', r.status);
if (r.status >= 300) { console.error(await r.text()); process.exit(1); }
console.log('✅ 체크리스트 발송 완료 →', TO);
