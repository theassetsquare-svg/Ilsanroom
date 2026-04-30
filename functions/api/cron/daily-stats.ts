/**
 * 일일 통계 계산 Cron — KST 06:00 실행
 * GET /api/cron/daily-stats?key=CRON_SECRET
 *
 * 환경변수 (Cloudflare 대시보드):
 *   SUPABASE_URL         — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_KEY  — Supabase service_role 키
 *   CRON_SECRET           — Cron 호출 인증 키
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
}

async function supabaseRPC(env: Env, path: string, options?: RequestInit) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res;
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

  const results: Record<string, any> = {};
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayISO = yesterday.toISOString();

  try {
    // 1. 어제 신규 후기 수
    const reviewsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/reviews?select=id&created_at=gte.${yesterdayISO}`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    results.new_reviews = parseInt(reviewsRes.headers.get('content-range')?.split('/')[1] || '0');

    // 2. 어제 신규 게시글 수
    const postsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/community_posts?select=id&created_at=gte.${yesterdayISO}`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    results.new_posts = parseInt(postsRes.headers.get('content-range')?.split('/')[1] || '0');

    // 3. 어제 신규 가입자
    const usersRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?select=id&created_at=gte.${yesterdayISO}`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact',
        },
      }
    );
    results.new_users = parseInt(usersRes.headers.get('content-range')?.split('/')[1] || '0');

    // 4. 인기 가게 TOP 10 (조회수 기준)
    const topVenuesRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/venues?select=id,name,slug,category,view_count,review_count&order=view_count.desc&limit=10`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (topVenuesRes.ok) {
      results.top_venues = await topVenuesRes.json();
    }

    // 5. 활동왕 TOP 10 (포인트 기준)
    const topUsersRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?select=id,nickname,points,level&order=points.desc&limit=10`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (topUsersRes.ok) {
      results.top_users = await topUsersRes.json();
    }

    // 6. 일일 통계 저장
    await supabaseRPC(context.env, 'daily_stats', {
      method: 'POST',
      body: JSON.stringify({
        date: yesterday.toISOString().split('T')[0],
        new_reviews: results.new_reviews || 0,
        new_posts: results.new_posts || 0,
        new_users: results.new_users || 0,
        top_venues: results.top_venues || [],
        top_users: results.top_users || [],
      }),
    }).catch(() => {
      // daily_stats 테이블이 없으면 무시
      results.stats_saved = false;
    });

    results.stats_saved = results.stats_saved !== false;
    results.timestamp = now.toISOString();
    results.success = true;

    return Response.json(results);
  } catch (err: any) {
    return Response.json({
      error: err.message,
      timestamp: now.toISOString(),
    }, { status: 500 });
  }
};
