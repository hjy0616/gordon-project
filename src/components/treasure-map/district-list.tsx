"use client";

import { Plus } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { getAllDistricts } from "@/lib/treasure-map-utils";
import {
  TIER_COLORS,
  TIER_LABELS,
  type SurvivalTier,
} from "@/types/treasure-map";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isCustomDistrict } from "@/lib/treasure-map-utils";

const TIER_ORDER: SurvivalTier[] = [
  "HIGHEST",
  "HIGH",
  "MEDIUM",
  "MODERATE",
  "LOW",
];

export function DistrictList() {
  const customDistricts = useTreasureMapStore((s) => s.customDistricts);
  const districtOverrides = useTreasureMapStore((s) => s.districtOverrides);
  const deletedMockIds = useTreasureMapStore((s) => s.deletedMockIds);
  const selectDistrict = useTreasureMapStore((s) => s.selectDistrict);
  const setPanelMode = useTreasureMapStore((s) => s.setPanelMode);

  const allDistricts = getAllDistricts(
    customDistricts,
    districtOverrides,
    deletedMockIds,
  );

  // Group by tier
  const grouped = new Map<SurvivalTier, typeof allDistricts>();
  for (const tier of TIER_ORDER) {
    grouped.set(tier, []);
  }
  for (const d of allDistricts) {
    const list = grouped.get(d.tier);
    if (list) list.push(d);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">지역 목록</h2>
        <button
          onClick={() => setPanelMode("create")}
          className="flex items-center gap-1 rounded-md bg-[#A71C2E] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8a1726]"
        >
          <Plus className="h-3.5 w-3.5" />
          지역 추가
        </button>
      </div>

      {/* Tier groups */}
      <div className="flex-1 overflow-y-auto hide-native-scrollbar">
        {TIER_ORDER.map((tier) => {
          const districts = grouped.get(tier);
          if (!districts || districts.length === 0) return null;

          return (
            <Collapsible key={tier} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier] }}
                />
                {TIER_LABELS[tier]}
                <span className="ml-auto text-[10px] tabular-nums">
                  {districts.length}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {districts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => selectDistrict(d.id)}
                    className="flex w-full items-center gap-2 border-b border-border/50 px-4 py-2 text-left transition-colors hover:bg-muted/30"
                  >
                    <span className="text-sm">{d.name_ko}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.region}
                    </span>
                    {isCustomDistrict(d) && (
                      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        커스텀
                      </span>
                    )}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
