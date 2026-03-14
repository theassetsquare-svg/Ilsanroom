/**
 * 이메일 발송 모듈
 * Email sending utilities (placeholder — swap for Resend / SendGrid / SES)
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string | null;
  error?: string;
}

// ─── Config ──────────────────────────────────────────────────────────

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? "일산룸포털 <noreply@neon-nightlife.com>";

// ─── Core ────────────────────────────────────────────────────────────

/**
 * 범용 이메일 발송
 * Generic email sender — replace internals with your ESP of choice.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const recipients = Array.isArray(options.to)
    ? options.to.join(", ")
    : options.to;

  console.log(`[email] sendEmail`);
  console.log(`  from: ${options.from ?? DEFAULT_FROM}`);
  console.log(`  to:   ${recipients}`);
  console.log(`  subj: ${options.subject}`);
  if (options.cc) console.log(`  cc:   ${options.cc}`);
  if (options.bcc) console.log(`  bcc:  ${options.bcc}`);
  if (options.attachments) {
    console.log(`  attachments: ${options.attachments.length}`);
  }

  // TODO: Integrate with actual email provider
  // e.g. Resend, SendGrid, AWS SES

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return { success: true, messageId };
}

// ─── Templates ───────────────────────────────────────────────────────

/**
 * 환영 이메일 발송
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"></head>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h1 style="color:#7c3aed;font-size:24px;">일산룸포털에 오신 것을 환영합니다!</h1>
  <p>${userName}님, 회원가입이 완료되었습니다.</p>
  <p>일산룸포털에서 대한민국 최고의 나이트라이프 정보를 만나보세요.</p>
  <ul>
    <li>인기 업소 랭킹 확인</li>
    <li>지역별 업소 탐색</li>
    <li>커뮤니티 참여</li>
    <li>이벤트 및 파티 정보</li>
  </ul>
  <a href="https://neon-nightlife.com" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">시작하기</a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
  <p style="font-size:12px;color:#9ca3af;">본 메일은 일산룸포털 회원가입 시 자동 발송됩니다.</p>
</body>
</html>`.trim();

  return sendEmail({
    to,
    subject: `${userName}님, 일산룸포털에 오신 것을 환영합니다!`,
    html,
    text: `${userName}님, 일산룸포털에 오신 것을 환영합니다! 회원가입이 완료되었습니다.`,
    tags: { type: "welcome" },
  });
}

/**
 * 이메일 인증 발송
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"></head>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h1 style="color:#7c3aed;font-size:24px;">이메일 인증</h1>
  <p>아래 버튼을 클릭하여 이메일 주소를 인증해 주세요.</p>
  <a href="${verificationUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">이메일 인증하기</a>
  <p style="font-size:14px;color:#6b7280;">버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 입력해 주세요:</p>
  <p style="font-size:13px;color:#7c3aed;word-break:break-all;">${verificationUrl}</p>
  <p style="font-size:13px;color:#9ca3af;">이 링크는 24시간 후 만료됩니다.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
  <p style="font-size:12px;color:#9ca3af;">본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.</p>
</body>
</html>`.trim();

  return sendEmail({
    to,
    subject: "[일산룸포털] 이메일 인증을 완료해 주세요",
    html,
    text: `이메일 인증 링크: ${verificationUrl} (24시간 후 만료)`,
    tags: { type: "verification" },
  });
}
