import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import { getSignedImageUrl } from "@/lib/s3";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { renewalImage: true },
  });

  if (!user?.renewalImage) {
    return NextResponse.json(
      { error: "재인증 이미지가 없습니다." },
      { status: 404 }
    );
  }

  const url = await getSignedImageUrl(user.renewalImage);
  return NextResponse.json({ url });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { activeUntil } = body as { activeUntil: string };

  if (!activeUntil) {
    return NextResponse.json(
      { error: "새 종료일은 필수입니다." },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id },
      select: { renewalImage: true, status: true },
    });

    if (!current?.renewalImage) {
      return {
        ok: false as const,
        code: 404,
        error: "재인증 이미지가 없습니다.",
      };
    }

    const updated = await tx.user.updateMany({
      where: {
        id,
        renewalImage: current.renewalImage,
        status: current.status,
      },
      data: {
        verificationImage: current.renewalImage,
        renewalImage: null,
        renewalSubmittedAt: null,
        activeUntil: new Date(activeUntil),
        status: "ACTIVE",
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false as const,
        code: 409,
        error: "다른 어드민이 먼저 처리했거나 상태가 변경되었습니다.",
      };
    }

    if (current.status !== "ACTIVE") {
      await tx.userStatusLog.create({
        data: {
          userId: id,
          fromStatus: current.status,
          toStatus: "ACTIVE",
          reason: `renewal-approved:${admin.id}`,
        },
      });
    }

    const refreshed = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        activeUntil: true,
      },
    });

    return { ok: true as const, data: refreshed };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json(result.data);
}
