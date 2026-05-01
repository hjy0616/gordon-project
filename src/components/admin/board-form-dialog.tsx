"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import type { AdminBoard, BoardFormPayload } from "./use-admin-boards";

interface BoardFormDialogProps {
  onClose: () => void;
  initial: AdminBoard | null;
  onSubmit: (payload: BoardFormPayload) => Promise<{ error: string | null }>;
}

export function BoardFormDialog({
  onClose,
  initial,
  onSubmit,
}: BoardFormDialogProps) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSlug = slug.trim().toLowerCase();
    const trimmedName = name.trim();
    const sortValue = Number(sortOrder);

    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setError("slug는 소문자, 숫자, 하이픈만 사용 가능합니다.");
      return;
    }
    if (!trimmedName) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!Number.isFinite(sortValue)) {
      setError("정렬 순서는 숫자여야 합니다.");
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      slug: trimmedSlug,
      name: trimmedName,
      description: description.trim(),
      isActive,
      sortOrder: sortValue,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{initial ? "게시판 수정" : "새 게시판"}</DialogTitle>
            <DialogDescription>
              slug는 URL에 사용됩니다 (/board/&lt;slug&gt;).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="board-slug">slug</Label>
            <Input
              id="board-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mango-opinions"
              maxLength={64}
              required
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="board-name">이름</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="망고단 의견"
              maxLength={100}
              required
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="board-description">설명 (선택)</Label>
            <Textarea
              id="board-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={300}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="board-sort">정렬 순서</Label>
            <Input
              id="board-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              숫자가 낮을수록 먼저 표시됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="board-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
              disabled={submitting}
            />
            <Label htmlFor="board-active" className="cursor-pointer">
              활성화 (사이드바·목록에 표시)
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "저장 중..." : initial ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
