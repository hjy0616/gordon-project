"use client";

import { useFearGreedIndex } from "@/lib/queries/use-fear-greed";
import { useMarketIndices } from "@/lib/queries/use-market-indices";
import { useYahooIndicators } from "@/lib/queries/use-yahoo-indicators";
import { useFredIndicators } from "@/lib/queries/use-fred";
import { Skeleton } from "@/components/ui/skeleton";

/* ── helpers ─────────────────────────────────── */

function formatTime(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}

function formatValue(value: number, type: "number" | "percent" | "index" | "rating" = "number"): string {
  if (type === "percent") return `${value.toFixed(2)}%`;
  if (type === "index") return value.toFixed(2);
  if (type === "rating") return String(Math.round(value));
  // large numbers: add comma separators
  if (Math.abs(value) >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toFixed(2);
}

function formatChange(change: number | null): string | null {
  if (change === null) return null;
  const sign = change >= 0 ? "+" : "";
  if (Math.abs(change) >= 100) return `${sign}${change.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}${change.toFixed(2)}`;
}

/* ── IndicatorRow ────────────────────────────── */

interface IndicatorRowProps {
  label: string;
  value: string | null;
  change: string | null;
}

function IndicatorRow({ label, value, change }: IndicatorRowProps) {
  const changeColor =
    change === null || change === "-"
      ? ""
      : change.startsWith("+")
        ? "text-red-400"
        : "text-cyan-400";

  return (
    <div className="flex items-center gap-1 py-[3px]">
      <span className="min-w-0 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="flex-1" />
      {change && change !== "-" && (
        <span className={`text-[10px] font-medium ${changeColor}`}>{change}</span>
      )}
      <span className="min-w-[52px] text-right text-[11px] font-bold text-foreground">
        {value ?? "–"}
      </span>
    </div>
  );
}

/* ── skeleton ────────────────────────────────── */

function IndicatorsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[22px] w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── main ────────────────────────────────────── */

export function FinancialIndicatorsSection() {
  const { data: fgResp, isLoading: fgLoading } = useFearGreedIndex();
  const { data: miResp, isLoading: miLoading } = useMarketIndices();
  const { data: yahooResp, isLoading: yahooLoading } = useYahooIndicators();
  const { data: fredResp, isLoading: fredLoading } = useFredIndicators();

  const isLoading = fgLoading || miLoading || yahooLoading || fredLoading;

  if (isLoading) return <IndicatorsSkeleton />;

  // ── Fear & Greed (reuse existing) ──
  const fgData = fgResp?.data ?? [];
  const latestFg = fgData.length > 0 ? fgData[fgData.length - 1] : null;
  const fgValue = latestFg ? `${latestFg.rating} (${Math.round(latestFg.score)})` : null;

  // ── DXY (reuse existing market-indices) ──
  const dxy = (miResp?.data ?? []).find((d) => d.symbol === "DX-Y.NYB");

  // ── Yahoo indicators ──
  const yahooData = yahooResp?.data ?? [];
  const vix = yahooData.find((d) => d.symbol === "^VIX");
  const us2y = yahooData.find((d) => d.symbol === "2YY=F");
  const us10y = yahooData.find((d) => d.symbol === "^TNX");

  // ── FRED indicators ──
  const fredData = fredResp?.data ?? [];
  const fred = (id: string) => fredData.find((d) => d.id === id);

  const stressIdx = fred("STLFSI2");
  const m2Supply = fred("WM2NS");
  const fedBalance = fred("WALCL");
  const tga = fred("WTREGEN");
  const onRrp = fred("RRPONTSYD");
  const repoOps = fred("RPONTSYD");
  const sofr = fred("SOFR");
  const mmfTotal = fred("MMMFFAQ027S");
  const iorb = fred("IORB");
  const dgs1mo = fred("DGS1MO");
  const dgs3mo = fred("DGS3MO");

  // ── Net Liquidity = Fed Balance - TGA - ON RRP ──
  // WALCL: millions, WTREGEN: millions, RRPONTSYD: billions → convert to millions
  const fbVal = fedBalance?.value ?? null;
  const tgaVal = tga?.value ?? null;
  const rrpVal = onRrp?.value !== null && onRrp?.value !== undefined ? onRrp.value * 1000 : null;

  const netLiqValue =
    fbVal !== null && tgaVal !== null && rrpVal !== null
      ? fbVal - tgaVal - rrpVal
      : null;

  // Net Liq change: same calc with previous values
  const fbPrev = fedBalance != null && fedBalance.value !== null && fedBalance.change !== null
    ? fedBalance.value - fedBalance.change
    : null;
  const tgaPrev = tga != null && tga.value !== null && tga.change !== null
    ? tga.value - tga.change
    : null;
  const rrpPrev = onRrp != null && onRrp.value !== null && onRrp.change !== null
    ? (onRrp.value - onRrp.change) * 1000
    : null;

  const prevNetLiq =
    fbPrev !== null && tgaPrev !== null && rrpPrev !== null
      ? fbPrev - tgaPrev - rrpPrev
      : null;

  const netLiqChange =
    netLiqValue !== null && prevNetLiq !== null
      ? Number((netLiqValue - prevNetLiq).toFixed(2))
      : null;

  // ── helpers for Yahoo/Market rows ──
  const yahooRow = (label: string, item: { price: number | null; changeRate: number | null } | undefined, type: "number" | "percent" | "index" = "number") => (
    <IndicatorRow
      label={label}
      value={item?.price !== null && item?.price !== undefined ? formatValue(item.price, type) : null}
      change={item?.changeRate !== null && item?.changeRate !== undefined ? formatChange(item.changeRate) : null}
    />
  );

  const fredRow = (label: string, item: ReturnType<typeof fred>, type: "number" | "percent" | "index" = "number") => (
    <IndicatorRow
      label={label}
      value={item?.value !== null && item?.value !== undefined ? formatValue(item.value, type) : null}
      change={formatChange(item?.change ?? null)}
    />
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-primary">Yahoo & FRED</h2>
        <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>{formatTime()}</span>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
        {/* Left: 시장 심리 및 금리 */}
        <div>
          <IndicatorRow label="Fear & Greed" value={fgValue} change={null} />
          {yahooRow("VIX", vix, "index")}
          {yahooRow("DXY (ICE)", dxy, "index")}
          {yahooRow("US 2Y", us2y, "percent")}
          {yahooRow("US 10Y", us10y, "percent")}
          {fredRow("Stress Idx", stressIdx, "index")}
          {fredRow("M2 Supply", m2Supply)}
        </div>

        {/* Right: 연준 유동성 및 자금 */}
        <div>
          {fredRow("Fed Balance", fedBalance)}
          {fredRow("TGA (Est)", tga)}
          {fredRow("ON RRP", onRrp)}
          {fredRow("Repo Ops", repoOps)}
          {fredRow("SOFR", sofr, "percent")}
          {fredRow("MMF Total", mmfTotal)}
          <IndicatorRow
            label="Net Liquidity"
            value={netLiqValue !== null ? formatValue(netLiqValue) : null}
            change={formatChange(netLiqChange)}
          />
          {fredRow("지급준비금금리(IoRB)", iorb, "percent")}
          {fredRow("미국국채 1개월", dgs1mo, "percent")}
          {fredRow("미국국채 3개월", dgs3mo, "percent")}
        </div>
      </div>
    </div>
  );
}
