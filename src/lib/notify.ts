/**
 * Frontend → Cloudflare Pages Function /api/notification 호출 헬퍼.
 * Resend 이메일 + 웹훅 발송. 실패해도 사용자 흐름 막지 않도록 fire-and-forget.
 */

type NotifyAction = 'contact' | 'venue-inquiry' | 'report' | 'welcome';

interface NotifyPayload {
  action: NotifyAction;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  venueSlug?: string;
  postId?: string;
  reason?: string;
  reporterEmail?: string;
}

export function notify(payload: NotifyPayload): void {
  // fire-and-forget — 절대 await 하지 않음, 절대 throw 안 함
  fetch('/api/notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
