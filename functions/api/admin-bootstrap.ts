/**
 * 관리자 계정 자동 보장 — 비밀번호 게이트 통과 시 호출
 * POST /api/admin-bootstrap  body: {pin: string}
 *
 * 동작:
 *  1) pin이 ADMIN_PIN과 일치하는지 검증
 *  2) service_role로 관리자 이메일 사용자 보장 (없으면 생성, 있으면 비번 갱신)
 *  3) 클라이언트가 그 자격증명으로 signInWithPassword 가능하도록 응답
 *
 * 보안: pin이 맞아야만 자격증명을 반환. pin은 클라 번들에 노출되지만
 * 단일 운영자 관리자 패널이라 수용 (사용자 명시적 trade-off).
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY: string;
}

const DEFAULT_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';
const ADMIN_PIN = 'nolcool2026';
const ADMIN_EMAIL = 'theassetsquare@gmail.com';
const ADMIN_PASSWORD = 'NolcoolAdmin2026!Auto';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = context.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return Response.json({ error: '서버 설정 오류 (SUPABASE_SERVICE_KEY 미설정)' }, { status: 503 });
  }

  let body: { pin?: string };
  try { body = await context.request.json(); } catch { body = {}; }
  if (body.pin !== ADMIN_PIN) {
    return Response.json({ error: '관리자 PIN 불일치' }, { status: 403 });
  }

  const adminHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // 1) 기존 사용자 조회 (이메일로)
  const listRes = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, {
    headers: adminHeaders,
  });
  if (!listRes.ok) {
    const t = await listRes.text();
    return Response.json({ error: `사용자 조회 실패 (${listRes.status})`, detail: t.slice(0, 300) }, { status: 500 });
  }
  const listJson = await listRes.json() as { users?: Array<{ id: string; email?: string }> };
  const existing = listJson.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (existing) {
    // 2a) 비번 갱신 + 이메일 인증
    const updRes = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ password: ADMIN_PASSWORD, email_confirm: true }),
    });
    if (!updRes.ok) {
      const t = await updRes.text();
      return Response.json({ error: `비번 갱신 실패 (${updRes.status})`, detail: t.slice(0, 300) }, { status: 500 });
    }
  } else {
    // 2b) 신규 생성
    const crRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      }),
    });
    if (!crRes.ok) {
      const t = await crRes.text();
      return Response.json({ error: `사용자 생성 실패 (${crRes.status})`, detail: t.slice(0, 300) }, { status: 500 });
    }
  }

  return Response.json({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
};
