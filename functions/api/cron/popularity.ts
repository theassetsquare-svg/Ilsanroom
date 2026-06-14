/**
 * 인기 가게/글 갱신 Cron
 * GET /api/cron/popularity?key=CRON_SECRET&type=realtime|lunch|evening
 *
 * - realtime: 5분마다 (조회수 급증 감지)
 * - lunch: KST 12:00 (점심 인기)
 * - evening: KST 18:00 (저녁 인기)
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  const type = url.searchParams.get('type') || 'realtime';

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
    // 인기 가게 조회 (조회수 + 후기수 가중)
    const venuesRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/venues?select=id,name,slug,category,region,view_count,review_count,rating&order=view_count.desc&limit=20`,
      { headers }
    );
    const venues = venuesRes.ok ? await venuesRes.json() : [];

    // 인기 점수 계산: view_count * 1 + review_count * 10 + rating * 50
    const scored = venues.map((v: any) => ({
      ...v,
      popularity_score: (v.view_count || 0) + (v.review_count || 0) * 10 + (v.rating || 0) * 50,
    }));
    scored.sort((a: any, b: any) => b.popularity_score - a.popularity_score);

    // 인기 글 조회
    const postsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/posts?select=id,title,category,likes,comment_count,views&order=views.desc&limit=10`,
      { headers }
    );
    const posts = postsRes.ok ? await postsRes.json() : [];

    // popular_cache 테이블에 저장 (있으면)
    const cacheData = {
      type,
      venues: scored.slice(0, 10),
      posts: posts.slice(0, 5),
      updated_at: new Date().toISOString(),
    };

    await fetch(`${context.env.SUPABASE_URL}/rest/v1/popular_cache?type=eq.${type}`, {
      method: 'DELETE',
      headers: { ...headers, 'Prefer': 'return=minimal' },
    }).catch(() => {});

    await fetch(`${context.env.SUPABASE_URL}/rest/v1/popular_cache`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(cacheData),
    }).catch(() => {});

    return Response.json({
      success: true,
      type,
      top_venues: scored.slice(0, 10),
      top_posts: posts.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
