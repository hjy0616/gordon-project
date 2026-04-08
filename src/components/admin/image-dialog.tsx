"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRow } from "./status-badge";

interface ImageDialogProps {
  user: UserRow | null;
  onClose: () => void;
  imageType: "verification" | "renewal";
}

export function ImageDialog({ user, onClose, imageType }: ImageDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const endpoint =
      imageType === "verification"
        ? `/api/admin/users/${user.id}/image`
        : `/api/admin/users/${user.id}/renewal`;

    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setImageUrl(data?.url ?? null);
        setLoading(false);
      });

    return () => { active = false; };
  }, [user, imageType]);

  const title = imageType === "verification" ? "인증 이미지" : "재인증 이미지";

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {user?.name || user?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[200px]">
          {loading ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[400px] w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-muted-foreground">이미지를 불러올 수 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
