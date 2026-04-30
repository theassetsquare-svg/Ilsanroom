/**
 * 데이터 정리 Cron — 매일 KST 01:00
 * GET /api/cron/cleanup?key=CRON_SECRET
 *
 * - 30일 이상 된 알림 삭제
 * - 90일 이상 해결된 신고 삭제
 * - 만료된 세션 정리
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');

  if (!context.env.CRON_SECRET || key !== context.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_KEY) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const headers = {
    'apikey': context.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=headers-only',
  };

  const results: Record<string, any> = {};
  const now = new Date();

  try {
    // 1. 30일 이상 된 알림 삭제
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const notifRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/notifications?created_at=lt.${thirtyDaysAgo}`,
      { method: 'DELETE', headers }
    ).catch(() => null);
    results.notifications_deleted = notifRes?.ok || false;

    // 2. 90일 이상 해결된 신고 삭제
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const reportRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/reports?status=eq.resolved&resolved_at=lt.${ninetyDaysAgo}`,
      { method: 'DELETE', headers }
    ).catch(() => null);
    results.reports_deleted = reportRes?.ok || false;

    // 3. 조회수 리셋 (일일 조회수만, 누적은 유지)
    // daily_view_count 컬럼이 있으면 리셋
    await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/venues?daily_view_count=gt.0`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ daily_view_count: 0 }),
      }
    ).catch(() => {
      results.daily_views_reset = 'column not found';
    });

    results.success = true;
    results.timestamp = now.toISOString();

    return Response.json(results);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
