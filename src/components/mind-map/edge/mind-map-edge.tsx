"use client";

import dynamic from "next/dynamic";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  getBoundaryFromAngle,
  getBoundaryIntersection,
  type NodeBox,
} from "@/lib/mind-map/node-intersection";
import { applySiblingCurveOffset } from "@/lib/mind-map/sibling-curve";
import {
  type MindMapEdgeData,
  type MindMapEdgeStyle,
  type MindMapFlowEdge,
  type MindMapFlowNode,
  type NodeShape,
} from "@/types/mind-map";
import {
  useMindMapContext,
  type EndpointDragState,
} from "../mind-map-context";
import { EdgeInspector } from "./edge-inspector";

/** flow 좌표가 어느 노드의 bounding box 안에 있는지 hit test. 없으면 null. */
function findNodeAtFlowPoint(
  point: { x: number; y: number },
  nodes: MindMapFlowNode[],
): MindMapFlowNode | null {
  // 위에 그려진 노드(배열 마지막)를 우선 — z-order와 일치.
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const w = n.measured?.width ?? n.width ?? 0;
    const h = n.measured?.height ?? n.height ?? 0;
    if (w <= 0 || h <= 0) continue;
    const x = n.position.x;
    const y = n.position.y;
    if (
      point.x >= x &&
      point.x <= x + w &&
      point.y >= y &&
      point.y <= y + h
    ) {
      return n;
    }
  }
  return null;
}

const SketchyPath = dynamic(
  () => import("./sketchy-path").then((m) => m.SketchyPath),
  { ssr: false },
);

const DEFAULT_STROKE = "var(--mm-edge-stroke, currentColor)";
const DEFAULT_WIDTH = 2;

function nodeToBox(
  node: ReturnType<typeof useInternalNode> | undefined,
): NodeBox | null {
  if (!node) return null;
  const w = node.measured?.width ?? node.width ?? 0;
  const h = node.measured?.height ?? node.height ?? 0;
  if (w <= 0 || h <= 0) return null;
  const x = node.internals.positionAbsolute.x;
  const y = node.internals.positionAbsolute.y;
  // node.data.shape는 우리 MindMapNodeData. 다른 타입이면 fallback.
  const shape = ((node.data as { shape?: NodeShape })?.shape ??
    "rectangle") as NodeShape;
  return {
    cx: x + w / 2,
    cy: y + h / 2,
    w,
    h,
    shape,
  };
}

/**
 * boundary point가 자기 노드의 어느 변(top/right/bottom/left)에 있는지 반환.
 * bezier control point 방향 결정용 — anchor를 자유 위치로 옮겨도 path가 노드
 * 본체를 뚫지 않고 그 변 바깥쪽으로 자연스럽게 빠져나가도록 한다.
 *
 * point는 box.boundary 위의 점이라고 가정 (getBoundaryFromAngle / getBoundaryIntersection
 * 출력). 점-중심 벡터의 cardinal axis로 분류.
 */
function cardinalFromBoundaryPoint(
  point: { x: number; y: number },
  box: { cx: number; cy: number },
): Position {
  const dx = point.x - box.cx;
  const dy = point.y - box.cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Position.Right : Position.Left;
  }
  return dy > 0 ? Position.Bottom : Position.Top;
}

const CURVATURE_VALUE: Record<NonNullable<MindMapEdgeStyle["curvature"]>, number> = {
  straight: 0,
  step: 0, // step은 getSmoothStepPath 사용 — 이 값 미사용 (Record 만족용)
  normal: 0.25,
  loopy: 0.55,
};

