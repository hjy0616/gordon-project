import {
  EDGE_ARROWS,
  EDGE_CURVATURES,
  EDGE_DASHES,
  EDGE_WIDTHS,
  NODE_COLORS,
  NODE_HEIGHT_MAX,
  NODE_HEIGHT_MIN,
  NODE_LABEL_ALIGNS,
  NODE_SHAPES,
  NODE_WIDTH_MAX,
  NODE_WIDTH_MIN,
  type EdgeArrow,
  type EdgeCurvature,
  type EdgeDash,
  type EdgeWidth,
  type MindMapEdgeStyle,
  type NodeColor,
  type NodeLabelAlign,
  type NodeShape,
  type StoredMindMapEdge,
  type StoredMindMapNode,
} from "@/types/mind-map";

const ID_MAX = 256;
const LABEL_MAX = 500;
const MEMO_MAX = 5000;
const EMOJI_MAX = 16;
const HANDLE_MAX = 32;
const EDGE_LABEL_MAX = 200;
export const NODES_LIMIT = 500;
export const EDGES_LIMIT = 1000;
export const PAYLOAD_BYTE_LIMIT = 1_000_000;

const COLOR_SET = new Set<NodeColor>(NODE_COLORS);
const SHAPE_SET = new Set<NodeShape>(NODE_SHAPES);
const ALIGN_SET = new Set<NodeLabelAlign>(NODE_LABEL_ALIGNS);
const DASH_SET = new Set<EdgeDash>(EDGE_DASHES);
const ARROW_SET = new Set<EdgeArrow>(EDGE_ARROWS);
const CURVATURE_SET = new Set<EdgeCurvature>(EDGE_CURVATURES);
const WIDTH_SET = new Set<EdgeWidth>(EDGE_WIDTHS);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

type ValidateResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isStringWithin(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length <= max;
}

