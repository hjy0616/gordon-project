import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveAdmin } from "@/lib/auth-utils";
import { validateCategoryName } from "@/lib/links/validation";

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
  const v = validateCategoryName((body as { name?: unknown } | null)?.name);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  try {
    const updated = await prisma.linkCategory.update({
      where: { id },
      data: { name: v.value },
      select: { id: true, name: true, sortOrder: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json(
          { error: "카테고리를 찾을 수 없습니다." },
          { status: 404 },
        );
      }
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "이미 존재하는 카테고리 이름입니다." },
          { status: 409 },
        );
      }
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

  const linkCount = await prisma.link.count({ where: { categoryId: id } });
  if (linkCount > 0) {
    return NextResponse.json(
      { error: `${linkCount}개의 링크가 연결되어 삭제할 수 없습니다.` },
      { status: 409 },
    );
  }

  try {
    await prisma.linkCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "카테고리를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
}
