"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRow } from "./status-badge";

interface ApproveDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onApprove: (userId: string, activeFrom: string, activeUntil: string) => Promise<void>;
  title?: string;
}

export function ApproveDialog({ user, onClose, onApprove, title = "사용자 승인" }: ApproveDialogProps) {
  const today = new Date().toISOString().split("T")[0];
  const oneMonth = new Date();
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  const defaultUntil = oneMonth.toISOString().split("T")[0];

  const [activeFrom, setActiveFrom] = useState(today);
  const [activeUntil, setActiveUntil] = useState(defaultUntil);
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    if (!user) return;
    setSaving(true);
    await onApprove(user.id, activeFrom, activeUntil);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {user?.name || user?.email}의 활성 기간을 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="approveFrom">시작일</Label>
            <Input
              id="approveFrom"
              type="date"
              value={activeFrom}
              onChange={(e) => setActiveFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="approveUntil">종료일</Label>
            <Input
              id="approveUntil"
              type="date"
              value={activeUntil}
              onChange={(e) => setActiveUntil(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? "처리 중..." : "승인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
