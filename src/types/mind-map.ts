import type { Node, Edge } from "@xyflow/react";

export type NodeColor = "neutral" | "blue" | "green" | "amber" | "rose";

export const NODE_COLORS: NodeColor[] = [
  "neutral",
  "blue",
  "green",
  "amber",
  "rose",
];

// 노드 색상 토큰 — light/dark 모두 oklch 변수 활용
// bg = 옅은 배경, accent = 좌측 4px 바
export const NODE_COLOR_CLASSES: Record<
  NodeColor,
  { bg: string; accent: string; ring: string }
> = {
  neutral: {
    bg: "bg-[oklch(0.92_0.005_0)] dark:bg-[oklch(0.40_0.005_0)]",
    accent: "bg-[oklch(0.55_0.005_0)]",
    ring: "ring-[oklch(0.55_0.005_0)]",
  },
  blue: {
    bg: "bg-[oklch(0.96_0.03_240)] dark:bg-[oklch(0.28_0.06_240)]",
    accent: "bg-[oklch(0.62_0.16_240)]",
    ring: "ring-[oklch(0.62_0.16_240)]",
  },
  green: {
    bg: "bg-[oklch(0.96_0.04_150)] dark:bg-[oklch(0.28_0.06_150)]",
    accent: "bg-[oklch(0.62_0.16_150)]",
    ring: "ring-[oklch(0.62_0.16_150)]",
  },
  amber: {
    bg: "bg-[oklch(0.96_0.05_85)] dark:bg-[oklch(0.30_0.06_85)]",
    accent: "bg-[oklch(0.72_0.16_85)]",
    ring: "ring-[oklch(0.72_0.16_85)]",
  },
  rose: {
    bg: "bg-[oklch(0.96_0.04_15)] dark:bg-[oklch(0.30_0.06_15)]",
    accent: "bg-[oklch(0.65_0.18_15)]",
    ring: "ring-[oklch(0.65_0.18_15)]",
  },
};

export const NODE_SHAPES = [
  "rectangle",
  "rounded",
  "ellipse",
  "diamond",
  "hexagon",
  "sticky",
] as const;
export type NodeShape = (typeof NODE_SHAPES)[number];

// 노드 크기 한계 — 너무 작으면 라벨/툴바가 잘리고, 너무 크면 캔버스 도배.
export const NODE_WIDTH_MIN = 60;
export const NODE_WIDTH_MAX = 600;
export const NODE_HEIGHT_MIN = 40;
export const NODE_HEIGHT_MAX = 400;

// 도형별 기본/기준 크기. data.width/height 미지정 시 렌더 크기 + 폰트 자동 스케일의 baseline.
// 이 값에서 라벨이 14px일 때 자연스럽게 보이도록 튜닝.
export const SHAPE_BASELINES: Record<NodeShape, { w: number; h: number }> = {
  rectangle: { w: 200, h: 68 },
  rounded: { w: 200, h: 72 },
  ellipse: { w: 180, h: 180 },
  diamond: { w: 220, h: 220 },
  hexagon: { w: 240, h: 152 },
  sticky: { w: 200, h: 120 },
};

// 도형 크기 변화에 비례한 라벨/메모/이모지 폰트 메트릭. baseline 대비 min(w/W, h/H) 스케일에
// 14/12/16px를 곱한 뒤 가독성 floor/ceil로 클램프. line-height는 폰트와 동일 비율 유지.
export function computeNodeFontMetrics(
  shape: NodeShape,
  width: number,
  height: number,
): {
  labelPx: number;
  labelLineHeight: number;
  memoPx: number;
  memoLineHeight: number;
  emojiPx: number;
} {
  const baseline = SHAPE_BASELINES[shape] ?? SHAPE_BASELINES.rectangle;
  const scale = Math.min(width / baseline.w, height / baseline.h);
  const clamp = (x: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, x));
  const labelPx = clamp(14 * scale, 9, 22);
  const memoPx = clamp(12 * scale, 8, 18);
  const emojiPx = clamp(16 * scale, 11, 26);
  return {
    labelPx,
    labelLineHeight: labelPx * (24 / 14),
    memoPx,
    memoLineHeight: memoPx * (20 / 12),
    emojiPx,
  };
}

