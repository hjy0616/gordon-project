import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id }, select: { id: true } });
  if (!board) {
    return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await req.json();
  const data: {
    slug?: string;
    name?: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  } = {};

  if (typeof body.slug === "string") {
    const slug = body.slug.trim().toLowerCase();
    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: "slug는 소문자, 숫자, 하이픈만 사용 가능합니다." },
        { status: 400 },
      );
    }
    const dupe = await prisma.board.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (dupe) {
      return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
    }
    data.slug = slug;
  }
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }
    data.name = name;
  }
  if (typeof body.description === "string") {
    const description = body.description.trim();
    data.description = description || null;
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }
  if (Number.isFinite(Number(body.sortOrder))) {
    data.sortOrder = Number(body.sortOrder);
  }

  const updated = await prisma.board.update({
    where: { id },
    data,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id }, select: { id: true } });
  if (!board) {
    return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.board.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
