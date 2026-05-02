"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, UserPlus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RealtimeData = {
  active5m: number;
  active30m: number;
  newSignupsToday: number;
  activationRate: number;
  totalUsers: number;
  activatedUsers: number;
};

async function fetchRealtime(): Promise<RealtimeData> {
  const res = await fetch("/api/admin/analytics/realtime");
  if (!res.ok) {
    return {
      active5m: 0,
      active30m: 0,
      newSignupsToday: 0,
      activationRate: 0,
      totalUsers: 0,
      activatedUsers: 0,
    };
  }
  return res.json();
}

export function RealtimeSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "realtime"],
    queryFn: fetchRealtime,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="실시간 (5분)"
          value={data?.active5m}
          icon={Activity}
          accent="text-green-500"
          description="최근 5분 내 활동한 고유 유저"
          loading={isLoading}
        />
        <StatCard
          title="실시간 (30분)"
          value={data?.active30m}
          icon={Activity}
          accent="text-emerald-500"
          description="최근 30분 내 활동"
          loading={isLoading}
        />
        <StatCard
          title="오늘 신규가입"
          value={data?.newSignupsToday}
          icon={UserPlus}
          accent="text-orange-500"
          description="자정 기준"
          loading={isLoading}
        />
        <StatCard
          title="활성화율"
          value={data ? `${(data.activationRate * 100).toFixed(1)}%` : undefined}
          icon={Sparkles}
          accent="text-yellow-500"
          description={`${data?.activatedUsers ?? 0}/${data?.totalUsers ?? 0} ACTIVE`}
          loading={isLoading}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        DAU / WAU / MAU 등 기간 활동지표는 <span className="font-medium">유저 활동</span> 탭에서
        확인하세요. (5분 캐시, 액션 기준)
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  description,
  loading,
}: {
  title: string;
  value: number | string | undefined;
  icon: typeof Activity;
  accent: string;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`size-4 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-16" /> : value ?? "—"}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