// 엣지 per-line 스타일 — UI 토글 그룹과 storage가 같은 enum 공유
export const EDGE_PRESET_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#10b981",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#1f2937",
] as const;
export const EDGE_WIDTHS = [1, 2, 3] as const;
export type EdgeWidth = (typeof EDGE_WIDTHS)[number];

export const EDGE_DASHES = ["solid", "dashed", "dotted"] as const;
export type EdgeDash = (typeof EDGE_DASHES)[number];

export const EDGE_ARROWS = ["none", "end", "start", "both"] as const;
export type EdgeArrow = (typeof EDGE_ARROWS)[number];

export const EDGE_CURVATURES = ["straight", "step", "normal", "loopy"] as const;
export type EdgeCurvature = (typeof EDGE_CURVATURES)[number];

export interface MindMapEdgeStyle {
  color?: string; // hex #rrggbb — undefined → 테마 currentColor
  width?: EdgeWidth;
  dash?: EdgeDash;
  arrow?: EdgeArrow;
  curvature?: EdgeCurvature;
  // 사용자가 직접 끌어 만든 자유 곡선 — 두 boundary endpoint의 미드포인트로부터의
  // control point 오프셋. 존재하면 curvature(preset)을 무시하고 자유 곡선 적용.
  // x/y 둘 다 [-2000, 2000] 범위로 캔버스 폭주 방어.
  // 자유 곡선 — quadratic bezier control 1개 (midpoint 기준 offset).
  // 과거 한시적으로 도입된 cubic { c1, c2 } 형식이 저장된 경우 normalize/validation에서
  // c1, c2 평균 offset 으로 quadratic 변환되어 들어옴 (downgrade migration).
  curve?: { dx: number; dy: number };
  // step(직각) 모드 corner 위치 — midpoint 기준 offset.
  // step 모드일 때 중간 핸들 drag 시 이 값에 저장되어 path corner가 이동 (curve 대신).
  stepCenter?: { dx: number; dy: number };
  // 사용자가 직접 클릭/드래그해 고정한 endpoint 위치(노드 중심에서의 라디안 각도).
  // 미설정 시 floating(상대 노드 중심 방향) 자동 계산. 도형/리사이즈에 자연 적응.
  sourceAnchor?: { angle: number };
  targetAnchor?: { angle: number };
}

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  memo?: string;
  color?: NodeColor;
  emoji?: string;
  shape?: NodeShape; // undefined → "rectangle"
  width?: number; // 사용자 리사이즈 (미설정 시 도형 default)
  height?: number;
}

export interface MindMapEdgeData extends Record<string, unknown> {
  label?: string;
  style?: MindMapEdgeStyle;
}

export type MindMapFlowNode = Node<MindMapNodeData>;
export type MindMapFlowEdge = Edge<MindMapEdgeData>;

// DB에 JSON 컬럼으로 저장되는 형태 — xyflow의 풀 Node/Edge 중 직렬화 가능한 부분만
export interface StoredMindMapNode {
  id: string;
  position: { x: number; y: number };
  data: MindMapNodeData;
}

export interface StoredMindMapEdge {
  id: string;
  source: string;
  target: string;
  // 레거시 — 기존 데이터에 "top|right|bottom|left"가 들어있을 수 있음.
  // 신규 엣지는 항상 null. 렌더링 시 무시되고 floating boundary 교차로 그려진다.
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  style?: MindMapEdgeStyle;
}

// 캔버스 배경 — 패턴 + 색상 두 차원
// 패턴: xyflow Background variant 매핑 + 추가 프리셋
// 색상: light/dark 모두 oklch 토큰 페어로 정의 (canvas-style.ts에서 매핑)
export const CANVAS_BACKGROUND_PATTERNS = [
  "blank",
  "dots",
  "grid",
  "lined",
  "cross",
] as const;
export type CanvasBackgroundPattern = (typeof CANVAS_BACKGROUND_PATTERNS)[number];

export const CANVAS_BACKGROUND_COLORS = [
  "default",
  "white",
  "paper",
  "black",
  "cream",
  "kraft",
  "mint",
  "sky",
  "rose",
] as const;
export type CanvasBackgroundColor = (typeof CANVAS_BACKGROUND_COLORS)[number];

