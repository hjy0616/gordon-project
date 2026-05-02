import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findMutablePost } from "@/lib/board-guards";
import { getAuthUser } from "@/lib/auth-utils";
import { trackEvent } from "@/lib/analytics";

const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await findMutablePost(id);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });

  const authUser = await getAuthUser();
  if (authUser) {
    const cutoff = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
    const recent = await prisma.userEvent.findFirst({
      where: {
        userId: authUser.id,
        type: "post.view",
        path: id,
        createdAt: { gt: cutoff },
      },
      select: { id: true },
    });
    if (!recent) {
      await trackEvent({
        userId: authUser.id,
        type: "post.view",
        path: id,
        props: { postId: id },
      });
    }
  }

  return NextResponse.json({ viewCount: updated.viewCount });
}
