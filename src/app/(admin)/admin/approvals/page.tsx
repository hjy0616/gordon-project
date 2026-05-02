"use client";

import { useState } from "react";
import { Eye, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminUsers } from "@/components/admin/use-admin-users";
import { UserTable } from "@/components/admin/user-table";
import { ImageDialog } from "@/components/admin/image-dialog";
import { ApproveDialog } from "@/components/admin/approve-dialog";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { UserRow } from "@/components/admin/status-badge";

export default function AdminApprovalsPage() {
  const {
    users,
    pagination,
    loading,
    search,
    setSearch,
    fetchUsers,
    updateStatus,
    approveUser,
    deleteUser,
  } = useAdminUsers({ defaultStatus: "PENDING" });

  const [imageUser, setImageUser] = useState<UserRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteUser(deleteTarget.id);
    setDeleting(false);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">승인 대기</h1>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
          className="pl-9"
        />
      </div>

      <UserTable
        users={users}
        loading={loading}
        renderActions={(u) => (
          <>
            {u.verificationImage && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="인증 이미지 보기"
                onClick={() => setImageUser(u)}
              >
                <Eye className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-green-500 hover:text-green-600"
              title="승인"
              onClick={() => setApproveTarget(u)}
            >
              <UserCheck className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              title="거부 (재가입 차단)"
              onClick={() => updateStatus(u.id, "SUSPENDED")}
            >
              <UserX className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              title="삭제 (영구 제거)"
              onClick={() => setDeleteTarget(u)}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      />

      <PaginationControls
        pagination={pagination}
        onPageChange={fetchUsers}
      />

      <ImageDialog
        user={imageUser}
        onClose={() => setImageUser(null)}
        imageType="verification"
      />

      <ApproveDialog
        user={approveTarget}
        onClose={() => setApproveTarget(null)}
        onApprove={approveUser}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>유저 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {deleteTarget?.name ?? deleteTarget?.email}
              </span>{" "}
              ({deleteTarget?.email})을(를) 영구 삭제합니다. 이 작업은 되돌릴 수
              없으며 인증 이미지·세션 데이터가 모두 사라집니다. 동일 이메일로
              재가입이 가능해집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
