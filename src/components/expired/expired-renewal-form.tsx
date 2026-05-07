"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface InitialStatus {
  hasSubmitted: boolean;
  submittedAt: string | null;
}

export function ExpiredRenewalForm({
  initialStatus,
}: {
  initialStatus: InitialStatus;
}) {
  const [hasSubmitted, setHasSubmitted] = useState(initialStatus.hasSubmitted);
  const [submittedAt, setSubmittedAt] = useState(initialStatus.submittedAt);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("JPG, PNG, WEBP 형식만 허용됩니다.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("5MB 이하의 이미지만 허용됩니다.");
        return;
      }
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    },
    [imagePreview]
  );

  const handleClear = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

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
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "업로드에 실패했습니다.");
      setUploading(false);
      return;
    }

    setHasSubmitted(true);
    setSubmittedAt(new Date().toISOString());
    handleClear();
    setUploading(false);
  };

  if (hasSubmitted) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">
              관리자 검토 중
            </p>
            <p className="text-xs text-muted-foreground">
              {submittedAt
                ? `${new Date(submittedAt).toLocaleString("ko-KR")} 제출`
                : "재인증 이미지가 제출되었습니다."}
            </p>
            <p className="text-xs text-muted-foreground">
              승인되면 자동으로 대시보드로 이동합니다. 새 이미지를 다시 올리려면
              아래 버튼을 누르세요.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setHasSubmitted(false);
            setSubmittedAt(null);
          }}
        >
          새 이미지 다시 올리기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-destructive">{error}</p>}

      {imagePreview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="재인증 이미지"
            className="h-48 w-full rounded-md border object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
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

      <Button
        onClick={handleUpload}
        disabled={!imageFile || uploading}
        className="w-full"
      >
        {uploading ? "업로드 중..." : "재인증 이미지 제출"}
      </Button>
    </div>
  );
}
