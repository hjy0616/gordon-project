import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  verifyTicket,
  isCodeStillUsable,
} from "@/lib/password-reset";

export const dynamic = "force-dynamic";

const MIN_PASSWORD_LEN = 6;
const PASSWORD_HASH_ROUNDS = 12;

export async function POST(req: Request) {
  let body: { ticket?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "TICKET_INVALID" }, { status: 400 });
  }

  const ticket = (body.ticket ?? "").trim();
  const newPassword = body.newPassword ?? "";

  if (!ticket) {
    return NextResponse.json({ ok: false, code: "TICKET_INVALID" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
    return NextResponse.json({ ok: false, code: "WEAK_PASSWORD" }, { status: 400 });
  }

  const ticketResult = await verifyTicket(ticket);
  if (!ticketResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: ticketResult.reason === "expired" ? "TICKET_EXPIRED" : "TICKET_INVALID",
      },
      { status: 400 }
    );
  }

  const { codeId, userId } = ticketResult.payload;

  if (!(await isCodeStillUsable(codeId))) {
    return NextResponse.json({ ok: false, code: "CODE_CONSUMED" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash, passwordChangedAt: now },
    }),
    prisma.passwordResetCode.update({
      where: { id: codeId },
      data: { consumedAt: now },
    }),
    prisma.userEvent.create({
      data: {
        userId,
        type: "password_reset.completed",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
