import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import type { FlowType } from "@/generated/prisma/enums";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flows = await prisma.capitalFlow.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    flows.map((f) => ({
      id: f.id,
      from_iso: f.fromIso,
      to_iso: f.toIso,
      from_coords: f.fromCoords,
      to_coords: f.toCoords,
      volume: f.volume,
      type: f.type,
      label: f.label,
    }))
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const flow = await prisma.capitalFlow.create({
    data: {
      userId: user.id,
      fromIso: body.from_iso,
      toIso: body.to_iso,
      fromCoords: body.from_coords,
      toCoords: body.to_coords,
      volume: body.volume,
      type: body.type as FlowType,
      label: body.label ?? "",
    },
  });

  return NextResponse.json({
    id: flow.id,
    from_iso: flow.fromIso,
    to_iso: flow.toIso,
    from_coords: flow.fromCoords,
    to_coords: flow.toCoords,
    volume: flow.volume,
    type: flow.type,
    label: flow.label,
  }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const flow = await prisma.capitalFlow.updateMany({
    where: { id: body.id, userId: user.id },
    data: {
      ...(body.from_iso !== undefined && { fromIso: body.from_iso }),
      ...(body.to_iso !== undefined && { toIso: body.to_iso }),
      ...(body.from_coords !== undefined && { fromCoords: body.from_coords }),
      ...(body.to_coords !== undefined && { toCoords: body.to_coords }),
      ...(body.volume !== undefined && { volume: body.volume }),
      ...(body.type !== undefined && { type: body.type as FlowType }),
      ...(body.label !== undefined && { label: body.label }),
    },
  });

  return NextResponse.json({ updated: flow.count });
}

export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await prisma.capitalFlow.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ deleted: deleted.count });
}