function validateEdgeStyle(
  raw: unknown,
  index: number,
): ValidateResult<MindMapEdgeStyle | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: `edges[${index}].style: object 필요` };
  }
  const s = raw as Record<string, unknown>;
  const out: MindMapEdgeStyle = {};
  if (s.color !== undefined) {
    if (typeof s.color !== "string" || !HEX_COLOR.test(s.color)) {
      return {
        ok: false,
        error: `edges[${index}].style.color: #rrggbb 형태`,
      };
    }
    out.color = s.color.toLowerCase();
  }
  if (s.width !== undefined) {
    if (typeof s.width !== "number" || !WIDTH_SET.has(s.width as EdgeWidth)) {
      return {
        ok: false,
        error: `edges[${index}].style.width: ${[...EDGE_WIDTHS].join("|")} 중 하나`,
      };
    }
    out.width = s.width as EdgeWidth;
  }
  if (s.dash !== undefined) {
    if (typeof s.dash !== "string" || !DASH_SET.has(s.dash as EdgeDash)) {
      return {
        ok: false,
        error: `edges[${index}].style.dash: ${[...EDGE_DASHES].join("|")}`,
      };
    }
    out.dash = s.dash as EdgeDash;
  }
  if (s.arrow !== undefined) {
    if (typeof s.arrow !== "string" || !ARROW_SET.has(s.arrow as EdgeArrow)) {
      return {
        ok: false,
        error: `edges[${index}].style.arrow: ${[...EDGE_ARROWS].join("|")}`,
      };
    }
    out.arrow = s.arrow as EdgeArrow;
  }
  if (s.curvature !== undefined) {
    if (
      typeof s.curvature !== "string" ||
      !CURVATURE_SET.has(s.curvature as EdgeCurvature)
    ) {
      return {
        ok: false,
        error: `edges[${index}].style.curvature: ${[...EDGE_CURVATURES].join("|")}`,
      };
    }
    out.curvature = s.curvature as EdgeCurvature;
  }
  if (s.curve !== undefined) {
    if (!s.curve || typeof s.curve !== "object") {
      return { ok: false, error: `edges[${index}].style.curve: object 필요` };
    }
    const c = s.curve as Record<string, unknown>;
    const c1 = c.c1 as Record<string, unknown> | undefined;
    const c2 = c.c2 as Record<string, unknown> | undefined;
    let dx: number;
    let dy: number;
    if (
      c1 &&
      c2 &&
      typeof c1 === "object" &&
      typeof c2 === "object" &&
      isFiniteNumber(c1.dx) &&
      isFiniteNumber(c1.dy) &&
      isFiniteNumber(c2.dx) &&
      isFiniteNumber(c2.dy)
    ) {
      // 과거 cubic 저장 데이터 downgrade — c1, c2 평균
      dx = (c1.dx + c2.dx) / 2;
      dy = (c1.dy + c2.dy) / 2;
    } else if (isFiniteNumber(c.dx) && isFiniteNumber(c.dy)) {
      dx = c.dx;
      dy = c.dy;
    } else {
      return {
        ok: false,
        error: `edges[${index}].style.curve.{dx,dy}: |값| ≤ 2000인 유한 숫자`,
      };
    }
    if (Math.abs(dx) > 2000 || Math.abs(dy) > 2000) {
      return {
        ok: false,
        error: `edges[${index}].style.curve.{dx,dy}: |값| ≤ 2000인 유한 숫자`,
      };
    }
    out.curve = { dx, dy };
  }
  if (s.stepCenter !== undefined) {
    if (!s.stepCenter || typeof s.stepCenter !== "object") {
      return { ok: false, error: `edges[${index}].style.stepCenter: object 필요` };
    }
    const c = s.stepCenter as Record<string, unknown>;
    if (
      !isFiniteNumber(c.dx) ||
      !isFiniteNumber(c.dy) ||
      Math.abs(c.dx) > 4000 ||
      Math.abs(c.dy) > 4000
    ) {
      return {
        ok: false,
        error: `edges[${index}].style.stepCenter.{dx,dy}: |값| ≤ 4000인 유한 숫자`,
      };
    }
    out.stepCenter = { dx: c.dx, dy: c.dy };
  }
  // sourceAnchor / targetAnchor — atan2는 [-π, π] 반환하지만 round-trip 안전하게 [-2π, 2π].
  for (const key of ["sourceAnchor", "targetAnchor"] as const) {
    const raw = (s as Record<string, unknown>)[key];
    if (raw === undefined) continue;
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: `edges[${index}].style.${key}: object 필요` };
    }
    const a = (raw as Record<string, unknown>).angle;
    if (!isFiniteNumber(a) || Math.abs(a) > 2 * Math.PI + 1e-6) {
      return {
        ok: false,
        error: `edges[${index}].style.${key}.angle: |값| ≤ 2π인 유한 숫자`,
      };
    }
    out[key] = { angle: a };
  }
  return {
    ok: true,
    value: Object.keys(out).length > 0 ? out : undefined,
  };
}

