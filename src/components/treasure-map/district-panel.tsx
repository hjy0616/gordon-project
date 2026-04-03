"use client";

import { useState, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { resolveDistrict, isCustomDistrict } from "@/lib/treasure-map-utils";
import {
  CRITERIA_CONFIG,
  type MainTabType,
  type KoreanDistrict,
  type CustomDistrict,
} from "@/types/treasure-map";
import { Input } from "@/components/ui/input";
import { RightsDashboard } from "./rights-dashboard";
import { HaaSAnalyzer } from "./haas-analyzer";
import { ScenarioViewer } from "./scenario-viewer";
import { DistrictList } from "./district-list";
import { DistrictCreateForm } from "./district-create-form";
import { DistrictHeaderEdit } from "./district-header-edit";

const MAIN_TABS: { key: MainTabType; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "rights", label: "권리분석" },
  { key: "haas", label: "HaaS평가" },
  { key: "scenario", label: "시나리오" },
];

export function DistrictPanel() {
  const isMobile = useIsMobile();
  const selectedDistrict = useTreasureMapStore((s) => s.selectedDistrict);
  const activeMainTab = useTreasureMapStore((s) => s.activeMainTab);
  const setMainTab = useTreasureMapStore((s) => s.setMainTab);
  const districtNotes = useTreasureMapStore((s) => s.districtNotes);
  const updateDistrictNote = useTreasureMapStore((s) => s.updateDistrictNote);
  const panelMode = useTreasureMapStore((s) => s.panelMode);
  const customDistricts = useTreasureMapStore((s) => s.customDistricts);
  const districtOverrides = useTreasureMapStore((s) => s.districtOverrides);
  const updateCustomDistrict = useTreasureMapStore(
    (s) => s.updateCustomDistrict,
  );
  const updateMockOverride = useTreasureMapStore((s) => s.updateMockOverride);

  // Show create form
  if (panelMode === "create") {
    return <DistrictCreateForm />;
  }

  // Show list when no district selected
  if (!selectedDistrict || panelMode === "list") {
    return <DistrictList />;
  }

  const district = resolveDistrict(
    selectedDistrict,
    customDistricts,
    districtOverrides,
  );
  if (!district) return <DistrictList />;

  return (
    <div className="flex h-full flex-col">
      {/* Header with edit capabilities — key forces remount on district change */}
      <DistrictHeaderEdit key={district.id} district={district} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto hide-native-scrollbar">
        {/* Stage 1 Criteria Grid (editable) */}
        <CriteriaGrid
          key={district.id}
          district={district}
          onUpdate={(key, value) => {
            if (isCustomDistrict(district)) {
              updateCustomDistrict(district.id, {
                criteria: { ...district.criteria, [key]: value },
              });
            } else {
              updateMockOverride(district.id, {
                criteria: { [key]: value },
              });
            }
          }}
        />

        {/* Tab Bar */}
        <div className="flex flex-shrink-0 border-b border-border px-4">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors ${
                isMobile ? "min-h-[44px]" : ""
              } ${
                activeMainTab === tab.key
                  ? "rounded-t-md bg-[#A71C2E] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4">
          {activeMainTab === "overview" && (
            <textarea
              value={districtNotes[district.id] ?? ""}
              onChange={(e) =>
                updateDistrictNote(district.id, e.target.value)
              }
              placeholder="이 지역에 대한 메모를 남겨보세요..."
              className="min-h-[160px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}

          {activeMainTab === "rights" && (
            <RightsDashboard district={district} />
          )}

          {activeMainTab === "haas" && <HaaSAnalyzer district={district} />}

          {activeMainTab === "scenario" && (
            <ScenarioViewer district={district} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Editable Criteria Grid ──

interface CriteriaGridProps {
  district: KoreanDistrict | CustomDistrict;
  onUpdate: (key: string, value: number) => void;
}

function CriteriaGrid({ district, onUpdate }: CriteriaGridProps) {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Parent uses key={district.id} to remount and reset local state

  const handleChange = useCallback(
    (key: string, raw: string) => {
      setLocalValues((prev) => ({ ...prev, [key]: raw }));

      const existing = debounceRefs.current.get(key);
      if (existing) clearTimeout(existing);

      debounceRefs.current.set(
        key,
        setTimeout(() => {
          const num = Number(raw);
          if (!isNaN(num)) onUpdate(key, num);
        }, 300),
      );
    },
    [onUpdate],
  );

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="grid grid-cols-2 gap-2">
        {CRITERIA_CONFIG.map((c) => {
          const displayValue =
            localValues[c.key] ??
            String(district.criteria[c.key] ?? 0);

          return (
            <div key={c.key} className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <Input
                  type="number"
                  value={displayValue}
                  onChange={(e) => handleChange(c.key, e.target.value)}
                  className="h-6 w-full border-none bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
