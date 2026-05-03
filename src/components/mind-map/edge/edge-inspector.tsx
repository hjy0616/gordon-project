"use client";

import { Trash2, ArrowRight, ArrowLeft, ArrowLeftRight, Minus } from "lucide-react";
import { useReactFlow, type Edge } from "@xyflow/react";
import {
  EDGE_ARROWS,
  EDGE_CURVATURES,
  EDGE_DASHES,
  EDGE_PRESET_COLORS,
  EDGE_WIDTHS,
  type EdgeArrow,
  type EdgeCurvature,
  type EdgeDash,
  type EdgeWidth,
  type MindMapEdgeData,
  type MindMapEdgeStyle,
  type MindMapFlowEdge,
  type MindMapFlowNode,
} from "@/types/mind-map";

interface EdgeInspectorProps {
  edge: Edge<MindMapEdgeData>;
}

const ARROW_ICON: Record<EdgeArrow, React.ComponentType<{ className?: string }>> = {
  none: Minus,
  end: ArrowRight,
  start: ArrowLeft,
  both: ArrowLeftRight,
};

const ARROW_LABEL: Record<EdgeArrow, string> = {
  none: "화살표 없음",
  end: "끝",
  start: "시작",
  both: "양쪽",
};

const DASH_LABEL: Record<EdgeDash, string> = {
  solid: "실선",
  dashed: "긴 점선",
  dotted: "짧은 점선",
};

const CURVATURE_LABEL: Record<EdgeCurvature, string> = {
  straight: "직선",
  step: "직각",
  normal: "보통",
  loopy: "큰 곡선",
};

