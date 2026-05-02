"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type EngagementData = {
  range: string;
  avgDurationSec: number;
  p50DurationSec: number;
  p90DurationSec: number;
  totalSessions: number;
};

async function fetchEngagement(range: string): Promise<EngagementData> {
  const res = await fetch(`/api/admin/analytics/engagement?range=${range}`);
  if (!res.ok) {
    return {
      range,
      avgDurationSec: 0,
      p50DurationSec: 0,
      p90DurationSec: 0,
      totalSessions: 0,
    };
  }
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const minutes = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (minutes < 60) return `${minutes}분 ${remSec}초`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}시간 ${remMin}분`;
}

export function EngagementSection() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "engagement", range],
    queryFn: () => fetchEngagement(range),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 세션 시간
            </CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatDuration(data?.avgDurationSec ?? 0)
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              세션 시작 → 마지막 활동
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              P50 (중앙값)
            </CardTitle>
            <Clock className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatDuration(data?.p50DurationSec ?? 0)
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">유저 절반은 이 이상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              P90
            </CardTitle>
            <Clock className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatDuration(data?.p90DurationSec ?? 0)
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">상위 10% 이 이상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 세션 수
            </CardTitle>
            <Users className="size-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : (data?.totalSessions ?? 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">기간 내</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">페이지별 방문 / 시간대 / 유입 도메인</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-sm text-muted-foreground">
            페이지별 방문수, Top Pages, Top Referrers(naver/google 등 도메인), 시간대별 트래픽,
            디바이스/지역 분석은
            <a
              href="https://vercel.com/docs/analytics"
              target="_blank"
              rel="noreferrer noopener"
              className="mx-1 underline"
            >
              Vercel Web Analytics
            </a>
            에서 확인합니다. (가입자 매칭이 필요한 분석은 위의 &lsquo;유입&rsquo; 탭 참고)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
