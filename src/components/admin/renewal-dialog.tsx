"use client";

import { useEffect, useState } from "react";
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

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR");
}

interface RenewalDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onApprove: (userId: string, activeUntil: string) => Promise<void>;
}

export function RenewalDialog({ user, onClose, onApprove }: RenewalDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const oneMonth = new Date();
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  const [renewalUntil, setRenewalUntil] = useState(oneMonth.toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    fetch(`/api/admin/users/${user.id}/renewal`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setImageUrl(data?.url ?? null);
        setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const handleApprove = async () => {
    if (!user || !renewalUntil) return;
    setSaving(true);
    await onApprove(user.id, renewalUntil);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>재인증 이미지 확인</DialogTitle>
          <DialogDescription>
            {user?.name || user?.email}
            {user?.renewalSubmittedAt &&
              ` · 제출일: ${formatDate(user.renewalSubmittedAt)}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[200px]">
          {loading ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="재인증 이미지"
              className="max-h-[300px] w-full rounded-md object-contain"
            />
          ) : (
            <p className="text-muted-foreground">이미지를 불러올 수 없습니다.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="renewalUntil">새 종료일</Label>
          <Input
            id="renewalUntil"
            type="date"
            value={renewalUntil}
            onChange={(e) => setRenewalUntil(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? "처리 중..." : "승인 및 연장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
