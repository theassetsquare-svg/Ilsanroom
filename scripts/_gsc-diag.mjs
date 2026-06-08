#!/usr/bin/env node
// TEMP 진단 — SA 접근 가능 GSC 속성 목록 + OAuth 상태. 실행 후 삭제.
import crypto from 'node:crypto';

const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  const raw = process.env.GSC_SA_JSON || '';
  if (!raw) return null;
  try { const sa = JSON.parse(raw); return sa.client_email && sa.private_key ? sa : null; } catch { return null; }
}

async function saToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const si = `${head}.${claim}`;
  const s = crypto.createSign('RSA-SHA256'); s.update(si); s.end();
  const assertion = `${si}.${b64url(s.sign(sa.private_key))}`;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  return r.json();
}

(async () => {
  const sa = loadSA();
  console.log('=== SA ===', sa ? sa.client_email : 'NONE');
  if (sa) {
    const t = await saToken(sa);
    if (!t.access_token) { console.log('SA token FAIL', JSON.stringify(t)); }
    else {
      console.log('SA token OK');
      const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${t.access_token}` } });
      const d = await r.json();
      console.log('SA sites.list status', r.status);
      console.log('SA accessible properties:', JSON.stringify(d.siteEntry || d));
    }
  }
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_REFRESH_TOKEN) {
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: GOOGLE_OAUTH_CLIENT_ID, client_secret: GOOGLE_OAUTH_CLIENT_SECRET, refresh_token: GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }) });
    const d = await r.json();
    console.log('=== OAuth refresh ===', r.status, d.access_token ? 'OK' : JSON.stringify(d));
  } else console.log('=== OAuth === secrets missing');
})();
