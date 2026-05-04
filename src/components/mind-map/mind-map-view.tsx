"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type DefaultEdgeOptions,
  type IsValidConnection,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, PenTool, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  emptyMindMapNode,
  NODE_DRAG_HANDLE_SELECTOR,
  toFlowEdges,
  toFlowNodes,
  type CanvasBackgroundColor,
  type CanvasBackgroundPattern,
  type MindMap,
  type MindMapFlowEdge,
  type MindMapFlowNode,
  type MindMapNodeData,
} from "@/types/mind-map";
import {
  useDeleteMindMap,
  useToggleFavorite,
} from "@/lib/queries/use-mind-maps";
import {
  backgroundPropsFor,
  bgClassFor,
  patternStrokeColor,
} from "@/lib/mind-map/canvas-style";
import { applySiblingCurveOffset } from "@/lib/mind-map/sibling-curve";
import { MindMapNode } from "./mind-map-node";
import { MindMapEdge } from "./edge/mind-map-edge";
import { AddNodeFab } from "./add-node-fab";
import { EmptyCanvasHint } from "./empty-canvas-hint";
import { ShareToggle } from "./share-toggle";
import { BackgroundPicker } from "./background-picker";
import { DeleteMindMapDialog } from "./delete-mind-map-dialog";
import { MindMapProvider } from "./mind-map-context";
import { useMindMapSync } from "./use-mind-map-sync";
import { SaveStatus } from "./save-status";

// xyflow는 dev 모드에서 nodeTypes 참조가 바뀌면 warning(error002)을 발화한다.
// 모듈 레벨 const도 Next.js HMR로 모듈 재평가 시 새 객체가 만들어지므로,
// 컴포넌트 내부에서 useMemo로 안정 참조를 보장한다 (아래 MindMapCanvas 참조).

interface MindMapViewProps {
  initial: MindMap;
  readonly: boolean;
}

export function MindMapView({ initial, readonly }: MindMapViewProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas initial={initial} readonly={readonly} />
    </ReactFlowProvider>
  );
}

