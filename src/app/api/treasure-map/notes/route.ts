import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.districtNote.findMany({
    where: { userId: user.id },
  });

  const result: Record<string, string> = {};
  for (const n of notes) {
    result[n.districtId] = n.note;
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { districtId, note } = await req.json();

  if (!districtId) {
    return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  }

  const data = await prisma.districtNote.upsert({
    where: { userId_districtId: { userId: user.id, districtId } },
    update: { note: note ?? "" },
    create: { userId: user.id, districtId, note: note ?? "" },
  });

  return NextResponse.json(data);
}
