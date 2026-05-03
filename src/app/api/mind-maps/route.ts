import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { trackEvent } from "@/lib/analytics";
import {
  parseCanvasBackgroundColor,
  parseCanvasBackgroundPattern,
} from "@/types/mind-map";
import type {
  MindMapSummary,
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

function toSummary(row: MindMapRow): MindMapSummary {
  const nodes = (row.nodes ?? []) as unknown as StoredMindMapNode[];
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    isPublic: row.isPublic,
    isFavorite: row.isFavorite,
    viewCount: row.viewCount,
    nodeCount: Array.isArray(nodes) ? nodes.length : 0,
    canvasBackground:
      parseCanvasBackgroundPattern(row.canvasBackground) ?? "dots",
    canvasBackgroundColor:
      parseCanvasBackgroundColor(row.canvasBackgroundColor) ?? "default",
    sketchyMode: row.sketchyMode,
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const TAKE = 100;

export async function GET(req: Request) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const favoritesOnly = url.searchParams.get("favorites") === "1";

  if (!q) {
    const rows = await prisma.mindMap.findMany({
      where: {
        userId: user.id,
        ...(favoritesOnly ? { isFavorite: true } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: TAKE,
    });
    return NextResponse.json(rows.map(toSummary));
  }

  // 제목 또는 노드 텍스트(JSON cast) ILIKE 매칭.
  // 모든 외부 입력은 태그드 템플릿 파라미터로만 전달 — 절대 보간 X.
  const pattern = `%${q}%`;
  const idRows = favoritesOnly
    ? await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM mind_maps
        WHERE user_id = ${user.id}
          AND is_favorite = true
          AND (title ILIKE ${pattern} OR nodes::text ILIKE ${pattern})
        ORDER BY updated_at DESC
        LIMIT ${TAKE}
      `
    : await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM mind_maps
        WHERE user_id = ${user.id}
          AND (title ILIKE ${pattern} OR nodes::text ILIKE ${pattern})
        ORDER BY updated_at DESC
        LIMIT ${TAKE}
      `;

  if (idRows.length === 0) return NextResponse.json([]);

  const ids = idRows.map((r) => r.id);
  const rows = await prisma.mindMap.findMany({
    where: { id: { in: ids } },
  });
  // raw query의 정렬을 보존
  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json(rows.map(toSummary));
}

export async function POST(req: Request) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: unknown; emoji?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "Untitled";
  const emoji =
    typeof body.emoji === "string" && body.emoji.trim()
      ? body.emoji.trim().slice(0, 8)
      : null;
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim().slice(0, 1000)
      : null;

  const row = await prisma.mindMap.create({
    data: {
      userId: user.id,
      title,
      emoji,
      description,
      nodes: [] as unknown as Prisma.InputJsonValue,
      edges: [] as unknown as Prisma.InputJsonValue,
    },
  });

  await trackEvent({
    userId: user.id,
    type: "mindmap.created",
    label: row.title,
    props: { mindMapId: row.id },
  });

  return NextResponse.json(toSummary(row), { status: 201 });
}
