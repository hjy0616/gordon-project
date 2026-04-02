import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const edits = await prisma.countryEdit.findMany({
    where: { userId: user.id },
  });

  const result: Record<string, unknown> = {};
  for (const e of edits) {
    result[e.isoA3] = {
      population: e.population,
      gdp: e.gdp,
      gni: e.gni,
      gni_per_capita: e.gniPerCapita,
      national_debt: e.nationalDebt,
      key_industries: e.keyIndustries,
      tech_capability: e.techCapability,
      military_rank: e.militaryRank,
      core_capabilities: e.coreCapabilities,
    };
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isoA3, ...fields } = await req.json();

  if (!isoA3) {
    return NextResponse.json({ error: "isoA3 is required" }, { status: 400 });
  }

  const mapped = {
    population: fields.population ?? null,
    gdp: fields.gdp ?? null,
    gni: fields.gni ?? null,
    gniPerCapita: fields.gni_per_capita ?? null,
    nationalDebt: fields.national_debt ?? null,
    keyIndustries: fields.key_industries ?? [],
    techCapability: fields.tech_capability ?? null,
    militaryRank: fields.military_rank ?? null,
    coreCapabilities: fields.core_capabilities ?? null,
  };

  const data = await prisma.countryEdit.upsert({
    where: { userId_isoA3: { userId: user.id, isoA3 } },
    update: mapped,
    create: { userId: user.id, isoA3, ...mapped },
  });

  return NextResponse.json(data);
}
