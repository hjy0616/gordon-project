import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import type { Role, UserStatus } from "@/generated/prisma/enums";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, status, activeFrom, activeUntil } = body as {
    role?: Role;
    status?: UserStatus;
    activeFrom?: string;
    activeUntil?: string;
  };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (role) data.role = role;
  if (status) data.status = status;
  if (activeFrom !== undefined) data.activeFrom = activeFrom ? new Date(activeFrom) : null;
  if (activeUntil !== undefined) data.activeUntil = activeUntil ? new Date(activeUntil) : null;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      activeFrom: true,
      activeUntil: true,
    },
  });

  return NextResponse.json(updated);
}
