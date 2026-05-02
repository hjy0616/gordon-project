"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChartReady } from "@/hooks/use-chart-ready";

type GrowthData = {
  range: string;
  daily: Array<{
    date: string;
    signups: number;
    activated: number;
    activeUsers: number;
  }>;
};

async function fetchGrowth(range: string): Promise<GrowthData> {
  const res = await fetch(`/api/admin/analytics/growth?range=${range}`);
  if (!res.ok) return { range, daily: [] };
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

export function GrowthSection() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "growth", range],
    queryFn: () => fetchGrowth(range),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
  const { ref, ready } = useChartReady();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">성장 추이</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            일별 신규가입 / 활성화 / 활성 유저
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              variant={range === r.key ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div ref={ref} className="h-[300px] w-full">
            {ready && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={data?.daily ?? []}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  stroke="currentColor"
                  fontSize={11}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis stroke="currentColor" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  name="신규가입"
                  stroke="var(--color-orange-500, #f97316)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="activated"
                  name="활성화"
                  stroke="var(--color-green-500, #22c55e)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name="활성 유저"
                  stroke="var(--color-blue-500, #3b82f6)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
