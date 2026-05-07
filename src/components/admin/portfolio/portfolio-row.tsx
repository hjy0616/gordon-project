"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatUSD,
  type PortfolioRow as Row,
} from "@/lib/finance-portfolio-schema";

interface Props {
  row: Row;
  total: number;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}

export function PortfolioRow({ row, total, onChange, onRemove }: Props) {
  const ratio = total > 0 ? (row.amount / total) * 100 : 0;
  const nameInvalid = row.name.trim().length === 0;
  const memoOver = row.memo.length > 200;

  return (
    <div
      className={`rounded-md border p-3 space-y-2 ${
        nameInvalid ? "border-destructive" : "border-border"
      }`}
    >
      <Input
        placeholder="종목명"
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        aria-invalid={nameInvalid}
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={row.amount}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({
              amount:
                Number.isFinite(n) && n >= 0
                  ? Math.round(n * 100) / 100
                  : 0,
            });
          }}
          className="flex-1 tabular-nums"
        />
        <Badge variant="secondary" className="shrink-0">
          {ratio.toFixed(1)}%
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onRemove}
          aria-label="행 삭제"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="space-y-1">
        <Textarea
          rows={1}
          placeholder="메모 (선택)"
          value={row.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={memoOver ? "border-destructive" : ""}
        />
        <p
          className={`text-xs text-right ${
            memoOver ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {row.memo.length}/200
        </p>
      </div>
      {nameInvalid && (
        <p className="text-xs text-destructive">
          종목명을 입력해주세요.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        금액 {formatUSD(row.amount)}
      </p>
    </div>
  );
}
