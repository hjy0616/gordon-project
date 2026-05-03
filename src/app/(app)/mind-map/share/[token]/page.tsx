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
 * 공유 토큰 기반 read-only 뷰어.
 * - 로그인 사용자만 접근 (기존 정책 유지)
 * - 토큰 lookup → isPublic=true 일 때만 200, 그 외 404
 * - userId / shareToken / isFavorite 등 owner-only 필드는 응답에 포함하지 않음
 */
export default async function MindMapSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await requireActiveUser();
  if (!user) notFound();

  if (!token || token.length < 16) notFound();

  const row = await prisma.mindMap.findUnique({
    where: { shareToken: token },
  });
  if (!row || !row.isPublic) notFound();

  const initial: MindMap = {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    description: row.description,
    nodes: (row.nodes ?? []) as unknown as StoredMindMapNode[],
    edges: (row.edges ?? []) as unknown as StoredMindMapEdge[],
    isPublic: row.isPublic,
    // viewer는 owner-only 필드를 받지 않음
    isFavorite: false,
    viewCount: row.viewCount,
    canvasBackground:
      parseCanvasBackgroundPattern(row.canvasBackground) ?? "dots",
    canvasBackgroundColor:
      parseCanvasBackgroundColor(row.canvasBackgroundColor) ?? "default",
    sketchyMode: row.sketchyMode,
    shareToken: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  return <MindMapView initial={initial} readonly={true} />;
}