export function MindMapEdge(props: EdgeProps<MindMapFlowEdge>) {
  const { id, source, target, selected, data } = props;
  // data 타입은 MindMapFlowEdge.data — 그러나 EdgeProps 제네릭에 따라 unknown으로
  // 좁혀질 수 있어 명시적 캐스팅.
  const edgeData = data as MindMapEdgeData | undefined;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const { sketchyMode, readonly, endpointDrag, setEndpointDrag } =
    useMindMapContext();
  const { setEdges, screenToFlowPosition, getNodes } = useReactFlow<
    MindMapFlowNode,
    MindMapFlowEdge
  >();
  const isThisDragging = endpointDrag?.edgeId === id;

  const sBox = nodeToBox(sourceNode);
  const tBox = nodeToBox(targetNode);
  // 측정 전이면 그리지 않음 — xyflow가 다음 프레임에 다시 호출해준다.
  if (!sBox || !tBox) return null;

  const style: MindMapEdgeStyle = (edgeData?.style as MindMapEdgeStyle | undefined) ?? {};
  // 사용자가 직접 지정한 anchor가 있으면 그 각도의 boundary 점을 endpoint로,
  // 없으면 floating(상대 노드 중심 방향) 자동 계산.
  const sPoint = style.sourceAnchor
    ? getBoundaryFromAngle(sBox, style.sourceAnchor.angle)
    : getBoundaryIntersection(sBox, tBox);
  const tPoint = style.targetAnchor
    ? getBoundaryFromAngle(tBox, style.targetAnchor.angle)
    : getBoundaryIntersection(tBox, sBox);

  const stroke = style.color ?? DEFAULT_STROKE;
  const strokeWidth = style.width ?? DEFAULT_WIDTH;
  const curvatureKey = style.curvature ?? "normal";
  const curvature = CURVATURE_VALUE[curvatureKey];

  // path 계산. style.curve가 있으면 자유 곡선(quadratic bezier), 없으면 preset.
  // 자유 곡선의 control = endpoint 미드포인트 + (dx, dy).
  // 핸들 표시 좌표 = 곡선의 visual midpoint(t=0.5 점).
  const midX = (sPoint.x + tPoint.x) / 2;
  const midY = (sPoint.y + tPoint.y) / 2;
  let path: string;
  let labelX: number;
  let labelY: number;
  // 핸들 가시 위치 — 사용자가 잡는 점.
  let handleX = midX;
  let handleY = midY;

  if (style.curve) {
    // 런타임 fallback — 과거 한시적으로 도입된 cubic { c1, c2 } 형식이 메모리에 남아 있을 수
    // 있어, 직접 dx/dy 읽기 전에 정규화. round-trip 후엔 normalize가 처리하지만 in-flight 상태 방어.
    const rawCurve = style.curve as Record<string, unknown>;
    const c1 = rawCurve.c1 as { dx?: number; dy?: number } | undefined;
    const c2 = rawCurve.c2 as { dx?: number; dy?: number } | undefined;
    let dxRaw: number;
    let dyRaw: number;
    if (
      c1 &&
      c2 &&
      Number.isFinite(c1.dx) &&
      Number.isFinite(c1.dy) &&
      Number.isFinite(c2.dx) &&
      Number.isFinite(c2.dy)
    ) {
      dxRaw = ((c1.dx as number) + (c2.dx as number)) / 2;
      dyRaw = ((c1.dy as number) + (c2.dy as number)) / 2;
    } else if (
      Number.isFinite(rawCurve.dx) &&
      Number.isFinite(rawCurve.dy)
    ) {
      dxRaw = rawCurve.dx as number;
      dyRaw = rawCurve.dy as number;
    } else {
      dxRaw = 0;
      dyRaw = 0;
    }
    const cx = midX + dxRaw;
    const cy = midY + dyRaw;
    path = `M ${sPoint.x},${sPoint.y} Q ${cx},${cy} ${tPoint.x},${tPoint.y}`;
    // quadratic bezier의 t=0.5 점 = (s + 2c + t) / 4
    handleX = (sPoint.x + 2 * cx + tPoint.x) / 4;
    handleY = (sPoint.y + 2 * cy + tPoint.y) / 4;
    labelX = handleX;
    labelY = handleY;
  } else if (curvatureKey === "straight") {
    [path, labelX, labelY] = getStraightPath({
      sourceX: sPoint.x,
      sourceY: sPoint.y,
      targetX: tPoint.x,
      targetY: tPoint.y,
    });
    handleX = labelX;
    handleY = labelY;
  } else if (curvatureKey === "step") {
    // 직각 step path — borderRadius=0이면 완전 직각, >0이면 corner 둥글게.
    // sourcePosition/targetPosition은 어느 변에서 path가 출발/도착하는지 결정.
    // stepCenter offset이 있으면 corner 위치(centerX/centerY)를 그쪽으로 이동.
    const sPos = cardinalFromBoundaryPoint(sPoint, sBox);
    const tPos = cardinalFromBoundaryPoint(tPoint, tBox);
    const stepCx = midX + (style.stepCenter?.dx ?? 0);
    const stepCy = midY + (style.stepCenter?.dy ?? 0);
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX: sPoint.x,
      sourceY: sPoint.y,
      sourcePosition: sPos,
      targetX: tPoint.x,
      targetY: tPoint.y,
      targetPosition: tPos,
      borderRadius: 0,
      centerX: stepCx,
      centerY: stepCy,
    });
    handleX = stepCx;
    handleY = stepCy;
  } else {
    // sPoint/tPoint가 자기 노드의 어느 변에 있는지로 sourcePosition/targetPosition 결정.
    // anchor를 자유 위치로 옮겨도 bezier control point가 그 변 바깥쪽으로 잡혀
    // path가 노드 본체를 뚫지 않는다.
    const sPos = cardinalFromBoundaryPoint(sPoint, sBox);
    const tPos = cardinalFromBoundaryPoint(tPoint, tBox);
    [path, labelX, labelY] = getBezierPath({
      sourceX: sPoint.x,
      sourceY: sPoint.y,
      sourcePosition: sPos,
      targetX: tPoint.x,
      targetY: tPoint.y,
      targetPosition: tPos,
      curvature,
    });
    handleX = labelX;
    handleY = labelY;
  }

  const dashArray =
    style.dash === "dashed"
      ? `${Math.max(strokeWidth * 4, 6)} ${Math.max(strokeWidth * 3, 5)}`
      : style.dash === "dotted"
        ? `${strokeWidth} ${Math.max(strokeWidth * 2, 4)}`
        : undefined;

  const arrow = style.arrow ?? "end";
  const showStartArrow = arrow === "start" || arrow === "both";
  const showEndArrow = arrow === "end" || arrow === "both";

  const startMarkerId = `mm-arrow-start-${id}`;
  const endMarkerId = `mm-arrow-end-${id}`;

  // 마커 색은 stroke와 동일 (currentColor 또는 hex).
  // refX는 arrow 끝점이 path 끝에 살짝 들어가도록 8.
  const markerSize = 4 + strokeWidth * 2;

  // drop 시 적용 — slide(같은 노드)/reconnect(다른 노드)/revert(빈 곳·self-loop) 통합.
  // hoverNode가 자기 자신이면 source/target 변경 없이 angle만 갱신(slide).
  // 다른 노드면 source/target 갱신(reconnect). 반대편 endpoint 노드면 self-loop 거부.
  const applyEndpointDrop = (
    end: "source" | "target",
    flow: { x: number; y: number },
    hoverNode: MindMapFlowNode | null,
  ) => {
    if (!hoverNode) return;
    const otherEnd = end === "source" ? target : source;
    if (hoverNode.id === otherEnd) return; // self-loop 거부
    const w = hoverNode.measured?.width ?? hoverNode.width ?? 0;
    const h = hoverNode.measured?.height ?? hoverNode.height ?? 0;
    if (w <= 0 || h <= 0) return;
    const cx = hoverNode.position.x + w / 2;
    const cy = hoverNode.position.y + h / 2;
    const angle = Math.atan2(flow.y - cy, flow.x - cx);
    setEdges((eds) => {
      const next = eds.map((e) => {
        if (e.id !== id) return e;
        const prev = (e.data?.style as MindMapEdgeStyle | undefined) ?? {};
        if (end === "source") {
          return {
            ...e,
            source: hoverNode.id,
            sourceHandle: null,
            data: {
              ...(e.data ?? {}),
              style: { ...prev, sourceAnchor: { angle } },
            },
          };
        }
        return {
          ...e,
          target: hoverNode.id,
          targetHandle: null,
          data: {
            ...(e.data ?? {}),
            style: { ...prev, targetAnchor: { angle } },
          },
        };
      });
      return applySiblingCurveOffset(next);
    });
  };

  return (
    <g
      className={selected ? "[--mm-edge-stroke:theme(colors.foreground)]" : ""}
      style={{
        // currentColor 폴백 — selected가 아니어도 테마에 맞춰 표시.
        // edge.style.color가 있으면 hex가 우선.
        color: stroke.startsWith("var(") ? undefined : stroke,
      }}
    >
      <defs>
        {showEndArrow ? (
          <marker
            id={endMarkerId}
            markerWidth={markerSize}
            markerHeight={markerSize}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
          </marker>
        ) : null}
        {showStartArrow ? (
          <marker
            id={startMarkerId}
            markerWidth={markerSize}
            markerHeight={markerSize}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
          </marker>
        ) : null}
      </defs>

      {/* drag 중인 엣지는 fade해서 ghost가 메인 visual이 되도록.
          opacity는 g 단위로 묶지 않고 path 단위로 — selected halo는 흰색이라
          fade 없이도 ghost를 가리지 않음. */}
      <g style={{ opacity: isThisDragging ? 0.3 : 1, transition: "opacity 120ms ease" }}>
        {/* selected halo — 큰 흰색 path를 뒤에 깔아 어떤 색이든 가시화 */}
        {selected ? (
          <path
            d={path}
            fill="none"
            stroke="oklch(1 0 0 / 70%)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
          />
        ) : null}

        {sketchyMode ? (
          <SketchyPath d={path} stroke={stroke} strokeWidth={strokeWidth} />
        ) : (
          <path
            id={id}
            className="react-flow__edge-path"
            d={path}
            fill="none"
            // xyflow base.css의 `.react-flow__edge.selected .react-flow__edge-path`가
            // stroke를 CSS 변수로 덮어쓴다 (presentation attribute보다 specificity 우위).
            // user-set color/width를 보장하려면 inline style로 박아 specificity를 최고로.
            style={{
              stroke,
              strokeWidth,
              strokeDasharray: dashArray,
              strokeLinecap: "round",
            }}
            markerEnd={showEndArrow ? `url(#${endMarkerId})` : undefined}
            markerStart={showStartArrow ? `url(#${startMarkerId})` : undefined}
          />
        )}
      </g>

      {/* 클릭 영역 확대 — 얇은 라인도 모바일에서 잡기 쉽도록 투명 wide path */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth + 14, 16)}
        style={{ pointerEvents: "stroke" }}
      />

      {/* Ghost preview — drag 중일 때 anchor-end → cursor/snap point */}
      {isThisDragging && endpointDrag ? (
        <GhostEdgePreview
          drag={endpointDrag}
          sourcePoint={sPoint}
          targetPoint={tPoint}
          getNode={(nodeId) => getNodes().find((n) => n.id === nodeId) ?? null}
          source={source}
          target={target}
        />
      ) : null}

      {/* selected 시점에만 — readonly 아닌 경우에만 — 끝점 2개 + 중앙 곡선 핸들.
          drag 중엔 setEdges 호출 X — context의 endpointDrag만 갱신 (ghost preview).
          drop 시 한 번에 applyEndpointDrop 호출. slide/reconnect/revert 모두 통합. */}
      {selected && !readonly ? (
        <>
          {/* source endpoint */}
          <EndpointHandle
            x={sPoint.x}
            y={sPoint.y}
            color={typeof stroke === "string" && stroke.startsWith("#") ? stroke : "var(--foreground)"}
            strokeWidth={strokeWidth}
            onDragStart={(flow) => {
              setEndpointDrag({
                edgeId: id,
                end: "source",
                cursorFlow: flow,
                hoverNodeId: null,
              });
            }}
            onDragMove={(flow) => {
              const hover = findNodeAtFlowPoint(flow, getNodes());
              setEndpointDrag({
                edgeId: id,
                end: "source",
                cursorFlow: flow,
                hoverNodeId: hover?.id ?? null,
              });
            }}
            onDragEnd={(flow) => {
              const hover = findNodeAtFlowPoint(flow, getNodes());
              setEndpointDrag(null);
              applyEndpointDrop("source", flow, hover);
            }}
            screenToFlowPosition={screenToFlowPosition}
          />
          {/* target endpoint */}
          <EndpointHandle
            x={tPoint.x}
            y={tPoint.y}
            color={typeof stroke === "string" && stroke.startsWith("#") ? stroke : "var(--foreground)"}
            strokeWidth={strokeWidth}
            onDragStart={(flow) => {
              setEndpointDrag({
                edgeId: id,
                end: "target",
                cursorFlow: flow,
                hoverNodeId: null,
              });
            }}
            onDragMove={(flow) => {
              const hover = findNodeAtFlowPoint(flow, getNodes());
              setEndpointDrag({
                edgeId: id,
                end: "target",
                cursorFlow: flow,
                hoverNodeId: hover?.id ?? null,
              });
            }}
            onDragEnd={(flow) => {
              const hover = findNodeAtFlowPoint(flow, getNodes());
              setEndpointDrag(null);
              applyEndpointDrop("target", flow, hover);
            }}
            screenToFlowPosition={screenToFlowPosition}
          />
          {/* 중간 핸들 — step 모드면 corner 이동(stepCenter), 그 외엔 자유 곡선(curve) 저장 */}
          <CurveHandle
            x={handleX}
            y={handleY}
            color={typeof stroke === "string" && stroke.startsWith("#") ? stroke : "var(--foreground)"}
            onDrag={(p) => {
              if (curvatureKey === "step" && !style.curve) {
                // step 모드 — corner 위치만 이동, 곡선으로 변환 X.
                const dx = clamp(p.x - midX, -4000, 4000);
                const dy = clamp(p.y - midY, -4000, 4000);
                setEdges((eds) =>
                  eds.map((e) => {
                    if (e.id !== id) return e;
                    const prev = (e.data?.style as MindMapEdgeStyle | undefined) ?? {};
                    return {
                      ...e,
                      data: {
                        ...(e.data ?? {}),
                        style: { ...prev, stepCenter: { dx, dy } },
                      },
                    };
                  }),
                );
                return;
              }
              // p는 flow 좌표. 새 control point의 시각 위치(t=0.5 점)가 p가 되도록
              // dx/dy 역산: handleX = midX + dx/2 → dx = 2*(p.x - midX).
              const dx = clamp(2 * (p.x - midX), -2000, 2000);
              const dy = clamp(2 * (p.y - midY), -2000, 2000);
              setEdges((eds) =>
                eds.map((e) => {
                  if (e.id !== id) return e;
                  const prev = (e.data?.style as MindMapEdgeStyle | undefined) ?? {};
                  return {
                    ...e,
                    data: {
                      ...(e.data ?? {}),
                      style: { ...prev, curve: { dx, dy } },
                    },
                  };
                }),
              );
            }}
            screenToFlowPosition={screenToFlowPosition}
          />
        </>
      ) : null}

      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="rounded bg-card/90 px-1.5 py-0.5 text-[11px] text-foreground shadow-sm border border-border"
          >
            {String(edgeData.label)}
          </div>
        </EdgeLabelRenderer>
      ) : null}

      {/* 엣지 inspector — selected 시 엣지 midpoint 바로 위에 floating.
          기존엔 mind-map-view에서 캔버스 상단 고정 위치였는데, 노드에 가려지고
          엣지와 멀어서 UX가 나빴음. EdgeLabelRenderer + flow 좌표 transform으로
          줌/팬 따라 함께 움직이고, zIndex 1000으로 노드 위로 보장. */}
      {selected && !readonly && !isThisDragging ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 16}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            // nodrag/nopan으로 xyflow의 pane drag 가로채기 방지 (인스펙터 버튼 클릭이 pan을 발화시키지 않게).
            className="nodrag nopan"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <EdgeInspector
              edge={{
                id,
                source,
                target,
                type: "mindMap",
                data: edgeData,
              }}
            />
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Endpoint 드래그 핸들 — pointerCapture 패턴.
 * - onDragStart: 첫 pointerdown 시 (drag state 초기화)
 * - onDragMove: 매 pointermove 시 (cursor 좌표 + hover 노드 갱신)
 * - onDragEnd: pointerup 시 (slide/reconnect/revert 적용)
 *
 * 중요: SVG `<g>`가 아니라 EdgeLabelRenderer로 HTML 레이어에 그린다. 노드 HTML이
 * 엣지 SVG 위에 있어서 endpoint가 boundary 깊이 들어가면 노드에 가려지는 문제 회피.
 * HTML 오버레이는 노드 위에 그려져 항상 보이고, hit area도 36px로 충분히 크다.
 */
