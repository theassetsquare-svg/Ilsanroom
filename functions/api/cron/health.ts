/**
 * 헬스체크 — 사이트 다운 시 이메일 알림
 * GET /api/cron/health
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
}

async function alertDown(env: Env, issue: string) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL) return;
  const kst = new Date(Date.now() + 9 * 3600000).toLocaleString('ko-KR');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: '놀쿨 <onboarding@resend.dev>',
      to: [env.NOTIFICATION_EMAIL],
      subject: `[놀쿨] 사이트 이상 감지`,
      html: `<div style="font-family:sans-serif">
        <h2 style="color:#dc2626">사이트 이상 감지</h2>
        <p><strong>문제:</strong> ${issue}</p>
        <p><strong>시간:</strong> ${kst}</p>
        <p>즉시 확인해주세요.</p>
        <a href="https://nolcool.com" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;margin-top:12px">사이트 확인</a>
      </div>`,
    }),
  }).catch(() => {});
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    worker: true,
  };

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
      if (!res.ok) {
        checks.status = 'degraded';
        await alertDown(context.env, `Supabase 응답 오류 (${res.status})`);
      }
    } catch (err: any) {
      checks.supabase = 'unreachable';
      checks.status = 'degraded';
      await alertDown(context.env, `Supabase 연결 불가: ${err?.message}`);
    }
  } else {
    checks.supabase = 'not_configured';
  }

  return Response.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-cache' },
  });
};
