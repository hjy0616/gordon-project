"use client";

import { useFearGreedIndex } from "@/lib/queries/use-fear-greed";
import { FearGreedChart } from "./fear-greed-chart";
import { FearGreedGauge } from "./fear-greed-gauge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export function FearGreedSection() {
  const { data: response, isLoading } = useFearGreedIndex();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  const items = response?.data ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-primary">Fear & Greed Index</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          데이터를 가져오는 중입니다.
        </p>
      </div>
    );
  }

  const latest = items[items.length - 1];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* 헤더 */}
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-primary">Fear & Greed Index</h2>
        <span className="text-xs text-muted-foreground">(Last 3 months)</span>
      </div>

      {/* 본문: 차트(좌) + 게이지(우) */}
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <FearGreedChart data={items} />
        </div>
        <div className="w-[140px] shrink-0">
          <FearGreedGauge
            score={latest.score}
            rating={latest.rating}
            updatedAt={formatDate(latest.timestamp)}
          />
        </div>
      </div>
    </div>
  );
}
