"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkCard } from "@/components/links/link-card";
import type { AdminLink, AdminLinkFormPayload } from "@/lib/queries/use-admin-links";
import type { AdminLinkCategory } from "@/lib/queries/use-admin-link-categories";

interface LinkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AdminLink | null;
  categories: AdminLinkCategory[];
  onSubmit: (payload: AdminLinkFormPayload) => Promise<{ error: string | null }>;
}

export function LinkFormDialog({
  open,
  onOpenChange,
  initial,
  categories,
  onSubmit,
}: LinkFormDialogProps) {
  const [title, setTitle] = useState(() => initial?.title ?? "");
  const [url, setUrl] = useState(() => initial?.url ?? "");
  const [author, setAuthor] = useState(() => initial?.author ?? "");
  const [description, setDescription] = useState(
    () => initial?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    () => initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      title: title.trim(),
      url: url.trim(),
      author: author.trim(),
      description: description.trim() === "" ? null : description.trim(),
      categoryId,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  const previewAuthor = author.trim().startsWith("@")
    ? author.trim()
    : author.trim() === ""
      ? ""
      : `@${author.trim()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "링크 수정" : "새 링크"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="link-title">제목</Label>
            <Input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="예: 매크로 모니터"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-author">작성자 (@handle)</Label>
            <Input
              id="link-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={50}
              placeholder="예: @all.gordon_m"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-category">카테고리</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="link-category">
                <SelectValue placeholder="카테고리 선택">
                  {(v) =>
                    categories.find((c) => c.id === v)?.name ?? "카테고리 선택"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-description">설명 (선택)</Label>
            <Textarea
              id="link-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="1행 메모"
            />
          </div>

          {title && url ? (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">미리보기</Label>
              <LinkCard
                title={title}
                author={previewAuthor}
                url={url}
                description={description.trim() || null}
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
