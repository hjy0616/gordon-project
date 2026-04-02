import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import type { SurvivalTier } from "@/generated/prisma/enums";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const districts = await prisma.customDistrict.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    districts.map((d) => ({
      id: d.id,
      name_ko: d.nameKo,
      name_en: d.nameEn,
      region: d.region,
      tier: d.tier,
      tierReason: d.tierReason,
      lat: d.lat,
      lng: d.lng,
      isCustom: true,
      criteria: d.criteria,
      haasScores: d.haasScores,
      rightsData: d.rightsData,
    }))
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const district = await prisma.customDistrict.create({
    data: {
      userId: user.id,
      nameKo: body.name_ko,
      nameEn: body.name_en ?? "",
      region: body.region ?? "",
      tier: body.tier as SurvivalTier,
      tierReason: body.tierReason ?? "",
      lat: body.lat,
      lng: body.lng,
      criteria: body.criteria ?? {},
      haasScores: body.haasScores ?? {},
      rightsData: body.rightsData ?? null,
    },
  });

  return NextResponse.json({
    id: district.id,
    name_ko: district.nameKo,
    name_en: district.nameEn,
    region: district.region,
    tier: district.tier,
    tierReason: district.tierReason,
    lat: district.lat,
    lng: district.lng,
    isCustom: true,
    criteria: district.criteria,
    haasScores: district.haasScores,
    rightsData: district.rightsData,
  }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...fields } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (fields.name_ko !== undefined) data.nameKo = fields.name_ko;
  if (fields.name_en !== undefined) data.nameEn = fields.name_en;
  if (fields.region !== undefined) data.region = fields.region;
  if (fields.tier !== undefined) data.tier = fields.tier as SurvivalTier;
  if (fields.tierReason !== undefined) data.tierReason = fields.tierReason;
  if (fields.lat !== undefined) data.lat = fields.lat;
  if (fields.lng !== undefined) data.lng = fields.lng;
  if (fields.criteria !== undefined) data.criteria = fields.criteria;
  if (fields.haasScores !== undefined) data.haasScores = fields.haasScores;
  if (fields.rightsData !== undefined) data.rightsData = fields.rightsData;

  const updated = await prisma.customDistrict.updateMany({
    where: { id, userId: user.id },
    data,
  });

  return NextResponse.json({ updated: updated.count });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await prisma.customDistrict.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ deleted: deleted.count });
}
