import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { findMutableComment } from "@/lib/board-guards";
import { withResolvedAuthorImage } from "@/lib/avatar";

const MAX_COMMENT_LENGTH = 2000;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json({ error: "활성 회원만 가능합니다." }, { status: 403 });
  }

  const { id } = await params;
  const comment = await findMutableComment(id);

  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (comment.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이내여야 합니다.` },
      { status: 400 },
    );
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });

  const updatedWithAvatar = await withResolvedAuthorImage(updated);

  return NextResponse.json(updatedWithAvatar);
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
  const comment = await findMutableComment(id);

  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (comment.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
