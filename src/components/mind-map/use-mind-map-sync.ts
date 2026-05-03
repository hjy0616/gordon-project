"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MindMapConflictError,
  type UpdateMindMapInput,
} from "@/lib/queries/use-mind-maps";
import {
  toStoredEdges,
  toStoredNodes,
  type CanvasBackgroundColor,
  type CanvasBackgroundPattern,
  type MindMap,
  type MindMapFlowEdge,
  type MindMapFlowNode,
  type StoredMindMapEdge,
  type StoredMindMapNode,
} from "@/types/mind-map";

const DEBOUNCE_MS = 10 * 60 * 1000; // 10분
const RETRY_DELAY_MS = 5000;
const RETRY_LIMIT = 1;
const SAVED_FLASH_MS = 3000;
const SENDBEACON_LIMIT = 60_000;

export type SyncStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

interface PendingPayload {
  nodes?: StoredMindMapNode[];
  edges?: StoredMindMapEdge[];
  title?: string;
  emoji?: string | null;
  isPublic?: boolean;
  canvasBackground?: CanvasBackgroundPattern;
  canvasBackgroundColor?: CanvasBackgroundColor;
  sketchyMode?: boolean;
}

export interface UseMindMapSyncResult {
  status: SyncStatus;
  errorMessage: string | null;
  serverSnapshot: MindMap | null;
  syncNodes: (nodes: MindMapFlowNode[]) => void;
  syncEdges: (edges: MindMapFlowEdge[]) => void;
  syncTitle: (title: string) => void;
  syncEmoji: (emoji: string | null) => void;
  syncIsPublic: (isPublic: boolean) => void;
  syncCanvasBackground: (pattern: CanvasBackgroundPattern) => void;
  syncCanvasBackgroundColor: (color: CanvasBackgroundColor) => void;
  syncSketchyMode: (mode: boolean) => void;
  retry: () => void;
  /** 디바운스를 무시하고 즉시 저장 — 사용자가 "지금 저장" 버튼이나 Ctrl+S */
  flushNow: () => void;
  /** 충돌 해결: 내 변경으로 덮어쓰기 (pending 유지 + 새 expectedUpdatedAt으로 재PUT) */
  overwriteRemote: () => void;
  /** 충돌 해결: 서버 변경 받기 (pending 폐기 + onAcceptRemote 콜백 호출) */
  acceptRemote: () => void;
}

interface UseMindMapSyncOptions {
  id: string;
  initial: MindMap;
  /** 충돌 시 서버 변경을 받을 때 호출 — 캔버스 상태를 server snapshot으로 갱신 */
  onAcceptRemote: (server: MindMap) => void;
  /**
   * 정상 저장 후 서버 응답을 외부에 알림 — 서버가 자동 발급한 shareToken,
   * 트림된 title 같은 derived 필드를 view state에 반영하는 데 사용.
   */
  onSaved?: (server: MindMap) => void;
}

