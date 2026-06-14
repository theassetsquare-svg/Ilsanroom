/**
 * 주간 활동왕 선정 Cron — 매주 일요일 KST 00:00
 * GET /api/cron/weekly-champions?key=CRON_SECRET
 *
 * - 주간 활동왕 5명 선정 (포인트 기준)
 * - 등급 자동 상승
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
  };

  try {
    // 1. 활동왕 TOP 5 선정 (포인트 기준)
    const championsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?select=user_id,nickname,points,level&order=points.desc&limit=5`,
      { headers }
    );
    const champions = championsRes.ok ? await championsRes.json() : [];

    // 2. 전체 사용자 등급 자동 갱신
    const levelThresholds = [
      { min: 1000, level: 'vip' },
      { min: 300, level: 'regular' },
      { min: 50, level: 'member' },
    ];

    let updatedCount = 0;
    for (const threshold of levelThresholds) {
      const res = await fetch(
        `${context.env.SUPABASE_URL}/rest/v1/user_profiles?points=gte.${threshold.min}&level=neq.${threshold.level}` +
        (threshold.min === 300 ? '&points=lt.1000' : '') +
        (threshold.min === 50 ? '&points=lt.300' : ''),
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=headers-only' },
          body: JSON.stringify({ level: threshold.level }),
        }
      );
      if (res.ok) {
        const range = res.headers.get('content-range');
        if (range) {
          const count = parseInt(range.split('/')[1] || '0');
          updatedCount += count;
        }
      }
    }

    // 3. newbie 등급 설정 (50 미만)
    await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?points=lt.50&level=neq.newbie`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ level: 'newbie' }),
      }
    ).catch(() => {});

    return Response.json({
      success: true,
      champions,
      levels_updated: updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
