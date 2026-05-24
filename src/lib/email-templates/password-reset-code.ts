export type PasswordResetCodeEmailArgs = {
  to: string;
  name: string | null;
  code: string;
};

export function buildPasswordResetCodeEmailHtml(
  args: PasswordResetCodeEmailArgs
): string {
  const greeting = args.name?.trim() ? `${args.name}님,` : "안녕하세요,";
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>비밀번호 재설정 코드</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111111;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;padding:32px;">
          <tr>
            <td style="font-size:14px;font-weight:600;letter-spacing:0.05em;color:#ea580c;text-transform:uppercase;">
              Gordon Project
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:16px;line-height:1.6;color:#111111;">
              ${greeting}<br />
              비밀번호 재설정을 위한 인증 코드입니다.
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;" align="center">
              <div style="display:inline-block;padding:16px 32px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-family:'SF Mono','Monaco','Cascadia Code','Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:0.4em;color:#9a3412;">
                ${args.code}
              </div>
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:1.6;color:#374151;">
              이 코드는 <strong>10분</strong> 동안 유효합니다.<br />
              본인이 요청하지 않았다면 이 메일을 무시하시면 됩니다.
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;border-top:1px solid #e5e7eb;margin-top:32px;font-size:12px;color:#6b7280;">
              Gordon Project · 본 메일은 발신 전용입니다.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
