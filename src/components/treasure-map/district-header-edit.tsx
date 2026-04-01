"use client";

import { useState, useRef, useCallback } from "react";
import { Trash2, RotateCcw, X } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { isCustomDistrict } from "@/lib/treasure-map-utils";
import {
  TIER_COLORS,
  TIER_LABELS,
  type SurvivalTier,
  type KoreanDistrict,
  type CustomDistrict,
} from "@/types/treasure-map";

const TIERS: SurvivalTier[] = ["HIGHEST", "HIGH", "MEDIUM", "MODERATE", "LOW"];

interface DistrictHeaderEditProps {
  district: KoreanDistrict | CustomDistrict;
}

export function DistrictHeaderEdit({ district }: DistrictHeaderEditProps) {
  const selectDistrict = useTreasureMapStore((s) => s.selectDistrict);
  const deleteDistrict = useTreasureMapStore((s) => s.deleteDistrict);
  const updateCustomDistrict = useTreasureMapStore(
    (s) => s.updateCustomDistrict,
  );
  const updateMockOverride = useTreasureMapStore((s) => s.updateMockOverride);
  const restoreMockDistrict = useTreasureMapStore(
    (s) => s.restoreMockDistrict,
  );
  const districtOverrides = useTreasureMapStore((s) => s.districtOverrides);
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);
  const resetEdits = useTreasureMapStore((s) => s.resetDistrictEdits);

  const custom = isCustomDistrict(district);
  const isMock = !custom;
  const hasOverrides = isMock && !!districtOverrides[district.id];
  const hasEdits =
    districtEdits[district.id] &&
    Object.keys(districtEdits[district.id]).length > 0;

  // Local state for debounced editing — parent should use key={district.id} to reset
  const [localTierReason, setLocalTierReason] = useState(district.tierReason);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleTierChange = useCallback(
    (tier: SurvivalTier) => {
      if (custom) {
        updateCustomDistrict(district.id, { tier });
      } else {
        updateMockOverride(district.id, { tier });
      }
    },
    [custom, district.id, updateCustomDistrict, updateMockOverride],
  );

  const handleTierReasonChange = useCallback(
    (value: string) => {
      setLocalTierReason(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (custom) {
          updateCustomDistrict(district.id, { tierReason: value });
        } else {
          updateMockOverride(district.id, { tierReason: value });
        }
      }, 300);
    },
    [custom, district.id, updateCustomDistrict, updateMockOverride],
  );

  const handleDelete = useCallback(() => {
    deleteDistrict(district.id);
  }, [deleteDistrict, district.id]);

  const handleRestore = useCallback(() => {
    restoreMockDistrict(district.id);
  }, [restoreMockDistrict, district.id]);

  return (
    <div className="relative flex-shrink-0 border-b border-border px-4 py-4">
      {/* Action buttons */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {hasEdits && (
          <button
            onClick={() => resetEdits(district.id)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="편집 초기화"
            title="편집 초기화"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {isMock && hasOverrides && (
          <button
            onClick={handleRestore}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="원본 복원"
            title="원본 복원"
          >
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="지역 삭제"
          title="지역 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => selectDistrict(null)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="패널 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* District name */}
      <h2 className="text-lg font-semibold leading-tight">
        {district.name_ko}
        {custom && (
          <span className="ml-2 align-middle text-[10px] font-normal text-muted-foreground">
            커스텀
          </span>
        )}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {district.name_en}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{district.region}</p>

      {/* Tier selector */}
      <div className="mt-3 flex flex-wrap gap-1">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => handleTierChange(t)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
              district.tier === t
                ? "border-foreground/30 bg-muted font-medium text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/20"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: TIER_COLORS[t] }}
            />
            {TIER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tier reason */}
      <textarea
        value={localTierReason}
        onChange={(e) => handleTierReasonChange(e.target.value)}
        placeholder="등급 사유..."
        className="mt-2 w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        rows={2}
      />
    </div>
  );
}
