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

  const updated = await prisma.user.update({
    where: { id },
    data: {
      verificationImage: user.renewalImage,
      renewalImage: null,
      renewalSubmittedAt: null,
      activeUntil: new Date(activeUntil),
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      activeUntil: true,
    },
  });

  return NextResponse.json(updated);
}
