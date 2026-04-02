import { NextResponse } from "next/server";
import { fetchAllDetails } from "@/lib/world-bank";
import { DEFAULT_COUNTRY_DETAILS } from "@/data/mock-country-details";
import type { CountryEditableData } from "@/types/macro-map";

type MockCountryData = Omit<CountryEditableData, "core_capabilities">;

export async function GET() {
  const apiData = await fetchAllDetails();

  const merged: Record<string, MockCountryData> = {};

  for (const [iso, fallback] of Object.entries(DEFAULT_COUNTRY_DETAILS)) {
    const wb = apiData.get(iso);

    merged[iso] = {
      ...fallback,
      population: wb?.population ?? fallback.population,
      gdp: wb?.gdp ?? fallback.gdp,
      gni: wb?.gni ?? fallback.gni,
      gni_per_capita: wb?.gni_per_capita ?? fallback.gni_per_capita,
    };
  }

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
