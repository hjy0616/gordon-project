import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, requireActiveAdmin } from "@/lib/auth-utils";
import { deleteFromS3 } from "@/lib/s3";
import type { Role, UserStatus } from "@/generated/prisma/enums";

type TxResult =
  | { type: "ok"; user: SelectedUser }
  | { type: "not_found" }
  | { type: "conflict"; current: UserStatus };

type SelectedUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  activeFrom: Date | null;
  activeUntil: Date | null;
};

const SELECT_USER = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  activeFrom: true,
  activeUntil: true,
} as const;

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

  const data: Record<string, unknown> = {};
  if (role) data.role = role;
  if (status) data.status = status;
  if (activeFrom !== undefined) data.activeFrom = activeFrom ? new Date(activeFrom) : null;
  if (activeUntil !== undefined) data.activeUntil = activeUntil ? new Date(activeUntil) : null;

  const result: TxResult = await prisma.$transaction(async (tx) => {
    // 1) 트랜잭션 안에서 현재 status 재조회 (다른 관리자의 직전 변경 반영)
    const current = await tx.user.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) {
      return { type: "not_found" };
    }

    const wantsStatusChange = !!status && status !== current.status;

    if (wantsStatusChange) {
      // 2) 조건부 update — 다른 트랜잭션이 사이에 status를 바꿨다면 count=0
      const updateRes = await tx.user.updateMany({
        where: { id, status: current.status },
        data,
      });
      if (updateRes.count !== 1) {
        return { type: "conflict", current: current.status };
      }
      // 3) 우리가 race를 이긴 경우만 정확한 fromStatus로 log
      await tx.userStatusLog.create({
        data: {
          userId: id,
          fromStatus: current.status,
          toStatus: status,
          reason: `admin:${admin.id}`,
        },
      });
    } else {
      // status 변경 없음 → 일반 update
      await tx.user.update({ where: { id }, data });
    }

    const fresh = await tx.user.findUnique({
      where: { id },
      select: SELECT_USER,
    });
    if (!fresh) return { type: "not_found" };
    return { type: "ok", user: fresh };
  });

  if (result.type === "not_found") {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  if (result.type === "conflict") {
    return NextResponse.json(
      {
        error:
          "다른 관리자가 이 사용자의 상태를 방금 변경했습니다. 새로고침 후 다시 시도해주세요.",
        currentStatus: result.current,
      },
      { status: 409 },
    );
  }
  return NextResponse.json(result.user);
}

type DeleteResult =
  | {
      type: "ok";
      user: {
        id: string;
        email: string;
        image: string | null;
        verificationImage: string | null;
        renewalImage: string | null;
      };
    }
  | { type: "not_found" }
  | { type: "forbidden_admin" };

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // hard delete는 되돌릴 수 없으므로 fresh-DB 가드(requireActiveAdmin)로 stale JWT를 차단한다.
  const admin = await requireActiveAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "자기 자신을 삭제할 수 없습니다." },
      { status: 403 }
    );
  }

  const result: DeleteResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
        image: true,
        verificationImage: true,
        renewalImage: true,
      },
    });
    if (!user) return { type: "not_found" };
    if (user.role === "ADMIN") return { type: "forbidden_admin" };

    await tx.user.delete({ where: { id } });
    return {
      type: "ok",
      user: {
        id: user.id,
        email: user.email,
        image: user.image,
        verificationImage: user.verificationImage,
        renewalImage: user.renewalImage,
      },
    };
  });

  if (result.type === "not_found") {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (result.type === "forbidden_admin") {
    return NextResponse.json(
      { error: "관리자 계정은 일반 사용자로 변경한 뒤 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  // S3 cleanup — best-effort, tx 밖. 실패한 키는 명시 console.error로 운영자에게 노출.
  const keys = [
    result.user.image,
    result.user.verificationImage,
    result.user.renewalImage,
  ].filter((k): k is string => Boolean(k));

  if (keys.length > 0) {
    const settled = await Promise.allSettled(keys.map((k) => deleteFromS3(k)));
    settled.forEach((s, i) => {
      if (s.status === "rejected") {
        console.error(
          `[admin-delete-user] S3 cleanup failed userId=${result.user.id} key=${keys[i]}`,
          s.reason
        );
      }
    });
  }

  console.log(
    `[admin-delete-user] ok adminId=${admin.id} targetId=${result.user.id} email=${result.user.email}`
  );

  return NextResponse.json({ ok: true, deletedId: result.user.id });
}
