"use client";

import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatUSD,
  type PortfolioRow as Row,
  type Team,
  teamLabel,
} from "@/lib/finance-portfolio-schema";
import { PortfolioRow } from "./portfolio-row";

interface Props {
  team: Team;
  rows: Row[];
  total: number;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Row>) => void;
  onRemove: (id: string) => void;
  disabledAdd?: boolean;
}

export function TeamColumn({
  team,
  rows,
  total,
  onAdd,
  onChange,
  onRemove,
  disabledAdd,
}: Props) {
  const teamRows = rows.filter((r) => r.team === team);
  const teamSum = teamRows.reduce((s, r) => s + r.amount, 0);
  const teamRatio = total > 0 ? (teamSum / total) * 100 : 0;

  const accentClass =
    team === "BLUE"
      ? "border-blue-500/40 bg-blue-500/5"
      : "border-muted-foreground/30 bg-muted/30";

  return (
    <Card className={`${accentClass} flex flex-col`}>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>{teamLabel(team)}</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {formatUSD(teamSum)} ({teamRatio.toFixed(1)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teamRows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            아직 종목이 없습니다.
          </p>
        )}
        {teamRows.map((row) => (
          <PortfolioRow
            key={row.id}
            row={row}
            total={total}
            onChange={(patch) => onChange(row.id, patch)}
            onRemove={() => onRemove(row.id)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onAdd}
          disabled={disabledAdd}
        >
          <Plus className="mr-2 size-4" />
          {teamLabel(team)} 추가
        </Button>
      </CardContent>
    </Card>
  );
}
