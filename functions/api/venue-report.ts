/**
 * 시즌64 — venue 폐업/오정보 신고 접수 (anti-abuse 8중 방어)
 * POST /api/venue-report
 * Body (JSON):
 *   { venueSlug, reason, evidenceUrl, memo?, fingerprint, hp?, turnstileToken? }
 *
 * 방어 레이어:
 *   1. Rate limit: IP 1일 3건 / fingerprint 1일 3건
 *   2. Cooldown: 같은 venue × 같은 fingerprint 7일 1회
 *   3. Evidence URL 길이 ≥10 + 형식 검사
 *   4. Honeypot: hp 필드 비어있어야 함 (봇은 채움)
 *   5. Turnstile: 토큰 검증 (CF_TURNSTILE_SECRET 있을 때만)
 *   6. Shadowban: reporter_trust.shadowbanned=true면 200 + 가짜 성공 (DB insert X)
 *   7. Reason whitelist
 *   8. Fingerprint min 길이 검사
 *
 * 환경:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY (필수)
 *   CF_TURNSTILE_SECRET (선택)
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY: string;
  CF_TURNSTILE_SECRET?: string;
}

const DEFAULT_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';
const VALID_REASONS = new Set(['closed', 'wrong_info', 'duplicate', 'scam', 'other']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function sbQuery(url: string, key: string, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'content-type': 'application/json',
    Prefer: 'return=representation',
    ...(init.headers as Record<string, string> || {}),
  };
  return fetch(`${url}/rest/v1${path}`, { ...init, headers });
}

async function verifyTurnstile(secret: string, token: string, ip: string) {
  if (!secret || !token) return true;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`,
    });
    const j = await r.json() as { success?: boolean };
    return !!j.success;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = context.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return json({ error: '서버 설정 오류' }, 503);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: '잘못된 요청 형식' }, 400);
  }

  const venueSlug = String(body.venueSlug || '').trim().toLowerCase();
  const reason = String(body.reason || '').trim();
  const evidenceUrl = String(body.evidenceUrl || '').trim();
  const memo = String(body.memo || '').trim().slice(0, 500);
  const fingerprint = String(body.fingerprint || '').trim().slice(0, 200);
  const hp = String(body.hp || '');
  const turnstileToken = String(body.turnstileToken || '');

  // 1) Honeypot — 봇은 hp 필드를 채움. 진짜 사용자는 빈 값
  if (hp.length > 0) return json({ ok: true, ack: 'received' });

  // 2) 기본 검증
  if (!venueSlug || venueSlug.length > 100) return json({ error: 'venue_slug invalid' }, 400);
  if (!VALID_REASONS.has(reason)) return json({ error: 'reason invalid' }, 400);
  if (evidenceUrl.length < 10) return json({ error: '증거(사진/링크) URL은 10자 이상 필수' }, 400);
  if (!/^https?:\/\//i.test(evidenceUrl)) return json({ error: '증거 URL은 http/https로 시작' }, 400);
  if (fingerprint.length < 8) return json({ error: 'fingerprint 너무 짧음' }, 400);

  // 3) Turnstile (있을 때만)
  const ip = context.request.headers.get('CF-Connecting-IP') || context.request.headers.get('X-Forwarded-For') || '0.0.0.0';
  if (context.env.CF_TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(context.env.CF_TURNSTILE_SECRET, turnstileToken, ip);
    if (!ok) return json({ error: 'Turnstile 검증 실패' }, 403);
  }

  // 4) Shadowban 검사 — true면 가짜 성공 반환 (DB insert X)
  const trustRes = await sbQuery(url, serviceKey, `/reporter_trust?fingerprint=eq.${encodeURIComponent(fingerprint)}&select=score,shadowbanned`, { method: 'GET' });
  if (trustRes.ok) {
    const arr = await trustRes.json() as any[];
    if (arr.length > 0 && arr[0].shadowbanned) {
      return json({ ok: true, ack: 'received' });
    }
  }

  // 5) Rate limit — IP·fingerprint 1일 3건
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const ipCntRes = await sbQuery(url, serviceKey, `/venue_reports?reporter_ip=eq.${encodeURIComponent(ip)}&created_at=gte.${since24h}&select=id`, { method: 'GET' });
  if (ipCntRes.ok) {
    const arr = await ipCntRes.json() as any[];
    if (arr.length >= 3) return json({ error: '1일 신고 한도(3건) 초과', code: 'rate_limit_ip' }, 429);
  }
  const fpCntRes = await sbQuery(url, serviceKey, `/venue_reports?reporter_fingerprint=eq.${encodeURIComponent(fingerprint)}&created_at=gte.${since24h}&select=id`, { method: 'GET' });
  if (fpCntRes.ok) {
    const arr = await fpCntRes.json() as any[];
    if (arr.length >= 3) return json({ error: '1일 신고 한도(3건) 초과', code: 'rate_limit_fp' }, 429);
  }

  // 6) Cooldown — 같은 venue × 같은 fingerprint 7일
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const cdRes = await sbQuery(url, serviceKey, `/venue_reports?venue_slug=eq.${encodeURIComponent(venueSlug)}&reporter_fingerprint=eq.${encodeURIComponent(fingerprint)}&created_at=gte.${since7d}&select=id`, { method: 'GET' });
  if (cdRes.ok) {
    const arr = await cdRes.json() as any[];
    if (arr.length > 0) return json({ error: '동일 업소 7일 1회만 신고 가능', code: 'cooldown' }, 429);
  }

  // 7) Insert
  const insertRes = await sbQuery(url, serviceKey, `/venue_reports`, {
    method: 'POST',
    body: JSON.stringify({
      venue_slug: venueSlug,
      reason,
      evidence_url: evidenceUrl,
      memo: memo || null,
      reporter_ip: ip,
      reporter_fingerprint: fingerprint,
      status: 'pending',
    }),
  });
  if (!insertRes.ok) {
    const txt = await insertRes.text();
    return json({ error: 'DB insert 실패', detail: txt.slice(0, 200) }, 500);
  }

  // 8) reporter_trust upsert (last_seen 갱신)
  await sbQuery(url, serviceKey, `/reporter_trust`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ fingerprint, total_reports: 1 }),
  }).catch(() => {});

  return json({ ok: true, message: '신고가 접수되었습니다. 검토 후 24~72h 내 처리됩니다.' });
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
};
