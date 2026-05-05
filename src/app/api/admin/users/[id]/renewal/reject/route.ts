import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";

const MAX_REASON_LENGTH = 500;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const trimmed = (body.reason ?? "").trim();

  if (!trimmed || trimmed.length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      { error: `거부 사유는 1~${MAX_REASON_LENGTH}자여야 합니다.` },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id },
      select: { renewalImage: true },
    });

    if (!current?.renewalImage) {
      return {
        ok: false as const,
        code: 404,
        error: "재인증 요청이 없습니다.",
      };
    }

    const updated = await tx.user.updateMany({
      where: { id, renewalImage: current.renewalImage },
      data: {
        renewalImage: null,
        renewalSubmittedAt: null,
        renewalRejectionReason: trimmed,
        renewalRejectedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false as const,
        code: 409,
        error: "다른 어드민이 먼저 처리했거나 상태가 변경되었습니다.",
      };
    }

    return { ok: true as const };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json({ success: true });
}
