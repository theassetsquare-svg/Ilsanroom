/**
 * 일일 통계 계산 + 이메일 리포트 — KST 06:00 실행
 * GET /api/cron/daily-stats?key=CRON_SECRET
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
}

const sbHeaders = (env: Env) => ({
  'apikey': env.SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
});

async function sendAdminEmail(env: Env, subject: string, html: string) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: '놀쿨 <onboarding@resend.dev>',
      to: [env.NOTIFICATION_EMAIL],
      subject,
      html,
    }),
  }).catch(() => {});
}

async function countSince(env: Env, table: string, since: string): Promise<number> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/${table}?select=id&created_at=gte.${since}`,
    { headers: { ...sbHeaders(env), 'Prefer': 'count=exact' } }
  );
  return parseInt(res.headers.get('content-range')?.split('/')[1] || '0');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (!context.env.CRON_SECRET || url.searchParams.get('key') !== context.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_KEY) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const headers = sbHeaders(context.env);

  try {
    const [newReviews, newPosts, newUsers] = await Promise.all([
      countSince(context.env, 'reviews', yesterday),
      countSince(context.env, 'community_posts', yesterday),
      countSince(context.env, 'user_profiles', yesterday),
    ]);

    const topVenuesRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/venues?select=name,slug,category,view_count,review_count&order=view_count.desc&limit=5`,
      { headers }
    );
    const topVenues = topVenuesRes.ok ? await topVenuesRes.json() : [];

    const topUsersRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?select=nickname,points,level&order=points.desc&limit=5`,
      { headers }
    );
    const topUsers = topUsersRes.ok ? await topUsersRes.json() : [];

    // 일일 통계 저장
    await fetch(`${context.env.SUPABASE_URL}/rest/v1/daily_stats`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        date: new Date(now.getTime() - 86400000).toISOString().split('T')[0],
        new_reviews: newReviews, new_posts: newPosts, new_users: newUsers,
        top_venues: topVenues, top_users: topUsers,
      }),
    }).catch(() => {});

    // 이메일 리포트 발송
    const kstDate = new Date(now.getTime() + 9 * 3600000).toISOString().split('T')[0];
    const venueRows = topVenues.map((v: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${v.name}</td><td>${v.view_count || 0}</td><td>${v.review_count || 0}</td></tr>`
    ).join('');
    const userRows = topUsers.map((u: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${u.nickname || '(없음)'}</td><td>${u.points || 0}P</td><td>${u.level}</td></tr>`
    ).join('');

    await sendAdminEmail(context.env, `[놀쿨] 일일 리포트 — ${kstDate}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#8B5CF6">놀쿨 일일 리포트</h2>
        <p style="color:#666">${kstDate} 기준</p>
        <div style="display:flex;gap:16px;margin:16px 0">
          <div style="background:#f3f0ff;padding:16px;border-radius:12px;flex:1;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#7c3aed">${newUsers}</div>
            <div style="font-size:12px;color:#666">신규 가입</div>
          </div>
          <div style="background:#f0fdf4;padding:16px;border-radius:12px;flex:1;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#16a34a">${newPosts}</div>
            <div style="font-size:12px;color:#666">새 게시글</div>
          </div>
          <div style="background:#fef3c7;padding:16px;border-radius:12px;flex:1;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#d97706">${newReviews}</div>
            <div style="font-size:12px;color:#666">새 후기</div>
          </div>
        </div>
        <h3>인기 업소 TOP 5</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="background:#f5f3ff"><th>#</th><th>업소</th><th>조회</th><th>후기</th></tr>
          ${venueRows || '<tr><td colspan="4" style="text-align:center;color:#999">데이터 없음</td></tr>'}
        </table>
        <h3 style="margin-top:16px">활동왕 TOP 5</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="background:#f5f3ff"><th>#</th><th>닉네임</th><th>포인트</th><th>등급</th></tr>
          ${userRows || '<tr><td colspan="4" style="text-align:center;color:#999">데이터 없음</td></tr>'}
        </table>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
        <p style="font-size:11px;color:#999">놀쿨 자동 리포트 | nolcool.com</p>
      </div>`
    );

    return Response.json({ success: true, newReviews, newPosts, newUsers, timestamp: now.toISOString() });
  } catch (err: any) {
    // 에러 시에도 이메일 알림
    await sendAdminEmail(context.env, `[놀쿨] 일일 통계 오류`, `<p>오류: ${err.message}</p>`);
    return Response.json({ error: err.message }, { status: 500 });
  }
};
