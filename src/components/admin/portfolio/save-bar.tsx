"use client";

import { Button } from "@/components/ui/button";

interface Props {
  dirty: boolean;
  pending: boolean;
  invalidCount: number;
  errorMessage: string | null;
  onSave: () => void;
}

export function SaveBar({
  dirty,
  pending,
  invalidCount,
  errorMessage,
  onSave,
}: Props) {
  const blocked = invalidCount > 0;
  const disabled = !dirty || pending || blocked;

  let label = "✓ 저장됨";
  if (pending) label = "저장 중...";
  else if (dirty) label = "● 저장";

  let status = "모든 변경 사항이 저장되었습니다.";
  if (errorMessage) status = errorMessage;
  else if (blocked) status = `검증 오류: ${invalidCount}개`;
  else if (dirty) status = "저장하지 않은 변경 사항이 있습니다.";

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 p-3">
        <p
          className={`text-sm ${
            errorMessage || blocked
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {status}
        </p>
        <Button
          type="button"
          onClick={onSave}
          disabled={disabled}
          variant={dirty && !blocked ? "default" : "secondary"}
          className="shrink-0"
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
