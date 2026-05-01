import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/board/post-editor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; postId: string }>;
}

export default async function PostEditPage({ params }: PageProps) {
  const { slug, postId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/board/${slug}/${postId}/edit`);
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      board: { select: { slug: true, name: true, isActive: true } },
    },
  });

  if (!post || !post.board.isActive || post.board.slug !== slug) {
    notFound();
  }

  const canEdit =
    session.user.id === post.authorId || session.user.role === "ADMIN";

  if (!canEdit) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <h1 className="text-2xl font-semibold">수정 권한이 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          본인이 작성한 글만 수정할 수 있습니다.
        </p>
      </div>
    );
  }

  if (session.user.status !== "ACTIVE") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <h1 className="text-2xl font-semibold">{post.board.name} - 글 수정</h1>
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          활성 상태의 회원만 수정할 수 있습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{post.board.name} - 글 수정</h1>
      <PostEditor
        boardSlug={post.board.slug}
        postId={post.id}
        initialTitle={post.title}
        initialContent={post.content}
      />
    </div>
  );
}
