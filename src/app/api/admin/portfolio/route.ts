import { NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/auth-utils";
import { isPortfolioAllowed } from "@/lib/finance-portfolio-access";
import { prisma } from "@/lib/prisma";
import {
  PortfolioPutBody,
  unwrapPortfolio,
} from "@/lib/finance-portfolio-schema";

async function checkAccess() {
  const user = await requireActiveAdmin();
  if (!user) {
    return {
      blocked: NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      ),
    } as const;
  }
  if (!isPortfolioAllowed(user.id)) {
    return {
      blocked: NextResponse.json(
        { error: "not found" },
        { status: 404 },
      ),
    } as const;
  }
  return { user } as const;
}

export async function GET() {
  const access = await checkAccess();
  if ("blocked" in access) return access.blocked;

  const portfolio = await prisma.financePortfolio.findUnique({
    where: { userId: access.user.id },
  });

  const data = unwrapPortfolio(portfolio?.rows);

  return NextResponse.json({
    totalCapital: data.totalCapital,
    rows: data.rows,
    updatedAt: portfolio?.updatedAt?.toISOString() ?? null,
  });
}

export async function PUT(req: Request) {
  const access = await checkAccess();
  if ("blocked" in access) return access.blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid json" },
      { status: 400 },
    );
  }

  const parsed = PortfolioPutBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const portfolio = await prisma.financePortfolio.upsert({
    where: { userId: access.user.id },
    create: { userId: access.user.id, rows: parsed.data },
    update: { rows: parsed.data },
  });

  const data = unwrapPortfolio(portfolio.rows);

  return NextResponse.json({
    totalCapital: data.totalCapital,
    rows: data.rows,
    updatedAt: portfolio.updatedAt.toISOString(),
  });
}