export function parseCanvasBackgroundPattern(
  value: unknown,
): CanvasBackgroundPattern | null {
  if (
    typeof value === "string" &&
    (CANVAS_BACKGROUND_PATTERNS as readonly string[]).includes(value)
  ) {
    return value as CanvasBackgroundPattern;
  }
  return null;
}

export function parseCanvasBackgroundColor(
  value: unknown,
): CanvasBackgroundColor | null {
  if (
    typeof value === "string" &&
    (CANVAS_BACKGROUND_COLORS as readonly string[]).includes(value)
  ) {
    return value as CanvasBackgroundColor;
  }
  return null;
}

export interface MindMap {
  id: string;
  title: string;
  emoji: string | null;
  description: string | null;
  nodes: StoredMindMapNode[];
  edges: StoredMindMapEdge[];
  isPublic: boolean;
  isFavorite: boolean;
  viewCount: number;
  canvasBackground: CanvasBackgroundPattern;
  canvasBackgroundColor: CanvasBackgroundColor;
  // 캔버스 전역 — true면 모든 라인/노드를 rough.js로 재그림 (손그림 미감).
  sketchyMode: boolean;
  /** owner 응답에만 포함 — viewer 응답엔 미노출 */
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// 목록 페이지에서 노드/엣지 페이로드를 모두 보낼 필요 없어 노드 개수만 포함
export interface MindMapSummary {
  id: string;
  title: string;
  emoji: string | null;
  description: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  viewCount: number;
  nodeCount: number;
  canvasBackground: CanvasBackgroundPattern;
  canvasBackgroundColor: CanvasBackgroundColor;
  sketchyMode: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// node.dragHandle = ".mm-drag" → clip-path 도형의 corner 영역이 draggable에서 제외된다.
// shape wrapper (clip-path 적용)에만 .mm-drag 클래스가 있어 corner click이 outer로 떨어지면
// closest('.mm-drag') 실패 → drag 안 됨. 비-clip 도형은 wrapper가 bounding box 전체라 동일하게 동작.
export const NODE_DRAG_HANDLE_SELECTOR = ".mm-drag";

export function toFlowNodes(stored: StoredMindMapNode[]): MindMapFlowNode[] {
  return stored.map((n) => ({
    id: n.id,
    position: n.position,
    data: n.data,
    type: "mindMap",
    dragHandle: NODE_DRAG_HANDLE_SELECTOR,
  }));
}

export function toFlowEdges(stored: StoredMindMapEdge[]): MindMapFlowEdge[] {
  return stored.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    // 신규 floating 모델은 sourceHandle/targetHandle을 사용하지 않는다.
    // 레거시 데이터의 "top|right|bottom|left"는 모두 undefined로 떨궈서
    // ReactFlow가 invisible single handle로 라우팅하도록 한다.
    sourceHandle: undefined,
    targetHandle: undefined,
    // type은 ReactFlow의 defaultEdgeOptions가 채움 — 여기서 강제하지 않으면
    // edgeTypes 등록 전(Step 5 이전)에도 기존 마인드맵이 깨지지 않음.
    data: {
      ...(typeof e.label === "string" ? { label: e.label } : {}),
      ...(e.style ? { style: e.style } : {}),
    },
  }));
}

/**
 * data 객체 키 순서를 서버 validateNode와 동일하게 정규화.
 * xyflow의 updateNodeData(id, patch)는 내부 spread 순서가 비결정적이라
 * 정규화 없이 JSON.stringify 비교 시 round-trip false-positive로 status가 dirty에
 * 영구 고정된다. 서버 검증과 동일한 순서: label → memo → color → emoji → shape → width → height.
 */
function normalizeNodeData(d: MindMapNodeData): MindMapNodeData {
  const out: MindMapNodeData = { label: d.label };
  if (typeof d.memo === "string") out.memo = d.memo;
  if (typeof d.color === "string") out.color = d.color;
  if (typeof d.emoji === "string") out.emoji = d.emoji;
  if (typeof d.shape === "string") out.shape = d.shape;
  if (typeof d.width === "number" && Number.isFinite(d.width)) out.width = d.width;
  if (typeof d.height === "number" && Number.isFinite(d.height)) out.height = d.height;
  return out;
}

