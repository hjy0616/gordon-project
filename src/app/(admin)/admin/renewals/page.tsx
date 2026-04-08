"use client";

import { useState } from "react";
import { FileCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/components/admin/use-admin-users";
import { UserTable } from "@/components/admin/user-table";
import { RenewalDialog } from "@/components/admin/renewal-dialog";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { UserRow } from "@/components/admin/status-badge";

export default function AdminRenewalsPage() {
  const {
    users,
    pagination,
    loading,
    search,
    setSearch,
    fetchUsers,
    approveRenewal,
  } = useAdminUsers({ renewalOnly: true });

  const [renewalTarget, setRenewalTarget] = useState<UserRow | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">재인증 요청</h1>

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
        showRenewalDate
        renderActions={(u) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-primary hover:text-primary"
            title="재인증 확인"
            onClick={() => setRenewalTarget(u)}
          >
            <FileCheck className="size-4" />
          </Button>
        )}
      />

      <PaginationControls
        pagination={pagination}
        onPageChange={fetchUsers}
      />

      <RenewalDialog
        user={renewalTarget}
        onClose={() => setRenewalTarget(null)}
        onApprove={approveRenewal}
      />
    </div>
  );
}
