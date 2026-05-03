import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";

/**
 * 공유 완전 해제 (소유자 전용).
 * - isPublic=false 로 전환
 * - shareToken=null 로 폐기 → 향후 재공개 시 새 토큰이 발급됨
 *
 * "공유 토글 OFF" (isPublic만 false, 토큰 보존) 와 다름:
 * 토글 OFF는 PUT /api/mind-maps/[id] 의 isPublic=false 로 처리.
 * 이 라우트는 명시적 "링크 폐기 + 비공개" 의도 (예: 잘못된 사람에게 공유됨).
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const result = await prisma.mindMap.updateMany({
    where: { id, userId: user.id },
    data: { isPublic: false, shareToken: null },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