// 같은 이유로 edge style도 키 순서를 고정.
function normalizeEdgeStyle(s: MindMapEdgeStyle): MindMapEdgeStyle | undefined {
  const out: MindMapEdgeStyle = {};
  if (typeof s.color === "string") out.color = s.color;
  if (typeof s.width === "number") out.width = s.width as EdgeWidth;
  if (typeof s.dash === "string") out.dash = s.dash as EdgeDash;
  if (typeof s.arrow === "string") out.arrow = s.arrow as EdgeArrow;
  if (typeof s.curvature === "string") out.curvature = s.curvature as EdgeCurvature;
  if (s.curve && typeof s.curve === "object") {
    const c = s.curve as Record<string, unknown>;
    const c1 = c.c1 as Record<string, unknown> | undefined;
    const c2 = c.c2 as Record<string, unknown> | undefined;
    if (
      c1 &&
      c2 &&
      typeof c1 === "object" &&
      typeof c2 === "object" &&
      Number.isFinite(c1.dx) &&
      Number.isFinite(c1.dy) &&
      Number.isFinite(c2.dx) &&
      Number.isFinite(c2.dy)
    ) {
      // cubic 저장 데이터 downgrade — c1, c2 평균을 quadratic offset 으로
      out.curve = {
        dx: ((c1.dx as number) + (c2.dx as number)) / 2,
        dy: ((c1.dy as number) + (c2.dy as number)) / 2,
      };
    } else if (Number.isFinite(c.dx) && Number.isFinite(c.dy)) {
      out.curve = { dx: c.dx as number, dy: c.dy as number };
    }
  }
  if (
    s.stepCenter &&
    typeof s.stepCenter === "object" &&
    Number.isFinite(s.stepCenter.dx) &&
    Number.isFinite(s.stepCenter.dy)
  ) {
    out.stepCenter = { dx: s.stepCenter.dx, dy: s.stepCenter.dy };
  }
  if (
    s.sourceAnchor &&
    typeof s.sourceAnchor === "object" &&
    Number.isFinite(s.sourceAnchor.angle)
  ) {
    out.sourceAnchor = { angle: s.sourceAnchor.angle };
  }
  if (
    s.targetAnchor &&
    typeof s.targetAnchor === "object" &&
    Number.isFinite(s.targetAnchor.angle)
  ) {
    out.targetAnchor = { angle: s.targetAnchor.angle };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function toStoredNodes(nodes: MindMapFlowNode[]): StoredMindMapNode[] {
  return nodes.map((n) => ({
    id: n.id,
    position: { x: n.position.x, y: n.position.y },
    data: normalizeNodeData(n.data),
  }));
}

export function toStoredEdges(edges: MindMapFlowEdge[]): StoredMindMapEdge[] {
  return edges.map((e) => {
    // 라벨은 e.label 또는 e.data.label 둘 다 허용 — 통합 후 data.label에 통일.
    const dataStyle = (e.data?.style as MindMapEdgeStyle | undefined) ?? undefined;
    const style = dataStyle ? normalizeEdgeStyle(dataStyle) : undefined;
    const label =
      typeof e.label === "string"
        ? e.label
        : typeof e.data?.label === "string"
          ? (e.data.label as string)
          : undefined;
    const out: StoredMindMapEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: null,
      targetHandle: null,
    };
    if (typeof label === "string") out.label = label;
    if (style) out.style = style;
    return out;
  });
}

export function emptyMindMapNode(
  position: { x: number; y: number },
  overrides?: Partial<MindMapNodeData>,
): StoredMindMapNode {
  return {
    id: crypto.randomUUID(),
    position,
    data: {
      label: "",
      ...overrides,
    },
  };
}

export const NODE_OFFSET = {
  top: { x: 0, y: -140 },
  bottom: { x: 0, y: 140 },
  left: { x: -200, y: 0 },
  right: { x: 200, y: 0 },
} as const;

export type NodeDirection = keyof typeof NODE_OFFSET;
