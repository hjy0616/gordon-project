"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface AdminLinkCategory {
  id: string;
  name: string;
  sortOrder: number;
  _count: { links: number };
}

export function useAdminLinkCategories() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<AdminLinkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/admin/link-categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("카테고리 목록을 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        setCategories(data.categories);
        setError(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refetchKey]);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  const invalidatePublic = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["links"] });
  }, [queryClient]);

  const createCategory = useCallback(
    async (name: string) => {
      const res = await fetch("/api/admin/link-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "생성에 실패했습니다." };
      }
      refetch();
      invalidatePublic();
      return { error: null };
    },
    [refetch, invalidatePublic],
  );

  const updateCategory = useCallback(
    async (id: string, name: string) => {
      const res = await fetch(`/api/admin/link-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "수정에 실패했습니다." };
      }
      refetch();
      invalidatePublic();
      return { error: null };
    },
    [refetch, invalidatePublic],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/link-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "삭제에 실패했습니다." };
      }
      refetch();
      invalidatePublic();
      return { error: null };
    },
    [refetch, invalidatePublic],
  );

  const reorderCategories = useCallback(
    async (orderedIds: string[]) => {
      const res = await fetch("/api/admin/link-categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "정렬에 실패했습니다." };
      }
      refetch();
      invalidatePublic();
      return { error: null };
    },
    [refetch, invalidatePublic],
  );

  return {
    categories,
    loading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
