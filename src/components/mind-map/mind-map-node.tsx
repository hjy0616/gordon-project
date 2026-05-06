"use client";

import { useState, type CSSProperties } from "react";
import { useReactFlow, NodeResizer, type NodeProps } from "@xyflow/react";
import { EditableLabel } from "@/components/common/editable-label";
import {
  NODE_COLOR_CLASSES,
  NODE_WIDTH_MIN,
  NODE_WIDTH_MAX,
  NODE_HEIGHT_MIN,
  NODE_HEIGHT_MAX,
  SHAPE_BASELINES,
  computeNodeFontMetrics,
  type MindMapFlowNode,
  type MindMapFlowEdge,
  type MindMapNodeData,
  type NodeLabelAlign,
  type NodeShape,
} from "@/types/mind-map";
import { NodeQuickAdd } from "./node-quick-add";
import { MindMapNodeToolbar } from "./node-toolbar";
import { useMindMapContext } from "./mind-map-context";

// 도형별 시각 메타데이터. 기본 크기는 SHAPE_BASELINES(types/mind-map.ts)에서 통일 관리.
// `clipPath`가 있는 도형(diamond/hexagon)은 컨텐트 영역이 잘리지 않도록 패딩이 큼(%).
const SHAPE_VISUAL: Record<
  NodeShape,
  { wrapper: CSSProperties; contentPad: string }
> = {
  rectangle: {
    wrapper: { borderRadius: "0.5rem" },
    contentPad: "px-5 py-3.5",
  },
  rounded: {
    wrapper: { borderRadius: "1.25rem" },
    contentPad: "px-6 py-3.5",
  },
  ellipse: {
    wrapper: { borderRadius: "9999px" },
    // 정확한 동그라미 — baseline w = h. 패딩은 % 기반으로 도형 크기에 비례.
    // 원에 내접하는 정사각형은 변 ≈ 0.707×지름이므로 (1-0.707)/2 ≈ 14.6%가
    // 안전한 텍스트 영역 경계. 12%로 약간 여유롭게 잡아 텍스트가 원에 더 가까이.
    contentPad: "px-[12%] py-[12%]",
  },
  diamond: {
    wrapper: { clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" },
    contentPad: "px-[20%] py-[20%]",
  },
  hexagon: {
    wrapper: {
      clipPath: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)",
    },
    contentPad: "px-[16%] py-[14%]",
  },
  sticky: {
    // 회전은 의도적으로 안 줌 — floating edge boundary 계산은 un-rotated
    // 사각형 기준이라 회전 시 라인이 코너에 안 닿는다. 노란 배경 + 그림자만으로
    // 포스트잇 분위기를 표현.
    wrapper: {
      borderRadius: "4px",
      boxShadow:
        "2px 4px 6px -2px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.1)",
    },
    contentPad: "px-5 py-4",
  },
};

// sticky 도형은 노란색 background(post-it 느낌)로 노드 컬러 토큰을 무시.
const STICKY_BG = "bg-[oklch(0.94_0.13_95)] dark:bg-[oklch(0.78_0.16_95)]";

