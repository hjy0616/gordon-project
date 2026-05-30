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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// FRED 429-throttles bursts: even 4 concurrent requests get rate-limited (most return
// "Too Many Requests"), so we fetch sequentially with spacing instead of in parallel.
// Spacing sits above the empirically-measured ~250ms threshold for headroom. The 429/5xx
// retry is the load-bearing defense — many dashboard loads share ONE FRED key, so bursts
// also collide ACROSS serverless invocations, which in-invocation spacing can't prevent.
const REQUEST_SPACING_MS = 300;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 300;
// Never honor a huge Retry-After — a 60s value would blow the function time budget.
const MAX_RETRY_AFTER_MS = 1500;
// Soft cap: stop spending time on retries/spacing and return what we have (with cache
// headers) before the platform kills the function. Happy path (~6s) never reaches this.
const DEADLINE_MS = 8000;

function makeNullIndicator(id: string, name: string): FredIndicator {
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

  // 429 (rate limit) and 5xx (overload) are transient → retry with backoff.
  // Other non-ok responses (e.g. 400 bad series, 403 bad key) won't recover on retry,
  // so fail fast instead of burning the time budget.
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
  allowRetry: boolean,
): Promise<FredIndicator> {
  const maxAttempts = allowRetry ? MAX_ATTEMPTS : 1;
  let json: FredApiResponse | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fetchSeriesOnce(id, apiKey);
    if (result.kind === "ok") {
      json = result.json;
      break;
    }
    if (result.kind === "fail") return makeNullIndicator(id, name);

    // transient (429/5xx/network) → back off and retry unless this was the last attempt.
    if (attempt >= maxAttempts - 1) return makeNullIndicator(id, name);
    const backoff = result.retryAfterMs ?? BASE_BACKOFF_MS * (attempt + 1);
    // Jitter de-synchronizes retries across concurrent invocations (avoids a thundering herd
    // all retrying in lockstep and re-triggering the same 429).
    await delay(backoff + Math.floor(Math.random() * 150));
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

  // Sequential with spacing — FRED throttles bursts (429), so we must NOT fire concurrently.
  const startedAt = Date.now();
  const data: FredIndicator[] = [];
  for (let i = 0; i < FRED_SERIES.length; i++) {
    const s = FRED_SERIES[i];
    const overBudget = Date.now() - startedAt > DEADLINE_MS;
    const indicator = await fetchSeries(s.id, s.name, apiKey, !overBudget).catch(() =>
      makeNullIndicator(s.id, s.name),
    );
    data.push(indicator);
    if (i < FRED_SERIES.length - 1 && !overBudget) await delay(REQUEST_SPACING_MS);
  }

  const hasAnyData = data.some((d) => d.value !== null);
  const hasAllData = data.every((d) => d.value !== null);

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: hasAnyData ? "fred" : "error" },
    {
      headers: {
        // Only long-cache a fully-successful response. Partial failures get a short cache
        // so transient FRED 429/5xx errors don't stick on screen for an hour.
        "Cache-Control": hasAllData
          ? "s-maxage=3600, stale-while-revalidate=300"
          : "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
