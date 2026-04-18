"use client";

import { useEmployment } from "@/lib/queries/use-employment";
import { Skeleton } from "@/components/ui/skeleton";

function formatValue(id: string, value: number): string {
  if (id === "UNRATE") return `${value.toFixed(1)}%`;
  if (id === "CPIAUCSL") return value.toFixed(1);
  if (Math.abs(value) >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toFixed(2);
}

function formatChange(id: string, change: number | null): string | null {
  if (change === null) return null;
  const sign = change >= 0 ? "+" : "";
  if (id === "UNRATE") return `${sign}${change.toFixed(1)}%p`;
  if (id === "CPIAUCSL") return `${sign}${change.toFixed(1)}`;
  if (Math.abs(change) >= 100) return `${sign}${change.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${sign}${change.toFixed(2)}`;
}

interface IndicatorRowProps {
  label: string;
  value: string | null;
  change: string | null;
}

function IndicatorRow({ label, value, change }: IndicatorRowProps) {
  const changeColor =
    change === null
      ? ""
      : change.startsWith("+")
        ? "text-red-400"
        : "text-cyan-400";

  return (
    <div className="flex items-center gap-1 py-[3px]">
      <span className="min-w-0 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="flex-1" />
      {change && (
        <span className={`text-[10px] font-medium ${changeColor}`}>{change}</span>
      )}
      <span className="min-w-[52px] text-right text-[11px] font-bold text-foreground">
        {value ?? "–"}
      </span>
    </div>
  );
}

export function EmploymentSection() {
  const { data: response, isLoading } = useEmployment();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Skeleton className="h-[22px] w-full" />
          <Skeleton className="h-[22px] w-full" />
          <Skeleton className="h-[22px] w-full" />
        </div>
      </div>
    );
  }

  const items = response?.data ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">데이터를 가져오는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {items.map((item) => (
        <IndicatorRow
          key={item.id}
          label={item.name}
          value={item.value !== null ? formatValue(item.id, item.value) : null}
          change={formatChange(item.id, item.change)}
        />
      ))}
    </div>
  );
}
