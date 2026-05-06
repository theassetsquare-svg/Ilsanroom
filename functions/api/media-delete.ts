/**
 * 단계 3 — 미디어 삭제
 * POST /api/media-delete  { id: string }
 * Header: Authorization: Bearer <admin user JWT>
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const DEFAULT_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';
const DEFAULT_ANON = 'sb_publishable_hjLH8puvrYsVNPt38KROkQ_v99vtC3c';
const ADMIN_EMAILS = ['qotjsdnr123@naver.com', 'theassetsquare@gmail.com'];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = context.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return Response.json({ error: '서버 설정 오류' }, { status: 503 });

  const auth = context.request.headers.get('Authorization') || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) return Response.json({ error: '로그인 필요' }, { status: 401 });

  const anon = context.env.SUPABASE_ANON_KEY || context.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;
  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
  });
  if (!userRes.ok) return Response.json({ error: '인증 실패' }, { status: 401 });
  const user = await userRes.json() as { email?: string };
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return Response.json({ error: '관리자 권한 필요' }, { status: 403 });
  }

  let body: { id?: string };
  try { body = await context.request.json(); }
  catch { return Response.json({ error: '잘못된 요청' }, { status: 400 }); }
  if (!body.id) return Response.json({ error: 'id 필요' }, { status: 400 });

  // 1) DB에서 path 조회
  const sel = await fetch(`${url}/rest/v1/media_library?id=eq.${body.id}&select=bucket,path`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const rows = await sel.json() as Array<{ bucket: string; path: string }>;
  if (!rows.length) return Response.json({ error: '존재하지 않는 미디어' }, { status: 404 });
  const { bucket, path } = rows[0];

  // 2) storage 삭제
  await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });

  // 3) DB 삭제
  await fetch(`${url}/rest/v1/media_library?id=eq.${body.id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });

  return Response.json({ success: true });
};
