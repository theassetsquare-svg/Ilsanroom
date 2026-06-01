#!/usr/bin/env node
/**
 * Google Search Console — 공용 인증 모듈
 *
 * 우선순위:
 *   1) 서비스계정 (GSC_SA_JSON 환경변수에 키 JSON 전체) — 만료 없음, 권장
 *      로컬: GOOGLE_APPLICATION_CREDENTIALS=/경로/theasset-gsc.json 도 지원
 *   2) OAuth refresh token (GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN) — 폴백
 *
 * getAccessToken() → string | null
 * gscQuery(token, {dimensions, rowLimit, days, startDate, endDate}) → {rows, start, end}
 *
 * 서비스계정 JWT는 RS256 서명을 Node 내장 crypto로 생성하므로 외부 의존성 0.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

export const SITE_PROPERTY = process.env.GSC_SITE_PROPERTY || 'sc-domain:nolcool.com';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadServiceAccount() {
  let raw = process.env.GSC_SA_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON || '';
  if (!raw && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try { raw = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'); } catch { /* ignore */ }
  }
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.type === 'service_account' && sa.private_key && sa.client_email) return sa;
  } catch { /* ignore */ }
  return null;
}

async function tokenFromServiceAccount(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = b64url(signer.sign(sa.private_key));
  const assertion = `${signingInput}.${signature}`;

  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    console.warn('⚠️  서비스계정 토큰 발급 실패:', JSON.stringify(data));
    return null;
  }
  return data.access_token;
}

async function tokenFromOAuth() {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await r.json();
  if (!data.access_token) {
    console.warn('⚠️  OAuth access_token 갱신 실패:', JSON.stringify(data));
    return null;
  }
  return data.access_token;
}

/** 서비스계정 우선, 없으면 OAuth 폴백. 둘 다 없으면 null. */
export async function getAccessToken() {
  const sa = loadServiceAccount();
  if (sa) {
    const t = await tokenFromServiceAccount(sa);
    if (t) {
      console.log(`🔑 GSC 인증: 서비스계정 (${sa.client_email})`);
      return t;
    }
  }
  const oauth = await tokenFromOAuth();
  if (oauth) {
    console.log('🔑 GSC 인증: OAuth refresh token');
    return oauth;
  }
  return null;
}

export function hasGscCredentials() {
  return !!(
    loadServiceAccount() ||
    (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN)
  );
}

const ymd = (d) => d.toISOString().slice(0, 10);

/** searchAnalytics.query 래퍼. days 기본 28, GSC 2일 지연 반영. */
export async function gscQuery(token, { dimensions, rowLimit = 25, days = 28, startDate, endDate } = {}) {
  const end = endDate ? new Date(endDate) : new Date(Date.now() - 2 * 86400 * 1000);
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - days * 86400 * 1000);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    SITE_PROPERTY
  )}/searchAnalytics/query`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: ymd(start), endDate: ymd(end), dimensions, rowLimit }),
  });
  if (!r.ok) {
    console.log(`⚠️  gscQuery(${dimensions?.join(',')}) ${r.status}: ${await r.text().catch(() => '')}`);
    return { rows: [], start: ymd(start), end: ymd(end) };
  }
  const data = await r.json();
  return { rows: data.rows || [], start: ymd(start), end: ymd(end) };
}
