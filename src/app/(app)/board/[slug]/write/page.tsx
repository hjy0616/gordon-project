import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/board/post-editor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardWritePage({ params }: PageProps) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/board/${slug}/write`);
  }

  const board = await prisma.board.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, isActive: true },
  });

  if (!board || !board.isActive) {
    notFound();
  }

  if (session.user.status !== "ACTIVE") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <h1 className="text-2xl font-semibold">{board.name} - 글쓰기</h1>
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          활성 상태의 회원만 글을 작성할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{board.name} - 글쓰기</h1>
      <PostEditor boardSlug={board.slug} />
    </div>
  );
}