export function MindMapNode({
  id,
  data,
  selected,
}: NodeProps<MindMapFlowNode>) {
  const { updateNodeData, getEdges } = useReactFlow<
    MindMapFlowNode,
    MindMapFlowEdge
  >();
  const { readonly, endpointDrag, beginResize, endResize } =
    useMindMapContext();
  const [hover, setHover] = useState(false);

  // Defense-in-depth: 잘못된 enum이 들어오면 fallback으로 그려서 페이지가 깨지지 않도록.
  const shape: NodeShape =
    data.shape && data.shape in SHAPE_VISUAL ? data.shape : "rectangle";
  const visual = SHAPE_VISUAL[shape];
  const color = data.color ?? "neutral";
  const colorClasses =
    NODE_COLOR_CLASSES[color] ?? NODE_COLOR_CLASSES.neutral;

  const showAffordances = !readonly && (hover || selected);

  function handleLabelChange(label: string) {
    updateNodeData(id, { label });
  }
  function handleMemoChange(memo: string) {
    updateNodeData(id, { memo });
  }
  function handleResize(
    _event: unknown,
    params: { width: number; height: number },
  ) {
    updateNodeData(id, { width: params.width, height: params.height });
  }

  // 사용자가 리사이즈한 값이 있으면 우선, 없으면 도형 default(baseline).
  const baseline = SHAPE_BASELINES[shape];
  const w = data.width ?? baseline.w;
  const h = data.height ?? baseline.h;
  // 도형 크기 변화에 따른 폰트 자동 스케일 — 라벨/메모/이모지 모두 비례 축소·확대.
  const fontMetrics = computeNodeFontMetrics(shape, w, h);

  // labelAlign 미설정 시 "left" fallback — 레거시 데이터 시각 회귀 방지.
  const align: NodeLabelAlign = data.labelAlign ?? "left";
  const justifyClass =
    align === "center" ? "justify-center"
    : align === "right" ? "justify-end"
    : "justify-start";

  // sticky는 자체 노란 배경. 다른 도형은 NODE_COLOR_CLASSES.bg 사용.
  const bgClass = shape === "sticky" ? STICKY_BG : colorClasses.bg;

  // 선택 ring 제거 — outset/inset 모두 미사용.
  // outset(rect/rounded/ellipse): box-shadow 기반 ring이 outer div의 사각 bounding box
  //   를 따라 그려져 ellipse(원)는 사각 outline으로 보임 → 어색.
  // inset(diamond/hexagon): 사각 inset shadow가 도형 silhouette과 안 맞음.
  // selected 상태는 toolbar 노출 + 4방향 ⊕ 발화로 충분히 표시되므로 ring은 안 그린다.
  const ringStyle: CSSProperties = {};
  const ringClassName = "";

  // hover halo: 노드 본체 외곽 어디든 라인 시작점이라는 옅은 힌트
  // reconnect target halo: drag 중인 endpoint가 이 노드 위에 있으면 진하게
  // (drag 출발 엣지의 반대편 노드면 self-loop라 highlight 안 함 — 거부 시그널)
  let isReconnectTarget = false;
  if (!readonly && endpointDrag && endpointDrag.hoverNodeId === id) {
    const edge = getEdges().find((e) => e.id === endpointDrag.edgeId);
    if (edge) {
      const otherEnd =
        endpointDrag.end === "source" ? edge.target : edge.source;
      isReconnectTarget = id !== otherEnd;
    }
  }
  const showHalo = !readonly && hover && !selected && !isReconnectTarget;
  const wrapperStyle: CSSProperties = {
    ...visual.wrapper,
    filter: isReconnectTarget
      ? "drop-shadow(0 0 8px var(--primary)) drop-shadow(0 0 16px color-mix(in oklch, var(--primary) 70%, transparent))"
      : showHalo
        ? "drop-shadow(0 0 4px color-mix(in oklch, var(--primary) 60%, transparent))"
        : undefined,
    transition: "filter 200ms ease",
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative ${ringClassName}`}
      style={{ width: w, height: h, ...ringStyle }}
    >
      {/* 리사이즈 핸들 — 선택 시에만, readonly 제외. clip-path 도형은
          핸들이 노드 bounding box 모서리에 그려져 도형 외곽과 살짝 떨어져 보일 수 있음. */}
      <NodeResizer
        minWidth={NODE_WIDTH_MIN}
        minHeight={NODE_HEIGHT_MIN}
        maxWidth={NODE_WIDTH_MAX}
        maxHeight={NODE_HEIGHT_MAX}
        isVisible={!readonly && selected}
        onResizeStart={beginResize}
        onResize={handleResize}
        onResizeEnd={endResize}
        lineClassName="!border-primary/50"
        handleClassName="!bg-primary !border-white !rounded-sm"
      />
      {/* 도형 래퍼 — clip-path/border-radius/배경/halo. 컨텐트(label/emoji)도 이 안.
          .mm-drag 클래스로 node.dragHandle이 이 래퍼만 draggable로 인식.
          clip-path 도형은 corner의 pointer event가 자동으로 차단되어 corner 클릭 시 drag 안 됨. */}
      <div
        className={`mm-drag absolute inset-0 ${bgClass} border border-border shadow-sm transition-shadow`}
        style={wrapperStyle}
      >
        {/* 좌측 색상 accent 바 — 직사각/rounded에만 (sticky/clip-path 도형엔 의미 없음). */}
        {(shape === "rectangle" || shape === "rounded") && color !== "neutral" ? (
          <div
            className={`pointer-events-none absolute inset-y-1 left-0 z-[1] w-1 rounded-l ${colorClasses.accent}`}
          />
        ) : null}

        {/* 컨텐트 */}
        <div
          className={`relative z-10 flex h-full w-full flex-col justify-center ${visual.contentPad}`}
        >
          {/* outer: 가용 폭 점유, inner를 좌/중/우로 정렬 */}
          <div className={`flex w-full ${justifyClass}`}>
            {/* inner: 컨텐츠 폭(emoji+label)으로 자라되 max-w-full로 부모 폭 cap, min-w-0로 자식 wrap 허용 */}
            <div className="inline-flex max-w-full min-w-0 items-start gap-2">
              {data.emoji ? (
                <span
                  className="shrink-0 select-none"
                  style={{
                    fontSize: `${fontMetrics.emojiPx}px`,
                    lineHeight: `${fontMetrics.labelLineHeight}px`,
                  }}
                >
                  {data.emoji}
                </span>
              ) : null}
              <EditableLabel
                value={data.label}
                onChange={handleLabelChange}
                readonly={readonly}
                align={align}
                className="min-w-0 break-words font-medium text-foreground"
                style={{
                  fontSize: `${fontMetrics.labelPx}px`,
                  lineHeight: `${fontMetrics.labelLineHeight}px`,
                }}
              />
            </div>
          </div>
          {data.memo !== undefined ? (
            <div className="mt-1.5">
              <MemoEditor
                value={data.memo}
                onChange={handleMemoChange}
                readonly={readonly}
                fontSizePx={fontMetrics.memoPx}
                lineHeightPx={fontMetrics.memoLineHeight}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* 도구/⊕ 버튼은 shape wrapper 밖 — 부모 outer div의 자식 (clip 영향 없음). */}
      <MindMapNodeToolbar
        nodeId={id}
        data={data as MindMapNodeData}
        visible={showAffordances}
      />
      <NodeQuickAdd visible={showAffordances} />
    </div>
  );
}

function MemoEditor({
  value,
  onChange,
  readonly,
  fontSizePx,
  lineHeightPx,
}: {
  value: string;
  onChange: (v: string) => void;
  readonly: boolean;
  fontSizePx: number;
  lineHeightPx: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (readonly || !editing) {
    return (
      <p
        className="whitespace-pre-wrap text-muted-foreground"
        style={{
          fontSize: `${fontSizePx}px`,
          lineHeight: `${lineHeightPx}px`,
        }}
        onDoubleClick={() => {
          if (readonly) return;
          setDraft(value);
          setEditing(true);
        }}
      >
        {value || (readonly ? "" : "(더블클릭하여 메모)")}
      </p>
    );
  }

  return (
    <textarea
      value={draft}
      autoFocus
      rows={3}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) onChange(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      // color-scheme: textarea는 시스템 dark mode 영향으로 글자색이 흰색이 될 수 있음.
      // canvas-force-light/dark 안에서 --foreground 토큰을 직접 박아 강제.
      style={{
        color: "var(--muted-foreground)",
        colorScheme: "light dark",
        fontSize: `${fontSizePx}px`,
        lineHeight: `${lineHeightPx}px`,
      }}
      className="w-full resize-none rounded border border-primary/50 bg-transparent p-1 outline-none"
    />
  );
}
