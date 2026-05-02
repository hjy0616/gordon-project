"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  initialName: string;
  email: string;
  initialAvatarUrl: string | null;
};

export function AccountForm({ initialName, email, initialAvatarUrl }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // 폼 입력 상태
  const [name, setName] = useState(initialName);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl);
  const [removeImage, setRemoveImage] = useState(false);
  // 마지막으로 저장된 name baseline — 응답 후 dirty 비교 기준
  // (avatarUrl은 file/removeImage 플래그로 dirty가 추적되므로 별도 baseline 불필요)
  const [currentName, setCurrentName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  function setBlobPreview(f: File) {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const url = URL.createObjectURL(f);
    blobUrlRef.current = url;
    setPreviewUrl(url);
  }

  function onPickFile(f: File) {
    if (f.size > MAX) {
      setError("이미지는 5MB 이하여야 합니다.");
      return;
    }
    if (!ALLOWED.includes(f.type)) {
      setError("JPG, PNG, WEBP 형식만 허용됩니다.");
      return;
    }
    setError(null);
    setSuccess(false);
    setRemoveImage(false);
    setFile(f);
    setBlobPreview(f);
  }

  function onRemove() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const trimmed = name.trim();
  const dirty =
    trimmed !== currentName.trim() || file !== null || removeImage;
  const canSubmit = !submitting && dirty && trimmed.length > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const fd = new FormData();
    fd.set("name", trimmed);
    fd.set(
      "imageAction",
      file ? "replace" : removeImage ? "remove" : "keep"
    );
    if (file) fd.set("image", file);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      body: fd,
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(payload?.message ?? "저장에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    const newName: string = payload?.user?.name ?? "";
    const newAvatarUrl: string | null = payload?.avatarUrl ?? null;

    // blob URL 정리
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // 폼 입력 상태 리셋
    setFile(null);
    setRemoveImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // 표시·baseline 동기화
    setName(newName);
    setCurrentName(newName);
    setPreviewUrl(newAvatarUrl);

    setSuccess(true);
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ["board-posts"] });
    queryClient.invalidateQueries({ queryKey: ["board-post"] });
    queryClient.invalidateQueries({ queryKey: ["post-comments"] });
    router.refresh();
  }

  const fallbackChar = (trimmed || email).slice(0, 1).toUpperCase() || "?";

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label>프로필 이미지</Label>
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-20">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="프로필 이미지" />
            ) : null}
            <AvatarFallback className="text-xl">{fallbackChar}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            {(previewUrl || file) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="self-start"
              >
                이미지 제거
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · 5MB 이하</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" value={email} disabled aria-readonly />
        <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          maxLength={50}
          required
          autoComplete="name"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-500">저장되었습니다.</p>}

      <Button type="submit" disabled={!canSubmit}>
        {submitting ? "저장 중…" : "저장"}
      </Button>
    </form>
  );
}
