import { NextResponse } from "next/server";

const FRED_SERIES = [
  { id: "STLFSI2", name: "Stress Idx" },
  { id: "WM2NS", name: "M2 Supply" },
  { id: "WALCL", name: "Fed Balance" },
  { id: "WTREGEN", name: "TGA (Est)" },
  { id: "RRPONTSYD", name: "ON RRP" },
  { id: "RPONTSYD", name: "Repo Ops" },
  { id: "SOFR", name: "SOFR" },
  { id: "MMMFFAQ027S", name: "MMF Total" },
] as const;

export interface FredIndicator {
  id: string;
  name: string;
  value: number | null;
  change: number | null;
  date: string | null;
}

interface FredApiResponse {
  observations?: Array<{ date: string; value: string }>;
}

function makeNullIndicator(id: string, name: string): FredIndicator {
  return { id, name, value: null, change: null, date: null };
}

async function fetchSeries(
  id: string,
  name: string,
  apiKey: string,
): Promise<FredIndicator> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return makeNullIndicator(id, name);

  const json: FredApiResponse = await res.json().catch(() => null);
  if (!json) return makeNullIndicator(id, name);

  const obs = json.observations ?? [];
  const latestRaw = obs[0]?.value;
  const prevRaw = obs[1]?.value;

  // FRED returns "." for unavailable values
  const latest = latestRaw && latestRaw !== "." ? Number(latestRaw) : null;
  const previous = prevRaw && prevRaw !== "." ? Number(prevRaw) : null;

  const change =
    latest !== null && previous !== null
      ? Number((latest - previous).toFixed(2))
      : null;

  return {
    id,
    name,
    value: latest,
    change,
    date: obs[0]?.date ?? null,
  };
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    const data = FRED_SERIES.map((s) => makeNullIndicator(s.id, s.name));
    return NextResponse.json(
      { data, updatedAt: new Date().toISOString(), source: "error" as const },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } },
    );
  }

  const results = await Promise.allSettled(
    FRED_SERIES.map((s) => fetchSeries(s.id, s.name, apiKey)),
  );

  const data: FredIndicator[] = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : makeNullIndicator(FRED_SERIES[i].id, FRED_SERIES[i].name),
  );

  const hasAnyData = data.some((d) => d.value !== null);

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: hasAnyData ? "fred" : "error" },
    {
      headers: {
        "Cache-Control": hasAnyData
          ? "s-maxage=3600, stale-while-revalidate=300"
          : "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
