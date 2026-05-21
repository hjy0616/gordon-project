import { NextResponse } from "next/server";

const FRED_SERIES = [
  { id: "STLFSI4", name: "Stress Idx" },
  { id: "WM2NS", name: "M2 Supply" },
  { id: "WALCL", name: "Fed Balance" },
  { id: "WTREGEN", name: "TGA (Est)" },
  { id: "RRPONTSYD", name: "ON RRP" },
  { id: "RPONTSYD", name: "Repo Ops" },
  { id: "SOFR", name: "SOFR" },
  { id: "MMMFFAQ027S", name: "MMF Total" },
  { id: "IORB", name: "지급준비금금리(IoRB)" },
  { id: "DGS1MO", name: "미국국채 1개월" },
  { id: "DGS3MO", name: "미국국채 3개월" },
  { id: "RRPONTSYAWARD", name: "RRP 금리" },
  { id: "BAMLH0A0HYM2", name: "High Yield Spread" },
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

async function fetchSeriesOnce(
  id: string,
  apiKey: string,
): Promise<FredApiResponse | null | "retry"> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res) return "retry";
  // FRED returns 5xx under load — retry. 4xx is usually a bad series id, don't retry.
  if (res.status >= 500) return "retry";
  if (!res.ok) return null;

  const json: FredApiResponse | null = await res.json().catch(() => null);
  return json;
}

async function fetchSeries(
  id: string,
  name: string,
  apiKey: string,
): Promise<FredIndicator> {
  let json: FredApiResponse | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await fetchSeriesOnce(id, apiKey);
    if (result !== "retry") {
      json = result;
      break;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
  }

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

  // Limit concurrency to avoid FRED 5xx under load.
  const CONCURRENCY = 4;
  const data: FredIndicator[] = new Array(FRED_SERIES.length);
  for (let i = 0; i < FRED_SERIES.length; i += CONCURRENCY) {
    const chunk = FRED_SERIES.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((s) => fetchSeries(s.id, s.name, apiKey)),
    );
    settled.forEach((r, j) => {
      const idx = i + j;
      data[idx] =
        r.status === "fulfilled"
          ? r.value
          : makeNullIndicator(FRED_SERIES[idx].id, FRED_SERIES[idx].name);
    });
  }

  const hasAnyData = data.some((d) => d.value !== null);
  const hasAllData = data.every((d) => d.value !== null);

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: hasAnyData ? "fred" : "error" },
    {
      headers: {
        // Only long-cache a fully-successful response. Partial failures get a short cache
        // so transient FRED 5xx errors don't stick on screen for an hour.
        "Cache-Control": hasAllData
          ? "s-maxage=3600, stale-while-revalidate=300"
          : "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
