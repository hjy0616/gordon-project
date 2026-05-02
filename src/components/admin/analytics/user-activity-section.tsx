"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  Heart,
  Map as MapIcon,
  MessageSquare,
  Sparkles,
  TreePine,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChartReady } from "@/hooks/use-chart-ready";

type CategoryCounts = {
  posts: number;
  comments: number;
  likes: number;
  simulations: number;
  macroMap: number;
  treasureMap: number;
};

type UserActivityData = {
  range: string;
  activeUsers: { dau: number; wau: number; mau: number };
  dauNew: number;
  dauReturning: number;
  activeContributors: number;
  today: CategoryCounts;
  categoryTotals: CategoryCounts;
  timeline: Array<{ day: string; type: string; count: number }>;
  topAuthors: Array<{
    id: string;
    name: string | null;
    email: string;
    posts: number;
    comments: number;
    likes: number;
    simulations: number;
    macroMap: number;
    treasureMap: number;
    total: number;
  }>;
  byBoard: Array<{ slug: string; name: string; posts: number }>;
  distribution: { inactive: number; light: number; medium: number; heavy: number };
};

const EMPTY_CATEGORY: CategoryCounts = {
  posts: 0,
  comments: 0,
  likes: 0,
  simulations: 0,
  macroMap: 0,
  treasureMap: 0,
};

async function fetchUserActivity(range: string): Promise<UserActivityData> {
  const res = await fetch(`/api/admin/analytics/user-activity?range=${range}`);
  if (!res.ok) {
    return {
      range,
      activeUsers: { dau: 0, wau: 0, mau: 0 },
      dauNew: 0,
      dauReturning: 0,
      activeContributors: 0,
      today: EMPTY_CATEGORY,
      categoryTotals: EMPTY_CATEGORY,
      timeline: [],
      topAuthors: [],
      byBoard: [],
      distribution: { inactive: 0, light: 0, medium: 0, heavy: 0 },
    };
  }
  return res.json();
}

const RANGES = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
];

const TYPE_META: Record<string, { label: string; color: string }> = {
  post: { label: "글", color: "var(--color-orange-500, #f97316)" },
  comment: { label: "댓글", color: "var(--color-blue-500, #3b82f6)" },
  like: { label: "좋아요", color: "var(--color-pink-500, #ec4899)" },
  simulation: { label: "시뮬", color: "var(--color-emerald-500, #10b981)" },
  macro_map: { label: "Macro Map", color: "var(--color-violet-500, #8b5cf6)" },
  treasure_map: { label: "Treasure Map", color: "var(--color-amber-500, #f59e0b)" },
};

