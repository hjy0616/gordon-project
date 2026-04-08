"use client";

import { useState } from "react";
import { Eye, Search, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  } = useAdminUsers({ defaultStatus: "PENDING" });

  const [imageUser, setImageUser] = useState<UserRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<UserRow | null>(null);

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
              title="거부"
              onClick={() => updateStatus(u.id, "SUSPENDED")}
            >
              <UserX className="size-4" />
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
    </div>
  );
}