export function useMindMapSync({
  id,
  initial,
  onAcceptRemote,
  onSaved,
}: UseMindMapSyncOptions): UseMindMapSyncResult {
  // onSaved를 ref로 보관 — 호출자가 새 함수를 매 렌더 만들어도 attemptFlush deps 안 흔들림
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);
  const qc = useQueryClient();

  const [status, setStatus] = useState<SyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverSnapshot, setServerSnapshot] = useState<MindMap | null>(null);

  // closure 안에서 최신 status를 읽기 위한 ref — conflict 상태 가드용.
  // setState는 closure 시점에 stale일 수 있어 ref로 우회.
  const statusRef = useRef<SyncStatus>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 모든 mutable 동기화 상태는 ref — cleanup/sendBeacon에서 stale 방지
  const lastSavedUpdatedAtRef = useRef<string>(initial.updatedAt);
  const pendingRef = useRef<PendingPayload>({});
  const inFlightRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // xyflow가 dimensions 측정 등으로 nodes 참조를 매 렌더 갱신하므로,
  // 의미 있는 변화(stored 표현)와 이전 값을 비교해 같으면 sync 호출 무시.
  // 안 그러면 PUT 직후 saved → dirty로 즉시 돌아가 사용자가 저장 안 된 듯 보임.
  const lastSyncedRef = useRef<{
    nodes: string;
    edges: string;
    title: string;
    emoji: string | null;
    isPublic: boolean;
    canvasBackground: CanvasBackgroundPattern;
    canvasBackgroundColor: CanvasBackgroundColor;
    sketchyMode: boolean;
  }>({
    nodes: JSON.stringify(initial.nodes),
    edges: JSON.stringify(initial.edges),
    title: initial.title,
    emoji: initial.emoji,
    isPublic: initial.isPublic,
    canvasBackground: initial.canvasBackground,
    canvasBackgroundColor: initial.canvasBackgroundColor,
    sketchyMode: initial.sketchyMode,
  });

  const hasPending = useCallback(() => {
    return Object.keys(pendingRef.current).length > 0;
  }, []);

  // status 갱신 시 mounted 가드
  const safeSetStatus = useCallback((s: SyncStatus) => {
    if (!isMountedRef.current) return;
    setStatus(s);
  }, []);

  const performPut = useCallback(
    async (payload: PendingPayload) => {
      const body: UpdateMindMapInput = {
        ...payload,
        expectedUpdatedAt: lastSavedUpdatedAtRef.current,
      };
      const res = await fetch(`/api/mind-maps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const data = (await res.json().catch(() => null)) as {
          serverRow?: MindMap;
        } | null;
        if (data?.serverRow) throw new MindMapConflictError(data.serverRow);
        throw new Error("Conflict");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      return (await res.json()) as MindMap;
    },
    [id],
  );

  // 자기 재귀 호출 시 stale closure 방지를 위해 ref로 우회
  const attemptFlushRef = useRef<() => Promise<void>>(async () => {});

  const attemptFlush = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!hasPending()) return;
    // conflict 상태에서는 자동 재시도 멈춤 — stale expectedUpdatedAt 으로 PUT 반복하면
    // 같은 409가 무한 루프. 사용자가 충돌 UI에서 overwriteRemote/acceptRemote 선택해야
    // lastSavedUpdatedAtRef가 갱신되어 다음 PUT이 정상 처리됨.
    if (statusRef.current === "conflict") return;

    const payload = pendingRef.current;
    pendingRef.current = {};
    inFlightRef.current = true;
    safeSetStatus("saving");
    setErrorMessage(null);

    try {
      const fresh = await performPut(payload);
      lastSavedUpdatedAtRef.current = fresh.updatedAt;
      // lastSyncedRef는 서버 응답이 아닌 *클라이언트가 보낸 payload* 기준으로 갱신.
      // 이유: 서버가 title/emoji를 trim하거나 nodes/edges 키 순서를 정규화하면
      // fresh.* 와 클라이언트 현재 state의 JSON.stringify 결과가 미세하게 달라지고,
      // 다음 useEffect 발화 시 syncNodes/syncEdges가 이를 dirty로 오인해 무한 round-trip.
      // 클라가 보낸 payload는 클라이언트 현재 state와 정확히 일치하므로 비교가 안전.
      // 보낸 필드만 갱신, 안 보낸 필드는 기존 값 보존.
      const sentNodesJson =
        payload.nodes !== undefined ? JSON.stringify(payload.nodes) : null;
      const sentEdgesJson =
        payload.edges !== undefined ? JSON.stringify(payload.edges) : null;
      lastSyncedRef.current = {
        nodes: sentNodesJson ?? lastSyncedRef.current.nodes,
        edges: sentEdgesJson ?? lastSyncedRef.current.edges,
        title:
          payload.title !== undefined ? payload.title : lastSyncedRef.current.title,
        emoji:
          payload.emoji !== undefined
            ? payload.emoji
            : lastSyncedRef.current.emoji,
        isPublic:
          payload.isPublic !== undefined
            ? payload.isPublic
            : lastSyncedRef.current.isPublic,
        canvasBackground:
          payload.canvasBackground !== undefined
            ? payload.canvasBackground
            : lastSyncedRef.current.canvasBackground,
        canvasBackgroundColor:
          payload.canvasBackgroundColor !== undefined
            ? payload.canvasBackgroundColor
            : lastSyncedRef.current.canvasBackgroundColor,
        sketchyMode:
          payload.sketchyMode !== undefined
            ? payload.sketchyMode
            : lastSyncedRef.current.sketchyMode,
      };
      retryCountRef.current = 0;
      qc.setQueryData<MindMap>(["mind-map", id], fresh);
      qc.invalidateQueries({ queryKey: ["mind-maps"] });
      // 서버가 추가/변경한 derived 필드(shareToken 등)를 view state에 반영
      onSavedRef.current?.(fresh);

      inFlightRef.current = false;
      if (hasPending()) {
        // 인플라이트 동안 들어온 변경 즉시 처리
        attemptFlushRef.current();
        return;
      }
      safeSetStatus("saved");
      if (savedFlashTimerRef.current)
        clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        // 그동안 새 변경 없으면 idle로
        if (!hasPending() && !inFlightRef.current) safeSetStatus("idle");
      }, SAVED_FLASH_MS);
    } catch (err) {
      inFlightRef.current = false;
      // 실패한 payload를 pending에 되돌림 — 새로 들어온 변경이 우선
      pendingRef.current = { ...payload, ...pendingRef.current };

      if (err instanceof MindMapConflictError) {
        if (!isMountedRef.current) return;
        setServerSnapshot(err.serverRow);
        safeSetStatus("conflict");
        setErrorMessage("다른 곳에서 수정되었습니다");
        return;
      }

      const msg = err instanceof Error ? err.message : "저장 실패";
      if (!isMountedRef.current) return;
      setErrorMessage(msg);
      safeSetStatus("error");

      if (retryCountRef.current < RETRY_LIMIT) {
        retryCountRef.current += 1;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          attemptFlushRef.current();
        }, RETRY_DELAY_MS);
      }
    }
  }, [hasPending, id, performPut, qc, safeSetStatus]);

  useEffect(() => {
    attemptFlushRef.current = attemptFlush;
  }, [attemptFlush]);

  const schedule = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      attemptFlush();
    }, DEBOUNCE_MS);
  }, [attemptFlush]);

  const merge = useCallback(
    (patch: PendingPayload) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      schedule();
      // 인플라이트 중이거나 conflict/error면 그 상태가 우선. 그 외엔 dirty로.
      if (!inFlightRef.current) {
        setStatus((prev) =>
          prev === "conflict" || prev === "error" ? prev : "dirty",
        );
      }
    },
    [schedule],
  );

  const syncNodes = useCallback(
    (nodes: MindMapFlowNode[]) => {
      const stored = toStoredNodes(nodes);
      const json = JSON.stringify(stored);
      if (json === lastSyncedRef.current.nodes) return;
      lastSyncedRef.current.nodes = json;
      merge({ nodes: stored });
    },
    [merge],
  );
  const syncEdges = useCallback(
    (edges: MindMapFlowEdge[]) => {
      const stored = toStoredEdges(edges);
      const json = JSON.stringify(stored);
      if (json === lastSyncedRef.current.edges) return;
      lastSyncedRef.current.edges = json;
      merge({ edges: stored });
    },
    [merge],
  );
  const syncTitle = useCallback(
    (title: string) => {
      if (title === lastSyncedRef.current.title) return;
      lastSyncedRef.current.title = title;
      merge({ title });
    },
    [merge],
  );
  const syncEmoji = useCallback(
    (emoji: string | null) => {
      if (emoji === lastSyncedRef.current.emoji) return;
      lastSyncedRef.current.emoji = emoji;
      merge({ emoji });
    },
    [merge],
  );
  const syncIsPublic = useCallback(
    (isPublic: boolean) => {
      if (isPublic === lastSyncedRef.current.isPublic) return;
      lastSyncedRef.current.isPublic = isPublic;
      merge({ isPublic });
    },
    [merge],
  );
  const syncCanvasBackground = useCallback(
    (pattern: CanvasBackgroundPattern) => {
      if (pattern === lastSyncedRef.current.canvasBackground) return;
      lastSyncedRef.current.canvasBackground = pattern;
      merge({ canvasBackground: pattern });
    },
    [merge],
  );
  const syncCanvasBackgroundColor = useCallback(
    (color: CanvasBackgroundColor) => {
      if (color === lastSyncedRef.current.canvasBackgroundColor) return;
      lastSyncedRef.current.canvasBackgroundColor = color;
      merge({ canvasBackgroundColor: color });
    },
    [merge],
  );
  const syncSketchyMode = useCallback(
    (mode: boolean) => {
      if (mode === lastSyncedRef.current.sketchyMode) return;
      lastSyncedRef.current.sketchyMode = mode;
      merge({ sketchyMode: mode });
    },
    [merge],
  );

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    // 사용자가 명시적으로 재시도 — 가드 풀어줌
    statusRef.current = "dirty";
    attemptFlush();
  }, [attemptFlush]);

  const flushNow = useCallback(() => {
    // conflict 상태에서는 충돌 UI에서만 해결 — Cmd+S/저장 버튼 직접 호출 방어.
    // 그러지 않으면 같은 stale OCC base로 PUT 반복 → 또 409.
    if (statusRef.current === "conflict") return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryCountRef.current = 0;
    attemptFlush();
  }, [attemptFlush]);

  const overwriteRemote = useCallback(() => {
    if (!serverSnapshot) return;
    lastSavedUpdatedAtRef.current = serverSnapshot.updatedAt;
    setServerSnapshot(null);
    setErrorMessage(null);
    retryCountRef.current = 0;
    // setState는 다음 렌더 후에 statusRef로 반영. 명시적으로 풀어줘 attemptFlush가 진행되게.
    statusRef.current = "dirty";
    attemptFlush();
  }, [attemptFlush, serverSnapshot]);

  const acceptRemote = useCallback(() => {
    if (!serverSnapshot) return;
    pendingRef.current = {};
    lastSavedUpdatedAtRef.current = serverSnapshot.updatedAt;
    lastSyncedRef.current = {
      nodes: JSON.stringify(serverSnapshot.nodes),
      edges: JSON.stringify(serverSnapshot.edges),
      title: serverSnapshot.title,
      emoji: serverSnapshot.emoji,
      isPublic: serverSnapshot.isPublic,
      canvasBackground: serverSnapshot.canvasBackground,
      canvasBackgroundColor: serverSnapshot.canvasBackgroundColor,
      sketchyMode: serverSnapshot.sketchyMode,
    };
    qc.setQueryData<MindMap>(["mind-map", id], serverSnapshot);
    onAcceptRemote(serverSnapshot);
    setServerSnapshot(null);
    setErrorMessage(null);
    safeSetStatus("idle");
  }, [id, onAcceptRemote, qc, safeSetStatus, serverSnapshot]);

  // 페이지 종료 시 best-effort beacon 전송. visibilitychange는 macOS에서 단순
  // 앱 전환에도 발생해 false-trigger가 잦으므로 정상 attemptFlush로 처리해
  // 응답을 받아 client state(lastSavedUpdatedAt + pendingRef)를 동기화한다.
  useEffect(() => {
    isMountedRef.current = true;

    function flushBeacon() {
      if (!hasPending()) return;
      // 진행 중인 PUT가 있으면 beacon 보내지 않음 — 중복 전송 방지
      if (inFlightRef.current) return;

      const payload = pendingRef.current;
      // 보내기 직전 pending 즉시 클리어 — beforeunload가 빠르게 반복 발화하거나
      // (HMR/re-mount 시) cleanup이 두 번 호출돼도 같은 데이터 두 번 안 보냄.
      // 응답을 못 받으므로 lastSavedUpdatedAtRef는 갱신 못함 (stale 상태로 유지).
      // 하지만 페이지가 재로딩되면 SSR로 fresh updatedAt을 받아 self-heal됨.
      pendingRef.current = {};
      const body = JSON.stringify({
        ...payload,
        expectedUpdatedAt: lastSavedUpdatedAtRef.current,
      });
      const url = `/api/mind-maps/${id}/sync`;
      if (
        typeof navigator !== "undefined" &&
        "sendBeacon" in navigator &&
        body.length < SENDBEACON_LIMIT
      ) {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(url, blob)) return;
      }
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        /* best-effort — pending은 이미 클리어됨 */
      });
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasPending() && !inFlightRef.current) return;
      flushBeacon();
      e.preventDefault();
      e.returnValue = "";
    }

    function onVisibilityChange() {
      // hidden은 진짜 종료가 아님 (macOS Cmd+Tab, 다른 데스크탑으로 전환 등).
      // 정상 attemptFlush로 처리해 응답을 받고 lastSavedUpdatedAtRef를 갱신.
      // 진짜 종료는 beforeunload가 잡아준다.
      if (
        document.visibilityState === "hidden" &&
        hasPending() &&
        !inFlightRef.current
      ) {
        attemptFlushRef.current();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (savedFlashTimerRef.current)
        clearTimeout(savedFlashTimerRef.current);
      // cleanup에서 beacon 호출 제거 — strict mode/HMR 시 effect가 cleanup-rerun
      // 되면 beacon이 fire-and-forget으로 데이터 보내고 client state는 stale로
      // 남아 다음 정상 PUT이 409. beforeunload가 진짜 종료를 잡아주므로 충분.
    };
  }, [hasPending, id]);

  return {
    status,
    errorMessage,
    serverSnapshot,
    syncNodes,
    syncEdges,
    syncTitle,
    syncEmoji,
    syncIsPublic,
    syncCanvasBackground,
    syncCanvasBackgroundColor,
    syncSketchyMode,
    retry,
    flushNow,
    overwriteRemote,
    acceptRemote,
  };
}
