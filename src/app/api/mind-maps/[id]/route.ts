import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { trackEvent } from "@/lib/analytics";
import {
  processMindMapUpdate,
  toClientMindMapForOwner,
} from "@/lib/mind-map/update";

/**
 * 소유자 전용 라우트.
 * 비소유자는 isPublic 여부와 무관하게 404 — 공유 보기는 `/api/mind-maps/share/[token]` 경유.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.mindMap.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(toClientMindMapForOwner(row));
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await processMindMapUpdate(body, user.id, id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.serverRow ? { serverRow: result.serverRow } : {}) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const deleted = await prisma.mindMap.deleteMany({
    where: { id, userId: user.id },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await trackEvent({
    userId: user.id,
    type: "mindmap.deleted",
    path: id,
    props: { mindMapId: id },
  });

  return NextResponse.json({ deleted: deleted.count });
}
