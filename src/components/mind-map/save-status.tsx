"use client";

import {
  AlertTriangle,
  Check,
  CloudOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SyncStatus } from "./use-mind-map-sync";

interface SaveStatusProps {
  status: SyncStatus;
  errorMessage: string | null;
  onRetry: () => void;
  onSave: () => void;
  onOverwriteRemote: () => void;
  onAcceptRemote: () => void;
}

export function SaveStatus({
  status,
  errorMessage,
  onRetry,
  onSave,
  onOverwriteRemote,
  onAcceptRemote,
}: SaveStatusProps) {
  // 변경 없음·저장 완료 모두 초록 체크로 항상 표시 — 사용자가 저장 상태를
  // 즉시 확인할 수 있도록.
  if (status === "idle" || status === "saved") {
    return (
      <span
        className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500"
        aria-live="polite"
        title="저장됨"
      >
        <Check className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">저장됨</span>
      </span>
    );
  }

  if (status === "dirty") {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onSave}
        aria-live="polite"
        aria-label="저장되지 않은 변경사항이 있어요. 클릭하면 저장합니다."
        title="저장되지 않은 변경사항이 있어요 (Cmd/Ctrl+S)"
        className="h-7 gap-1.5 text-xs text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-500"
      >
        <span
          className="size-2 rounded-full bg-amber-500"
          aria-hidden
        />
        <span>저장</span>
      </Button>
    );
  }

  if (status === "saving") {
    return (
      <span
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        <span className="hidden sm:inline">저장 중</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRetry}
        aria-live="polite"
        className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <CloudOff className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">
          {errorMessage ? `저장 실패 — 재시도` : "재시도"}
        </span>
        <RefreshCw className="size-3.5 sm:hidden" aria-hidden />
      </Button>
    );
  }

  // status === "conflict"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-500"
            aria-live="polite"
          >
            <AlertTriangle className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">다른 곳에서 수정됨</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex flex-col gap-2 p-2">
          <p className="text-sm font-medium">충돌이 발생했어요</p>
          <p className="text-xs text-muted-foreground">
            다른 탭이나 기기에서 이 마인드맵을 수정했습니다. 어떻게 할까요?
          </p>
          <button
            type="button"
            onClick={onOverwriteRemote}
            className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <div className="font-medium">내 변경 덮어쓰기</div>
            <div className="text-xs text-muted-foreground">
              저장 안 된 내 편집을 그대로 저장. 다른 곳의 변경은 사라집니다.
            </div>
          </button>
          <button
            type="button"
            onClick={onAcceptRemote}
            className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <div className="font-medium">서버 변경 받기</div>
            <div className="text-xs text-muted-foreground">
              내 저장 안 된 편집은 폐기되고 서버 최신 상태로 갱신됩니다.
            </div>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
