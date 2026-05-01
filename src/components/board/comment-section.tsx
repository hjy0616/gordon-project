"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_COMMENT_LENGTH = 2000;

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentItem[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentItemView({
  comment,
  currentUserId,
  isAdmin,
  onUpdate,
  onDelete,
}: {
  comment: CommentItem;
  currentUserId: string | null;
  isAdmin: boolean;
  onUpdate: (next: CommentItem) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canModify = currentUserId === comment.authorId || isAdmin;
  const initials =
    comment.author.name?.slice(0, 1).toUpperCase() ??
    comment.author.id.slice(0, 1).toUpperCase();

  const submitEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("내용을 입력해주세요.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "수정에 실패했습니다.");
      setPending(false);
      return;
    }
    const updated: CommentItem = await res.json();
    onUpdate(updated);
    setEditing(false);
    setPending(false);
  };

  const submitDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    setPending(true);
    const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(comment.id);
    }
    setPending(false);
  };

  return (
    <li className="flex gap-3 py-3">
      <Avatar className="size-8 shrink-0">
        {comment.author.image && (
          <AvatarImage src={comment.author.image} alt={comment.author.name ?? ""} />
        )}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {comment.author.name ?? "익명"}
          </span>
          <span>{formatDate(comment.createdAt)}</span>
        </div>
        {editing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              disabled={pending}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.content);
                  setError(null);
                }}
              >
                취소
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={submitEdit}>
                저장
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">
            {comment.content}
          </p>
        )}
        {!editing && canModify && (
          <div className="mt-1 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setEditing(true)}
              disabled={pending}
            >
              <Pencil />
              수정
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={submitDelete}
              disabled={pending}
            >
              <Trash2 />
              삭제
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = !!session?.user && session.user.status === "ACTIVE";
  const currentUserId = session?.user?.id ?? null;
  const isAdmin = session?.user?.role === "ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("내용을 입력해주세요.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "등록에 실패했습니다.");
      setPending(false);
      return;
    }
    const created: CommentItem = await res.json();
    setComments((prev) => [...prev, created]);
    setDraft("");
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">댓글 {comments.length}</h2>

      <ul className="flex flex-col divide-y divide-border">
        {comments.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            아직 댓글이 없습니다.
          </li>
        ) : (
          comments.map((comment) => (
            <CommentItemView
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={(next) =>
                setComments((prev) => prev.map((c) => (c.id === next.id ? next : c)))
              }
              onDelete={(id) =>
                setComments((prev) => prev.filter((c) => c.id !== id))
              }
            />
          ))
        )}
      </ul>

      {canPost ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="댓글을 입력하세요"
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            disabled={pending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "등록 중..." : "댓글 등록"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {session?.user
            ? "활성 회원만 댓글을 작성할 수 있습니다."
            : "댓글을 작성하려면 로그인이 필요합니다."}
        </div>
      )}
    </div>
  );
}
