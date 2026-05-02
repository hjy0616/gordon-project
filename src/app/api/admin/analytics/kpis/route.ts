import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth-utils";
import {
  ensureAndRefreshAutoKpis,
  isAutoKpiKeyPrefix,
} from "@/lib/auto-kpis";

export const runtime = "nodejs";

const KPI_PREFIX = "kpi:";

const ALLOWED_UNITS = new Set(["percent", "count", "minute"]);
const ALLOWED_PERIODS = new Set(["daily", "weekly", "monthly"]);

type KpiBody = {
  key?: string;
  name?: string;
  description?: string | null;
  target?: number | null;
  unit?: string;
  period?: string;
  currentValue?: number | null;
};

function shapeKpiRow(row: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  target: number | null;
  unit: string;
  period: string;
  currentValue: number | null;
  lastComputedAt: Date | null;
}) {
  return {
    id: row.id,
    key: row.key.startsWith(KPI_PREFIX) ? row.key.slice(KPI_PREFIX.length) : row.key,
    name: row.name,
    description: row.description,
    target: row.target,
    unit: row.unit,
    period: row.period,
    currentValue: row.currentValue,
    lastComputedAt: row.lastComputedAt?.toISOString() ?? null,
    isAuto: isAutoKpiKeyPrefix(row.key),
  };
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensureAndRefreshAutoKpis();
  } catch (e) {
    console.error("ensureAndRefreshAutoKpis failed", e);
  }

  const rows = await prisma.kpi.findMany({
    where: { key: { startsWith: KPI_PREFIX } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      target: true,
      unit: true,
      period: true,
      currentValue: true,
      lastComputedAt: true,
    },
  });

  return NextResponse.json({ kpis: rows.map(shapeKpiRow) });
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as KpiBody | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const rawKey = typeof body.key === "string" ? body.key.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!rawKey || !/^[a-z0-9_]{2,40}$/.test(rawKey)) {
    return NextResponse.json(
      { error: "key는 a-z 0-9 _ 만 가능, 2-40자" },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "name 필수" }, { status: 400 });
  }
  const unit = ALLOWED_UNITS.has(body.unit ?? "") ? (body.unit as string) : "percent";
  const period = ALLOWED_PERIODS.has(body.period ?? "") ? (body.period as string) : "monthly";

  const created = await prisma.kpi.create({
    data: {
      key: `${KPI_PREFIX}${rawKey}`,
      name: name.slice(0, 100),
      description:
        typeof body.description === "string" ? body.description.slice(0, 500) : null,
      target: typeof body.target === "number" ? body.target : null,
      unit,
      period,
      currentValue: typeof body.currentValue === "number" ? body.currentValue : null,
      lastComputedAt: typeof body.currentValue === "number" ? new Date() : null,
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      target: true,
      unit: true,
      period: true,
      currentValue: true,
      lastComputedAt: true,
    },
  });

  return NextResponse.json(shapeKpiRow(created), { status: 201 });
}

export async function PUT(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | (KpiBody & { id?: string })
    | null;
  if (!body?.id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const existing = await prisma.kpi.findUnique({
    where: { id: body.id },
    select: { id: true, key: true },
  });
  if (!existing || !existing.key.startsWith(KPI_PREFIX)) {
    return NextResponse.json({ error: "KPI를 찾을 수 없습니다" }, { status: 404 });
  }

  const isAuto = isAutoKpiKeyPrefix(existing.key);

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim().slice(0, 100);
  if (body.description !== undefined)
    data.description =
      typeof body.description === "string" ? body.description.slice(0, 500) : null;
  if (body.target !== undefined)
    data.target = typeof body.target === "number" ? body.target : null;

  if (!isAuto) {
    if (body.unit && ALLOWED_UNITS.has(body.unit)) data.unit = body.unit;
    if (body.period && ALLOWED_PERIODS.has(body.period)) data.period = body.period;
    if (body.currentValue !== undefined) {
      data.currentValue =
        typeof body.currentValue === "number" ? body.currentValue : null;
      data.lastComputedAt =
        typeof body.currentValue === "number" ? new Date() : null;
    }
  }

  const updated = await prisma.kpi.update({
    where: { id: body.id },
    data,
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      target: true,
      unit: true,
      period: true,
      currentValue: true,
      lastComputedAt: true,
    },
  });

  return NextResponse.json(shapeKpiRow(updated));
}

export async function DELETE(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const existing = await prisma.kpi.findUnique({
    where: { id },
    select: { key: true },
  });
  if (!existing || !existing.key.startsWith(KPI_PREFIX)) {
    return NextResponse.json({ error: "KPI를 찾을 수 없습니다" }, { status: 404 });
  }
  if (isAutoKpiKeyPrefix(existing.key)) {
    return NextResponse.json(
      { error: "자동 KPI는 삭제할 수 없습니다" },
      { status: 400 },
    );
  }

  await prisma.kpi.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
