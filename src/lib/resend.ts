import { Resend } from "resend";

// 도메인 인증 완료 시 이 한 줄만 교체 (e.g. "Gordon Project <no-reply@yourdomain.com>")
export const MAIL_FROM = "Gordon Site <no-reply@gordon-site.xyz>";

// 하위 호환 alias — 기존 호출부가 사용하던 이름
export const PASSWORD_RESET_FROM = MAIL_FROM;

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export type SendCodeEmailArgs = {
  to: string;
  name: string | null;
  code: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

// 범용: 인증 코드 메일 발송 (subject + HTML 빌더 주입)
export async function sendCodeEmail(
  args: SendCodeEmailArgs,
  subject: string,
  buildHtml: (args: SendCodeEmailArgs) => string
): Promise<SendResult> {
  try {
    const html = buildHtml(args);
    const result = await getClient().emails.send({
      from: MAIL_FROM,
      to: args.to,
      subject,
      html,
    });
    if (result.error) {
      console.error("[resend] send failed", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[resend] threw", err);
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}

// 하위 호환 — 비밀번호 재설정 전용 wrapper (기존 caller 보존)
export type SendPasswordResetCodeArgs = SendCodeEmailArgs;
export async function sendPasswordResetCode(
  args: SendPasswordResetCodeArgs,
  buildHtml: (args: SendPasswordResetCodeArgs) => string
): Promise<SendResult> {
  return sendCodeEmail(args, "[Gordon Site] 비밀번호 재설정 코드", buildHtml);
}
