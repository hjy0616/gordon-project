"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, CheckCircle, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface RenewalStatus {
  canSubmit: boolean;
  daysRemaining: number | null;
  hasSubmitted: boolean;
  submittedAt: string | null;
}

export function SidebarRenewalStatus() {
  const { data: session } = useSession();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";

  const [renewalStatus, setRenewalStatus] = useState<RenewalStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const activeUntil = session?.user?.activeUntil;

  const daysRemaining = (() => {
    if (!activeUntil) return null;
    const now = new Date();
    const until = new Date(activeUntil);
    return Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  useEffect(() => {
    if (!isUrgent) return;

    fetch("/api/verification/renewal")
      .then((r) => r.json())
      .then(setRenewalStatus)
      .catch(() => {});
  }, [isUrgent]);

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

    setRenewalStatus((prev) =>
      prev ? { ...prev, hasSubmitted: true, canSubmit: false } : null
    );
    setDialogOpen(false);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setUploading(false);
  };

  if (!activeUntil || daysRemaining === null) return null;

  const formattedDate = new Date(activeUntil).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const hasSubmitted = renewalStatus?.hasSubmitted ?? false;

  // --- Collapsed mode: icon + tooltip ---
  if (collapsed) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                  isExpired
                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                    : isUrgent
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/30"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                }`}
                onClick={isUrgent && !hasSubmitted ? () => setDialogOpen(true) : undefined}
              />
            }
          >
            {isExpired ? (
              <AlertTriangle className="size-4" />
            ) : isUrgent ? (
              <AlertTriangle className="size-4" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">
              {isExpired ? "이용 기간 만료" : `${daysRemaining}일 남음`}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate} 만료</p>
          </TooltipContent>
        </Tooltip>

        <RenewalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          imageFile={imageFile}
          imagePreview={imagePreview}
          uploading={uploading}
          error={error}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          onClearImage={() => {
            setImageFile(null);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
          }}
        />
      </>
    );
  }

  // --- Expanded mode ---
  return (
    <>
      <div
        className={`rounded-md border p-3 ${
          isExpired
            ? "border-destructive/30 bg-destructive/5"
            : isUrgent
              ? "border-orange-500/30 bg-orange-500/5"
              : "border-emerald-500/20 bg-emerald-500/5"
        }`}
      >
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
          ) : isUrgent ? (
            <AlertTriangle className="size-4 shrink-0 text-orange-500" />
          ) : (
            <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
          )}
          <span
            className={`text-xs font-semibold ${
              isExpired
                ? "text-destructive"
                : isUrgent
                  ? "text-orange-500"
                  : "text-emerald-500"
            }`}
          >
            {isExpired ? "이용 기간 만료" : "이용 기간"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formattedDate} 만료{" "}
          {!isExpired && (
            <span className="text-foreground/70">({daysRemaining}일 남음)</span>
          )}
        </p>

        {isUrgent && !hasSubmitted && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 w-full border-orange-500/30 text-xs text-orange-500 hover:bg-orange-500/10"
            onClick={() => setDialogOpen(true)}
          >
            재인증하기
          </Button>
        )}

        {hasSubmitted && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
            <CheckCircle className="size-3.5" />
            <span>관리자 검토 중</span>
          </div>
        )}
      </div>

      <RenewalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        imageFile={imageFile}
        imagePreview={imagePreview}
        uploading={uploading}
        error={error}
        onFileSelect={handleFileSelect}
        onUpload={handleUpload}
        onClearImage={() => {
          setImageFile(null);
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }}
      />
    </>
  );
}

function RenewalDialog({
  open,
  onOpenChange,
  imageFile,
  imagePreview,
  uploading,
  error,
  onFileSelect,
  onUpload,
  onClearImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  error: string;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  onClearImage: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="재인증 이미지"
                className="h-40 w-full rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={onClearImage}
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
                  if (file) onFileSelect(file);
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onUpload} disabled={!imageFile || uploading}>
            {uploading ? "업로드 중..." : "제출"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
