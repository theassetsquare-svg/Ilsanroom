/**
 * 자동 응답 + 알림 — 이메일/웹훅 알림 처리
 * POST /api/notification
 *
 * 환경변수 (Cloudflare 대시보드):
 *   RESEND_API_KEY     — Resend 이메일 API 키
 *   NOTIFICATION_EMAIL — 관리자 알림 수신 이메일
 *   WEBHOOK_URL        — 슬랙/디스코드 웹훅 URL (선택)
 *
 * Actions:
 *   { action: "contact",  name, email, message }              — 문의 접수 + 자동 응답
 *   { action: "venue-inquiry", venueSlug, name, email, phone } — 업소 문의 접수
 *   { action: "report",   postId, reason, reporterEmail }      — 신고 접수
 *   { action: "welcome",  email, name }                        — 가입 환영 이메일
 */

interface Env {
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
  WEBHOOK_URL?: string;
}

interface NotificationRequest {
  action: 'contact' | 'venue-inquiry' | 'report' | 'welcome';
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  venueSlug?: string;
  postId?: string;
  reason?: string;
  reporterEmail?: string;
}

async function sendEmail(env: Env, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: '플밤 <noreply@ilsanroom.pages.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Resend error:', res.status, errText);
    throw new Error(`Email send failed: ${res.status}`);
  }
  return res.json();
}

async function sendWebhook(env: Env, text: string) {
  if (!env.WEBHOOK_URL) return;
  await fetch(env.WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch((err) => console.error('Webhook error:', err));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { RESEND_API_KEY, NOTIFICATION_EMAIL } = context.env;

  if (!RESEND_API_KEY) {
    return Response.json({ error: '알림 서비스가 설정되지 않았습니다.' }, { status: 503 });
  }

  let body: NotificationRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { action } = body;

  try {
    switch (action) {
      case 'contact': {
        const { name, email, message } = body;
        if (!name || !email || !message) {
          return Response.json({ error: '이름, 이메일, 메시지를 모두 입력해주세요.' }, { status: 400 });
        }

        // 관리자에게 알림
        if (NOTIFICATION_EMAIL) {
          await sendEmail(context.env, NOTIFICATION_EMAIL, `[플밤] 문의: ${name}`,
            `<h2>새 문의</h2>
            <p><strong>이름:</strong> ${name}</p>
            <p><strong>이메일:</strong> ${email}</p>
            <p><strong>내용:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>`
          );
        }

        // 사용자에게 자동 응답
        await sendEmail(context.env, email, '[플밤] 문의가 접수되었습니다',
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#8B5CF6">문의 접수 완료</h2>
            <p>${name}님, 문의해 주셔서 감사합니다.</p>
            <p>보내주신 내용을 확인 후 영업일 기준 1-2일 내에 답변 드리겠습니다.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#888;font-size:12px">플밤 | ilsanroom.pages.dev</p>
          </div>`
        );

        await sendWebhook(context.env, `📩 새 문의 접수: ${name} (${email})`);
        return Response.json({ success: true, message: '문의가 접수되었습니다.' });
      }

      case 'venue-inquiry': {
        const { venueSlug, name, email } = body;
        if (!venueSlug || !name || !email) {
          return Response.json({ error: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
        }

        if (NOTIFICATION_EMAIL) {
          await sendEmail(context.env, NOTIFICATION_EMAIL, `[플밤] 업소 문의: ${venueSlug}`,
            `<h2>업소 문의</h2>
            <p><strong>업소:</strong> ${venueSlug}</p>
            <p><strong>이름:</strong> ${name}</p>
            <p><strong>이메일:</strong> ${email}</p>
            <p><strong>연락처:</strong> ${body.phone || '미입력'}</p>`
          );
        }

        await sendEmail(context.env, email, '[플밤] 업소 문의가 접수되었습니다',
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#8B5CF6">업소 문의 접수 완료</h2>
            <p>${name}님, 해당 업소에 대한 문의가 접수되었습니다.</p>
            <p>확인 후 안내 드리겠습니다.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#888;font-size:12px">플밤 | ilsanroom.pages.dev</p>
          </div>`
        );

        await sendWebhook(context.env, `🏪 업소 문의: ${venueSlug} by ${name}`);
        return Response.json({ success: true, message: '문의가 접수되었습니다.' });
      }

      case 'report': {
        const { postId, reason, reporterEmail } = body;
        if (!postId || !reason) {
          return Response.json({ error: '신고 대상과 사유를 입력해주세요.' }, { status: 400 });
        }

        if (NOTIFICATION_EMAIL) {
          await sendEmail(context.env, NOTIFICATION_EMAIL, `[플밤] 신고 접수: ${postId}`,
            `<h2>게시물 신고</h2>
            <p><strong>게시물 ID:</strong> ${postId}</p>
            <p><strong>사유:</strong> ${reason}</p>
            <p><strong>신고자:</strong> ${reporterEmail || '익명'}</p>`
          );
        }

        await sendWebhook(context.env, `🚨 신고 접수: 게시물 ${postId} — ${reason}`);
        return Response.json({ success: true, message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.' });
      }

      case 'welcome': {
        const { email, name } = body;
        if (!email) {
          return Response.json({ error: '이메일이 필요합니다.' }, { status: 400 });
        }

        await sendEmail(context.env, email, '플밤에 오신 것을 환영합니다! 🎉',
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#8B5CF6">환영합니다${name ? `, ${name}` : ''}! 🎉</h2>
            <p>플밤 회원이 되신 것을 축하합니다.</p>
            <p>전국 117개 이상의 매장 정보를 비교하고, 나에게 딱 맞는 곳을 찾아보세요.</p>
            <ul>
              <li>🎰 룰렛으로 랜덤 추천 받기</li>
              <li>🧠 MBTI 퀴즈로 성향 분석</li>
              <li>⚔️ VS 투표로 비교하기</li>
            </ul>
            <a href="https://ilsanroom.pages.dev" style="display:inline-block;padding:12px 24px;background:#8B5CF6;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px">둘러보기</a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#888;font-size:12px">플밤 | ilsanroom.pages.dev</p>
          </div>`
        );

        await sendWebhook(context.env, `👋 새 회원 가입: ${name || email}`);
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
    }
  } catch (err) {
    console.error('Notification error:', err);
    return Response.json({ error: '알림 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
