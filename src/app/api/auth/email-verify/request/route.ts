import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueNewEmailCode } from "@/lib/email-verification";
import { sendCodeEmail } from "@/lib/resend";
import { buildEmailVerificationCodeEmailHtml } from "@/lib/email-templates/email-verification-code";

export const dynamic = "force-dynamic";

function getClientIp(req: Request): string | null {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_EMAIL" },
      { status: 400 }
    );
  }

  // 이미 가입된 이메일은 즉시 알림 (회원가입 흐름은 enumeration 노출 허용)
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, code: "EMAIL_TAKEN" },
      { status: 409 }
    );
  }

  const result = await issueNewEmailCode({
    email,
    requestIp: getClientIp(req),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: "THROTTLED", retryAfter: result.retryAfter },
      { status: 429 }
    );
  }

  const sent = await sendCodeEmail(
    { to: email, name: null, code: result.code },
    "[Gordon Site] 회원가입 인증 코드",
    buildEmailVerificationCodeEmailHtml
  );
  if (!sent.ok) {
    console.error("[email-verify/request] mail send failed", {
      email,
      error: sent.error,
    });
  }

  return NextResponse.json({ ok: true, retryAfter: result.retryAfter });
}
