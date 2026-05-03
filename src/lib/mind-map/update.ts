import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import {
  validateMindMapPayload,
  NODES_LIMIT,
  EDGES_LIMIT,
} from "./validation";
import { generateShareToken } from "./share-token";
import {
  parseCanvasBackgroundColor,
  parseCanvasBackgroundPattern,
} from "@/types/mind-map";
import type {
  CanvasBackgroundColor,
  CanvasBackgroundPattern,
  MindMap,
  StoredMindMapEdge,
  StoredMindMapNode,
} from "@/types/mind-map";

interface MindMapRow {
  id: string;
  userId: string;
  title: string;
  emoji: string | null;
  description: string | null;
  nodes: unknown;
  edges: unknown;
  isPublic: boolean;
  isFavorite: boolean;
  viewCount: number;
  canvasBackground: string;
  canvasBackgroundColor: string;
  sketchyMode: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function normalizePattern(value: string): CanvasBackgroundPattern {
  return parseCanvasBackgroundPattern(value) ?? "dots";
}

function normalizeColor(value: string): CanvasBackgroundColor {
  return parseCanvasBackgroundColor(value) ?? "default";
}

/**
 * Owner 응답: 모든 필드 (단, userId는 응답에 포함하지 않음 — 보안상).
 * shareToken은 owner만 알아야 하므로 여기에만 포함.
 */
export function toClientMindMapForOwner(row: MindMapRow): MindMap {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    nodes: (row.nodes ?? []) as unknown as StoredMindMapNode[],
    edges: (row.edges ?? []) as unknown as StoredMindMapEdge[],
    isPublic: row.isPublic,
    isFavorite: row.isFavorite,
    viewCount: row.viewCount,
    canvasBackground: normalizePattern(row.canvasBackground),
    canvasBackgroundColor: normalizeColor(row.canvasBackgroundColor),
    sketchyMode: row.sketchyMode,
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * 공유 링크 뷰어 응답: 토큰 라우트(`/mind-map/share/{token}`)에서만 사용.
 * shareToken/isFavorite를 응답에 노출하지 않음 — 토큰 자체는 URL로 전달되었으므로
 * 응답에 다시 담을 필요가 없고, 다른 토큰을 추측할 단서를 주지 않음.
 */
export function toClientMindMapForViewer(row: MindMapRow): MindMap {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    nodes: (row.nodes ?? []) as unknown as StoredMindMapNode[],
    edges: (row.edges ?? []) as unknown as StoredMindMapEdge[],
    isPublic: row.isPublic,
    isFavorite: false,
    viewCount: row.viewCount,
    canvasBackground: normalizePattern(row.canvasBackground),
    canvasBackgroundColor: normalizeColor(row.canvasBackgroundColor),
    sketchyMode: row.sketchyMode,
    shareToken: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type UpdateResult =
  | { ok: true; row: MindMap; willPublish: boolean }
  | { ok: false; status: 400 | 404 | 409; error: string; serverRow?: MindMap };

/**
 * PUT /api/mind-maps/[id] 와 POST /api/mind-maps/[id]/sync 의 공유 로직.
 * - body 검증 (validation.ts)
 * - expectedUpdatedAt이 있으면 OCC: updateMany({ where: {..., updatedAt: expectedUpdatedAt } })
 *   불일치(count===0)면 충돌. 단순 not-found와 구분하기 위해 row 존재 여부를 별도 조회로 확인.
 * - 응답에 fresh row 포함 (clamp된 nodes/edges + 새 updatedAt). 클라가 OCC base 갱신 가능.
 * - isPublic을 true로 설정할 때 shareToken이 null이면 자동 발급 (lazy backfill).
 */
export async function processMindMapUpdate(
  body: Record<string, unknown>,
  userId: string,
  id: string,
): Promise<UpdateResult> {
  // 빠른 cap 가드 — validation 진입 전
  if (Array.isArray(body.nodes) && body.nodes.length > NODES_LIMIT) {
    return {
      ok: false,
      status: 400,
      error: `nodes: 개수 ≤ ${NODES_LIMIT}`,
    };
  }
  if (Array.isArray(body.edges) && body.edges.length > EDGES_LIMIT) {
    return {
      ok: false,
      status: 400,
      error: `edges: 개수 ≤ ${EDGES_LIMIT}`,
    };
  }

  // edges만 오는 경우 endpoint 검증을 위해 현재 nodes id가 필요
  let currentNodeIds = new Set<string>();
  if (
    body.edges !== undefined &&
    body.nodes === undefined
  ) {
    const current = await prisma.mindMap.findFirst({
      where: { id, userId },
      select: { nodes: true },
    });
    if (!current) {
      return { ok: false, status: 404, error: "Not found" };
    }
    const nodes = (current.nodes ?? []) as unknown as StoredMindMapNode[];
    currentNodeIds = new Set(nodes.map((n) => n.id));
  }

  const v = validateMindMapPayload(
    { nodes: body.nodes, edges: body.edges },
    currentNodeIds,
  );
  if (!v.ok) {
    return { ok: false, status: 400, error: v.error };
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    data.title = body.title.trim().slice(0, 200) || "Untitled";
  }
  if (typeof body.emoji === "string") {
    data.emoji = body.emoji.trim().slice(0, 16) || null;
  } else if (body.emoji === null) {
    data.emoji = null;
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim().slice(0, 1000) || null;
  } else if (body.description === null) {
    data.description = null;
  }
  if (v.value.nodes !== undefined) {
    data.nodes = v.value.nodes as unknown as Prisma.InputJsonValue;
  }
  if (v.value.edges !== undefined) {
    data.edges = v.value.edges as unknown as Prisma.InputJsonValue;
  }
  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic;
  }
  if (body.canvasBackground !== undefined) {
    const parsed = parseCanvasBackgroundPattern(body.canvasBackground);
    if (parsed === null) {
      return {
        ok: false,
        status: 400,
        error: "canvasBackground: 허용된 값이 아닙니다",
      };
    }
    data.canvasBackground = parsed;
  }
  if (body.canvasBackgroundColor !== undefined) {
    const parsed = parseCanvasBackgroundColor(body.canvasBackgroundColor);
    if (parsed === null) {
      return {
        ok: false,
        status: 400,
        error: "canvasBackgroundColor: 허용된 값이 아닙니다",
      };
    }
    data.canvasBackgroundColor = parsed;
  }
  if (body.sketchyMode !== undefined) {
    if (typeof body.sketchyMode !== "boolean") {
      return {
        ok: false,
        status: 400,
        error: "sketchyMode: boolean 필요",
      };
    }
    data.sketchyMode = body.sketchyMode;
  }

  // mindmap.shared 이벤트는 isPublic false→true 전환 시에만 1회.
  // 같은 조회로 shareToken 부재 여부도 확인해 lazy 발급 처리.
  let willPublish = false;
  if (data.isPublic === true) {
    const before = await prisma.mindMap.findFirst({
      where: { id, userId },
      select: { isPublic: true, shareToken: true },
    });
    if (before && !before.isPublic) willPublish = true;
    if (before && before.shareToken === null) {
      data.shareToken = generateShareToken();
    }
  }

  if (Object.keys(data).length === 0) {
    // 변경 사항 없음 — 그래도 fresh row 반환해 클라가 OCC base 갱신 가능
    const row = await prisma.mindMap.findFirst({
      where: { id, userId },
    });
    if (!row) return { ok: false, status: 404, error: "Not found" };
    return {
      ok: true,
      row: toClientMindMapForOwner(row),
      willPublish: false,
    };
  }

  // OCC: expectedUpdatedAt이 있으면 where 절에 추가
  const expectedRaw = body.expectedUpdatedAt;
  const expectedUpdatedAt =
    typeof expectedRaw === "string" ? new Date(expectedRaw) : null;
  const isValidExpected =
    expectedUpdatedAt !== null && !Number.isNaN(expectedUpdatedAt.getTime());

  const where: Prisma.MindMapWhereInput = { id, userId };
  if (isValidExpected) {
    where.updatedAt = expectedUpdatedAt!;
  }

  const updated = await prisma.mindMap.updateMany({ where, data });

  if (updated.count === 0) {
    // 두 가지 가능성: (1) 존재하지 않거나 권한 없음, (2) OCC 충돌
    const exists = await prisma.mindMap.findFirst({
      where: { id, userId },
    });
    if (!exists) {
      return { ok: false, status: 404, error: "Not found" };
    }
    if (isValidExpected) {
      return {
        ok: false,
        status: 409,
        error: "다른 곳에서 수정되었습니다",
        serverRow: toClientMindMapForOwner(exists),
      };
    }
    // expectedUpdatedAt 없는데 0건 — 권한 또는 race. 404로 처리.
    return { ok: false, status: 404, error: "Not found" };
  }

  const fresh = await prisma.mindMap.findUnique({ where: { id } });
  if (!fresh) return { ok: false, status: 404, error: "Not found" };

  if (willPublish) {
    await trackEvent({
      userId,
      type: "mindmap.shared",
      path: id,
      props: { mindMapId: id },
    });
  }

  return { ok: true, row: toClientMindMapForOwner(fresh), willPublish };
}
