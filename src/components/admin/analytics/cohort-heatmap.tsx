"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type CohortsData = {
  type: "daily" | "weekly";
  cohorts: Array<{
    cohortDate: string;
    size: number;
    retention: { d1: number; d7: number; d30: number };
    retainedCount: { d1: number; d7: number; d30: number };
    activation: { firstPost7d: number; firstLasagna7d: number };
    activationCount: { firstPost7d: number; firstLasagna7d: number };
  }>;
};

async function fetchCohorts(type: string): Promise<CohortsData> {
  const res = await fetch(`/api/admin/analytics/cohorts?type=${type}`);
  if (!res.ok) return { type: type as "daily" | "weekly", cohorts: [] };
  return res.json();
}

export function CohortSection() {
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "cohorts", type],
    queryFn: () => fetchCohorts(type),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">코호트 리텐션</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            가입 시점 기준 D1 / D7 / D30 잔존율
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={type === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("daily")}
          >
            일별
          </Button>
          <Button
            variant={type === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("weekly")}
          >
            주별
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data?.cohorts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            데이터가 충분하지 않습니다 — 가입 후 lastActiveAt이 누적되면 표시됩니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2">코호트</th>
                  <th className="px-2 py-2 text-right">크기</th>
                  <th className="px-2 py-2 text-right">D1</th>
                  <th className="px-2 py-2 text-right">D7</th>
                  <th className="px-2 py-2 text-right">D30</th>
                  <th className="px-2 py-2 text-right">첫 글(7일)</th>
                  <th className="px-2 py-2 text-right">첫 시뮬(7일)</th>
                </tr>
              </thead>
              <tbody>
                {data?.cohorts.map((c) => (
                  <tr key={c.cohortDate} className="border-b last:border-b-0">
                    <td className="px-2 py-2 font-mono text-xs">{c.cohortDate}</td>
                    <td className="px-2 py-2 text-right">{c.size}</td>
                    <td className="px-2 py-2 text-right">
                      <RetentionCell rate={c.retention.d1} count={c.retainedCount.d1} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <RetentionCell rate={c.retention.d7} count={c.retainedCount.d7} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <RetentionCell rate={c.retention.d30} count={c.retainedCount.d30} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <ActivationCell
                        rate={c.activation.firstPost7d}
                        count={c.activationCount.firstPost7d}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <ActivationCell
                        rate={c.activation.firstLasagna7d}
                        count={c.activationCount.firstLasagna7d}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RetentionCell({ rate, count }: { rate: number; count: number }) {
  const pct = Math.round(rate * 100);
  const opacity = Math.min(1, 0.15 + rate * 0.85);
  return (
    <div
      className="inline-flex items-center justify-end gap-2 rounded px-2 py-0.5"
      style={{
        backgroundColor: `oklch(0.75 0.15 50 / ${opacity})`,
      }}
    >
      <span className="font-mono text-xs">{pct}%</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

function ActivationCell({ rate, count }: { rate: number; count: number }) {
  const pct = Math.round(rate * 100);
  const opacity = Math.min(1, 0.15 + rate * 0.85);
  return (
    <div
      className="inline-flex items-center justify-end gap-2 rounded px-2 py-0.5"
      style={{
        backgroundColor: `oklch(0.78 0.16 145 / ${opacity})`,
      }}
    >
      <span className="font-mono text-xs">{pct}%</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}
