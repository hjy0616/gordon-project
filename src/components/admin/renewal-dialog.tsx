"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZoomableImage } from "./image-dialog";
import type { UserRow } from "./status-badge";

const MAX_REJECT_REASON = 500;

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR");
}

interface RenewalDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onApprove: (userId: string, activeUntil: string) => Promise<void>;
  onReject: (
    userId: string,
    reason: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function RenewalDialog({
  user,
  onClose,
  onApprove,
  onReject,
}: RenewalDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        {user ? (
          <RenewalDialogBody
            key={user.id}
            user={user}
            onClose={onClose}
            onApprove={onApprove}
            onReject={onReject}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface RenewalDialogBodyProps {
  user: UserRow;
  onClose: () => void;
  onApprove: (userId: string, activeUntil: string) => Promise<void>;
  onReject: (
    userId: string,
    reason: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

function RenewalDialogBody({
  user,
  onClose,
  onApprove,
  onReject,
}: RenewalDialogBodyProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const defaultRenewalUntil = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const [renewalUntil, setRenewalUntil] = useState(defaultRenewalUntil);

  const [mode, setMode] = useState<"view" | "reject">("view");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/users/${user.id}/renewal`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setImageUrl(data?.url ?? null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  const handleApprove = async () => {
    if (!renewalUntil) return;
    setSaving(true);
    await onApprove(user.id, renewalUntil);
    setSaving(false);
    onClose();
  };

  const handleReject = async () => {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError("거부 사유를 입력해주세요.");
      return;
    }
    setRejectError("");
    setRejecting(true);
    const result = await onReject(user.id, trimmed);
    setRejecting(false);
    if (!result.ok) {
      setRejectError(result.error);
      return;
    }
    onClose();
  };

  const isRejectMode = mode === "reject";

  return (
    <>
      <DialogHeader>
        <DialogTitle>재인증 이미지 확인</DialogTitle>
        <DialogDescription>
          {user.name || user.email}
          {user.renewalSubmittedAt &&
            ` · 제출일: ${formatDate(user.renewalSubmittedAt)}`}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-center min-h-[200px]">
        {loading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="이미지 크게 보기"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="재인증 이미지"
              className="max-h-[70vh] w-full object-contain transition-opacity group-hover:opacity-90"
            />
            <span
              className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground opacity-90 shadow ring-1 ring-border backdrop-blur-sm transition-opacity group-hover:opacity-100"
              aria-hidden
            >
              <Maximize2 className="size-4" />
            </span>
          </button>
        ) : (
          <p className="text-muted-foreground">이미지를 불러올 수 없습니다.</p>
        )}
      </div>

      {isRejectMode ? (
        <div className="space-y-2">
          <Label htmlFor="rejectReason">거부 사유</Label>
          <Textarea
            id="rejectReason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={MAX_REJECT_REASON}
            placeholder="사용자에게 노출됩니다. 재제출이 필요한 이유를 명확히 작성해주세요."
            rows={4}
            autoFocus
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={rejectError ? "text-destructive" : ""}>
              {rejectError || "사용자의 사이드바에 그대로 표시됩니다."}
            </span>
            <span>
              {rejectReason.length} / {MAX_REJECT_REASON}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="renewalUntil">새 종료일</Label>
          <Input
            id="renewalUntil"
            type="date"
            value={renewalUntil}
            onChange={(e) => setRenewalUntil(e.target.value)}
          />
        </div>
      )}

      {isRejectMode ? (
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setMode("view");
              setRejectError("");
            }}
            disabled={rejecting}
          >
            이전으로
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejecting}
          >
            {rejecting ? "처리 중..." : "거부 확정"}
          </Button>
        </DialogFooter>
      ) : (
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => setMode("reject")}
            disabled={saving || loading || !imageUrl}
          >
            거부
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? "처리 중..." : "승인 및 연장"}
          </Button>
        </DialogFooter>
      )}

      <Dialog open={lightboxOpen && !!imageUrl} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[95vw]"
        >
          <DialogHeader className="p-4 pr-16">
            <DialogTitle>재인증 이미지</DialogTitle>
            <DialogDescription>{user.name || user.email}</DialogDescription>
          </DialogHeader>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl bg-black/50">
            {imageUrl ? <ZoomableImage src={imageUrl} alt="재인증 이미지" /> : null}
          </div>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="닫기"
            className="absolute z-10 inline-flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow ring-1 ring-border backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              top: "max(0.75rem, env(safe-area-inset-top))",
              right: "max(0.75rem, env(safe-area-inset-right))",
            }}
          >
            <X className="size-5" />
            <span className="sr-only">닫기</span>
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
