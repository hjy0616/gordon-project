"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Shield, ShieldOff, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminUsers } from "@/components/admin/use-admin-users";
import { UserTable } from "@/components/admin/user-table";
import { ApproveDialog } from "@/components/admin/approve-dialog";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { UserRow } from "@/components/admin/status-badge";

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const {
    users,
    pagination,
    loading,
    search,
    setSearch,
    fetchUsers,
    updateStatus,
    toggleRole,
    approveUser,
  } = useAdminUsers({ defaultStatus: statusFilter === "all" ? undefined : statusFilter });

  const [extendTarget, setExtendTarget] = useState<UserRow | null>(null);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    router.push(`/admin/users${value !== "all" ? `?status=${value}` : ""}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">사용자 관리</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="ACTIVE">활성</TabsTrigger>
            <TabsTrigger value="EXPIRED">만료</TabsTrigger>
            <TabsTrigger value="SUSPENDED">정지</TabsTrigger>
          </TabsList>
        </Tabs>

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
      </div>

      <UserTable
        users={users}
        loading={loading}
        renderActions={(u) => (
          <>
            {u.status === "ACTIVE" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setExtendTarget(u)}
                >
                  연장
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title={u.role === "ADMIN" ? "USER로 변경" : "ADMIN으로 변경"}
                  onClick={() => toggleRole(u.id, u.role)}
                >
                  {u.role === "ADMIN" ? (
                    <ShieldOff className="size-4" />
                  ) : (
                    <Shield className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  title="정지"
                  onClick={() => updateStatus(u.id, "SUSPENDED")}
                >
                  <UserX className="size-4" />
                </Button>
              </>
            )}
            {(u.status === "EXPIRED" || u.status === "SUSPENDED") && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-green-500 hover:text-green-600"
                title="재활성화"
                onClick={() => setExtendTarget(u)}
              >
                <UserCheck className="size-4" />
              </Button>
            )}
          </>
        )}
      />

      <PaginationControls
        pagination={pagination}
        onPageChange={fetchUsers}
      />

      <ApproveDialog
        user={extendTarget}
        onClose={() => setExtendTarget(null)}
        onApprove={approveUser}
        title={extendTarget?.status === "ACTIVE" ? "기간 연장" : "재활성화"}
      />
    </div>
  );
}
