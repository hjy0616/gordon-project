import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCachedJson } from "@/lib/analytics-cache";

export type DashboardHistoryRange = "1m" | "3m" | "6m" | "1y";
export type DashboardHistorySource = "yahoo" | "fred" | "fear-greed" | "derived";
export type DashboardHistoryUnit =
  | "percent"
  | "index"
  | "number"
  | "rating"
  | "bps";

export interface DashboardHistoryPoint {
  t: number; // ms epoch, asc
  v: number;
}

export interface DashboardHistorySeries {
  id: string;
  name: string;
  source: DashboardHistorySource;
  unit: DashboardHistoryUnit;
  points: DashboardHistoryPoint[];
  latest: {
    value: number | null;
    change: number | null;
    changeRate: number | null;
  };
}

export interface DashboardHistoryResponse {
  range: DashboardHistoryRange;
  updatedAt: string;
  source: "ok" | "partial" | "error";
  series: DashboardHistorySeries[];
}

const RANGE_DAYS: Record<DashboardHistoryRange, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

interface YahooSpec {
  id: string;
  name: string;
  symbol: string;
  unit: DashboardHistoryUnit;
}

interface FredSpec {
  id: string;
  name: string;
  unit: DashboardHistoryUnit;
}

const YAHOO_SPECS: YahooSpec[] = [
  { id: "^VIX", name: "VIX", symbol: "^VIX", unit: "index" },
  { id: "DX-Y.NYB", name: "DXY (ICE)", symbol: "DX-Y.NYB", unit: "index" },
  { id: "2YY=F", name: "US 2Y", symbol: "2YY=F", unit: "percent" },
  { id: "^TNX", name: "US 10Y", symbol: "^TNX", unit: "percent" },
  { id: "^TYX", name: "US 30Y", symbol: "^TYX", unit: "percent" },
];

const FRED_SPECS: FredSpec[] = [
  { id: "STLFSI4", name: "Stress Idx", unit: "index" },
  { id: "WM2NS", name: "M2 Supply", unit: "number" },
  { id: "WALCL", name: "Fed Balance", unit: "number" },
  { id: "WTREGEN", name: "TGA (Est)", unit: "number" },
  { id: "RRPONTSYD", name: "ON RRP", unit: "number" },
  { id: "RPONTSYD", name: "Repo Ops", unit: "number" },
  { id: "SOFR", name: "SOFR", unit: "percent" },
  { id: "MMMFFAQ027S", name: "MMF Total", unit: "number" },
  { id: "IORB", name: "IORB", unit: "percent" },
  { id: "DGS1MO", name: "미국국채 1개월", unit: "percent" },
  { id: "DGS3MO", name: "미국국채 3개월", unit: "percent" },
  { id: "RRPONTSYAWARD", name: "RRP 금리", unit: "percent" },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// FRED 429-throttles bursts: even 4 concurrent requests get rate-limited (same failure mode
// as the /api/fred snapshot route). So FRED history is fetched sequentially with spacing and
// 429/5xx retries. Spacing has headroom over the measured ~250ms threshold; the retry is the
// load-bearing defense against bursts that collide ACROSS serverless invocations sharing one key.
const FRED_REQUEST_SPACING_MS = 300;
const FRED_MAX_ATTEMPTS = 3;
const FRED_BASE_BACKOFF_MS = 300;
// Never honor a huge Retry-After — a 60s value would blow the function time budget.
const FRED_MAX_RETRY_AFTER_MS = 1500;
// Soft cap on the FRED block so retries/spacing can't push it past the platform timeout.
const FRED_DEADLINE_MS = 8000;

function emptySeries(
  spec: { id: string; name: string; unit: DashboardHistoryUnit },
  source: DashboardHistorySource,
): DashboardHistorySeries {
  return {
    id: spec.id,
    name: spec.name,
    source,
    unit: spec.unit,
    points: [],
    latest: { value: null, change: null, changeRate: null },
  };
}

function computeLatest(
  points: DashboardHistoryPoint[],
): DashboardHistorySeries["latest"] {
  if (points.length === 0)
    return { value: null, change: null, changeRate: null };
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const change = prev ? Number((last.v - prev.v).toFixed(4)) : null;
  const changeRate =
    prev && prev.v !== 0
      ? Number((((last.v - prev.v) / prev.v) * 100).toFixed(2))
      : null;
  return { value: last.v, change, changeRate };
}

function filterByRange(
  points: DashboardHistoryPoint[],
  days: number,
): DashboardHistoryPoint[] {
  if (points.length === 0) return points;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return points.filter((p) => p.t >= cutoff);
}

/** 정렬된 series 두 개 이상을 날짜 단위로 align + forward-fill 후 reducer 적용. */
function alignAndCombine(
  inputs: DashboardHistoryPoint[][],
  combine: (vals: number[]) => number | null,
): DashboardHistoryPoint[] {
  const dateSet = new Set<number>();
  for (const ps of inputs) for (const p of ps) dateSet.add(p.t);
  const dates = Array.from(dateSet).sort((a, b) => a - b);

  const cursors = inputs.map(() => 0);
  const lastVals: Array<number | null> = inputs.map(() => null);
  const out: DashboardHistoryPoint[] = [];

  for (const t of dates) {
    for (let i = 0; i < inputs.length; i++) {
      const ps = inputs[i];
      while (cursors[i] < ps.length && ps[cursors[i]].t <= t) {
        lastVals[i] = ps[cursors[i]].v;
        cursors[i] += 1;
      }
    }
    if (lastVals.some((v) => v === null)) continue; // prior 없으면 drop
    const v = combine(lastVals as number[]);
    if (v === null || !Number.isFinite(v)) continue;
    out.push({ t, v });
  }

  return out;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: { regularMarketPrice: number };
      timestamp: number[];
      indicators: { quote: Array<{ close: (number | null)[] }> };
    }> | null;
  };
}

