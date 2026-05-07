"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatKRW,
  type PortfolioRow,
} from "@/lib/finance-portfolio-schema";

interface Props {
  rows: PortfolioRow[];
}

export function PortfolioSummary({ rows }: Props) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const blue = rows
    .filter((r) => r.team === "BLUE")
    .reduce((s, r) => s + r.amount, 0);
  const white = rows
    .filter((r) => r.team === "WHITE")
    .reduce((s, r) => s + r.amount, 0);
  const bluePct = total > 0 ? (blue / total) * 100 : 0;
  const whitePct = total > 0 ? (white / total) * 100 : 0;
  const delta = Math.abs(bluePct - 50);

  let badgeClass =
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (delta > 5)
    badgeClass = "bg-red-500/15 text-red-700 dark:text-red-400";
  else if (delta > 1)
    badgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">총 투입 금액</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatKRW(total)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-600 dark:text-blue-400 tabular-nums">
            청팀 {bluePct.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            백팀 {whitePct.toFixed(1)}%
          </span>
          <Badge className={badgeClass}>Δ {delta.toFixed(1)}%</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
