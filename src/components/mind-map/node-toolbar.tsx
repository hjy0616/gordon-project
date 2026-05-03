"use client";

import {
  Trash2,
  MessageSquare,
  Square,
  Circle,
  Diamond,
  Hexagon,
  StickyNote,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  NODE_COLORS,
  NODE_COLOR_CLASSES,
  NODE_SHAPES,
  type MindMapFlowNode,
  type MindMapFlowEdge,
  type MindMapNodeData,
  type NodeColor,
  type NodeShape,
} from "@/types/mind-map";

const QUICK_EMOJIS = ["📌", "💡", "📖", "📈", "⚠️", "🎯", "❓"];

const SHAPE_ICON: Record<NodeShape, React.ComponentType<{ className?: string }>> = {
  rectangle: Square,
  rounded: SquareRounded,
  ellipse: Circle,
  diamond: Diamond,
  hexagon: Hexagon,
  sticky: StickyNote,
};

const SHAPE_LABEL: Record<NodeShape, string> = {
  rectangle: "직사각형",
  rounded: "둥근 사각형",
  ellipse: "타원",
  diamond: "마름모",
  hexagon: "육각형",
  sticky: "포스트잇",
};

// lucide에 SquareRounded가 없어 직접 SVG로 그린 작은 아이콘.
function SquareRounded({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="6" ry="6" />
    </svg>
  );
}

interface NodeToolbarProps {
  nodeId: string;
  data: MindMapNodeData;
  visible: boolean;
}

export function MindMapNodeToolbar({
  nodeId,
  data,
  visible,
}: NodeToolbarProps) {
  const { updateNodeData, deleteElements } = useReactFlow<
    MindMapFlowNode,
    MindMapFlowEdge
  >();

  function setColor(color: NodeColor) {
    updateNodeData(nodeId, { color });
  }

  function setShape(shape: NodeShape) {
    updateNodeData(nodeId, { shape });
  }

  function setEmoji(emoji: string) {
    updateNodeData(nodeId, {
      emoji: data.emoji === emoji ? undefined : emoji,
    });
  }

  function toggleMemo() {
    updateNodeData(nodeId, { memo: data.memo === undefined ? "" : undefined });
  }

  function deleteSelf() {
    deleteElements({ nodes: [{ id: nodeId }] });
  }

  if (!visible) return null;

  const currentShape: NodeShape = data.shape ?? "rectangle";

  return (
    <div
      className="absolute -top-[88px] left-1/2 z-20 -translate-x-1/2 rounded-lg border border-border bg-card shadow-lg"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1행: 색상 + 이모지 + memo + delete */}
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        {NODE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${c} 색상`}
            aria-pressed={(data.color ?? "neutral") === c}
            onClick={() => setColor(c)}
            className={`size-6 rounded-full border ${NODE_COLOR_CLASSES[c].bg} ${
              (data.color ?? "neutral") === c
                ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                : "border-border"
            }`}
          />
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={`${e} 이모지`}
            aria-pressed={data.emoji === e}
            onClick={() => setEmoji(e)}
            className={`flex size-7 items-center justify-center rounded-md text-base hover:bg-muted aria-pressed:bg-primary/15`}
          >
            {e}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={toggleMemo}
          aria-label="메모 토글"
          aria-pressed={data.memo !== undefined}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted aria-pressed:bg-primary/15 aria-pressed:text-foreground"
        >
          <MessageSquare className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={deleteSelf}
          aria-label="노드 삭제"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {/* 2행: 도형 selector */}
      <div className="flex items-center gap-0.5 px-1.5 py-1">
        {NODE_SHAPES.map((s) => {
          const Icon = SHAPE_ICON[s];
          return (
            <button
              key={s}
              type="button"
              aria-label={SHAPE_LABEL[s]}
              aria-pressed={currentShape === s}
              onClick={() => setShape(s)}
              title={SHAPE_LABEL[s]}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-primary/15 aria-pressed:text-foreground"
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
