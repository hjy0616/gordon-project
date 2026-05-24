import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const CODE_TTL_MS = 10 * 60 * 1000;          // 10분
const RESEND_COOLDOWN_MS = 60 * 1000;        // 60초
const HOURLY_SEND_CAP = 5;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_HASH_ROUNDS = 8;
const TICKET_TTL_SEC = 5 * 60;               // 5분

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET/AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function generateNumericCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

async function isOverHourlyCap(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - HOURLY_WINDOW_MS);
  const result = await prisma.passwordResetCode.aggregate({
    where: { userId, createdAt: { gt: since } },
    _sum: { sentCount: true },
  });
  return (result._sum.sentCount ?? 0) >= HOURLY_SEND_CAP;
}

export type IssueResult =
  | { ok: true; code: string; expiresAt: Date; retryAfter: number }
  | { ok: false; reason: "throttled" | "blocked"; retryAfter: number };

export async function issueNewCode(args: {
  userId: string;
  requestIp: string | null;
}): Promise<IssueResult> {
  const now = new Date();

  const recent = await prisma.passwordResetCode.findFirst({
    where: { userId: args.userId, consumedAt: null },
    orderBy: { lastSentAt: "desc" },
    select: { lastSentAt: true },
  });
  if (recent) {
    const elapsed = now.getTime() - recent.lastSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "throttled",
        retryAfter: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  if (await isOverHourlyCap(args.userId)) {
    return { ok: false, reason: "throttled", retryAfter: 60 };
  }

  const code = generateNumericCode();
  const codeHash = await bcrypt.hash(code, CODE_HASH_ROUNDS);
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetCode.updateMany({
      where: { userId: args.userId, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.passwordResetCode.create({
      data: {
        userId: args.userId,
        codeHash,
        expiresAt,
        lastSentAt: now,
        sentCount: 1,
        requestIp: args.requestIp,
      },
    }),
  ]);

  return { ok: true, code, expiresAt, retryAfter: RESEND_COOLDOWN_MS / 1000 };
}

export type VerifyResult =
  | { ok: true; codeId: string; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "max_attempts" };

export async function verifyCode(args: {
  userId: string;
  code: string;
}): Promise<VerifyResult> {
  const now = new Date();
  const row = await prisma.passwordResetCode.findFirst({
    where: { userId: args.userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return { ok: false, reason: "expired" };
  if (row.expiresAt.getTime() < now.getTime()) {
    await prisma.passwordResetCode.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });
    return { ok: false, reason: "expired" };
  }

  const matches = await bcrypt.compare(args.code, row.codeHash);
  if (!matches) {
    const nextAttempts = row.attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await prisma.passwordResetCode.update({
        where: { id: row.id },
        data: { attempts: nextAttempts, consumedAt: now },
      });
      return { ok: false, reason: "max_attempts" };
    }
    await prisma.passwordResetCode.update({
      where: { id: row.id },
      data: { attempts: nextAttempts },
    });
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, codeId: row.id, userId: row.userId };
}

export async function issueTicket(codeId: string, userId: string): Promise<string> {
  return await new SignJWT({ codeId, userId, kind: "pwreset" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TICKET_TTL_SEC}s`)
    .setIssuedAt()
    .sign(getJwtSecret());
}

export type TicketPayload = { codeId: string; userId: string };
export type TicketResult =
  | { ok: true; payload: TicketPayload }
  | { ok: false; reason: "invalid" | "expired" };

export async function verifyTicket(token: string): Promise<TicketResult> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.kind !== "pwreset" || typeof payload.codeId !== "string" || typeof payload.userId !== "string") {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, payload: { codeId: payload.codeId, userId: payload.userId } };
  } catch (err) {
    const isExpired = err instanceof Error && /exp/i.test(err.message);
    return { ok: false, reason: isExpired ? "expired" : "invalid" };
  }
}

export async function isCodeStillUsable(codeId: string): Promise<boolean> {
  const row = await prisma.passwordResetCode.findUnique({
    where: { id: codeId },
    select: { consumedAt: true, expiresAt: true },
  });
  if (!row) return false;
  if (row.consumedAt) return false;
  if (row.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function markCodeConsumed(codeId: string): Promise<void> {
  await prisma.passwordResetCode.update({
    where: { id: codeId },
    data: { consumedAt: new Date() },
  });
}
