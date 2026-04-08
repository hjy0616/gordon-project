"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import type { UserRow } from "./status-badge";

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR");
}

interface UserTableProps {
  users: UserRow[];
  loading: boolean;
  renderActions: (user: UserRow) => ReactNode;
  showRenewalDate?: boolean;
}

export function UserTable({ users, loading, renderActions, showRenewalDate = false }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="hidden md:table-cell">가입일</TableHead>
            {showRenewalDate ? (
              <TableHead className="hidden lg:table-cell">제출일</TableHead>
            ) : (
              <TableHead className="hidden lg:table-cell">활성 기간</TableHead>
            )}
            <TableHead className="text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                로딩 중...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                사용자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {u.email}
                </TableCell>
                <TableCell>
                  {u.role === "ADMIN" ? (
                    <Badge variant="default" className="text-xs">
                      ADMIN
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">USER</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={u.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                  {formatDate(u.createdAt)}
                </TableCell>
                {showRenewalDate ? (
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {formatDate(u.renewalSubmittedAt)}
                  </TableCell>
                ) : (
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {u.activeFrom || u.activeUntil
                      ? `${formatDate(u.activeFrom)} ~ ${formatDate(u.activeUntil)}`
                      : "-"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {renderActions(u)}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
