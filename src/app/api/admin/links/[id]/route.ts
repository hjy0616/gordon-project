import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";
import { validateLinkInput } from "@/lib/links/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const v = validateLinkInput(body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }
  const { title, url, author, description, categoryId } = v.value;

  const current = await prisma.link.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!current) {
    return NextResponse.json({ error: "링크를 찾을 수 없습니다." }, { status: 404 });
  }

  const category = await prisma.linkCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 400 });
  }

  let sortOrderUpdate: { sortOrder?: number } = {};
  if (current.categoryId !== categoryId) {
    const maxOrder = await prisma.link.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });
    sortOrderUpdate = { sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 };
  }

  try {
    const updated = await prisma.link.update({
      where: { id },
      data: { title, url, author, description, categoryId, ...sortOrderUpdate },
      select: {
        id: true,
        title: true,
        author: true,
        url: true,
        description: true,
        categoryId: true,
        sortOrder: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "링크를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  try {
    await prisma.link.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "링크를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
}
