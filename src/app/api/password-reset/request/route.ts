import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueNewCode } from "@/lib/password-reset";
import { sendPasswordResetCode } from "@/lib/resend";
import { buildPasswordResetCodeEmailHtml } from "@/lib/email-templates/password-reset-code";

export const dynamic = "force-dynamic";

const DUMMY_DELAY_MS = 1500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  const session = await auth();
  const sessionEmail = session?.user?.email ?? null;
  const targetEmail = (sessionEmail ?? body.email ?? "").trim().toLowerCase();

  if (!targetEmail) {
    await delay(DUMMY_DELAY_MS);
    return NextResponse.json({ ok: true, retryAfter: 60 });
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user || user.status === "SUSPENDED") {
    await delay(DUMMY_DELAY_MS);
    return NextResponse.json({ ok: true, retryAfter: 60 });
  }

  const result = await issueNewCode({
    userId: user.id,
    requestIp: getClientIp(req),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: "THROTTLED", retryAfter: result.retryAfter },
      { status: 429 }
    );
  }

  await prisma.userEvent.create({
    data: {
      userId: user.id,
      type: "password_reset.requested",
      props: { source: sessionEmail ? "account" : "forgot" },
    },
  });

  const sent = await sendPasswordResetCode(
    { to: user.email, name: user.name, code: result.code },
    buildPasswordResetCodeEmailHtml
  );
  if (!sent.ok) {
    console.error("[password-reset/request] mail send failed", {
      userId: user.id,
      error: sent.error,
    });
  }

  return NextResponse.json({ ok: true, retryAfter: result.retryAfter });
}
