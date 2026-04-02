import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import type { SurvivalTier } from "@/generated/prisma/enums";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const overrides = await prisma.districtOverride.findMany({
    where: { userId: user.id },
  });

  const result: Record<string, unknown> = {};
  for (const o of overrides) {
    result[o.districtId] = {
      name_ko: o.nameKo,
      name_en: o.nameEn,
      region: o.region,
      tier: o.tier,
      tierReason: o.tierReason,
      criteria: o.criteria,
    };
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { districtId, ...fields } = await req.json();

  if (!districtId) {
    return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (fields.name_ko !== undefined) data.nameKo = fields.name_ko;
  if (fields.name_en !== undefined) data.nameEn = fields.name_en;
  if (fields.region !== undefined) data.region = fields.region;
  if (fields.tier !== undefined) data.tier = fields.tier as SurvivalTier;
  if (fields.tierReason !== undefined) data.tierReason = fields.tierReason;
  if (fields.criteria !== undefined) data.criteria = fields.criteria;

  const result = await prisma.districtOverride.upsert({
    where: { userId_districtId: { userId: user.id, districtId } },
    update: data,
    create: {
      userId: user.id,
      districtId,
      nameKo: fields.name_ko ?? null,
      nameEn: fields.name_en ?? null,
      region: fields.region ?? null,
      tier: (fields.tier as SurvivalTier) ?? null,
      tierReason: fields.tierReason ?? null,
      criteria: fields.criteria ?? null,
    },
  });

  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { districtId } = await req.json();

  if (!districtId) {
    return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  }

  const deleted = await prisma.districtOverride.deleteMany({
    where: { userId: user.id, districtId },
  });

  return NextResponse.json({ deleted: deleted.count });
}
