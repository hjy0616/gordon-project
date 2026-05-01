import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye, MessageCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostContent } from "@/components/board/post-content";
import { LikeButton } from "@/components/board/like-button";
import { ViewCounter } from "@/components/board/view-counter";
import { CommentSection } from "@/components/board/comment-section";
import { PostActions } from "@/components/board/post-actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; postId: string }>;
}

function formatDateTime(value: Date) {
  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug, postId } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const post = await prisma.post.findUnique({
    where: { id: postId },
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

  if (!post || !post.board.isActive || post.board.slug !== slug) {
    notFound();
  }

  const [comments, userLike] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: post.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    userId
      ? prisma.postLike.findUnique({
          where: { postId_userId: { postId: post.id, userId } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const initials =
    post.author.name?.slice(0, 1).toUpperCase() ??
    post.author.id.slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ViewCounter postId={post.id} />

      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/board/${post.board.slug}`} />}
        >
          <ChevronLeft />
          {post.board.name}
        </Button>
      </div>

      <article className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-border pb-4">
          <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="size-7">
                {post.author.image && (
                  <AvatarImage src={post.author.image} alt={post.author.name ?? ""} />
                )}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{post.author.name ?? "익명"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(post.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3.5" />
                {post._count.comments}
              </span>
            </div>
          </div>
        </header>

        <PostContent html={post.content} />

        <div className="flex items-center justify-between border-t border-border pt-4">
          <LikeButton
            postId={post.id}
            initialLiked={!!userLike}
            initialCount={post._count.likes}
          />
          <PostActions
            postId={post.id}
            authorId={post.authorId}
            boardSlug={post.board.slug}
          />
        </div>
      </article>

      <section className="border-t border-border pt-6">
        <CommentSection
          postId={post.id}
          initialComments={comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
