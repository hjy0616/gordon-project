import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const edits = await prisma.districtEdit.findMany({
    where: { userId: user.id },
  });

  const result: Record<string, unknown> = {};
  for (const e of edits) {
    result[e.districtId] = {
      haasScores: e.haasScores,
      radarScores: e.radarScores,
      usageSimInputs: e.usageSimInputs,
      revenueInputs: e.revenueInputs,
    };
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { districtId, haasScores, radarScores, usageSimInputs, revenueInputs } =
    await req.json();

  if (!districtId) {
    return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (haasScores !== undefined) updateData.haasScores = haasScores;
  if (radarScores !== undefined) updateData.radarScores = radarScores;
  if (usageSimInputs !== undefined) updateData.usageSimInputs = usageSimInputs;
  if (revenueInputs !== undefined) updateData.revenueInputs = revenueInputs;

  const data = await prisma.districtEdit.upsert({
    where: { userId_districtId: { userId: user.id, districtId } },
    update: updateData,
    create: {
      userId: user.id,
      districtId,
      haasScores: haasScores ?? null,
      radarScores: radarScores ?? null,
      usageSimInputs: usageSimInputs ?? null,
      revenueInputs: revenueInputs ?? null,
    },
  });

  return NextResponse.json(data);
}
