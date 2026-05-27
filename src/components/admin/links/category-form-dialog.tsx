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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: { id: string; name: string } | null;
  onSubmit: (name: string) => Promise<{ error: string | null }>;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(() => initial?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(name.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "카테고리 수정" : "새 카테고리"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="cat-name">이름</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="예: 거시 경제 지표"
            autoFocus
          />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

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
