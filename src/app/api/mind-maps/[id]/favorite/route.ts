import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-utils";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.mindMap.findFirst({
    where: { id, userId: user.id },
    select: { isFavorite: true },
  });

  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = !row.isFavorite;
  await prisma.mindMap.update({
    where: { id },
    data: { isFavorite: next },
  });

  return NextResponse.json({ isFavorite: next });
}