function MindMapCanvas({ initial, readonly }: MindMapViewProps) {
  const router = useRouter();
  const toggleFavorite = useToggleFavorite(initial.id);
  const deleteMindMap = useDeleteMindMap();

  // 컴포넌트 라이프타임 동안 안정 참조 — xyflow error002 방지 (HMR 안전)
  const nodeTypes = useMemo(() => ({ mindMap: MindMapNode }), []);
  const edgeTypes = useMemo(() => ({ mindMap: MindMapEdge }), []);
  const defaultEdgeOptions = useMemo<DefaultEdgeOptions>(
    () => ({ type: "mindMap" }),
    [],
  );
  const fitViewOptions = useMemo(() => ({ padding: 0.2, maxZoom: 1.2 }), []);

  const [title, setTitle] = useState(initial.title);
  const [emoji, setEmoji] = useState<string>(initial.emoji ?? "🧠");
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [isFavorite, setIsFavorite] = useState(initial.isFavorite);
  const [shareToken, setShareToken] = useState<string | null>(initial.shareToken);
  const [canvasBackground, setCanvasBackground] =
    useState<CanvasBackgroundPattern>(initial.canvasBackground);
  const [canvasBackgroundColor, setCanvasBackgroundColor] =
    useState<CanvasBackgroundColor>(initial.canvasBackgroundColor);
  const [sketchyMode, setSketchyMode] = useState(initial.sketchyMode);

  // mount 시점 한 번만 평가 — useState lazy init으로 stable
  const [seed] = useState(() => ({
    nodes: toFlowNodes(initial.nodes),
    edges: toFlowEdges(initial.edges),
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapFlowNode>(
    seed.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapFlowEdge>(
    seed.edges,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance<
    MindMapFlowNode,
    MindMapFlowEdge
  > | null>(null);

  // 충돌 시 server snapshot으로 외부 state 갱신
  const handleAcceptRemote = useCallback(
    (server: MindMap) => {
      setNodes(toFlowNodes(server.nodes));
      setEdges(toFlowEdges(server.edges));
      setTitle(server.title);
      setEmoji(server.emoji ?? "🧠");
      setIsPublic(server.isPublic);
      setIsFavorite(server.isFavorite);
      setShareToken(server.shareToken);
      setCanvasBackground(server.canvasBackground);
      setCanvasBackgroundColor(server.canvasBackgroundColor);
      setSketchyMode(server.sketchyMode);
    },
    [setEdges, setNodes],
  );

  // 정상 저장 후 서버가 자동 발급한 shareToken을 view state에 반영.
  // (isPublic을 false→true로 토글하면 서버가 토큰을 lazy 발급)
  const handleSaved = useCallback((server: MindMap) => {
    setShareToken(server.shareToken);
    setIsPublic(server.isPublic);
  }, []);

  const sync = useMindMapSync({
    id: initial.id,
    initial,
    onAcceptRemote: handleAcceptRemote,
    onSaved: handleSaved,
  });

  // 사용자가 드래그를 시작한 시점의 source 노드 + 클릭한 flow 좌표의 angle.
  // onConnectEnd에서 target angle을 캡처해 함께 새 엣지에 anchor로 박는다.
  const startRef = useRef<{ nodeId: string; angle: number } | null>(null);

  const onConnectStart = useCallback(
    (
      event: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent | null,
      params: { nodeId?: string | null },
    ) => {
      startRef.current = null;
      if (readonly) return;
      if (!event || !params.nodeId) return;
      const inst = rfInstance.current;
      if (!inst) return;
      const node = inst.getNode(params.nodeId);
      if (!node) return;
      const native = "nativeEvent" in event ? event.nativeEvent : event;
      const pt =
        "touches" in native
          ? native.touches[0]
          : (native as MouseEvent);
      if (!pt) return;
      const w = node.measured?.width ?? 0;
      const h = node.measured?.height ?? 0;
      if (w <= 0 || h <= 0) return;
      const cx = node.position.x + w / 2;
      const cy = node.position.y + h / 2;
      const flow = inst.screenToFlowPosition({
        x: pt.clientX,
        y: pt.clientY,
      });
      startRef.current = {
        nodeId: params.nodeId,
        angle: Math.atan2(flow.y - cy, flow.x - cx),
      };
    },
    [readonly],
  );

  // 모든 엣지 생성은 onConnectEnd에서 처리. onConnect는 비워둠 — addEdge로
  // 자동 생성하면 anchor가 안 박혀서 floating으로만 그려진다.
  const onConnect = useCallback(() => {
    /* no-op — onConnectEnd가 anchor와 함께 엣지를 만든다 */
  }, []);

  const isValidConnection = useCallback<IsValidConnection>(
    (conn) => conn.source !== conn.target,
    [],
  );

  // 외부 useNodesState/useEdgesState의 변화를 감지해 sync. NodeQuickAdd 등이
  // useReactFlow의 addNodes/addEdges/updateNodeData를 호출하면 onNodesChange/
  // onEdgesChange를 통해 여기까지 반영되므로 모든 변경 경로가 한 곳으로 모인다.
  const isFirstNodesSync = useRef(true);
  const isFirstEdgesSync = useRef(true);

  // 리사이즈 드래그 중에는 매 프레임 stringify+merge를 회피한다.
  // NodeResizer가 onResize 콜백을 60Hz로 발화 → updateNodeData → setNodes →
  // 본 useEffect → sync.syncNodes(JSON.stringify O(N) + merge + setStatus). 50+ 노드에서
  // 멈칫거림(씹힘) 원인. 시작 시 게이트 ON, 종료 시 OFF + 보류된 변경 1회 flush.
  const isResizingRef = useRef(false);
  const pendingResizeFlushRef = useRef(false);

  useEffect(() => {
    if (readonly) return;
    if (isFirstNodesSync.current) {
      isFirstNodesSync.current = false;
      return;
    }
    if (isResizingRef.current) {
      pendingResizeFlushRef.current = true;
      return;
    }
    sync.syncNodes(nodes);
  }, [nodes, readonly, sync]);
  useEffect(() => {
    if (readonly) return;
    if (isFirstEdgesSync.current) {
      isFirstEdgesSync.current = false;
      return;
    }
    sync.syncEdges(edges);
  }, [edges, readonly, sync]);

  const beginResize = useCallback(() => {
    isResizingRef.current = true;
  }, []);
  const endResize = useCallback(() => {
    isResizingRef.current = false;
    if (!pendingResizeFlushRef.current) return;
    pendingResizeFlushRef.current = false;
    const inst = rfInstance.current;
    if (!inst) return;
    sync.syncNodes(inst.getNodes() as MindMapFlowNode[]);
  }, [sync]);

  // 같은 클립보드 페이로드를 연속 ⌘V 시 누적 오프셋, 새 ⌘C가 들어오면 0으로 리셋.
  const pasteOffsetRef = useRef(0);
  const lastClipboardKeyRef = useRef<string | null>(null);

  // Tab 키로 캔버스 중앙에 새 노드 추가, Cmd/Ctrl+S로 즉시 저장,
  // Cmd/Ctrl+C/V로 선택 노드 1개 복사·붙여넣기 (시스템 클립보드 + JSON marker).
  useEffect(() => {
    if (readonly) return;

    function isEditableFocus() {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function onKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+S → 수동 저장 (input/textarea 안에서도 작동해야 함)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        sync.flushNow();
        return;
      }

      if (e.key !== "Tab") return;
      if (isEditableFocus()) return;
      const inst = rfInstance.current;
      const container = containerRef.current;
      if (!inst || !container) return;

      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const position = inst.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const stored = emptyMindMapNode(position);
      const newNode: MindMapFlowNode = {
        ...stored,
        type: "mindMap",
        dragHandle: NODE_DRAG_HANDLE_SELECTOR,
        selected: true,
      };
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ]);
    }

    // Cmd/Ctrl+C/V는 ClipboardEvent로 처리 — clipboardData.setData/getData는
    // user gesture(copy/paste 이벤트 자체)로 자동 권한 부여되어 권한 프롬프트가
    // 뜨지 않는다. navigator.clipboard.readText()는 별도 권한 정책이 적용돼 일부
    // 브라우저에서 "Allow ... access your clipboard?" 프롬프트가 뜬다.
    function onCopy(e: ClipboardEvent) {
      if (isEditableFocus()) return;
      const inst = rfInstance.current;
      if (!inst) return;
      const selected = (inst.getNodes() as MindMapFlowNode[]).find(
        (n) => n.selected,
      );
      if (!selected) return;
      const payload = {
        _kind: "mindMapClipboard@v1" as const,
        node: {
          type: selected.type ?? "mindMap",
          data: { ...selected.data },
        },
      };
      const json = JSON.stringify(payload);
      e.clipboardData?.setData("text/plain", json);
      e.preventDefault();
      lastClipboardKeyRef.current = json;
      pasteOffsetRef.current = 0;
    }

    function onPaste(e: ClipboardEvent) {
      if (isEditableFocus()) return;
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;
      let parsed: {
        _kind?: string;
        node?: { type?: string; data?: MindMapNodeData };
      };
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }
      if (parsed?._kind !== "mindMapClipboard@v1") return;
      if (
        !parsed.node?.data ||
        typeof parsed.node.data.label !== "string"
      ) {
        return;
      }
      const inst = rfInstance.current;
      const container = containerRef.current;
      if (!inst || !container) return;
      e.preventDefault();

      // 같은 클립보드 연속 ⌘V → 오프셋 누적, 새 클립보드 → 리셋.
      if (text !== lastClipboardKeyRef.current) {
        lastClipboardKeyRef.current = text;
        pasteOffsetRef.current = 0;
      }
      pasteOffsetRef.current += 1;
      const off = pasteOffsetRef.current * 30;

      const rect = container.getBoundingClientRect();
      const center = inst.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const newNode: MindMapFlowNode = {
        id: crypto.randomUUID(),
        type: parsed.node.type ?? "mindMap",
        position: { x: center.x + off, y: center.y + off },
        dragHandle: NODE_DRAG_HANDLE_SELECTOR,
        selected: true,
        data: { ...parsed.node.data },
      };
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ]);
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [readonly, setNodes, sync]);

  // 드래그 종료 — valid면 두 노드 사이 엣지(양쪽 anchor 포함), invalid면 새 자식 노드 + 엣지(anchor 없음).
  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      params: {
        fromNode?: { id: string } | null;
        toNode?: {
          id: string;
          position: { x: number; y: number };
          measured?: { width?: number; height?: number };
        } | null;
        isValid?: boolean | null;
      },
    ) => {
      if (readonly) return;
      const inst = rfInstance.current;
      if (!inst) return;
      const start = startRef.current;
      startRef.current = null;

      const point =
        "changedTouches" in event
          ? {
              clientX: event.changedTouches[0]?.clientX ?? 0,
              clientY: event.changedTouches[0]?.clientY ?? 0,
            }
          : { clientX: event.clientX, clientY: event.clientY };

      // 정상 연결 — 두 노드 모두 있고 self-loop 아님.
      if (params.isValid && params.toNode && start) {
        if (start.nodeId === params.toNode.id) return;
        const tw = params.toNode.measured?.width ?? 0;
        const th = params.toNode.measured?.height ?? 0;
        if (tw <= 0 || th <= 0) return;
        const tcx = params.toNode.position.x + tw / 2;
        const tcy = params.toNode.position.y + th / 2;
        const tFlow = inst.screenToFlowPosition({
          x: point.clientX,
          y: point.clientY,
        });
        const targetAngle = Math.atan2(tFlow.y - tcy, tFlow.x - tcx);
        const newEdge: MindMapFlowEdge = {
          id: `edge-${start.nodeId}-${params.toNode.id}-${crypto.randomUUID().slice(0, 8)}`,
          source: start.nodeId,
          target: params.toNode.id,
          type: "mindMap",
          data: {
            style: {
              sourceAnchor: { angle: start.angle },
              targetAnchor: { angle: targetAngle },
            },
          },
        };
        setEdges((eds) => applySiblingCurveOffset([...eds, newEdge]));
        return;
      }

      // 빈 곳에 드롭 → 자식 노드 + 엣지(anchor 없음, floating)
      const fromId = params.fromNode?.id;
      if (!fromId) return;
      const position = inst.screenToFlowPosition({
        x: point.clientX,
        y: point.clientY,
      });
      const stored = emptyMindMapNode(position);
      const newNode: MindMapFlowNode = {
        ...stored,
        type: "mindMap",
        dragHandle: NODE_DRAG_HANDLE_SELECTOR,
        selected: true,
      };
      const newEdge: MindMapFlowEdge = {
        id: `edge-${fromId}-${newNode.id}`,
        source: fromId,
        target: newNode.id,
        type: "mindMap",
      };
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ]);
      setEdges((eds) => applySiblingCurveOffset([...eds, newEdge]));
    },
    [readonly, setNodes, setEdges],
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    sync.syncTitle(value);
  }

  function handleEmojiChange(next: string) {
    setEmoji(next);
    sync.syncEmoji(next);
  }

  function handleSharedToggle(next: boolean) {
    setIsPublic(next);
    sync.syncIsPublic(next);
    // 공유 토글은 양방향 모두 즉시 반영해야 함 — OFF가 디바운스 동안 살아있으면
    // 사용자가 비공개로 바꿨다고 생각해도 링크는 한동안 유효.
    sync.flushNow();
  }

  function handleShareStateChange(next: {
    shareToken: string | null;
    isPublic: boolean;
  }) {
    setShareToken(next.shareToken);
    setIsPublic(next.isPublic);
  }

  function handleBackgroundChange(next: CanvasBackgroundPattern) {
    setCanvasBackground(next);
    sync.syncCanvasBackground(next);
  }

  function handleBackgroundColorChange(next: CanvasBackgroundColor) {
    setCanvasBackgroundColor(next);
    sync.syncCanvasBackgroundColor(next);
  }

  function handleSketchyToggle() {
    const next = !sketchyMode;
    setSketchyMode(next);
    sync.syncSketchyMode(next);
    // 시각 모드는 즉시 영속 — debounce 동안 새로고침 시 시각 미스매치 방지
    sync.flushNow();
  }

  function handleFavorite() {
    setIsFavorite((v) => !v);
    toggleFavorite.mutate(undefined, {
      onError: () => setIsFavorite((v) => !v),
    });
  }

  function handleDelete() {
    deleteMindMap.mutate(initial.id, {
      onSuccess: () => router.push("/mind-map"),
    });
  }

  const bgProps = backgroundPropsFor(canvasBackground);
  const wrapperBgClass = bgClassFor(canvasBackgroundColor);
  const patternColor = patternStrokeColor(canvasBackgroundColor);

  return (
    <MindMapProvider
      readonly={readonly}
      sketchyMode={sketchyMode}
      beginResize={beginResize}
      endResize={endResize}
    >
    <div className="-m-6 flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-background py-2 pl-12 pr-3 sm:gap-3 sm:pl-14 sm:pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/mind-map")}
          aria-label="목록으로"
          className="size-9 px-0"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <EmojiSelector
          value={emoji}
          onChange={handleEmojiChange}
          disabled={readonly}
        />

        {readonly ? (
          <h1 className="flex-1 truncate text-base font-semibold sm:text-lg">
            {title || "Untitled"}
          </h1>
        ) : (
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="제목"
            maxLength={200}
            className="h-9 flex-1 border-transparent bg-transparent text-base font-semibold focus-visible:border-input focus-visible:bg-background sm:text-lg"
          />
        )}

        {!readonly ? (
          <>
            <SaveStatus
              status={sync.status}
              errorMessage={sync.errorMessage}
              onRetry={sync.retry}
              onSave={sync.flushNow}
              onOverwriteRemote={sync.overwriteRemote}
              onAcceptRemote={sync.acceptRemote}
            />
            <BackgroundPicker
              pattern={canvasBackground}
              color={canvasBackgroundColor}
              onPatternChange={handleBackgroundChange}
              onColorChange={handleBackgroundColorChange}
              disabled={readonly}
            />
            <button
              type="button"
              onClick={handleSketchyToggle}
              aria-label={sketchyMode ? "손그림 모드 해제" : "손그림 모드"}
              aria-pressed={sketchyMode}
              title={sketchyMode ? "손그림 모드 해제" : "손그림 모드"}
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-primary/15 aria-pressed:text-foreground"
            >
              <PenTool className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              aria-label={isFavorite ? "별표 해제" : "별표"}
              aria-pressed={isFavorite}
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:text-amber-500"
            >
              <Star
                className="size-4"
                fill={isFavorite ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
            <ShareToggle
              mindMapId={initial.id}
              isPublic={isPublic}
              shareToken={shareToken}
              onToggle={handleSharedToggle}
              onShareStateChange={handleShareStateChange}
            />
            <DeleteMindMapDialog title={title} onConfirm={handleDelete} />
          </>
        ) : (
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            읽기 전용
          </span>
        )}
      </header>

      <div ref={containerRef} className={`relative flex-1 ${wrapperBgClass}`}>
        {nodes.length === 0 ? <EmptyCanvasHint readonly={readonly} /> : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readonly ? undefined : onNodesChange}
          onEdgesChange={readonly ? undefined : onEdgesChange}
          onConnect={readonly ? undefined : onConnect}
          onConnectStart={readonly ? undefined : onConnectStart}
          onConnectEnd={readonly ? undefined : onConnectEnd}
          isValidConnection={readonly ? undefined : isValidConnection}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={48}
          connectionLineStyle={{
            stroke: "var(--primary, oklch(0.65 0.15 30))",
            strokeWidth: 2,
            strokeDasharray: "6 4",
          }}
          onInit={(inst) => {
            rfInstance.current = inst;
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={readonly ? null : ["Backspace", "Delete"]}
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable={!readonly ? true : true}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={0.1}
          maxZoom={4}
        >
          {bgProps.hidden ? null : (
            <Background
              variant={bgProps.variant}
              gap={bgProps.gap}
              size={bgProps.size}
              lineWidth={bgProps.lineWidth}
              color={patternColor}
            />
          )}
          <Controls
            className="!hidden overflow-hidden !rounded-md !border !border-border !bg-card !shadow-md sm:!flex [&>button]:!size-7 [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-border [&>button]:!bg-card [&>button]:!fill-foreground [&>button:last-child]:!border-b-0 [&>button:hover]:!bg-accent"
            showInteractive={false}
            position="bottom-left"
          />
          <MiniMap
            className="!hidden overflow-hidden !rounded-md !border !border-border !bg-card !shadow-md sm:!block"
            zoomable
            pannable
            position="bottom-right"
            bgColor="transparent"
            maskColor="oklch(0.5 0 0 / 35%)"
            maskStrokeColor="oklch(0.65 0.15 30)"
            maskStrokeWidth={2}
            nodeColor="oklch(0.55 0.05 250)"
            nodeStrokeColor="oklch(0.35 0.05 250)"
            nodeBorderRadius={4}
          />
        </ReactFlow>
        {!readonly ? <AddNodeFab /> : null}
      </div>
    </div>
    </MindMapProvider>
  );
}

function EmojiSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const SUGGESTIONS = ["🌍", "📚", "💡", "📈", "🧠", "🗺️", "🔥", "✨", "📌"];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="이모지 변경"
        className="flex size-9 items-center justify-center rounded-md text-lg hover:bg-muted disabled:opacity-100"
      >
        {value}
      </button>
      {open && !disabled ? (
        <div className="absolute left-0 top-full z-30 mt-1 flex flex-wrap gap-1 rounded-md border border-border bg-card p-1.5 shadow-lg">
          {SUGGESTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange(e);
                setOpen(false);
              }}
              className="flex size-8 items-center justify-center rounded-md text-base hover:bg-muted"
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
