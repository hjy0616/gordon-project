import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import {
  IMAGE_MAX_FILE_SIZE,
  resolveImageContentType,
} from "@/lib/image-upload";

const RENEWAL_WINDOW_DAYS = 7;

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      activeUntil: true,
      renewalImage: true,
      renewalSubmittedAt: true,
      renewalRejectionReason: true,
      renewalRejectedAt: true,
      status: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const activeUntil = dbUser.activeUntil;
  const daysRemaining = activeUntil
    ? Math.ceil((activeUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // EXPIRED는 window 무관 언제든 제출 가능. ACTIVE는 7일 grace window 유지. 그 외는 차단.
  const canSubmit =
    dbUser.status === "EXPIRED"
      ? true
      : dbUser.status === "ACTIVE" &&
        daysRemaining !== null &&
        daysRemaining <= RENEWAL_WINDOW_DAYS &&
        daysRemaining > 0;

  return NextResponse.json({
    status: dbUser.status,
    canSubmit,
    daysRemaining,
    hasSubmitted: !!dbUser.renewalImage,
    submittedAt: dbUser.renewalSubmittedAt,
    rejectionReason: dbUser.renewalRejectionReason,
    rejectedAt: dbUser.renewalRejectedAt,
  });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeUntil: true, status: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ACTIVE 또는 EXPIRED만 self-service 갱신 허용. PENDING/SUSPENDED는 차단.
  if (dbUser.status !== "ACTIVE" && dbUser.status !== "EXPIRED") {
    return NextResponse.json(
      { error: "활성 또는 만료 상태의 사용자만 재인증할 수 있습니다." },
      { status: 403 }
    );
  }

  // ACTIVE인 경우만 7일 grace window 강제. EXPIRED는 window 무관.
  if (dbUser.status === "ACTIVE") {
    if (!dbUser.activeUntil) {
      return NextResponse.json(
        { error: "활성 기간이 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (dbUser.activeUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining > RENEWAL_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `종료일 ${RENEWAL_WINDOW_DAYS}일 전부터 재인증할 수 있습니다.` },
        { status: 400 }
      );
    }
  }

  const formData = await req.formData();
  const image = formData.get("renewalImage") as File | null;

  if (!image || !(image instanceof File)) {
    return NextResponse.json(
      { error: "인증 이미지는 필수입니다." },
      { status: 400 }
    );
  }

  const contentType = resolveImageContentType(image);
  if (!contentType) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP 형식의 이미지만 허용됩니다." },
      { status: 400 }
    );
  }

  if (image.size > IMAGE_MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "이미지 크기는 5MB 이하여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const ext =
      contentType === "image/jpeg"
        ? "jpg"
        : contentType === "image/png"
          ? "png"
          : "webp";
    const s3Key = `renewal/${user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    await uploadToS3(buffer, s3Key, contentType);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        renewalImage: s3Key,
        renewalSubmittedAt: new Date(),
        renewalRejectionReason: null,
        renewalRejectedAt: null,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Renewal upload error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
