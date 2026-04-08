import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
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
  const canSubmit =
    dbUser.status === "ACTIVE" &&
    daysRemaining !== null &&
    daysRemaining <= RENEWAL_WINDOW_DAYS &&
    daysRemaining > 0;

  return NextResponse.json({
    canSubmit,
    daysRemaining,
    hasSubmitted: !!dbUser.renewalImage,
    submittedAt: dbUser.renewalSubmittedAt,
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

  if (!dbUser || dbUser.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "활성 상태의 사용자만 재인증할 수 있습니다." },
      { status: 403 }
    );
  }

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

  const formData = await req.formData();
  const image = formData.get("renewalImage") as File | null;

  if (!image || !(image instanceof File)) {
    return NextResponse.json(
      { error: "인증 이미지는 필수입니다." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(image.type)) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP 형식의 이미지만 허용됩니다." },
      { status: 400 }
    );
  }

  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "이미지 크기는 5MB 이하여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const ext = image.name.split(".").pop() || "jpg";
    const s3Key = `renewal/${user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    await uploadToS3(buffer, s3Key, image.type);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        renewalImage: s3Key,
        renewalSubmittedAt: new Date(),
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
