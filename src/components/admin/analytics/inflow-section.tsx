"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChartReady } from "@/hooks/use-chart-ready";

type InflowData = {
  range: string;
  sources: Array<{
    source: string;
    signups: number;
    activated: number;
    activationRate: number;
  }>;
  campaigns: Array<{
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    sessions: number;
    uniqueUsers: number;
  }>;
};

async function fetchInflow(range: string): Promise<InflowData> {
  const res = await fetch(`/api/admin/analytics/inflow?range=${range}`);
  if (!res.ok) return { range, sources: [], campaigns: [] };
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

const PIE_COLORS = [
  "var(--color-orange-500, #f97316)",
  "var(--color-emerald-500, #10b981)",
  "var(--color-blue-500, #3b82f6)",
  "var(--color-violet-500, #8b5cf6)",
  "var(--color-rose-500, #f43f5e)",
  "var(--color-amber-500, #f59e0b)",
  "var(--color-cyan-500, #06b6d4)",
];

export function InflowSection() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "inflow", range],
    queryFn: () => fetchInflow(range),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });
  const { ref, ready } = useChartReady();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-1">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">유입 소스 (가입자 기준)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data?.sources.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                기간 내 가입 없음
              </p>
            ) : (
              <div ref={ref} className="h-[280px] w-full">
                {ready && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={data?.sources ?? []}
                      dataKey="signups"
                      nameKey="source"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {(data?.sources ?? []).map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">소스별 활성화율</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ul className="space-y-3">
                {data?.sources.map((s) => (
                  <li key={s.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{s.source}</span>
                      <span className="ml-2 shrink-0 font-mono text-xs">
                        {(s.activationRate * 100).toFixed(0)}% ({s.activated}/{s.signups})
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, s.activationRate * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">UTM 캠페인</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data?.campaigns.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              utm 파라미터가 추적된 세션 없음
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-2 py-2">utm_source</th>
                    <th className="px-2 py-2">utm_medium</th>
                    <th className="px-2 py-2">utm_campaign</th>
                    <th className="px-2 py-2 text-right">세션</th>
                    <th className="px-2 py-2 text-right">고유 유저</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.campaigns.map((c, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-mono text-xs">{c.utmSource ?? "—"}</td>
                      <td className="px-2 py-2 font-mono text-xs">{c.utmMedium ?? "—"}</td>
                      <td className="px-2 py-2 font-mono text-xs">{c.utmCampaign ?? "—"}</td>
                      <td className="px-2 py-2 text-right">{c.sessions}</td>
                      <td className="px-2 py-2 text-right">{c.uniqueUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
