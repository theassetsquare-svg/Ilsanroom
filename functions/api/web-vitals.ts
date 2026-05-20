/**
 * RUM 수신 — web_vitals_rum 테이블 INSERT
 * POST /api/web-vitals  (sendBeacon)
 *
 * 환경변수:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY  — service_role (RLS 우회)
 *
 * v28.0 (2026-05-20)
 */

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface RumPayload {
  metric_name?: string;
  value?: number;
  rating?: string;
  navigation_type?: string;
  page?: string;
  viewport_width?: number;
  viewport_height?: number;
  device_memory?: number | null;
  connection?: string | null;
  device?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let data: RumPayload;
  try {
    data = await context.request.json();
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  if (!data?.metric_name || typeof data.value !== 'number') {
    return new Response('Missing fields', { status: 400 });
  }

  // page 길이 가드 (악성 페이로드 차단)
  const safe = {
    metric_name: String(data.metric_name).slice(0, 16),
    value: data.value,
    rating: data.rating ? String(data.rating).slice(0, 24) : null,
    navigation_type: data.navigation_type ? String(data.navigation_type).slice(0, 32) : null,
    page: data.page ? String(data.page).slice(0, 256) : null,
    viewport_width: data.viewport_width ?? null,
    viewport_height: data.viewport_height ?? null,
    device_memory: data.device_memory ?? null,
    connection: data.connection ? String(data.connection).slice(0, 16) : null,
    device: data.device ? String(data.device).slice(0, 16) : null,
  };

  try {
    await fetch(`${context.env.VITE_SUPABASE_URL}/rest/v1/web_vitals_rum`, {
      method: 'POST',
      headers: {
        apikey: context.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(safe),
    });
  } catch {
    /* 수집 실패는 사용자 응답에 영향 X */
  }

  return new Response(null, { status: 204 });
};
