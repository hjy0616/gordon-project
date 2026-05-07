import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type PrecheckCode = "OK" | "INVALID" | "PENDING" | "SUSPENDED" | "EXPIRED";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  // register 라우트와 NextAuth authorize가 raw email로 조회하므로 동일 정규화 사용.
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json<{ code: PrecheckCode }>({ code: "INVALID" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      role: true,
      status: true,
      activeUntil: true,
    },
  });

  if (!user || !user.password) {
    return NextResponse.json<{ code: PrecheckCode }>({ code: "INVALID" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json<{ code: PrecheckCode }>({ code: "INVALID" });
  }

  if (user.status === "PENDING") {
    return NextResponse.json<{ code: PrecheckCode }>({ code: "PENDING" });
  }
  if (user.status === "SUSPENDED") {
    return NextResponse.json<{ code: PrecheckCode }>({ code: "SUSPENDED" });
  }
  if (
    user.role !== "ADMIN" &&
    user.status === "ACTIVE" &&
    user.activeUntil &&
    user.activeUntil.getTime() < Date.now()
  ) {
    const now = new Date();
    const expired = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: {
          id: user.id,
          status: "ACTIVE",
          activeUntil: { lt: now },
        },
        data: { status: "EXPIRED" },
      });
      if (result.count !== 1) return false;
      await tx.userStatusLog.create({
        data: {
          userId: user.id,
          fromStatus: user.status,
          toStatus: "EXPIRED",
          reason: "activeUntil 경과 — 자동 만료",
        },
      });
      return true;
    });

    if (expired) {
      // 자동 만료 처리 후 OK로 통과 — /expired 페이지로 redirect 흐름을 후속 layout이 책임.
      return NextResponse.json<{ code: PrecheckCode }>({ code: "OK" });
    }

    // race: 동시에 어드민이 갱신함. fresh 재검증 후 분기.
    const fresh = await prisma.user.findUnique({
      where: { id: user.id },
      select: { status: true, role: true, activeUntil: true },
    });
    if (!fresh) {
      return NextResponse.json<{ code: PrecheckCode }>({ code: "INVALID" });
    }
    if (fresh.status === "PENDING") {
      return NextResponse.json<{ code: PrecheckCode }>({ code: "PENDING" });
    }
    if (fresh.status === "SUSPENDED") {
      return NextResponse.json<{ code: PrecheckCode }>({ code: "SUSPENDED" });
    }
    if (fresh.status === "EXPIRED") {
      return NextResponse.json<{ code: PrecheckCode }>({ code: "OK" });
    }
    if (
      fresh.role !== "ADMIN" &&
      fresh.activeUntil &&
      fresh.activeUntil.getTime() < Date.now()
    ) {
      // race: read 시점은 ACTIVE인데 activeUntil은 이미 과거. authorize가 자동 만료 + 부분 세션 발급한다.
      return NextResponse.json<{ code: PrecheckCode }>({ code: "OK" });
    }
    // race로 갱신된 ACTIVE 사용자 — OK로 통과
  }

  return NextResponse.json<{ code: PrecheckCode }>({ code: "OK" });
}
