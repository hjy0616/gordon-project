import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { sanitizePostHtml } from "@/lib/sanitize-html";
import { trackEvent } from "@/lib/analytics";
import { withResolvedAuthorImages } from "@/lib/avatar";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!board || !board.isActive) {
    return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { boardId: board.id },
      select: {
        id: true,
        title: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { boardId: board.id } }),
  ]);

  const postsWithAvatars = await withResolvedAuthorImages(posts);

  return NextResponse.json({
    posts: postsWithAvatars,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json(
      { error: "활성 상태의 회원만 글을 작성할 수 있습니다." },
      { status: 403 },
    );
  }

  const { slug } = await params;
  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!board || !board.isActive) {
    return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const rawContent = typeof body.content === "string" ? body.content : "";

  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "제목은 200자 이내여야 합니다." }, { status: 400 });
  }

  const content = sanitizePostHtml(rawContent);
  if (!content.replace(/<[^>]*>/g, "").trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      boardId: board.id,
      authorId: user.id,
      title,
      content,
    },
    select: { id: true },
  });

  await trackEvent({
    userId: user.id,
    type: "post.create",
    path: post.id,
    props: { postId: post.id, boardSlug: slug },
  });

  return NextResponse.json(post, { status: 201 });
}