interface EndpointHandleProps {
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
  onDragStart: (flowPoint: { x: number; y: number }) => void;
  onDragMove: (flowPoint: { x: number; y: number }) => void;
  onDragEnd: (flowPoint: { x: number; y: number }) => void;
  screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number };
}

function EndpointHandle({
  x,
  y,
  color,
  strokeWidth,
  onDragStart,
  onDragMove,
  onDragEnd,
  screenToFlowPosition,
}: EndpointHandleProps) {
  const draggingRef = useRef(false);
  const lastFlowRef = useRef<{ x: number; y: number } | null>(null);

  const handlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      draggingRef.current = true;
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      lastFlowRef.current = flow;
      e.currentTarget.setPointerCapture(e.pointerId);
      onDragStart(flow);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      e.stopPropagation();
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      lastFlowRef.current = flow;
      onDragMove(flow);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const flow =
        lastFlowRef.current ??
        screenToFlowPosition({ x: e.clientX, y: e.clientY });
      lastFlowRef.current = null;
      onDragEnd(flow);
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const flow =
        lastFlowRef.current ??
        screenToFlowPosition({ x: e.clientX, y: e.clientY });
      lastFlowRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer 이미 release된 경우 */
      }
      onDragEnd(flow);
    },
  };

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          width: 36,
          height: 36,
          borderRadius: 9999,
          pointerEvents: "all",
          touchAction: "none",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        // nodrag/nopan: xyflow가 이 div의 pointerdown을 pane drag로 잡지 않도록 opt-out.
        // EdgeLabelRenderer 자식은 viewport 안에 있어 기본적으로 pane drag 후보가 됨.
        className="nodrag nopan cursor-grab active:cursor-grabbing"
        {...handlers}
      >
        {/* 시각 dot — strokeWidth에 비례한 크기로 path 끝 마감과 자연스럽게 융합.
            흰 outline은 boxShadow ring(1.5px)으로만 둬서 path 끝의 round cap을 덮지 않음.
            dot 자체가 path 끝의 둥근 마감처럼 보이는 효과. */}
        <div
          style={{
            width: Math.min(Math.max(strokeWidth * 3 + 4, 9), 14),
            height: Math.min(Math.max(strokeWidth * 3 + 4, 9), 14),
            borderRadius: 9999,
            background: color,
            boxShadow:
              "0 0 0 1.5px rgba(255,255,255,0.95), 0 1px 2px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        />
      </div>
    </EdgeLabelRenderer>
  );
}

