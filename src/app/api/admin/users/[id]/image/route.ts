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
    select: { verificationImage: true },
  });

  if (!user?.verificationImage) {
    return NextResponse.json(
      { error: "인증 이미지가 없습니다." },
      { status: 404 }
    );
  }

  const url = await getSignedImageUrl(user.verificationImage);
  return NextResponse.json({ url });
}
