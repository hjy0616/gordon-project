"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ChurnData = {
  range: string;
  churnRate: number;
  churnedCount: number;
  totalAtRiskStart: number;
  expiringSoon: Array<{
    id: string;
    name: string | null;
    email: string;
    activeUntil: string | null;
  }>;
};

async function fetchChurn(range: string): Promise<ChurnData> {
  const res = await fetch(`/api/admin/analytics/churn?range=${range}`);
  if (!res.ok) {
    return {
      range,
      churnRate: 0,
      churnedCount: 0,
      totalAtRiskStart: 0,
      expiringSoon: [],
    };
  }
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

export function ChurnSection() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "churn", range],
    queryFn: () => fetchChurn(range),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });

  const churnPct = data ? (data.churnRate * 100).toFixed(2) : "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
            <TrendingDown className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : `${churnPct}%`}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {range} 동안 ACTIVE→이탈 비율
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이탈 인원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : (data?.churnedCount ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">EXPIRED + SUSPENDED</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              시작 시점 ACTIVE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                (data?.totalAtRiskStart ?? 0)
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">분모 (위험군)</p>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-orange-500" />
            만료 임박 (14일 이내)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data?.expiringSoon.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">없음</p>
          ) : (
            <ul className="space-y-2">
              {data?.expiringSoon.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name || "이름 없음"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-xs text-orange-500">
                    {u.activeUntil
                      ? new Date(u.activeUntil).toLocaleDateString("ko-KR")
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
