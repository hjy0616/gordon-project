import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { MindMapView } from "@/components/mind-map/mind-map-view";
import {
  parseCanvasBackgroundColor,
  parseCanvasBackgroundPattern,
} from "@/types/mind-map";
import type {
  MindMap,
  StoredMindMapEdge,
  StoredMindMapNode,
} from "@/types/mind-map";

export const dynamic = "force-dynamic";

/**
 * 소유자 전용 편집 라우트.
 * 비소유자(공유 링크 보유자)는 `/mind-map/share/[token]` 으로 접근.
 */
export default async function MindMapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireActiveUser();
  if (!user) notFound();

  const row = await prisma.mindMap.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) notFound();

  const initial: MindMap = {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    nodes: (row.nodes ?? []) as unknown as StoredMindMapNode[],
    edges: (row.edges ?? []) as unknown as StoredMindMapEdge[],
    isPublic: row.isPublic,
    isFavorite: row.isFavorite,
    viewCount: row.viewCount,
    canvasBackground:
      parseCanvasBackgroundPattern(row.canvasBackground) ?? "dots",
    canvasBackgroundColor:
      parseCanvasBackgroundColor(row.canvasBackgroundColor) ?? "default",
    sketchyMode: row.sketchyMode,
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  return <MindMapView initial={initial} readonly={false} />;
}
