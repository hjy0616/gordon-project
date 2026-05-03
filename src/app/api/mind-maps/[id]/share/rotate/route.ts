import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";
import { generateShareToken } from "@/lib/mind-map/share-token";

/**
 * 공유 토큰 재발급 (소유자 전용).
 * - 새 토큰 생성 후 isPublic=true 보장
 * - unique 충돌 시 1회 재시도 (144비트라 거의 불가능하지만 방어)
 * - 응답: { shareToken, isPublic }
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  for (let attempt = 0; attempt < 2; attempt++) {
    const newToken = generateShareToken();
    try {
      const result = await prisma.mindMap.updateMany({
        where: { id, userId: user.id },
        data: { shareToken: newToken, isPublic: true },
      });
      if (result.count === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ shareToken: newToken, isPublic: true });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // unique 충돌 — 다시 시도
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json(
    { error: "토큰 발급에 실패했습니다" },
    { status: 500 },
  );
}
