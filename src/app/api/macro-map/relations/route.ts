import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import type { RelationType } from "@/generated/prisma/enums";

function canonical(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const relations = await prisma.countryRelation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  // 양방향 확장
  const expanded = relations.flatMap((r) => [
    { id: r.id, from_iso: r.fromIso, to_iso: r.toIso, type: r.type },
    { id: r.id, from_iso: r.toIso, to_iso: r.fromIso, type: r.type },
  ]);

  return NextResponse.json(expanded);
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [fromIso, toIso] = canonical(body.from_iso, body.to_iso);

  const relation = await prisma.countryRelation.upsert({
    where: {
      userId_fromIso_toIso: { userId: user.id, fromIso, toIso },
    },
    update: { type: body.type as RelationType },
    create: {
      userId: user.id,
      fromIso,
      toIso,
      type: body.type as RelationType,
    },
  });

  return NextResponse.json({
    id: relation.id,
    from_iso: relation.fromIso,
    to_iso: relation.toIso,
    type: relation.type,
  }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from_iso, to_iso } = await req.json();
  const [fromIso, toIso] = canonical(from_iso, to_iso);

  const deleted = await prisma.countryRelation.deleteMany({
    where: { userId: user.id, fromIso, toIso },
  });

  return NextResponse.json({ deleted: deleted.count });
}
