"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IMAGE_ACCEPT_ATTR,
  normalizeImageFile,
  validateImageFile,
} from "@/lib/image-upload";

interface InitialStatus {
  hasSubmitted: boolean;
  submittedAt: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
}

export function ExpiredRenewalForm({
  initialStatus,
}: {
  initialStatus: InitialStatus;
}) {
  const [hasSubmitted, setHasSubmitted] = useState(initialStatus.hasSubmitted);
  const [submittedAt, setSubmittedAt] = useState(initialStatus.submittedAt);
  const [rejectionReason, setRejectionReason] = useState(initialStatus.rejectionReason);
  const [rejectedAt, setRejectedAt] = useState(initialStatus.rejectedAt);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileSelect = useCallback(async (raw: File) => {
    setProcessing(true);
    try {
      const normalized = await normalizeImageFile(raw);
      if ("error" in normalized) {
        setError(normalized.error);
        return;
      }
      const check = validateImageFile(normalized.file);
      if (!check.ok) {
        setError(check.error);
        return;
      }
      setImageFile(normalized.file);
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(normalized.file);
      });
      setError("");
    } finally {
      setProcessing(false);
    }
  }, []);

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
    setRejectionReason(null);
    setRejectedAt(null);
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
              승인 후 페이지를 새로고침하면 대시보드로 이동합니다. 새 이미지를 다시 올리려면
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
      {rejectionReason ? (
        <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-500" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              재인증 거부 사유
            </p>
            <p className="text-xs leading-snug text-orange-700 break-words dark:text-orange-300">
              {rejectionReason}
            </p>
            {rejectedAt ? (
              <p className="text-[10px] text-muted-foreground">
                {new Date(rejectedAt).toLocaleString("ko-KR")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFileSelect(f);
          e.target.value = "";
        }}
      />

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
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mb-2 size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {processing ? "이미지 처리 중..." : "클릭하여 이미지 업로드"}
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
