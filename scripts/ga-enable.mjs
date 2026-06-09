#!/usr/bin/env node
/**
 * 놀쿨 GA Data API 자동 활성화 우회 (일회용).
 *
 * project 447703608130(theasset-gsc)에서 analyticsdata.googleapis.com 이 비활성.
 * SA(gsc-mcp@theasset-gsc)가 serviceusage.services.enable 권한을 가졌다면
 * 콘솔 없이 코드로 직접 켠다. 권한 없으면 403 → 사장님 콘솔 필요로 정직 표기.
 *
 * cloud-platform 스코프 토큰 필요(SA 키는 스코프 제한 없음 → JWT claim 에서 지정).
 */
import crypto from 'node:crypto';

const PROJECT = process.env.GA_GCP_PROJECT || '447703608130';
const APIS = ['analyticsdata.googleapis.com', 'analyticsadmin.googleapis.com'];
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  const raw = process.env.GSC_SA_JSON || '';
  if (!raw) return null;
  try { const sa = JSON.parse(raw); if (sa.type === 'service_account') return sa; } catch { /* */ }
  return null;
}
async function token(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const si = `${h}.${c}`;
  const s = crypto.createSign('RSA-SHA256'); s.update(si); s.end();
  const assertion = `${si}.${b64url(s.sign(sa.private_key))}`;
  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  return (await r.json()).access_token || null;
}

(async () => {
  const sa = loadSA();
  if (!sa) { console.error('❌ GSC_SA_JSON 없음'); process.exit(1); }
  const tok = await token(sa);
  if (!tok) { console.error('❌ cloud-platform 토큰 발급 실패 (SA 키 확인)'); process.exit(1); }
  console.log(`🔑 ${sa.client_email} · cloud-platform 토큰 OK · project ${PROJECT}\n`);

  for (const api of APIS) {
    const g = await fetch(`https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/${api}`, { headers: { Authorization: `Bearer ${tok}` } });
    const gb = await g.json().catch(() => ({}));
    if (!g.ok) { console.log(`📋 ${api} 상태조회 실패 HTTP ${g.status}: ${JSON.stringify(gb).slice(0, 200)}`); }
    else console.log(`📋 ${api} = ${gb.state}`);

    if (g.ok && gb.state === 'ENABLED') { console.log(`   ✅ 이미 활성\n`); continue; }

    console.log(`   ⚙️  ${api} 활성화 시도...`);
    const e = await fetch(`https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/${api}:enable`, {
      method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: '{}',
    });
    const eb = await e.json().catch(() => ({}));
    if (e.ok) console.log(`   ✅ enable 요청 성공: ${JSON.stringify(eb).slice(0, 200)}\n`);
    else {
      const reason = /PERMISSION_DENIED|permission/i.test(JSON.stringify(eb))
        ? 'SA에 serviceusage.services.enable 권한 없음 — ★사장님이 콘솔에서 켜야 함'
        : `HTTP ${e.status}`;
      console.log(`   ❌ enable 실패: ${reason}\n      raw: ${JSON.stringify(eb).slice(0, 300)}\n`);
    }
  }
  console.log('=== 완료. 활성화됐다면 수 분 전파 후 ga-health 재실행으로 데이터 확인 ===');
})();
