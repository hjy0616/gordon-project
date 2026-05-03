import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CanvasBackgroundColor,
  CanvasBackgroundPattern,
  MindMap,
  MindMapSummary,
  StoredMindMapEdge,
  StoredMindMapNode,
} from "@/types/mind-map";

const STALE = 30 * 1000;
const GC = 5 * 60 * 1000;

export interface MindMapListParams {
  q?: string;
  favoritesOnly?: boolean;
}

export function useMindMaps(params: MindMapListParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.favoritesOnly) search.set("favorites", "1");
  const query = search.toString();

  return useQuery<MindMapSummary[]>({
    queryKey: ["mind-maps", params.q ?? "", params.favoritesOnly ?? false],
    queryFn: async () => {
      const res = await fetch(`/api/mind-maps${query ? `?${query}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: STALE,
    gcTime: GC,
  });
}

export function useMindMap(id: string | null | undefined) {
  return useQuery<MindMap | null>({
    queryKey: ["mind-map", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/mind-maps/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(id),
    staleTime: STALE,
    gcTime: GC,
  });
}

export interface CreateMindMapInput {
  title?: string;
  emoji?: string;
  description?: string;
}

export function useCreateMindMap() {
  const qc = useQueryClient();
  return useMutation<MindMapSummary, Error, CreateMindMapInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/mind-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return Promise.reject(new Error("Create failed"));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mind-maps"] });
    },
  });
}

export interface UpdateMindMapInput {
  title?: string;
  emoji?: string | null;
  description?: string | null;
  nodes?: StoredMindMapNode[];
  edges?: StoredMindMapEdge[];
  isPublic?: boolean;
  canvasBackground?: CanvasBackgroundPattern;
  canvasBackgroundColor?: CanvasBackgroundColor;
  sketchyMode?: boolean;
  /** OCC base — 클라가 마지막으로 본 updatedAt. 일치하지 않으면 서버는 409 반환 */
  expectedUpdatedAt?: string;
}

/** 409 충돌 시 throw — sync hook이 catch해서 server snapshot으로 충돌 UX 처리 */
export class MindMapConflictError extends Error {
  serverRow: MindMap;
  constructor(serverRow: MindMap) {
    super("MindMapConflict");
    this.name = "MindMapConflictError";
    this.serverRow = serverRow;
  }
}

export function useUpdateMindMap(id: string) {
  const qc = useQueryClient();
  return useMutation<MindMap, Error, UpdateMindMapInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/mind-maps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 409) {
        const data = (await res.json().catch(() => null)) as {
          serverRow?: MindMap;
        } | null;
        if (data?.serverRow) {
          return Promise.reject(new MindMapConflictError(data.serverRow));
        }
        return Promise.reject(new Error("Conflict"));
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        return Promise.reject(new Error(data?.error ?? "Update failed"));
      }
      return res.json();
    },
    onSuccess: (row) => {
      qc.setQueryData<MindMap>(["mind-map", id], row);
      qc.invalidateQueries({ queryKey: ["mind-maps"] });
    },
  });
}

export function useToggleFavorite(id: string) {
  const qc = useQueryClient();
  return useMutation<{ isFavorite: boolean }, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/mind-maps/${id}/favorite`, {
        method: "POST",
      });
      if (!res.ok) return Promise.reject(new Error("Favorite toggle failed"));
      return res.json();
    },
    onSuccess: ({ isFavorite }) => {
      qc.setQueriesData<MindMapSummary[] | undefined>(
        { queryKey: ["mind-maps"] },
        (old) => old?.map((m) => (m.id === id ? { ...m, isFavorite } : m)),
      );
      qc.setQueryData<MindMap | null>(["mind-map", id], (old) =>
        old ? { ...old, isFavorite } : old,
      );
    },
  });
}

export function useDeleteMindMap() {
  const qc = useQueryClient();
  return useMutation<{ deleted: number }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/mind-maps/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) return Promise.reject(new Error("Delete failed"));
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mind-maps"] });
    },
  });
}

interface RotateShareTokenResponse {
  shareToken: string;
  isPublic: boolean;
}

/**
 * 공유 토큰 재발급 — 기존 토큰은 즉시 무효화되고 새 토큰이 발급됨.
 * isPublic도 자동 true로 설정. 응답으로 받은 새 토큰을 캐시에 반영.
 */
export function useRotateShareToken(id: string) {
  const qc = useQueryClient();
  return useMutation<RotateShareTokenResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/mind-maps/${id}/share/rotate`, {
        method: "POST",
      });
      if (!res.ok) return Promise.reject(new Error("Rotate failed"));
      return res.json();
    },
    onSuccess: ({ shareToken, isPublic }) => {
      qc.setQueryData<MindMap | null>(["mind-map", id], (old) =>
        old ? { ...old, shareToken, isPublic } : old,
      );
      qc.setQueriesData<MindMapSummary[] | undefined>(
        { queryKey: ["mind-maps"] },
        (old) =>
          old?.map((m) => (m.id === id ? { ...m, shareToken, isPublic } : m)),
      );
    },
  });
}

/**
 * 공유 완전 해제 — isPublic=false + shareToken=null. 다시 공유하려면 새 토큰 필요.
 */
export function useDisableShare(id: string) {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/mind-maps/${id}/share`, {
        method: "DELETE",
      });
      if (!res.ok) return Promise.reject(new Error("Disable failed"));
      return res.json();
    },
    onSuccess: () => {
      qc.setQueryData<MindMap | null>(["mind-map", id], (old) =>
        old ? { ...old, isPublic: false, shareToken: null } : old,
      );
      qc.setQueriesData<MindMapSummary[] | undefined>(
        { queryKey: ["mind-maps"] },
        (old) =>
          old?.map((m) =>
            m.id === id ? { ...m, isPublic: false, shareToken: null } : m,
          ),
      );
    },
  });
}

// 디바운스된 콜백 — useEffect cleanup으로 메모리 누수 방지
import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