export function UserActivitySection() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "user-activity", range],
    queryFn: () => fetchUserActivity(range),
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });

  const timelineData = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, Record<string, number | string>>();
    data.timeline.forEach((row) => {
      if (!byDay.has(row.day)) byDay.set(row.day, { day: row.day });
      const entry = byDay.get(row.day)!;
      entry[row.type] = row.count;
    });
    return Array.from(byDay.values()).sort((a, b) =>
      String(a.day).localeCompare(String(b.day)),
    );
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data) return [];
    return [
      { label: "비활동(0)", value: data.distribution.inactive, color: "var(--muted)" },
      { label: "Light(1-4)", value: data.distribution.light, color: "var(--color-sky-500, #0ea5e9)" },
      {
        label: "Medium(5-19)",
        value: data.distribution.medium,
        color: "var(--color-blue-500, #3b82f6)",
      },
      {
        label: "Heavy(20+)",
        value: data.distribution.heavy,
        color: "var(--color-orange-500, #f97316)",
      },
    ];
  }, [data]);

  const categoryBars = useMemo(() => {
    if (!data) return [];
    return [
      { label: "글", value: data.categoryTotals.posts, color: "var(--color-orange-500, #f97316)" },
      { label: "댓글", value: data.categoryTotals.comments, color: "var(--color-blue-500, #3b82f6)" },
      { label: "좋아요", value: data.categoryTotals.likes, color: "var(--color-pink-500, #ec4899)" },
      { label: "시뮬", value: data.categoryTotals.simulations, color: "var(--color-emerald-500, #10b981)" },
      { label: "Macro Map", value: data.categoryTotals.macroMap, color: "var(--color-violet-500, #8b5cf6)" },
      { label: "Treasure Map", value: data.categoryTotals.treasureMap, color: "var(--color-amber-500, #f59e0b)" },
    ];
  }, [data]);

  const { ref: timelineRef, ready: timelineReady } = useChartReady();
  const { ref: distRef, ready: distReady } = useChartReady();
  const { ref: boardRef, ready: boardReady } = useChartReady();
  const { ref: catRef, ready: catReady } = useChartReady();

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="오늘 글"
          value={data?.today.posts}
          icon={FileText}
          accent="text-orange-500"
          loading={isLoading}
        />
        <StatCard
          title="오늘 댓글"
          value={data?.today.comments}
          icon={MessageSquare}
          accent="text-blue-500"
          loading={isLoading}
        />
        <StatCard
          title="오늘 좋아요"
          value={data?.today.likes}
          icon={Heart}
          accent="text-pink-500"
          loading={isLoading}
        />
        <StatCard
          title="오늘 시뮬"
          value={data?.today.simulations}
          icon={Sparkles}
          accent="text-emerald-500"
          loading={isLoading}
        />
        <StatCard
          title="오늘 Macro Map"
          value={data?.today.macroMap}
          icon={MapIcon}
          accent="text-violet-500"
          loading={isLoading}
        />
        <StatCard
          title="오늘 Treasure Map"
          value={data?.today.treasureMap}
          icon={TreePine}
          accent="text-amber-500"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="DAU"
          value={data?.activeUsers.dau}
          icon={Users}
          accent="text-foreground"
          description={
            data
              ? `신규 ${data.dauNew} / 재방문 ${data.dauReturning}`
              : "24h 액션 1+회"
          }
          loading={isLoading}
        />
        <StatCard
          title="WAU"
          value={data?.activeUsers.wau}
          icon={Users}
          accent="text-foreground"
          description="7일 액션 1+회"
          loading={isLoading}
        />
        <StatCard
          title="MAU"
          value={data?.activeUsers.mau}
          icon={Users}
          accent="text-foreground"
          description="30일 액션 1+회"
          loading={isLoading}
        />
        <StatCard
          title={`Active Contributor (${range})`}
          value={data?.activeContributors}
          icon={TrendingUp}
          accent="text-orange-500"
          description="기간 내 액션 1+회"
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 활동 timeline</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            글 / 댓글 / 좋아요 / 시뮬 / Macro Map / Treasure Map 일별 카운트 (저장 순간 기준)
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <div ref={timelineRef} className="h-[280px] w-full">
              {timelineReady && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <LineChart
                    data={timelineData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="currentColor"
                      fontSize={11}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis
                      stroke="currentColor"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={meta.label}
                        stroke={meta.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">카테고리별 활동량 ({range})</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">기간 내 합계</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <div ref={catRef} className="h-[240px] w-full">
              {catReady && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart
                    data={categoryBars}
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      opacity={0.1}
                    />
                    <XAxis dataKey="label" stroke="currentColor" fontSize={11} />
                    <YAxis
                      stroke="currentColor"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" name="활동" radius={[4, 4, 0, 0]}>
                      {categoryBars.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
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
            <CardTitle className="text-base">활동량 Top 10 유저</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              글 + 댓글 + 좋아요 + 시뮬 + Map + Treasure Map 합산
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data && data.topAuthors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left">유저</th>
                      <th className="px-2 py-1 text-right">글</th>
                      <th className="px-2 py-1 text-right">댓글</th>
                      <th className="px-2 py-1 text-right">좋아요</th>
                      <th className="px-2 py-1 text-right">시뮬</th>
                      <th className="px-2 py-1 text-right">Map</th>
                      <th className="px-2 py-1 text-right">Treasure</th>
                      <th className="px-2 py-1 text-right">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topAuthors.map((u) => (
                      <tr key={u.id} className="border-t border-border/40">
                        <td className="px-2 py-1.5">
                          <div className="font-medium">{u.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.posts}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.comments}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.likes}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.simulations}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.macroMap}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {u.treasureMap}
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                          {u.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                기간 내 활동 데이터 없음
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">유저별 활동량 분포</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Heavy(20+) · Medium(5-19) · Light(1-4) · 비활동(0) — 6개 카테고리 합산
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div ref={distRef} className="h-[280px] w-full">
                {distReady && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart
                      data={distributionData}
                      margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="currentColor"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="currentColor"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" name="유저 수" radius={[4, 4, 0, 0]}>
                        {distributionData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">보드별 활동량</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">기간 내 게시글 수</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : data && data.byBoard.length > 0 ? (
            <div ref={boardRef} className="h-[240px] w-full">
              {boardReady && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart
                    data={data.byBoard}
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      opacity={0.1}
                    />
                    <XAxis dataKey="name" stroke="currentColor" fontSize={11} />
                    <YAxis
                      stroke="currentColor"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="posts"
                      name="글"
                      fill="var(--color-orange-500, #f97316)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              보드 데이터 없음
            </p>
          )}
        </CardContent>
      </Card>
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
  icon: typeof Users;
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
