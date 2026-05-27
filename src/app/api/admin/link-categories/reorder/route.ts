import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const orderedIds = (body as { orderedIds?: unknown } | null)?.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((x) => typeof x !== "string")) {
    return NextResponse.json({ error: "orderedIds는 문자열 배열이어야 합니다." }, { status: 400 });
  }
  const ids = orderedIds as string[];

  const existingCount = await prisma.linkCategory.count();
  if (ids.length !== existingCount) {
    return NextResponse.json(
      { error: "전체 카테고리 수와 일치하지 않습니다." },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.linkCategory.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