function validateNode(
  raw: unknown,
  index: number,
): ValidateResult<StoredMindMapNode> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: `nodes[${index}]: object 아님` };
  }
  const n = raw as Record<string, unknown>;

  if (!isStringWithin(n.id, ID_MAX) || n.id.length === 0) {
    return { ok: false, error: `nodes[${index}].id: 1~${ID_MAX}자 문자열 필요` };
  }
  if (!n.position || typeof n.position !== "object") {
    return { ok: false, error: `nodes[${index}].position: object 필요` };
  }
  const pos = n.position as Record<string, unknown>;
  if (!isFiniteNumber(pos.x) || !isFiniteNumber(pos.y)) {
    return {
      ok: false,
      error: `nodes[${index}].position.{x,y}: 유한 숫자 필요`,
    };
  }
  if (!n.data || typeof n.data !== "object") {
    return { ok: false, error: `nodes[${index}].data: object 필요` };
  }
  const d = n.data as Record<string, unknown>;
  if (typeof d.label !== "string" || d.label.length > LABEL_MAX) {
    return { ok: false, error: `nodes[${index}].data.label: ≤${LABEL_MAX}자 문자열 필요` };
  }
  if (d.memo !== undefined) {
    if (typeof d.memo !== "string" || d.memo.length > MEMO_MAX) {
      return { ok: false, error: `nodes[${index}].data.memo: ≤${MEMO_MAX}자` };
    }
  }
  if (d.color !== undefined) {
    if (typeof d.color !== "string" || !COLOR_SET.has(d.color as NodeColor)) {
      return {
        ok: false,
        error: `nodes[${index}].data.color: ${[...NODE_COLORS].join("|")} 중 하나`,
      };
    }
  }
  if (d.emoji !== undefined) {
    if (typeof d.emoji !== "string" || d.emoji.length > EMOJI_MAX) {
      return { ok: false, error: `nodes[${index}].data.emoji: ≤${EMOJI_MAX}자` };
    }
  }
  if (d.shape !== undefined) {
    if (typeof d.shape !== "string" || !SHAPE_SET.has(d.shape as NodeShape)) {
      return {
        ok: false,
        error: `nodes[${index}].data.shape: ${[...NODE_SHAPES].join("|")} 중 하나`,
      };
    }
  }
  if (d.width !== undefined) {
    if (
      !isFiniteNumber(d.width) ||
      d.width < NODE_WIDTH_MIN ||
      d.width > NODE_WIDTH_MAX
    ) {
      return {
        ok: false,
        error: `nodes[${index}].data.width: ${NODE_WIDTH_MIN}~${NODE_WIDTH_MAX} 사이 숫자`,
      };
    }
  }
  if (d.height !== undefined) {
    if (
      !isFiniteNumber(d.height) ||
      d.height < NODE_HEIGHT_MIN ||
      d.height > NODE_HEIGHT_MAX
    ) {
      return {
        ok: false,
        error: `nodes[${index}].data.height: ${NODE_HEIGHT_MIN}~${NODE_HEIGHT_MAX} 사이 숫자`,
      };
    }
  }
  if (d.labelAlign !== undefined) {
    if (
      typeof d.labelAlign !== "string" ||
      !ALIGN_SET.has(d.labelAlign as NodeLabelAlign)
    ) {
      return {
        ok: false,
        error: `nodes[${index}].data.labelAlign: ${[...NODE_LABEL_ALIGNS].join("|")} 중 하나`,
      };
    }
  }

  // 키 순서 고정 — toStoredNodes/normalizeNodeData와 동일해야 lastSyncedRef 안정.
  const value: StoredMindMapNode = {
    id: n.id,
    position: { x: pos.x, y: pos.y },
    data: {
      label: d.label,
      ...(typeof d.memo === "string" ? { memo: d.memo } : {}),
      ...(typeof d.color === "string" ? { color: d.color as NodeColor } : {}),
      ...(typeof d.emoji === "string" ? { emoji: d.emoji } : {}),
      ...(typeof d.shape === "string" ? { shape: d.shape as NodeShape } : {}),
      ...(isFiniteNumber(d.width) ? { width: d.width } : {}),
      ...(isFiniteNumber(d.height) ? { height: d.height } : {}),
      ...(typeof d.labelAlign === "string"
        ? { labelAlign: d.labelAlign as NodeLabelAlign }
        : {}),
    },
  };
  return { ok: true, value };
}

function validateEdge(
  raw: unknown,
  index: number,
  nodeIds: Set<string>,
): ValidateResult<StoredMindMapEdge> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: `edges[${index}]: object 아님` };
  }
  const e = raw as Record<string, unknown>;
  if (!isStringWithin(e.id, ID_MAX) || e.id.length === 0) {
    return { ok: false, error: `edges[${index}].id: 1~${ID_MAX}자 문자열` };
  }
  if (!isStringWithin(e.source, ID_MAX) || e.source.length === 0) {
    return { ok: false, error: `edges[${index}].source: 1~${ID_MAX}자 문자열` };
  }
  if (!isStringWithin(e.target, ID_MAX) || e.target.length === 0) {
    return { ok: false, error: `edges[${index}].target: 1~${ID_MAX}자 문자열` };
  }
  if (!nodeIds.has(e.source)) {
    return {
      ok: false,
      error: `edges[${index}].source: 같은 페이로드의 nodes에 없는 id`,
    };
  }
  if (!nodeIds.has(e.target)) {
    return {
      ok: false,
      error: `edges[${index}].target: 같은 페이로드의 nodes에 없는 id`,
    };
  }
  // self-loop 차단 — floating boundary 교차가 0이 되어 path가 NaN이 된다.
  if (e.source === e.target) {
    return {
      ok: false,
      error: `edges[${index}]: source/target이 같은 self-loop은 지원하지 않음`,
    };
  }
  if (
    e.sourceHandle !== undefined &&
    e.sourceHandle !== null &&
    !isStringWithin(e.sourceHandle, HANDLE_MAX)
  ) {
    return { ok: false, error: `edges[${index}].sourceHandle: ≤${HANDLE_MAX}자 문자열|null` };
  }
  if (
    e.targetHandle !== undefined &&
    e.targetHandle !== null &&
    !isStringWithin(e.targetHandle, HANDLE_MAX)
  ) {
    return { ok: false, error: `edges[${index}].targetHandle: ≤${HANDLE_MAX}자 문자열|null` };
  }
  if (e.label !== undefined) {
    if (typeof e.label !== "string" || e.label.length > EDGE_LABEL_MAX) {
      return { ok: false, error: `edges[${index}].label: ≤${EDGE_LABEL_MAX}자` };
    }
  }
  const styleResult = validateEdgeStyle(e.style, index);
  if (!styleResult.ok) return styleResult;

  const value: StoredMindMapEdge = {
    id: e.id,
    source: e.source,
    target: e.target,
    ...(e.sourceHandle !== undefined
      ? { sourceHandle: e.sourceHandle as string | null }
      : {}),
    ...(e.targetHandle !== undefined
      ? { targetHandle: e.targetHandle as string | null }
      : {}),
    ...(typeof e.label === "string" ? { label: e.label } : {}),
    ...(styleResult.value ? { style: styleResult.value } : {}),
  };
  return { ok: true, value };
}