/**
 * Drag 중 ghost preview — anchor-end → cursor/snap point까지 dashed orange line + dot.
 * - 노드 위 (반대편 endpoint 노드 제외) → 그 노드 boundary at cursor angle으로 snap
 * - 빈 곳 또는 self-loop 후보 노드 → cursor 좌표 그대로 (snap 안 함)
 */
function GhostEdgePreview({
  drag,
  sourcePoint,
  targetPoint,
  source,
  target,
  getNode,
}: {
  drag: EndpointDragState;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  source: string;
  target: string;
  getNode: (id: string) => MindMapFlowNode | null;
}) {
  // anchor end (변하지 않는 쪽) — drag 시작 시점의 좌표 그대로
  const anchorPoint = drag.end === "source" ? targetPoint : sourcePoint;
  const otherEnd = drag.end === "source" ? target : source;

  let endX = drag.cursorFlow.x;
  let endY = drag.cursorFlow.y;
  const hoverNode = drag.hoverNodeId ? getNode(drag.hoverNodeId) : null;
  if (hoverNode && hoverNode.id !== otherEnd) {
    const w = hoverNode.measured?.width ?? hoverNode.width ?? 0;
    const h = hoverNode.measured?.height ?? hoverNode.height ?? 0;
    if (w > 0 && h > 0) {
      const cx = hoverNode.position.x + w / 2;
      const cy = hoverNode.position.y + h / 2;
      const angle = Math.atan2(drag.cursorFlow.y - cy, drag.cursorFlow.x - cx);
      const shape =
        ((hoverNode.data as { shape?: NodeShape })?.shape ?? "rectangle") as NodeShape;
      const snap = getBoundaryFromAngle({ cx, cy, w, h, shape }, angle);
      endX = snap.x;
      endY = snap.y;
    }
  }

  const d = `M ${anchorPoint.x},${anchorPoint.y} L ${endX},${endY}`;
  return (
    <g pointerEvents="none">
      <path
        d={d}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity={0.95}
      />
      <circle
        cx={endX}
        cy={endY}
        r={7}
        fill="var(--primary)"
        stroke="white"
        strokeWidth={2}
      />
    </g>
  );
}

