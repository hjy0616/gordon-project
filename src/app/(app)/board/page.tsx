import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BoardListPage() {
  const boards = await prisma.board.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">게시판</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          망고단 멤버들과 의견을 나누는 공간입니다.
        </p>
      </div>

      {boards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          아직 등록된 게시판이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link key={board.id} href={`/board/${board.slug}`} className="group">
              <Card className="h-full transition-colors hover:bg-muted/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-primary" />
                    <CardTitle className="text-base">{board.name}</CardTitle>
                  </div>
                  {board.description && (
                    <CardDescription className="line-clamp-2">
                      {board.description}
                    </CardDescription>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    게시글 {board._count.posts}개
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
