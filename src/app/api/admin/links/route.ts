import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";
import { validateLinkInput } from "@/lib/links/validation";

export async function POST(req: Request) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const v = validateLinkInput(body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }
  const { title, url, author, description, episodes, categoryId } = v.value;

  const category = await prisma.linkCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 400 });
  }

  const maxOrder = await prisma.link.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const created = await prisma.link.create({
    data: {
      title,
      url,
      author,
      description,
      episodes: episodes ? (episodes as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      categoryId,
      sortOrder: nextOrder,
    },
    select: {
      id: true,
      title: true,
      author: true,
      url: true,
      description: true,
      episodes: true,
      categoryId: true,
      sortOrder: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
