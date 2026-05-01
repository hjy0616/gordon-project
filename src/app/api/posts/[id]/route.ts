import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { findMutablePost } from "@/lib/board-guards";
import { sanitizePostHtml } from "@/lib/sanitize-html";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      board: { select: { id: true, slug: true, name: true, isActive: true } },
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post || !post.board.isActive) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json({ error: "활성 회원만 수정할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const post = await findMutablePost(id);

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const rawContent = typeof body.content === "string" ? body.content : "";

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "제목은 1~200자 이내로 입력해주세요." }, { status: 400 });
  }

  const content = sanitizePostHtml(rawContent);
  if (!content.replace(/<[^>]*>/g, "").trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { title, content },
    select: { id: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json({ error: "활성 회원만 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const post = await findMutablePost(id);

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