export function EdgeInspector({ edge }: EdgeInspectorProps) {
  const { setEdges, deleteElements } = useReactFlow<
    MindMapFlowNode,
    MindMapFlowEdge
  >();

  const style: MindMapEdgeStyle = (edge.data?.style as MindMapEdgeStyle | undefined) ?? {};

  function patchStyle(
    patch: Partial<MindMapEdgeStyle>,
    options?: {
      dropCurve?: boolean;
      dropAnchor?: "source" | "target" | "both";
    },
  ) {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edge.id) return e;
        const prev = (e.data?.style as MindMapEdgeStyle | undefined) ?? {};
        const next: MindMapEdgeStyle = { ...prev, ...patch };
        // 빈 값 정규화 — undefined로 떨궈서 정규화 round-trip 안정화.
        const cleaned: MindMapEdgeStyle = {};
        if (next.color) cleaned.color = next.color;
        if (next.width) cleaned.width = next.width;
        if (next.dash) cleaned.dash = next.dash;
        if (next.arrow) cleaned.arrow = next.arrow;
        if (next.curvature) cleaned.curvature = next.curvature;
        // dropCurve가 true면 curve를 떨굼 (preset으로 복귀).
        if (!options?.dropCurve && next.curve) cleaned.curve = next.curve;
        // dropAnchor 옵션으로 source/target/both 떨굼.
        const drop = options?.dropAnchor;
        if (drop !== "source" && drop !== "both" && next.sourceAnchor) {
          cleaned.sourceAnchor = next.sourceAnchor;
        }
        if (drop !== "target" && drop !== "both" && next.targetAnchor) {
          cleaned.targetAnchor = next.targetAnchor;
        }
        return {
          ...e,
          data: {
            ...(e.data ?? {}),
            style: Object.keys(cleaned).length > 0 ? cleaned : undefined,
          },
        };
      }),
    );
  }

  function clearColor() {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edge.id) return e;
        const prev = (e.data?.style as MindMapEdgeStyle | undefined) ?? {};
        const next: MindMapEdgeStyle = { ...prev };
        delete next.color;
        return {
          ...e,
          data: {
            ...(e.data ?? {}),
            style: Object.keys(next).length > 0 ? next : undefined,
          },
        };
      }),
    );
  }

  function deleteSelf() {
    deleteElements({ edges: [{ id: edge.id }] });
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex max-w-[min(92vw,520px)] flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1.5 text-card-foreground shadow-lg"
    >
      {/* 색상 8 + custom + clear */}
      <div className="flex items-center gap-0.5">
        {EDGE_PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${c} 색상`}
            aria-pressed={style.color?.toLowerCase() === c.toLowerCase()}
            onClick={() => patchStyle({ color: c })}
            className="size-6 rounded-full border border-border hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-1 aria-pressed:ring-offset-card"
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          aria-label="사용자 색상"
          value={style.color ?? "#000000"}
          onChange={(e) => patchStyle({ color: e.target.value })}
          className="size-6 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
        />
        <button
          type="button"
          aria-label="색상 초기화"
          onClick={clearColor}
          className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
        >
          기본
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* 두께 */}
      <div className="flex items-center gap-0.5">
        {EDGE_WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            aria-label={`두께 ${w}px`}
            aria-pressed={(style.width ?? 2) === w}
            onClick={() => patchStyle({ width: w as EdgeWidth })}
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted aria-pressed:bg-primary/15"
          >
            <span
              className="block w-4 rounded-full bg-foreground"
              style={{ height: `${w}px` }}
            />
          </button>
        ))}
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* dash */}
      <div className="flex items-center gap-0.5">
        {EDGE_DASHES.map((d) => (
          <button
            key={d}
            type="button"
            aria-label={DASH_LABEL[d]}
            aria-pressed={(style.dash ?? "solid") === d}
            onClick={() => patchStyle({ dash: d as EdgeDash })}
            className="flex h-7 items-center rounded-md px-1.5 hover:bg-muted aria-pressed:bg-primary/15"
            title={DASH_LABEL[d]}
          >
            <svg
              width="22"
              height="6"
              viewBox="0 0 22 6"
              aria-hidden
              className="text-foreground"
            >
              <line
                x1="1"
                y1="3"
                x2="21"
                y2="3"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={
                  d === "dashed" ? "5 3" : d === "dotted" ? "1 3" : undefined
                }
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* 화살표 */}
      <div className="flex items-center gap-0.5">
        {EDGE_ARROWS.map((a) => {
          const Icon = ARROW_ICON[a];
          return (
            <button
              key={a}
              type="button"
              aria-label={ARROW_LABEL[a]}
              aria-pressed={(style.arrow ?? "end") === a}
              onClick={() => patchStyle({ arrow: a as EdgeArrow })}
              className="flex size-7 items-center justify-center rounded-md text-foreground hover:bg-muted aria-pressed:bg-primary/15"
              title={ARROW_LABEL[a]}
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* 곡률 — preset 클릭 시 자유 곡선(curve)도 함께 초기화 */}
      <div className="flex items-center gap-0.5">
        {EDGE_CURVATURES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={CURVATURE_LABEL[c]}
            aria-pressed={!style.curve && (style.curvature ?? "normal") === c}
            onClick={() =>
              patchStyle(
                { curvature: c as EdgeCurvature },
                { dropCurve: true },
              )
            }
            className="rounded-md px-2 py-1 text-[11px] text-foreground hover:bg-muted aria-pressed:bg-primary/15"
            title={CURVATURE_LABEL[c]}
          >
            {CURVATURE_LABEL[c]}
          </button>
        ))}
        {/* 자유 곡선 상태 표시 + 초기화 단독 버튼 */}
        {style.curve ? (
          <button
            type="button"
            onClick={() => patchStyle({}, { dropCurve: true })}
            title="자유 곡선 초기화"
            className="rounded-md px-2 py-1 text-[11px] text-primary hover:bg-muted"
          >
            ✦ 자유
          </button>
        ) : null}
      </div>

      {/* anchor 초기화 — 사용자가 끝점 위치를 직접 잡았다가 자동(floating)으로 되돌리고 싶을 때 */}
      {style.sourceAnchor || style.targetAnchor ? (
        <>
          <div className="mx-1 h-5 w-px bg-border" />
          {style.sourceAnchor ? (
            <button
              type="button"
              onClick={() => patchStyle({}, { dropAnchor: "source" })}
              title="시작점 위치를 자동으로 되돌림"
              className="rounded-md px-2 py-1 text-[11px] text-foreground hover:bg-muted"
            >
              ↰ 시작 자동
            </button>
          ) : null}
          {style.targetAnchor ? (
            <button
              type="button"
              onClick={() => patchStyle({}, { dropAnchor: "target" })}
              title="끝점 위치를 자동으로 되돌림"
              className="rounded-md px-2 py-1 text-[11px] text-foreground hover:bg-muted"
            >
              ↳ 끝 자동
            </button>
          ) : null}
        </>
      ) : null}

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        aria-label="엣지 삭제"
        onClick={deleteSelf}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
