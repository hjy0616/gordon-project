import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";
import { validateCategoryName } from "@/lib/links/validation";

export async function GET() {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.linkCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      sortOrder: true,
      _count: { select: { links: true } },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const v = validateCategoryName((body as { name?: unknown } | null)?.name);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const maxOrder = await prisma.linkCategory.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  try {
    const created = await prisma.linkCategory.create({
      data: { name: v.value, sortOrder: nextOrder },
      select: { id: true, name: true, sortOrder: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리 이름입니다." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "카테고리 생성에 실패했습니다." }, { status: 500 });
  }
}
