#!/usr/bin/env node
/**
 * Lighthouse 목표 미달 시에만 메일 1통 (자기수렴 — 전부 목표 달성이면 침묵).
 * lighthouse-daily.yml에서 lighthouse-audit.mjs --save 결과(JSON)를 읽어 발송.
 *
 * 목표: a11y / best-practices / seo = 100, perf = mobile 90 / desktop 95.
 * 메일 본문에 페이지×카테고리별 "감점 audit 목록"을 담아 다음 세션에서 바로 수정 가능하게.
 *
 * 환경: RESEND_API_KEY 필수, NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] || '/tmp/lighthouse.json';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

let data;
try { data = JSON.parse(readFileSync(FILE, 'utf8')); }
catch { console.log('결과 JSON 없음 — 발송 스킵'); process.exit(0); }

const failing = data.failing || [];
if (failing.length === 0) { console.log('✅ 전 카테고리 목표 달성 — 메일 침묵'); process.exit(0); }
if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 없음'); process.exit(1); }

const CAT_LABEL = { perf: '성능', a11y: '접근성', bp: '권장사항', seo: '검색엔진 최적화' };
const td = 'border:1px solid #E5E7EB;padding:6px 8px;font-size:12px';
const th = td + ';background:#F9FAFB;font-weight:bold';

const rows = failing.map(f => `<tr>
<td style="${td}">${f.url}</td>
<td style="${td}">${f.formFactor || f.ff}</td>
<td style="${td}">${CAT_LABEL[f.cat] || f.cat}</td>
<td style="${td}"><b>${f.score}</b> / 목표 ${f.goal}</td>
<td style="${td}">${(f.audits || []).slice(0, 6).join('<br>') || '-'}</td>
</tr>`).join('');

const html = `<div style="font-family:sans-serif;max-width:760px;margin:0 auto;padding:20px">
<h2 style="color:#7C3AED">놀쿨 Lighthouse 점수 감시 — 목표 미달 ${failing.length}건</h2>
<p style="color:#666;font-size:12px">${data.ts} · ${data.base} · ${data.total}회 측정 (매일 KST 04:00 자동)</p>
<table style="border-collapse:collapse;width:100%">
<tr><td style="${th}">페이지</td><td style="${th}">기기</td><td style="${th}">카테고리</td><td style="${th}">점수</td><td style="${th}">감점 원인(audit)</td></tr>
${rows}
</table>
<p style="font-size:12px;color:#374151;margin-top:14px">목표: 접근성·권장사항·검색엔진 100 / 성능 모바일 90·PC 95. 전부 달성하면 이 메일은 자동으로 멈춥니다.</p>
</div>`;

const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'NOLCOOL auto <onboarding@resend.dev>',
    to: [TO],
    subject: `[놀쿨][⚠️] Lighthouse 목표 미달 ${failing.length}건 — 감점 audit 상세 포함`,
    html,
  }),
});
console.log('이메일 HTTP', r.status);
if (r.status !== 200) { console.error(await r.text()); process.exit(1); }
