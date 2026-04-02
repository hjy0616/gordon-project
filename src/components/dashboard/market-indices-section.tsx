"use client";

import { useMarketIndices } from "@/lib/queries/use-market-indices";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketIndex } from "@/app/api/market-indices/route";

function formatPrice(price: number): string {
  if (price < 10) return price.toFixed(2);
  return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatTime(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${m}/${d} ${h}:${min}`;
}

function MarketIndexItem({ item }: { item: MarketIndex }) {
  if (item.price === null) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
        <span className="text-xs text-muted-foreground">{item.name}</span>
        <span className="animate-pulse text-xs text-muted-foreground">
          데이터를 갖고오고 있습니다
        </span>
      </div>
    );
  }

  const isUp = (item.changeRate ?? 0) >= 0;
  const sign = isUp ? "+" : "";
  const changeColor = isUp ? "text-red-500" : "text-blue-400";

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{item.name}</span>
      <div className="text-right">
        <div className="text-sm font-semibold">{formatPrice(item.price)}</div>
        {item.changeRate !== null && (
          <div className={`text-xs font-medium ${changeColor}`}>
            {sign}
            {item.changeRate.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}

export function MarketIndicesSection() {
  const { data: response, isLoading } = useMarketIndices();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const items = response?.data ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-primary">INDEXerGO Market</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          데이터를 가져오는 중입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-primary">INDEXerGO Market</h2>
        <span className="text-xs text-muted-foreground">
          {formatTime()} LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <MarketIndexItem key={item.symbol} item={item} />
        ))}
      </div>
    </div>
  );
}
