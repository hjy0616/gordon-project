"use client";

import { useState } from "react";
import {
  Globe,
  Lock,
  Link as LinkIcon,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDisableShare,
  useRotateShareToken,
} from "@/lib/queries/use-mind-maps";

interface ShareToggleProps {
  mindMapId: string;
  isPublic: boolean;
  shareToken: string | null;
  onToggle: (next: boolean) => void;
  /**
   * rotate/disable 액션이 성공한 후 부모 view state를 갱신.
   * mutation 훅은 query cache를 갱신하지만 view는 local state로 렌더하므로
   * 명시적 콜백 없이는 UI가 stale.
   */
  onShareStateChange: (next: {
    shareToken: string | null;
    isPublic: boolean;
  }) => void;
  disabled?: boolean;
}

export function ShareToggle({
  mindMapId,
  isPublic,
  shareToken,
  onToggle,
  onShareStateChange,
  disabled,
}: ShareToggleProps) {
  const [copied, setCopied] = useState(false);
  const rotate = useRotateShareToken(mindMapId);
  const disableShare = useDisableShare(mindMapId);

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/mind-map/share/${shareToken}`
      : null;

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 차단 환경 — 무시
    }
  }

  function handleGenerateOrRotate() {
    rotate.mutate(undefined, {
      onSuccess: (data) => {
        onShareStateChange({
          shareToken: data.shareToken,
          isPublic: data.isPublic,
        });
      },
    });
    setCopied(false);
  }

  function handleDisable() {
    disableShare.mutate(undefined, {
      onSuccess: () => {
        onShareStateChange({ shareToken: null, isPublic: false });
      },
    });
    setCopied(false);
  }

  const busy = rotate.isPending || disableShare.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="gap-1.5"
          >
            {isPublic ? (
              <Globe className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
            <span className="hidden sm:inline">
              {isPublic ? "공개됨" : "비공개"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex flex-col gap-3 p-2">
          <div>
            <p className="text-sm font-medium">공유 설정</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              공개하면 로그인한 다른 회원이 공유 링크로 이 마인드맵을 읽기
              전용으로 볼 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(!isPublic)}
            disabled={disabled || busy}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="size-4 text-primary" />
              ) : (
                <Lock className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {isPublic ? "다른 회원에게 공개" : "비공개"}
              </span>
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isPublic ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block size-3.5 transform rounded-full bg-background transition-transform ${
                  isPublic ? "translate-x-[1.125rem]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
          {isPublic && shareUrl ? (
            <>
              <button
                type="button"
                onClick={copy}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {copied ? (
                    <Check className="size-4 shrink-0 text-green-600" />
                  ) : (
                    <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-sm">
                    {copied ? "복사됨!" : "공유 링크 복사"}
                  </span>
                </span>
              </button>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateOrRotate}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-3.5 ${rotate.isPending ? "animate-spin" : ""}`}
                  />
                  링크 재발급
                </button>
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  완전 해제
                </button>
              </div>
            </>
          ) : null}
          {isPublic && !shareUrl ? (
            <button
              type="button"
              onClick={handleGenerateOrRotate}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              <LinkIcon className="size-4" />
              {rotate.isPending ? "발급 중…" : "공유 링크 생성"}
            </button>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
