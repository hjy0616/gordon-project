import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, private" } as const;

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      status: true,
      role: true,
      activeUntil: true,
      renewalRejectionReason: true,
      renewalRejectedAt: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json(
      { deleted: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      status: dbUser.status,
      role: dbUser.role,
      activeUntil: dbUser.activeUntil?.toISOString() ?? null,
      renewalRejectionReason: dbUser.renewalRejectionReason,
      renewalRejectedAt: dbUser.renewalRejectedAt?.toISOString() ?? null,
    },
    { headers: NO_STORE_HEADERS }
  );
}
