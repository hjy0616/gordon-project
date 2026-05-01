import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PostList } from "@/components/board/post-list";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const board = await prisma.board.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  if (!board || !board.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-sm text-muted-foreground">{board.description}</p>
          )}
        </div>
        <Button nativeButton={false} render={<Link href={`/board/${board.slug}/write`} />}>
          <Pencil />
          글쓰기
        </Button>
      </div>

      <PostList slug={board.slug} />
    </div>
  );
}
