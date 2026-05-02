import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { uploadToS3, deleteFromS3, getSignedImageUrl } from "@/lib/s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const NAME_MAX = 50;

const CONFLICT_MESSAGE =
  "다른 곳에서 프로필이 변경되었습니다. 새로고침 후 다시 시도해주세요.";

export async function PATCH(req: NextRequest) {
  const session = await requireActiveUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  if (name.length === 0) {
    return NextResponse.json(
      { error: "invalid_name", message: "이름을 입력해주세요." },
      { status: 400 }
    );
  }
  if (name.length > NAME_MAX) {
    return NextResponse.json(
      { error: "invalid_name", message: `이름은 ${NAME_MAX}자 이내여야 합니다.` },
      { status: 400 }
    );
  }

  const imageAction = String(form.get("imageAction") ?? "keep");

  if (imageAction === "keep") {
    const updated = await prisma.user.update({
      where: { id: session.id },
      data: { name },
      select: { id: true, name: true, email: true, image: true },
    });
    const avatarUrl = updated.image
      ? await getSignedImageUrl(updated.image)
      : null;
    return NextResponse.json({ user: updated, avatarUrl });
  }

  if (imageAction === "remove") {
    const current = await prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true },
    });
    const oldKey = current?.image ?? null;

    const result = await prisma.user.updateMany({
      where: { id: session.id, image: oldKey },
      data: { name, image: null },
    });
    if (result.count !== 1) {
      return NextResponse.json(
        { error: "conflict", message: CONFLICT_MESSAGE },
        { status: 409 }
      );
    }

    if (oldKey) {
      deleteFromS3(oldKey).catch(() => {
        // best-effort orphan cleanup
      });
    }

    const fresh = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, image: true },
    });
    return NextResponse.json({ user: fresh, avatarUrl: null });
  }

  if (imageAction === "replace") {
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "image_required", message: "이미지를 선택해주세요." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "image_too_large", message: "이미지는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "image_type", message: "JPG, PNG, WEBP 형식만 허용됩니다." },
        { status: 400 }
      );
    }

    const current = await prisma.user.findUnique({
      where: { id: session.id },
      select: { image: true },
    });
    const oldKey = current?.image ?? null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : "webp";
    const newKey = `avatars/${session.id}/${Date.now()}.${ext}`;

    const uploaded = await uploadToS3(buffer, newKey, file.type).catch(
      () => null
    );
    if (uploaded === null) {
      return NextResponse.json(
        { error: "upload_failed", message: "이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    const result = await prisma.user
      .updateMany({
        where: { id: session.id, image: oldKey },
        data: { name, image: newKey },
      })
      .catch(() => null);

    if (result === null) {
      // DB 오류 — 방금 올린 객체 정리
      deleteFromS3(newKey).catch(() => {});
      return NextResponse.json(
        { error: "internal", message: "저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    if (result.count !== 1) {
      // race conflict — 방금 올린 객체 정리
      deleteFromS3(newKey).catch(() => {});
      return NextResponse.json(
        { error: "conflict", message: CONFLICT_MESSAGE },
        { status: 409 }
      );
    }

    if (oldKey) {
      deleteFromS3(oldKey).catch(() => {
        // best-effort orphan cleanup
      });
    }

    const fresh = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, image: true },
    });
    const avatarUrl = fresh?.image
      ? await getSignedImageUrl(fresh.image)
      : null;
    return NextResponse.json({ user: fresh, avatarUrl });
  }

  return NextResponse.json(
    { error: "invalid_image_action" },
    { status: 400 }
  );
}
