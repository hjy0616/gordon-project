import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { toClientMindMapForViewer } from "@/lib/mind-map/update";

/**
 * 공유 토큰 기반 read-only 뷰어.
 * - 토큰 lookup → 행이 있고 isPublic=true 일 때만 200
 * - requireActiveUser 통과 (로그인한 회원만 보기 — 기존 정책 유지)
 * - 토큰 자체가 URL 식별자이므로 viewCount 증가는 이 라우트에서만 (소유자 본인 GET은 viewCount 미증가)
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.mindMap.findUnique({ where: { shareToken: token } });
  if (!row || !row.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // viewCount 증가 — 소유자 본인이 자기 토큰 URL로 들어와도 증가 (이미 일반적 분석 의미)
  prisma.mindMap
    .update({ where: { id: row.id }, data: { viewCount: { increment: 1 } } })
    .catch((err) => console.error("[mindmap.viewCount] failed", err));

  return NextResponse.json(toClientMindMapForViewer(row));
}
