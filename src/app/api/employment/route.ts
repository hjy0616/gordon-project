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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// FRED 429-throttles bursts (same failure mode as /api/fred), so fetch sequentially with
// spacing and retry 429/5xx. See feedback memory "FRED rate-limit 429 — 순차+간격, 동시성 금지".
const REQUEST_SPACING_MS = 300;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 300;
const MAX_RETRY_AFTER_MS = 1500;

function makeNull(id: string, name: string): EmploymentIndicator {
  return { id, name, value: null, change: null, date: null };
}

type OnceResult =
  | { kind: "ok"; json: FredApiResponse | null }
  | { kind: "retry"; retryAfterMs: number | null }
  | { kind: "fail" };

async function fetchSeriesOnce(id: string, apiKey: string): Promise<OnceResult> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res) return { kind: "retry", retryAfterMs: null }; // network blip — transient
  // 429 (rate limit) + 5xx (overload) are transient → retry. Other non-ok → fail fast.
  if (res.status === 429 || res.status >= 500) {
    const header = res.headers.get("retry-after");
    const parsed = header ? Number(header) : NaN;
    const retryAfterMs =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(parsed * 1000, MAX_RETRY_AFTER_MS)
        : null;
    return { kind: "retry", retryAfterMs };
  }
  if (!res.ok) return { kind: "fail" };

  const json: FredApiResponse | null = await res.json().catch(() => null);
  return { kind: "ok", json };
}

async function fetchSeries(
  id: string,
  name: string,
  apiKey: string,
): Promise<EmploymentIndicator> {
  let json: FredApiResponse | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await fetchSeriesOnce(id, apiKey);
    if (result.kind === "ok") {
      json = result.json;
      break;
    }
    if (result.kind === "fail") return makeNull(id, name);
    if (attempt >= MAX_ATTEMPTS - 1) return makeNull(id, name);
    const backoff = result.retryAfterMs ?? BASE_BACKOFF_MS * (attempt + 1);
    // Jitter de-synchronizes retries across concurrent invocations.
    await delay(backoff + Math.floor(Math.random() * 150));
  }
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

  // Sequential with spacing — FRED throttles bursts (429), so do NOT fire concurrently.
  const data: EmploymentIndicator[] = [];
  for (let i = 0; i < EMPLOYMENT_SERIES.length; i++) {
    const s = EMPLOYMENT_SERIES[i];
    const indicator = await fetchSeries(s.id, s.name, apiKey).catch(() =>
      makeNull(s.id, s.name),
    );
    data.push(indicator);
    if (i < EMPLOYMENT_SERIES.length - 1) await delay(REQUEST_SPACING_MS);
  }

  const hasAnyData = data.some((d) => d.value !== null);
  const hasAllData = data.every((d) => d.value !== null);

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: hasAnyData ? "fred" : "error" },
    {
      headers: {
        // Long-cache only a fully-successful response so a transient 429 doesn't stick 1h.
        "Cache-Control": hasAllData
          ? "s-maxage=3600, stale-while-revalidate=300"
          : "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
