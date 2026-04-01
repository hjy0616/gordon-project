"use client";

import { RotateCcw } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import type { KoreanDistrict, CustomDistrict } from "@/types/treasure-map";
import {
  HAAS_CRITERIA_CONFIG,
  computeHaaSTotal,
  getHaasTier,
  getEffectiveHaaS,
  HAAS_TIER_CONFIG,
} from "@/types/treasure-map";

interface HaaSAnalyzerProps {
  district: KoreanDistrict | CustomDistrict;
}

export function HaaSAnalyzer({ district }: HaaSAnalyzerProps) {
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);
  const updateHaaS = useTreasureMapStore((s) => s.updateDistrictHaaSScore);
  const resetEdits = useTreasureMapStore((s) => s.resetDistrictEdits);

  const edits = districtEdits[district.id]?.haasScores;
  const effective = getEffectiveHaaS(district.haasScores, edits);
  const total = computeHaaSTotal(effective);
  const tier = getHaasTier(total);
  const tierConfig = HAAS_TIER_CONFIG[tier];
  const hasEdits = !!edits && Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      {/* Header with reset */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground">
          플랫폼 편입 체크리스트
        </h4>
        {hasEdits && (
          <button
            onClick={() => resetEdits(district.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            기본값 복원
          </button>
        )}
      </div>

      {/* 7-point checklist with sliders */}
      <div className="space-y-4">
        {HAAS_CRITERIA_CONFIG.map((criterion) => {
          const score = effective[criterion.key];
          const percentage = (score / 20) * 100;

          return (
            <div key={criterion.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {criterion.label_ko}
                </span>
                <span className="font-medium tabular-nums">
                  {score}
                  <span className="text-muted-foreground">/20</span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={score}
                onChange={(e) =>
                  updateHaaS(district.id, criterion.key, Number(e.target.value))
                }
                className="w-full accent-[#A71C2E]"
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: tierConfig.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total score and tier badge */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Score</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <span
          className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
          style={{
            backgroundColor: `${tierConfig.color}20`,
            color: tierConfig.color,
          }}
        >
          {tierConfig.label}
        </span>
      </div>
    </div>
  );
}
