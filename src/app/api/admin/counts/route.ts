import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pending, renewal] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { renewalImage: { not: null } } }),
  ]);

  return NextResponse.json({ pending, renewal });
}
