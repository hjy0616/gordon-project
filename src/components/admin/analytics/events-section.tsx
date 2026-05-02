"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChartReady } from "@/hooks/use-chart-ready";

type EventsData = {
  type: "wow" | "pain";
  range: string;
  events: Array<{ label: string; count: number; ratePerActiveUser: number }>;
  timeline: Array<{ date: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
};

async function fetchEvents(type: "wow" | "pain", range: string): Promise<EventsData> {
  const res = await fetch(`/api/admin/analytics/events?type=${type}&range=${range}`);
  if (!res.ok) {
    return { type, range, events: [], timeline: [], byType: [] };
  }
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

export function EventsSection() {
  const [filterType, setFilterType] = useState<"wow" | "pain">("wow");
  const [range, setRange] = useState("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "events", filterType, range],
    queryFn: () => fetchEvents(filterType, range),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });
  const { ref, ready } = useChartReady();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button
            variant={filterType === "wow" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("wow")}
          >
            <Sparkles className="size-4" /> Wow
          </Button>
          <Button
            variant={filterType === "pain" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("pain")}
          >
            <AlertOctagon className="size-4" /> Pain
          </Button>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filterType === "wow" ? "Wow 이벤트 타임라인" : "Pain 이벤트 타임라인"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (data?.timeline.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filterType === "wow"
                ? "아직 wow 이벤트가 없습니다 — useTrackEvent로 \"wow\" 발사 지점을 심어보세요."
                : "아직 pain 이벤트가 없습니다 — 유저가 막힌 지점에서 \"pain\"을 기록하면 여기 표시됩니다."}
            </p>
          ) : (
            <div ref={ref} className="h-[200px] w-full">
              {ready && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={data?.timeline ?? []}
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
                  <Bar
                    dataKey="count"
                    fill={
                      filterType === "wow"
                        ? "var(--color-emerald-500, #10b981)"
                        : "var(--color-rose-500, #f43f5e)"
                    }
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">라벨별 집계 (top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.events.length ?? 0) === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">기록 없음</p>
            ) : (
              <ul className="space-y-2">
                {data?.events.map((e) => (
                  <li
                    key={e.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{e.label}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs">
                      {e.count} (×{e.ratePerActiveUser.toFixed(2)}/활성유저)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">전체 이벤트 타입별 (top 15)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.byType.length ?? 0) === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">기록 없음</p>
            ) : (
              <ul className="space-y-2">
                {data?.byType.map((t) => (
                  <li key={t.type} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{t.type}</span>
                    <span className="ml-2 shrink-0 font-mono">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
