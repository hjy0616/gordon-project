import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";

const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const boards = await prisma.board.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ boards });
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const isActive = body.isActive !== false;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  if (!slug || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: "slug는 소문자, 숫자, 하이픈만 사용 가능합니다." },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  const existing = await prisma.board.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 409 });
  }

  const board = await prisma.board.create({
    data: {
      slug,
      name,
      description: description || null,
      isActive,
      sortOrder,
    },
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

  return NextResponse.json(board, { status: 201 });
}
