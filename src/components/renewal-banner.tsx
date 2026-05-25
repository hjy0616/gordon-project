"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  IMAGE_ACCEPT_ATTR,
  normalizeImageFile,
  validateImageFile,
} from "@/lib/image-upload";
import {
  MEMBERSHIP_QUERY_KEY,
  fetchMembership,
  type MembershipSnapshot,
} from "@/hooks/use-membership-sentinel";

interface RenewalStatus {
  status?: "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
  canSubmit: boolean;
  daysRemaining: number | null;
  hasSubmitted: boolean;
  submittedAt: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
}

const RENEWAL_QUERY_KEY = ["renewal-status"] as const;

async function fetchRenewalStatus(): Promise<RenewalStatus | null> {
  const res = await fetch("/api/verification/renewal").catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => null)) as RenewalStatus | null;
  return data;
}

export function RenewalBanner() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // sentinel polling cache 구독 — useSession() stale 우회
  const { data: membershipSnapshot } = useQuery<MembershipSnapshot>({
    queryKey: MEMBERSHIP_QUERY_KEY,
    queryFn: fetchMembership,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const freshActiveUntil =
    membershipSnapshot?.kind === "ok" ? membershipSnapshot.activeUntil : null;
  const activeUntil = freshActiveUntil ?? session?.user?.activeUntil ?? null;
  const daysRemaining = (() => {
    if (!activeUntil) return null;
    const until = new Date(activeUntil);
    return Math.ceil((until.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  })();
  const shouldFetch =
    daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

  const { data: status } = useQuery<RenewalStatus | null>({
    queryKey: RENEWAL_QUERY_KEY,
    queryFn: fetchRenewalStatus,
    enabled: shouldFetch,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

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
      const data = await res.json().catch(() => ({}));
      setError(data.error || "업로드에 실패했습니다.");
      setUploading(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: RENEWAL_QUERY_KEY });
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
