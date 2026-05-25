import { NextResponse } from "next/server";
import { verifyEmailCode, issueSignupTicket } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_EMAIL" },
      { status: 400 }
    );
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { ok: false, code: "INVALID" },
      { status: 400 }
    );
  }

  const result = await verifyEmailCode({ email, code });
  if (!result.ok) {
    const codeName =
      result.reason === "expired"
        ? "EXPIRED"
        : result.reason === "max_attempts"
          ? "MAX_ATTEMPTS"
          : "INVALID";
    return NextResponse.json({ ok: false, code: codeName }, { status: 400 });
  }

  const ticket = await issueSignupTicket(result.codeId, result.email);
  return NextResponse.json({ ok: true, ticket });
}
