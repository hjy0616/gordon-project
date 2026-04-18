import { NextResponse } from "next/server";

const EMPLOYMENT_SERIES = [
  { id: "UNRATE", name: "실업률(Unemployment Rate)" },
  { id: "PAYEMS", name: "비농업고용인구(Nonfarm Payrolls)" },
  { id: "CPIAUCSL", name: "소비자물가지수(CPI)" },
] as const;

export interface EmploymentIndicator {
  id: string;
  name: string;
  value: number | null;
  change: number | null;
  date: string | null;
}

interface FredApiResponse {
  observations?: Array<{ date: string; value: string }>;
}

function makeNull(id: string, name: string): EmploymentIndicator {
  return { id, name, value: null, change: null, date: null };
}

async function fetchSeries(
  id: string,
  name: string,
  apiKey: string,
): Promise<EmploymentIndicator> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return makeNull(id, name);

  const json: FredApiResponse = await res.json().catch(() => null);
  if (!json) return makeNull(id, name);

  const obs = json.observations ?? [];
  const latestRaw = obs[0]?.value;
  const prevRaw = obs[1]?.value;

  const latest = latestRaw && latestRaw !== "." ? Number(latestRaw) : null;
  const previous = prevRaw && prevRaw !== "." ? Number(prevRaw) : null;

  const change =
    latest !== null && previous !== null
      ? Number((latest - previous).toFixed(2))
      : null;

  return { id, name, value: latest, change, date: obs[0]?.date ?? null };
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    const data = EMPLOYMENT_SERIES.map((s) => makeNull(s.id, s.name));
    return NextResponse.json(
      { data, updatedAt: new Date().toISOString(), source: "error" as const },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } },
    );
  }

  const results = await Promise.allSettled(
    EMPLOYMENT_SERIES.map((s) => fetchSeries(s.id, s.name, apiKey)),
  );

  const data: EmploymentIndicator[] = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : makeNull(EMPLOYMENT_SERIES[i].id, EMPLOYMENT_SERIES[i].name),
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
