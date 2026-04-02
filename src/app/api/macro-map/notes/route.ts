import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.countryNote.findMany({
    where: { userId: user.id },
  });

  const result: Record<string, { note: string; continentTag: string | null }> = {};
  for (const n of notes) {
    result[n.isoA3] = { note: n.note, continentTag: n.continentTag };
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isoA3, note, continentTag } = await req.json();

  if (!isoA3) {
    return NextResponse.json({ error: "isoA3 is required" }, { status: 400 });
  }

  const data = await prisma.countryNote.upsert({
    where: { userId_isoA3: { userId: user.id, isoA3 } },
    update: {
      ...(note !== undefined && { note }),
      ...(continentTag !== undefined && { continentTag }),
    },
    create: {
      userId: user.id,
      isoA3,
      note: note ?? "",
      continentTag: continentTag ?? null,
    },
  });

  return NextResponse.json(data);
}
