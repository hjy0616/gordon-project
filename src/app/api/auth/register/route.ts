import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { classifyInflowSource } from "@/lib/inflow-source";
import {
  IMAGE_MAX_FILE_SIZE,
  resolveImageContentType,
} from "@/lib/image-upload";
import {
  verifySignupTicket,
  isSignupCodeStillUsable,
  markSignupCodeConsumed,
} from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const password = formData.get("password") as string;
    const image = formData.get("verificationImage") as File | null;
    const ticket = ((formData.get("ticket") as string | null) ?? "").trim();
    const utmSource =
      (formData.get("utmSource") as string | null)?.trim().slice(0, 100) || null;
    const referer =
      (formData.get("referer") as string | null)?.trim().slice(0, 500) || null;
    const signupSource = classifyInflowSource({ utmSource, referer });

    if (!ticket) {
      return NextResponse.json(
        { error: "이메일 인증이 필요합니다." },
        { status: 400 }
      );
    }

    const ticketResult = await verifySignupTicket(ticket);
    if (!ticketResult.ok) {
      return NextResponse.json(
        {
          error:
            ticketResult.reason === "expired"
              ? "이메일 인증 세션이 만료되었습니다. 다시 인증해주세요."
              : "이메일 인증 정보가 유효하지 않습니다.",
        },
        { status: 400 }
      );
    }
    const email = ticketResult.payload.email;
    const codeId = ticketResult.payload.codeId;

    if (!(await isSignupCodeStillUsable(codeId))) {
      return NextResponse.json(
        { error: "이메일 인증이 만료되었습니다. 다시 인증해주세요." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "비밀번호는 필수입니다." },
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
    const ext =
      contentType === "image/jpeg"
        ? "jpg"
        : contentType === "image/png"
          ? "png"
          : "webp";
    const s3Key = `verification/${userId}/${Date.now()}.${ext}`;

    const buffer = Buffer.from(await image.arrayBuffer());
    await uploadToS3(buffer, s3Key, contentType);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: userId,
          name: name || null,
          email,
          password: hashedPassword,
          verificationImage: s3Key,
          signupSource,
          signupReferer: referer,
        },
      });
      await tx.userPreference.create({ data: { userId: created.id } });
      await tx.userStatusLog.create({
        data: {
          userId: created.id,
          fromStatus: null,
          toStatus: "PENDING",
          reason: "registration",
        },
      });
      return created;
    });

    await markSignupCodeConsumed(codeId);

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
