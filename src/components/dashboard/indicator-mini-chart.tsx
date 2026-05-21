"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChartReady } from "@/hooks/use-chart-ready";
import type {
  DashboardHistoryPoint,
  DashboardHistorySeries,
  DashboardHistoryUnit,
} from "@/app/api/dashboard-history/route";

interface Props {
  name: string;
  source: DashboardHistorySeries["source"];
  unit: DashboardHistoryUnit;
  latest: { value: number | null; change: number | null; changeRate: number | null };
  points: DashboardHistoryPoint[];
}

function formatValue(value: number, unit: DashboardHistoryUnit): string {
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "bps") return `${Math.round(value)} bps`;
  if (unit === "rating") return String(Math.round(value));
  if (unit === "index") return value.toFixed(2);
  if (Math.abs(value) >= 100)
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toFixed(2);
}

function formatChange(change: number | null, unit: DashboardHistoryUnit): string | null {
  if (change === null) return null;
  const sign = change >= 0 ? "+" : "";
  if (unit === "bps") return `${sign}${Math.round(change)}bps`;
  if (Math.abs(change) >= 100)
    return `${sign}${change.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}${change.toFixed(2)}`;
}

function formatTick(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DashboardHistoryPoint }>;
  unit: DashboardHistoryUnit;
}

function MiniTooltip({ active, payload, unit }: TooltipProps) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-background/95 px-2 py-1 text-[10px] shadow-lg backdrop-blur-sm">
      <p className="text-muted-foreground">{formatTick(p.t)}</p>
      <p className="font-bold text-foreground">{formatValue(p.v, unit)}</p>
    </div>
  );
}

export function IndicatorMiniChart({
  name,
  source,
  unit,
  latest,
  points,
}: Props) {
  const { ref, ready } = useChartReady();

  const isUp = (latest.changeRate ?? latest.change ?? 0) >= 0;
  // Fear&Greed는 색이 점수 의미와 충돌하므로 foreground 사용
  const strokeColor =
    source === "fear-greed"
      ? "var(--color-foreground)"
      : isUp
        ? "#ef4444"
        : "#22d3ee";
  const changeColor =
    source === "fear-greed"
      ? "text-muted-foreground"
      : isUp
        ? "text-red-400"
        : "text-cyan-400";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* 헤더 */}
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">{name}</span>
        <div className="flex shrink-0 items-baseline gap-1">
          {latest.change !== null && (
            <span className={`text-[10px] font-medium ${changeColor}`}>
              {formatChange(latest.change, unit)}
            </span>
          )}
          <span className="text-xs font-bold text-foreground">
            {latest.value !== null ? formatValue(latest.value, unit) : "–"}
          </span>
        </div>
      </div>

      {/* sparkline */}
      <div ref={ref} className="h-[80px] w-full">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            데이터 없음
          </div>
        ) : (
          ready && (
            <ResponsiveContainer width="100%" height={80} minWidth={0} minHeight={1}>
              <LineChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<MiniTooltip unit={unit} />} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </div>
    </div>
  );
}
