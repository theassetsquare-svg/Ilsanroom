/**
 * 시즌70 — Supabase anon key 401 회귀 감시 (24h)
 *
 * 매일 KST 06:50 라이브 번들에서 anon key 추출 → Supabase REST에 ping → 401시 이메일.
 * key 회전/만료 즉시 catch. magazine_articles 외 다른 public 테이블도 추가 가능.
 *
 * 환경:
 *   RESEND_API_KEY     필수
 *   NOTIFICATION_EMAIL 기본 theassetsquare@gmail.com
 */
import https from 'https';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const SUPABASE_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';

function fetchText(url, headers = {}) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ status: 0, body: '' }), 15000);
    https.get(url, { headers: { 'User-Agent': 'NolcoolSupa401Watch/1.0', ...headers } }, r => {
      const chunks = [];
      r.on('data', d => chunks.push(d));
      r.on('end', () => { clearTimeout(t); res({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }); });
    }).on('error', () => { clearTimeout(t); res({ status: 0, body: '' }); });
  });
}

async function extractKeyFromLive() {
  const home = await fetchText('https://nolcool.com/magazine/');
  if (home.status !== 200) return null;
  const jsMatch = home.body.match(/src="(\/assets\/[^"]*\.js)"/);
  if (!jsMatch) return null;
  const js = await fetchText('https://nolcool.com' + jsMatch[1]);
  const keyMatch = js.body.match(/sb_publishable_[A-Za-z0-9_]+/);
  return keyMatch ? keyMatch[0] : null;
}

async function pingSupabase(key) {
  const url = `${SUPABASE_URL}/rest/v1/magazine_articles?select=id&limit=1`;
  return fetchText(url, { apikey: key, Authorization: `Bearer ${key}` });
}

async function main() {
  const key = await extractKeyFromLive();
  if (!key) {
    console.error('anon key 추출 실패 — 라이브 번들 변경됨');
    await sendMail({ ok: false, reason: 'anon key 추출 실패', key: null, status: null });
    process.exit(1);
  }
  console.log('extracted key:', key.slice(0, 24) + '…');

  const ping = await pingSupabase(key);
  console.log('Supabase REST status:', ping.status);

  if (ping.status === 200) {
    console.log('✅ 정상 — 메일 발송 안 함');
    return;
  }

  await sendMail({
    ok: false,
    reason: ping.status === 401 ? 'anon key 401 (만료/회전)' : `Supabase REST ${ping.status}`,
    key, status: ping.status, body: ping.body.slice(0, 200),
  });
  process.exit(1);
}

async function sendMail({ ok, reason, key, status, body }) {
  if (!RESEND_API_KEY) { console.log('RESEND_API_KEY 없음 — 메일 skip'); return; }
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' KST';

  const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:20px">
    <h2 style="color:${ok ? '#16A34A' : '#DC2626'}">[${ok ? '✅ 정상' : '⚠ 회귀'}] Supabase anon key watch</h2>
    <p style="color:#666;font-size:13px">측정 시각: ${kst}</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F3F4F6">사유</td><td style="border:1px solid #E5E7EB;padding:8px;color:#DC2626">${esc(reason)}</td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F3F4F6">key prefix</td><td style="border:1px solid #E5E7EB;padding:8px"><code>${esc((key || '').slice(0, 28))}…</code></td></tr>
      <tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F3F4F6">REST status</td><td style="border:1px solid #E5E7EB;padding:8px"><b>${esc(status)}</b></td></tr>
      ${body ? `<tr><td style="border:1px solid #E5E7EB;padding:8px;background:#F3F4F6">응답</td><td style="border:1px solid #E5E7EB;padding:8px"><pre style="margin:0;font-size:11px">${esc(body)}</pre></td></tr>` : ''}
    </table>
    <h3 style="margin-top:20px">대응</h3>
    <ol style="font-size:13px;line-height:1.6">
      <li>Supabase 대시보드 → Settings → API → publishable/anon key 확인</li>
      <li>새 키 발급 (회전된 경우)</li>
      <li>CF Pages → Settings → Environment Variables → <code>VITE_SUPABASE_ANON_KEY</code> 업데이트</li>
      <li>재배포 (자동 트리거됨)</li>
    </ol>
    <p style="color:#9CA3AF;font-size:11px;margin-top:20px">매일 KST 06:50 자동 — supabase-401-watch.mjs</p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NOLCOOL auto <onboarding@resend.dev>',
      to: [TO],
      subject: `[놀쿨][⚠] Supabase anon key 401 — ${reason}`,
      html,
    }),
  });
  console.log('이메일 HTTP', r.status);
}

main().catch(e => { console.error(e); process.exit(1); });
