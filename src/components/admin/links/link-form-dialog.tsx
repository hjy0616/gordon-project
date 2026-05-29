"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import type { LinkEpisode } from "@/lib/links/types";
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
  const [episodes, setEpisodes] = useState<LinkEpisode[]>(
    () => initial?.episodes ?? [],
  );
  const [categoryId, setCategoryId] = useState(
    () => initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanedEpisodes = episodes
    .map((e) => ({ no: e.no.trim(), title: e.title.trim() }))
    .filter((e) => e.no || e.title);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const trimmedAuthor = author.trim();
    const result = await onSubmit({
      title: title.trim(),
      url: url.trim(),
      author: trimmedAuthor === "" ? null : trimmedAuthor,
      description: description.trim() === "" ? null : description.trim(),
      episodes: cleanedEpisodes.length > 0 ? cleanedEpisodes : null,
      categoryId,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  const previewAuthor =
    author.trim() === ""
      ? null
      : author.trim().startsWith("@")
        ? author.trim()
        : `@${author.trim()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
            <Label htmlFor="link-author">작성자 (@handle, 선택)</Label>
            <Input
              id="link-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={50}
              placeholder="망고 링크면 @handle, 네프콘 사이트면 비움"
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>네프콘 회차 (선택)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setEpisodes((prev) => [...prev, { no: "", title: "" }])
                }
              >
                <Plus className="mr-1 size-3.5" />
                회차 추가
              </Button>
            </div>
            {episodes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                네프콘 참고 사이트면 회차(번호+제목)를 추가하세요. 망고 링크면 비워두세요.
              </p>
            ) : (
              <div className="space-y-2">
                {episodes.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={e.no}
                      onChange={(ev) =>
                        setEpisodes((prev) =>
                          prev.map((p, idx) =>
                            idx === i ? { ...p, no: ev.target.value } : p,
                          ),
                        )
                      }
                      maxLength={16}
                      placeholder="번호"
                      className="w-20 shrink-0"
                    />
                    <Input
                      value={e.title}
                      onChange={(ev) =>
                        setEpisodes((prev) =>
                          prev.map((p, idx) =>
                            idx === i ? { ...p, title: ev.target.value } : p,
                          ),
                        )
                      }
                      maxLength={200}
                      placeholder="회차 제목"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setEpisodes((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {title && url ? (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">미리보기</Label>
              <LinkCard
                title={title}
                author={previewAuthor}
                url={url}
                description={description.trim() || null}
                episodes={cleanedEpisodes.length > 0 ? cleanedEpisodes : null}
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