interface CurveHandleProps {
  x: number;
  y: number;
  color: string;
  onDrag: (flowPoint: { x: number; y: number }) => void;
  screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number };
}

/**
 * SVG <circle> 기반 드래그 핸들. 사용자가 곡선 위의 visual midpoint를 잡고 끌면
 * onDrag로 flow 좌표를 콜백. 마우스/터치 둘 다 pointer event로 통일.
 */
function CurveHandle({
  x,
  y,
  color,
  onDrag,
  screenToFlowPosition,
}: CurveHandleProps) {
  const draggingRef = useRef(false);

  return (
    <g>
      {/* 시각 라인 가이드 — 핸들 주변 작은 dot ring (잡을 수 있다는 affordance).
          cursor는 CSS class로 처리 — :active일 때 grabbing, 평소엔 grab. */}
      <circle
        cx={x}
        cy={y}
        r={9}
        fill="white"
        fillOpacity={0.85}
        stroke={color}
        strokeWidth={1.5}
        className="nodrag nopan cursor-grab active:cursor-grabbing"
        style={{
          pointerEvents: "all",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          draggingRef.current = true;
          (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          e.stopPropagation();
          const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          onDrag(flow);
        }}
        onPointerUp={(e) => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          (e.currentTarget as SVGCircleElement).releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          draggingRef.current = false;
          (e.currentTarget as SVGCircleElement).releasePointerCapture(e.pointerId);
        }}
      />
      <circle cx={x} cy={y} r={3} fill={color} pointerEvents="none" />
    </g>
  );
}
