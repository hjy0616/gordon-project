"use client";

import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import type {
  KoreanDistrict,
  CustomDistrict,
  RightsSubTabType,
} from "@/types/treasure-map";
import { UsageRightsTab } from "./usage-rights-tab";
import { RevenueRightsTab } from "./revenue-rights-tab";
import { DataRightsTab } from "./data-rights-tab";

const RIGHTS_TABS: { key: RightsSubTabType; label: string }[] = [
  { key: "usage", label: "사용권" },
  { key: "revenue", label: "수익권" },
  { key: "data", label: "데이터권" },
];

interface RightsDashboardProps {
  district: KoreanDistrict | CustomDistrict;
}

export function RightsDashboard({ district }: RightsDashboardProps) {
  const activeRightsSubTab = useTreasureMapStore((s) => s.activeRightsSubTab);
  const setRightsSubTab = useTreasureMapStore((s) => s.setRightsSubTab);

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-border">
        {RIGHTS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRightsSubTab(tab.key)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              activeRightsSubTab === tab.key
                ? "border-b-2 border-[#A71C2E] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeRightsSubTab === "usage" && (
        <UsageRightsTab
          rightsData={district.rightsData}
          districtId={district.id}
        />
      )}
      {activeRightsSubTab === "revenue" && (
        <RevenueRightsTab
          rightsData={district.rightsData}
          districtId={district.id}
          platformPotential={district.criteria.platformPotential}
        />
      )}
      {activeRightsSubTab === "data" && (
        <DataRightsTab
          radarScores={district.rightsData.radarScores}
          districtId={district.id}
        />
      )}
    </div>
  );
}
