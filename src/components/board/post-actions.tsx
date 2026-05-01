"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface PostActionsProps {
  postId: string;
  authorId: string;
  boardSlug: string;
}

export function PostActions({ postId, authorId, boardSlug }: PostActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const canModify =
    !!session?.user &&
    (session.user.id === authorId || session.user.role === "ADMIN");

  if (!canModify) return null;

  const handleDelete = async () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    setPending(true);
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/board/${boardSlug}`);
      router.refresh();
    } else {
      setPending(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        nativeButton={false}
        render={<Link href={`/board/${boardSlug}/${postId}/edit`} />}
      >
        <Pencil />
        수정
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleDelete}
      >
        <Trash2 />
        삭제
      </Button>
    </div>
  );
}
