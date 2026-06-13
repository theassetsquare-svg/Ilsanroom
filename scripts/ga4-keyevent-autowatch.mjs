#!/usr/bin/env node
/**
 * GA4 핵심 이벤트 자동 감시 (★읽기전용 — 설정 변경 0).
 *
 * 목표 5개 이벤트(post_create / invite_open / search / search_no_result / share)가
 * 사이트에서 ★실제로 발생하기 시작했는지를 매일 GET 으로 점검한다.
 *   - 발생O + 아직 핵심이벤트 미지정  → "지금 지정하세요" 메일 (지정 대기)
 *   - 발생O + 이미 핵심이벤트          → 침묵 (할 일 없음 = 자기수렴)
 *   - 발생X                            → 침묵 (그 행동이 일어날 때까지 대기)
 *
 * 왜 자동으로 안 찍나: 핵심이벤트 지정은 GA 쓰기(편집자) 권한이 필요한데,
 *   자동화에 상시 쓰기권한을 주면 "쓰기권한0=조작불가"(#1 안전선)가 깨진다.
 *   그래서 SA는 뷰어 고정, 감지는 자동·지정은 사람 10초(편집자→apply→뷰어).
 *   가짜 이벤트 주입은 0 — 진짜 발생만 보고 알린다(Google 활동조작 페널티 회피).
 *
 * 인증: GH Secret GSC_SA_JSON. 메일: RESEND_API_KEY / NOTIFICATION_EMAIL.
 * cron(매일) + workflow_dispatch. SA 스코프=analytics.readonly → GET/runReport 만.
 */
import { getGaToken, runReport, GA_PROPERTY, GA_QUOTA_PROJECT } from './lib/ga-auth.mjs';

const ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const PID = GA_PROPERTY.replace(/^properties\//, '');
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';

// 사이트 코드가 발송하도록 배선된 목표 5개 (GA4 권장/커스텀 이벤트명).
const TARGETS = ['post_create', 'invite_open', 'search', 'search_no_result', 'share'];

function kst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' KST';
}
function hdrs(token) {
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (GA_QUOTA_PROJECT) h['x-goog-user-project'] = GA_QUOTA_PROJECT;
  return h;
}
async function adminGet(token, path) {
  const r = await fetch(`${ADMIN}/${path}`, { headers: hdrs(token) });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

async function sendPendingMail(pending, firedCounts) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const rows = pending.map((e) => `<li><b>${e}</b> — 발생 ${firedCounts[e] || 0}회(28일) · 아직 핵심이벤트 아님</li>`).join('');
  const html = `<div style="font-family:sans-serif;padding:20px;max-width:640px">
    <h2 style="color:#0F766E;margin:0 0 8px">🔔 핵심 이벤트 지정 대기 ${pending.length}건</h2>
    <p style="color:#444;margin:0 0 12px">아래 이벤트가 사이트에서 ★실제로 발생하기 시작했습니다. 지금 핵심 이벤트로 지정하면 전환으로 집계됩니다.</p>
    <ul style="color:#222;line-height:1.8">${rows}</ul>
    <div style="background:#F0FDFA;border:1px solid #99F6E4;border-radius:10px;padding:14px;margin-top:12px">
      <b>지정 방법 (10초, 안전선 유지)</b>
      <ol style="color:#333;line-height:1.8;margin:8px 0 0;padding-left:18px">
        <li>GA4 → 관리 → 속성 액세스 관리에서 SA(<code>gsc-mcp@theasset-gsc...</code>)를 <b>뷰어 → 편집자</b></li>
        <li>GitHub Actions → <b>GA4 Admin Apply</b> 워크플로 Run (이미 발생한 것만 자동 지정)</li>
        <li>다시 <b>편집자 → 뷰어</b> 복귀 → 쓰기권한0 안전선 복원</li>
      </ol>
    </div>
    <p style="color:#888;font-size:12px;margin-top:14px">※ 읽기전용 감시기가 자동 발송 — 지정 끝나면 이 메일은 자동으로 안 옵니다(자기수렴). ${kst()}</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>', to: [TO],
      subject: `[놀쿨][GA4] 핵심 이벤트 지정 대기 ${pending.length}건 — ${pending.join(', ')}`,
      html,
    }),
  });
  console.log('지정대기 메일 HTTP', r.status);
}

async function main() {
  const token = await getGaToken();
  if (!token) { console.error('❌ GA 토큰 발급 실패 (GSC_SA_JSON 확인)'); process.exit(1); }
  console.log(`🔑 GA 인증 OK · 속성 ${GA_PROPERTY} · 읽기전용 감시(지정 변경 0)\n`);

  // 1) 이미 핵심이벤트로 지정된 것
  const ke = await adminGet(token, `properties/${PID}/keyEvents`);
  if (!ke.ok) { console.error(`keyEvents 읽기 실패 — ${ke.status}`); process.exit(0); }
  const marked = (ke.body.keyEvents || []).map((k) => k.eventName);

  // 2) 실제 발생한 이벤트(28일) + 발생횟수
  const ev = await runReport(token, {
    dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    limit: 200,
  });
  if (!ev.ok) { console.error('이벤트 발생현황 읽기 실패'); process.exit(0); }
  const firedCounts = {};
  for (const row of (ev.body.rows || [])) firedCounts[row.dimensionValues[0].value] = Number(row.metricValues[0].value);

  const pending = TARGETS.filter((e) => firedCounts[e] > 0 && !marked.includes(e));
  const doneTargets = TARGETS.filter((e) => marked.includes(e));
  const notFired = TARGETS.filter((e) => !(firedCounts[e] > 0) && !marked.includes(e));

  console.log(`【지정됨】 ${doneTargets.length ? doneTargets.join(', ') : '(없음)'}`);
  console.log(`【지정 대기】 발생O·미지정: ${pending.length ? pending.join(', ') : '(없음)'}`);
  console.log(`【발생 대기】 아직 미발생: ${notFired.length ? notFired.join(', ') : '(없음)'}`);

  if (pending.length) await sendPendingMail(pending, firedCounts);
  else console.log('\n✅ 지정 대기 0건 — 메일 침묵(자기수렴). 미발생 항목은 그 행동이 일어날 때까지 대기.');
}
main().catch((e) => { console.error('autowatch error:', e.message); process.exit(1); });
