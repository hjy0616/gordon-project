"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface AdminLink {
  id: string;
  title: string;
  author: string;
  url: string;
  description: string | null;
  categoryId: string;
  sortOrder: number;
  category: { id: string; name: string };
}

export interface AdminLinkFormPayload {
  title: string;
  url: string;
  author: string;
  description: string | null;
  categoryId: string;
}

export function useAdminLinks() {
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/links")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("링크 목록을 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        const flat: AdminLink[] = (
          data.categories as {
            id: string;
            name: string;
            links: {
              id: string;
              title: string;
              author: string;
              url: string;
              description: string | null;
              sortOrder: number;
            }[];
          }[]
        ).flatMap((c) =>
          c.links.map((l) => ({
            ...l,
            categoryId: c.id,
            category: { id: c.id, name: c.name },
          })),
        );
        setLinks(flat);
        setError(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refetchKey]);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefetchKey((k) => k + 1);
  }, []);

  const invalidatePublic = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["links"] });
  }, [queryClient]);

  const createLink = useCallback(
    async (payload: AdminLinkFormPayload) => {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const updateLink = useCallback(
    async (id: string, payload: AdminLinkFormPayload) => {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const deleteLink = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
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

  const reorderLinks = useCallback(
    async (categoryId: string, orderedIds: string[]) => {
      const res = await fetch("/api/admin/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, orderedIds }),
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
    links,
    loading,
    error,
    refetch,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
  };
}
