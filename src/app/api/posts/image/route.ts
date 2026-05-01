import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth-utils";
import { getSignedImageUrl } from "@/lib/s3";

const KEY_REGEX = /^posts\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/;

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key || !KEY_REGEX.test(key)) {
    return NextResponse.json({ error: "잘못된 키입니다." }, { status: 400 });
  }

  const signedUrl = await getSignedImageUrl(key);
  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: {
      "Cache-Control": "private, max-age=600",
    },
  });
}
