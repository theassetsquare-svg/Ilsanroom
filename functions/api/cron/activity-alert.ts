/**
 * 활동 알림 — 15분마다 실행
 * GET /api/cron/activity-alert?key=CRON_SECRET
 *
 * 최근 15분 내 새 글·댓글·후기·🚨신고·클립·회원을 감지해 관리자에게 이메일.
 *
 * ★ 실제 스키마(001_initial_schema + 003/004/006)만 조회한다.
 *    과거 결함: community_posts/clips 유령 테이블, *.nickname, user_profiles.email/created_at
 *    같은 없는 컬럼을 조회 → PostgREST 400/404 → 전부 빈 결과 → 알림이 한 번도 안 울렸다.
 *    실제: 글·클립=posts(클립은 category='clip'), 회원=user_profiles.joined_at,
 *    닉네임은 user_profiles 별도 조회로 해소(임베드 금지 — 과거 user_profiles!left 400 이력).
 * ★ 항목별 직접 링크 + /admin/moderation 처리 동선. 🚨신고는 즉시 대응 대상이라 최상단 우선.
 * ★ 사용자 콘텐츠는 메일 HTML에 그대로 들어가므로 escapeHtml 필수(깨짐·주입 방지).
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
}

const SITE = 'https://nolcool.com';

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function snippet(s: unknown, n = 60): string {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

// 클립 author는 content JSON({"author":"..."})에 들어있다(012 시드 구조).
function clipAuthor(content: unknown): string {
  try {
    const j = JSON.parse(String(content ?? '{}'));
    return typeof j?.author === 'string' && j.author ? j.author : '익명';
  } catch {
    return '익명';
  }
}

const REPORT_REASON_LABEL: Record<string, string> = {
  profanity: '욕설', spam: '스팸', false_info: '허위정보',
  inappropriate: '부적절', other: '기타',
};

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
  const base = context.env.SUPABASE_URL;

  async function q(path: string): Promise<any[]> {
    const res = await fetch(`${base}/rest/v1/${path}`, { headers });
    return res.ok ? await res.json() : [];
  }

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  try {
    // ── 실제 스키마 기반 조회 ──
    const [allPosts, comments, reviews, reports, members] = await Promise.all([
      // 글 + 클립(둘 다 posts). 클립은 category='clip'로 구분.
      q(`posts?select=id,title,category,user_id,content,created_at&created_at=gte.${since}&order=created_at.desc&limit=50`),
      q(`comments?select=id,content,post_id,user_id,created_at&created_at=gte.${since}&order=created_at.desc&limit=50`),
      q(`reviews?select=id,title,content,rating,venue_id,user_id,created_at&created_at=gte.${since}&order=created_at.desc&limit=50`),
      q(`reports?select=id,reporter_id,target_type,target_id,reason,description,created_at&created_at=gte.${since}&order=created_at.desc&limit=50`),
      q(`user_profiles?select=user_id,nickname,joined_at&joined_at=gte.${since}&order=joined_at.desc&limit=50`),
    ]);

    const clips = allPosts.filter((p) => p.category === 'clip');
    const posts = allPosts.filter((p) => p.category !== 'clip');

    // 닉네임 맵 — posts/comments/reviews 작성자(user_id) → nickname (1회 조회, 임베드 없음)
    const userIds = new Set<string>();
    for (const row of [...posts, ...comments, ...reviews]) {
      if (row.user_id) userIds.add(row.user_id);
    }
    const nickMap = new Map<string, string>();
    if (userIds.size > 0) {
      const list = [...userIds].map((id) => `"${id}"`).join(',');
      const profs = await q(`user_profiles?select=user_id,nickname&user_id=in.(${list})`);
      for (const p of profs) if (p.user_id && p.nickname) nickMap.set(p.user_id, p.nickname);
    }
    const nickOf = (uid: string | null | undefined): string =>
      uid ? (nickMap.get(uid) || uid.slice(0, 8)) : '익명';

    const sections: string[] = [];

    // ── 🚨 신고 — 최상단 우선(즉시 대응 대상) ──
    if (reports.length > 0) {
      const rows = reports.map((r) => {
        const reason = REPORT_REASON_LABEL[r.reason] || escapeHtml(r.reason);
        const viewLink = r.target_type === 'post'
          ? `<a href="${SITE}/community/post/${encodeURIComponent(r.target_id)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb">대상 글 보기</a> · `
          : '';
        const desc = r.description ? ` — ${escapeHtml(snippet(r.description, 50))}` : '';
        return `<li style="background:#fef2f2;padding:8px 10px;border-radius:8px;border-left:4px solid #dc2626;margin-bottom:6px">
          🚨 <strong>[${escapeHtml(r.target_type)}] ${reason}</strong>${desc}<br>
          <span style="font-size:12px;color:#666">${viewLink}<a href="${SITE}/admin/moderation" target="_blank" rel="noopener noreferrer" style="color:#dc2626;font-weight:bold">→ 모더레이션에서 처리/삭제</a></span>
        </li>`;
      }).join('');
      sections.push(`<h3 style="color:#dc2626;margin:16px 0 8px">🚨 신고 ${reports.length}건 — 즉시 확인</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    // ── 새 글 ──
    if (posts.length > 0) {
      const rows = posts.map((p) => {
        const link = `${SITE}/community/post/${encodeURIComponent(p.id)}`;
        return `<li style="margin-bottom:5px">
          <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:bold">${escapeHtml(p.title || '(제목없음)')}</a>
          <span style="font-size:12px;color:#888"> · [${escapeHtml(p.category)}] · ${escapeHtml(nickOf(p.user_id))}</span>
          <a href="${SITE}/admin/moderation" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#9333ea"> · 관리</a>
        </li>`;
      }).join('');
      sections.push(`<h3 style="margin:16px 0 8px">📝 새 글 ${posts.length}건</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    // ── 새 댓글 ──
    if (comments.length > 0) {
      const rows = comments.map((c) => {
        const link = c.post_id ? `${SITE}/community/post/${encodeURIComponent(c.post_id)}` : null;
        const text = escapeHtml(snippet(c.content, 60)) || '(빈 댓글)';
        const head = link
          ? `<a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#2563eb">${text}</a>`
          : text;
        return `<li style="margin-bottom:5px">💬 ${head} <span style="font-size:12px;color:#888">· ${escapeHtml(nickOf(c.user_id))}</span></li>`;
      }).join('');
      sections.push(`<h3 style="margin:16px 0 8px">💬 새 댓글 ${comments.length}건</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    // ── 새 후기 ──
    if (reviews.length > 0) {
      const rows = reviews.map((r) => {
        const text = escapeHtml(snippet(r.content || r.title, 50));
        return `<li style="margin-bottom:5px">⭐ ${r.rating ? `★${escapeHtml(r.rating)} ` : ''}${text} <span style="font-size:12px;color:#888">· ${escapeHtml(nickOf(r.user_id))}</span> · <a href="${SITE}/admin/moderation" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#9333ea">관리</a></li>`;
      }).join('');
      sections.push(`<h3 style="margin:16px 0 8px">⭐ 새 후기 ${reviews.length}건</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    // ── 새 클립 ──
    if (clips.length > 0) {
      const rows = clips.map((c) => {
        const link = `${SITE}/community/post/${encodeURIComponent(c.id)}`;
        return `<li style="margin-bottom:5px">🎬 <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#2563eb">${escapeHtml(snippet(c.title, 50)) || '(제목없음)'}</a> <span style="font-size:12px;color:#888">· ${escapeHtml(clipAuthor(c.content))}</span></li>`;
      }).join('');
      sections.push(`<h3 style="margin:16px 0 8px">🎬 새 클립 ${clips.length}건</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    // ── 새 회원 ──
    if (members.length > 0) {
      const rows = members.map((m) =>
        `<li style="margin-bottom:4px">👋 <strong>${escapeHtml(m.nickname || '(닉네임 미설정)')}</strong></li>`
      ).join('');
      sections.push(`<h3 style="margin:16px 0 8px">👋 새 회원 ${members.length}명</h3><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
    }

    const total = reports.length + posts.length + comments.length + reviews.length + clips.length + members.length;

    // ★ 2026-07-12 사장님 지시: 정보성 활동(글/댓글/후기/클립/회원)은 메일 X — 행동 필요한 🚨신고 있을 때만 발송.
    //   활동 집계는 응답 JSON/일일통계로 남고, 모더레이션은 /admin/moderation에서 확인.
    if (reports.length > 0) {
      const kst = new Date(Date.now() + 9 * 3600000).toLocaleString('ko-KR');
      const subject = reports.length > 0
        ? `[놀쿨] 🚨 신고 ${reports.length}건 포함 활동 ${total}건`
        : `[놀쿨] 활동 알림 — ${total}건`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${context.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: '놀쿨 <onboarding@resend.dev>',
          to: [context.env.NOTIFICATION_EMAIL],
          subject,
          html: `<div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
            <h2 style="color:#8B5CF6;margin-bottom:4px">놀쿨 활동 알림</h2>
            <p style="color:#888;font-size:13px;margin-top:0">${kst} · 최근 15분</p>
            ${sections.join('')}
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
            <a href="${SITE}/admin/moderation" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;background:#8B5CF6;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">모더레이션 열기 →</a>
          </div>`,
        }),
      });
    }

    return Response.json({
      success: true,
      new_reports: reports.length,
      new_posts: posts.length,
      new_comments: comments.length,
      new_reviews: reviews.length,
      new_clips: clips.length,
      new_members: members.length,
      email_sent: total > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
