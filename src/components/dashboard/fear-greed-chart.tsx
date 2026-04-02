"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChartReady } from "@/hooks/use-chart-ready";
import type { FearGreedData } from "@/app/api/fear-greed/route";

function fngColouring(score: number): string {
  if (score >= 75) return "#8FD6C4";
  if (score >= 55) return "#B9EDE9";
  if (score >= 45) return "#E6E6E6";
  if (score >= 25) return "#FFDCD0";
  return "#FFC0B7";
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTick(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: FearGreedData;
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;
  return <circle cx={cx} cy={cy} r={3} fill={fngColouring(payload.score)} />;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FearGreedData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const color = fngColouring(d.score);
  return (
    <div className="rounded-md border border-border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="text-muted-foreground">{formatTick(d.timestamp)}</p>
      <p className="mt-0.5 text-sm font-bold" style={{ color }}>
        {d.score}
      </p>
      <p className="text-[10px]" style={{ color }}>
        {capitalizeFirstLetter(d.rating)}
      </p>
    </div>
  );
}

interface FearGreedChartProps {
  data: FearGreedData[];
}

export function FearGreedChart({ data }: FearGreedChartProps) {
  const { ref, ready } = useChartReady();

  return (
    <div ref={ref} className="h-[120px] w-full">
      {ready && (
        <ResponsiveContainer width="100%" height={120} minWidth={0}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              stroke="var(--color-muted-foreground)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="var(--color-muted-foreground)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <ReferenceLine y={25} stroke="var(--color-border)" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="var(--color-border)" strokeDasharray="3 3" />
            <ReferenceLine y={75} stroke="var(--color-border)" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--color-foreground)"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: "var(--color-foreground)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
