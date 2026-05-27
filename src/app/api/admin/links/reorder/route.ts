import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    categoryId?: unknown;
    orderedIds?: unknown;
  } | null;

  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId가 필요합니다." }, { status: 400 });
  }

  const orderedIds = body?.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((x) => typeof x !== "string")) {
    return NextResponse.json(
      { error: "orderedIds는 문자열 배열이어야 합니다." },
      { status: 400 },
    );
  }
  const ids = orderedIds as string[];

  const actualCount = await prisma.link.count({ where: { categoryId } });
  if (ids.length !== actualCount) {
    return NextResponse.json(
      { error: "해당 카테고리의 링크 수와 일치하지 않습니다." },
      { status: 400 },
    );
  }

  const found = await prisma.link.findMany({
    where: { id: { in: ids }, categoryId },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    return NextResponse.json(
      { error: "다른 카테고리의 링크가 포함되어 있습니다." },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.link.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
