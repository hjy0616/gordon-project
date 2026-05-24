import { Resend } from "resend";

// 도메인 인증 완료 시 이 한 줄만 교체 (e.g. "Gordon Project <no-reply@yourdomain.com>")
export const PASSWORD_RESET_FROM = "Gordon Project <onboarding@resend.dev>";

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

export type SendPasswordResetCodeArgs = {
  to: string;
  name: string | null;
  code: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendPasswordResetCode(
  args: SendPasswordResetCodeArgs,
  buildHtml: (args: SendPasswordResetCodeArgs) => string
): Promise<SendResult> {
  try {
    const html = buildHtml(args);
    const subject = `[Gordon Project] 비밀번호 재설정 코드: ${args.code}`;
    const result = await getClient().emails.send({
      from: PASSWORD_RESET_FROM,
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
