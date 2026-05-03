"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteMindMapDialogProps {
  title: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export function DeleteMindMapDialog({
  title,
  onConfirm,
  disabled,
}: DeleteMindMapDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="마인드맵 삭제"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>마인드맵을 삭제하시겠어요?</AlertDialogTitle>
          <AlertDialogDescription>
            {`"${title || "Untitled"}"와 모든 노드·연결이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
