"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface RenewalStatus {
  canSubmit: boolean;
  daysRemaining: number | null;
  hasSubmitted: boolean;
  submittedAt: string | null;
}

export function RenewalBanner() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<RenewalStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.activeUntil) return;

    const now = new Date();
    const until = new Date(session.user.activeUntil);
    const days = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Only fetch renewal status if within 7-day window
    if (days > 7 || days <= 0) return;

    fetch("/api/verification/renewal")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, [session?.user?.activeUntil]);

  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP 형식만 허용됩니다.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("5MB 이하의 이미지만 허용됩니다.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }, []);

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("renewalImage", imageFile);

    const res = await fetch("/api/verification/renewal", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "업로드에 실패했습니다.");
      setUploading(false);
      return;
    }

    setStatus((prev) =>
      prev ? { ...prev, hasSubmitted: true, canSubmit: false } : null
    );
    setDialogOpen(false);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setUploading(false);
  };

  if (!status || (status.daysRemaining !== null && status.daysRemaining > 7)) {
    return null;
  }

  if (status.hasSubmitted) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm">
        <CheckCircle className="size-4 shrink-0 text-primary" />
        <span>재인증 이미지가 제출되었습니다. 관리자 검토 중입니다.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-sm">
        <AlertTriangle className="size-4 shrink-0 text-yellow-500" />
        <span>
          이용 기간이 {status.daysRemaining}일 남았습니다. 재인증이 필요합니다.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 text-xs"
          onClick={() => setDialogOpen(true)}
        >
          재인증하기
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>재인증 이미지 제출</DialogTitle>
            <DialogDescription>
              새 인증 이미지를 업로드해주세요. 관리자 확인 후 기간이 연장됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {error && (
              <p className="mb-2 text-xs text-destructive">{error}</p>
            )}
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="재인증 이미지"
                  className="h-40 w-full rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ALLOWED_TYPES.join(",");
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                <Upload className="mb-2 size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  클릭하여 이미지 업로드
                </p>
                <p className="text-xs text-muted-foreground/60">
                  JPG, PNG, WEBP (최대 5MB)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!imageFile || uploading}
            >
              {uploading ? "업로드 중..." : "제출"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
