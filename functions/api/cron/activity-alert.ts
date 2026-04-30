/**
 * 활동 알림 — 15분마다 실행
 * GET /api/cron/activity-alert?key=CRON_SECRET
 *
 * 새 회원가입/커뮤니티 글/댓글을 감지하여 이메일 발송
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (!context.env.CRON_SECRET || url.searchParams.get('key') !== context.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_KEY) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  if (!context.env.RESEND_API_KEY || !context.env.NOTIFICATION_EMAIL) {
    return Response.json({ error: 'Email not configured' }, { status: 503 });
  }

  const headers = {
    'apikey': context.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 최근 15분 이내 활동 감지
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const alerts: string[] = [];

  try {
    // 1. 새 회원가입
    const usersRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?select=nickname,email,created_at&created_at=gte.${since}&order=created_at.desc`,
      { headers }
    );
    const newUsers = usersRes.ok ? await usersRes.json() : [];
    if (newUsers.length > 0) {
      newUsers.forEach((u: any) => {
        alerts.push(`<li>회원가입: <strong>${u.nickname || u.email || '(알 수 없음)'}</strong></li>`);
      });
    }

    // 2. 새 게시글
    const postsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/community_posts?select=title,category,nickname,created_at&created_at=gte.${since}&order=created_at.desc`,
      { headers }
    );
    const newPosts = postsRes.ok ? await postsRes.json() : [];
    if (newPosts.length > 0) {
      newPosts.forEach((p: any) => {
        alerts.push(`<li>새 글 [${p.category}]: <strong>${p.title}</strong> — ${p.nickname || '익명'}</li>`);
      });
    }

    // 3. 새 댓글
    const commentsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/comments?select=content,nickname,created_at&created_at=gte.${since}&order=created_at.desc&limit=20`,
      { headers }
    );
    const newComments = commentsRes.ok ? await commentsRes.json() : [];
    if (newComments.length > 0) {
      alerts.push(`<li>새 댓글 ${newComments.length}개</li>`);
    }

    // 4. 새 후기
    const reviewsRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/reviews?select=content,rating,nickname,created_at&created_at=gte.${since}&order=created_at.desc`,
      { headers }
    );
    const newReviews = reviewsRes.ok ? await reviewsRes.json() : [];
    if (newReviews.length > 0) {
      newReviews.forEach((r: any) => {
        alerts.push(`<li>새 후기 ★${r.rating}: ${(r.content || '').slice(0, 30)}... — ${r.nickname || '익명'}</li>`);
      });
    }

    // 알림 있을 때만 이메일 발송
    if (alerts.length > 0) {
      const kst = new Date(Date.now() + 9 * 3600000).toLocaleString('ko-KR');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${context.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: '놀쿨 <onboarding@resend.dev>',
          to: [context.env.NOTIFICATION_EMAIL],
          subject: `[놀쿨] 활동 알림 — ${alerts.length}건`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#8B5CF6">놀쿨 활동 알림</h2>
            <p style="color:#666">${kst}</p>
            <ul style="line-height:2">${alerts.join('')}</ul>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
            <a href="https://nolcool.com/admin" style="color:#8B5CF6">관리자 페이지 →</a>
          </div>`,
        }),
      });
    }

    return Response.json({
      success: true,
      new_users: newUsers.length,
      new_posts: newPosts.length,
      new_comments: newComments.length,
      new_reviews: newReviews.length,
      email_sent: alerts.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
