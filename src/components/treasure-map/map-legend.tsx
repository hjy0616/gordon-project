"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { TIER_COLORS, TIER_LABELS, type SurvivalTier } from "@/types/treasure-map";

const TIERS: SurvivalTier[] = ["HIGHEST", "HIGH", "MEDIUM", "MODERATE", "LOW"];

interface MapLegendProps {
  isMobile: boolean;
}

export function MapLegend({ isMobile }: MapLegendProps) {
  const [open, setOpen] = useState(false);

  // Mobile: collapsible toggle
  if (isMobile) {
    return (
      <div className="relative">
        {open && (
          <div className="absolute bottom-12 left-0 rounded-lg border border-border bg-background/80 p-3 backdrop-blur-sm">
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
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/80 shadow-sm backdrop-blur-sm transition-colors active:bg-muted"
          aria-label={open ? "범례 닫기" : "범례 열기"}
        >
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Desktop: always visible
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
