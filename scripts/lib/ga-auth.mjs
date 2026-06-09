#!/usr/bin/env node
/**
 * 놀쿨 GA4 공용 인증 모듈 (GA Data/Admin API).
 *
 * 서비스계정 gsc-mcp@theasset-gsc (GSC와 동일 SA, GH Secret GSC_SA_JSON)을
 * analytics.readonly 스코프로 토큰 발급. 로컬엔 키 없음 → GH Actions에서 동작.
 *
 * 속성ID는 2026-06-09 ga-discover.yml 로 자동 발견 확정:
 *   nolcool = properties/540830544 (측정ID G-W6VE6KHLLD).
 */
import crypto from 'node:crypto';

export const GA_PROPERTY = process.env.GA_PROPERTY_ID || 'properties/540830544';
export const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-W6VE6KHLLD';
// 할당량/청구 프로젝트 override. SA 소속 프로젝트(theasset-gsc/447703608130)는
// 사장님 접근 불가 → 사장님 소유 프로젝트로 Data API 사용량을 돌린다.
// 그 프로젝트에 Data API 사용설정 + SA를 Service Usage Consumer 로 추가해야 작동.
export const GA_QUOTA_PROJECT = process.env.GA_QUOTA_PROJECT || 'theassetsquare-search-console';
// analytics.readonly = Data API 읽기, cloud-platform = quota project(x-goog-user-project) 지정 허용
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/cloud-platform';

function gaHeaders(token) {
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (GA_QUOTA_PROJECT) h['x-goog-user-project'] = GA_QUOTA_PROJECT;
  return h;
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadSA() {
  const raw = process.env.GSC_SA_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON || '';
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.type === 'service_account' && sa.private_key && sa.client_email) return sa;
  } catch { /* ignore */ }
  return null;
}

/** analytics.readonly 액세스 토큰 발급. 실패 시 null. */
export async function getGaToken() {
  const sa = loadSA();
  if (!sa) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: SCOPE,
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput); signer.end();
  const assertion = `${signingInput}.${b64url(signer.sign(sa.private_key))}`;
  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const data = await r.json().catch(() => ({}));
  return data.access_token || null;
}

/** API 에러를 사람이 읽는 사유로 변환 (비활성/권한/전파지연 구분). */
export function gaErrorReason(status, body) {
  const s = JSON.stringify(body || {});
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(s)) {
    const m = s.match(/([a-z]+\.googleapis\.com)/i);
    const pj = s.match(/project[=\s](\d+)/i);
    return `API 비활성 (${m ? m[1] : '해당 API'}${pj ? `, project ${pj[1]}` : ''}) — GCP 콘솔에서 사용 설정 필요`;
  }
  if (status === 403) return '권한 없음(403) — SA 뷰어 추가/전파 확인';
  if (status === 401) return '인증 실패(401)';
  return `HTTP ${status}`;
}

/** GA Data API runReport. {ok, status, body} */
export async function runReport(token, requestBody) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/${GA_PROPERTY}:runReport`, {
    method: 'POST',
    headers: gaHeaders(token),
    body: JSON.stringify(requestBody),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

/** GA Data API runRealtimeReport. {ok, status, body} */
export async function runRealtimeReport(token, requestBody) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/${GA_PROPERTY}:runRealtimeReport`, {
    method: 'POST',
    headers: gaHeaders(token),
    body: JSON.stringify(requestBody),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}