function rangeToYahoo(range: DashboardHistoryRange): {
  range: string;
  interval: string;
} {
  switch (range) {
    case "1m":
      return { range: "1mo", interval: "1d" };
    case "3m":
      return { range: "3mo", interval: "1d" };
    case "6m":
      return { range: "6mo", interval: "1d" };
    case "1y":
      return { range: "1y", interval: "1d" };
  }
}

async function fetchYahoo(
  spec: YahooSpec,
  range: DashboardHistoryRange,
): Promise<DashboardHistorySeries> {
  const { range: r, interval } = rangeToYahoo(range);
  const encoded = encodeURIComponent(spec.symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=${interval}&range=${r}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return emptySeries(spec, "yahoo");

  const json: YahooChartResponse | null = await res.json().catch(() => null);
  const result = json?.chart?.result?.[0];
  if (!result) return emptySeries(spec, "yahoo");

  const ts = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: DashboardHistoryPoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const v = closes[i];
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    points.push({ t: ts[i] * 1000, v });
  }

  return {
    id: spec.id,
    name: spec.name,
    source: "yahoo",
    unit: spec.unit,
    points,
    latest: computeLatest(points),
  };
}

interface FredObservation {
  date: string;
  value: string;
}
interface FredObservationsResponse {
  observations?: FredObservation[];
}

// 모든 FRED series에 대해 최소 2년 lookback을 보장. 분기/월 단위 series(MMF Total 등)도
// 짧은 range(1m/3m)에서 sparkline에 점이 충분히 나오도록 client cutoff은 별도로 적용한다.
const FRED_LOOKBACK_DAYS_FLOOR = 730;

type FredOnceResult =
  | { kind: "ok"; json: FredObservationsResponse | null }
  | { kind: "retry"; retryAfterMs: number | null }
  | { kind: "fail" };

