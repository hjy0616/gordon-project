"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserRow, UserStatus, Pagination } from "./status-badge";

interface UseAdminUsersOptions {
  defaultStatus?: string;
  renewalOnly?: boolean;
  limit?: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { defaultStatus, renewalOnly = false, limit = 20 } = options;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (renewalOnly) {
        params.set("renewal", "true");
      } else if (defaultStatus && defaultStatus !== "all") {
        params.set("status", defaultStatus);
      }

      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
      setLoading(false);
    },
    [defaultStatus, renewalOnly, search, limit]
  );

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", String(limit));
    if (renewalOnly) {
      params.set("renewal", "true");
    } else if (defaultStatus && defaultStatus !== "all") {
      params.set("status", defaultStatus);
    }
    if (search) params.set("search", search);

    fetch(`/api/admin/users?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data) {
          setUsers(data.users);
          setPagination(data.pagination);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [defaultStatus, renewalOnly, search, limit]);

  const updateStatus = useCallback(
    async (userId: string, status: UserStatus) => {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchUsers(pagination.page);
    },
    [fetchUsers, pagination.page]
  );

  const toggleRole = useCallback(
    async (userId: string, currentRole: string) => {
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers(pagination.page);
    },
    [fetchUsers, pagination.page]
  );

  const approveUser = useCallback(
    async (userId: string, activeFrom: string, activeUntil: string) => {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE", activeFrom, activeUntil }),
      });
      fetchUsers(pagination.page);
    },
    [fetchUsers, pagination.page]
  );

  const approveRenewal = useCallback(
    async (userId: string, activeUntil: string) => {
      await fetch(`/api/admin/users/${userId}/renewal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeUntil }),
      });
      fetchUsers(pagination.page);
    },
    [fetchUsers, pagination.page]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return { ok: false, error: data?.error ?? "삭제에 실패했습니다." };
      }
      await fetchUsers(pagination.page);
      return { ok: true };
    },
    [fetchUsers, pagination.page]
  );

  return {
    users,
    pagination,
    loading,
    search,
    setSearch,
    fetchUsers,
    updateStatus,
    toggleRole,
    approveUser,
    approveRenewal,
    deleteUser,
  };
}
