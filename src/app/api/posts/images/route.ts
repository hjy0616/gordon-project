import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { requireActiveUser } from "@/lib/auth-utils";
import { uploadToS3 } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json(
      { error: "활성 회원만 이미지를 업로드할 수 있습니다." },
      { status: 403 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP 형식의 이미지만 허용됩니다." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "이미지 크기는 5MB 이하여야 합니다." },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
  const random = randomBytes(4).toString("hex");
  const key = `posts/${user.id}/${Date.now()}-${random}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadToS3(buffer, key, file.type);

  const url = `/api/posts/image?key=${encodeURIComponent(key)}`;
  return NextResponse.json({ url, key }, { status: 201 });
}