export function validateNodes(input: unknown): ValidateResult<StoredMindMapNode[]> {
  if (!Array.isArray(input)) return { ok: false, error: "nodes: 배열 필요" };
  if (input.length > NODES_LIMIT) {
    return { ok: false, error: `nodes: 개수 ≤ ${NODES_LIMIT}` };
  }
  const seen = new Set<string>();
  const out: StoredMindMapNode[] = [];
  for (let i = 0; i < input.length; i++) {
    const r = validateNode(input[i], i);
    if (!r.ok) return r;
    if (seen.has(r.value.id)) {
      return { ok: false, error: `nodes[${i}].id: 중복된 id` };
    }
    seen.add(r.value.id);
    out.push(r.value);
  }
  return { ok: true, value: out };
}

export function validateEdges(
  input: unknown,
  nodeIds: Set<string>,
): ValidateResult<StoredMindMapEdge[]> {
  if (!Array.isArray(input)) return { ok: false, error: "edges: 배열 필요" };
  if (input.length > EDGES_LIMIT) {
    return { ok: false, error: `edges: 개수 ≤ ${EDGES_LIMIT}` };
  }
  const seen = new Set<string>();
  const out: StoredMindMapEdge[] = [];
  for (let i = 0; i < input.length; i++) {
    const r = validateEdge(input[i], i, nodeIds);
    if (!r.ok) return r;
    if (seen.has(r.value.id)) {
      return { ok: false, error: `edges[${i}].id: 중복된 id` };
    }
    seen.add(r.value.id);
    out.push(r.value);
  }
  return { ok: true, value: out };
}

export interface ValidatedPayload {
  nodes?: StoredMindMapNode[];
  edges?: StoredMindMapEdge[];
}

/**
 * PUT/sync body의 nodes/edges 부분만 검증. 부분 업데이트라 둘 중 하나만 와도 OK.
 * 단 edges가 오면서 nodes가 안 오면 endpoint 존재 검증을 위해 currentNodeIds를 받는다.
 */
export function validateMindMapPayload(
  body: { nodes?: unknown; edges?: unknown },
  currentNodeIds: Set<string>,
): ValidateResult<ValidatedPayload> {
  const result: ValidatedPayload = {};
  let nodeIdsForEdges = currentNodeIds;

  if (body.nodes !== undefined) {
    const nr = validateNodes(body.nodes);
    if (!nr.ok) return nr;
    result.nodes = nr.value;
    nodeIdsForEdges = new Set(nr.value.map((n) => n.id));
  }

  if (body.edges !== undefined) {
    const er = validateEdges(body.edges, nodeIdsForEdges);
    if (!er.ok) return er;
    result.edges = er.value;
  }

  // 전체 byte cap — JSON.stringify 비용은 한 번만
  if (result.nodes || result.edges) {
    const size = JSON.stringify({
      nodes: result.nodes,
      edges: result.edges,
    }).length;
    if (size > PAYLOAD_BYTE_LIMIT) {
      return {
        ok: false,
        error: `payload byte > ${PAYLOAD_BYTE_LIMIT}`,
      };
    }
  }

  return { ok: true, value: result };
}
