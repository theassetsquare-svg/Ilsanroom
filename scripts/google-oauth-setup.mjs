#!/usr/bin/env node
/**
 * Google OAuth refresh_token 1회성 발급 (의존성 없음)
 *
 * 사전 셋업 (한번만):
 *   1. https://console.cloud.google.com 새 프로젝트
 *   2. APIs & Services → Library → "Search Console API" + "Web Search Indexing API" 활성화
 *   3. APIs & Services → Credentials → "OAuth client ID" → Web application
 *      Authorized redirect URI: http://localhost:3000/oauth-callback
 *   4. Client ID / Client Secret 복사
 *
 * 실행:
 *   GOOGLE_OAUTH_CLIENT_ID=xxx GOOGLE_OAUTH_CLIENT_SECRET=yyy node scripts/google-oauth-setup.mjs
 *
 * 결과:
 *   콘솔에 refresh_token 출력 → GitHub Secrets `GOOGLE_REFRESH_TOKEN`에 저장
 *   같이 `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`도 Secrets에
 */

import http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT = 'http://localhost:3000/oauth-callback';
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/indexing',
].join(' ');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET 환경변수 필요');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\n🌐 아래 URL을 브라우저에서 열고 Google 계정으로 로그인 + 권한 승인:\n');
console.log(authUrl.toString());
console.log('\n(승인 후 자동으로 localhost:3000 콜백 → refresh_token 출력)\n');

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:3000');
  if (u.pathname !== '/oauth-callback') {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const code = u.searchParams.get('code');
  if (!code) {
    res.end('Missing code');
    return;
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code',
    });
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    if (!data.refresh_token) {
      console.error('❌ refresh_token 없음 — Google 계정에서 앱 권한 해제 후 재시도');
      console.error(data);
      res.end('No refresh_token. Revoke at https://myaccount.google.com/permissions and retry.');
    } else {
      console.log('\n✅ REFRESH TOKEN — GitHub Secrets `GOOGLE_REFRESH_TOKEN` 에 저장:\n');
      console.log(data.refresh_token);
      console.log('\n같이 저장할 Secrets:');
      console.log('  GOOGLE_OAUTH_CLIENT_ID     =', CLIENT_ID);
      console.log('  GOOGLE_OAUTH_CLIENT_SECRET =', CLIENT_SECRET);
      console.log('  GOOGLE_REFRESH_TOKEN       = (위 값)\n');
      res.end('인증 완료. 터미널에서 refresh_token 복사하세요.');
    }
  } catch (e) {
    console.error('❌ 토큰 교환 실패:', e);
    res.end('Token exchange failed: ' + e.message);
  } finally {
    setTimeout(() => server.close(), 1500);
  }
});

server.listen(3000, () => console.log('🎧 localhost:3000 대기 중...\n'));
