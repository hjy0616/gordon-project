"use client";

import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { MOCK_COUNTRIES } from "@/data/mock-countries";
import { INDICATOR_CONFIG } from "@/types/macro-map";

export function MapLegend() {
  const activeIndicator = useMacroMapStore((s) => s.activeIndicator);
  const config = INDICATOR_CONFIG[activeIndicator];

  const values = MOCK_COUNTRIES.map((c) => c[activeIndicator]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="rounded-lg border border-border bg-background/80 px-3 py-2 backdrop-blur-sm">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {config.label}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {min.toFixed(1)}
          {config.unit}
        </span>
        <div
          className="h-2.5 w-32 rounded-full sm:w-40"
          style={{
            background: `linear-gradient(to right, ${config.colorRange[0]}, ${config.colorRange[1]})`,
          }}
        />
        <span className="text-xs tabular-nums text-muted-foreground">
          {max.toFixed(1)}
          {config.unit}
        </span>
      </div>
    </div>
  );
}
