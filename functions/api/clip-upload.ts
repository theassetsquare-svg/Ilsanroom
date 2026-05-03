/**
 * 클립 이미지 업로드 — service_role로 storage.objects RLS 우회
 * POST /api/clip-upload  (multipart/form-data, field: "file")
 * Header: Authorization: Bearer <user JWT>
 *
 * 호스팅된 Supabase는 storage.objects 정책을 SQL로 추가할 수 없어
 * (must be owner of table objects), 서버에서 service_role로 업로드 처리.
 *
 * 환경변수 (Cloudflare 대시보드):
 *   SUPABASE_URL          (없으면 기본값)
 *   SUPABASE_SERVICE_KEY  (RLS 우회용 secret 키)
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const DEFAULT_URL = 'https://rkqnblbajhnehmxfnvri.supabase.co';
const DEFAULT_ANON = 'sb_publishable_hjLH8puvrYsVNPt38KROkQ_v99vtC3c';
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = context.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    return Response.json({ error: '서버 설정 오류 (SUPABASE_SERVICE_KEY 미설정)' }, { status: 503 });
  }

  // 1) 사용자 JWT 검증
  const auth = context.request.headers.get('Authorization') || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const anon = context.env.SUPABASE_ANON_KEY || context.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;
  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
  });
  if (!userRes.ok) return Response.json({ error: '인증 실패' }, { status: 401 });
  const user = await userRes.json() as { id?: string };
  if (!user.id) return Response.json({ error: '인증 실패' }, { status: 401 });

  // 2) 파일 추출
  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return Response.json({ error: '잘못된 form 요청' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: '파일이 없습니다.' }, { status: 400 });
  if (file.size === 0) return Response.json({ error: '빈 파일' }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: '10MB 이하만 업로드 가능' }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) {
    return Response.json({ error: `이미지 파일만 업로드 가능 (${file.type})` }, { status: 400 });
  }

  // 3) service_role로 storage 업로드
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `clips/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buf = await file.arrayBuffer();
  const upRes = await fetch(`${url}/storage/v1/object/post-media/${path}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type,
      'Cache-Control': '3600',
    },
    body: buf,
  });

  if (!upRes.ok) {
    const errText = await upRes.text();
    return Response.json({ error: `업로드 실패: ${errText}` }, { status: 500 });
  }

  const publicUrl = `${url}/storage/v1/object/public/post-media/${path}`;
  return Response.json({ success: true, path, publicUrl });
};
