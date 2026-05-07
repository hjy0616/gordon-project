"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatUSD,
  type PortfolioRow,
} from "@/lib/finance-portfolio-schema";

interface Props {
  rows: PortfolioRow[];
  totalCapital: number;
  onTotalCapitalChange: (next: number) => void;
}

export function PortfolioSummary({
  rows,
  totalCapital,
  onTotalCapitalChange,
}: Props) {
  const blue = rows
    .filter((r) => r.team === "BLUE")
    .reduce((s, r) => s + r.amount, 0);
  const white = rows
    .filter((r) => r.team === "WHITE")
    .reduce((s, r) => s + r.amount, 0);
  const invested = blue + white;
  const remaining = totalCapital - invested;

  const bluePct = totalCapital > 0 ? (blue / totalCapital) * 100 : 0;
  const whitePct = totalCapital > 0 ? (white / totalCapital) * 100 : 0;
  const delta = totalCapital > 0 ? Math.abs(bluePct - 50) : 0;

  let badgeClass =
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (delta > 5)
    badgeClass = "bg-red-500/15 text-red-700 dark:text-red-400";
  else if (delta > 1)
    badgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:max-w-[320px] sm:flex-1">
          <label
            htmlFor="portfolio-total-capital"
            className="text-xs text-muted-foreground"
          >
            총 자본금 ($)
          </label>
          <Input
            id="portfolio-total-capital"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={totalCapital}
            onChange={(e) => {
              const n = Number(e.target.value);
              onTotalCapitalChange(
                Number.isFinite(n) && n >= 0
                  ? Math.round(n * 100) / 100
                  : 0,
              );
            }}
            className="text-xl font-semibold tabular-nums"
            placeholder="100000.00"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatUSD(totalCapital)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-blue-600 dark:text-blue-400 tabular-nums">
              청팀 {bluePct.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              백팀 {whitePct.toFixed(1)}%
            </span>
            {totalCapital > 0 ? (
              <Badge className={badgeClass}>Δ {delta.toFixed(1)}%</Badge>
            ) : (
              <Badge variant="outline">Δ —</Badge>
            )}
          </div>
          <p
            className={`text-xs tabular-nums ${
              remaining < 0
                ? "font-semibold text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {remaining < 0
              ? `자본금 초과: ${formatUSD(Math.abs(remaining))}`
              : `미투입: ${formatUSD(remaining)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
