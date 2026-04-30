/**
 * 헬스체크 엔드포인트 — 모니터링용
 * GET /api/cron/health
 *
 * 외부 모니터링 서비스(UptimeRobot 등)에서 호출
 * Supabase 연결 상태도 확인
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    worker: true,
  };

  // Supabase 연결 확인
  if (context.env.SUPABASE_URL && context.env.SUPABASE_SERVICE_KEY) {
    try {
      const res = await fetch(
        `${context.env.SUPABASE_URL}/rest/v1/venues?select=id&limit=1`,
        {
          headers: {
            'apikey': context.env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
          },
        }
      );
      checks.supabase = res.ok ? 'connected' : `error_${res.status}`;
    } catch {
      checks.supabase = 'unreachable';
      checks.status = 'degraded';
    }
  } else {
    checks.supabase = 'not_configured';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;

  return Response.json(checks, {
    status: statusCode,
    headers: { 'Cache-Control': 'no-cache' },
  });
};
