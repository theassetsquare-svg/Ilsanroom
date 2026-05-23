/**
 * keyword-seo-monitor 워크플로가 매일 cron으로 잘 도는지 감시.
 * 최근 26h 내 success run 없으면 alert 메일.
 */
import https from 'https';

const REPO = 'theassetsquare-svg/Ilsanroom';
const WORKFLOW = 'keyword-seo-monitor.yml';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = process.env.NOTIFICATION_EMAIL || 'theassetsquare@gmail.com';
const TOKEN = process.env.GITHUB_TOKEN;

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'nolcool-watchdog' }
    }, r => {
      let s = ''; r.on('data', d => s += d); r.on('end', () => res({ status: r.statusCode, body: s }));
    }).on('error', rej);
  });
}

async function sendMail(subject, html) {
  if (!RESEND_API_KEY) { console.log('::warning::RESEND_API_KEY 미설정'); return; }
  await new Promise((res, rej) => {
    const body = JSON.stringify({ from: 'onboarding@resend.dev', to: [TO], subject, html });
    const r = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, resp => { let s=''; resp.on('data',d=>s+=d); resp.on('end',()=>{console.log('메일 발송 HTTP',resp.statusCode);res();}); });
    r.on('error', rej); r.write(body); r.end();
  });
}

const r = await get(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5`);
const j = JSON.parse(r.body);
const runs = j.workflow_runs || [];
const now = Date.now();
const cutoff = now - 26 * 3600 * 1000;
const recent = runs.filter(x => new Date(x.created_at).getTime() > cutoff);
const success = recent.filter(x => x.conclusion === 'success');

console.log(`최근 26h run: ${recent.length}, success: ${success.length}`);
recent.forEach(x => console.log(` - #${x.run_number} ${x.created_at} ${x.conclusion || x.status}`));

if (success.length === 0) {
  await sendMail('[놀쿨] ⚠️ keyword-seo-monitor 24h 무발화 alert',
    `<h2>SEO 키워드 모니터 cron 발화 누락</h2>
<p>최근 26h 내 keyword-seo-monitor 워크플로 success run이 0건입니다.</p>
<p>최근 run 목록:</p><ul>${recent.map(x=>`<li>#${x.run_number} ${x.created_at} — ${x.conclusion||x.status} — <a href="${x.html_url}">로그</a></li>`).join('') || '<li>(없음)</li>'}</ul>
<p><a href="https://github.com/${REPO}/actions/workflows/${WORKFLOW}">워크플로 확인</a></p>`);
  process.exit(1);
} else {
  console.log('✅ 정상 — 24h 이내 success run 확인');
}
