import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    adoptionRate: pref?.adoptionRate ?? 50,
    deletedMockIds: pref?.deletedMockIds ?? [],
  });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.adoptionRate !== undefined) data.adoptionRate = body.adoptionRate;
  if (body.deletedMockIds !== undefined) data.deletedMockIds = body.deletedMockIds;

  const pref = await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: {
      userId: user.id,
      adoptionRate: body.adoptionRate ?? 50,
      deletedMockIds: body.deletedMockIds ?? [],
    },
  });

  return NextResponse.json({
    adoptionRate: pref.adoptionRate,
    deletedMockIds: pref.deletedMockIds,
  });
}
