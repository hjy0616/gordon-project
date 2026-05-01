"use client";

import { useCallback, useEffect, useState } from "react";

export interface AdminBoard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { posts: number };
}

export interface BoardFormPayload {
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export function useAdminBoards() {
  const [boards, setBoards] = useState<AdminBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/boards")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("게시판 목록을 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        setBoards(data.boards);
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

  const createBoard = useCallback(
    async (payload: BoardFormPayload) => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "생성에 실패했습니다." };
      }
      refetch();
      return { error: null };
    },
    [refetch],
  );

  const updateBoard = useCallback(
    async (id: string, payload: Partial<BoardFormPayload>) => {
      const res = await fetch(`/api/admin/boards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: (data.error as string) ?? "수정에 실패했습니다." };
      }
      refetch();
      return { error: null };
    },
    [refetch],
  );

  const deleteBoard = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/boards/${id}`, { method: "DELETE" });
      if (!res.ok) {
        return { error: "삭제에 실패했습니다." };
      }
      refetch();
      return { error: null };
    },
    [refetch],
  );

  return {
    boards,
    loading,
    error,
    refetch,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}
