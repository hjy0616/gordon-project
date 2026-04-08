import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const image = formData.get("verificationImage") as File | null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호는 필수입니다." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

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

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = createId();
    const ext = image.name.split(".").pop() || "jpg";
    const s3Key = `verification/${userId}/${Date.now()}.${ext}`;

    const buffer = Buffer.from(await image.arrayBuffer());
    await uploadToS3(buffer, s3Key, image.type);

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name || null,
        email,
        password: hashedPassword,
        verificationImage: s3Key,
      },
    });

    await prisma.userPreference.create({
      data: { userId: user.id },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
