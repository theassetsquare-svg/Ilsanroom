/**
 * 단계 3 — 미디어 라이브러리 업로드
 * POST /api/media-upload  (multipart/form-data, field: "file")
 * Header: Authorization: Bearer <admin user JWT>
 *
 * clip-upload와 다른 점: admin 이메일 화이트리스트 검증 + media_library 메타 기록
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
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET = 'post-media';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = context.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return Response.json({ error: '서버 설정 오류 (SUPABASE_SERVICE_KEY 미설정)' }, { status: 503 });
  }

  const auth = context.request.headers.get('Authorization') || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const anon = context.env.SUPABASE_ANON_KEY || context.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;
  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
  });
  if (!userRes.ok) return Response.json({ error: `인증 실패 (${userRes.status})` }, { status: 401 });
  const user = await userRes.json() as { id?: string; email?: string };
  if (!user.id || !user.email) return Response.json({ error: '인증 실패' }, { status: 401 });
  if (!ADMIN_EMAILS.includes(user.email)) return Response.json({ error: '관리자 권한 필요' }, { status: 403 });

  let form: FormData;
  try { form = await context.request.formData(); }
  catch { return Response.json({ error: '잘못된 form 요청' }, { status: 400 }); }

  const file = form.get('file');
  const altText = (form.get('alt_text') as string) || null;
  if (!(file instanceof File)) return Response.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (file.size === 0) return Response.json({ error: '빈 파일' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: '10MB 이하만 업로드 가능' }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) {
    return Response.json({ error: `이미지 파일만 (${file.type})` }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = await file.arrayBuffer();

  const upRes = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type,
      'Cache-Control': '31536000',
    },
    body: buf,
  });
  if (!upRes.ok) {
    const errText = await upRes.text();
    return Response.json({ error: `storage 업로드 실패: ${errText}` }, { status: 500 });
  }

  const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}`;

  // media_library INSERT (service_role)
  const insRes = await fetch(`${url}/rest/v1/media_library`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{
      bucket: BUCKET,
      path,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      alt_text: altText,
      uploaded_by: user.id,
    }]),
  });
  if (!insRes.ok) {
    const errText = await insRes.text();
    // storage는 올라갔지만 메타 실패 → 롤백 시도
    await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    return Response.json({ error: `메타 기록 실패: ${errText}` }, { status: 500 });
  }
  const rows = await insRes.json() as Array<{ id: string }>;

  return Response.json({ success: true, id: rows[0]?.id, path, publicUrl });
};
