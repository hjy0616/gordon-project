"use client";

import { Badge } from "@/components/ui/badge";

export type UserStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
export type Role = "USER" | "ADMIN";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  activeFrom: string | null;
  activeUntil: string | null;
  createdAt: string;
  verificationImage: string | null;
  renewalImage: string | null;
  renewalSubmittedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING: "대기",
  ACTIVE: "활성",
  EXPIRED: "만료",
  SUSPENDED: "정지",
};

const STATUS_VARIANTS: Record<UserStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  ACTIVE: "default",
  EXPIRED: "secondary",
  SUSPENDED: "destructive",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className="text-xs">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS, STATUS_VARIANTS };
