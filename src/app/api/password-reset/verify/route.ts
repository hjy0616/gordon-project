import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCode, issueTicket } from "@/lib/password-reset";

export const dynamic = "force-dynamic";

const DUMMY_DELAY_MS = 1500;
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const code = (body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { ok: false, code: "INVALID" },
      { status: 400 }
    );
  }

  const session = await auth();
  const sessionEmail = session?.user?.email ?? null;
  const targetEmail = (sessionEmail ?? body.email ?? "").trim().toLowerCase();

  if (!targetEmail) {
    await delay(DUMMY_DELAY_MS);
    return NextResponse.json({ ok: false, code: "INVALID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, status: true },
  });

  if (!user || user.status === "SUSPENDED") {
    await delay(DUMMY_DELAY_MS);
    return NextResponse.json({ ok: false, code: "INVALID" }, { status: 400 });
  }

  const result = await verifyCode({ userId: user.id, code });
  if (!result.ok) {
    const codeName =
      result.reason === "expired"
        ? "EXPIRED"
        : result.reason === "max_attempts"
          ? "MAX_ATTEMPTS"
          : "INVALID";
    return NextResponse.json({ ok: false, code: codeName }, { status: 400 });
  }

  const ticket = await issueTicket(result.codeId, result.userId);
  return NextResponse.json({ ok: true, ticket });
}
