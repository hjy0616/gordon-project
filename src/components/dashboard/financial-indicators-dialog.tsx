"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardHistory } from "@/lib/queries/use-dashboard-history";
import { IndicatorMiniChart } from "./indicator-mini-chart";
import type { DashboardHistoryRange } from "@/app/api/dashboard-history/route";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RANGES: Array<{ value: DashboardHistoryRange; label: string }> = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

function formatUpdatedAt(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { hour12: false });
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-[80px] w-full" />
        </div>
      ))}
    </div>
  );
}

export function FinancialIndicatorsDialog({ open, onOpenChange }: Props) {
  const [range, setRange] = useState<DashboardHistoryRange>("3m");
  const { data, isLoading, refetch } = useDashboardHistory(range);

  const series = data?.series ?? [];
  const isErrorState = !isLoading && data?.source === "error";
  const isEmptyState =
    !isLoading && data?.source !== "error" && series.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[95vh] max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-w-6xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-primary">
              Yahoo & FRED Indicators
            </h2>
            {data?.updatedAt && (
              <span className="text-[11px] text-muted-foreground">
                {formatUpdatedAt(data.updatedAt)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Range toggle */}
        <div className="shrink-0 border-b border-border px-4 py-2">
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as DashboardHistoryRange)}
          >
            <TabsList className="h-8">
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="text-xs sm:text-sm">
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <GridSkeleton />
          ) : isErrorState ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                데이터를 가져올 수 없습니다.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
              >
                재시도
              </button>
            </div>
          ) : isEmptyState ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                표시할 데이터가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {series.map((s) => (
                <IndicatorMiniChart
                  key={s.id}
                  name={s.name}
                  source={s.source}
                  unit={s.unit}
                  latest={s.latest}
                  points={s.points}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
