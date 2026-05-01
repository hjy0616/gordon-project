"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardPosts } from "@/lib/queries/use-board-posts";

interface PostListProps {
  slug: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export function PostList({ slug }: PostListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBoardPosts(slug, page);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const posts = data?.posts ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        아직 작성된 글이 없습니다. 첫 글을 작성해보세요!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/board/${slug}/${post.id}`}
              className="block px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="flex-1 truncate text-sm font-medium">
                  {post.title}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.author.name ?? "익명"}</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {post.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5" />
                    {post._count.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3.5" />
                    {post._count.comments}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft />
            이전
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
