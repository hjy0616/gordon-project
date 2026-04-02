import { NextResponse } from "next/server";
import { fetchAllIndicators } from "@/lib/world-bank";
import { FALLBACK_COUNTRIES } from "@/data/static-fallback";
import type { CountryIndicators } from "@/types/macro-map";

export async function GET() {
  const apiData = await fetchAllIndicators();

  const merged: CountryIndicators[] = FALLBACK_COUNTRIES.map((fallback) => {
    const wb = apiData.get(fallback.iso_a3);
    if (!wb) return fallback;

    return {
      ...fallback,
      gdp_growth: wb.gdp_growth ?? fallback.gdp_growth,
      inflation: wb.inflation ?? fallback.inflation,
      unemployment: wb.unemployment ?? fallback.unemployment,
      gdp_nominal: wb.gdp_nominal ?? fallback.gdp_nominal,
      debt_to_gdp: wb.debt_to_gdp ?? fallback.debt_to_gdp,
      current_account: wb.current_account ?? fallback.current_account,
      // interest_rate는 World Bank에 없으므로 항상 fallback
    };
  });

  const hasApiData = apiData.size > 0;

  return NextResponse.json(
    {
      data: merged,
      updatedAt: new Date().toISOString(),
      source: hasApiData ? "worldbank" : "fallback",
    },
    {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    },
  );
}
