"use client";

import { TIER_COLORS, TIER_LABELS, type SurvivalTier } from "@/types/treasure-map";

const TIERS: SurvivalTier[] = ["HIGHEST", "HIGH", "MEDIUM", "MODERATE", "LOW"];

export function MapLegend() {
  return (
    <div className="rounded-lg border border-border bg-background/80 p-3 backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">생존 등급</p>
      <div className="flex flex-col gap-1.5">
        {TIERS.map((tier) => (
          <div key={tier} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: TIER_COLORS[tier] }}
            />
            <span className="text-xs text-foreground">{TIER_LABELS[tier]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