async function fetchFredOnce(
  id: string,
  apiKey: string,
  range: DashboardHistoryRange,
): Promise<FredOnceResult> {
  const lookbackDays = Math.max(RANGE_DAYS[range], FRED_LOOKBACK_DAYS_FLOOR);
  const startDate = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${id}&api_key=${apiKey}&file_type=json` +
    `&observation_start=${startDate}&sort_order=asc`;

  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res) return { kind: "retry", retryAfterMs: null }; // network blip — transient
  // 429 (rate limit) + 5xx (overload) are transient → retry with backoff.
  // Other non-ok (e.g. 400 bad series, 403 bad key) won't recover → fail fast.
  if (res.status === 429 || res.status >= 500) {
    const header = res.headers.get("retry-after");
    const parsed = header ? Number(header) : NaN;
    const retryAfterMs =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(parsed * 1000, FRED_MAX_RETRY_AFTER_MS)
        : null;
    return { kind: "retry", retryAfterMs };
  }
  if (!res.ok) return { kind: "fail" };

  const json: FredObservationsResponse | null = await res
    .json()
    .catch(() => null);
  return { kind: "ok", json };
}

async function fetchFred(
  spec: FredSpec,
  apiKey: string,
  range: DashboardHistoryRange,
  allowRetry: boolean,
): Promise<DashboardHistorySeries> {
  const maxAttempts = allowRetry ? FRED_MAX_ATTEMPTS : 1;
  let json: FredObservationsResponse | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fetchFredOnce(spec.id, apiKey, range);
    if (result.kind === "ok") {
      json = result.json;
      break;
    }
    if (result.kind === "fail") return emptySeries(spec, "fred");
    if (attempt >= maxAttempts - 1) return emptySeries(spec, "fred");
    const backoff = result.retryAfterMs ?? FRED_BASE_BACKOFF_MS * (attempt + 1);
    // Jitter de-synchronizes retries across concurrent invocations (avoids a thundering herd).
    await delay(backoff + Math.floor(Math.random() * 150));
  }
  if (!json) return emptySeries(spec, "fred");

  const obs = json.observations ?? [];
  const rawPoints: DashboardHistoryPoint[] = [];
  for (const o of obs) {
    if (!o.value || o.value === ".") continue;
    const v = Number(o.value);
    if (!Number.isFinite(v)) continue;
    rawPoints.push({ t: Date.parse(o.date), v });
  }
  rawPoints.sort((a, b) => a.t - b.t);

  // range cutoff을 적용하되, cutoff 이후 점이 0개인 저빈도 series(분기/연간 등)는
  // lookback 데이터를 그대로 둬서 sparkline이 "데이터 없음"이 되지 않게 한다.
  const filtered = filterByRange(rawPoints, RANGE_DAYS[range]);
  const points = filtered.length > 0 ? filtered : rawPoints;

  return {
    id: spec.id,
    name: spec.name,
    source: "fred",
    unit: spec.unit,
    points,
    latest: computeLatest(points),
  };
}

async function fetchFearGreedHistory(
  range: DashboardHistoryRange,
): Promise<DashboardHistorySeries> {
  const url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Referer: "https://edition.cnn.com/markets/fear-and-greed",
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);

  const spec = {
    id: "fear-greed",
    name: "Fear & Greed",
    unit: "rating" as const,
  };
  if (!res || !res.ok) return emptySeries(spec, "fear-greed");

  const json = (await res.json().catch(() => null)) as
    | { fear_and_greed_historical?: { data?: Array<{ x: number; y: number }> } }
    | null;
  const data = json?.fear_and_greed_historical?.data ?? [];

  const points: DashboardHistoryPoint[] = data
    .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y))
    .map((d) => ({ t: d.x, v: d.y }))
    .sort((a, b) => a.t - b.t);

  const filtered = filterByRange(points, RANGE_DAYS[range]);

  return {
    id: spec.id,
    name: spec.name,
    source: "fear-greed",
    unit: spec.unit,
    points: filtered,
    latest: computeLatest(filtered),
  };
}

function deriveNetLiquidity(
  fedBalance: DashboardHistorySeries,
  tga: DashboardHistorySeries,
  onRrp: DashboardHistorySeries,
): DashboardHistorySeries {
  // ON RRP is in billions; convert to millions to match WALCL/WTREGEN
  const rrpScaled = onRrp.points.map((p) => ({ t: p.t, v: p.v * 1000 }));
  const points = alignAndCombine(
    [fedBalance.points, tga.points, rrpScaled],
    ([fb, tg, rrp]) => fb - tg - rrp,
  );
  return {
    id: "net-liquidity",
    name: "Net Liquidity",
    source: "derived",
    unit: "number",
    points,
    latest: computeLatest(points),
  };
}

function deriveSofrIorbSpread(
  sofr: DashboardHistorySeries,
  iorb: DashboardHistorySeries,
): DashboardHistorySeries {
  const points = alignAndCombine([sofr.points, iorb.points], ([s, i]) =>
    Number(((s - i) * 100).toFixed(2)),
  );
  return {
    id: "sofr-iorb-spread",
    name: "SOFR-IORB Spread",
    source: "derived",
    unit: "bps",
    points,
    latest: computeLatest(points),
  };
}

function parseRange(input: string | null): DashboardHistoryRange | null {
  if (input === "1m" || input === "3m" || input === "6m" || input === "1y")
    return input;
  return null;
}

// Yahoo — sequential + 1.5s delay (rate-limit memory). Each fetch .catch-es so the block never rejects.
async function fetchYahooHistoryBlock(
  range: DashboardHistoryRange,
): Promise<DashboardHistorySeries[]> {
  const yahoo: DashboardHistorySeries[] = [];
  for (let i = 0; i < YAHOO_SPECS.length; i++) {
    const s = await fetchYahoo(YAHOO_SPECS[i], range).catch(() =>
      emptySeries(YAHOO_SPECS[i], "yahoo"),
    );
    yahoo.push(s);
    if (i < YAHOO_SPECS.length - 1) await delay(1500);
  }
  return yahoo;
}

// FRED — sequential + spacing + 429/5xx retry (FRED throttles bursts). Soft deadline bounds total time.
async function fetchFredHistoryBlock(
  range: DashboardHistoryRange,
  apiKey: string | undefined,
): Promise<DashboardHistorySeries[]> {
  if (!apiKey) return FRED_SPECS.map((s) => emptySeries(s, "fred"));
  const startedAt = Date.now();
  const fred: DashboardHistorySeries[] = [];
  for (let i = 0; i < FRED_SPECS.length; i++) {
    const s = FRED_SPECS[i];
    const overBudget = Date.now() - startedAt > FRED_DEADLINE_MS;
    const series = await fetchFred(s, apiKey, range, !overBudget).catch(() =>
      emptySeries(s, "fred"),
    );
    fred.push(series);
    if (i < FRED_SPECS.length - 1 && !overBudget) {
      await delay(FRED_REQUEST_SPACING_MS);
    }
  }
  return fred;
}

async function computeAll(
  range: DashboardHistoryRange,
): Promise<DashboardHistoryResponse> {
  // Three independent upstreams (Yahoo / FRED / CNN) — no shared rate limit, so fetch the
  // blocks concurrently. Each block is internally sequenced to respect its own host's limits.
  // (Previously additive: Yahoo ~7s THEN FRED — which only fit the budget because FRED 429s
  //  failed instantly. Now that FRED actually succeeds, parallel keeps wall-time ≈ max ≈ 7s.)
  const apiKey = process.env.FRED_API_KEY;
  const [yahoo, fred, fg] = await Promise.all([
    fetchYahooHistoryBlock(range),
    fetchFredHistoryBlock(range, apiKey),
    fetchFearGreedHistory(range).catch(() =>
      emptySeries(
        { id: "fear-greed", name: "Fear & Greed", unit: "rating" },
        "fear-greed",
      ),
    ),
  ]);

  // Derived
  const fedBalance = fred.find((s) => s.id === "WALCL");
  const tga = fred.find((s) => s.id === "WTREGEN");
  const onRrp = fred.find((s) => s.id === "RRPONTSYD");
  const sofr = fred.find((s) => s.id === "SOFR");
  const iorb = fred.find((s) => s.id === "IORB");

  const emptyDerivedNL: DashboardHistorySeries = emptySeries(
    { id: "net-liquidity", name: "Net Liquidity", unit: "number" },
    "derived",
  );
  const emptyDerivedSpread: DashboardHistorySeries = emptySeries(
    { id: "sofr-iorb-spread", name: "SOFR-IORB Spread", unit: "bps" },
    "derived",
  );

  const netLiq =
    fedBalance && tga && onRrp
      ? deriveNetLiquidity(fedBalance, tga, onRrp)
      : emptyDerivedNL;
  const spread =
    sofr && iorb ? deriveSofrIorbSpread(sofr, iorb) : emptyDerivedSpread;

  // Compose in card order (좌측 column → 우측 column)
  const ordered: DashboardHistorySeries[] = [
    fg,
    yahoo.find((s) => s.id === "^VIX") ?? emptySeries(YAHOO_SPECS[0], "yahoo"),
    yahoo.find((s) => s.id === "DX-Y.NYB") ??
      emptySeries(YAHOO_SPECS[1], "yahoo"),
    yahoo.find((s) => s.id === "2YY=F") ??
      emptySeries(YAHOO_SPECS[2], "yahoo"),
    yahoo.find((s) => s.id === "^TNX") ?? emptySeries(YAHOO_SPECS[3], "yahoo"),
    yahoo.find((s) => s.id === "^TYX") ?? emptySeries(YAHOO_SPECS[4], "yahoo"),
    fred.find((s) => s.id === "STLFSI4") ?? emptySeries(FRED_SPECS[0], "fred"),
    fred.find((s) => s.id === "WM2NS") ?? emptySeries(FRED_SPECS[1], "fred"),
    fred.find((s) => s.id === "WALCL") ?? emptySeries(FRED_SPECS[2], "fred"),
    fred.find((s) => s.id === "WTREGEN") ?? emptySeries(FRED_SPECS[3], "fred"),
    fred.find((s) => s.id === "RRPONTSYD") ??
      emptySeries(FRED_SPECS[4], "fred"),
    fred.find((s) => s.id === "RPONTSYD") ?? emptySeries(FRED_SPECS[5], "fred"),
    netLiq,
    fred.find((s) => s.id === "SOFR") ?? emptySeries(FRED_SPECS[6], "fred"),
    fred.find((s) => s.id === "IORB") ?? emptySeries(FRED_SPECS[8], "fred"),
    spread,
    fred.find((s) => s.id === "MMMFFAQ027S") ??
      emptySeries(FRED_SPECS[7], "fred"),
    fred.find((s) => s.id === "DGS1MO") ?? emptySeries(FRED_SPECS[9], "fred"),
    fred.find((s) => s.id === "DGS3MO") ?? emptySeries(FRED_SPECS[10], "fred"),
    fred.find((s) => s.id === "RRPONTSYAWARD") ??
      emptySeries(FRED_SPECS[11], "fred"),
  ];

  const hasAny = ordered.some((s) => s.points.length > 0);
  const hasAll = ordered.every((s) => s.points.length > 0);
  const source: DashboardHistoryResponse["source"] = hasAll
    ? "ok"
    : hasAny
      ? "partial"
      : "error";

  return {
    range,
    updatedAt: new Date().toISOString(),
    source,
    series: ordered,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("range");
  const range = parseRange(raw) ?? (raw === null ? "3m" : null);
  if (!range) {
    return NextResponse.json({ error: "invalid range" }, { status: 400 });
  }

  const cacheKey = `cache:dashboard-history:v3:${range}`;
  const data = await getCachedJson<DashboardHistoryResponse>(
    cacheKey,
    5 * 60 * 1000,
    () => computeAll(range),
  );

  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        data.source === "error"
          ? "s-maxage=60, stale-while-revalidate=30"
          : "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
